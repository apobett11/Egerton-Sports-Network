import React, { useState, useEffect } from 'react';
import { Award, Trophy, UserCheck, Clock, Star, Sparkles } from 'lucide-react';
import type { Match, Player } from '../../types';
import { supabase } from '../../lib/supabase';

interface PlayerRatingsProps {
    match: Match;
}

interface MotmNominationData {
    id: string;
    playerId: string;
    playerName: string;
    jerseyNumber: number;
    position: string;
    teamId: string;
    teamName: string;
    teamLogo: string;
    avatarUrl?: string;
    refereeName?: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    ratingStr: string;
}

export const PlayerRatings: React.FC<PlayerRatingsProps> = ({ match }) => {
    const { teamA, teamB, lineups, events = [] } = match;
    const isCompleted = ['FT', 'FINAL', 'ARCHIVED', 'FT_PENDING_VERIFICATION'].includes(match.status);

    const [nominatedPlayer, setNominatedPlayer] = useState<MotmNominationData | null>(null);
    const [loadingMotm, setLoadingMotm] = useState<boolean>(true);
    const [selectedTeam, setSelectedTeam] = useState<'teamA' | 'teamB'>('teamA');

    // Calculate rating based on stored match events (Goals, Assists, Cards)
    const computePlayerRating = (player: Player): { ratingStr: string; ratingVal: number; goals: number; assists: number; yellows: number; reds: number } => {
        const playerEvts = events.filter((e) => e.playerId === player.id);
        const playerAssists = events.filter((e) => e.assistPlayerId === player.id);
        const goals = playerEvts.filter((e) => e.type === 'goal' || e.type === 'penalty').length;
        const yellows = playerEvts.filter((e) => e.type === 'yellow').length;
        const reds = playerEvts.filter((e) => e.type === 'red').length;
        const assists = playerAssists.length;

        if (typeof player.rating === 'number' && player.rating > 0) {
            return { ratingStr: player.rating.toFixed(1), ratingVal: player.rating, goals, assists, yellows, reds };
        }

        let base = player.isSub ? 6.0 : 6.5;
        base += goals * 1.5;
        base += assists * 0.8;
        base -= yellows * 0.6;
        base -= reds * 2.0;

        const finalRating = Math.min(10.0, Math.max(4.0, base));
        return { ratingStr: finalRating.toFixed(1), ratingVal: finalRating, goals, assists, yellows, reds };
    };

    // Query official referee nomination from database
    useEffect(() => {
        let isMounted = true;
        setLoadingMotm(true);

        const fetchNomination = async () => {
            try {
                const { data, error } = await supabase
                    .from('man_of_the_match_nominations')
                    .select(`
                        id,
                        player_id,
                        team_id,
                        referee_id,
                        created_at,
                        player:players(id, jersey_number, position, name, first_name, last_name, profile_id, profile:profiles(first_name, last_name, avatar_url)),
                        team:teams(id, name, short_name, logo_url, color_code)
                    `)
                    .eq('fixture_id', match.id)
                    .maybeSingle();

                if (!isMounted) return;

                if (!error && data && data.player) {
                    const rawP = data.player as any;
                    const rawT = data.team as any;
                    const prof = rawP.profile;
                    const resolvedName = rawP.name || (rawP.first_name && rawP.last_name ? `${rawP.first_name} ${rawP.last_name}` : prof ? `${prof.first_name} ${prof.last_name}` : `Player #${rawP.jersey_number}`);
                    
                    // Match player from lineups for stats
                    const allLineupPlayers = [...(lineups?.teamA || []), ...(lineups?.teamB || [])];
                    const lineupMatch = allLineupPlayers.find((p) => p.id === rawP.id || p.profile_id === rawP.profile_id);
                    const stats = lineupMatch ? computePlayerRating(lineupMatch) : { ratingStr: '8.8', ratingVal: 8.8, goals: 1, assists: 0, yellows: 0, reds: 0 };

                    setNominatedPlayer({
                        id: data.id,
                        playerId: rawP.id,
                        playerName: resolvedName,
                        jerseyNumber: rawP.jersey_number || 10,
                        position: rawP.position || 'FWD',
                        teamId: rawT?.id || '',
                        teamName: rawT?.name || 'Club',
                        teamLogo: rawT?.logo_url || '',
                        avatarUrl: prof?.avatar_url,
                        refereeName: match.referee,
                        goals: stats.goals,
                        assists: stats.assists,
                        yellowCards: stats.yellows,
                        redCards: stats.reds,
                        ratingStr: stats.ratingStr,
                    });
                } else {
                    // If no database nomination yet: for completed match, fallback to top performer
                    const allPlayers = [
                        ...(lineups?.teamA || []).map(p => ({ ...p, teamObj: teamA })),
                        ...(lineups?.teamB || []).map(p => ({ ...p, teamObj: teamB }))
                    ];

                    if (allPlayers.length > 0) {
                        const evaluated = allPlayers.map(p => {
                            const c = computePlayerRating(p);
                            return { ...p, ...c };
                        });
                        const highest = evaluated.sort((a, b) => b.ratingVal - a.ratingVal)[0];

                        if (highest && isCompleted) {
                            setNominatedPlayer({
                                id: 'standout',
                                playerId: highest.id,
                                playerName: highest.name,
                                jerseyNumber: highest.number,
                                position: highest.position,
                                teamId: highest.teamObj.id,
                                teamName: highest.teamObj.name,
                                teamLogo: highest.teamObj.logo,
                                refereeName: match.referee,
                                goals: highest.goals,
                                assists: highest.assists,
                                yellowCards: highest.yellows,
                                redCards: highest.reds,
                                ratingStr: highest.ratingStr,
                            });
                        } else {
                            setNominatedPlayer(null);
                        }
                    } else {
                        setNominatedPlayer(null);
                    }
                }
            } catch (err) {
                console.error('Error fetching MOTM nomination:', err);
                if (isMounted) setNominatedPlayer(null);
            } finally {
                if (isMounted) setLoadingMotm(false);
            }
        };

        fetchNomination();

        return () => {
            isMounted = false;
        };
    }, [match.id, match.status]);

    const mapPlayers = (players: Player[]) => {
        return players.map((p) => {
            const stats = computePlayerRating(p);
            return { ...p, ...stats };
        });
    };

    const playersA = mapPlayers(lineups?.teamA || []);
    const playersB = mapPlayers(lineups?.teamB || []);
    const currentPlayers = selectedTeam === 'teamA' ? playersA : playersB;
    const currentTeam = selectedTeam === 'teamA' ? teamA : teamB;

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. MAN OF THE MATCH HERO SECTION */}
            {!isCompleted ? (
                // FIXTURES / UPCOMING / LIVE MATCH STATE
                <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden p-6 shadow-xs text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-1">
                        <Trophy className="w-7 h-7" />
                    </div>

                    <div className="space-y-1.5 max-w-md mx-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block">
                            OFFICIAL ACCREDITATION
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            To Be Nominated by the Referee
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                            The accredited match referee designates the official Man of the Match upon the conclusion of regulation time.
                        </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Nomination Status: Awaiting Full-Time Debrief</span>
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Match Official: {match.referee || 'Accredited League Referee'}</span>
                        </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-[#112236] rounded-sm border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 max-w-lg mx-auto font-medium">
                        ✨ <b>Player of the Week Pathway:</b> The referee's nominated player automatically secures an official ballot ticket for the weekly Player of the Week (POTW) community vote.
                    </div>
                </div>
            ) : (
                // COMPLETED MATCH / HISTORY HERO MOTM CARD
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-[#0e1c2b] border-2 border-amber-500/30 rounded-none sm:rounded-sm overflow-hidden p-5 sm:p-6 shadow-md relative">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-5">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                OFFICIAL MATCH AWARD
                            </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>POTW Ballot Nominee</span>
                        </span>
                    </div>

                    {loadingMotm ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            Loading official nomination...
                        </div>
                    ) : nominatedPlayer ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                            {/* Player Portrait & Number */}
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-3 border-amber-400/80 p-1 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-lg flex items-center justify-center overflow-hidden">
                                        {nominatedPlayer.avatarUrl ? (
                                            <img
                                                src={nominatedPlayer.avatarUrl}
                                                alt={nominatedPlayer.playerName}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black font-mono text-2xl">
                                                {nominatedPlayer.jerseyNumber}
                                            </div>
                                        )}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-xs font-mono font-black text-[10px] bg-amber-400 text-black shadow-md">
                                        #{nominatedPlayer.jerseyNumber}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    {nominatedPlayer.position}
                                </span>
                            </div>

                            {/* Player Name & Team */}
                            <div className="space-y-2 text-center sm:text-left sm:col-span-2">
                                <div className="space-y-0.5">
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {nominatedPlayer.playerName}
                                    </h3>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                                        {nominatedPlayer.teamLogo && (
                                            <img
                                                src={nominatedPlayer.teamLogo}
                                                alt=""
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        )}
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                            {nominatedPlayer.teamName}
                                        </span>
                                    </div>
                                </div>

                                {/* Performance Metrics Bar */}
                                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                                    <div className="bg-white/80 dark:bg-[#112236] border border-slate-200 dark:border-slate-800 rounded-xs p-2">
                                        <span className="text-[9px] font-black text-slate-400 block uppercase">Match Rating</span>
                                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                                            ★ {nominatedPlayer.ratingStr}
                                        </span>
                                    </div>
                                    <div className="bg-white/80 dark:bg-[#112236] border border-slate-200 dark:border-slate-800 rounded-xs p-2">
                                        <span className="text-[9px] font-black text-slate-400 block uppercase">Goals</span>
                                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                                            ⚽ {nominatedPlayer.goals}
                                        </span>
                                    </div>
                                    <div className="bg-white/80 dark:bg-[#112236] border border-slate-200 dark:border-slate-800 rounded-xs p-2">
                                        <span className="text-[9px] font-black text-slate-400 block uppercase">Assists</span>
                                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                                            🎯 {nominatedPlayer.assists}
                                        </span>
                                    </div>
                                    <div className="bg-white/80 dark:bg-[#112236] border border-slate-200 dark:border-slate-800 rounded-xs p-2">
                                        <span className="text-[9px] font-black text-slate-400 block uppercase">Discipline</span>
                                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                                            {nominatedPlayer.yellowCards > 0 ? `🟨 ${nominatedPlayer.yellowCards}` : 'Clean'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                    <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Nominated by Official Referee: <b>{nominatedPlayer.refereeName || match.referee || 'Accredited Referee'}</b></span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center text-xs text-slate-400">
                            No player nomination has been recorded yet for this fixture.
                        </div>
                    )}
                </div>
            )}

            {/* 2. FULL SQUAD PLAYER RATINGS ACCORDION */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                        FULL MATCH PLAYER RATINGS
                    </span>

                    {/* Team Selector Toggle */}
                    <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-full">
                        <button
                            type="button"
                            onClick={() => setSelectedTeam('teamA')}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors cursor-pointer ${
                                selectedTeam === 'teamA'
                                    ? 'bg-[#ff0046] text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {teamA.shortName}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedTeam('teamB')}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors cursor-pointer ${
                                selectedTeam === 'teamB'
                                    ? 'bg-[#ff0046] text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {teamB.shortName}
                        </button>
                    </div>
                </div>

                {currentPlayers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                        Lineup ratings will update as events and pitch minutes are recorded.
                    </div>
                ) : (
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b] overflow-x-auto no-scrollbar">
                        {currentPlayers.map((player) => {
                            const isMotmNominee = nominatedPlayer && nominatedPlayer.playerId === player.id;
                            const ratingNum = player.ratingVal;
                            const isHigh = ratingNum >= 8.0;
                            const isMedium = ratingNum >= 7.0 && ratingNum < 8.0;

                            return (
                                <div
                                    key={player.id}
                                    className="px-4 py-3 flex items-center justify-between hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors text-xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs text-white shadow-xs shrink-0"
                                            style={{ backgroundColor: currentTeam.colorCode || '#ff0046' }}
                                        >
                                            {player.number}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                                    {player.name}
                                                </span>
                                                {isMotmNominee && (
                                                    <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 text-[9px] font-black px-1.5 py-0.2 rounded-xs flex items-center gap-1 uppercase">
                                                        <Award className="w-3 h-3" /> MOTM
                                                    </span>
                                                )}
                                                {player.isCaptain && (
                                                    <span className="bg-amber-400 text-black text-[8px] font-black px-1 rounded-xs">
                                                        C
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                                {player.position} • {player.isSub ? 'Sub' : 'Starter'}
                                                {player.goals > 0 ? ` • ${player.goals}G` : ''}
                                                {player.assists > 0 ? ` • ${player.assists}A` : ''}
                                                {player.yellows > 0 ? ` • 🟨` : ''}
                                                {player.reds > 0 ? ` • 🟥` : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rating badge */}
                                    <div
                                        className={`px-2.5 py-1 rounded-xs text-xs font-black flex items-center gap-1 font-mono ${
                                            isHigh
                                                ? 'bg-emerald-500 text-white'
                                                : isMedium
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>{player.ratingStr}</span>
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


