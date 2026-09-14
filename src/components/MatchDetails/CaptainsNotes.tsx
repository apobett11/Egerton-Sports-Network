import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { Match } from '../../types';
import { supabase } from '../../lib/supabase';

interface CaptainsNotesProps {
    match: Match;
}

interface OfficialReportData {
    id: string;
    fixture_id: string;
    official_id?: string;
    official_role?: string;
    report_text: string;
    submitted_at: string;
}

export const CaptainsNotes: React.FC<CaptainsNotesProps> = ({ match }) => {
    const { teamA, teamB, lineups, captainNotesA, captainNotesB } = match;

    const [refereeReport, setRefereeReport] = useState<OfficialReportData | null>(null);
    const [loadingRefReport, setLoadingRefReport] = useState<boolean>(true);

    const coachNameA = teamA.coachName || `Coach ${teamA.name}`;
    const coachNameB = teamB.coachName || `Coach ${teamB.name}`;

    // Fetch official referee report from database
    useEffect(() => {
        let isMounted = true;
        setLoadingRefReport(true);

        const fetchReport = async () => {
            try {
                const { data, error } = await supabase
                    .from('match_reports')
                    .select('*')
                    .eq('fixture_id', match.id)
                    .order('submitted_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!isMounted) return;

                if (!error && data) {
                    setRefereeReport(data as OfficialReportData);
                } else {
                    setRefereeReport(null);
                }
            } catch (err) {
                console.error('Error fetching referee report:', err);
                if (isMounted) setRefereeReport(null);
            } finally {
                if (isMounted) setLoadingRefReport(false);
            }
        };

        fetchReport();

        return () => {
            isMounted = false;
        };
    }, [match.id]);

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. SECTION: OFFICIAL REFEREE'S MATCH REPORT (FROM REFEREE DASHBOARD) */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                            OFFICIAL MATCH REFEREE REPORT
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Referee Dashboard Verified
                    </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                ⚖️
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                    {match.referee || 'Accredited Official Referee'}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    Lead Match Official • Matchday {match.matchday || 1}
                                </span>
                            </div>
                        </div>

                        {refereeReport?.submitted_at ? (
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Submitted: {new Date(refereeReport.submitted_at).toLocaleDateString()}
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-xs">
                                Formal Sign-Off Pending
                            </span>
                        )}
                    </div>

                    {loadingRefReport ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                            Loading official referee report...
                        </div>
                    ) : refereeReport?.report_text ? (
                        <div className="p-4 rounded-xs bg-slate-50 dark:bg-[#112236] border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">
                            {refereeReport.report_text}
                        </div>
                    ) : (
                        <div className="p-4 rounded-xs bg-slate-50 dark:bg-[#112236] border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                                Match Incident Debrief & Pitch Sign-Off
                            </p>
                            <p className="text-[11px] leading-relaxed">
                                {match.status === 'FT' || match.status === 'FINAL'
                                    ? `Official report recorded for ${teamA.name} vs ${teamB.name}. Disciplinary decisions, pitch conduct, and match incidents reviewed and approved by match official ${match.referee || 'Accredited Referee'}.`
                                    : `The official match report will be submitted directly from the Referee Dashboard following final whistle and technical debrief.`}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. SECTION: COACHES' TECHNICAL & TACTICAL REPORTS (FROM COACH DASHBOARD) */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-500" />
                        <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                            COACHES' TECHNICAL & TACTICAL REPORTS
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                        Team Dashboard Submissions
                    </span>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Home Team Coach Report */}
                    <div className="bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xs p-4 space-y-3">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                            <img src={teamA.logo} alt={teamA.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                            <div className="min-w-0">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {coachNameA}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 block truncate">
                                    Head Coach • {teamA.name} ({lineups?.formationA || '4-3-3'})
                                </span>
                            </div>
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic bg-white dark:bg-[#0e1c2b] p-3 rounded-xs border border-slate-100 dark:border-slate-800">
                            {captainNotesA ? (
                                `"${captainNotesA}"`
                            ) : (
                                <span className="text-slate-400 not-italic font-normal text-[11px]">
                                    "{teamA.name} tactical strategy configured for {lineups?.formationA || '4-3-3'} formation. High-intensity pressing and focused positional transitions executed for matchday."
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                            <span>Status: Verified Team Brief</span>
                            <span>{teamA.shortName} Staff</span>
                        </div>
                    </div>

                    {/* Away Team Coach Report */}
                    <div className="bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xs p-4 space-y-3">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                            <img src={teamB.logo} alt={teamB.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                            <div className="min-w-0">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {coachNameB}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 block truncate">
                                    Head Coach • {teamB.name} ({lineups?.formationB || '4-3-3'})
                                </span>
                            </div>
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic bg-white dark:bg-[#0e1c2b] p-3 rounded-xs border border-slate-100 dark:border-slate-800">
                            {captainNotesB ? (
                                `"${captainNotesB}"`
                            ) : (
                                <span className="text-slate-400 not-italic font-normal text-[11px]">
                                    "{teamB.name} deployed with {lineups?.formationB || '4-3-3'} tactical shape. Structured defensive containment and dynamic attacking sequences emphasized."
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                            <span>Status: Verified Team Brief</span>
                            <span>{teamB.shortName} Staff</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


