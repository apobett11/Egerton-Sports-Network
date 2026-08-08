import React from 'react';
import { Sun, Moon, Shield, UserPlus, UserCheck, ChevronRight } from 'lucide-react';
import type { SeasonModeView } from '../../types/seasonMode';

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
  activeView: SeasonModeView;
  setActiveView: (view: SeasonModeView) => void;
  onOpenCoachModal: () => void;
  onOpenRefModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  toggleTheme,
  activeView,
  setActiveView,
  onOpenCoachModal,
  onOpenRefModal,
}) => {
  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-200 ${
        isDark ? 'bg-[#090D16]/90 border-slate-800/80 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left branding & section path */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black tracking-tight text-lg ring-1 ring-white/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                President&apos;s Season Mode
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Pre-Season Intake
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Egerton Sports Ecosystem — Registration, Team & Referee Foundation
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenCoachModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-sm transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden md:inline">Coach Registration</span>
          </button>

          <button
            onClick={onOpenRefModal}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-extrabold text-xs cursor-pointer transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline">Referee Intake</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
