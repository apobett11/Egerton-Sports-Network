import React from 'react';
import { Player } from './types';
import { PlayerCard } from './PlayerCard';

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
      {/* Sliding Clean White Panel Container matching WA0045 */}
      <div className="w-[180px] sm:w-[195px] h-full bg-white shadow-2xl flex flex-col justify-start pt-3.5 pb-2 px-2.5 animate-in slide-in-from-left duration-200 drawer-spring border-r border-gray-200 select-none overflow-y-auto">
        {/* 2-Column Grid of Substitute Players matching WA0045 */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-3 auto-rows-max items-start justify-items-center">
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

      {/* Dimmed backdrop area (click to close) */}
      <div
        onClick={onClose}
        className="flex-1 bg-black/30 backdrop-blur-[1px] cursor-pointer"
      />
    </div>
  );
};
