import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { BoardThemeId, Difficulty, GameSettings, PageRoute, TimeControlMinutes } from '../types/chess';
import { ASSETS, BOARD_THEMES, DEFAULT_SETTINGS, DIFFICULTIES, TIME_CONTROLS } from '../utils/settings';
import { ChessPiece } from '../components/ChessPiece';

interface SettingsPageProps {
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onResetSettings: () => void;
  onNavigate: (page: PageRoute) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onNavigate,
}) => {
  const activeTheme = BOARD_THEMES[settings.boardTheme];

  const toggleItems: {
    key: keyof Pick<
      GameSettings,
      'soundEnabled' | 'showLegalMoves' | 'showCoordinates' | 'autoFlipLocal' | 'showEvaluation'
    >;
    label: string;
    description: string;
  }[] = [
    {
      key: 'soundEnabled',
      label: 'Acoustic Sound Effects',
      description: 'Play synthesized wood move, capture, check, and clock warning sounds.',
    },
    {
      key: 'showLegalMoves',
      label: 'Highlight Legal Moves',
      description: 'Display destination dots and capture rings when selecting a piece.',
    },
    {
      key: 'showCoordinates',
      label: 'Board Coordinates',
      description: 'Show algebraic rank (1–8) and file (a–h) markers along the board edges.',
    },
    {
      key: 'autoFlipLocal',
      label: 'Auto-Flip in Local Multiplayer',
      description: 'Automatically rotate the board to face the active player after every move.',
    },
    {
      key: 'showEvaluation',
      label: 'Stockfish Evaluation Bar',
      description: 'Display the live positional advantage meter beside the chessboard.',
    },
  ];

  return (
    <div className="bg-[#0B0B0E] text-[#F2EFE9] py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F7F4ED]">
              Game Settings
            </h1>
            <p className="text-sm sm:text-base text-[#A8A39B] mt-2">
              Customize board craftsmanship, audio cues, player identities, and default match timers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onResetSettings}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-[#A8A39B] hover:text-white bg-[#14151A] border border-white/10 rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('play')}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-[#0B0B0E] bg-[#D4AF37] hover:bg-[#E8C967] rounded-md transition-colors"
            >
              Return to Board
            </button>
          </div>
        </div>

        {/* Board Theme Section + Live Preview */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#F7F4ED]">Board Finish</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((themeId) => {
                const theme = BOARD_THEMES[themeId];
                const selected = settings.boardTheme === themeId;
                return (
                  <button
                    key={themeId}
                    type="button"
                    onClick={() => onUpdateSettings({ boardTheme: themeId })}
                    className={`text-left p-4 rounded-xl border transition-colors ${
                      selected
                        ? 'bg-[#191B22] border-[#D4AF37]'
                        : 'bg-[#14151A] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="grid grid-cols-2 w-8 h-8 rounded overflow-hidden border border-white/20 shrink-0">
                        <span style={{ backgroundColor: theme.lightSquare }} />
                        <span style={{ backgroundColor: theme.darkSquare }} />
                        <span style={{ backgroundColor: theme.darkSquare }} />
                        <span style={{ backgroundColor: theme.lightSquare }} />
                      </div>
                      <span className="font-semibold text-sm text-[#F7F4ED]">{theme.name}</span>
                    </div>
                    <p className="text-xs text-[#A8A39B] leading-relaxed">{theme.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live 4x4 Preview */}
          <div className="lg:col-span-5 bg-[#14151A] border border-white/10 rounded-xl p-5">
            <div className="text-xs font-medium text-[#A8A39B] mb-3">
              Live Preview · {activeTheme.name}
            </div>
            <div
              className="aspect-square max-w-[260px] mx-auto grid grid-cols-4 grid-rows-4 rounded-lg overflow-hidden shadow-xl"
              style={{ border: `3px solid ${activeTheme.frameBorder}` }}
            >
              {Array.from({ length: 16 }).map((_, idx) => {
                const r = Math.floor(idx / 4);
                const c = idx % 4;
                const isLight = (r + c) % 2 === 0;
                const bg = isLight ? activeTheme.lightSquare : activeTheme.darkSquare;

                let piece: { t: 'k' | 'q' | 'n' | 'p'; col: 'w' | 'b' } | null = null;
                if (r === 0 && c === 1) piece = { t: 'k', col: 'b' };
                if (r === 0 && c === 2) piece = { t: 'n', col: 'b' };
                if (r === 3 && c === 1) piece = { t: 'q', col: 'w' };
                if (r === 3 && c === 2) piece = { t: 'k', col: 'w' };
                if (r === 2 && c === 1) piece = { t: 'p', col: 'w' };

                return (
                  <div
                    key={idx}
                    className="relative flex items-center justify-center"
                    style={{ backgroundColor: bg }}
                  >
                    {r === 2 && c === 2 && (
                      <span className="w-3 h-3 rounded-full bg-[#D4AF37]/80 ring-1 ring-black/30" />
                    )}
                    {piece && (
                      <div className="w-[82%] h-[82%]">
                        <ChessPiece type={piece.t} color={piece.col} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Gameplay & Visual Aids */}
        <section className="pt-8 border-t border-white/10 space-y-4">
          <h2 className="font-display text-xl font-bold text-[#F7F4ED]">
            Gameplay &amp; Visual Assistance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toggleItems.map((item) => {
              const checked = settings[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  onClick={() => onUpdateSettings({ [item.key]: !checked })}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#14151A] border border-white/10 hover:border-white/20 text-left transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#F7F4ED]">{item.label}</div>
                    <div className="text-xs text-[#A8A39B] mt-1 leading-relaxed">
                      {item.description}
                    </div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                      checked ? 'bg-[#D4AF37]' : 'bg-[#2A2D37]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-[#0B0B0E] transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Player Identities & Default Match Preferences */}
        <section className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#F7F4ED]">Player Profiles</h2>
            <div className="space-y-4 bg-[#14151A] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <img
                  src={ASSETS.avatarWhite}
                  alt="White player avatar"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-md border border-white/15 object-cover shrink-0"
                />
                <div className="flex-1">
                  <label
                    htmlFor="white-player-name"
                    className="block text-xs font-medium text-[#A8A39B] mb-1"
                  >
                    Player 1 / White Name
                  </label>
                  <input
                    id="white-player-name"
                    type="text"
                    maxLength={24}
                    value={settings.whitePlayerName}
                    onChange={(e) => onUpdateSettings({ whitePlayerName: e.target.value })}
                    placeholder={DEFAULT_SETTINGS.whitePlayerName}
                    className="w-full px-3 py-2 text-sm rounded-md bg-[#0B0B0E] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={ASSETS.avatarBlack}
                  alt="Black player avatar"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-md border border-white/15 object-cover shrink-0"
                />
                <div className="flex-1">
                  <label
                    htmlFor="black-player-name"
                    className="block text-xs font-medium text-[#A8A39B] mb-1"
                  >
                    Player 2 / Local Opponent Name
                  </label>
                  <input
                    id="black-player-name"
                    type="text"
                    maxLength={24}
                    value={settings.blackPlayerName}
                    onChange={(e) => onUpdateSettings({ blackPlayerName: e.target.value })}
                    placeholder={DEFAULT_SETTINGS.blackPlayerName}
                    className="w-full px-3 py-2 text-sm rounded-md bg-[#0B0B0E] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#F7F4ED]">Default Match Presets</h2>
            <div className="space-y-5 bg-[#14151A] border border-white/10 rounded-xl p-5">
              <div>
                <div className="text-xs font-medium text-[#A8A39B] mb-2">
                  Default Chess Clock
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_CONTROLS.map((tc) => (
                    <button
                      key={tc.value}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          defaultTimeControl: tc.value as TimeControlMinutes,
                        })
                      }
                      className={`py-2 px-2.5 text-xs font-mono font-medium rounded-md border transition-colors ${
                        settings.defaultTimeControl === tc.value
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#E8C967]'
                          : 'bg-[#0B0B0E] border-white/10 text-[#A8A39B] hover:text-white'
                      }`}
                    >
                      {tc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-[#A8A39B] mb-2">
                  Default Computer Difficulty
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ defaultDifficulty: tier.value as Difficulty })
                      }
                      className={`py-2 px-3 text-xs font-semibold rounded-md border transition-colors ${
                        settings.defaultDifficulty === tier.value
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B0B0E]'
                          : 'bg-[#0B0B0E] border-white/10 text-[#A8A39B] hover:text-white'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
