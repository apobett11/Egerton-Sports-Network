import React from 'react';
import { ArrowLeftRight, HelpCircle, AlertCircle, Flag, Clock } from 'lucide-react';
import type { Match, MatchEvent } from '../../types';

interface SummaryProps {
    match: Match;
}

export const Summary: React.FC<SummaryProps> = ({ match }) => {
    const { events, teamA, teamB } = match;

    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#0E1424] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No Match Events Recorded</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Events such as goals, bookings, and substitutions will appear here chronologically as they occur.
                </p>
            </div>
        );
    }

    // Sort events chronologically by minute
    const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

    const renderEventIcon = (type: MatchEvent['type']) => {
        switch (type) {
            case 'goal':
                return <span className="text-lg leading-none" role="img" aria-label="Goal">⚽</span>;
            case 'yellow':
                return <div className="w-3.5 h-4 bg-amber-400 rounded-xs shadow-xs ring-1 ring-amber-500/50" title="Yellow Card" />;
            case 'red':
                return <div className="w-3.5 h-4 bg-rose-600 rounded-xs shadow-xs animate-pulse ring-1 ring-rose-700" title="Red Card" />;
            case 'injury':
                return <span className="text-base" role="img" aria-label="Injury">🤕</span>;
            case 'sub_in':
            case 'sub_out':
                return <ArrowLeftRight className="w-4 h-4 text-emerald-500" />;
            case 'kickoff':
            case 'second_half':
                return <span className="text-xs font-black text-emerald-500 uppercase">Start</span>;
            case 'ht':
                return <span className="text-xs font-black text-amber-500 uppercase">HT</span>;
            case 'ft':
                return <span className="text-xs font-black text-slate-400 uppercase">FT</span>;
            default:
                return <HelpCircle className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto py-12 px-4 select-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
                            Chronological Log
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                            Match Event Timeline
                        </h3>
                    </div>
                </div>
                <div className="self-start sm:self-auto flex items-center gap-3 text-xs font-bold bg-slate-100/80 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-200/60 dark:border-white/10">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamA.colorCode }} />
                        {teamA.name}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamB.colorCode }} />
                        {teamB.name}
                    </span>
                </div>
            </div>

            <div className="relative">
                {/* The Spine (Center Line) */}
                <div className="absolute left-[24px] md:left-1/2 top-0 bottom-0 w-[2px] md:-translate-x-1/2 bg-slate-200 dark:bg-slate-800 rounded-full" />

                {/* Kickoff Marker */}
                <div className="flex justify-start md:justify-center mb-8 relative pl-12 md:pl-0">
                    <span className="bg-slate-900 dark:bg-slate-800 text-[#D4AF37] text-[10px] font-black uppercase px-4 py-1.5 rounded-full z-10 border border-slate-700 shadow-md tracking-widest">
                        MATCH KICKOFF
                    </span>
                </div>

                {/* Timeline Items */}
                <div className="space-y-8 md:space-y-12">
                    {sortedEvents.map((event) => {
                        const isTeamA = event.teamId === teamA.id;

                        return (
                            <div key={event.id}>
                                {/* Desktop Layout (>= 768px): Alternating Left/Right */}
                                <div className="hidden md:block">
                                    {isTeamA ? (
                                        // Home Team Event: w-1/2 pr-12 text-right
                                        <div className="relative flex justify-end items-center w-1/2 pr-12 text-right">
                                            {/* Minute Badge on Spine */}
                                            <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center font-black font-mono text-[10px] z-10 shadow-sm bg-emerald-600 text-white">
                                                {event.minute}'
                                            </div>

                                            {/* Event Card */}
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 w-full max-w-[280px]">
                                                <div className="flex items-start gap-3 flex-row-reverse">
                                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                                                        {renderEventIcon(event.type)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                                                            {event.type.replace('_', ' ')}
                                                        </h4>
                                                        <p className="font-medium text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                            {event.detailText || teamA.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Away Team Event: w-1/2 pl-12 ml-auto text-left
                                        <div className="relative flex justify-start items-center w-1/2 pl-12 ml-auto text-left">
                                            {/* Minute Badge on Spine */}
                                            <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center font-black font-mono text-[10px] z-10 shadow-sm bg-emerald-600 text-white">
                                                {event.minute}'
                                            </div>

                                            {/* Event Card */}
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 w-full max-w-[280px]">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                                                        {renderEventIcon(event.type)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                                                            {event.type.replace('_', ' ')}
                                                        </h4>
                                                        <p className="font-medium text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                            {event.detailText || teamB.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Layout (< 768px): Left-aligned row with left-[4px] minute badge */}
                                <div className="md:hidden relative flex justify-start items-center w-full pl-16">
                                    {/* Minute Badge on left Spine */}
                                    <div className="absolute left-[4px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center font-black font-mono text-[10px] z-10 shadow-sm bg-emerald-600 text-white">
                                        {event.minute}'
                                    </div>

                                    {/* Event Card */}
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-white/5 w-full max-w-[280px]">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                                                {renderEventIcon(event.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                                                    {event.type.replace('_', ' ')}
                                                </h4>
                                                <p className="font-medium text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                    {event.detailText || (isTeamA ? teamA.name : teamB.name)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Match End Marker */}
                <div className="flex justify-start md:justify-center mt-8 relative pl-12 md:pl-0">
                    <span className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-[10px] font-black uppercase px-4 py-1.5 rounded-full z-10 border border-slate-700 shadow-md tracking-widest">
                        {match.status === 'FT' ? 'FULL TIME CONCLUDED' : match.status === 'HT' ? 'HALF TIME BREAK' : 'MATCH IN PROGRESS'}
                    </span>
                </div>
            </div>
        </div>
    );
};

