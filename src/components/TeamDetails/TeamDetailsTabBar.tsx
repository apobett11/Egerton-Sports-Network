import React from 'react';

export type TeamDetailTabType = 'fixtures' | 'squad' | 'players' | 'standings';

interface TeamDetailsTabBarProps {
  activeTab: TeamDetailTabType;
  setActiveTab: (tab: TeamDetailTabType) => void;
  playersCount?: number;
  fixturesCount?: number;
}

export const TeamDetailsTabBar: React.FC<TeamDetailsTabBarProps> = ({
  activeTab,
  setActiveTab,
  playersCount,
  fixturesCount,
}) => {
  const tabs: { id: TeamDetailTabType; label: string; count?: number }[] = [
    { id: 'fixtures', label: 'FIXTURES & RESULTS', count: fixturesCount },
    { id: 'squad', label: 'TACTICAL SQUAD' },
    { id: 'players', label: 'PLAYERS DIRECTORY', count: playersCount },
    { id: 'standings', label: 'STANDINGS & FORM' },
  ];

  return (
    <div className="w-full bg-[#0e1e2d] border-b border-[#16283d] select-none sticky top-[48px] z-40 shadow-xs">
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1 sm:gap-2 py-2 px-3 max-w-5xl mx-auto">
        {tabs.map((tb) => {
          const isActive = activeTab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setActiveTab(tb.id)}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#14263b]'
              }`}
            >
              <span>{tb.label}</span>
              {tb.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#16283d] text-slate-300'
                  }`}
                >
                  {tb.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeamDetailsTabBar;
