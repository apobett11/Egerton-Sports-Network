import React from 'react';
import { Manager, Player } from './types';
import { ChevronLeft } from 'lucide-react';

interface SidebarProps {
  manager: Manager;
  captain?: Player;
  currentRole?: 'COACH' | 'CAPTAIN' | string;
  teamName: string;
  teamCrest: string;
  onOpenManager: () => void;
  onOpenTeam: () => void;
  onOpenRoles: () => void;
  onOpenSubstitutes: () => void;
  onOpenReserves: () => void;
  activeDrawer: string;
  onBack?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  manager,
  captain,
  currentRole = 'COACH',
  teamName,
  teamCrest,
  onOpenManager,
  onOpenTeam,
  onOpenRoles,
  onOpenSubstitutes,
  onOpenReserves,
  activeDrawer,
  onBack,
}) => {
  const isCoach = currentRole === 'COACH';

  return (
    <aside className="relative z-30 flex flex-col items-start justify-between h-full py-3.5 pl-3 sm:pl-4 pr-1 select-none pointer-events-auto flex-shrink-0">
      {/* Top Stack of 4 Action Icons in curved dark dock */}
      <div className="flex flex-col items-center gap-2.5 bg-[#03091e]/90 p-1.5 rounded-[22px] border border-[#142352]/70 shadow-2xl backdrop-blur-md">
        {/* 1. Dynamic Top Avatar: Coach sees Captain; Captain sees Coach */}
        <button
          onClick={isCoach ? onOpenRoles : onOpenManager}
          title={isCoach ? `Team Captain: ${captain?.name || 'Captain'}` : `Head Coach: ${manager.name}`}
          className="relative transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer group"
        >
          <div className="w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] rounded-[16px] bg-[#0c1a40] border-[2px] border-[#6b8cbe] shadow-md overflow-hidden flex items-end justify-center p-0.5 relative hover:border-white transition-colors">
            <img
              src={isCoach ? (captain?.photoUrl || manager.photoUrl) : manager.photoUrl}
              alt={isCoach ? (captain?.name || 'Captain') : manager.name}
              className="w-full h-full object-contain object-bottom scale-110 pointer-events-none"
            />
            {/* Captain Badge if Coach is viewing Captain */}
            {isCoach && (
              <div className="absolute bottom-0.5 right-0.5 bg-amber-400 text-black font-black text-[8.5px] px-1 rounded shadow leading-tight">
                C
              </div>
            )}
          </div>
        </button>

        {/* 2. Team Crest Button */}
        <button
          onClick={onOpenTeam}
          title={`${teamName} Game Plan`}
          className="relative transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
        >
          <div className="w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] rounded-[16px] bg-white border border-white/90 shadow-md overflow-hidden flex items-center justify-center p-1.5 hover:shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all">
            <img
              src={teamCrest}
              alt={teamName}
              className="w-full h-full object-contain drop-shadow-sm pointer-events-none"
            />
          </div>
        </button>

        {/* 3. Substitutes Jersey Button (with pocket badge) */}
        <button
          onClick={onOpenSubstitutes}
          title="Substitutes Bench"
          className={`relative transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer ${
            activeDrawer === 'substitutes' ? 'ring-2 ring-[#00a8ff] rounded-[16px]' : ''
          }`}
        >
          <div className="w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] rounded-[16px] bg-white border border-white/90 shadow-md overflow-hidden flex items-center justify-center p-2">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-[#0080ff] fill-current drop-shadow-sm pointer-events-none"
            >
              <path d="M 28,26 L 38,18 C 42,26 58,26 62,18 L 72,26 L 87,38 L 77,53 L 68,45 L 68,83 L 32,83 L 32,45 L 23,53 L 13,38 Z" />
              <path d="M 38,18 C 42,26 58,26 62,18" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="54" y="44" width="9.5" height="12.5" rx="2" fill="white" />
            </svg>
          </div>
        </button>

        {/* 4. Reserves Jersey Button (plain) */}
        <button
          onClick={onOpenReserves}
          title="Reserves Squad"
          className={`relative transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer ${
            activeDrawer === 'reserves' ? 'ring-2 ring-[#00a8ff] rounded-[16px]' : ''
          }`}
        >
          <div className="w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] rounded-[16px] bg-white border border-white/90 shadow-md overflow-hidden flex items-center justify-center p-2">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-[#0080ff] fill-current drop-shadow-sm pointer-events-none"
            >
              <path d="M 28,26 L 38,18 C 42,26 58,26 62,18 L 72,26 L 87,38 L 77,53 L 68,45 L 68,83 L 32,83 L 32,45 L 23,53 L 13,38 Z" />
              <path d="M 38,18 C 42,26 58,26 62,18" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
        </button>
      </div>

      {/* Bottom Back Button */}
      <div className="mt-auto -ml-3 sm:-ml-4 pb-1">
        <button
          onClick={() => {
            if (activeDrawer !== 'none') {
              onOpenSubstitutes();
            } else if (onBack) {
              onBack();
            }
          }}
          className="w-[136px] sm:w-[146px] h-[38px] bg-[#00a2ff] hover:bg-[#00b4ff] active:bg-[#0090e0] text-white font-bold rounded-r-[14px] flex items-center justify-start pl-3 gap-1 shadow-[0_4px_16px_rgba(0,162,255,0.5)] transition-all focus:outline-none active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 stroke-[3.2]" />
          <span className="text-[15.5px] font-bold tracking-tight font-sans">Back</span>
        </button>
      </div>
    </aside>
  );
};
