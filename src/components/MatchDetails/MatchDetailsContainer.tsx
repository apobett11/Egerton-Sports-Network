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
    const [h2hRecords, setH2hRecords] = useState<Array<{ id: string; date: string; scoreA: number; scoreB: number; winner: string; venue: string; comp?: string; homeName?: string; awayName?: string }>>([]);
    
    const [activeTab, setActiveTab] = useState<MatchDetailTabType>('lineups');

    useEffect(() => {
        setCurrentMatch(match);

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

    // Compute H2H summary totals
    const h2hWinsA = h2hRecords.filter(r => r.winner === currentMatch.teamA.name || r.winner === currentMatch.teamA.shortName).length;
    const h2hWinsB = h2hRecords.filter(r => r.winner === currentMatch.teamB.name || r.winner === currentMatch.teamB.shortName).length;
    const h2hDraws = h2hRecords.filter(r => r.winner === 'Draw').length;
    const h2hGoalsA = h2hRecords.reduce((acc, r) => acc + (r.scoreA || 0), 0);
    const h2hGoalsB = h2hRecords.reduce((acc, r) => acc + (r.scoreB || 0), 0);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <Summary match={currentMatch} />
                        <MatchDetailsCard match={currentMatch} />
                        <MatchContext match={currentMatch} />
                        {(currentMatch.captainNotesA || currentMatch.captainNotesB) && (
                            <CaptainsNotes match={currentMatch} />
                        )}
                    </div>
                );

            case 'lineups':
                return <Lineups match={currentMatch} />;

            case 'stats':
                return <Stats match={currentMatch} />;

            case 'ratings':
                return <PlayerRatings match={currentMatch} />;

            case 'timeline':
                return (
                    <div className="w-full max-w-3xl mx-auto py-4 select-none space-y-4">
                        <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                            <div className="px-4 py-3 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                                    LIVE MATCH COMMENTARY
                                </span>
                                <span className="text-[10px] font-bold text-[#ff0046] flex items-center gap-1 uppercase">
                                    <span className="w-2 h-2 rounded-full bg-[#ff0046] animate-ping inline-block" />
                                    Chronological Feed
                                </span>
                            </div>

                            {currentMatch.events.length === 0 ? (
                                <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                                    <div className="text-2xl">🎙️</div>
                                    <p className="font-bold text-slate-600 dark:text-slate-300">No commentary events logged yet.</p>
                                    <p className="text-[11px]">Match commentary will appear here in real-time as goals, cards, and tactical substitutions occur on the pitch.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                                    {[...currentMatch.events].sort((a, b) => b.minute - a.minute).map((ev) => {
                                        const isTeamA = ev.teamId === currentMatch.teamA.id;
                                        const team = isTeamA ? currentMatch.teamA : currentMatch.teamB;

                                        return (
                                            <div key={ev.id} className="p-4 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors flex items-start gap-3 text-xs">
                                                <div className="font-mono font-black text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[#ff0046] rounded-xs shrink-0">
                                                    {ev.minute}'
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <img src={team.logo} alt={team.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                                                        <span className="font-bold text-slate-900 dark:text-white truncate">
                                                            {team.name}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                            {ev.type}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
                                                        {ev.detailText || (
                                                            ev.type === 'goal' ? `GOAL! ${team.name} scores!` :
                                                            ev.type === 'yellow' ? `Yellow card issued to ${team.name} player.` :
                                                            ev.type === 'red' ? `RED CARD! Player sent off for ${team.name}.` :
                                                            ev.type === 'sub_in' ? `Tactical substitution executed by ${team.name}.` :
                                                            ev.type === 'penalty' ? `Penalty awarded to ${team.name}!` :
                                                            `${ev.type.toUpperCase()} recorded.`
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

            case 'form':
                return <FormTab match={currentMatch} />;

            case 'h2h':
                return (
                    <div className="w-full max-w-3xl mx-auto py-4 select-none space-y-4">
                        {/* H2H Overall Stats Header Card */}
                        <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 shadow-xs">
                            <div className="text-[10px] font-black uppercase text-amber-500 tracking-wider mb-3 text-center">
                                Head-to-Head Historical Summary
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                                <div>
                                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{h2hWinsA}</span>
                                    <span className="text-[10px] font-bold text-slate-400 block truncate">{currentMatch.teamA.shortName} Wins</span>
                                </div>
                                <div>
                                    <span className="text-2xl font-black font-mono text-slate-500">{h2hDraws}</span>
                                    <span className="text-[10px] font-bold text-slate-400 block">Draws</span>
                                </div>
                                <div>
                                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{h2hWinsB}</span>
                                    <span className="text-[10px] font-bold text-slate-400 block truncate">{currentMatch.teamB.shortName} Wins</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                <span>Total Matches: <b className="text-slate-800 dark:text-white">{h2hRecords.length}</b></span>
                                <span>Goals Scored: <b className="text-slate-800 dark:text-white">{h2hGoalsA} - {h2hGoalsB}</b></span>
                            </div>
                        </div>

                        {/* List of Previous Fixtures */}
                        <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                            <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-800 dark:text-white">
                                Previous Encounters
                            </div>

                            {h2hRecords.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    No prior completed head-to-head fixtures recorded in the database between these two clubs.
                                </div>
                            ) : (
                                <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b] overflow-x-auto no-scrollbar">
                                    {h2hRecords.map((h2h) => (
                                        <div key={h2h.id} className="flex items-center justify-between px-4 py-3 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                                            <div className="flex items-center gap-2 text-slate-400 min-w-0">
                                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                <span className="font-mono text-[11px]">{h2h.date}</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">{h2h.comp || 'EPL'}</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-[100px] text-right">{h2h.homeName || currentMatch.teamA.shortName}</span>
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-sm font-mono font-black text-slate-900 dark:text-white">
                                                    {h2h.scoreA} - {h2h.scoreB}
                                                </span>
                                                <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-[100px]">{h2h.awayName || currentMatch.teamB.shortName}</span>
                                            </div>

                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-xs ${
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
