import React from 'react';
import { Home, Calendar, Megaphone, User } from 'lucide-react';
import type { RefereeTab } from '../../types';

interface RefereeNavigationProps {
  activeTab: RefereeTab;
  setActiveTab: (tab: RefereeTab) => void;
  announcementsCount?: number;
}

export const RefereeNavigation: React.FC<RefereeNavigationProps> = ({
  activeTab,
  setActiveTab,
  announcementsCount = 0,
}) => {
  const tabs = [
    { id: 'overview' as RefereeTab, label: 'Overview', icon: Home },
    { id: 'matches' as RefereeTab, label: 'My Matches', icon: Calendar },
    { id: 'announcements' as RefereeTab, label: 'Announcements', icon: Megaphone, badge: announcementsCount },
    { id: 'profile' as RefereeTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-45 md:sticky md:top-[124px] md:z-20 bg-white/95 dark:bg-[#0e1e2d] backdrop-blur-md border-t md:border-t-0 md:border-b border-[#e6e8ec] dark:border-[#1a2e45] shadow-md transition-colors duration-200 select-none">
      <div className="flex items-center justify-around md:justify-center md:gap-2 lg:gap-3 px-2 sm:px-4 py-2 max-w-5xl mx-auto h-[64px] md:h-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'matches' && activeTab === 'report');

          const activeClass =
            'bg-[#ff0046] text-white font-black shadow-xs ring-1 ring-white/10';
          const inactiveClass =
            'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152a40] font-black border border-transparent';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col md:flex-row items-center gap-1 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-105 text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                {!!tab.badge && tab.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[10px] font-black shadow-xs animate-pulse ${
                    isActive 
                      ? 'bg-white text-[#ff0046] ring-1 ring-black/10' 
                      : 'bg-[#ff0046] text-white ring-2 ring-white dark:ring-[#0e1e2d]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] md:text-xs tracking-wider uppercase font-black">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-xs md:hidden" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
