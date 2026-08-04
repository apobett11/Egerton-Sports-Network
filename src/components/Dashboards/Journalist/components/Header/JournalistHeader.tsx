import React from 'react';
import { User, Bell, Settings, LogOut, Sun, Moon } from 'lucide-react';

interface JournalistHeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLogout?: () => void;
}

export const JournalistHeader: React.FC<JournalistHeaderProps> = ({
  darkMode,
  setDarkMode,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenProfile,
  onOpenSettings,
  onLogout,
}) => {
  const headerBg = darkMode
    ? 'bg-[#0F172A]/90 border-slate-800 text-slate-100'
    : 'bg-white/90 border-slate-200 text-slate-900';

  return (
    <header className={`sticky top-0 z-30 h-16 w-full ${headerBg} backdrop-blur-md border-b transition-colors`}>
      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* BRAND & TITLE */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-900/20">
            J
          </div>
          <div>
            <h1 className="font-extrabold text-sm md:text-base tracking-tight leading-none">
              Press Newsroom
            </h1>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Official Journalist Console
            </p>
          </div>
        </div>

        {/* CONTROLS: PROFILE, NOTIFICATIONS, SETTINGS, LOGOUT */}
        <div className="flex items-center gap-2">
          {/* THEME TOGGLE */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* PROFILE BUTTON */}
          <button
            onClick={onOpenProfile}
            aria-label="Open Profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-xs font-bold"
            title="Journalist Profile"
          >
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Profile</span>
          </button>

          {/* NOTIFICATIONS BUTTON */}
          <button
            onClick={onOpenNotifications}
            aria-label="Open Notifications"
            className="relative p-2.5 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* SETTINGS BUTTON */}
          <button
            onClick={onOpenSettings}
            aria-label="Open Settings"
            className="p-2.5 rounded-xl border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* LOGOUT BUTTON */}
          {onLogout && (
            <button
              onClick={onLogout}
              aria-label="Log Out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer ml-1"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
