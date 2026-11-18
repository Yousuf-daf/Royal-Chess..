import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Flag,
  Handshake,
  RotateCcw,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Undo2,
  Volume2,
  VolumeX,
  ArrowUpDown,
} from 'lucide-react';
import type {
  Difficulty,
  GameMode,
  GameResult,
  GameSettings,
  MatchConfig,
  MoveRecord,
  PageRoute,
  PlayerColorChoice,
  TimeControlMinutes,
} from '../types/chess';
import { ASSETS, BOARD_THEMES, DIFFICULTIES, TIME_CONTROLS } from '../utils/settings';
import { soundEngine } from '../utils/sound';
import { stockfishEngine, type EngineEvaluation } from '../utils/stockfishEngine';
import { ChessBoard } from '../components/ChessBoard';
import { ChessPiece, type PieceColor, type PieceType } from '../components/ChessPiece';

interface PlayPageProps {
  settings: GameSettings;
  initialMatchConfig: MatchConfig;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onNavigate: (page: PageRoute) => void;
}

const PIECE_ORDER: Record<PieceType, number> = { q: 5, r: 4, b: 3, n: 2, p: 1, k: 0 };
const PIECE_POINTS: Record<PieceType, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 };

function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 20_000) {
    const secs = Math.floor(clamped / 1000);
    const tenths = Math.floor((clamped % 1000) / 100);
    return `00:${String(secs).padStart(2, '0')}.${tenths}`;
  }
  const totalSeconds = Math.ceil(clamped / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function resolveHumanColor(choice: PlayerColorChoice): 'w' | 'b' {
  if (choice === 'random') {
    return Math.random() < 0.5 ? 'w' : 'b';
  }
  return choice;
}

function hasSufficientMatingMaterial(chess: Chess, color: 'w' | 'b'): boolean {
  const board = chess.board();
  const pieces: PieceType[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color && p.type !== 'k') {
        pieces.push(p.type);
      }
    }
  }
  if (pieces.length === 0) return false;
  if (pieces.some((t) => t === 'p' || t === 'r' || t === 'q')) return true;
  if (pieces.length === 1 && (pieces[0] === 'b' || pieces[0] === 'n')) return false;
  return true;
}

