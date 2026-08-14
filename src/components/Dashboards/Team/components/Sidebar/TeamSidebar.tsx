import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Trophy,
  Newspaper,
  Settings,
  Shirt,
  Calendar,
  Sparkles,
  Crown,
  Briefcase
} from 'lucide-react';
import type { DashboardView } from '../../hooks/useTeamDashboard';
import type { UserRole } from '../../types';

interface TeamSidebarProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  currentRole: UserRole;
}

export const TeamSidebar: React.FC<TeamSidebarProps> = ({
  activeView,
  setActiveView,
  currentRole,
}) => {
  const isCoach = currentRole === 'COACH';
  const isCaptain = currentRole === 'CAPTAIN';

  const navItems: { view: DashboardView; label: string; icon: React.ReactNode; badge?: string; color: string }[] = [
    {
      view: 'DASHBOARD',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      color: 'text-emerald-400'
    },
    {
      view: 'TACTICS',
      label: 'Team Squad',
      icon: <Users className="w-4 h-4" />,
      badge: '2D Pitch',
      color: 'text-emerald-400'
    },
    {
      view: 'ROSTER',
      label: 'Players List & Kits',
      icon: <Shield className="w-4 h-4" />,
      color: 'text-blue-400'
    },
    {
      view: 'STANDINGS',
      label: 'Table & Fixtures',
      icon: <Trophy className="w-4 h-4" />,
      color: 'text-amber-400'
    },
    {
      view: 'NEWS',
      label: 'Newsroom & Press',
      icon: <Newspaper className="w-4 h-4" />,
      color: 'text-purple-400'
    },
    {
      view: 'SETTINGS',
      label: 'Team Settings',
      icon: <Settings className="w-4 h-4" />,
      color: 'text-slate-400'
    },
  ];

  return (
    <aside className="w-full bg-[#161B22] border border-[#2A3441] rounded-2xl p-4 shadow-xl space-y-4">
      {/* Role Badge Indicator */}
      <div className="p-3 rounded-xl bg-[#0D1117] border border-[#2A3441] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
            isCoach 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : isCaptain
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isCoach ? <Briefcase className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Role</div>
            <div className="text-xs font-black text-white">{currentRole} MODE</div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
          isCoach ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {isCoach ? 'Manager' : 'On-Pitch Leader'}
        </span>
      </div>

      {/* Navigation List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 font-black'
                  : 'text-slate-300 hover:bg-[#1F2937] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : item.color}>{item.icon}</span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
