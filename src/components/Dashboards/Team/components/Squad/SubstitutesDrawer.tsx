import React from 'react';
import { Player } from './types';
import { PlayerCard } from './PlayerCard';
import { X, Users } from 'lucide-react';

interface SubstitutesDrawerProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  substitutes: Player[];
  onDragStart: (e: React.DragEvent, player: Player) => void;
  onSwapWithPitch: (subPlayerId: string, pitchPlayerId: string) => void;
  onSubDirectly?: (player: Player) => void;
}

export const SubstitutesDrawer: React.FC<SubstitutesDrawerProps> = ({
  isOpen,
  title = 'Substitutes',
  onClose,
  substitutes,
  onDragStart,
  onSubDirectly,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 left-0 z-40 flex animate-in fade-in duration-100">
      {/* Sliding Panel Container */}
      <div className="w-[195px] sm:w-[215px] h-full bg-[#0d1424] text-white shadow-2xl flex flex-col justify-start pt-3 pb-2 px-2.5 animate-in slide-in-from-left duration-150 border-r border-[#1e2d4d] select-none">
        {/* Drawer Header with Title and X Close Button */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#1e2d4d] px-1">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[12px] sm:text-[13px] font-black tracking-tight text-white uppercase font-sans">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            title="Close Drawer"
            className="w-6 h-6 rounded-full bg-[#1e2d4d] hover:bg-[#2b3e6b] text-slate-300 flex items-center justify-center transition-colors active:scale-90 focus:outline-none cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* 2-Column Grid of Substitute/Reserve Players with Position Borders */}
        <div className="flex-1 overflow-y-auto pr-0.5 no-scrollbar">
          {substitutes.length === 0 ? (
            <div className="text-center text-xs text-slate-500 py-8 px-2">
              No players available in this list.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 auto-rows-max items-start justify-items-center">
              {substitutes.map((sub) => (
                <div key={sub.id} className="flex justify-center">
                  <PlayerCard
                    player={sub}
                    size="sm"
                    onClick={() => onSubDirectly && onSubDirectly(sub)}
                    onDragStart={(e, p) => {
                      onDragStart(e, p);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dimmed backdrop area (click to close) */}
      <div
        onClick={onClose}
        className="flex-1 bg-black/40 backdrop-blur-[1px] cursor-pointer"
      />
    </div>
  );
};

