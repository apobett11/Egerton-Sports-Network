import React, { useState, useEffect } from 'react';
import { Calendar, HelpCircle } from 'lucide-react';
import type { Match } from '../../types';
import { supabase } from '../../lib/supabase';
import { MatchHeader } from './MatchHeader';
import { TabBar } from './TabBar';
import type { MatchDetailTabType } from './TabBar';
import { Summary } from './Summary';
import { Stats } from './Stats';
import { Lineups } from './Lineups';
import { MatchDetailsCard } from './MatchDetailsCard';
import { MatchContext } from './MatchContext';
import { CaptainsNotes } from './CaptainsNotes';
import { FormTab } from './FormTab';
import { PlayerRatings } from './PlayerRatings';

interface MatchDetailsContainerProps {
    match: Match;
    onBack: () => void;
    favorites: string[];
    toggleFavorite: (matchId: string) => void;
}

export const MatchDetailsContainer: React.FC<MatchDetailsContainerProps> = ({
    match,
    onBack,
    favorites,
    toggleFavorite
}) => {
    const [currentMatch, setCurrentMatch] = useState<Match>(match);
    
    // Determine default tab based on match lifecycle state
    const isPreMatch = match.status === 'UPCOMING' || match.status === 'POSTPONED' || match.status === 'CANCELLED';
    const [activeTab, setActiveTab] = useState<MatchDetailTabType>(isPreMatch ? 'squads' : 'overview');

    useEffect(() => {
        setCurrentMatch(match);
        const preMatch = match.status === 'UPCOMING' || match.status === 'POSTPONED' || match.status === 'CANCELLED';
        setActiveTab(preMatch ? 'squads' : 'overview');
    }, [match]);

    useEffect(() => {
        const channel = supabase
            .channel(`match-details-${match.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fixtures', filter: `id=eq.${match.id}` },
                (payload) => {
                    if (payload.new) {
                        const updated = payload.new as any;
                        setCurrentMatch((prev) => ({
                            ...prev,
                            scoreA: updated.score_home ?? prev.scoreA,
                            scoreB: updated.score_away ?? prev.scoreB,
                            status: updated.status ?? prev.status
                        }));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'match_events', filter: `fixture_id=eq.${match.id}` },
                (payload) => {
                    if (payload.new) {
                        const raw = payload.new as any;
                        const newEvt = {
                            id: raw.id,
                            fixtureId: raw.fixture_id,
                            minute: raw.minute,
                            type: raw.type,
                            eventTarget: raw.event_target,
                            teamId: raw.team_id,
                            detailText: raw.detail_text,
                            createdAt: raw.created_at
                        };
                        setCurrentMatch((prev) => {
                            if (prev.events.some((e) => e.id === newEvt.id)) return prev;
                            return {
                                ...prev,
                                events: [...prev.events, newEvt]
                            };
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [match.id]);

    const isFavorite = favorites.includes(currentMatch.id);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-4">
                        <MatchContext match={currentMatch} />
                        <Summary match={currentMatch} />
                    </div>
                );

            case 'squads':
            case 'lineups':
                return <Lineups match={currentMatch} />;

            case 'timeline':
                return <Summary match={currentMatch} />;

            case 'stats':
                return <Stats match={currentMatch} />;

            case 'ratings':
                return <PlayerRatings match={currentMatch} />;

            case 'captains_notes':
                return <CaptainsNotes match={currentMatch} />;

            case 'form':
                return <FormTab match={currentMatch} />;

            case 'context':
                return <MatchContext match={currentMatch} />;

            case 'details':
                return <MatchDetailsCard match={currentMatch} />;

            case 'h2h':
                // Head-to-Head mock summary - exact original implementation preserved
                return (
                    <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none space-y-4">
                        <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm transition-colors text-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">History</span>
                            <h4 className="text-xs font-extrabold text-gray-850 dark:text-gray-200 mt-1">
                                Recent head-to-head records
                            </h4>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
                            {[
                                { date: '12 Jan 2026', scoreA: 2, scoreB: 0, winner: match.teamA.name },
                                { date: '19 Oct 2025', scoreA: 1, scoreB: 1, winner: 'Draw' },
                                { date: '14 May 2025', scoreA: 0, scoreB: 2, winner: match.teamB.name },
                            ].map((h2h, idx) => (
                                <div key={idx} className="flex items-center justify-between px-4 py-3 text-xs font-semibold">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{h2h.date}</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500 dark:text-gray-400">{match.teamA.shortName}</span>
                                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-bold text-gray-800 dark:text-white">
                                            {h2h.scoreA} - {h2h.scoreB}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">{match.teamB.shortName}</span>
                                    </div>

                                    <span className={`text-[10px] font-bold uppercase ${h2h.winner === 'Draw' ? 'text-gray-400' : 'text-emerald-600 dark:text-emerald-500'}`}>
                                        {h2h.winner === 'Draw' ? 'Draw' : `${h2h.winner.split(' ').pop()} Win`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex items-center justify-center p-8">
                        <HelpCircle className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black/45 pb-10 transition-colors">
            <MatchHeader
                match={match}
                onBack={onBack}
                isFavorite={isFavorite}
                onToggleFavorite={() => toggleFavorite(match.id)}
            />

            <TabBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                status={currentMatch.status}
            />

            <main className="max-w-2xl mx-auto py-2">
                {renderTabContent()}
            </main>
        </div>
    );
};
