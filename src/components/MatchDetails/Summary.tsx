import React, { useState } from 'react';
import type { Match, MatchEvent } from '../../types';

interface SummaryProps {
    match: Match;
}

export const Summary: React.FC<SummaryProps> = ({ match }) => {
    const { events = [], teamA, teamB } = match;
    const [filterTeam, setFilterTeam] = useState<'all' | 'teamA' | 'teamB'>('all');

    // Categorize actions
    const isGoal = (type: string) => type === 'goal' || type === 'penalty' || type === 'own_goal';
    const isYellow = (type: string) => type === 'yellow';
    const isRed = (type: string) => type === 'red';
    const isSub = (type: string) => type === 'sub_in' || type === 'sub_out';
    const isInjury = (type: string) => type === 'injury';

    // Summary counts per team
    const teamAEvents = events.filter((e) => e.teamId === teamA.id || e.eventTarget === 'home');
    const teamBEvents = events.filter((e) => e.teamId === teamB.id || e.eventTarget === 'away');

    const countActions = (teamEvts: MatchEvent[]) => ({
        goals: teamEvts.filter((e) => isGoal(e.type)).length,
        yellows: teamEvts.filter((e) => isYellow(e.type)).length,
        reds: teamEvts.filter((e) => isRed(e.type)).length,
        subs: teamEvts.filter((e) => isSub(e.type)).length,
        injuries: teamEvts.filter((e) => isInjury(e.type)).length,
    });

    const countsA = countActions(teamAEvents);
    const countsB = countActions(teamBEvents);

    // Filter events for the feed
    const filteredEvents = events.filter((e) => {
        if (filterTeam === 'teamA') return e.teamId === teamA.id || e.eventTarget === 'home';
        if (filterTeam === 'teamB') return e.teamId === teamB.id || e.eventTarget === 'away';
        return true;
    }).sort((a, b) => b.minute - a.minute);

    const getActionBadge = (type: string) => {
        if (isGoal(type)) {
            return {
                bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                icon: '⚽',
                label: type === 'penalty' ? 'PENALTY GOAL' : type === 'own_goal' ? 'OWN GOAL' : 'GOAL',
            };
        }
        if (isYellow(type)) {
            return {
                bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
                icon: '🟨',
                label: 'YELLOW CARD',
            };
        }
        if (isRed(type)) {
            return {
                bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
                icon: '🟥',
                label: 'RED CARD',
            };
        }
        if (isInjury(type)) {
            return {
                bg: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
                icon: '🩹',
                label: 'INJURY STOPPAGE',
            };
        }
        if (isSub(type)) {
            return {
                bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
                icon: '🔄',
                label: type === 'sub_out' ? 'SUB OUT' : 'SUB IN',
            };
        }
        return {
            bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
            icon: '⏱',
            label: type.toUpperCase(),
        };
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. MATCH ACTION MATRIX HEADER: TEAM A vs TEAM B */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                        MATCH ACTION BREAKDOWN
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                        {events.length} Recorded Match Events
                    </span>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                    {/* Team A Action Pill Card */}
                    <div className="space-y-3 sm:pr-2">
                        <div className="flex items-center gap-2.5">
                            <img src={teamA.logo} alt={teamA.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                            <span className="font-black text-xs text-slate-900 dark:text-white truncate">{teamA.name}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 text-center">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">⚽ Goal</span>
                                <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">{countsA.goals}</span>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">🟨 Card</span>
                                <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">{countsA.yellows}</span>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">🟥 Red</span>
                                <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">{countsA.reds}</span>
                            </div>
                            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">🔄 Sub</span>
                                <span className="font-mono font-black text-xs text-sky-600 dark:text-sky-400">{countsA.subs}</span>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">🩹 Inj</span>
                                <span className="font-mono font-black text-xs text-red-600 dark:text-red-400">{countsA.injuries}</span>
                            </div>
                        </div>
                    </div>

                    {/* Team B Action Pill Card */}
                    <div className="space-y-3 sm:pl-4 pt-3 sm:pt-0">
                        <div className="flex items-center gap-2.5">
                            <img src={teamB.logo} alt={teamB.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                            <span className="font-black text-xs text-slate-900 dark:text-white truncate">{teamB.name}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 text-center">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">⚽ Goal</span>
                                <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">{countsB.goals}</span>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">🟨 Card</span>
                                <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">{countsB.yellows}</span>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">🟥 Red</span>
                                <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">{countsB.reds}</span>
                            </div>
                            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">🔄 Sub</span>
                                <span className="font-mono font-black text-xs text-sky-600 dark:text-sky-400">{countsB.subs}</span>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xs p-1.5">
                                <span className="text-[10px] font-bold text-slate-400 block">🩹 Inj</span>
                                <span className="font-mono font-black text-xs text-red-600 dark:text-red-400">{countsB.injuries}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. FILTER PILLS */}
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm">
                <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    FILTER BY TEAM:
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setFilterTeam('all')}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors cursor-pointer ${
                            filterTeam === 'all'
                                ? 'bg-[#ff0046] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        ALL ({events.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTeam('teamA')}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                            filterTeam === 'teamA'
                                ? 'bg-[#ff0046] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <img src={teamA.logo} alt="" className="w-3.5 h-3.5 rounded-full" />
                        <span>{teamA.shortName} ({teamAEvents.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterTeam('teamB')}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                            filterTeam === 'teamB'
                                ? 'bg-[#ff0046] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <img src={teamB.logo} alt="" className="w-3.5 h-3.5 rounded-full" />
                        <span>{teamB.shortName} ({teamBEvents.length})</span>
                    </button>
                </div>
            </div>

            {/* 3. CHRONOLOGICAL ACTION TIMELINE FEED */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                        CHRONOLOGICAL PLAY TIMELINE
                    </span>
                    <span className="text-[10px] font-bold text-[#ff0046] flex items-center gap-1 uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#ff0046] animate-ping inline-block" />
                        Live Actions Feed
                    </span>
                </div>

                {filteredEvents.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                        <div className="text-3xl">⏱️</div>
                        <p className="font-bold text-slate-600 dark:text-slate-300">No actions logged yet for this match.</p>
                        <p className="text-[11px] max-w-md mx-auto text-slate-400">
                            Pitch events including goals, disciplinary bookings, injuries, and substitutions will be cataloged here in real-time as logged by the officiating crew.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {filteredEvents.map((ev) => {
                            const isHome = ev.teamId === teamA.id || ev.eventTarget === 'home';
                            const eventTeam = isHome ? teamA : teamB;
                            const badge = getActionBadge(ev.type);
                            const isJournalistEvent =
                                (ev as any).created_by_role === 'JOURNALIST' ||
                                (ev as any).createdBy === 'JOURNALIST' ||
                                (!ev.isOfficial && !(ev as any).is_official && (ev as any).created_by_role !== 'REFEREE');

                            return (
                                <div
                                    key={ev.id}
                                    className="p-3.5 sm:p-4 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors flex items-start gap-3 text-xs"
                                >
                                    {/* Minute Marker Badge */}
                                    <div className={`font-mono font-black text-xs px-2.5 py-1 ${
                                        isJournalistEvent
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                            : 'bg-slate-100 dark:bg-slate-800 text-[#ff0046]'
                                    } rounded-xs shrink-0 flex items-center gap-1`}
                                    title={isJournalistEvent ? 'Edited (Awaiting Referee Approval)' : `Minute ${ev.minute}'`}
                                    >
                                        <span>{isJournalistEvent ? '—' : `${ev.minute}'`}</span>
                                    </div>

                                    {/* Event Body */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <img
                                                src={eventTeam.logo}
                                                alt={eventTeam.name}
                                                className="w-4 h-4 rounded-full object-cover shrink-0"
                                            />
                                            <span className="font-black text-slate-900 dark:text-white truncate">
                                                {eventTeam.name}
                                            </span>
                                            {isJournalistEvent && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                                    Edited
                                                </span>
                                            )}
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-xs flex items-center gap-1 ${badge.bg}`}>
                                                <span>{badge.icon}</span>
                                                <span>{badge.label}</span>
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
                                            {ev.detailText || (
                                                ev.type === 'goal'
                                                    ? `GOAL! ${eventTeam.name} finds the back of the net!`
                                                    : ev.type === 'yellow'
                                                    ? `Yellow card cautioned against ${eventTeam.name}.`
                                                    : ev.type === 'red'
                                                    ? `RED CARD! Send-off incurred by ${eventTeam.name}.`
                                                    : ev.type === 'injury'
                                                    ? `Match stoppage: Player medical treatment for ${eventTeam.name}.`
                                                    : ev.type === 'sub_in' || ev.type === 'sub_out'
                                                    ? `Tactical player change made by ${eventTeam.name}.`
                                                    : `${badge.label} logged.`
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};


