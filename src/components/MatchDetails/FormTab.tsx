import React, { useState, useEffect } from 'react';
import type { Match } from '../../types';
import { ApiService } from '../../services/api';

interface FormTabProps {
    match: Match;
}

interface MatchHistoryEntry {
    id: string;
    date: string;
    comp: string;
    opp: string;
    score: string;
    res: 'W' | 'D' | 'L';
}

interface H2HEntry {
    id: string;
    date: string;
    comp?: string;
    homeName?: string;
    awayName?: string;
    scoreA: number;
    scoreB: number;
    winner: string;
}

export const FormTab: React.FC<FormTabProps> = ({ match }) => {
    const { teamA, teamB } = match;

    const [historyA, setHistoryA] = useState<MatchHistoryEntry[]>([]);
    const [historyB, setHistoryB] = useState<MatchHistoryEntry[]>([]);
    const [formA, setFormA] = useState<Array<{ result: 'W' | 'D' | 'L'; label: string }>>([]);
    const [formB, setFormB] = useState<Array<{ result: 'W' | 'D' | 'L'; label: string }>>([]);
    const [h2hList, setH2hList] = useState<H2HEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        setLoading(true);
        const pA = teamA?.id ? ApiService.getTeamRecentMatches(teamA.id) : Promise.resolve({ success: true, data: [] });
        const pB = teamB?.id ? ApiService.getTeamRecentMatches(teamB.id) : Promise.resolve({ success: true, data: [] });
        const pH2H = (teamA?.id && teamB?.id) ? ApiService.getHeadToHead(teamA.id, teamB.id) : Promise.resolve({ success: true, data: [] });
        const pFormA = teamA?.id ? ApiService.getTeamForm(teamA.id) : Promise.resolve({ success: true, data: [] });
        const pFormB = teamB?.id ? ApiService.getTeamForm(teamB.id) : Promise.resolve({ success: true, data: [] });

        Promise.all([pA, pB, pH2H, pFormA, pFormB]).then(([resA, resB, resH2H, resFormA, resFormB]) => {
            if (resA.data) setHistoryA(resA.data);
            if (resB.data) setHistoryB(resB.data);
            if (resH2H.data) setH2hList(resH2H.data as any);
            if (resFormA.data) setFormA(resFormA.data);
            if (resFormB.data) setFormB(resFormB.data);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    }, [teamA?.id, teamB?.id]);

    const renderBadge = (res: string) => {
        const bg = res === 'W' ? 'bg-[#00b04f]' : res === 'D' ? 'bg-[#ff9800]' : 'bg-[#d63031]';
        return (
            <span className={`w-4 h-4 rounded-[2px] ${bg} text-white font-bold text-[9px] flex items-center justify-center select-none shadow-xs`}>
                {res}
            </span>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. LAST MATCHES: TEAM A */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                        <img src={teamA.logo} alt={teamA.name} className="w-4 h-4 rounded-full" />
                        <span>LAST MATCHES: {teamA.name}</span>
                    </div>
                    {historyA.length > 0 ? (
                        <div className="flex items-center gap-1">
                            {historyA.map((h, i) => (
                                <span key={i}>{renderBadge(h.res)}</span>
                            ))}
                        </div>
                    ) : formA.length > 0 ? (
                        <div className="flex items-center gap-1">
                            {formA.map((f, i) => (
                                <span key={i}>{renderBadge(f.result)}</span>
                            ))}
                        </div>
                    ) : null}
                </div>

                {historyA.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                        {loading ? 'Loading match history...' : formA.length > 0 ? (
                            <div className="flex items-center justify-center gap-2">
                                <span>Recent recorded form:</span>
                                <div className="flex items-center gap-1">
                                    {formA.map((f, i) => (
                                        <span key={i}>{renderBadge(f.result)}</span>
                                    ))}
                                </div>
                            </div>
                        ) : `No prior completed fixtures recorded for ${teamA.name}.`}
                    </div>
                ) : (
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {historyA.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="font-mono text-[11px] text-slate-400">{m.date}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m.comp}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{teamA.name} vs {m.opp}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-black text-slate-900 dark:text-white">{m.score}</span>
                                    {renderBadge(m.res)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. LAST MATCHES: TEAM B */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                        <img src={teamB.logo} alt={teamB.name} className="w-4 h-4 rounded-full" />
                        <span>LAST MATCHES: {teamB.name}</span>
                    </div>
                    {historyB.length > 0 ? (
                        <div className="flex items-center gap-1">
                            {historyB.map((h, i) => (
                                <span key={i}>{renderBadge(h.res)}</span>
                            ))}
                        </div>
                    ) : formB.length > 0 ? (
                        <div className="flex items-center gap-1">
                            {formB.map((f, i) => (
                                <span key={i}>{renderBadge(f.result)}</span>
                            ))}
                        </div>
                    ) : null}
                </div>

                {historyB.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                        {loading ? 'Loading match history...' : formB.length > 0 ? (
                            <div className="flex items-center justify-center gap-2">
                                <span>Recent recorded form:</span>
                                <div className="flex items-center gap-1">
                                    {formB.map((f, i) => (
                                        <span key={i}>{renderBadge(f.result)}</span>
                                    ))}
                                </div>
                            </div>
                        ) : `No prior completed fixtures recorded for ${teamB.name}.`}
                    </div>
                ) : (
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {historyB.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="font-mono text-[11px] text-slate-400">{m.date}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m.comp}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{teamB.name} vs {m.opp}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-black text-slate-900 dark:text-white">{m.score}</span>
                                    {renderBadge(m.res)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. HEAD-TO-HEAD MATCHES */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-900 dark:text-white">
                    HEAD-TO-HEAD MATCHES
                </div>

                {h2hList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                        {loading ? 'Loading H2H records...' : 'No prior completed head-to-head fixtures recorded in the database between these two teams.'}
                    </div>
                ) : (
                    <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                        {h2hList.map((m) => {
                            let resChar: 'W' | 'D' | 'L' = 'D';
                            if (m.scoreA > m.scoreB) resChar = 'W';
                            else if (m.scoreB > m.scoreA) resChar = 'L';

                            return (
                                <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="font-mono text-[11px] text-slate-400">{m.date}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{m.comp || 'EPL'}</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                                            {m.homeName || teamA.name} - {m.awayName || teamB.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-black text-slate-900 dark:text-white">
                                            {m.scoreA} - {m.scoreB}
                                        </span>
                                        {renderBadge(resChar)}
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


