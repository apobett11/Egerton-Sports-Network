import React from 'react';
import { Card, Badge, Button, EmptyState } from '../../../../common/UIComponents';
import { Eye, Calendar, MapPin, Clock, Trophy } from 'lucide-react';
import type { Match } from '../../../../../types';
import type { RefereeTab } from '../../types';

interface MyMatchesViewProps {
  fixtures: Match[];
  setSelectedFixtureId: (id: string) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  fixtures,
  setSelectedFixtureId,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title="My Matches" subtitle="All matches assigned and officiated by your referee account">
        {fixtures.length === 0 ? (
          <EmptyState
            title="No Matches Found"
            message="You have not been assigned to any match fixtures."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fixtures.map((m) => {
              const isFinished = m.status === 'FT';
              const isCancelled = m.status === 'CANCELLED';
              const isLive = m.status === 'LIVE' || m.status === 'HT';

              return (
                <div
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 hover:border-[#D4AF37]/50 rounded-2xl p-5 space-y-4 transition-all shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
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

                    {/* Teams Scoreboard Card */}
                    <div className="grid grid-cols-11 items-center bg-slate-950 p-4 rounded-xl border border-slate-800/70 text-xs">
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

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Date: Scheduled</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                        <span>Kickoff: {m.time || '16:00'}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <span className="truncate">Venue: {m.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* View Match Details Button */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedFixtureId(m.id);
                        setActiveTab('match_details');
                      }}
                      icon={<Eye className="w-4 h-4 text-slate-950" />}
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
