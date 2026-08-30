import React from 'react';
import { Player } from './types';
import { PlayerCard } from './PlayerCard';
import { X } from 'lucide-react';

interface SubstitutesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  substitutes: Player[];
  onDragStart: (e: React.DragEvent, player: Player) => void;
  onSwapWithPitch: (subPlayerId: string, pitchPlayerId: string) => void;
}

export const SubstitutesDrawer: React.FC<SubstitutesDrawerProps> = ({
  isOpen,
  onClose,
  substitutes,
  onDragStart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 left-0 z-40 flex animate-in fade-in duration-150">
      {/* Sliding Clean White Panel Container with top-right X close button */}
      <div className="w-[185px] sm:w-[200px] h-full bg-white shadow-2xl flex flex-col justify-start pt-2.5 pb-2 px-2.5 animate-in slide-in-from-left duration-200 drawer-spring border-r border-gray-200 select-none">
        {/* Drawer Header with Title and X Close Button */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-1">
          <span className="text-[13px] font-bold tracking-tight text-gray-800 uppercase font-sans">
            Substitutes
          </span>
          <button
            onClick={onClose}
            title="Close Substitutes"
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors active:scale-90 focus:outline-none cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2-Column Grid of Substitute Players matching WA0045 */}
        <div className="flex-1 overflow-y-auto pr-0.5 no-scrollbar">
          <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 auto-rows-max items-start justify-items-center">
            {substitutes.map((sub) => (
              <div key={sub.id} className="flex justify-center">
                <PlayerCard
                  player={sub}
                  size="sm"
                  onDragStart={(e, p) => {
                    onDragStart(e, p);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dimmed backdrop area (click to close) */}
      <div
        onClick={onClose}
        className="flex-1 bg-black/30 backdrop-blur-[1px] cursor-pointer"
      />
    </div>
  );
};
