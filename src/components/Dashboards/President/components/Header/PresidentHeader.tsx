import { Menu, Lock, Unlock, Bell, Sun, Moon, Activity, Calendar, Shield, UserCheck, Trophy, Megaphone, X, Users, Zap, LogOut } from 'lucide-react';
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
      <header className={`sticky top-0 z-40 h-16 w-full select-none ${isDark ? 'bg-[#0e1e2d] border-[#14263b]' : 'bg-white border-[#e6e8ec]'} border-b shadow-sm transition-all`}>
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-md transition-colors cursor-pointer ${isDark ? 'hover:bg-[#182f47] text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'}`}
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div onClick={() => setActiveView('overview')} className="flex items-center gap-2.5 cursor-pointer group">
              <div className="flex items-center gap-0.5">
                <div className="w-2.5 h-6 bg-[#ff0046] transform -skew-x-12 rounded-[1.5px]" />
                <div className={`w-1.5 h-6 ${isDark ? 'bg-white' : 'bg-slate-800'} transform -skew-x-12 rounded-[1.5px] opacity-90`} />
              </div>
              <div className="flex flex-col leading-none">
                <span className={`font-black text-base tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'} font-sans group-hover:text-[#ff0046] transition-colors`}>
                  EFA PRESIDENT
                </span>
                <span className="text-[8.5px] font-bold tracking-widest uppercase text-slate-400">
                  PRE-SEASON MANAGEMENT
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className={`text-xs font-black tracking-wider uppercase px-3 py-1 rounded-sm ${isDark ? 'bg-[#14263b] text-slate-300 border border-[#1a2e45]' : 'bg-slate-100 text-slate-700 border border-[#e6e8ec]'}`}>
              2027 Season Phase: PRE-SEASON
            </span>
            {isScheduleLocked ? (
              <span className="px-2.5 py-1 rounded-sm text-[10px] font-black uppercase bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-sm text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Unlocked
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast('Notifications up to date')}
              className={`relative p-2 rounded-md transition-colors cursor-pointer ${isDark ? 'hover:bg-[#182f47] text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff0046] rounded-full" />
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md transition-colors cursor-pointer ${isDark ? 'hover:bg-[#182f47] text-amber-400 hover:text-amber-300' : 'hover:bg-slate-100 text-slate-700'}`}
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-[#1a2e45]">
              <button
                onClick={() => setActiveView('profile')}
                title="Profile & Settings"
                className={`w-8 h-8 rounded-md bg-[#152a40] text-white font-black text-xs flex items-center justify-center border border-[#1a2e45] hover:border-[#ff0046] cursor-pointer transition-colors ${
                  activeView === 'profile' ? 'border-[#ff0046] ring-1 ring-[#ff0046]' : ''
                }`}
              >
                P
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-colors cursor-pointer bg-[#152a40] hover:bg-[#ff0046] text-white border border-white/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* TOP TAB NAVIGATION BAR FOR MANDATORY PRE-SEASON MODULES (DESKTOP ONLY) */}
      <div className={`hidden md:block border-b ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'} sticky top-16 z-30 overflow-x-auto no-scrollbar`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-1.5 py-2">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'season_engine', label: '1. Season & League', icon: Calendar },
            { id: 'teams', label: '2. Team Approvals', icon: Shield },
            { id: 'referees', label: '3. Referee Setup', icon: UserCheck },
            { id: 'fixture_engine', label: '4. Season', icon: Trophy },
            { id: 'megaphone', label: '5. Make Announcement', icon: Megaphone }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as PresidentTab)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#14263b]'
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

      {/* SIDEBAR UTILITY DRAWER WITH AUTO-CLOSE BACKDROP */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex transition-opacity animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-72 h-full ${isDark ? 'bg-[#0e1e2d] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'} border-r p-6 flex flex-col justify-between shadow-2xl transition-all`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#1a2e45]">
                <span className="text-xs font-black uppercase tracking-wider text-[#ff0046]">Pre-Season Dashboard</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#14263b] cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs font-bold">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'season_engine', label: 'League Registration', icon: Calendar },
                  { id: 'teams', label: 'Team Approvals', icon: Shield },
                  { id: 'referees', label: 'Referee Management', icon: UserCheck },
                  { id: 'fixture_engine', label: 'Season', icon: Trophy },
                  { id: 'megaphone', label: 'Make Announcement', icon: Megaphone },
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
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md transition-colors cursor-pointer text-xs font-black uppercase tracking-wider ${
                        isActive
                          ? 'bg-[#ff0046] text-white shadow-xs'
                          : isDark
                          ? 'text-slate-300 hover:bg-[#14263b] hover:text-white'
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
