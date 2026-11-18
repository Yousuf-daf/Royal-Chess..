import { Chess } from 'chess.js';
import type { Difficulty } from '../types/chess';

export interface EngineEvaluation {
  /** Centipawns from White's perspective (+ favors White, - favors Black) */
  cp: number;
  /** Mate in N moves from White's perspective (+ White mates, - Black mates), or null */
  mate: number | null;
}

export interface EngineMoveResult {
  uciMove: string;
  evaluation: EngineEvaluation;
  engineSource: 'stockfish' | 'fallback';
}

const DIFFICULTY_PARAMS: Record<Difficulty, { skill: number; depth: number; movetime: number }> = {
  easy: { skill: 2, depth: 4, movetime: 280 },
  medium: { skill: 10, depth: 9, movetime: 550 },
  hard: { skill: 20, depth: 15, movetime: 1100 },
};

// Piece values for emergency alpha-beta fallback if WASM fails in restricted environments
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

function evaluateBoardSimple(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw()) return 0;

  let score = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const val = PIECE_VALUES[piece.type] || 0;
      const centerBonus =
        (r >= 2 && r <= 5 && c >= 2 && c <= 5 ? 12 : 0) +
        (r >= 3 && r <= 4 && c >= 3 && c <= 4 ? 14 : 0);
      const total = val + (piece.type !== 'k' ? centerBonus : 0);
      score += piece.color === 'w' ? total : -total;
    }
  }
  return score;
}

