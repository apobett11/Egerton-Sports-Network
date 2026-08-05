import React from 'react';
import { MapPin, UserCheck, SunMedium, Trophy, Clock, Users } from 'lucide-react';
import type { Match } from '../../types';

interface MatchDetailsCardProps {
    match: Match;
}

export const MatchDetailsCard: React.FC<MatchDetailsCardProps> = ({ match }) => {
    const isPostKickoff = match.status !== 'UPCOMING';

    return (
        <div className="w-full max-w-3xl mx-auto py-6 select-none space-y-6">
            {/* Header */}
            <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                    FIFA Match Centre
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Match Logistics & Official Information
                </h3>
            </div>

            {/* Single Clean Match Centre Card */}
            <div className="bg-white dark:bg-[#0E1424] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden transition-all">
                
                {/* 🏟 Stadium / Venue */}
                <div className="p-5 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Stadium / Venue
                        </span>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                            {match.venue || 'Egerton University Main Pavilion Ground'}
                        </p>
                    </div>
                </div>

                {/* 👨‍⚖️ Referee & Officials */}
                <div className="p-5 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Match Officiating Crew
                        </span>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                            Referee: {match.referee || 'Ref. James Maina'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <div><span className="text-slate-400 font-normal">Assistant 1:</span> David K. Njoroge</div>
                            <div><span className="text-slate-400 font-normal">Assistant 2:</span> Peter M. Mwangi</div>
                            <div><span className="text-slate-400 font-normal">Fourth Official:</span> Samuel O. Omwamba</div>
                        </div>
                    </div>
                </div>

                {/* 🌤 Weather */}
                <div className="p-5 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
                        <SunMedium className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Weather Conditions
                        </span>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                            21°C • Clear Skies (Humidity 45%, Wind 8km/h)
                        </p>
                    </div>
                </div>

                {/* 🏆 Competition & Matchday */}
                <div className="p-5 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Competition & Phase
                        </span>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {match.league || 'Egerton Premier League'} • Matchday Official Fixture
                        </p>
                    </div>
                </div>

                {/* 🕒 Kickoff */}
                <div className="p-5 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Scheduled Kickoff
                        </span>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                            {match.time ? `${match.time} EAT` : '15:00 EAT'} • Scheduled Matchday
                        </p>
                    </div>
                </div>

                {/* 👥 Attendance */}
                {isPostKickoff && (
                    <div className="p-5 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                Match Attendance
                            </span>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                                1,850 Supporters in Attendance
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

