export type PageRoute = 'home' | 'play' | 'how-to-play' | 'about' | 'settings';

export type GameMode = 'ai' | 'local';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type TimeControlMinutes = 1 | 3 | 5 | 10 | 15 | 0; // 0 = Untimed

export type PlayerColorChoice = 'w' | 'b' | 'random';

export type BoardThemeId =
  | 'obsidian-gold'
  | 'midnight-slate'
  | 'imperial-walnut'
  | 'emerald-club';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  description: string;
  lightSquare: string;
  darkSquare: string;
  lightCoord: string;
  darkCoord: string;
  highlightSelected: string;
  highlightLastMove: string;
  frameBorder: string;
}

export interface GameSettings {
  boardTheme: BoardThemeId;
  soundEnabled: boolean;
  showLegalMoves: boolean;
  showCoordinates: boolean;
  autoFlipLocal: boolean;
  showEvaluation: boolean;
  whitePlayerName: string;
  blackPlayerName: string;
  defaultTimeControl: TimeControlMinutes;
  defaultDifficulty: Difficulty;
}

export interface MoveRecord {
  ply: number;
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  from: string;
  to: string;
  fen: string;
  captured?: string;
  promotion?: string;
  flags: string;
}

export type GameEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'repetition'
  | 'fifty-move'
  | 'insufficient-material'
  | 'timeout'
  | 'timeout-insufficient'
  | 'resignation'
  | 'draw-agreement';

export interface GameResult {
  winner: 'w' | 'b' | 'draw';
  reason: GameEndReason;
  title: string;
  subtitle: string;
}

export interface MatchConfig {
  mode: GameMode;
  difficulty: Difficulty;
  playerColor: PlayerColorChoice;
  timeControl: TimeControlMinutes;
}
