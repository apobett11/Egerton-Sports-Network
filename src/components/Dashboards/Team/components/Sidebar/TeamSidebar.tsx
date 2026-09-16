import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Trophy,
  Newspaper,
  Settings,
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
  currentRole: _currentRole,
}) => {
  const navItems: { view: DashboardView; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      view: 'DASHBOARD',
      label: 'OVERVIEW',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      view: 'TACTICS',
      label: 'TEAM SQUAD',
      icon: <Users className="w-4 h-4" />,
      badge: '2D Pitch',
    },
    {
      view: 'ROSTER',
      label: 'PLAYERS & KITS',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      view: 'STANDINGS',
      label: 'TABLE & FIXTURES',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      view: 'NEWS',
      label: 'NEWSROOM & PRESS',
      icon: <Newspaper className="w-4 h-4" />,
    },
    {
      view: 'SETTINGS',
      label: 'TEAM SETTINGS',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-3.5 shadow-xs space-y-3 select-none">
      {/* Role Badge Indicator */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-[#ff0046] text-white shadow-2xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">ROLE GOVERNANCE</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">HEAD COACH</div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Exclusive
        </span>
      </div>

      {/* Navigation List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer uppercase tracking-wider ${
                isActive
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#13263b] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-[#14263b] text-slate-600 dark:text-slate-400'
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

export default TeamSidebar;
