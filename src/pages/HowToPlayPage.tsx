import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { PageRoute } from '../types/chess';
import { ChessPiece, type PieceType } from '../components/ChessPiece';

interface HowToPlayPageProps {
  onNavigate: (page: PageRoute) => void;
}

interface PieceGuide {
  type: PieceType;
  name: string;
  value: string;
  summary: string;
  // 5x5 grid with piece at [2,2]
  reach: (r: number, c: number) => boolean;
}

const PIECE_GUIDES: PieceGuide[] = [
  {
    type: 'k',
    name: 'King',
    value: 'Priceless',
    summary:
      'Moves one square in any direction (horizontally, vertically, or diagonally). Never permitted to move onto a square attacked by an enemy piece.',
    reach: (r, c) => Math.abs(r - 2) <= 1 && Math.abs(c - 2) <= 1 && !(r === 2 && c === 2),
  },
  {
    type: 'q',
    name: 'Queen',
    value: '9 Points',
    summary:
      'The most powerful piece on the board. Combines the movement of a Rook and Bishop, sliding any number of unobstructed squares along ranks, files, or diagonals.',
    reach: (r, c) =>
      !(r === 2 && c === 2) && (r === 2 || c === 2 || Math.abs(r - 2) === Math.abs(c - 2)),
  },
  {
    type: 'r',
    name: 'Rook',
    value: '5 Points',
    summary:
      'Slides any number of unobstructed squares horizontally along a rank or vertically along a file. Also participates with the King in Castling.',
    reach: (r, c) => !(r === 2 && c === 2) && (r === 2 || c === 2),
  },
  {
    type: 'b',
    name: 'Bishop',
    value: '3 Points',
    summary:
      'Slides any number of unobstructed squares diagonally. Each Bishop remains permanently bound to either light squares or dark squares.',
    reach: (r, c) => !(r === 2 && c === 2) && Math.abs(r - 2) === Math.abs(c - 2),
  },
  {
    type: 'n',
    name: 'Knight',
    value: '3 Points',
    summary:
      'Moves in an L-shape: two squares in one cardinal direction and one square perpendicular. The only piece able to leap over intervening pieces.',
    reach: (r, c) => {
      const dr = Math.abs(r - 2);
      const dc = Math.abs(c - 2);
      return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
    },
  },
  {
    type: 'p',
    name: 'Pawn',
    value: '1 Point',
    summary:
      'Advances one square forward (or two squares from its starting rank) and captures one square diagonally forward. Eligible for En Passant and Promotion.',
    reach: (r, c) => (r === 1 && c === 2) || (r === 1 && (c === 1 || c === 3)),
  },
];

