import React from 'react';
import { Player } from './types';

interface PlayerCardProps {
  player: Player;
  isDragging?: boolean;
  isSwapTarget?: boolean;
  onDragStart?: (e: React.DragEvent, player: Player) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetPlayer: Player) => void;
  onClick?: () => void;
  viewMode?: 'standard' | 'detailed' | 'jersey';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isDragging = false,
  isSwapTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onClick,
  viewMode = 'standard',
  className = '',
  size = 'md',
}) => {
  const getThemeStyles = () => {
    switch (player.cardTheme) {
      case 'purple':
        return 'bg-gradient-to-br from-[#3b1d7d] via-[#282d79] to-[#124286] border-[#a78bfa] text-white shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_12px_rgba(167,139,250,0.3)]';
      case 'epic':
        return 'bg-gradient-to-br from-[#2a131b] via-[#481d28] to-[#1b193a] border-[#f59e0b] text-white shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_12px_rgba(245,158,11,0.3)]';
      case 'blue':
        return 'bg-gradient-to-br from-[#0f3470] via-[#1a4484] to-[#0c244d] border-[#60a5fa] text-white shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_12px_rgba(96,165,250,0.3)]';
      case 'gold':
        return 'bg-gradient-to-br from-[#4a3b1a] via-[#665223] to-[#261f0e] border-[#fbbf24] text-white shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_12px_rgba(251,191,36,0.3)]';
      case 'black':
      default:
        return 'bg-gradient-to-br from-[#22252a] via-[#1a1c20] to-[#101114] border-white/80 text-white shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_12px_rgba(255,255,255,0.2)]';
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, player)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver && onDragOver(e);
      }}
      onDrop={(e) => onDrop && onDrop(e, player)}
      onClick={onClick}
      className={`relative cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-105 active:scale-95 group ${
        isDragging ? 'opacity-30 scale-95' : 'opacity-100'
      } ${isSwapTarget ? 'scale-110 z-40' : ''} ${className}`}
    >
      {/* Outer Card Container with 2px border and border-radius */}
      <div
        className={`relative overflow-hidden rounded-[8px] border-2 flex flex-col justify-between efootball-card-shadow card-float transition-all duration-200 ${getThemeStyles()} ${
          isSmall ? 'w-[48px] h-[55px] p-0.5' : 'w-[55px] h-[63px] sm:w-[58px] sm:h-[66px] p-1'
        } ${
          isSwapTarget
            ? 'ring-2 ring-[#00e5ff] ring-offset-2 ring-offset-black/80 shadow-[0_0_24px_#00e5ff]'
            : ''
        }`}
      >
        {/* Holographic light streaks inside card with animated shimmer sweep */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none opacity-70 card-shimmer-sweep" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* Top & Left Data: Position, Rating, Flag/Club */}
        <div className="relative z-10 flex flex-col items-start leading-none pointer-events-none">
          {/* Position Name */}
          <span
            className={`font-sans font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${
              isSmall ? 'text-[8px]' : 'text-[9.5px]'
            }`}
          >
            {player.position}
          </span>

          {/* Rating Number */}
          <span
            className={`font-efootball-num font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${
              isSmall ? 'text-[15px] mt-0.5' : 'text-[18px] mt-0.5'
            }`}
          >
            {player.rating}
          </span>
        </div>

        {/* Player Avatar / Headshot (positioned to the right & bottom) */}
        <div
          className={`absolute right-[-3px] bottom-0 z-0 pointer-events-none flex items-end justify-end ${
            isSmall ? 'w-[36px] h-[44px]' : 'w-[41px] h-[50px] sm:w-[44px] sm:h-[53px]'
          }`}
        >
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full object-contain object-bottom drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-105"
            draggable={false}
          />
        </div>

        {/* Bottom Left: Flag or Club Badge */}
        <div className="relative z-10 mt-auto flex items-center gap-0.5 pointer-events-none">
          {player.flagUrl ? (
            <img
              src={player.flagUrl}
              alt="Flag"
              className={`${
                isSmall ? 'w-3 h-2' : 'w-3.5 h-2.5'
              } rounded-[1px] object-cover shadow border border-black/50`}
            />
          ) : player.clubLogoUrl ? (
            <img
              src={player.clubLogoUrl}
              alt="Club"
              className={`${
                isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'
              } object-contain drop-shadow`}
            />
          ) : null}
        </div>

        {/* Captain Band Marker [C] */}
        {player.isCaptain && (
          <div className="absolute bottom-0.5 left-0.5 z-20 bg-[#111827]/95 border border-white/90 text-white rounded-[2px] px-0.5 py-0 text-[7px] font-black tracking-tighter shadow-md">
            C
          </div>
        )}
      </div>

      {/* Floating Player Name / Rating Tag underneath if in detailed mode */}
      {viewMode === 'detailed' && (
        <div className="mt-0.5 text-center">
          <div className="inline-block bg-black/85 backdrop-blur-sm border border-white/30 text-white px-1 py-0.5 rounded text-[8px] font-semibold truncate max-w-[68px] shadow-lg">
            {player.name}
          </div>
        </div>
      )}
    </div>
  );
};
