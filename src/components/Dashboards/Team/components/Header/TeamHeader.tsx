import React from 'react';
import { Shield, Sun, Moon } from 'lucide-react';
import type { UserRole } from '../../types';
import type { DashboardView } from '../../hooks/useTeamDashboard';

interface TeamHeaderProps {
  currentRole: UserRole;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  handleRoleToggle: () => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  currentRole,
  activeView,
  setActiveView,
  handleRoleToggle,
  darkMode,
  setDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#111111]/90 backdrop-blur-md border-b border-[#2A2A2A] px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#2A2A2A] md:hidden shrink-0">
            <img
              className="w-full h-full object-cover"
              alt="Crest"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Authorized Session
            </span>
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight">
              {currentRole === 'COACH' ? 'COACH CONTROL MODE' : 'CAPTAIN CONTROL MODE'}
            </h1>
          </div>
        </div>

        <button
          onClick={handleRoleToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F1F1F] border border-[#2A2A2A] hover:border-emerald-500/50 transition-colors min-h-[44px] cursor-pointer"
          title="Click to toggle between Coach and Captain role permissions"
        >
          <Shield className={`w-3.5 h-3.5 ${currentRole === 'COACH' ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">
            SWITCH ROLE
          </span>
        </button>
      </div>

      {(activeView === 'TACTICS' || activeView === 'ROSTER' || activeView === 'ROLES') && (
        <div className="w-full sm:w-auto flex items-center bg-[#1F1F1F] p-1 rounded-xl border border-[#2A2A2A] justify-between">
          <button
            onClick={() => setActiveView('TACTICS')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              activeView === 'TACTICS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>⚽</span>
            <span>Tactics & Pitch</span>
          </button>

          <button
            onClick={() => setActiveView('ROSTER')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              activeView === 'ROSTER'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>📋</span>
            <span>Roster & Subs</span>
          </button>

          <button
            onClick={() => setActiveView('ROLES')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              activeView === 'ROLES'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>⚙️</span>
            <span>Match Roles</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setDarkMode(!darkMode)}
        className="w-10 h-10 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] flex items-center justify-center text-emerald-400 hover:bg-[#252525] transition-colors cursor-pointer min-h-[44px]"
        title="Toggle Light/Dark Theme"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
};
