import React, { useEffect, useRef } from 'react';
import type { MatchStatus } from '../../types';

export type MatchDetailTabType =
    | 'squad'
    | 'timeline'
    | 'details'
    | 'motm'
    | 'reports'
    | 'jerseys'
    | 'h2h_form';

interface TabBarProps {
    activeTab: MatchDetailTabType;
    setActiveTab: (tab: MatchDetailTabType) => void;
    status: MatchStatus | string;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab, status }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const statusUpper = String(status || '').toUpperCase();
    const isLive = ['LIVE', 'HT', 'HALF_TIME', 'SECOND_HALF', '1H', '2H'].includes(statusUpper);
    const isBegunOrPlayed = ['LIVE', 'HT', 'HALF_TIME', 'SECOND_HALF', '1H', '2H', 'FT', 'FULL_TIME', 'FINALIZED', 'COMPLETED'].includes(statusUpper);

    const mainTabs: { id: MatchDetailTabType; label: string; isLive?: boolean }[] = isBegunOrPlayed
        ? [
            { id: 'timeline', label: isLive ? 'TIMELINE (LIVE)' : 'TIMELINE', isLive },
            { id: 'details', label: 'MATCH DETAILS' },
            { id: 'reports', label: 'REPORTS' },
            { id: 'motm', label: 'MAN OF THE MATCH' },
            { id: 'squad', label: 'TEAM SQUADS' },
            { id: 'jerseys', label: 'JERSEYS' },
            { id: 'h2h_form', label: 'H2H & FORM' },
          ]
        : [
            { id: 'details', label: 'MATCH DETAILS' },
            { id: 'reports', label: 'REPORTS' },
            { id: 'motm', label: 'MAN OF THE MATCH' },
            { id: 'timeline', label: 'MATCH EVENTS' },
            { id: 'squad', label: 'TEAM SQUADS' },
            { id: 'jerseys', label: 'JERSEYS' },
            { id: 'h2h_form', label: 'H2H & FORM' },
          ];

    // Keep the selected sub-menu item centered in the natural middle
    useEffect(() => {
        const scrollToMiddle = (behavior: ScrollBehavior = 'smooth') => {
            const activeBtn = tabRefs.current[activeTab];
            const container = containerRef.current;
            if (activeBtn && container) {
                const containerRect = container.getBoundingClientRect();
                const targetRect = activeBtn.getBoundingClientRect();
                const targetScrollLeft =
                    container.scrollLeft +
                    (targetRect.left - containerRect.left) -
                    containerRect.width / 2 +
                    targetRect.width / 2;

                container.scrollTo({
                    left: Math.max(0, targetScrollLeft),
                    behavior,
                });
            }
        };

        const frameId = requestAnimationFrame(() => scrollToMiddle('smooth'));
        const timerId = setTimeout(() => scrollToMiddle('smooth'), 60);

        return () => {
            cancelAnimationFrame(frameId);
            clearTimeout(timerId);
        };
    }, [activeTab]);

    return (
        <div className="w-full bg-[#0e1e2d] border-b border-[#16283d] select-none sticky top-[48px] z-40 shadow-xs">
            {/* MAIN MATCH DETAILS NAVIGATION BAR */}
            <div
                ref={containerRef}
                className="w-full overflow-x-auto no-scrollbar scroll-smooth"
            >
                <div className="flex items-center justify-start md:justify-center min-w-max gap-1 sm:gap-2 py-2 px-4 sm:px-6 mx-auto max-w-4xl">
                    {mainTabs.map((tb) => {
                        const isActive = activeTab === tb.id;
                        return (
                            <button
                                key={tb.id}
                                ref={(el) => {
                                    tabRefs.current[tb.id] = el;
                                }}
                                type="button"
                                onClick={() => setActiveTab(tb.id)}
                                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase transition-colors whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
                                    isActive
                                        ? 'bg-[#ff0046] text-white shadow-xs'
                                        : 'text-slate-400 hover:text-white hover:bg-[#14263b]'
                                }`}
                            >
                                {tb.isLive && (
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
                                )}
                                <span>{tb.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};




