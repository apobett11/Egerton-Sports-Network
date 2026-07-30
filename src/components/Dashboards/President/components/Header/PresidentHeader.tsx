import React from 'react';
import { Menu, Lock, Unlock, Bell, Sun, Moon, Activity, Calendar, Shield, UserCheck, Trophy, Megaphone, X, Users, Zap } from 'lucide-react';
import type { PresidentTab } from '../../types';

interface PresidentHeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeView: PresidentTab;
  setActiveView: (tab: PresidentTab) => void;
  isScheduleLocked: boolean;
  showToast: (msg: string) => void;
  onLogout?: () => void;
}

export const PresidentHeader: React.FC<PresidentHeaderProps> = ({
  isDark,
  toggleTheme,
  isSidebarOpen,
  setIsSidebarOpen,
  activeView,
  setActiveView,
  isScheduleLocked,
  showToast,
  onLogout,
}) => {
  return (
    <>
      <header className={`sticky top-0 z-40 h-16 w-full ${isDark ? 'bg-[#090D16]/90 border-slate-800/80' : 'bg-white/90 border-slate-200/80'} backdrop-blur-xl border-b shadow-xs transition-all`}>
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div onClick={() => setActiveView('overview')} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                E
              </div>
              <span className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-blue-600 transition-colors`}>
                Egerton Football Association
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className={`text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full ${isDark ? 'bg-slate-800/80 text-slate-300 border border-slate-700/60' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
              2027 Season Phase: PRE-SEASON
            </span>
            {isScheduleLocked ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-orange-500/10 text-orange-500 border border-orange-500/30 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Unlocked
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast('Notifications up to date')}
              className={`relative p-2 rounded-xl transition-all cursor-pointer ${isDark ? 'hover:bg-slate-800/80 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all cursor-pointer ${isDark ? 'hover:bg-slate-800/80 text-orange-400' : 'hover:bg-slate-100 text-slate-700'}`}
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/30">
              <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center border border-blue-500/20">
                P
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-rose-400' : 'hover:bg-slate-100 text-slate-600 hover:text-rose-600'} transition-all`}
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* TOP TAB NAVIGATION BAR FOR 5 MANDATORY PRE-SEASON MODULES */}
      <div className={`border-b ${isDark ? 'bg-[#0E1424]/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md sticky top-16 z-30 overflow-x-auto no-scrollbar`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-2 py-2">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'season_engine', label: '1. Season & League', icon: Calendar },
            { id: 'teams', label: '2. Team Approvals', icon: Shield },
            { id: 'referees', label: '3. Referee Setup', icon: UserCheck },
            { id: 'fixture_engine', label: '4. Fixture Engine', icon: Trophy },
            { id: 'megaphone', label: '5. Megaphone', icon: Megaphone }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as PresidentTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SIDEBAR UTILITY DRAWER */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
          <div className={`w-72 h-full ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-white border-slate-200'} border-r p-6 flex flex-col justify-between shadow-2xl transition-all`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/30">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Pre-Season Dashboard</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs font-bold">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'season_engine', label: 'Season & League Engine', icon: Calendar },
                  { id: 'teams', label: 'Team Onboarding & Approvals', icon: Shield },
                  { id: 'referees', label: 'Referee Pool Setup', icon: UserCheck },
                  { id: 'fixture_engine', label: 'Fixture Engine & Schedule Lock', icon: Trophy },
                  { id: 'megaphone', label: 'Pre-Season Megaphone', icon: Megaphone },
                  { id: 'registration', label: 'Registration Links', icon: Zap }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id as PresidentTab);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : isDark
                          ? 'text-slate-300 hover:bg-slate-800/60'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
              Egerton Football Association v4.2
            </div>
          </div>
        </div>
      )}
    </>
  );
};
