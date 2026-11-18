import type { BoardTheme, BoardThemeId, Difficulty, GameSettings, TimeControlMinutes } from '../types/chess';

export const ASSETS = {
  heroChess: '/src/assets/images/hero_royal_chess_1795017391230.jpg',
  aboutCraftsmanship: '/src/assets/images/about_craftsmanship_1795017390913.jpg',
  avatarAi: '/src/assets/images/avatar_grandmaster_ai_1795017391386.jpg',
  avatarWhite: '/src/assets/images/avatar_player_white_1795017391403.jpg',
  avatarBlack: '/src/assets/images/avatar_player_black_1795017391612.jpg',
} as const;

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  'obsidian-gold': {
    id: 'obsidian-gold',
    name: 'Royal Champagne & Slate',
    description: 'Warm brushed champagne light squares paired with deep charcoal slate.',
    lightSquare: '#CFC6B2',
    darkSquare: '#474540',
    lightCoord: '#474540',
    darkCoord: '#CFC6B2',
    highlightSelected: 'rgba(212, 175, 55, 0.52)',
    highlightLastMove: 'rgba(212, 175, 55, 0.28)',
    frameBorder: '#2C2A25',
  },
  'midnight-slate': {
    id: 'midnight-slate',
    name: 'Midnight Obsidian',
    description: 'Cool architectural silver-slate paired with matte carbon squares.',
    lightSquare: '#969CA6',
    darkSquare: '#2B2F38',
    lightCoord: '#2B2F38',
    darkCoord: '#969CA6',
    highlightSelected: 'rgba(212, 175, 55, 0.5)',
    highlightLastMove: 'rgba(212, 175, 55, 0.26)',
    frameBorder: '#252932',
  },
  'imperial-walnut': {
    id: 'imperial-walnut',
    name: 'Imperial Walnut',
    description: 'Classic tournament ivory grain contrasted against rich dark walnut.',
    lightSquare: '#DFD0B5',
    darkSquare: '#6E5036',
    lightCoord: '#6E5036',
    darkCoord: '#DFD0B5',
    highlightSelected: 'rgba(232, 201, 103, 0.52)',
    highlightLastMove: 'rgba(232, 201, 103, 0.30)',
    frameBorder: '#433020',
  },
  'emerald-club': {
    id: 'emerald-club',
    name: 'Grandmaster Emerald',
    description: 'Tournament alabaster paired with deep felt emerald green.',
    lightSquare: '#D6DEC8',
    darkSquare: '#3F634D',
    lightCoord: '#3F634D',
    darkCoord: '#D6DEC8',
    highlightSelected: 'rgba(212, 175, 55, 0.52)',
    highlightLastMove: 'rgba(212, 175, 55, 0.28)',
    frameBorder: '#263D2F',
  },
};

export const TIME_CONTROLS: { value: TimeControlMinutes; label: string; category: string }[] = [
  { value: 1, label: '1 min', category: 'Bullet' },
  { value: 3, label: '3 min', category: 'Blitz' },
  { value: 5, label: '5 min', category: 'Blitz' },
  { value: 10, label: '10 min', category: 'Rapid' },
  { value: 15, label: '15 min', category: 'Rapid' },
  { value: 0, label: 'No Timer', category: 'Casual' },
];

export const DIFFICULTIES: { value: Difficulty; label: string; elo: string; summary: string }[] = [
  { value: 'easy', label: 'Easy', elo: '~800 Elo', summary: 'Approachable play for casual matches and learning openings.' },
  { value: 'medium', label: 'Medium', elo: '~1450 Elo', summary: 'Balanced club-level tactics with calculated midgame plans.' },
  { value: 'hard', label: 'Hard', elo: '~2250 Elo', summary: 'Deep Stockfish 19 search for tournament-grade resistance.' },
];

export const DEFAULT_SETTINGS: GameSettings = {
  boardTheme: 'obsidian-gold',
  soundEnabled: true,
  showLegalMoves: true,
  showCoordinates: true,
  autoFlipLocal: false,
  showEvaluation: true,
  whitePlayerName: 'Player 1',
  blackPlayerName: 'Player 2',
  defaultTimeControl: 10,
  defaultDifficulty: 'medium',
};

const SETTINGS_STORAGE_KEY = 'royal_chess_settings_v1';

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      boardTheme:
        parsed.boardTheme && BOARD_THEMES[parsed.boardTheme]
          ? parsed.boardTheme
          : DEFAULT_SETTINGS.boardTheme,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}
