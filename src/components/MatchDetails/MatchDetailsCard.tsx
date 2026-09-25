import React from 'react';
import { MapPin, UserCheck, SunMedium, Trophy, Clock, Users, ShieldCheck, Flag, CheckCircle2, Info } from 'lucide-react';
import { formatMatchTime, formatMatchPitch, resolveAllocatedOfficials } from '../../lib/matchdayHelper';
import type { Match } from '../../types';

interface MatchDetailsCardProps {
    match: Match;
}

export const MatchDetailsCard: React.FC<MatchDetailsCardProps> = ({ match }) => {
    const isPostKickoff = match.status !== 'UPCOMING';
    const officials = resolveAllocatedOfficials(match);
    const crName = officials.centerReferee || match.referee || match.centerReferee || 'Accredited League Referee';
    const linesmanA = match.linesmanTeamAName || officials.linesmanTeamA;
    const linesmanB = match.linesmanTeamBName || officials.linesmanTeamB;

    return (
        <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 select-none space-y-4">
            {/* 1. MATCH LOGISTICS & OFFICIAL OVERVIEW CARD */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                        MATCH LOGISTICS & OFFICIAL INFORMATION
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Official Match Centre
                    </span>
                </div>

                <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                    {/* 🏟 Stadium / Venue */}
                    <div className="p-4 flex items-center gap-4 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                        <div className="w-9 h-9 rounded-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                STADIUM / VENUE & PITCH ALLOCATION
                            </span>
                            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                                {formatMatchPitch(match.venue) || match.venue || 'Egerton Main Sports Ground'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                                Standard Turf • Regulatory Pitch Marking & Technical Zones
                            </span>
                        </div>
                    </div>

                    {/* 👨‍⚖️ Referee & Officials */}
                    <div className="p-4 flex items-start gap-4 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                        <div className="w-9 h-9 rounded-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                APPOINTED MATCH OFFICIALS CREW
                            </span>
                            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                                Centre Referee (CR): {crName}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                                {(linesmanA || linesmanB) ? (
                                    <>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xs border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] uppercase font-bold text-sky-500 dark:text-sky-400 block">Linesman Team 1</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                                {linesmanA || 'Assigned Club'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xs border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] uppercase font-bold text-sky-500 dark:text-sky-400 block">Linesman Team 2</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                                {linesmanB || 'Assigned Club'}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xs border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Assistant Referee 1</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                                {match.assistantReferee1 || 'Official Assistant 1'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xs border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Assistant Referee 2</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                                {match.assistantReferee2 || 'Official Assistant 2'}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xs border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fourth Official</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                        {match.fourthOfficial || 'Official 4th Ref'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 🏆 Competition & Matchday */}
                    <div className="p-4 flex items-center gap-4 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                        <div className="w-9 h-9 rounded-xs bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                TOURNAMENT COMPETITION & PHASE
                            </span>
                            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                                {match.league || 'Egerton Premier League'} • Round {match.matchday || 1}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                                Season 2026/2027 • Regular Season Fixture
                            </span>
                        </div>
                    </div>

                    {/* 🕒 Scheduled Kickoff */}
                    <div className="p-4 flex items-center gap-4 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                        <div className="w-9 h-9 rounded-xs bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                SCHEDULED KICKOFF TIME
                            </span>
                            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                                {(match.scheduledTime || match.time) ? formatMatchTime(match.scheduledTime || match.time) : 'Standard Matchday Schedule'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                                Local University Time (EAT)
                            </span>
                        </div>
                    </div>

                    {/* 🌤 Weather Conditions */}
                    <div className="p-4 flex items-center gap-4 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                        <div className="w-9 h-9 rounded-xs bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
                            <SunMedium className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                WEATHER & CLIMATE CONDITIONS
                            </span>
                            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                                {match.weather || 'Clear Skies • 22°C • Optimal Matchday Playing Surface'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                                Verified by Pre-Match Grounds Inspection
                            </span>
                        </div>
                    </div>

                    {/* 👥 Attendance */}
                    {isPostKickoff && (
                        <div className="p-4 flex items-center gap-4 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                            <div className="w-9 h-9 rounded-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                    MATCH ATTENDANCE
                                </span>
                                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                                    {match.attendance ? `${match.attendance.toLocaleString()} Spectators in Attendance` : 'Official Attendance Logged by Matchday Gate Staff'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. MATCHDAY REGULATORY RULES & DISCIPLINARY PROTOCOLS */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 shadow-xs space-y-2 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                    <Info className="w-4 h-4 text-sky-500" />
                    <span>REGULATORY PROTOCOLS & COMPETITION GUIDELINES</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400 pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xs border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Match Duration</span>
                        <span>90 minutes (Two halves of 45 minutes) + stoppage time allocated by the referee.</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xs border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Tactical Substitutions</span>
                        <span>Up to 5 substitutions permitted per club across a maximum of 3 in-play windows.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


