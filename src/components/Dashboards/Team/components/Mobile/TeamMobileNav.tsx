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
    <nav 
      aria-label="Coach Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 lg:left-72 z-50 bg-gradient-to-r from-[#032e1e] via-[#064e3b] to-[#032e1e] border-t-2 border-emerald-400/50 px-3 py-2 flex items-center justify-around shadow-[0_-6px_25px_rgba(5,150,105,0.35)] select-none transition-all duration-300 backdrop-blur-md"
    >
      <div className="max-w-xl w-full mx-auto flex items-center justify-around gap-1 sm:gap-2">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`group relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 cursor-pointer min-w-[58px] sm:min-w-[68px] transform active:scale-90 hover:scale-105 ${
                isActive
                  ? 'text-white font-black'
                  : 'text-emerald-100/75 hover:text-white font-bold hover:bg-emerald-800/40'
              }`}
            >
              {/* Icon Container with Glassmorphism for Active State */}
              <div
                className={`p-2 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'backdrop-blur-xl bg-white/20 border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_2px_rgba(255,255,255,0.7)] ring-1 ring-emerald-300/40 scale-110 text-white'
                    : 'text-emerald-200/80 group-hover:text-white group-hover:scale-105'
                }`}
              >
                {item.icon}
              </div>

              {/* Label */}
              <span className={`text-[10px] sm:text-[11px] tracking-tight mt-1 truncate max-w-[72px] transition-colors ${
                isActive ? 'text-white font-extrabold drop-shadow-xs' : 'text-emerald-200/80 font-semibold'
              }`}>
                {item.label}
              </span>

              {/* Active animated indicator dot */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399] mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TeamMobileNav;
