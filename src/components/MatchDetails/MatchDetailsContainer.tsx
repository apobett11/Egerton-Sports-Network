import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<MatchDetailTabType>('squad');

    useEffect(() => {
        setCurrentMatch(match);

        // Fetch deep match details from database
        ApiService.getMatchDetails(match.id).then((res) => {
            if (res.data) {
                setCurrentMatch(res.data);
            }
        });
    }, [match.id]);

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
            case 'squad':
                return <Lineups match={currentMatch} />;

            case 'timeline':
                return <Summary match={currentMatch} />;

            case 'details':
                return <MatchDetailsCard match={currentMatch} />;

            case 'motm':
                return <PlayerRatings match={currentMatch} />;

            case 'reports':
                return <CaptainsNotes match={currentMatch} />;

            case 'jerseys':
                return <Stats match={currentMatch} />;

            case 'h2h_form':
                return <FormTab match={currentMatch} />;

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
