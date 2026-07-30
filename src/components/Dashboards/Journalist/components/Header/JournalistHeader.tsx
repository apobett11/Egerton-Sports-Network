import React from 'react';
import { ArrowLeft, Search, Sun, Moon, Bell } from 'lucide-react';
import type { TabType } from '../../JournalistTypes';

interface JournalistHeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unreadNotificationsCount: number;
  onLogout?: () => void;
}

export const JournalistHeader: React.FC<JournalistHeaderProps> = ({
  darkMode,
  setDarkMode,
  searchQuery,
  setSearchQuery,
  activeTab: _activeTab,
  setActiveTab,
  unreadNotificationsCount,
  onLogout,
}) => {
  const headerBg = darkMode ? 'bg-[#111111]/90 border-[#222A35]' : 'bg-white border-[#D9E2EC] shadow-xs';

  return (
    <header className={`sticky top-0 z-40 h-16 w-full ${headerBg} backdrop-blur-xl transition-all`}>
      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (searchQuery) setSearchQuery('');
              else setActiveTab('home');
            }}
            className={`p-2 rounded-xl border transition-colors ${
              darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-[#D9E2EC] text-slate-700 hover:bg-slate-200'
            }`}
            title="Go Back / Reset"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#148A54] text-white font-black text-xs flex items-center justify-center shadow-xs">
                E
              </div>
              <h1 className="font-black text-sm md:text-base tracking-tight leading-none">
                ESN Journalist Portal
              </h1>
            </div>
            <span className="text-[11px] text-gray-500 font-semibold hidden sm:inline-block">Official Media House</span>
          </div>
        </div>

        <div className="flex-1 max-w-xs md:max-w-md relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search journals, rumours, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-1.5 rounded-full text-xs font-semibold focus:outline-none transition-all ${
              darkMode
                ? 'bg-slate-900 border border-slate-800 text-white focus:border-[#148A54]'
                : 'bg-slate-100 border border-[#D9E2EC] text-slate-800 focus:border-[#148A54] focus:bg-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition-colors ${
              darkMode
                ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-100 border-[#D9E2EC] text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Light / Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`relative p-2 rounded-xl border transition-colors ${
              darkMode
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 border-[#D9E2EC] text-slate-700 hover:bg-slate-200'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 border-[#D9E2EC] text-slate-700 hover:bg-slate-200'
              }`}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
