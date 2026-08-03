import React from 'react';
import { MapPin, UserCheck, SunMedium, Trophy, Clock, Users } from 'lucide-react';
import type { Match } from '../../types';

interface MatchDetailsCardProps {
    match: Match;
}

export const MatchDetailsCard: React.FC<MatchDetailsCardProps> = ({ match }) => {
    const isPostKickoff = match.status !== 'UPCOMING';

    return (
        <div className="w-full max-w-2xl mx-auto py-6 px-4 select-none">
            {/* Header */}
            <div className="mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 block">
                    FIFA Match Centre
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Match Logistics & Officials
                </h3>
            </div>

            {/* Single Clean Match Centre Card */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-150 dark:border-gray-800 shadow-md divide-y divide-gray-100 dark:divide-gray-800/80 overflow-hidden transition-all">
                
                {/* 🏟 Stadium / Venue */}
                <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Stadium / Venue
                        </span>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100 truncate">
                            {match.venue || 'Egerton University Main Pavilion Ground'}
                        </p>
                    </div>
                </div>

                {/* 👨‍⚖️ Referee & Officials */}
                <div className="p-4 flex items-start gap-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Match Officials
                        </span>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                            Referee: {match.referee || 'Ref. James Maina'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-xs text-gray-600 dark:text-gray-400 font-semibold">
                            <div><span className="text-gray-400">Assistant 1:</span> David K. Njoroge</div>
                            <div><span className="text-gray-400">Assistant 2:</span> Peter M. Mwangi</div>
                            <div><span className="text-gray-400">Fourth Official:</span> Samuel O. Omwamba</div>
                        </div>
                    </div>
                </div>

                {/* 🌤 Weather */}
                <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <SunMedium className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Weather Conditions
                        </span>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                            21°C • Clean Clear Sky (Humidity 45%, Wind 8km/h)
                        </p>
                    </div>
                </div>

                {/* 🏆 Competition & Matchday */}
                <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Competition & Phase
                        </span>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                            Egerton Super League • Matchday 14
                        </p>
                    </div>
                </div>

                {/* 🕒 Kickoff */}
                <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                            Scheduled Kickoff
                        </span>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                            {match.time ? `${match.time} EAT` : '15:00 EAT'} • Saturday, 3 August 2026
                        </p>
                    </div>
                </div>

                {/* 👥 Attendance (Shown if match is Live or Finished) */}
                {isPostKickoff && (
                    <div className="p-4 flex items-center gap-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                                Match Attendance
                            </span>
                            <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                1,850 Supporters in Attendance
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
