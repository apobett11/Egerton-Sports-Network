import React, { useState, useRef } from 'react';
import type { Player, PitchNodeCoordinate, FormationName } from '../../types';

interface PitchCanvasProps {
  formation: FormationName;
  nodes: PitchNodeCoordinate[];
  startingXI: number[];
  roster: Player[];
  selectedPitchSlot: number | null;
  setSelectedPitchSlot: (slot: number | null) => void;
  onSwapSlots?: (sourceSlot: number, targetSlot: number) => void;
  isCaptain?: boolean;
}

export function formatPitchPlayerName(player: Player): string {
  if (player.nickname && player.nickname.trim()) {
    return player.nickname.trim();
  }
  const parts = player.name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastName = parts[parts.length - 1];
  return `${firstInitial}. ${lastName}`;
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({
  formation,
  nodes,
  startingXI,
  roster,
  selectedPitchSlot,
  setSelectedPitchSlot,
  onSwapSlots,
  isCaptain = false,
}) => {
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const pitchRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, slotIdx: number) => {
    setDraggedSlot(slotIdx);
    e.dataTransfer.setData('text/plain', String(slotIdx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotIdx) {
      setDragOverSlot(slotIdx);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSlotIdx: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (draggedSlot !== null && draggedSlot !== targetSlotIdx && onSwapSlots) {
      onSwapSlots(draggedSlot, targetSlotIdx);
    }
    setDraggedSlot(null);
  };

  const handleDragEnd = () => {
    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* HEADER & INSTRUCTION */}
      <div className="flex items-center justify-between border-b border-[#2A3441] pb-2.5">
        <div>
          <h2 className="text-sm md:text-base font-black tracking-tight text-white flex items-center gap-2">
            <span>2D Tactical Match Pitch</span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Interactive Nodes
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Drag and drop players on top of each other to swap coordinates, or select to modify.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-xl shadow-xs">
            {formation}
          </span>
        </div>
      </div>

      {/* 2D PITCH ARENA WITH BOTTOM/RIGHT COORDINATES */}
      <div
        ref={pitchRef}
        className="relative w-full aspect-[4/5] bg-gradient-to-b from-emerald-900/90 via-emerald-800 to-emerald-950 rounded-3xl border-2 border-[#2A3441] shadow-2xl overflow-hidden select-none"
      >
        {/* Grass Mowing Stripes */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-15 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-full ${i % 2 === 0 ? 'bg-black/25' : 'bg-transparent'}`} />
          ))}
        </div>

        {/* Pitch Lines */}
        <div className="absolute inset-4 border-2 border-white/30 rounded-xl pointer-events-none" />
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/30 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        {/* Penalty Areas */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-52 h-24 border-b-2 border-x-2 border-white/30 rounded-b-lg pointer-events-none" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-52 h-24 border-t-2 border-x-2 border-white/30 rounded-t-lg pointer-events-none" />
        
        {/* Goal Area Boxes */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-10 border-b-2 border-x-2 border-white/30 rounded-b-sm pointer-events-none" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-10 border-t-2 border-x-2 border-white/30 rounded-t-sm pointer-events-none" />

        {/* Dynamic Nodes Placed with Bottom and Right Coordinates */}
        {nodes.map((node, nodeIdx) => {
          const playerIdx = startingXI[nodeIdx];
          const player = roster[playerIdx];
          const isSelected = selectedPitchSlot === nodeIdx;
          const isDragTarget = dragOverSlot === nodeIdx;

          if (!player) return null;

          const formattedDisplayName = formatPitchPlayerName(player);

          return (
            <div
              key={`node_${nodeIdx}`}
              draggable
              onDragStart={(e) => handleDragStart(e, nodeIdx)}
              onDragOver={(e) => handleDragOver(e, nodeIdx)}
              onDrop={(e) => handleDrop(e, nodeIdx)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedPitchSlot(nodeIdx)}
              style={{
                bottom: `${node.bottomPercent}%`,
                right: `${node.rightPercent}%`,
                transform: 'translate(50%, 50%)',
              }}
              className={`absolute transition-all duration-300 cursor-grab active:cursor-grabbing group focus:outline-none flex items-center justify-center z-20 ${
                isSelected ? 'scale-110 z-30' : 'hover:scale-105'
              } ${isDragTarget ? 'ring-4 ring-amber-400 rounded-full scale-125' : ''}`}
            >
              <div className="relative flex flex-col items-center">
                {/* Node Avatar Ring */}
                <div
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-full border-2 p-0.5 bg-[#161B22] shadow-xl flex items-center justify-center overflow-hidden transition-all ${
                    isSelected
                      ? 'border-emerald-400 ring-4 ring-emerald-500/50 shadow-emerald-500/50'
                      : isDragTarget
                      ? 'border-amber-400 ring-4 ring-amber-400/50'
                      : 'border-white/50 group-hover:border-emerald-400'
                  }`}
                >
                  <img
                    src={player.cardImage}
                    alt={player.name}
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                  />
                </div>

                {/* Number Badge */}
                <div className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full border border-slate-900 shadow-xs">
                  {player.number}
                </div>

                {/* Simplified Label: Nickname or (Initial. LastName) then Number */}
                <div className="mt-1 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-2 py-0.5 rounded-lg text-center max-w-[90px] shadow-lg pointer-events-none">
                  <div className="text-[10px] font-black text-white truncate leading-tight">
                    {formattedDisplayName}
                  </div>
                  <div className="text-[9px] font-bold text-emerald-400 leading-tight">
                    #{player.number}
                  </div>
                </div>

                {/* Bottom & Right coordinate hint on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-300 pointer-events-none whitespace-nowrap">
                  B:{Math.round(node.bottomPercent)}% R:{Math.round(node.rightPercent)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
