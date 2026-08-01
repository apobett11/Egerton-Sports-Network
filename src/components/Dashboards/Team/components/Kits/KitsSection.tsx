import React, { useState } from 'react';
import { Shirt, ChevronLeft, ChevronRight } from 'lucide-react';
import { initialKits } from '../../mockData';

export const KitsSection: React.FC = () => {
  const [activeKitIndex, setActiveKitIndex] = useState<number>(1); // Home Kit centered (index 1)

  return (
    <section className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-5 md:p-8 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
        <div>
          <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Shirt className="w-6 h-6 text-emerald-400" />
            <span>Kits</span>
          </h2>
          <p className="text-xs text-gray-400">Egerton FC Official 2026/2027 Season Uniform Collection</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveKitIndex(prev => Math.max(0, prev - 1))}
            disabled={activeKitIndex === 0}
            className="p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveKitIndex(prev => Math.min(initialKits.length - 1, prev + 1))}
            disabled={activeKitIndex === initialKits.length - 1}
            className="p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Smooth Horizontal Carousel Container */}
      <div className="overflow-x-auto no-scrollbar py-4 px-2">
        <div className="flex items-center justify-center gap-4 md:gap-8 min-w-[600px] max-w-4xl mx-auto">
          {initialKits.map((kit, idx) => {
            const isCentered = idx === activeKitIndex;
            return (
              <div
                key={kit.id}
                onClick={() => setActiveKitIndex(idx)}
                className={`transition-all duration-300 flex flex-col items-center cursor-pointer rounded-2xl p-4 border select-none ${
                  isCentered
                    ? 'w-56 md:w-64 bg-[#141414] border-emerald-500/80 shadow-2xl scale-105 z-20'
                    : 'w-44 md:w-48 bg-[#111111]/70 border-[#2A2A2A] opacity-60 scale-90 hover:opacity-80'
                }`}
              >
                {/* Kit Badge */}
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3 border ${
                    kit.id === 'home'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : kit.id === 'away'
                      ? 'bg-slate-200/20 text-slate-200 border-slate-300/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {kit.id === 'home' ? 'Home Kit' : kit.id === 'away' ? 'Away Kit' : 'Third Kit'}
                </span>

                {/* Modest Size SVG Jersey Graphic */}
                <div className="w-36 h-40 md:w-44 md:h-48 relative my-2">
                  <svg viewBox="0 0 200 220" className="w-full h-full filter drop-shadow-md">
                    <path
                      d="M 50 40 L 75 10 L 125 10 L 150 40 L 190 70 L 165 110 L 145 95 L 145 210 L 55 210 L 55 95 L 35 110 L 10 70 Z"
                      fill={kit.primaryBg}
                      stroke={kit.accentColor}
                      strokeWidth="3"
                    />
                    {kit.stripeColor && (
                      <path
                        d="M 80 40 L 80 210 M 100 35 L 100 210 M 120 40 L 120 210"
                        stroke={kit.stripeColor}
                        strokeWidth="10"
                      />
                    )}
                    <path
                      d="M 75 10 Q 100 30 125 10 Q 100 45 75 10 Z"
                      fill={kit.collarColor}
                      stroke={kit.accentColor}
                      strokeWidth="2"
                    />
                    <text
                      x="100"
                      y="140"
                      fill={kit.accentColor}
                      fontSize="32"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      10
                    </text>
                  </svg>
                </div>

                <h3 className="text-xs md:text-sm font-extrabold text-white mt-2 text-center uppercase tracking-wide">
                  {kit.name}
                </h3>
                <p className="text-[10px] text-gray-400 text-center mt-1 line-clamp-2 px-1">
                  {kit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default KitsSection;
