import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Trophy,
  Newspaper,
  Settings,
} from 'lucide-react';
import type { DashboardView } from '../../hooks/useTeamDashboard';
import type { UserRole } from '../../types';

interface TeamMobileNavProps {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  currentRole: UserRole;
}

export const TeamMobileNav: React.FC<TeamMobileNavProps> = ({
  activeView,
  setActiveView,
  currentRole: _currentRole,
}) => {
  const navItems: { view: DashboardView; label: string; icon: React.ReactNode }[] = [
    {
      view: 'DASHBOARD',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      view: 'TACTICS',
      label: 'Squad',
      icon: <Users className="w-4 h-4" />,
    },
    {
      view: 'ROSTER',
      label: 'Roster',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      view: 'STANDINGS',
      label: 'Tables & Fixtures',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      view: 'NEWS',
      label: 'News',
      icon: <Newspaper className="w-4 h-4" />,
    },
    {
      view: 'SETTINGS',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <nav
      aria-label="Coach Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white/90 dark:bg-[#0e1c2b]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-[#1a2e45] px-1 pt-1 safe-area-pb flex items-stretch shadow-lg select-none overflow-x-auto overscroll-contain"
    >
      <div className="w-full flex items-center justify-around gap-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setActiveView(item.view)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#ff0046] font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'text-[#ff0046] bg-rose-500/10' : 'text-slate-400'
                }`}
              >
                {item.icon}
              </div>

              <span className="text-[10px] font-medium tracking-tight mt-0.5 truncate">
                {item.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#ff0046] mt-0.5 shadow-2xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TeamMobileNav;
