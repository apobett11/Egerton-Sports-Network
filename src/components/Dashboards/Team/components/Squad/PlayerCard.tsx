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
  // Border & Glow styling according to player position
  const getPositionBorderStyles = () => {
    const pos = (player.position || player.defaultPosition || '').toUpperCase();
    if (pos === 'GK') {
      return 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/40';
    }
    if (['LB', 'CB', 'RB', 'DF', 'DEF', 'LWB', 'RWB'].includes(pos)) {
      return 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/40';
    }
    if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'MD', 'MID'].includes(pos)) {
      return 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)] ring-1 ring-emerald-400/40';
    }
    // Strikers / Forwards
    return 'border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.45)] ring-1 ring-rose-400/40';
  };

  const getThemeBackgroundStyles = () => {
    switch (player.cardTheme) {
      case 'purple':
        return 'bg-gradient-to-br from-[#2a1355] via-[#1a1c52] to-[#0c2452] text-white';
      case 'epic':
        return 'bg-gradient-to-br from-[#3b0f19] via-[#4d1624] to-[#1f153a] text-white';
      case 'blue':
        return 'bg-gradient-to-br from-[#0c2e66] via-[#163e7c] to-[#091e42] text-white';
      case 'gold':
        return 'bg-gradient-to-br from-[#453616] via-[#5c491e] to-[#211a0b] text-white';
      case 'black':
      default:
        return 'bg-gradient-to-br from-[#181a1d] via-[#121417] to-[#08090a] text-white';
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
      className={`relative cursor-grab active:cursor-grabbing transition-all duration-100 hover:scale-105 active:scale-95 group flex flex-col items-center ${
        isDragging ? 'opacity-25 scale-95' : 'opacity-100'
      } ${isSwapTarget ? 'scale-110 z-40' : ''} ${className}`}
    >
      {/* Outer Card Container with Position Border */}
      <div
        className={`relative overflow-hidden rounded-[8px] border-[2px] flex flex-col justify-between efootball-card-shadow transition-all duration-100 ${getThemeBackgroundStyles()} ${getPositionBorderStyles()} ${
          isSmall ? 'w-[48px] h-[58px] p-0.5' : 'w-[54px] h-[66px] sm:w-[58px] sm:h-[70px] p-1'
        } ${
          isSwapTarget
            ? 'ring-2 ring-[#00e5ff] ring-offset-1 ring-offset-black shadow-[0_0_22px_#00e5ff]'
            : ''
        }`}
      >
        {/* Holographic light streak */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-50 card-shimmer-sweep" />

        {/* Top Data: Position & Overall Rating */}
        <div className="relative z-10 flex flex-col items-start leading-none pointer-events-none">
          <span
            className={`font-sans font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${
              isSmall ? 'text-[8px]' : 'text-[9px]'
            }`}
          >
            {player.position}
          </span>

          <span
            className={`font-efootball-num font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${
              isSmall ? 'text-[14px] mt-0.5' : 'text-[17px] mt-0.5'
            }`}
          >
            {player.rating}
          </span>
        </div>

        {/* Player Portrait Image */}
        <div
          className={`absolute right-[-2px] bottom-0 z-0 pointer-events-none flex items-end justify-end ${
            isSmall ? 'w-[36px] h-[46px]' : 'w-[42px] h-[54px] sm:w-[46px] sm:h-[58px]'
          }`}
        >
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full object-contain object-bottom drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
            draggable={false}
          />
        </div>

        {/* Bottom Left: Flag / Badge */}
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

        {/* Captain Marker: Bright Orange Band */}
        {player.isCaptain && (
          <div className="absolute bottom-0.5 left-0.5 z-20 bg-orange-500 text-white border border-orange-300 rounded-[2px] px-1 py-0 text-[8px] font-black tracking-tighter shadow-md leading-none">
            C
          </div>
        )}
      </div>

      {/* Player Name Tag Displayed by Default */}
      <div className="mt-0.5 text-center pointer-events-none">
        <div className="inline-block bg-[#080d1a]/90 backdrop-blur-xs border border-white/20 text-white px-1 py-0.5 rounded text-[8px] sm:text-[8.5px] font-bold truncate max-w-[62px] sm:max-w-[70px] shadow-md leading-tight">
          {player.name.split(' ').pop() || player.name}
        </div>
      </div>
    </div>
  );
};

