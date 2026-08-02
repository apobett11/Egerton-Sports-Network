import React from 'react';
import type { Player } from '../../types';
import { formationCoordinates } from '../../mockData';

interface PitchCanvasProps {
  formation: string;
  startingXI: number[];
  roster: Player[];
  selectedPitchSlot: number | null;
  setSelectedPitchSlot: (slot: number | null) => void;
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({
  formation,
  startingXI,
  roster,
  selectedPitchSlot,
  setSelectedPitchSlot,
}) => {
  const activeCoordinates = formationCoordinates[formation] || formationCoordinates['4-4-1-1'];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm md:text-base font-semibold tracking-wide text-gray-100 flex items-center gap-2">
            Tactical 2D Pitch
          </h2>
          <p className="text-[11px] md:text-xs font-medium text-gray-400">
            Tap a player node to inspect status or execute substitution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md">
            Form: {formation}
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-emerald-900/90 via-emerald-800 to-emerald-950 rounded-2xl border-2 border-[#2A2A2A] shadow-2xl overflow-hidden select-none">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
        <div className="absolute inset-0 flex flex-col justify-between opacity-15 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-full ${i % 2 === 0 ? 'bg-black/20' : 'bg-transparent'}`} />
          ))}
        </div>

        <div className="absolute inset-4 border-2 border-white/25 rounded-lg pointer-events-none" />
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/25 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/25 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-20 border-b-2 border-x-2 border-white/25 rounded-b-md pointer-events-none" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-20 border-t-2 border-x-2 border-white/25 rounded-t-md pointer-events-none" />

        {activeCoordinates.map((node, nodeIdx) => {
          const playerIdx = startingXI[nodeIdx];
          const player = roster[playerIdx];
          const isSelected = selectedPitchSlot === nodeIdx;

          if (!player) return null;

          return (
            <button
              key={`node_${nodeIdx}`}
              onClick={() => setSelectedPitchSlot(nodeIdx)}
              style={{ top: node.top, left: node.left }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer group focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center z-10 ${
                isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-10 h-10 md:w-11 md:h-11 rounded-full border-2 p-0.5 bg-[#1F1F1F] shadow-lg flex items-center justify-center overflow-hidden transition-all ${
                    isSelected
                      ? 'border-emerald-400 ring-4 ring-emerald-500/40 shadow-emerald-500/50'
                      : 'border-white/40 group-hover:border-emerald-400'
                  }`}
                >
                  <img
                    src={player.cardImage}
                    alt={player.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-[#111111]">
                  {player.number}
                </div>

                <div className="mt-1 bg-[#111111]/90 backdrop-blur-xs border border-[#2A2A2A] px-2 py-0.5 rounded-md text-center max-w-[80px]">
                  <div className="text-[10px] font-bold text-white truncate leading-tight">
                    {player.name.split(' ').pop()}
                  </div>
                  <div className="text-[9px] font-semibold text-emerald-400 leading-tight">
                    {node.roleLabel} • {player.rating}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
