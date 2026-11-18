import React from 'react';
import { ArrowRight, Clock, Cpu, Crown, ShieldCheck, Users } from 'lucide-react';
import type { Difficulty, GameMode, MatchConfig, PageRoute, TimeControlMinutes } from '../types/chess';
import { ASSETS, DIFFICULTIES, TIME_CONTROLS } from '../utils/settings';

interface HomePageProps {
  onStartMatch: (config: Partial<MatchConfig>) => void;
  onNavigate: (page: PageRoute) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartMatch, onNavigate }) => {
  const handleQuickPlay = (
    mode: GameMode,
    difficulty: Difficulty = 'medium',
    timeControl: TimeControlMinutes = 10
  ) => {
    onStartMatch({ mode, difficulty, timeControl, playerColor: 'w' });
  };

  return (
    <div className="bg-[#0B0B0E] text-[#F2EFE9]">
      {/* Hero Section */}
      <section className="relative border-b border-white/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Editorial Column */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase text-[#D4AF37]">
                <span>Stockfish 19 WASM</span>
                <span aria-hidden="true">·</span>
                <span>Full FIDE Rules</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight text-[#F7F4ED] text-balance">
                Master Every Move on the Royal Board
              </h1>

              <p className="text-base sm:text-lg text-[#A8A39B] leading-relaxed max-w-xl">
                An uncluttered, tournament-grade chess arena crafted in obsidian and brushed gold.
                Challenge the Stockfish 19 engine across three calibrated tiers or share the board
                in timed local multiplayer.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleQuickPlay('ai', 'medium', 10)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-[#0B0B0E] bg-[#D4AF37] hover:bg-[#E8C967] rounded-md transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5E7B8]"
                >
                  <span>Play Against Computer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPlay('local', 'medium', 10)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-[#F2EFE9] bg-[#16171D] hover:bg-[#1E2028] border border-white/15 hover:border-[#D4AF37]/50 rounded-md transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                >
                  <Users className="w-4 h-4 text-[#D4AF37]" />
                  <span>Local Multiplayer</span>
                </button>
              </div>
            </div>

            {/* Right Hero Media Column */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full min-h-[280px] sm:min-h-[360px] lg:h-full rounded-xl overflow-hidden border border-[#D4AF37]/25 bg-[#14151A] shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
                <img
                  src={ASSETS.heroChess}
                  alt="Handcrafted obsidian and brushed gold Staunton chess pieces on a dark marble board"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E]/85 via-[#0B0B0E]/20 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 text-xs sm:text-sm text-[#E5E0D5]">
                  <span>Staunton Obsidian &amp; Gold Collection</span>
                  <span className="font-mono tabular-nums text-[#E8C967]">64 Squares · Zero Latency</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Match Launcher Strip below Hero */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIME_CONTROLS.slice(0, 4).map((tc) => (
              <button
                key={tc.value}
                type="button"
                onClick={() => handleQuickPlay('ai', 'medium', tc.value)}
                className="group text-left p-5 rounded-lg bg-[#14151A] hover:bg-[#1A1C23] border border-white/10 hover:border-[#D4AF37]/45 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              >
                <div className="flex items-center justify-between text-xs text-[#8B867E] mb-2">
                  <span>{tc.category}</span>
                  <Clock className="w-4 h-4 text-[#D4AF37] opacity-80 group-hover:opacity-100" />
                </div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-[#F7F4ED] group-hover:text-[#E8C967] transition-colors">
                  {tc.label}
                </div>
                <div className="text-xs text-[#A8A39B] mt-1">Start vs Stockfish Medium</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Opponent Tiers Section */}
      <section className="py-16 lg:py-20 border-b border-white/10 bg-[#0F1014]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F7F4ED]">
                Calibrated Stockfish 19 Opponents
              </h2>
              <p className="text-sm sm:text-base text-[#A8A39B] mt-2 max-w-2xl">
                Every computer move is calculated inside an isolated WebAssembly Stockfish worker—never
                random moves, never illegal shortcuts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('how-to-play')}
              className="text-sm font-medium text-[#E8C967] hover:text-[#F5E7B8] transition-colors whitespace-nowrap self-start md:self-auto"
            >
              Read Complete Rules →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIFFICULTIES.map((tier) => (
              <div
                key={tier.value}
                className="flex flex-col justify-between p-6 rounded-xl bg-[#14151A] border border-white/10"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#A8A39B] mb-3">
                    <span className="font-mono tabular-nums text-[#D4AF37]">{tier.elo}</span>
                    <Cpu className="w-4 h-4 text-[#8B867E]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#F7F4ED]">{tier.label}</h3>
                  <p className="text-sm text-[#A8A39B] mt-2 leading-relaxed">{tier.summary}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickPlay('ai', tier.value, 10)}
                  className="mt-6 w-full py-2.5 px-4 text-sm font-semibold text-[#F2EFE9] bg-[#1C1E26] hover:bg-[#D4AF37] hover:text-[#0B0B0E] border border-white/10 hover:border-[#D4AF37] rounded-md transition-colors"
                >
                  Challenge {tier.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Chess Guarantees */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="text-lg font-semibold text-[#F7F4ED]">Exact FIDE Rule Enforcement</h3>
              <p className="text-sm text-[#A8A39B] leading-relaxed">
                Complete support for castling on both flanks, en passant captures, pawn promotion
                to any minor or major piece, threefold repetition, fifty-move rule, and stalemate.
              </p>
            </div>

            <div className="space-y-3">
              <Clock className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="text-lg font-semibold text-[#F7F4ED]">Precision Tournament Clocks</h3>
              <p className="text-sm text-[#A8A39B] leading-relaxed">
                Choose from 1, 3, 5, 10, or 15-minute controls—or play untimed casual matches.
                Clocks switch automatically after every ply with tenth-second precision under 20s.
              </p>
            </div>

            <div className="space-y-3">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="text-lg font-semibold text-[#F7F4ED]">Move Replay &amp; Evaluation</h3>
              <p className="text-sm text-[#A8A39B] leading-relaxed">
                Step backward and forward through algebraic move notation, undo moves cleanly,
                offer draws backed by real engine evaluation, and customize board craftsmanship.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
