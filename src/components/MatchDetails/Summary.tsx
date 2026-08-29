import React from 'react';
import type { Match, MatchEvent } from '../../types';

interface SummaryProps {
    match: Match;
}

export const Summary: React.FC<SummaryProps> = ({ match }) => {
    const { events = [], teamA, teamB } = match;

    // Split events into 1st half and 2nd half
    const firstHalfEvents = events.filter(e => e.minute <= 45).sort((a, b) => a.minute - b.minute);
    const secondHalfEvents = events.filter(e => e.minute > 45).sort((a, b) => a.minute - b.minute);

    const renderEventContent = (event: MatchEvent) => {
        if (event.type === 'goal') {
            return (
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span className="text-sm">⚽</span>
                    <span>{event.detailText || 'Goal'}</span>
                </div>
            );
        }
        if (event.type === 'yellow') {
            return (
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <span className="w-2.5 h-3.5 bg-[#fbc02d] rounded-xs inline-block shadow-xs" />
                    <span>{event.detailText || 'Yellow Card'}</span>
                </div>
            );
        }
        if (event.type === 'red') {
            return (
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-600">
                    <span className="w-2.5 h-3.5 bg-[#d32f2f] rounded-xs inline-block shadow-xs" />
                    <span>{event.detailText || 'Red Card'}</span>
                </div>
            );
        }
        return (
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                {event.detailText || event.type}
            </div>
        );
    };

    // Calculate momentum bars dynamically across 45 bins (2-minute intervals)
    const momentumBars = Array.from({ length: 45 }).map((_, i) => {
        const startMin = i * 2;
        const endMin = startMin + 2;
        const evtsInBin = events.filter(e => e.minute >= startMin && e.minute <= endMin);
        const homeScore = evtsInBin.filter(e => e.teamId === teamA.id).length;
        const awayScore = evtsInBin.filter(e => e.teamId === teamB.id).length;

        if (homeScore > awayScore) {
            return { isHomeDominant: true, height: Math.min(100, 40 + homeScore * 30), hasAction: true };
        } else if (awayScore > homeScore) {
            return { isHomeDominant: false, height: Math.min(100, 40 + awayScore * 30), hasAction: true };
        } else if (homeScore > 0 && homeScore === awayScore) {
            return { isHomeDominant: true, height: 50, hasAction: true };
        }
        return { isHomeDominant: true, height: 20, hasAction: false };
    });

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. MATCH MOMENTUM DUAL BAR CARD */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden p-3 shadow-xs">
                <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500 mb-2">
                    <span className="text-slate-900 dark:text-white">MATCH MOMENTUM</span>
                    <span className="text-[10px] text-slate-400">Live Pressure Index</span>
                </div>
                
                {/* Visual Momentum Chart */}
                <div className="h-16 w-full flex items-end justify-between gap-0.5 pt-2 border-b border-[#f0f2f5] dark:border-[#16283d] pb-2">
                    {momentumBars.map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-center items-center h-full">
                            <div
                                style={{ height: `${bar.height}%` }}
                                className={`w-full rounded-xs transition-all ${
                                    bar.hasAction
                                        ? bar.isHomeDominant ? 'bg-[#ff0046]' : 'bg-[#1565c0]'
                                        : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>1'</span>
                    <span>15'</span>
                    <span>30'</span>
                    <span>45'</span>
                    <span>60'</span>
                    <span>75'</span>
                    <span>90'</span>
                </div>
            </div>

            {/* 2. CHRONOLOGICAL TIMELINE (1ST HALF & 2ND HALF) */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                {/* 1ST HALF HEADER */}
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-center text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    1ST HALF
                </div>

                {firstHalfEvents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No events in 1st half</div>
                ) : (
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {firstHalfEvents.map((ev) => {
                            const isHome = ev.teamId === teamA.id;
                            return (
                                <div key={ev.id} className="grid grid-cols-[1fr_40px_1fr] items-center px-3 py-2.5 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                                    {/* Home Event */}
                                    <div className="flex justify-end pr-3">
                                        {isHome ? renderEventContent(ev) : null}
                                    </div>

                                    {/* Minute Badge */}
                                    <div className="text-center font-mono font-black text-xs text-[#ff0046]">
                                        {ev.minute}'
                                    </div>

                                    {/* Away Event */}
                                    <div className="flex justify-start pl-3">
                                        {!isHome ? renderEventContent(ev) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 2ND HALF HEADER */}
                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-t border-b border-[#e6e8ec] dark:border-[#1a2e45] text-center text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    2ND HALF
                </div>

                {secondHalfEvents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No events in 2nd half</div>
                ) : (
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {secondHalfEvents.map((ev) => {
                            const isHome = ev.teamId === teamA.id;
                            return (
                                <div key={ev.id} className="grid grid-cols-[1fr_40px_1fr] items-center px-3 py-2.5 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                                    {/* Home Event */}
                                    <div className="flex justify-end pr-3">
                                        {isHome ? renderEventContent(ev) : null}
                                    </div>

                                    {/* Minute Badge */}
                                    <div className="text-center font-mono font-black text-xs text-[#ff0046]">
                                        {ev.minute}'
                                    </div>

                                    {/* Away Event */}
                                    <div className="flex justify-start pl-3">
                                        {!isHome ? renderEventContent(ev) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. MATCH INFORMATION CARD */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 text-xs space-y-2 shadow-xs">
                <h4 className="font-extrabold uppercase text-slate-900 dark:text-white border-b border-[#f0f2f5] dark:border-[#16283d] pb-2">
                    MATCH INFORMATION
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-600 dark:text-slate-400">
                    <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Referee:</span> {match.referee || 'Official Referee'}
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Venue:</span> {match.venue || 'Egerton Main Ground'}
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Matchday:</span> Round {match.matchday || 1}
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Kickoff:</span> {match.time || '15:00 EAT'}
                    </div>
                </div>
            </div>
        </div>
    );
};