export const HowToPlayPage: React.FC<HowToPlayPageProps> = ({ onNavigate }) => {
  const [selectedPiece, setSelectedPiece] = useState<PieceType>('n');
  const activeGuide = PIECE_GUIDES.find((p) => p.type === selectedPiece) ?? PIECE_GUIDES[0];

  return (
    <div className="bg-[#0B0B0E] text-[#F2EFE9] py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-medium tracking-[0.16em] uppercase text-[#D4AF37]">
            Official Chess Guide
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F7F4ED] text-balance">
            Rules &amp; Fundamentals of Royal Chess
          </h1>
          <p className="text-base text-[#A8A39B] leading-relaxed">
            Whether you are learning piece movement for the first time or reviewing tournament draw
            laws, every rule outlined here is enforced automatically on the Royal Chess board.
          </p>
        </div>

        {/* Interactive Piece Movement Diagram */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-xl bg-[#14151A] border border-white/10">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F7F4ED]">
                01. Piece Movement
              </h2>
              <p className="text-sm text-[#A8A39B] mt-1">
                Select any piece below to inspect its legal movement geometry.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {PIECE_GUIDES.map((piece) => {
                const active = piece.type === selectedPiece;
                return (
                  <button
                    key={piece.type}
                    type="button"
                    onClick={() => setSelectedPiece(piece.type)}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-colors ${
                      active
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#E8C967]'
                        : 'bg-[#0B0B0E] border-white/10 text-[#A8A39B] hover:text-white hover:border-white/25'
                    }`}
                  >
                    <div className="w-8 h-8">
                      <ChessPiece type={piece.type} color="w" />
                    </div>
                    <span className="text-xs font-medium">{piece.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-xl font-semibold text-[#F7F4ED]">{activeGuide.name}</span>
                <span aria-hidden="true" className="text-[#6E6A63]">·</span>
                <span className="font-mono text-xs text-[#D4AF37]">{activeGuide.value}</span>
              </div>
              <p className="text-sm sm:text-base text-[#C2BDB3] leading-relaxed">
                {activeGuide.summary}
              </p>
              {activeGuide.type === 'p' && (
                <p className="text-xs text-[#8B867E]">
                  Note: Forward center square shows advance; diagonal squares show capture targets.
                </p>
              )}
            </div>
          </div>

          {/* 5x5 Movement Visualizer */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[260px] aspect-square grid grid-cols-5 grid-rows-5 rounded-lg overflow-hidden border-2 border-[#2C2A25] shadow-xl">
              {Array.from({ length: 25 }).map((_, idx) => {
                const r = Math.floor(idx / 5);
                const c = idx % 5;
                const isLight = (r + c) % 2 === 0;
                const isCenter = r === 2 && c === 2;
                const canReach = activeGuide.reach(r, c);

                return (
                  <div
                    key={idx}
                    className="relative flex items-center justify-center"
                    style={{ backgroundColor: isLight ? '#CFC6B2' : '#474540' }}
                  >
                    {isCenter && (
                      <div className="w-[82%] h-[82%]">
                        <ChessPiece type={activeGuide.type} color="w" />
                      </div>
                    )}
                    {!isCenter && canReach && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[#D4AF37] ring-2 ring-black/40" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Special Chess Rules */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-[#F7F4ED]">
            02. Special Tournament Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#14151A] border border-white/10 space-y-2.5">
              <h3 className="text-lg font-semibold text-[#E8C967]">Castling (O-O / O-O-O)</h3>
              <p className="text-sm text-[#A8A39B] leading-relaxed">
                Once per game, the King may move two squares toward either Rook while that Rook leaps
                to the square beside it. Neither piece may have moved previously, squares between
                them must be empty, and the King cannot castle out of, through, or into check.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#14151A] border border-white/10 space-y-2.5">
              <h3 className="text-lg font-semibold text-[#E8C967]">En Passant</h3>
              <p className="text-sm text-[#A8A39B] leading-relaxed">
                When a Pawn advances two squares from its starting rank and lands directly beside an
                opponent’s Pawn, the opponent may capture it diagonally onto the skipped square—only
                on the very next turn.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#14151A] border border-white/10 space-y-2.5">
              <h3 className="text-lg font-semibold text-[#E8C967]">Pawn Promotion</h3>
              <p className="text-sm text-[#A8A39B] leading-relaxed">
                Any Pawn reaching the eighth rank (first rank for Black) immediately promotes to
                your choice of a Queen, Rook, Bishop, or Knight—even if another Queen is already on
                the board.
              </p>
            </div>
          </div>
        </section>

        {/* Winning & Draw Conditions */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-[#F7F4ED]">
            03. Check, Checkmate &amp; Draw Laws
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-[#14151A] border border-white/10 space-y-4">
              <h3 className="text-lg font-semibold text-[#F7F4ED]">Victory Conditions</h3>
              <ul className="space-y-3 text-sm text-[#A8A39B]">
                <li>
                  <strong className="text-[#F2EFE9]">Check &amp; Checkmate:</strong> When a King is
                  under direct attack, it is in Check and must escape immediately. If no legal move
                  removes the threat, it is Checkmate and the game ends.
                </li>
                <li>
                  <strong className="text-[#F2EFE9]">Time Control Expiration:</strong> In timed
                  games, if your opponent’s clock reaches 00:00 and you possess sufficient mating
                  material, you win on time.
                </li>
                <li>
                  <strong className="text-[#F2EFE9]">Resignation:</strong> Either player may
                  concede the match at any point.
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-[#14151A] border border-white/10 space-y-4">
              <h3 className="text-lg font-semibold text-[#F7F4ED]">Draw Conditions</h3>
              <ul className="space-y-3 text-sm text-[#A8A39B]">
                <li>
                  <strong className="text-[#F2EFE9]">Stalemate:</strong> The player to move is not in
                  check yet has zero legal moves available.
                </li>
                <li>
                  <strong className="text-[#F2EFE9]">Threefold Repetition:</strong> The identical
                  board position, castling rights, and en passant state repeat three times.
                </li>
                <li>
                  <strong className="text-[#F2EFE9]">Fifty-Move Rule &amp; Insufficient Material:</strong>{' '}
                  Fifty consecutive moves pass with neither pawn push nor capture, or neither side
                  retains enough pieces to deliver checkmate (e.g., King + Bishop vs King).
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#A8A39B]">
            Ready to put these principles into practice?
          </p>
          <button
            type="button"
            onClick={() => onNavigate('play')}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0B0B0E] bg-[#D4AF37] hover:bg-[#E8C967] rounded-md transition-colors"
          >
            <span>Open Chessboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
