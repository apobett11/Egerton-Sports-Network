import React, { useState } from 'react';
import { 
  Sun, Moon, ChevronLeft, ChevronRight, 
  ShieldCheck, AlertTriangle, CheckCircle2, Trophy, LogOut
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';

interface RefereeHeaderProps {
  currentUserName: string;
  authError: string | null;
  successMsg: string | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onLogout?: () => void;
}

export const RefereeHeader: React.FC<RefereeHeaderProps> = ({
  currentUserName,
  authError,
  successMsg,
  selectedDate,
  setSelectedDate,
  onLogout,
}) => {
  const { logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      window.location.hash = '/home';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full select-none bg-white dark:bg-[#0e1e2d] text-slate-800 dark:text-slate-100 border-b border-[#e6e8ec] dark:border-[#1a2e45] shadow-md transition-colors duration-200">
      {/* Row 1: Flashscore Style Brand & Header Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => { window.location.hash = '/home'; }}>
            <div className="flex items-center gap-0.5">
              <div className="w-2.5 h-6 bg-[#ff0046] transform -skew-x-12 rounded-[1.5px]" />
              <div className={`w-1.5 h-6 ${isDarkMode ? 'bg-white' : 'bg-slate-800'} transform -skew-x-12 rounded-[1.5px] opacity-90`} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-base sm:text-lg tracking-tight uppercase text-slate-900 dark:text-white font-sans group-hover:text-[#ff0046] transition-colors">
                ESN REFEREE
              </span>
              <span className="text-[8.5px] font-black tracking-widest uppercase text-slate-400 mt-0.5">
                OFFICIAL MATCH CENTER
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls styled like guest page */}
        <div className="flex items-center gap-2">
          {/* Official Role Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-[#152a40] border border-slate-200 dark:border-[#1a2e45] text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{currentUserName}</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-md bg-slate-100 dark:bg-[#152a40] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Logout / Exit Portal Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#152a40] hover:bg-[#ff0046] text-white border border-white/10 hover:border-[#ff0046] font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Row 2: Ecosystem Continuity Banner */}
      <div className="border-t border-b border-[#e6e8ec] dark:border-[#1a2e45] bg-slate-50 dark:bg-[#0e1c2b] transition-colors duration-200">
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar px-4 py-2 max-w-7xl mx-auto text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-sm bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/30">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight text-[11px] sm:text-xs">
              Official Match Control • Egerton Premier League & Championships
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-sm border border-emerald-500/30">
              Assigned Official
            </span>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-[#152a40] px-2.5 py-0.5 rounded-sm border border-slate-300/60 dark:border-[#1a2e45] font-mono">
              FKF Accredited
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Date Navigator Strip */}
      <div className="border-b border-[#e6e8ec] dark:border-[#1a2e45] bg-white dark:bg-[#0e1e2d] transition-colors duration-200">
        <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => changeDate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-[#152a40] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-white/10 transition-colors cursor-pointer group"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Previous Day</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#ff0046] flex items-center gap-2 font-sans">
              {formatDateLabel(selectedDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 rounded-md bg-[#ff0046]/10 hover:bg-[#ff0046]/20 border border-[#ff0046]/30 text-[#ff0046] text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => changeDate(1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-[#152a40] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider border border-slate-200 dark:border-white/10 transition-colors cursor-pointer group"
              title="Next Day"
            >
              <span className="hidden sm:inline">Next Day</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {authError && (
        <div className="p-3 bg-rose-500/10 border-b border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>{authError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}
    </header>
  );
};
