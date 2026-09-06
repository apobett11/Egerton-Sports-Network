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
  return (
    <header className="sticky top-0 z-40 w-full select-none shadow-md bg-[#0e1e2d] text-white border-b border-[#1a2e45]">
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        {/* BRAND & TITLE WITH FLASHSCORE BRAND MARK */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5" aria-hidden="true">
            <div className="w-2.5 h-6 bg-[#ff0046] transform -skew-x-12 rounded-[1.5px]" />
            <div className="w-1.5 h-6 bg-white transform -skew-x-12 rounded-[1.5px] opacity-90" />
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="font-black tracking-wider text-sm sm:text-base uppercase text-white font-sans">
              Press Newsroom
            </h1>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-0.5">
              Official Journalist Console
            </span>
          </div>
        </div>

        {/* CONTROLS: THEME, PROFILE, NOTIFICATIONS, SETTINGS, LOGOUT */}
        <div className="flex items-center gap-2">
          {/* THEME TOGGLE */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
            className="p-2 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {/* PROFILE BUTTON */}
          <button
            onClick={onOpenProfile}
            aria-label="Open Profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer"
            title="Journalist Profile"
          >
            <User className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Profile</span>
          </button>

          {/* NOTIFICATIONS BUTTON */}
          <button
            onClick={onOpenNotifications}
            aria-label="Open Notifications"
            className="relative p-2 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#ff0046] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-xs">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* SETTINGS BUTTON */}
          <button
            onClick={onOpenSettings}
            aria-label="Open Settings"
            className="p-2 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>

          {/* LOGOUT BUTTON */}
          {onLogout && (
            <button
              onClick={onLogout}
              aria-label="Log Out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#152a40] hover:bg-[#ff0046] text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer ml-1"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
