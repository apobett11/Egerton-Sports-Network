import React from 'react';
import { Sun, Moon, Briefcase, Settings } from 'lucide-react';
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
  currentRole: _currentRole,
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
}) => {
  const viewTitles: Record<DashboardView, string> = {
    DASHBOARD: 'Team Executive Overview',
    TACTICS: '2D Tactical Squad & Pitch',
    ROSTER: 'Players Directory & Team Kits',
    STANDINGS: 'League Standings & Fixtures Desk',
    NEWS: 'Official Newsroom & Press',
    SETTINGS: 'Team Operations & Role Settings',
    ROLES: 'Set-Piece Role Assignments',
    FIXTURES: 'Match Calendar & Results',
    KITS: 'Team Kits & Uniforms',
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0e1e2d] dark:bg-[#0b1522] border-b border-[#1a2e45] px-4 md:px-6 py-2.5 flex items-center justify-between gap-3 select-none shadow-xs">
      {/* LEFT: Crest & Active View Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-sm bg-[#152a40] border border-white/15 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs">
          <span className="text-[#ff0046] font-extrabold mr-0.5">E</span>FC
        </div>

        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 bg-[#ff0046] text-white">
              <Briefcase className="w-2.5 h-2.5" />
              <span>HEAD COACH</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline uppercase">
              • Egerton FC Operations Desk
            </span>
          </div>

          <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate mt-0.5">
            {viewTitles[activeView] || 'Team Control Center'}
          </h1>
        </div>
      </div>

      {/* RIGHT: Capsule Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Settings button */}
        <button
          type="button"
          onClick={() => setActiveView('SETTINGS')}
          className={`p-2 rounded-full border transition-colors cursor-pointer ${
            activeView === 'SETTINGS'
              ? 'bg-[#ff0046] text-white border-[#ff0046]'
              : 'bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white border-white/10'
          }`}
          title="Team Settings"
          aria-label="Team Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-200" />}
        </button>
      </div>
    </header>
  );
};

export default TeamHeader;
