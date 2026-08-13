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
  matchdaysCount = 18,
  fixturesCount = 0,
  refereesCount = 0,
  pitchesCount = 0,
  friendliesCount = 0,
  teamsCount = 23,
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
      className={`border-b sticky top-16 z-30 transition-colors duration-200 backdrop-blur-md ${
        isDark ? 'bg-[#0E1424]/90 border-slate-800/80' : 'bg-white/90 border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700'
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
