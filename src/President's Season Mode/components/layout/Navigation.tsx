import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Swords,
  Calendar,
  UserCheck,
  MapPin,
  Flame,
  Shield,
  BarChart3,
} from 'lucide-react';
import type { SeasonModeView } from '../../types/seasonMode';

interface NavigationProps {
  activeView: SeasonModeView;
  setActiveView: (view: SeasonModeView) => void;
  isDark: boolean;
  matchdaysCount?: number;
  fixturesCount?: number;
  refereesCount?: number;
  pitchesCount?: number;
  friendliesCount?: number;
  teamsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  setActiveView,
  isDark,
  matchdaysCount = 0,
  fixturesCount = 0,
  refereesCount = 0,
  pitchesCount = 0,
  friendliesCount = 0,
  teamsCount = 0,
}) => {
  const navItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'matchdays' as const,
      label: 'Matchdays',
      icon: CalendarDays,
      badge: matchdaysCount > 0 ? String(matchdaysCount) : null,
    },
    {
      id: 'referees' as const,
      label: 'Referees',
      icon: UserCheck,
      badge: refereesCount > 0 ? String(refereesCount) : null,
    },
    {
      id: 'pitches' as const,
      label: 'Pitches',
      icon: MapPin,
      badge: pitchesCount > 0 ? String(pitchesCount) : null,
    },
    {
      id: 'teams' as const,
      label: 'Teams',
      icon: Shield,
      badge: teamsCount > 0 ? String(teamsCount) : null,
    },
  ];

  return (
    <nav
      className={`sticky top-[52px] z-30 w-full select-none border-b transition-colors duration-150 py-1.5 ${
        isDark ? 'bg-[#0e1e2d] border-[#14263b]' : 'bg-white border-[#e6e8ec]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#ff0046] text-white shadow-xs ring-1 ring-white/10'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#15273b]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-xs text-[10px] font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-[#14263b] text-slate-300 border border-[#1a2e45]'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
