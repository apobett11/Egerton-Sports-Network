import React from 'react';
import { Sun, Moon, Briefcase, Settings, LogOut } from 'lucide-react';
import type { UserRole } from '../../types';
import type { DashboardView } from '../../hooks/useTeamDashboard';

interface TeamHeaderProps {
  currentRole: UserRole;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout?: () => void;
  teamLogo?: string;
  teamName?: string;
  onOpenTeamModal?: () => void;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  currentRole: _currentRole,
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
  onLogout,
  teamLogo,
  teamName,
  onOpenTeamModal,
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
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b1522]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1a2e45]/80 px-4 md:px-6 py-3 flex items-center justify-between gap-3 select-none shadow-xs">
      {/* LEFT: Crest & Active View Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenTeamModal}
          className="relative group w-9 h-9 rounded-xl bg-[#0e1c2b] dark:bg-[#152a40] border border-slate-200 dark:border-white/10 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs cursor-pointer hover:border-[#ff0046]/50 hover:ring-2 hover:ring-[#ff0046]/20 transition-all overflow-hidden"
          title="Click to edit team logo and coach info"
          aria-label="Edit team identity and credentials"
        >
          {teamLogo ? (
            <img src={teamLogo} alt={teamName || 'Team Logo'} className="w-full h-full object-contain p-1" />
          ) : (
            <>
              <span className="text-[#ff0046] font-black mr-0.5">
                {(teamName || 'Egerton FC').charAt(0)}
              </span>
              {(teamName || 'Egerton FC').slice(1, 3).toUpperCase()}
            </>
          )}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Edit</span>
          </div>
        </button>

        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 bg-[#ff0046] text-white shadow-2xs">
              <Briefcase className="w-2.5 h-2.5" />
              <span>HEAD COACH</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              • Egerton Sports Network
            </span>
          </div>

          <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate mt-1">
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
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            activeView === 'SETTINGS'
              ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#152a40] dark:hover:bg-[#1c3857] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
          }`}
          title="Team Settings"
          aria-label="Team Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-[#152a40] dark:hover:bg-[#1c3857] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Logout button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-rose-50 dark:bg-[#152a40] dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

export default TeamHeader;
