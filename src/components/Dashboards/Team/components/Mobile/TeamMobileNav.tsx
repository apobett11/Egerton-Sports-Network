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
  currentRole,
}) => {
  const navItems: { view: DashboardView; label: string; icon: React.ReactNode }[] = [
    {
      view: 'DASHBOARD',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      view: 'TACTICS',
      label: 'Squad',
      icon: <Users className="w-5 h-5" />,
    },
    {
      view: 'ROSTER',
      label: 'Players & Kits',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      view: 'STANDINGS',
      label: 'Table',
      icon: <Trophy className="w-5 h-5" />,
    },
    {
      view: 'NEWS',
      label: 'News',
      icon: <Newspaper className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#161B22]/95 backdrop-blur-xl border-t border-[#2A3441] px-2 py-1.5 flex items-center justify-around shadow-2xl select-none">
      {navItems.map((item) => {
        const isActive = activeView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[60px] ${
              isActive
                ? 'text-emerald-400 font-black'
                : 'text-slate-400 hover:text-slate-200 font-bold'
            }`}
          >
            <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110 bg-emerald-500/15' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[68px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default TeamMobileNav;
