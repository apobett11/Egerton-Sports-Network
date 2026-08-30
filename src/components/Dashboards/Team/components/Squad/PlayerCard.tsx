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
        return 'bg-gradient-to-br from-[#351a70] via-[#21246b] to-[#0f3478] border-[#9d80f5] text-white shadow-[0_8px_18px_rgba(0,0,0,0.85)]';
      case 'epic':
        return 'bg-gradient-to-br from-[#3b0f19] via-[#4d1624] to-[#1f153a] border-[#f59e0b] text-white shadow-[0_8px_18px_rgba(0,0,0,0.85)]';
      case 'blue':
        return 'bg-gradient-to-br from-[#0c2e66] via-[#163e7c] to-[#091e42] border-[#5ba0f7] text-white shadow-[0_8px_18px_rgba(0,0,0,0.85)]';
      case 'gold':
        return 'bg-gradient-to-br from-[#453616] via-[#5c491e] to-[#211a0b] border-[#f5b81b] text-white shadow-[0_8px_18px_rgba(0,0,0,0.85)]';
      case 'black':
      default:
        return 'bg-gradient-to-br from-[#1d2024] via-[#15171a] to-[#0c0d0f] border-white/70 text-white shadow-[0_8px_18px_rgba(0,0,0,0.85)]';
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
      className={`relative cursor-grab active:cursor-grabbing transition-all duration-150 hover:scale-105 active:scale-95 group ${
        isDragging ? 'opacity-30 scale-95' : 'opacity-100'
      } ${isSwapTarget ? 'scale-110 z-40' : ''} ${className}`}
    >
      {/* Outer Card Container with authentic eFootball dimensions & borders */}
      <div
        className={`relative overflow-hidden rounded-[7px] border-[1.8px] flex flex-col justify-between efootball-card-shadow card-float transition-all duration-150 ${getThemeStyles()} ${
          isSmall ? 'w-[48px] h-[56px] p-0.5' : 'w-[54px] h-[64px] sm:w-[57px] sm:h-[67px] p-1'
        } ${
          isSwapTarget
            ? 'ring-2 ring-[#00e5ff] ring-offset-1 ring-offset-black shadow-[0_0_20px_#00e5ff]'
            : ''
        }`}
      >
        {/* Holographic light streaks */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none opacity-60 card-shimmer-sweep" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent pointer-events-none" />

        {/* Top & Left Data: Position & Rating */}
        <div className="relative z-10 flex flex-col items-start leading-none pointer-events-none">
          <span
            className={`font-sans font-bold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${
              isSmall ? 'text-[8.5px]' : 'text-[9.5px]'
            }`}
          >
            {player.position}
          </span>

          <span
            className={`font-efootball-num font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${
              isSmall ? 'text-[15px] mt-0.5' : 'text-[18px] mt-0.5'
            }`}
          >
            {player.rating}
          </span>
        </div>

        {/* Player Avatar / Headshot Portrait */}
        <div
          className={`absolute right-[-2px] bottom-0 z-0 pointer-events-none flex items-end justify-end ${
            isSmall ? 'w-[36px] h-[44px]' : 'w-[41px] h-[51px] sm:w-[44px] sm:h-[54px]'
          }`}
        >
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full object-contain object-bottom drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
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
              } rounded-[1px] object-cover shadow border border-black/40`}
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
          <div className="absolute bottom-0.5 left-0.5 z-20 bg-white border border-black/80 text-black rounded-[2px] px-1 py-0 text-[8px] font-black tracking-tighter shadow-md leading-none">
            C
          </div>
        )}
      </div>

      {/* Floating Player Name Tag underneath if in detailed mode */}
      {viewMode === 'detailed' && (
        <div className="mt-0.5 text-center">
          <div className="inline-block bg-black/90 backdrop-blur-sm border border-white/30 text-white px-1 py-0.5 rounded text-[8px] font-semibold truncate max-w-[66px] shadow-lg">
            {player.name}
          </div>
        </div>
      )}
    </div>
  );
};
