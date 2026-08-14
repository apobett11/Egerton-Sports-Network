import React, { useState } from 'react';
import { 
  Menu, Sun, Moon, Calendar, ChevronLeft, ChevronRight, 
  ShieldCheck, AlertTriangle, CheckCircle2, Trophy, Bell, User, LogOut
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
    <header className="sticky top-0 z-40 w-full shadow-xl backdrop-blur-xl select-none bg-white/95 dark:bg-[#0A0E1A]/95 text-slate-800 dark:text-slate-200 border-b border-slate-200/90 dark:border-slate-800/90 transition-all duration-300">
      {/* Row 1: Guest Style Brand & Header Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => { window.location.hash = '/home'; }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] via-amber-500 to-emerald-600 flex items-center justify-center font-black text-slate-950 shadow-md ring-1 ring-[#D4AF37]/50 group-hover:scale-105 transition-transform duration-300">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-[#D4AF37] transition-colors">
                Egerton Sports
              </span>
              <span className="text-[9px] font-extrabold tracking-widest text-[#D4AF37] uppercase -mt-0.5">
                Official Referee Portal
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls styled like guest page */}
        <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-[#162032]/90 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/70 shadow-inner">
          {/* Official Role Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{currentUserName}</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/70 active:scale-90 transition-all cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Logout / Exit Portal Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs active:scale-95 transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Row 2: Ecosystem Continuity Banner */}
      <div className="border-t border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-[#12192B]/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar px-4 py-2 max-w-7xl mx-auto text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-[11px] sm:text-xs">
              Official Match Control • Egerton Premier League & Championships
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Assigned Official
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono">
              FKF Accredited
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Date Navigator Strip */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0E1524]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => changeDate(-1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#182236] hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">Previous Day</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
              {formatDateLabel(selectedDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className="px-2.5 py-1.5 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => changeDate(1)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#182236] hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-700/60"
              title="Next Day"
            >
              <span className="hidden sm:inline">Next Day</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {authError && (
        <div className="p-3 bg-rose-500/15 border-b border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>{authError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}
    </header>
  );
};
