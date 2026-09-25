import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import type { Match, Player } from '../../types';
import { ApiService } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { resolveAllocatedOfficials } from '../../lib/matchdayHelper';
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
    const isBegunOrPlayed = (status?: string) => {
        if (!status) return false;
        const upper = status.toUpperCase();
        return ['LIVE', 'HT', 'HALF_TIME', 'SECOND_HALF', '1H', '2H', 'FT', 'FULL_TIME', 'FINALIZED', 'COMPLETED'].includes(upper);
    };

    const [currentMatch, setCurrentMatch] = useState<Match>(() => {
        const off = resolveAllocatedOfficials(match);
        return {
            ...match,
            referee: off.centerReferee || match.referee,
            centerReferee: off.centerReferee || match.centerReferee,
            refereeId: off.centerRefereeId || match.refereeId,
            centerRefereeId: off.centerRefereeId || match.centerRefereeId,
            linesmanTeamAName: match.linesmanTeamAName || off.linesmanTeamA,
            linesmanTeamBName: match.linesmanTeamBName || off.linesmanTeamB,
        };
    });
    const [activeTab, setActiveTab] = useState<MatchDetailTabType>(() => {
        return isBegunOrPlayed(match.status) ? 'timeline' : 'details';
    });

    useEffect(() => {
        const offInit = resolveAllocatedOfficials(match);
        const resolvedInitMatch: Match = {
            ...match,
            referee: offInit.centerReferee || match.referee,
            centerReferee: offInit.centerReferee || match.centerReferee,
            refereeId: offInit.centerRefereeId || match.refereeId,
            centerRefereeId: offInit.centerRefereeId || match.centerRefereeId,
            linesmanTeamAName: match.linesmanTeamAName || offInit.linesmanTeamA,
            linesmanTeamBName: match.linesmanTeamBName || offInit.linesmanTeamB,
        };
        setCurrentMatch(resolvedInitMatch);
        if (isBegunOrPlayed(match.status)) {
            setActiveTab('timeline');
        } else {
            setActiveTab('details');
        }

        // Fetch deep match details from database
        ApiService.getMatchDetails(match.id).then(async (res) => {
            const offDeep = resolveAllocatedOfficials(res.data || match);
            if (res.data && isBegunOrPlayed(res.data.status)) {
                setActiveTab('timeline');
            }
            if (res.data && res.data.lineups?.teamA && res.data.lineups.teamA.length > 0) {
                setCurrentMatch({
                    ...res.data,
                    referee: offDeep.centerReferee || res.data.referee,
                    centerReferee: offDeep.centerReferee || res.data.centerReferee,
                    linesmanTeamAName: res.data.linesmanTeamAName || offDeep.linesmanTeamA,
                    linesmanTeamBName: res.data.linesmanTeamBName || offDeep.linesmanTeamB,
                });
            } else {
                // Direct database query fallback for team players:
                // SELECT * FROM players WHERE team_id = team.id
                const homeId = match.teamA?.id;
                const awayId = match.teamB?.id;

                const [pARes, pBRes] = await Promise.all([
                    homeId ? supabase.from('players').select('id, jersey_number, position, first_name, last_name, profile_id').eq('team_id', homeId).order('jersey_number', { ascending: true }) : Promise.resolve({ data: [] as any[] }),
                    awayId ? supabase.from('players').select('id, jersey_number, position, first_name, last_name, profile_id').eq('team_id', awayId).order('jersey_number', { ascending: true }) : Promise.resolve({ data: [] as any[] })
                ]);

                const mapDbPlayer = (p: any, idx: number, isSub: boolean): Player => ({
                    id: p.id,
                    name: (p.first_name && p.last_name) ? `${p.first_name} ${p.last_name}`.trim() : (p.name || `Player #${p.jersey_number || idx + 1}`),
                    number: p.jersey_number || idx + 1,
                    position: (p.position === 'GK' || p.position === 'DEF' || p.position === 'MID' || p.position === 'FWD') ? p.position : 'MID',
                    isCaptain: false,
                    isSub,
                    profile_id: p.profile_id
                });

                const rawA = pARes.data || [];
                const rawB = pBRes.data || [];

                const startersA = rawA.slice(0, 11).map((p: any, i: number) => mapDbPlayer(p, i, false));
                const subsA = rawA.slice(11).map((p: any, i: number) => mapDbPlayer(p, 11 + i, true));
                const startersB = rawB.slice(0, 11).map((p: any, i: number) => mapDbPlayer(p, i, false));
                const subsB = rawB.slice(11).map((p: any, i: number) => mapDbPlayer(p, 11 + i, true));

                const base = res.data || match;
                setCurrentMatch({
                    ...base,
                    referee: offDeep.centerReferee || base.referee,
                    centerReferee: offDeep.centerReferee || base.centerReferee,
                    linesmanTeamAName: base.linesmanTeamAName || offDeep.linesmanTeamA,
                    linesmanTeamBName: base.linesmanTeamBName || offDeep.linesmanTeamB,
                    lineups: {
                        teamA: [...startersA, ...subsA],
                        teamB: [...startersB, ...subsB],
                        formationA: base.lineups?.formationA || '4-3-3',
                        formationB: base.lineups?.formationB || '4-3-3'
                    }
                });
            }
        });
    }, [match.id, match.teamA?.id, match.teamB?.id]);

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
