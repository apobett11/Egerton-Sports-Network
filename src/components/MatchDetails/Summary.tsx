import React from 'react';
import { ArrowLeftRight, HelpCircle } from 'lucide-react';
import type { Match, MatchEvent } from '../../types';

interface SummaryProps {
    match: Match;
}

export const Summary: React.FC<SummaryProps> = ({ match }) => {
    const { events, teamA } = match;

    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-transparent select-none">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    No key events have occurred in this match yet.
                </p>
            </div>
        );
    }

    // Sort events chronologically by minute
    const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

    const renderEventIcon = (type: MatchEvent['type']) => {
        switch (type) {
            case 'goal':
                return (
                    <span className="text-base" role="img" aria-label="Goal">
                        ⚽
                    </span>
                );
            case 'yellow':
                return <div className="w-3 h-4 bg-amber-400 rounded-sm shadow-xs" title="Yellow Card" />;
            case 'red':
                return <div className="w-3 h-4 bg-red-600 rounded-sm shadow-xs animate-pulse" title="Red Card" />;
            case 'injury':
                return <span className="text-base" role="img" aria-label="Injury">🤕</span>;
            case 'sub_in':
            case 'sub_out':
                return <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-500" />;
            case 'kickoff':
            case 'second_half':
                return <span className="text-sm font-black text-emerald-500">▶</span>;
            case 'ht':
                return <span className="text-sm font-black text-amber-500">⏸</span>;
            case 'ft':
                return <span className="text-sm font-black text-gray-400">🏁</span>;
            default:
                return <HelpCircle className="w-3.5 h-3.5 text-gray-400" />;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-8 px-4 select-none">
            <div className="relative">
                {/* Center line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-200 dark:bg-gray-800" />

                {/* Start Match Marker */}
                <div className="flex justify-center mb-8 relative">
                    <div className="bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase px-3 py-1 rounded-full z-10 border border-gray-200 dark:border-gray-700">
                        KICK OFF
                    </div>
                </div>

                {/* Timeline Items */}
                <div className="space-y-8">
                    {sortedEvents.map((event) => {
                        const isTeamA = event.teamId === teamA.id;

                        return (
                            <div
                                key={event.id}
                                className={`flex w-full items-center relative ${isTeamA ? 'flex-row' : 'flex-row-reverse'
                                    }`}
                            >
                                {/* Event details block */}
                                <div className={`w-[45%] flex ${isTeamA ? 'justify-end text-right' : 'justify-start text-left'}`}>
                                    <div className={`max-w-[200px] p-3 rounded-xl bg-gray-50 dark:bg-[#1E1E1E] border border-gray-150 dark:border-gray-800 shadow-sm ${isTeamA ? 'mr-0' : 'ml-0'
                                        }`}>
                                        <span className="text-[10px] text-gray-480 dark:text-gray-500 font-extrabold">
                                            {event.type.toUpperCase().replace('_', ' ')}
                                        </span>
                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                                            {event.detailText || 'Event Player'}
                                        </p>
                                    </div>
                                </div>

                                {/* Center dot/number */}
                                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white border-2 border-white dark:border-[#111111] shadow-sm">
                                        {event.minute}'
                                    </div>
                                </div>

                                {/* Left/Right Icon visualization */}
                                <div className={`w-[45%] flex items-center px-4 ${isTeamA ? 'justify-start' : 'justify-end'}`}>
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-850 flex items-center justify-center shadow-xs border border-gray-200 dark:border-gray-750">
                                        {renderEventIcon(event.type)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* End of timeline marker or HT marker if match is still running */}
                <div className="flex justify-center mt-8 relative">
                    <div className="bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase px-3 py-1 rounded-full z-10 border border-gray-200 dark:border-gray-700">
                        {match.status === 'FT' ? 'FULL TIME' : match.status === 'HT' ? 'HALF TIME' : 'LIVE CONTEST'}
                    </div>
                </div>
            </div>
        </div>
    );
};
