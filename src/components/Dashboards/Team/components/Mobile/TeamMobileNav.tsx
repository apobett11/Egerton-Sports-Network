import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Trophy,
  Newspaper,
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
      label: 'Table',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      view: 'NEWS',
      label: 'News',
      icon: <Newspaper className="w-4 h-4" />,
    },
  ];

  return (
    <nav
      aria-label="Coach Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-[#0e1e2d] border-t border-[#1a2e45] px-2 py-1.5 flex items-center justify-around shadow-lg select-none"
    >
      <div className="w-full flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setActiveView(item.view)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-sm transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#ff0046] font-black'
                  : 'text-slate-400 hover:text-white font-semibold'
              }`}
            >
              <div
                className={`p-1 rounded-sm transition-colors ${
                  isActive ? 'text-[#ff0046]' : 'text-slate-400'
                }`}
              >
                {item.icon}
              </div>

              <span className="text-[10px] uppercase tracking-tight mt-0.5 truncate">
                {item.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#ff0046] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TeamMobileNav;
