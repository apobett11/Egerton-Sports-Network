import React, { useState, useEffect } from 'react';
import type { Match } from '../../types';
import { ApiService } from '../../services/api';

interface FormTabProps {
    match: Match;
}

export const FormTab: React.FC<FormTabProps> = ({ match }) => {
    const { teamA, teamB } = match;

    const [formA, setFormA] = useState<Array<{ result: 'W' | 'D' | 'L'; label: string }>>([]);
    const [formB, setFormB] = useState<Array<{ result: 'W' | 'D' | 'L'; label: string }>>([]);

    useEffect(() => {
        if (teamA?.id) {
            ApiService.getTeamForm(teamA.id).then((res) => {
                if (res.data) setFormA(res.data);
            });
        }
        if (teamB?.id) {
            ApiService.getTeamForm(teamB.id).then((res) => {
                if (res.data) setFormB(res.data);
            });
        }
    }, [teamA?.id, teamB?.id]);

    const defaultHistoryA = [
        { date: '16.08', comp: 'EPL', opp: 'Nakuru Sharks', score: '3 - 1', res: 'W' },
        { date: '09.08', comp: 'EPL', opp: 'Rift Valley FC', score: '1 - 1', res: 'D' },
        { date: '02.08', comp: 'EPL', opp: 'Tatton Kings', score: '2 - 0', res: 'W' },
        { date: '26.07', comp: 'EPL', opp: 'Pavilion Bulls', score: '0 - 2', res: 'L' },
        { date: '19.07', comp: 'EPL', opp: 'Engineering FC', score: '4 - 1', res: 'W' },
    ];

    const defaultHistoryB = [
        { date: '17.08', comp: 'EPL', opp: 'Pavilion Bulls', score: '2 - 1', res: 'W' },
        { date: '10.08', comp: 'EPL', opp: 'Engineering FC', score: '1 - 2', res: 'L' },
        { date: '03.08', comp: 'EPL', opp: 'Nakuru Sharks', score: '3 - 0', res: 'W' },
        { date: '27.07', comp: 'EPL', opp: 'Rift Valley FC', score: '2 - 2', res: 'D' },
        { date: '20.07', comp: 'EPL', opp: 'Tatton Kings', score: '1 - 0', res: 'W' },
    ];

    const defaultH2H = [
        { date: '24.03.24', comp: 'EPL', home: teamA.name, away: teamB.name, score: '2 - 1', res: 'W' },
        { date: '12.11.23', comp: 'EPL', home: teamB.name, away: teamA.name, score: '1 - 1', res: 'D' },
        { date: '18.04.23', comp: 'EPL', home: teamA.name, away: teamB.name, score: '0 - 2', res: 'L' },
    ];

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
                    <div className="flex items-center gap-1">
                        {defaultHistoryA.map((h, i) => (
                            <span key={i}>{renderBadge(h.res)}</span>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                    {defaultHistoryA.map((m, idx) => (
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
            </div>

            {/* 2. LAST MATCHES: TEAM B */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                        <img src={teamB.logo} alt={teamB.name} className="w-4 h-4 rounded-full" />
                        <span>LAST MATCHES: {teamB.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {defaultHistoryB.map((h, i) => (
                            <span key={i}>{renderBadge(h.res)}</span>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                    {defaultHistoryB.map((m, idx) => (
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
            </div>

            {/* 3. HEAD-TO-HEAD MATCHES */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] text-xs font-black uppercase text-slate-900 dark:text-white">
                    HEAD-TO-HEAD MATCHES
                </div>

                <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                    {defaultH2H.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono text-[11px] text-slate-400">{m.date}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{m.comp}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{m.home} - {m.away}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="font-mono font-black text-slate-900 dark:text-white">{m.score}</span>
                                {renderBadge(m.res)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