export const PlayPage: React.FC<PlayPageProps> = ({
  settings,
  initialMatchConfig,
  onUpdateSettings,
  onNavigate,
}) => {
  const chessRef = useRef<Chess>(new Chess());
  const aiAbortRef = useRef<AbortController | null>(null);
  const moveListRef = useRef<HTMLDivElement>(null);

  // Active match configuration
  const [matchConfig, setMatchConfig] = useState<MatchConfig>(initialMatchConfig);
  const [draftConfig, setDraftConfig] = useState<MatchConfig>(initialMatchConfig);
  const [showSetupDrawer, setShowSetupDrawer] = useState(false);

  const [humanColor, setHumanColor] = useState<'w' | 'b'>(() =>
    resolveHumanColor(initialMatchConfig.playerColor)
  );
  const [flipped, setFlipped] = useState<boolean>(false);

  // Live board state
  const [fen, setFen] = useState<string>(() => chessRef.current.fen());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [viewPly, setViewPly] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResultOverlay, setShowResultOverlay] = useState<boolean>(false);

  // Interactive prompts
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    color: 'w' | 'b';
  } | null>(null);
  const [confirmResign, setConfirmResign] = useState<boolean>(false);
  const [localDrawOfferBy, setLocalDrawOfferBy] = useState<'w' | 'b' | null>(null);
  const [aiDrawStatus, setAiDrawStatus] = useState<'idle' | 'evaluating' | 'declined'>('idle');
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EngineEvaluation>({ cp: 0, mate: null });

  // Chess clocks
  const initialMs = matchConfig.timeControl * 60 * 1000;
  const [whiteTimeMs, setWhiteTimeMs] = useState<number>(initialMs);
  const [blackTimeMs, setBlackTimeMs] = useState<number>(initialMs);
  const lastTickTimeRef = useRef<number>(Date.now());
  const lastLowSecondWarnRef = useRef<{ w: number; b: number }>({ w: 99, b: 99 });

  const boardTheme = BOARD_THEMES[settings.boardTheme];

  // Keep sound engine synced with settings
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Apply external initialMatchConfig changes (e.g. launching from Home page)
  const startNewGame = useCallback(
    (nextConfig: MatchConfig) => {
      aiAbortRef.current?.abort();
      const resolvedColor = resolveHumanColor(nextConfig.playerColor);
      chessRef.current = new Chess();

      setMatchConfig(nextConfig);
      setDraftConfig(nextConfig);
      setHumanColor(resolvedColor);
      setFlipped(nextConfig.mode === 'ai' ? resolvedColor === 'b' : false);

      setFen(chessRef.current.fen());
      setMoves([]);
      setViewPly(null);
      setGameResult(null);
      setShowResultOverlay(false);
      setPendingPromotion(null);
      setConfirmResign(false);
      setLocalDrawOfferBy(null);
      setAiDrawStatus('idle');
      setAiThinking(false);
      setEvaluation({ cp: 0, mate: null });

      const ms = nextConfig.timeControl * 60 * 1000;
      setWhiteTimeMs(ms);
      setBlackTimeMs(ms);
      lastTickTimeRef.current = Date.now();
      lastLowSecondWarnRef.current = { w: 99, b: 99 };
      setShowSetupDrawer(false);
    },
    []
  );

  // Sync if initialMatchConfig prop updates from HomePage CTA
  const initialConfigSignature = `${initialMatchConfig.mode}-${initialMatchConfig.difficulty}-${initialMatchConfig.playerColor}-${initialMatchConfig.timeControl}`;
  const prevSigRef = useRef(initialConfigSignature);
  useEffect(() => {
    if (prevSigRef.current !== initialConfigSignature) {
      prevSigRef.current = initialConfigSignature;
      startNewGame(initialMatchConfig);
    }
  }, [initialConfigSignature, initialMatchConfig, startNewGame]);

  // Evaluate end-of-game conditions from chess.js
  const evaluateGameEnd = useCallback((chess: Chess): GameResult | null => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'b' : 'w';
      return {
        winner,
        reason: 'checkmate',
        title: `${winner === 'w' ? 'White' : 'Black'} Wins by Checkmate`,
        subtitle: 'The enemy king has no legal escape.',
      };
    }
    if (chess.isStalemate()) {
      return {
        winner: 'draw',
        reason: 'stalemate',
        title: 'Draw by Stalemate',
        subtitle: `${chess.turn() === 'w' ? 'White' : 'Black'} has no legal moves and is not in check.`,
      };
    }
    if (chess.isThreefoldRepetition()) {
      return {
        winner: 'draw',
        reason: 'repetition',
        title: 'Draw by Repetition',
        subtitle: 'The identical position occurred three times.',
      };
    }
    if (chess.isDrawByFiftyMoves()) {
      return {
        winner: 'draw',
        reason: 'fifty-move',
        title: 'Draw by Fifty-Move Rule',
        subtitle: '50 consecutive moves without a pawn move or capture.',
      };
    }
    if (chess.isInsufficientMaterial()) {
      return {
        winner: 'draw',
        reason: 'insufficient-material',
        title: 'Draw by Insufficient Material',
        subtitle: 'Neither side holds enough material to force checkmate.',
      };
    }
    return null;
  }, []);

  // Execute a validated move on chessRef
  const commitMove = useCallback(
    (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n'): boolean => {
      const chess = chessRef.current;
      if (gameResult) return false;

      let resultMove;
      try {
        resultMove = chess.move({ from, to, promotion });
      } catch {
        return false;
      }
      if (!resultMove) return false;

      const ply = chess.history().length;
      const moveNumber = Math.ceil(ply / 2);
      const record: MoveRecord = {
        ply,
        moveNumber,
        color: resultMove.color,
        san: resultMove.san,
        from: resultMove.from,
        to: resultMove.to,
        fen: chess.fen(),
        captured: resultMove.captured,
        promotion: resultMove.promotion,
        flags: resultMove.flags,
      };

      setMoves((prev) => [...prev, record]);
      setFen(chess.fen());
      setViewPly(null);
      setLocalDrawOfferBy(null);
      setConfirmResign(false);
      lastTickTimeRef.current = Date.now();

      // Auto-flip in local multiplayer if enabled
      if (matchConfig.mode === 'local' && settings.autoFlipLocal) {
        setFlipped(chess.turn() === 'b');
      }

      const endState = evaluateGameEnd(chess);
      if (endState) {
        setGameResult(endState);
        setShowResultOverlay(true);
        const userWon =
          matchConfig.mode === 'ai'
            ? endState.winner === humanColor
            : endState.winner !== 'draw';
        soundEngine.playGameOver(userWon);
      } else if (chess.inCheck()) {
        soundEngine.playCheck();
      } else if (resultMove.promotion) {
        soundEngine.playPromote();
      } else if (resultMove.flags.includes('k') || resultMove.flags.includes('q')) {
        soundEngine.playCastle();
      } else if (resultMove.captured) {
        soundEngine.playCapture();
      } else {
        soundEngine.playMove();
      }

      // Optional live evaluation in local mode or after player's move
      if (settings.showEvaluation && !endState && matchConfig.mode === 'local') {
        stockfishEngine.evaluatePosition(chess.fen()).then((ev) => {
          setEvaluation(ev);
        });
      }

      return true;
    },
    [
      evaluateGameEnd,
      gameResult,
      humanColor,
      matchConfig.mode,
      settings.autoFlipLocal,
      settings.showEvaluation,
    ]
  );

  // Triggered when user drops or clicks a target square on ChessBoard
  const handleAttemptMove = useCallback(
    (from: Square, to: Square) => {
      const chess = chessRef.current;
      if (gameResult || aiThinking) return;
      if (viewPly !== null && viewPly < moves.length) return;
      if (matchConfig.mode === 'ai' && chess.turn() !== humanColor) return;

      const legalMoves = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to);
      if (legalMoves.length === 0) return;

      const needsPromotion = legalMoves.some((m) => Boolean(m.promotion));
      if (needsPromotion) {
        setPendingPromotion({ from, to, color: chess.turn() });
        return;
      }

      commitMove(from, to);
    },
    [aiThinking, commitMove, gameResult, humanColor, matchConfig.mode, moves.length, viewPly]
  );

  // Computer opponent turn effect
  useEffect(() => {
    const chess = chessRef.current;
    if (matchConfig.mode !== 'ai' || gameResult) return;
    if (chess.turn() === humanColor) return;

    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAiThinking(true);

    const startTime = Date.now();
    const currentFen = chess.fen();

    stockfishEngine
      .findBestMove(currentFen, matchConfig.difficulty, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;

        // Ensure a subtle minimum 380ms pause so human perceives their own move cleanly
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 380 - elapsed);

        window.setTimeout(() => {
          if (controller.signal.aborted) return;
          setEvaluation(res.evaluation);
          const from = res.uciMove.slice(0, 2) as Square;
          const to = res.uciMove.slice(2, 4) as Square;
          const promo = res.uciMove.length >= 5 ? (res.uciMove[4] as 'q' | 'r' | 'b' | 'n') : undefined;
          setAiThinking(false);
          commitMove(from, to, promo);
        }, remainingDelay);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAiThinking(false);
        }
      });

    return () => {
      controller.abort();
      stockfishEngine.stopSearch();
    };
  }, [fen, gameResult, humanColor, matchConfig.difficulty, matchConfig.mode, commitMove]);

  // Chess clock interval
  useEffect(() => {
    if (matchConfig.timeControl === 0 || gameResult) return;

    lastTickTimeRef.current = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      const activeTurn = chessRef.current.turn();

      if (activeTurn === 'w') {
        setWhiteTimeMs((prev) => {
          const next = Math.max(0, prev - delta);
          const sec = Math.ceil(next / 1000);
          if (sec <= 10 && sec > 0 && sec < lastLowSecondWarnRef.current.w) {
            lastLowSecondWarnRef.current.w = sec;
            soundEngine.playLowTimeTick();
          }
          if (next === 0) {
            const opponentCanMate = hasSufficientMatingMaterial(chessRef.current, 'b');
            setGameResult(
              opponentCanMate
                ? {
                    winner: 'b',
                    reason: 'timeout',
                    title: 'Black Wins on Time',
                    subtitle: 'White’s clock expired.',
                  }
                : {
                    winner: 'draw',
                    reason: 'timeout-insufficient',
                    title: 'Draw — Timeout vs Insufficient Material',
                    subtitle: 'White flagged, but Black lacks mating material.',
                  }
            );
            setShowResultOverlay(true);
            soundEngine.playGameOver(false);
          }
          return next;
        });
      } else {
        setBlackTimeMs((prev) => {
          const next = Math.max(0, prev - delta);
          const sec = Math.ceil(next / 1000);
          if (sec <= 10 && sec > 0 && sec < lastLowSecondWarnRef.current.b) {
            lastLowSecondWarnRef.current.b = sec;
            soundEngine.playLowTimeTick();
          }
          if (next === 0) {
            const opponentCanMate = hasSufficientMatingMaterial(chessRef.current, 'w');
            setGameResult(
              opponentCanMate
                ? {
                    winner: 'w',
                    reason: 'timeout',
                    title: 'White Wins on Time',
                    subtitle: 'Black’s clock expired.',
                  }
                : {
                    winner: 'draw',
                    reason: 'timeout-insufficient',
                    title: 'Draw — Timeout vs Insufficient Material',
                    subtitle: 'Black flagged, but White lacks mating material.',
                  }
            );
            setShowResultOverlay(true);
            soundEngine.playGameOver(true);
          }
          return next;
        });
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [matchConfig.timeControl, gameResult]);

  // Auto-scroll move history to bottom on new move
  useEffect(() => {
    if (moveListRef.current && viewPly === null) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moves.length, viewPly]);

  // Undo handler
  const handleUndo = () => {
    if (gameResult || moves.length === 0) return;

    if (matchConfig.mode === 'ai') {
      aiAbortRef.current?.abort();
      stockfishEngine.stopSearch();
      setAiThinking(false);

      const chess = chessRef.current;
      // If it's currently player's turn, undo 2 plies (AI move + player move).
      // If it's AI's turn (player just moved), undo 1 ply back to player's turn.
      const pliesToUndo = chess.turn() === humanColor ? (moves.length >= 2 ? 2 : 0) : 1;
      if (pliesToUndo === 0) return;

      for (let i = 0; i < pliesToUndo; i++) {
        chess.undo();
      }
      setMoves((prev) => prev.slice(0, prev.length - pliesToUndo));
      setFen(chess.fen());
      setViewPly(null);
      lastTickTimeRef.current = Date.now();
    } else {
      const chess = chessRef.current;
      chess.undo();
      setMoves((prev) => prev.slice(0, -1));
      setFen(chess.fen());
      setViewPly(null);
      setLocalDrawOfferBy(null);
      lastTickTimeRef.current = Date.now();
      if (settings.autoFlipLocal) {
        setFlipped(chess.turn() === 'b');
      }
    }
  };

  // Resign handler
  const handleConfirmResign = () => {
    if (gameResult) return;
    aiAbortRef.current?.abort();
    stockfishEngine.stopSearch();
    setAiThinking(false);

    const loser = matchConfig.mode === 'ai' ? humanColor : chessRef.current.turn();
    const winner = loser === 'w' ? 'b' : 'w';

    setGameResult({
      winner,
      reason: 'resignation',
      title: `${winner === 'w' ? 'White' : 'Black'} Wins by Resignation`,
      subtitle: `${loser === 'w' ? 'White' : 'Black'} resigned the match.`,
    });
    setShowResultOverlay(true);
    setConfirmResign(false);
    soundEngine.playGameOver(false);
  };

  // Offer draw handler
  const handleOfferDraw = async () => {
    if (gameResult) return;
    const currentTurn = chessRef.current.turn();

    if (matchConfig.mode === 'local') {
      setLocalDrawOfferBy(currentTurn);
      return;
    }

    if (aiDrawStatus === 'evaluating') return;
    setAiDrawStatus('evaluating');

    const ev = await stockfishEngine.evaluatePosition(chessRef.current.fen());
    const aiColor = humanColor === 'w' ? 'b' : 'w';
    const aiAdvantageCp = aiColor === 'w' ? ev.cp : -ev.cp;

    // AI accepts draw if at least 10 plies played and AI is not significantly ahead (<= +35cp)
    if (moves.length >= 10 && aiAdvantageCp <= 35 && (ev.mate === null || (aiColor === 'w' ? ev.mate < 0 : ev.mate > 0))) {
      setAiDrawStatus('idle');
      setGameResult({
        winner: 'draw',
        reason: 'draw-agreement',
        title: 'Draw by Mutual Agreement',
        subtitle: 'Stockfish evaluated the position as balanced and accepted your draw.',
      });
      setShowResultOverlay(true);
      soundEngine.playGameOver(true);
    } else {
      setAiDrawStatus('declined');
      window.setTimeout(() => setAiDrawStatus('idle'), 3500);
    }
  };

  // Displayed board state (either live or inspected historical move)
  const activePly = viewPly !== null ? viewPly : moves.length;
  const displayedFen = activePly === 0 ? new Chess().fen() : moves[activePly - 1]?.fen ?? fen;
  const displayedLastMove =
    activePly > 0
      ? { from: moves[activePly - 1].from, to: moves[activePly - 1].to }
      : null;

  const isViewingHistory = viewPly !== null && viewPly < moves.length;
  const liveTurn = chessRef.current.turn();
  const isInCheck = !isViewingHistory && chessRef.current.inCheck();

  // Captured pieces & material score computed from displayed position
  const { capturedByWhite, capturedByBlack, materialDiff } = useMemo(() => {
    const slice = moves.slice(0, activePly);
    const byW: PieceType[] = [];
    const byB: PieceType[] = [];
    for (const m of slice) {
      if (m.captured) {
        const pt = m.captured as PieceType;
        if (m.color === 'w') byW.push(pt);
        else byB.push(pt);
      }
    }
    byW.sort((a, b) => PIECE_ORDER[b] - PIECE_ORDER[a]);
    byB.sort((a, b) => PIECE_ORDER[b] - PIECE_ORDER[a]);

    const board = new Chess(displayedFen).board();
    let wPts = 0;
    let bPts = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        if (p.color === 'w') wPts += PIECE_POINTS[p.type];
        else bPts += PIECE_POINTS[p.type];
      }
    }
    return {
      capturedByWhite: byW,
      capturedByBlack: byB,
      materialDiff: wPts - bPts,
    };
  }, [moves, activePly, displayedFen]);

  // Pair moves into rows for 2-column algebraic display
  const moveRows = useMemo(() => {
    const rows: { moveNumber: number; white?: MoveRecord; black?: MoveRecord }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      rows.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moves[i],
        black: moves[i + 1],
      });
    }
    return rows;
  }, [moves]);

  // Evaluation bar percentage (White's share 5%..95%)
  const evalWhitePercent = useMemo(() => {
    if (evaluation.mate !== null) {
      return evaluation.mate > 0 ? 96 : 4;
    }
    // Smooth sigmoid-like mapping of centipawns (-800..+800)
    const clamped = Math.max(-900, Math.min(900, evaluation.cp));
    const pct = 50 + (clamped / 900) * 45;
    return Math.max(5, Math.min(95, pct));
  }, [evaluation]);

  const evalLabel = useMemo(() => {
    if (evaluation.mate !== null) {
      return `M${Math.abs(evaluation.mate)}`;
    }
    const pawns = (evaluation.cp / 100).toFixed(1);
    return evaluation.cp > 0 ? `+${pawns}` : pawns;
  }, [evaluation]);

  // Player metadata for top & bottom bars
  const aiDiffLabel = DIFFICULTIES.find((d) => d.value === matchConfig.difficulty)?.label ?? 'Medium';
  const whiteName =
    matchConfig.mode === 'ai' && humanColor === 'b'
      ? `Stockfish 19 (${aiDiffLabel})`
      : settings.whitePlayerName || 'White';
  const blackName =
    matchConfig.mode === 'ai' && humanColor === 'w'
      ? `Stockfish 19 (${aiDiffLabel})`
      : matchConfig.mode === 'ai'
      ? settings.whitePlayerName || 'Player 1'
      : settings.blackPlayerName || 'Black';

  const whiteAvatar =
    matchConfig.mode === 'ai' && humanColor === 'b' ? ASSETS.avatarAi : ASSETS.avatarWhite;
  const blackAvatar =
    matchConfig.mode === 'ai' && humanColor === 'w' ? ASSETS.avatarAi : ASSETS.avatarBlack;

  const topColor: PieceColor = flipped ? 'w' : 'b';
  const bottomColor: PieceColor = flipped ? 'b' : 'w';

  const renderPlayerBar = (side: PieceColor) => {
    const isWhiteSide = side === 'w';
    const name = isWhiteSide ? whiteName : blackName;
    const avatar = isWhiteSide ? whiteAvatar : blackAvatar;
    const captured = isWhiteSide ? capturedByWhite : capturedByBlack;
    const capturedPieceColor: PieceColor = isWhiteSide ? 'b' : 'w';
    const advantage = isWhiteSide
      ? materialDiff > 0
        ? materialDiff
        : 0
      : materialDiff < 0
      ? Math.abs(materialDiff)
      : 0;
    const timeMs = isWhiteSide ? whiteTimeMs : blackTimeMs;
    const isTurn = !gameResult && liveTurn === side;
    const isLowTime = matchConfig.timeControl > 0 && timeMs < 20_000;

    return (
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border transition-colors ${
          isTurn
            ? 'bg-[#181A21] border-[#D4AF37]/60'
            : 'bg-[#121318] border-white/10'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-md overflow-hidden border border-white/15 bg-[#0B0B0E] shrink-0">
            <img
              src={avatar}
              alt={`${name} emblem`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-[#F2EFE9] truncate">
                {name}
              </span>
              <span className="text-xs text-[#8B867E] shrink-0">
                {isWhiteSide ? 'White' : 'Black'}
              </span>
              {isTurn && (
                <span className="text-xs font-medium text-[#E8C967] shrink-0">
                  {aiThinking && matchConfig.mode === 'ai' && side !== humanColor
                    ? '· Thinking'
                    : isInCheck
                    ? '· Check'
                    : '· Turn'}
                </span>
              )}
            </div>

            {/* Captured pieces + material advantage */}
            <div className="flex items-center gap-1 min-h-[20px] mt-0.5">
              {captured.map((pt, idx) => (
                <div key={`${pt}-${idx}`} className="w-4 h-4 shrink-0">
                  <ChessPiece type={pt} color={capturedPieceColor} />
                </div>
              ))}
              {advantage > 0 && (
                <span className="text-xs font-mono tabular-nums text-[#D4AF37] ml-1">
                  +{advantage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chess Clock */}
        {matchConfig.timeControl > 0 ? (
          <div
            className={`px-3.5 py-1.5 rounded-md font-mono tabular-nums text-lg sm:text-xl font-semibold border shrink-0 transition-colors ${
              isTurn
                ? isLowTime
                  ? 'bg-red-950/60 border-red-500/60 text-red-200'
                  : 'bg-[#0B0B0E] border-[#D4AF37]/60 text-[#E8C967]'
                : 'bg-[#0B0B0E]/70 border-white/10 text-[#8B867E]'
            }`}
          >
            {formatClock(timeMs)}
          </div>
        ) : (
          <div className="px-3 py-1 rounded-md font-mono text-xs text-[#8B867E] border border-white/10 bg-[#0B0B0E]/50 shrink-0">
            Untimed
          </div>
        )}
      </div>
    );
  };

  const canUndo =
    !gameResult &&
    (matchConfig.mode === 'local'
      ? moves.length >= 1
      : chessRef.current.turn() === humanColor
      ? moves.length >= 2
      : moves.length >= 1);

  return (
    <div className="bg-[#0B0B0E] text-[#F2EFE9] min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Match Configuration Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-display font-bold text-[#E8C967] tracking-wide">
              {matchConfig.mode === 'ai' ? 'vs Stockfish 19' : 'Local Multiplayer'}
            </span>
            <span aria-hidden="true" className="text-[#6E6A63]">·</span>
            {matchConfig.mode === 'ai' && (
              <>
                <span className="text-[#C9C3B8]">{aiDiffLabel}</span>
                <span aria-hidden="true" className="text-[#6E6A63]">·</span>
              </>
            )}
            <span className="font-mono tabular-nums text-[#C9C3B8]">
              {matchConfig.timeControl === 0 ? 'No Timer' : `${matchConfig.timeControl} min`}
            </span>
            {isInCheck && !gameResult && (
              <>
                <span aria-hidden="true" className="text-[#6E6A63]">·</span>
                <span className="font-semibold text-red-400">
                  {liveTurn === 'w' ? 'White' : 'Black'} King in Check
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowSetupDrawer((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#F2EFE9] bg-[#16171D] hover:bg-[#1E2028] border border-white/15 rounded-md transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
              <span>Match Setup</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#C9C3B8] hover:text-[#F2EFE9] bg-[#16171D] hover:bg-[#1E2028] border border-white/15 rounded-md transition-colors whitespace-nowrap"
            >
              <SettingsIcon className="w-4 h-4 text-[#8B867E]" />
              <span className="hidden sm:inline">Board Settings</span>
            </button>
          </div>
        </div>

        {/* Collapsible Match Setup Panel */}
        {showSetupDrawer && (
          <div className="mb-6 p-5 rounded-xl bg-[#14151A] border border-[#D4AF37]/30 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Mode */}
              <div>
                <label className="block text-xs font-medium text-[#A8A39B] mb-2">
                  Game Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0B0B0E] rounded-lg border border-white/10">
                  {(['ai', 'local'] as GameMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDraftConfig((prev) => ({ ...prev, mode: m }))}
                      className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        draftConfig.mode === m
                          ? 'bg-[#D4AF37] text-[#0B0B0E]'
                          : 'text-[#A8A39B] hover:text-white'
                      }`}
                    >
                      {m === 'ai' ? 'vs Computer' : 'Local 2P'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-medium text-[#A8A39B] mb-2">
                  AI Difficulty
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B0B0E] rounded-lg border border-white/10">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={draftConfig.mode === 'local'}
                      onClick={() => setDraftConfig((prev) => ({ ...prev, difficulty: d }))}
                      className={`py-2 px-2 text-xs font-semibold rounded-md capitalize transition-colors whitespace-nowrap ${
                        draftConfig.mode === 'local'
                          ? 'opacity-40 cursor-not-allowed text-[#8B867E]'
                          : draftConfig.difficulty === d
                          ? 'bg-[#D4AF37] text-[#0B0B0E]'
                          : 'text-[#A8A39B] hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Play As */}
              <div>
                <label className="block text-xs font-medium text-[#A8A39B] mb-2">
                  Play As
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B0B0E] rounded-lg border border-white/10">
                  {([
                    { v: 'w', l: 'White' },
                    { v: 'b', l: 'Black' },
                    { v: 'random', l: 'Random' },
                  ] as { v: PlayerColorChoice; l: string }[]).map((c) => (
                    <button
                      key={c.v}
                      type="button"
                      disabled={draftConfig.mode === 'local'}
                      onClick={() => setDraftConfig((prev) => ({ ...prev, playerColor: c.v }))}
                      className={`py-2 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        draftConfig.mode === 'local'
                          ? 'opacity-40 cursor-not-allowed text-[#8B867E]'
                          : draftConfig.playerColor === c.v
                          ? 'bg-[#D4AF37] text-[#0B0B0E]'
                          : 'text-[#A8A39B] hover:text-white'
                      }`}
                    >
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Control */}
              <div>
                <label className="block text-xs font-medium text-[#A8A39B] mb-2">
                  Chess Clock
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIME_CONTROLS.map((tc) => (
                    <button
                      key={tc.value}
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          timeControl: tc.value as TimeControlMinutes,
                        }))
                      }
                      className={`py-1.5 px-2 text-xs font-mono font-medium rounded-md border transition-colors whitespace-nowrap ${
                        draftConfig.timeControl === tc.value
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#E8C967]'
                          : 'bg-[#0B0B0E] border-white/10 text-[#A8A39B] hover:text-white'
                      }`}
                    >
                      {tc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowSetupDrawer(false)}
                className="px-4 py-2 text-xs font-medium text-[#A8A39B] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => startNewGame(draftConfig)}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-[#0B0B0E] bg-[#D4AF37] hover:bg-[#E8C967] rounded-md transition-colors"
              >
                Start Match
              </button>
            </div>
          </div>
        )}

        {/* Main Chess Arena Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left / Center: Eval Bar + Player Bars + 8x8 Chessboard */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-3 max-w-[660px] w-full mx-auto">
            {renderPlayerBar(topColor)}

            <div className="relative flex items-stretch gap-2.5">
              {/* Optional Evaluation Bar */}
              {settings.showEvaluation && (
                <div
                  className="hidden sm:flex flex-col w-6 rounded-md overflow-hidden border border-white/15 bg-[#191B20] shrink-0 justify-between relative"
                  title={`Engine Evaluation: ${evalLabel}`}
                >
                  <div
                    className="w-full bg-[#191B20] transition-all duration-300"
                    style={{
                      height: `${flipped ? evalWhitePercent : 100 - evalWhitePercent}%`,
                    }}
                  />
                  <div
                    className="w-full bg-[#EFEAE0] transition-all duration-300"
                    style={{
                      height: `${flipped ? 100 - evalWhitePercent : evalWhitePercent}%`,
                    }}
                  />
                  <span
                    className={`absolute left-0 right-0 text-center text-[9px] font-mono font-bold tabular-nums px-0.5 ${
                      evalWhitePercent >= 50
                        ? flipped
                          ? 'top-1 text-[#EFEAE0]'
                          : 'bottom-1 text-[#14151A]'
                        : flipped
                        ? 'bottom-1 text-[#14151A]'
                        : 'top-1 text-[#EFEAE0]'
                    }`}
                  >
                    {evalLabel}
                  </span>
                </div>
              )}

              {/* Chessboard Container */}
              <div className="relative flex-1">
                <ChessBoard
                  fen={displayedFen}
                  theme={boardTheme}
                  flipped={flipped}
                  interactive={!gameResult && !isViewingHistory && !aiThinking && !pendingPromotion}
                  allowedColor={matchConfig.mode === 'ai' ? humanColor : 'both'}
                  showLegalMoves={settings.showLegalMoves}
                  showCoordinates={settings.showCoordinates}
                  lastMove={displayedLastMove}
                  onAttemptMove={handleAttemptMove}
                />

                {/* Pawn Promotion Picker Modal */}
                {pendingPromotion && (
                  <div className="absolute inset-0 z-30 bg-[#0B0B0E]/80 backdrop-blur-xs flex items-center justify-center p-4 rounded-lg">
                    <div className="bg-[#14151A] border border-[#D4AF37]/50 rounded-xl p-5 shadow-2xl max-w-xs w-full text-center">
                      <h3 className="font-display text-base font-bold text-[#E8C967] mb-1">
                        Pawn Promotion
                      </h3>
                      <p className="text-xs text-[#A8A39B] mb-4">
                        Choose a piece to promote your pawn
                      </p>
                      <div className="grid grid-cols-4 gap-2.5">
                        {(['q', 'r', 'b', 'n'] as const).map((promoType) => (
                          <button
                            key={promoType}
                            type="button"
                            aria-label={`Promote to ${
                              { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }[promoType]
                            }`}
                            onClick={() => {
                              const { from, to } = pendingPromotion;
                              setPendingPromotion(null);
                              commitMove(from, to, promoType);
                            }}
                            className="aspect-square p-2 rounded-lg bg-[#1E2028] hover:bg-[#D4AF37]/20 border border-white/15 hover:border-[#D4AF37] transition-colors flex flex-col items-center justify-center gap-1"
                          >
                            <div className="w-10 h-10">
                              <ChessPiece type={promoType} color={pendingPromotion.color} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Over Result Modal */}
                {gameResult && showResultOverlay && (
                  <div className="absolute inset-0 z-30 bg-[#0B0B0E]/80 backdrop-blur-xs flex items-center justify-center p-4 rounded-lg">
                    <div className="bg-[#14151A] border border-[#D4AF37]/55 rounded-xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
                      <div className="text-xs font-mono tracking-widest uppercase text-[#D4AF37]">
                        Match Complete
                      </div>
                      <h2 className="font-display text-2xl font-bold text-[#F7F4ED]">
                        {gameResult.title}
                      </h2>
                      <p className="text-sm text-[#A8A39B] leading-relaxed">
                        {gameResult.subtitle}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => startNewGame(matchConfig)}
                          className="flex-1 py-2.5 px-4 text-sm font-semibold text-[#0B0B0E] bg-[#D4AF37] hover:bg-[#E8C967] rounded-md transition-colors"
                        >
                          Play Again
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResultOverlay(false)}
                          className="flex-1 py-2.5 px-4 text-sm font-medium text-[#F2EFE9] bg-[#1D1F27] hover:bg-[#272A34] border border-white/15 rounded-md transition-colors"
                        >
                          Inspect Board
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {renderPlayerBar(bottomColor)}
          </div>

          {/* Right Column: Match Controls, Draw/Resign Banners & Move History */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4 bg-[#14151A] border border-white/10 rounded-xl p-5">
            {/* Result Summary Banner when user dismissed overlay to inspect board */}
            {gameResult && !showResultOverlay && (
              <div className="p-4 rounded-lg bg-[#1A1C23] border border-[#D4AF37]/45 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#E8C967]">{gameResult.title}</div>
                  <div className="text-xs text-[#A8A39B] mt-0.5">{gameResult.subtitle}</div>
                </div>
                <button
                  type="button"
                  onClick={() => startNewGame(matchConfig)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#0B0B0E] bg-[#D4AF37] hover:bg-[#E8C967] rounded-md shrink-0 transition-colors"
                >
                  Play Again
                </button>
              </div>
            )}

            {/* Viewing History Banner */}
            {isViewingHistory && (
              <div className="p-3 rounded-lg bg-[#1B1D25] border border-[#D4AF37]/40 flex items-center justify-between gap-3 text-xs">
                <span className="text-[#E8C967]">
                  Inspecting move {Math.ceil(activePly / 2)} ({activePly % 2 === 1 ? 'White' : 'Black'})
                </span>
                <button
                  type="button"
                  onClick={() => setViewPly(null)}
                  className="px-3 py-1 font-semibold bg-[#D4AF37] text-[#0B0B0E] rounded transition-colors hover:bg-[#E8C967]"
                >
                  Return to Live
                </button>
              </div>
            )}

            {/* Inline Draw Offer Banner (Local Multiplayer) */}
            {localDrawOfferBy && !gameResult && (
              <div className="p-3.5 rounded-lg bg-[#1A1C24] border border-[#D4AF37]/45 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[#F2EFE9] font-medium">
                  {localDrawOfferBy === 'w' ? 'White' : 'Black'} offers a draw
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalDrawOfferBy(null);
                      setGameResult({
                        winner: 'draw',
                        reason: 'draw-agreement',
                        title: 'Draw by Mutual Agreement',
                        subtitle: 'Both players agreed to split the point.',
                      });
                      setShowResultOverlay(true);
                      soundEngine.playGameOver(true);
                    }}
                    className="px-3 py-1.5 font-semibold bg-[#D4AF37] text-[#0B0B0E] rounded hover:bg-[#E8C967] transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalDrawOfferBy(null)}
                    className="px-3 py-1.5 font-medium bg-[#232631] text-[#D8D3CA] rounded hover:text-white transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* AI Draw Offer Status */}
            {aiDrawStatus !== 'idle' && (
              <div className="p-3 rounded-lg bg-[#1A1C24] border border-white/15 text-xs text-[#E8C967]">
                {aiDrawStatus === 'evaluating'
                  ? 'Stockfish is evaluating the draw offer...'
                  : 'Stockfish declined the draw offer and wants to play on.'}
              </div>
            )}

            {/* Inline Resign Confirmation */}
            {confirmResign && !gameResult && (
              <div className="p-3.5 rounded-lg bg-red-950/35 border border-red-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-red-200 font-medium">
                  Resign this match?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmResign}
                    className="px-3 py-1.5 font-semibold bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                  >
                    Yes, Resign
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResign(false)}
                    className="px-3 py-1.5 font-medium bg-[#232631] text-[#D8D3CA] rounded hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Move History Header + Navigation */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <h2 className="font-display text-base font-bold text-[#F7F4ED]">
                Move History
              </h2>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="First position"
                  disabled={moves.length === 0 || activePly === 0}
                  onClick={() => setViewPly(0)}
                  className="p-1.5 rounded text-[#A8A39B] hover:text-[#E8C967] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronFirst className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Previous move"
                  disabled={moves.length === 0 || activePly === 0}
                  onClick={() => setViewPly(Math.max(0, activePly - 1))}
                  className="p-1.5 rounded text-[#A8A39B] hover:text-[#E8C967] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next move"
                  disabled={activePly >= moves.length}
                  onClick={() => {
                    const next = activePly + 1;
                    setViewPly(next >= moves.length ? null : next);
                  }}
                  className="p-1.5 rounded text-[#A8A39B] hover:text-[#E8C967] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Latest move"
                  disabled={activePly >= moves.length}
                  onClick={() => setViewPly(null)}
                  className="p-1.5 rounded text-[#A8A39B] hover:text-[#E8C967] hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLast className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Algebraic Move List */}
            <div
              ref={moveListRef}
              className="royal-scroll h-64 sm:h-72 lg:h-80 overflow-y-auto pr-1 text-sm font-mono tabular-nums"
            >
              {moveRows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#8B867E] font-sans px-4">
                  <p className="text-sm">No moves played yet.</p>
                  <p className="text-xs mt-1">
                    {matchConfig.mode === 'ai' && humanColor === 'b'
                      ? 'Stockfish is preparing White’s opening move.'
                      : 'Select or drag a piece to open the game.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {moveRows.map((row) => (
                    <div
                      key={row.moveNumber}
                      className="grid grid-cols-12 items-center py-1 text-xs sm:text-sm"
                    >
                      <span className="col-span-2 text-[#6E6A63] pl-2">
                        {row.moveNumber}.
                      </span>
                      <div className="col-span-5">
                        {row.white && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewPly(
                                row.white!.ply === moves.length ? null : row.white!.ply
                              )
                            }
                            className={`w-full text-left px-2.5 py-1 rounded transition-colors ${
                              activePly === row.white.ply
                                ? 'bg-[#D4AF37]/25 text-[#E8C967] font-semibold'
                                : 'text-[#EFECE6] hover:bg-white/5'
                            }`}
                          >
                            {row.white.san}
                          </button>
                        )}
                      </div>
                      <div className="col-span-5">
                        {row.black && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewPly(
                                row.black!.ply === moves.length ? null : row.black!.ply
                              )
                            }
                            className={`w-full text-left px-2.5 py-1 rounded transition-colors ${
                              activePly === row.black.ply
                                ? 'bg-[#D4AF37]/25 text-[#E8C967] font-semibold'
                                : 'text-[#EFECE6] hover:bg-white/5'
                            }`}
                          >
                            {row.black.san}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Toolbar */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={!canUndo}
                onClick={handleUndo}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md bg-[#1A1C23] hover:bg-[#232631] text-[#F2EFE9] border border-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
              >
                <Undo2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                disabled={Boolean(gameResult)}
                onClick={handleOfferDraw}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md bg-[#1A1C23] hover:bg-[#232631] text-[#F2EFE9] border border-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
              >
                <Handshake className="w-4 h-4 text-[#D4AF37]" />
                <span>Offer Draw</span>
              </button>

              <button
                type="button"
                disabled={Boolean(gameResult)}
                onClick={() => setConfirmResign(true)}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md bg-[#1A1C23] hover:bg-red-950/50 text-[#F2EFE9] hover:text-red-200 border border-white/10 hover:border-red-500/40 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
              >
                <Flag className="w-4 h-4 text-red-400" />
                <span>Resign</span>
              </button>

              <button
                type="button"
                onClick={() => startNewGame(matchConfig)}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md bg-[#1A1C23] hover:bg-[#232631] text-[#F2EFE9] border border-white/10 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 text-[#D4AF37]" />
                <span>Restart</span>
              </button>

              <button
                type="button"
                onClick={() => setFlipped((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md bg-[#1A1C23] hover:bg-[#232631] text-[#F2EFE9] border border-white/10 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown className="w-4 h-4 text-[#D4AF37]" />
                <span>Flip Board</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md bg-[#1A1C23] hover:bg-[#232631] text-[#F2EFE9] border border-white/10 transition-colors whitespace-nowrap"
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#8B867E]" />
                )}
                <span>{settings.soundEnabled ? 'Sound On' : 'Muted'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
