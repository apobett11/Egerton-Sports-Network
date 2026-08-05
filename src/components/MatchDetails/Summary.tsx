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
        <div className="w-full max-w-3xl mx-auto py-6 select-none space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                        Chronological Log
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Match Event Timeline
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
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
                {/* Center vertical line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-slate-200 dark:bg-slate-800/80" />

                {/* Kickoff Marker */}
                <div className="flex justify-center mb-8 relative">
                    <span className="bg-slate-900 dark:bg-slate-800 text-[#D4AF37] text-[10px] font-black uppercase px-4 py-1.5 rounded-full z-10 border border-slate-700 shadow-md tracking-widest">
                        MATCH KICKOFF
                    </span>
                </div>

                {/* Timeline Items */}
                <div className="space-y-6">
                    {sortedEvents.map((event) => {
                        const isTeamA = event.teamId === teamA.id;

                        return (
                            <div
                                key={event.id}
                                className={`flex w-full items-center relative ${isTeamA ? 'flex-row' : 'flex-row-reverse'}`}
                            >
                                {/* Event details card */}
                                <div className={`w-[45%] flex ${isTeamA ? 'justify-end text-right' : 'justify-start text-left'}`}>
                                    <div className={`p-4 rounded-2xl bg-white dark:bg-[#0E1424] border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-md transition-all space-y-1 max-w-[260px] w-full ${isTeamA ? 'mr-2' : 'ml-2'}`}>
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            <span>{event.type.replace('_', ' ')}</span>
                                            <span className="font-mono text-emerald-500 font-bold">{event.minute}'</span>
                                        </div>
                                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug">
                                            {event.detailText || 'Match Action'}
                                        </p>
                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                            {isTeamA ? teamA.name : teamB.name}
                                        </div>
                                    </div>
                                </div>

                                {/* Center minute badge */}
                                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
                                    <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-xs font-black text-white border-2 border-white dark:border-[#090D16] shadow-md ring-2 ring-emerald-500/20">
                                        {event.minute}'
                                    </div>
                                </div>

                                {/* Icon visual indicator side */}
                                <div className={`w-[45%] flex items-center px-4 ${isTeamA ? 'justify-start' : 'justify-end'}`}>
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700/80">
                                        {renderEventIcon(event.type)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Match End Marker */}
                <div className="flex justify-center mt-8 relative">
                    <span className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-[10px] font-black uppercase px-4 py-1.5 rounded-full z-10 border border-slate-700 shadow-md tracking-widest">
                        {match.status === 'FT' ? 'FULL TIME CONCLUDED' : match.status === 'HT' ? 'HALF TIME BREAK' : 'MATCH IN PROGRESS'}
                    </span>
                </div>
            </div>
        </div>
    );
};

