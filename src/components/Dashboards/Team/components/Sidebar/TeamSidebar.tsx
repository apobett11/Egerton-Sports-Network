import React from 'react';
import { LayoutDashboard, Users, Trophy, Settings, LogOut, Newspaper } from 'lucide-react';
import type { DashboardView } from '../../hooks/useTeamDashboard';

interface TeamSidebarProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  handleLogout: () => void;
}

export const TeamSidebar: React.FC<TeamSidebarProps> = ({
  activeView,
  setActiveView,
  handleLogout,
}) => {
  return (
    <aside className="w-64 bg-[#1A1A1A] shrink-0 hidden md:flex flex-col border-r border-[#2A2A2A] h-screen sticky top-0 justify-between select-none">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden shrink-0">
            <img
              className="w-full h-full object-cover"
              alt="Egerton Crest"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN"
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">Egerton FC</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">High Performance</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          <button
            onClick={() => setActiveView('DASHBOARD')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer ${
              activeView === 'DASHBOARD'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-100 hover:bg-[#252525]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Team Home</span>
          </button>

          <button
            onClick={() => setActiveView('TACTICS')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer ${
              activeView === 'TACTICS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-100 hover:bg-[#252525]'
            }`}
          >
            <span>⚽</span>
            <span>Tactics & Pitch</span>
          </button>

          <button
            onClick={() => setActiveView('ROSTER')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer ${
              activeView === 'ROSTER'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-100 hover:bg-[#252525]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Roster & Subs</span>
          </button>



          <button
            onClick={() => setActiveView('STANDINGS')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer ${
              activeView === 'STANDINGS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-100 hover:bg-[#252525]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Standings</span>
          </button>

          <button
            onClick={() => setActiveView('NEWS')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer ${
              activeView === 'NEWS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-100 hover:bg-[#252525]'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>Team News</span>
          </button>
        </nav>
      </div>

      <div className="p-6 border-t border-[#2A2A2A] space-y-2">
        <button
          onClick={() => setActiveView('SETTINGS')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer ${
            activeView === 'SETTINGS'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-100 hover:bg-[#252525]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-950/30 transition-all min-h-[44px] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
