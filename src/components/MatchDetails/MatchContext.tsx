import React, { useState, useEffect } from 'react';
import { Target, Flame } from 'lucide-react';
import type { Match, LeagueTableEntry } from '../../types';
import { ApiService } from '../../services/api';

interface MatchContextProps {
    match: Match;
}

export const MatchContext: React.FC<MatchContextProps> = ({ match }) => {
    const { teamA, teamB } = match;

    const [standingA, setStandingA] = useState<LeagueTableEntry | null>(null);
    const [standingB, setStandingB] = useState<LeagueTableEntry | null>(null);
    const [formA, setFormA] = useState<Array<{ result: 'W' | 'D' | 'L'; label: string }>>([]);
    const [formB, setFormB] = useState<Array<{ result: 'W' | 'D' | 'L'; label: string }>>([]);

    useEffect(() => {
        ApiService.getLeagueTable().then((res) => {
            if (res.data) {
                const foundA = res.data.find(e => e.teamId === teamA?.id || e.teamName === teamA?.name);
                const foundB = res.data.find(e => e.teamId === teamB?.id || e.teamName === teamB?.name);
                if (foundA) setStandingA(foundA);
                if (foundB) setStandingB(foundB);
            }
        });

        if (teamA?.id) {
            ApiService.getTeamForm(teamA.id).then(res => {
                if (res.data) setFormA(res.data);
            });
        }
        if (teamB?.id) {
            ApiService.getTeamForm(teamB.id).then(res => {
                if (res.data) setFormB(res.data);
            });
        }
    }, [teamA?.id, teamB?.id, teamA?.name, teamB?.name]);

    const formatStreak = (teamName: string, form: Array<{ result: 'W' | 'D' | 'L'; label: string }>) => {
        if (form.length === 0) return `${teamName}: No previous matches recorded`;
        const lastThree = form.slice(0, 3).map(f => f.result).join('-');
        const wins = form.filter(f => f.result === 'W').length;
        return `${teamName}: [${lastThree}] (${wins} wins in last ${form.length})`;
    };

    const getOrdinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return (
        <div className="w-full max-w-3xl mx-auto py-6 select-none space-y-6">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                    Context & Stakes
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                    League Context & Match Stakes
                </h3>
            </div>

            {/* Match Context Card */}
            <div className="bg-white dark:bg-[#0E1424] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 space-y-6 transition-colors">
                
                {/* League position & Points grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                    {/* Team A stats */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamA.colorCode }} />
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{teamA.name}</span>
                        </div>
                        <div className="pl-5 space-y-0.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {standingA ? getOrdinal(standingA.position) : '-'}
                                </span>
                                <span className="text-xs font-bold text-slate-400">Position</span>
                            </div>
                            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                {standingA ? `${standingA.points} pts` : '0 pts'}{' '}
                                <span className="text-slate-400 font-semibold">
                                    • {standingA ? `${standingA.played} Played` : '0 Played'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Team B stats */}
                    <div className="pt-4 sm:pt-0 sm:pl-6 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamB.colorCode }} />
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{teamB.name}</span>
                        </div>
                        <div className="pl-5 space-y-0.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {standingB ? getOrdinal(standingB.position) : '-'}
                                </span>
                                <span className="text-xs font-bold text-slate-400">Position</span>
                            </div>
                            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                {standingB ? `${standingB.points} pts` : '0 pts'}{' '}
                                <span className="text-slate-400 font-semibold">
                                    • {standingB ? `${standingB.played} Played` : '0 Played'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* What's at stake */}
                <div className="flex items-start gap-3 bg-emerald-500/10 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/20">
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                            What's At Stake
                        </span>
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                            Official {match.league || 'Campus League'} Matchday {match.matchday || 1} fixture. Every point impacts the tournament table standings and playoff qualification.
                        </p>
                    </div>
                </div>

                {/* Current Streaks */}
                <div className="flex items-start gap-3 bg-amber-500/10 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-500/20">
                    <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                            Active Team Streaks
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 pt-0.5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="truncate">{formatStreak(teamA.shortName || teamA.name, formA)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="truncate">{formatStreak(teamB.shortName || teamB.name, formB)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

