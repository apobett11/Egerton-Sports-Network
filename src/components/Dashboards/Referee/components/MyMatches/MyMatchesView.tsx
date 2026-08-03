import React, { useState } from 'react';
import { Card, EmptyState } from '../../../../common/UIComponents';
import { Eye, Calendar, MapPin, Clock, Trophy } from 'lucide-react';
import type { Match } from '../../../../../types';
import type { RefereeTab } from '../../types';

interface MyMatchesViewProps {
  upcomingMatches: Match[];
  pastMatches: Match[];
  setSelectedFixtureId: (id: string) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  upcomingMatches,
  pastMatches,
  setSelectedFixtureId,
  setActiveTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'past'>('upcoming');

  const displayedMatches = activeSubTab === 'upcoming' ? upcomingMatches : pastMatches;

  // Task 9: Status Badge styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'HT':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {status}
          </span>
        );
      case 'FT':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-800 border border-slate-700 text-slate-400">
            {status}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-500/10 border border-blue-500/30 text-blue-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title="My Matches" subtitle="Assigned fixtures and officiated match history">
        {/* TASK 13 — TWO TABS: UPCOMING & PAST MATCHES */}
        <div className="flex border-b border-slate-800 mb-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('upcoming')}
            className={`min-h-[44px] px-5 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer ${
              activeSubTab === 'upcoming'
                ? 'bg-amber-600 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-b-0 border-slate-800'
            }`}
          >
            Upcoming Matches ({upcomingMatches.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('past')}
            className={`min-h-[44px] px-5 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer ${
              activeSubTab === 'past'
                ? 'bg-amber-600 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-b-0 border-slate-800'
            }`}
          >
            Past Matches ({pastMatches.length})
          </button>
        </div>

        {/* VERTICAL MATCH LIST LAYOUT */}
        {displayedMatches.length === 0 ? (
          <EmptyState
            title={`No ${activeSubTab === 'upcoming' ? 'Upcoming' : 'Past'} Matches`}
            message={`You currently have no ${activeSubTab === 'upcoming' ? 'scheduled upcoming' : 'completed past'} match fixtures.`}
          />
        ) : (
          <div className="space-y-4 max-w-4xl">
            {displayedMatches.map((m) => {
              const isFinished = m.status === 'FT';
              const isLive = m.status === 'LIVE' || m.status === 'HT';

              return (
                <div
                  key={m.id}
                  className="bg-slate-900/70 border border-slate-800/80 hover:border-amber-600/40 rounded-2xl p-4 sm:p-5 space-y-3 transition-all shadow-lg"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2.5">
                    <span className="font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      {m.league || 'League Match'}
                    </span>
                    {renderStatusBadge(m.status)}
                  </div>

                  {/* Teams Scoreboard Display */}
                  <div className="grid grid-cols-11 items-center bg-slate-950 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 text-xs">
                    {/* Home */}
                    <div className="col-span-5 flex items-center gap-2.5 truncate">
                      <img src={m.teamA.logo} alt={m.teamA.name} className="w-8 h-8 object-contain flex-shrink-0" />
                      <span className="font-bold text-white truncate">{m.teamA.name}</span>
                    </div>

                    {/* Score or VS */}
                    <div className="col-span-1 text-center font-mono font-black text-sm text-amber-500">
                      {isFinished || isLive ? `${m.scoreA} - ${m.scoreB}` : 'VS'}
                    </div>

                    {/* Away */}
                    <div className="col-span-5 flex items-center justify-end gap-2.5 text-right truncate">
                      <span className="font-bold text-white truncate">{m.teamB.name}</span>
                      <img src={m.teamB.logo} alt={m.teamB.name} className="w-8 h-8 object-contain flex-shrink-0" />
                    </div>
                  </div>

                  {/* Metadata Row & TASK 3 — DEEP ORANGE PRIMARY CTA BUTTON */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 w-full sm:w-auto">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date: Scheduled
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Kickoff: {m.time || '16:00'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" /> Venue: {m.venue}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFixtureId(m.id);
                        setActiveTab('match_details');
                      }}
                      className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                    >
                      <Eye className="w-4 h-4 text-slate-950" />
                      <span>View Match Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
