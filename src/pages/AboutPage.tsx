import React from 'react';
import { ArrowRight, Cpu, Layers, Shield } from 'lucide-react';
import type { PageRoute } from '../types/chess';
import { ASSETS } from '../utils/settings';

interface AboutPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0B0B0E] text-[#F2EFE9] py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Editorial Intro Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <div className="text-xs font-medium tracking-[0.16em] uppercase text-[#D4AF37]">
              About Royal Chess
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F7F4ED] leading-tight text-balance">
              Crafted for Serious Focus &amp; Pure Strategy
            </h1>
            <p className="text-base text-[#A8A39B] leading-relaxed">
              Royal Chess was built to strip away noisy popups and cluttered sidebars—leaving only a
              high-contrast board, razor-sharp Staunton geometry, accurate FIDE rules, and genuine
              grandmaster-caliber calculation right inside your browser.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('play')}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-[#0B0B0E] bg-[#D4AF37] hover:bg-[#E8C967] rounded-md transition-colors"
              >
                <span>Start a Match</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="w-full min-h-[280px] lg:h-full rounded-xl overflow-hidden border border-[#D4AF37]/25 bg-[#14151A] shadow-2xl">
              <img
                src={ASSETS.aboutCraftsmanship}
                alt="Handcrafted wooden and brass chess pieces arranged in an opening position"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Architecture Pillars */}
        <section className="pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-[#14151A] border border-white/10 space-y-3">
            <Cpu className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-lg font-semibold text-[#F7F4ED]">Stockfish 19 WebAssembly</h2>
            <p className="text-sm text-[#A8A39B] leading-relaxed">
              All computer opponents run inside a dedicated Web Worker executing Stockfish 19 Lite
              WASM with UCI skill tuning across Easy, Medium, and Hard difficulty tiers.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#14151A] border border-white/10 space-y-3">
            <Shield className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-lg font-semibold text-[#F7F4ED]">Zero-Compromise Rule Engine</h2>
            <p className="text-sm text-[#A8A39B] leading-relaxed">
              Move legality, pins, castling rights, en passant captures, promotion choices,
              fifty-move counters, and threefold repetitions are strictly validated on every ply.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#14151A] border border-white/10 space-y-3">
            <Layers className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="text-lg font-semibold text-[#F7F4ED]">Private, Instant &amp; Responsive</h2>
            <p className="text-sm text-[#A8A39B] leading-relaxed">
              Your board preferences, clock defaults, and custom player names persist locally in your
              browser. Play smoothly across widescreen monitors, tablets, and mobile screens.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
