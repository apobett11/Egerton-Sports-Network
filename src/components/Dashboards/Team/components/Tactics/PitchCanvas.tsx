import React, { useState } from 'react';
import type { Player } from '../../types';
import { formationCoordinates } from '../../mockData';

interface PitchCanvasProps {
  formation: string;
  startingXI: number[];
  roster: Player[];
  selectedPitchSlot: number | null;
  setSelectedPitchSlot: (slot: number | null) => void;
  onSwapPitchSlots?: (slotA: number, slotB: number) => void;
  onSwapWithBench?: (pitchSlot: number, benchPlayerIndex: number) => void;
  isCoach?: boolean;
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({
  formation,
  startingXI,
  roster,
  selectedPitchSlot,
  setSelectedPitchSlot,
  onSwapPitchSlots,
  onSwapWithBench,
  isCoach = true,
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const activeCoordinates = formationCoordinates[formation] || formationCoordinates['4-4-1-1'];

  const handleDragStart = (e: React.DragEvent, slotIndex: number, playerIndex: number) => {
    if (!isCoach) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'PITCH', slotIndex, playerIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    if (!isCoach) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotIndex) setDragOverSlot(slotIndex);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, targetSlotIndex: number) => {
    if (!isCoach) return;
    e.preventDefault();
    setDragOverSlot(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.type === 'PITCH') {
        const sourceSlotIndex = data.slotIndex;
        if (sourceSlotIndex !== targetSlotIndex && onSwapPitchSlots) {
          onSwapPitchSlots(sourceSlotIndex, targetSlotIndex);
        }
      } else if (data.type === 'BENCH') {
        const benchRosterIndex = data.rosterIndex;
        if (onSwapWithBench) {
          onSwapWithBench(targetSlotIndex, benchRosterIndex);
        }
      }
    } catch (err) {
      console.error('Drop handling error:', err);
    }
  };

  const handleSlotClick = (nodeIdx: number) => {
    if (selectedPitchSlot !== null && selectedPitchSlot !== nodeIdx && isCoach && onSwapPitchSlots) {
      onSwapPitchSlots(selectedPitchSlot, nodeIdx);
      setSelectedPitchSlot(null);
    } else {
      setSelectedPitchSlot(selectedPitchSlot === nodeIdx ? null : nodeIdx);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* 2D PITCH CANVAS CONTAINER */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] md:aspect-[4/5] bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 rounded-2xl border-2 border-[#2A2A2A] shadow-2xl overflow-hidden select-none">
        {/* Grass Texture Stripes */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
        <div className="absolute inset-0 flex flex-col justify-between opacity-20 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`h-full ${i % 2 === 0 ? 'bg-black/30' : 'bg-transparent'}`} />
          ))}
        </div>

        {/* Pitch Lines */}
        <div className="absolute inset-3 sm:inset-4 border-2 border-white/30 rounded-lg pointer-events-none" />
        <div className="absolute top-1/2 left-3 right-3 sm:left-4 sm:right-4 h-0.5 bg-white/30 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-32 sm:h-32 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 bg-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        {/* Penalty Areas */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-16 sm:h-20 border-b-2 border-x-2 border-white/30 rounded-b-md pointer-events-none" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-16 sm:h-20 border-t-2 border-x-2 border-white/30 rounded-t-md pointer-events-none" />

        {/* Player Nodes */}
        {activeCoordinates.map((node, nodeIdx) => {
          const playerIdx = startingXI[nodeIdx];
          const player = roster[playerIdx];
          const isSelected = selectedPitchSlot === nodeIdx;
          const isDragTarget = dragOverSlot === nodeIdx;

          if (!player) return null;

          const isUnavailable =
            player.status === 'Injured' ||
            player.status === 'Suspended' ||
            player.isInjured ||
            player.isSuspended ||
            (player.redCards && player.redCards > 0);

          return (
            <div
              key={`pitch_node_${nodeIdx}`}
              style={{ top: node.top, left: node.left }}
              draggable={isCoach}
              onDragStart={(e) => handleDragStart(e, nodeIdx, playerIdx)}
              onDragOver={(e) => handleDragOver(e, nodeIdx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, nodeIdx)}
              onClick={() => handleSlotClick(nodeIdx)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer group focus:outline-none z-10 ${
                isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
              } ${isDragTarget ? 'scale-125 ring-4 ring-amber-400 rounded-full' : ''}`}
            >
              <div className="relative flex flex-col items-center">
                {/* Avatar Badge */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 p-0.5 bg-[#1A1A1A] shadow-xl flex items-center justify-center overflow-hidden transition-all ${
                    isUnavailable
                      ? 'border-rose-500 ring-2 ring-rose-500/50'
                      : isSelected
                      ? 'border-emerald-400 ring-4 ring-emerald-500/50 shadow-emerald-500/50'
                      : 'border-white/50 group-hover:border-emerald-400'
                  }`}
                >
                  <img
                    src={player.cardImage}
                    alt={player.name}
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                  />
                </div>

                {/* Jersey Number */}
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-full border border-[#111111] shadow">
                  {player.number}
                </div>

                {/* Condition / Warning Indicator */}
                {isUnavailable && (
                  <div className="absolute -top-1 -left-1 bg-rose-600 text-white text-[8px] font-bold px-1 rounded-full border border-black animate-pulse">
                    !
                  </div>
                )}

                {/* Name & Role Label */}
                <div className="mt-1 bg-[#111111]/90 backdrop-blur-md border border-[#2A2A2A] px-2 py-0.5 rounded-md text-center max-w-[85px] shadow-lg">
                  <div className="text-[10px] font-bold text-white truncate leading-tight">
                    {player.name.split(' ').pop()}
                  </div>
                  <div className="text-[9px] font-semibold text-emerald-400 leading-tight">
                    {node.roleLabel} • {player.rating}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PitchCanvas;

