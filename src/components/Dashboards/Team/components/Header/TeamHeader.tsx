import React from 'react';
import { Sun, Moon, Shield, Crown, Briefcase, Bell, Settings } from 'lucide-react';
import type { UserRole } from '../../types';
import type { DashboardView } from '../../hooks/useTeamDashboard';

interface TeamHeaderProps {
  currentRole: UserRole;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  currentRole,
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
}) => {
  const isCoach = currentRole === 'COACH';
  const isCaptain = currentRole === 'CAPTAIN';

  const viewTitles: Record<DashboardView, string> = {
    DASHBOARD: 'Team Executive Overview',
    TACTICS: '2D Tactical Squad & Pitch',
    ROSTER: 'Players Directory & Team Kits',
    STANDINGS: 'League Standings & Fixtures Desk',
    NEWS: 'Official Newsroom & Press',
    SETTINGS: 'Team Profile & Preferences',
    ROLES: 'Set-Piece Role Assignments',
    FIXTURES: 'Match Calendar & Results',
    KITS: 'Team Kits & Uniforms',
  };

  return (
    <header className="sticky top-0 z-40 bg-[#161B22]/90 backdrop-blur-md border-b border-[#2A3441] px-4 md:px-8 py-3 flex items-center justify-between gap-3 select-none">
      {/* LEFT: TEAM CREST & ACTIVE VIEW TITLE */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-2 flex items-center justify-center border border-emerald-400/50 shadow-md shrink-0">
          <span className="font-black text-sm text-white">EFC</span>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1 ${
              isCoach
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              {isCoach ? <Briefcase className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
              <span>{currentRole} ACTIVE</span>
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">• Egerton FC Desk</span>
          </div>

          <h1 className="text-xs sm:text-sm md:text-base font-black text-white tracking-tight truncate">
            {viewTitles[activeView] || 'Team Control Center'}
          </h1>
        </div>
      </div>

      {/* RIGHT: QUICK ACTIONS & CONTROLS */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Settings button */}
        <button
          onClick={() => setActiveView('SETTINGS')}
          className={`p-2 rounded-xl border border-[#2A3441] text-slate-400 hover:text-white transition-colors cursor-pointer ${
            activeView === 'SETTINGS' ? 'bg-emerald-600 text-white' : 'bg-[#0D1117] hover:bg-slate-800'
          }`}
          title="Team Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl bg-[#0D1117] border border-[#2A3441] flex items-center justify-center text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

export default TeamHeader;
