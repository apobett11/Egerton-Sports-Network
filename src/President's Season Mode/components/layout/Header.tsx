import React from 'react';
import { Sun, Moon, Shield, Calendar, PlusCircle, ArrowLeft } from 'lucide-react';
import type { SeasonModeView } from '../../types/seasonMode';

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
  activeView: SeasonModeView;
  setActiveView: (view: SeasonModeView) => void;
  onOpenAddFriendly: () => void;
  onOpenCalendar: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  toggleTheme,
  activeView,
  setActiveView,
  onOpenAddFriendly,
  onOpenCalendar,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full select-none shadow-md bg-[#0e1e2d] text-white border-b border-[#14263b] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Branding with Flashscore Wedges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            <div className="w-2.5 h-6 bg-[#ff0046] transform -skew-x-12 rounded-[1.5px]" />
            <div className="w-1.5 h-6 bg-white transform -skew-x-12 rounded-[1.5px] opacity-90" />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight uppercase text-white font-sans">
                ESN
              </span>
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#ff0046]/15 text-[#ff0046] border border-[#ff0046]/30 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff0046] animate-pulse" />
                Live Operations
              </span>
            </div>
            <span className="text-[8.5px] font-bold tracking-widest uppercase text-slate-400 mt-0.5">
              SEASON CONTROL CENTRE • EPL & CHAMPIONSHIPS
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenAddFriendly}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider transition-colors shadow-xs cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Friendly</span>
          </button>

          <button
            onClick={onOpenCalendar}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#ff0046]" />
            <span className="hidden sm:inline">Calendar</span>
          </button>

          <button
            onClick={() => (window.location.hash = '/home')}
            title="Return to Public Hub"
            className="p-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className="p-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer flex items-center justify-center"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