function fallbackBestMove(fen: string, difficulty: Difficulty): EngineMoveResult {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    throw new Error('No legal moves available');
  }

  const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  const maximizing = chess.turn() === 'w';

  function minimax(d: number, alpha: number, beta: number, isMax: boolean): number {
    if (d === 0 || chess.isGameOver()) {
      return evaluateBoardSimple(chess);
    }
    const legal = chess.moves({ verbose: true });
    // Order captures first for better pruning
    legal.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

    if (isMax) {
      let maxEval = -Infinity;
      for (const m of legal) {
        chess.move(m);
        const ev = minimax(d - 1, alpha, beta, false);
        chess.undo();
        if (ev > maxEval) maxEval = ev;
        if (ev > alpha) alpha = ev;
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of legal) {
        chess.move(m);
        const ev = minimax(d - 1, alpha, beta, true);
        chess.undo();
        if (ev < minEval) minEval = ev;
        if (ev < beta) beta = ev;
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Easy mode mixes top 3 moves slightly so beginners can win
  const scored: { uci: string; score: number }[] = [];
  for (const m of moves) {
    chess.move(m);
    const sc = minimax(depth - 1, -Infinity, Infinity, !maximizing);
    chess.undo();
    scored.push({
      uci: `${m.from}${m.to}${m.promotion ?? ''}`,
      score: sc,
    });
  }

  scored.sort((a, b) => (maximizing ? b.score - a.score : a.score - b.score));
  const pickIndex =
    difficulty === 'easy' && scored.length > 2
      ? Math.floor(Math.random() * Math.min(3, scored.length))
      : 0;
  const chosen = scored[pickIndex];

  return {
    uciMove: chosen.uci,
    evaluation: { cp: chosen.score, mate: null },
    engineSource: 'fallback',
  };
}

class StockfishManager {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private isFailed = false;
  private activeSearchReject: ((reason?: unknown) => void) | null = null;

  private ensureWorker(): Promise<void> {
    if (this.isFailed) {
      return Promise.reject(new Error('Stockfish unavailable'));
    }
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      try {
        const worker = new Worker('/stockfish/stockfish-19-lite-single.js');
        this.worker = worker;

        let uciOk = false;
        const timeout = window.setTimeout(() => {
          this.isFailed = true;
          reject(new Error('Stockfish initialization timed out'));
        }, 6000);

        const onInitMessage = (event: MessageEvent<string>) => {
          const line = typeof event.data === 'string' ? event.data : String(event.data);
          if (line.includes('uciok') && !uciOk) {
            uciOk = true;
            worker.postMessage('isready');
          } else if (line.includes('readyok')) {
            window.clearTimeout(timeout);
            worker.removeEventListener('message', onInitMessage);
            resolve();
          }
        };

        worker.addEventListener('message', onInitMessage);
        worker.addEventListener('error', (err) => {
          window.clearTimeout(timeout);
          this.isFailed = true;
          reject(err);
        });

        worker.postMessage('uci');
      } catch (err) {
        this.isFailed = true;
        reject(err);
      }
    });

    return this.readyPromise;
  }

  public stopSearch(): void {
    if (this.worker) {
      try {
        this.worker.postMessage('stop');
      } catch {
        // ignore
      }
    }
    if (this.activeSearchReject) {
      this.activeSearchReject(new Error('Search cancelled'));
      this.activeSearchReject = null;
    }
  }

  public async findBestMove(
    fen: string,
    difficulty: Difficulty,
    signal?: AbortSignal
  ): Promise<EngineMoveResult> {
    if (signal?.aborted) {
      throw new Error('Search aborted');
    }

    const params = DIFFICULTY_PARAMS[difficulty];
    const turn = new Chess(fen).turn();

    try {
      await this.ensureWorker();
      const worker = this.worker;
      if (!worker || this.isFailed) {
        return fallbackBestMove(fen, difficulty);
      }

      return await new Promise<EngineMoveResult>((resolve, reject) => {
        if (signal?.aborted) {
          reject(new Error('Search aborted'));
          return;
        }

        let latestEval: EngineEvaluation = { cp: 0, mate: null };
        let settled = false;

        const cleanup = () => {
          worker.removeEventListener('message', onMessage);
          if (this.activeSearchReject === abortHandler) {
            this.activeSearchReject = null;
          }
          signal?.removeEventListener('abort', onSignalAbort);
          window.clearTimeout(safetyTimer);
        };

        const abortHandler = (err?: unknown) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(err ?? new Error('Search cancelled'));
        };

        const onSignalAbort = () => {
          try {
            worker.postMessage('stop');
          } catch {
            // ignore
          }
          abortHandler(new Error('Search aborted'));
        };

        this.activeSearchReject = abortHandler;
        signal?.addEventListener('abort', onSignalAbort);

        const safetyTimer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          try {
            worker.postMessage('stop');
          } catch {
            // ignore
          }
          resolve(fallbackBestMove(fen, difficulty));
        }, params.movetime + 3500);

        const onMessage = (event: MessageEvent<string>) => {
          const line = typeof event.data === 'string' ? event.data : String(event.data);

          if (line.startsWith('info ')) {
            const cpMatch = line.match(/\bscore cp (-?\d+)/);
            const mateMatch = line.match(/\bscore mate (-?\d+)/);
            if (cpMatch) {
              const rawCp = parseInt(cpMatch[1], 10);
              latestEval = { cp: turn === 'w' ? rawCp : -rawCp, mate: null };
            } else if (mateMatch) {
              const rawMate = parseInt(mateMatch[1], 10);
              latestEval = { cp: rawMate > 0 ? 10000 : -10000, mate: turn === 'w' ? rawMate : -rawMate };
            }
          }

          if (line.startsWith('bestmove ')) {
            const parts = line.trim().split(/\s+/);
            const best = parts[1];
            if (settled) return;
            settled = true;
            cleanup();
            if (!best || best === '(none)') {
              resolve(fallbackBestMove(fen, difficulty));
            } else {
              resolve({
                uciMove: best,
                evaluation: latestEval,
                engineSource: 'stockfish',
              });
            }
          }
        };

        worker.addEventListener('message', onMessage);
        worker.postMessage(`setoption name Skill Level value ${params.skill}`);
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${params.depth} movetime ${params.movetime}`);
      });
    } catch (err) {
      if (signal?.aborted || (err instanceof Error && (err.message.includes('aborted') || err.message.includes('cancelled')))) {
        throw err;
      }
      return fallbackBestMove(fen, difficulty);
    }
  }

  public async evaluatePosition(fen: string): Promise<EngineEvaluation> {
    const turn = new Chess(fen).turn();
    try {
      await this.ensureWorker();
      const worker = this.worker;
      if (!worker || this.isFailed) {
        return { cp: evaluateBoardSimple(new Chess(fen)), mate: null };
      }

      return await new Promise<EngineEvaluation>((resolve) => {
        let latestEval: EngineEvaluation = { cp: 0, mate: null };
        let settled = false;

        const timer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          worker.removeEventListener('message', onMessage);
          resolve(latestEval);
        }, 1200);

        const onMessage = (event: MessageEvent<string>) => {
          const line = typeof event.data === 'string' ? event.data : String(event.data);
          if (line.startsWith('info ')) {
            const cpMatch = line.match(/\bscore cp (-?\d+)/);
            const mateMatch = line.match(/\bscore mate (-?\d+)/);
            if (cpMatch) {
              const rawCp = parseInt(cpMatch[1], 10);
              latestEval = { cp: turn === 'w' ? rawCp : -rawCp, mate: null };
            } else if (mateMatch) {
              const rawMate = parseInt(mateMatch[1], 10);
              latestEval = { cp: rawMate > 0 ? 10000 : -10000, mate: turn === 'w' ? rawMate : -rawMate };
            }
          } else if (line.startsWith('bestmove ')) {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            worker.removeEventListener('message', onMessage);
            resolve(latestEval);
          }
        };

        worker.addEventListener('message', onMessage);
        worker.postMessage('setoption name Skill Level value 20');
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage('go depth 10 movetime 350');
      });
    } catch {
      return { cp: evaluateBoardSimple(new Chess(fen)), mate: null };
    }
  }
}

export const stockfishEngine = new StockfishManager();
