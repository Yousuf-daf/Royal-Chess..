import React from 'react';
import type { PageRoute } from '../types/chess';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-white/10 bg-[#0B0B0E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#8B867E]">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold tracking-[0.14em] text-[#D4AF37]">
            ROYAL CHESS
          </span>
          <span aria-hidden="true">·</span>
          <span>Stockfish 19 Engine &amp; Standard FIDE Rules</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('play')}
            className="hover:text-[#E8C967] transition-colors whitespace-nowrap"
          >
            Play Chess
          </button>
          <button
            type="button"
            onClick={() => onNavigate('how-to-play')}
            className="hover:text-[#E8C967] transition-colors whitespace-nowrap"
          >
            How to Play
          </button>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="hover:text-[#E8C967] transition-colors whitespace-nowrap"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="hover:text-[#E8C967] transition-colors whitespace-nowrap"
          >
            About
          </button>
        </div>
      </div>
    </footer>
  );
};
