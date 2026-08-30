import React from 'react';
import { Manager } from './types';
import { ChevronLeft } from 'lucide-react';

interface SidebarProps {
  manager: Manager;
  teamName: string;
  teamCrest: string;
  onOpenManager: () => void;
  onOpenTeam: () => void;
  onOpenSubstitutes: () => void;
  onOpenReserves: () => void;
  activeDrawer: string;
  onBack?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  manager,
  teamName,
  teamCrest,
  onOpenManager,
  onOpenTeam,
  onOpenSubstitutes,
  onOpenReserves,
  activeDrawer,
  onBack,
}) => {
  return (
    <aside className="relative z-30 flex flex-col items-start justify-between h-full py-4 pl-4 pr-1 select-none pointer-events-auto flex-shrink-0">
      {/* Top Stack of 4 Action Icons */}
      <div className="flex flex-col items-center gap-3">
        {/* 1. Manager Avatar Button */}
        <button
          onClick={onOpenManager}
          title="Manager Details"
          className="relative transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none"
        >
          <div className="w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-[18px] bg-[#0c1a40] border-[2.2px] border-[#9cbde8] shadow-lg overflow-hidden flex items-end justify-center p-0.5 relative hover:border-white transition-colors">
            <img
              src={manager.photoUrl}
              alt={manager.name}
              className="w-full h-full object-contain object-bottom scale-110 pointer-events-none"
            />
          </div>
        </button>

        {/* 2. Team Crest Button (Dynamic) */}
        <button
          onClick={onOpenTeam}
          title={`${teamName} Game Plan`}
          className="relative transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none"
        >
          <div className="w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-[18px] bg-white border-[1.5px] border-white/90 shadow-lg overflow-hidden flex items-center justify-center p-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all">
            <img
              src={teamCrest}
              alt={teamName}
              className="w-full h-full object-contain drop-shadow-sm pointer-events-none"
            />
          </div>
        </button>

        {/* 3. Substitutes Jersey Button (with pocket/sub badge) */}
        <button
          onClick={onOpenSubstitutes}
          title="Substitutes Bench"
          className={`relative transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none ${
            activeDrawer === 'substitutes' ? 'ring-2 ring-[#00a8ff]' : ''
          }`}
        >
          <div className="w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-[18px] bg-white border-[1.5px] border-white/90 shadow-lg overflow-hidden flex items-center justify-center p-2.5">
            {/* Jersey with Pocket & Collar */}
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
          className={`relative transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none ${
            activeDrawer === 'reserves' ? 'ring-2 ring-[#00a8ff]' : ''
          }`}
        >
          <div className="w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-[18px] bg-white border-[1.5px] border-white/90 shadow-lg overflow-hidden flex items-center justify-center p-2.5">
            {/* Plain Jersey */}
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
      <div className="mt-auto -ml-4 pb-2">
        <button
          onClick={() => {
            if (activeDrawer !== 'none') {
              onOpenSubstitutes();
            } else if (onBack) {
              onBack();
            }
          }}
          className="w-[145px] h-[38px] bg-[#00a2ff] hover:bg-[#00b0ff] active:bg-[#0090e0] text-white font-bold rounded-r-[14px] flex items-center justify-start pl-3 gap-1.5 shadow-[0_4px_14px_rgba(0,162,255,0.45)] transition-all focus:outline-none active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 stroke-[3.2]" />
          <span className="text-[16px] font-bold tracking-tight font-sans">Back</span>
        </button>
      </div>
    </aside>
  );
};
