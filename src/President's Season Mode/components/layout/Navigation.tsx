import React from 'react';
import { LayoutDashboard, Users, UserCheck, MapPin, ClipboardCheck } from 'lucide-react';
import type { SeasonModeView } from '../../types/seasonMode';

interface NavigationProps {
  activeView: SeasonModeView;
  setActiveView: (view: SeasonModeView) => void;
  isDark: boolean;
  teamsCount: number;
  refereesCount: number;
  pitchesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  setActiveView,
  isDark,
  teamsCount,
  refereesCount,
  pitchesCount,
}) => {
  const navItems = [
    {
      id: 'overview' as const,
      label: 'Season Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'teams' as const,
      label: 'Teams',
      icon: Users,
      badge: teamsCount > 0 ? String(teamsCount) : null,
    },
    {
      id: 'referees' as const,
      label: 'Referees Pool',
      icon: UserCheck,
      badge: refereesCount > 0 ? String(refereesCount) : null,
    },
    {
      id: 'pitches' as const,
      label: 'Pitches Foundation',
      icon: MapPin,
      badge: pitchesCount > 0 ? String(pitchesCount) : null,
    },
    {
      id: 'registration' as const,
      label: 'Registration Intake',
      icon: ClipboardCheck,
      badge: 'Active',
    },
  ];

  return (
    <nav
      className={`border-b transition-colors duration-200 ${
        isDark ? 'bg-[#0E1424]/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                        : 'bg-slate-200 text-slate-700'
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
