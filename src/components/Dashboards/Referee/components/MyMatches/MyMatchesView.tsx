import React, { useState } from 'react';
import { Card, Badge, Button, EmptyState } from '../../../../common/UIComponents';
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title="My Matches" subtitle="Assigned fixtures and officiated match history">
        {/* TASK 13 — TWO TABS: UPCOMING & PAST MATCHES */}
        <div className="flex border-b border-slate-800 mb-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('upcoming')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer ${
              activeSubTab === 'upcoming'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-b-0 border-slate-800'
            }`}
          >
            Upcoming Matches ({upcomingMatches.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('past')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer ${
              activeSubTab === 'past'
                ? 'bg-[#D4AF37] text-slate-950 shadow-md'
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
              const isCancelled = m.status === 'CANCELLED';
              const isLive = m.status === 'LIVE' || m.status === 'HT';

              return (
                <div
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 hover:border-[#D4AF37]/40 rounded-2xl p-4 sm:p-5 space-y-3 transition-all shadow-md"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2.5">
                    <span className="font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {m.league || 'League Match'}
                    </span>
                    <Badge
                      variant={
                        isFinished
                          ? 'default'
                          : isLive
                          ? 'danger'
                          : isCancelled
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {m.status}
                    </Badge>
                  </div>

                  {/* Teams Scoreboard Display */}
                  <div className="grid grid-cols-11 items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs">
                    {/* Home */}
                    <div className="col-span-5 flex items-center gap-2.5">
                      <img src={m.teamA.logo} alt={m.teamA.name} className="w-8 h-8 object-contain flex-shrink-0" />
                      <span className="font-bold text-white truncate">{m.teamA.name}</span>
                    </div>

                    {/* Score or VS */}
                    <div className="col-span-1 text-center font-mono font-black text-sm text-[#D4AF37]">
                      {isFinished || isLive ? `${m.scoreA} - ${m.scoreB}` : 'VS'}
                    </div>

                    {/* Away */}
                    <div className="col-span-5 flex items-center justify-end gap-2.5 text-right">
                      <span className="font-bold text-white truncate">{m.teamB.name}</span>
                      <img src={m.teamB.logo} alt={m.teamB.name} className="w-8 h-8 object-contain flex-shrink-0" />
                    </div>
                  </div>

                  {/* Metadata Row & View Details Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 w-full sm:w-auto">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> Kickoff: {m.time || '16:00'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" /> Venue: {m.venue}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setSelectedFixtureId(m.id);
                        setActiveTab('match_details');
                      }}
                      icon={<Eye className="w-3.5 h-3.5 text-slate-950" />}
                    >
                      View Match Details
                    </Button>
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
