import React, { useState, useEffect } from 'react';
import { Calendar, HelpCircle } from 'lucide-react';
import type { Match } from '../../types';
import { ApiService } from '../../services/api';
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
    const [h2hRecords, setH2hRecords] = useState<Array<{ id: string; date: string; scoreA: number; scoreB: number; winner: string; venue: string }>>([]);
    
    const [activeTab, setActiveTab] = useState<MatchDetailTabType>('squads');

    useEffect(() => {
        setCurrentMatch(match);
        setActiveTab('squads');

        // Fetch deep match details from database
        ApiService.getMatchDetails(match.id).then((res) => {
            if (res.data) {
                setCurrentMatch(res.data);
            }
        });

        // Fetch stored Head-to-Head records from database
        if (match.teamA?.id && match.teamB?.id) {
            ApiService.getHeadToHead(match.teamA.id, match.teamB.id).then((res) => {
                if (res.data) {
                    setH2hRecords(res.data);
                }
            });
        }
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
                return (
                    <div className="w-full max-w-2xl mx-auto py-6 select-none space-y-4">
                        <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                            <div className="px-4 md:px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-white/10 text-center">
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">History</span>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                                    Historical Head-to-Head Matches
                                </h4>
                            </div>

                            {h2hRecords.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    No prior completed head-to-head fixtures recorded in the database between these two teams.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50 dark:divide-white/5 overflow-x-auto no-scrollbar">
                                    {h2hRecords.map((h2h) => (
                                        <div key={h2h.id} className="flex items-center justify-between px-4 md:px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{h2h.date}</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-600 dark:text-slate-300 font-bold">{currentMatch.teamA.shortName}</span>
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono font-black text-slate-900 dark:text-white">
                                                    {h2h.scoreA} - {h2h.scoreB}
                                                </span>
                                                <span className="text-slate-600 dark:text-slate-300 font-bold">{currentMatch.teamB.shortName}</span>
                                            </div>

                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                h2h.winner === 'Draw' 
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' 
                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                                {h2h.winner === 'Draw' ? 'Draw' : `${h2h.winner} Win`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 pb-16 transition-colors relative">
            <MatchHeader
                match={currentMatch}
                onBack={onBack}
                isFavorite={isFavorite}
                onToggleFavorite={() => toggleFavorite(currentMatch.id)}
            />

            <TabBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                status={currentMatch.status}
            />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">
                {renderTabContent()}
            </main>
        </div>
    );
};
