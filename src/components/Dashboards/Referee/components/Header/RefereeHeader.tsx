import React, { useState } from 'react';
import { 
  Sun, Moon, ShieldCheck, AlertTriangle, CheckCircle2, LogOut
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';

interface RefereeHeaderProps {
  currentUserName: string;
  activeRefereeId?: string;
  refereesList?: any[];
  onSelectRefereeId?: (id: string) => void;
  isUnavailable?: boolean;
  onToggleAvailability?: (setUnavailable: boolean) => Promise<void> | void;
  authError?: string | null;
  successMsg?: string | null;
  selectedDate?: Date;
  setSelectedDate?: (date: Date) => void;
  onLogout?: () => void;
}

export const RefereeHeader: React.FC<RefereeHeaderProps> = ({
  authError,
  successMsg,
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
      <div className="flex items-center justify-between px-4 py-2.5 max-w-7xl mx-auto gap-3">
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
                REFEREES DASHBOARD
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls styled like guest page */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unified Match Officials Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-[#152a40] border border-slate-200 dark:border-[#1a2e45] text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Referees Dashboard</span>
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
