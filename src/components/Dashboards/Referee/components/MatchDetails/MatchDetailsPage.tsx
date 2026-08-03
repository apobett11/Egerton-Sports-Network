import React, { useState } from 'react';
import { Card, Badge, Button, EmptyState } from '../../../../common/UIComponents';
import { Trophy, MapPin, Clock, CloudSun, UserCheck, XCircle, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Match } from '../../../../../types';
import type { RefereeTab } from '../../types';

interface MatchDetailsPageProps {
  selectedFixture: Match | null;
  currentUserName: string;
  onEndMatch: () => void;
  onCancelMatch: (fixtureId: string) => Promise<void>;
  setActiveTab: (tab: RefereeTab) => void;
}

export const MatchDetailsPage: React.FC<MatchDetailsPageProps> = ({
  selectedFixture,
  currentUserName,
  onEndMatch,
  onCancelMatch,
  setActiveTab,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);

  if (!selectedFixture) {
    return (
      <Card className="p-8 text-center">
        <EmptyState
          title="No Match Selected"
          message="Please select a fixture from My Matches to view match details."
          action={
            <Button variant="primary" size="sm" onClick={() => setActiveTab('my_matches')}>
              Go to My Matches
            </Button>
          }
        />
      </Card>
    );
  }

  const isFinished = selectedFixture.status === 'FT';
  const isCancelled = selectedFixture.status === 'CANCELLED';

  const handleCancel = async () => {
    if (window.confirm(`Are you sure you want to cancel the match ${selectedFixture.teamA.name} vs ${selectedFixture.teamB.name}?`)) {
      setIsCancelling(true);
      try {
        await onCancelMatch(selectedFixture.id);
        setActiveTab('my_matches');
      } finally {
        setIsCancelling(false);
      }
    }
  };

  // Group match events by category for clean report summary (Task 14)
  const goals = (selectedFixture.events || []).filter((e) => e.type === 'goal' || e.type === 'penalty');
  const yellowCards = (selectedFixture.events || []).filter((e) => e.type === 'yellow');
  const redCards = (selectedFixture.events || []).filter((e) => e.type === 'red');
  const injuries = (selectedFixture.events || []).filter((e) => e.type === 'injury');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => setActiveTab('my_matches')}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Matches
      </button>

      <Card>
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
              <span className="font-extrabold text-sm text-white uppercase tracking-wider">
                {selectedFixture.league || 'League Match'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Match Decision / Status:</span>
              <Badge
                variant={
                  isFinished
                    ? 'default'
                    : isCancelled
                    ? 'danger'
                    : selectedFixture.status === 'LIVE'
                    ? 'danger'
                    : 'warning'
                }
              >
                {selectedFixture.status}
              </Badge>
            </div>
          </div>

          {/* Teams Header Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
            {/* Home Team */}
            <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-4 text-left md:text-right">
              <div>
                <h3 className="text-xl font-black text-white">{selectedFixture.teamA.name}</h3>
                <span className="text-xs text-slate-400 font-medium">Home Team</span>
              </div>
              <div className="w-14 h-14 rounded-xl bg-slate-900 p-2 border border-slate-800 flex items-center justify-center flex-shrink-0">
                <img src={selectedFixture.teamA.logo} alt={selectedFixture.teamA.name} className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Score / VS */}
            <div className="md:col-span-1 text-center font-mono font-black text-2xl text-[#D4AF37] py-2 md:py-0">
              {isFinished || isCancelled || selectedFixture.status === 'LIVE'
                ? `${selectedFixture.scoreA} - ${selectedFixture.scoreB}`
                : 'VS'}
            </div>

            {/* Away Team */}
            <div className="md:col-span-5 flex items-center justify-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-900 p-2 border border-slate-800 flex items-center justify-center flex-shrink-0">
                <img src={selectedFixture.teamB.logo} alt={selectedFixture.teamB.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{selectedFixture.teamB.name}</h3>
                <span className="text-xs text-slate-400 font-medium">Away Team</span>
              </div>
            </div>
          </div>

          {/* Match Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Venue: <strong className="text-white">{selectedFixture.venue || 'Main Stadium'}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>Kickoff: <strong className="text-white">{selectedFixture.time || '16:00'}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <CloudSun className="w-4 h-4 text-sky-400" />
              <span>Weather: <strong className="text-white">Clear, Pitch Normal</strong></span>
            </div>
          </div>

          {/* TASK 14 — SUBMITTED MATCH REPORT DETAILS SUMMARY (READ-ONLY REPORT) */}
          {(isFinished || isCancelled || goals.length > 0 || yellowCards.length > 0) && (
            <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Official Submitted Match Report Summary
                </h4>
                <Badge variant="gold">READ-ONLY VERIFIED</Badge>
              </div>

              {/* Goal Scorers */}
              <div className="space-y-2 text-xs">
                <span className="font-extrabold text-slate-300 block">Goal Scorers ({goals.length}):</span>
                {goals.length === 0 ? (
                  <p className="text-slate-500 italic">No goals recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {goals.map((g) => (
                      <div key={g.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span>⚽ <strong>{g.minute}'</strong> — {g.detailText || 'Goal'}</span>
                        <Badge variant="success">GOAL</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Yellow Cards */}
              <div className="space-y-2 text-xs pt-2">
                <span className="font-extrabold text-amber-400 block">Yellow Cards ({yellowCards.length}):</span>
                {yellowCards.length === 0 ? (
                  <p className="text-slate-500 italic">0 Yellow Cards Awarded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {yellowCards.map((c) => (
                      <div key={c.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span>🟨 <strong>{c.minute}'</strong> — {c.detailText || 'Yellow Card'}</span>
                        <Badge variant="warning">YELLOW</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Red Cards */}
              <div className="space-y-2 text-xs pt-2">
                <span className="font-extrabold text-rose-400 block">Red Cards ({redCards.length}):</span>
                {redCards.length === 0 ? (
                  <p className="text-slate-500 italic">0 Red Cards Awarded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {redCards.map((c) => (
                      <div key={c.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span>🟥 <strong>{c.minute}'</strong> — {c.detailText || 'Red Card'}</span>
                        <Badge variant="danger">RED CARD</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Injuries */}
              <div className="space-y-2 text-xs pt-2">
                <span className="font-extrabold text-sky-400 block">Injuries ({injuries.length}):</span>
                {injuries.length === 0 ? (
                  <p className="text-slate-500 italic">No injury timeouts recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {injuries.map((i) => (
                      <div key={i.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span>🤕 <strong>{i.minute}'</strong> — {i.detailText || 'Injury timeout'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match Officials */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Match Officials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Center Referee</span>
                <span className="font-bold text-white">{currentUserName}</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assistant Referee 1</span>
                <span className="font-bold text-white">Assistant Official 1</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assistant Referee 2</span>
                <span className="font-bold text-white">Assistant Official 2</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">4th Official</span>
                <span className="font-bold text-white">4th Official</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: End Match & Cancel Match (if match not finished) */}
          {!isFinished && !isCancelled && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-slate-800">
              <Button
                variant="danger"
                size="md"
                isLoading={isCancelling}
                onClick={handleCancel}
                icon={<XCircle className="w-4 h-4" />}
              >
                Cancel Match
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={onEndMatch}
                icon={<CheckCircle className="w-4 h-4 text-slate-950" />}
              >
                End Match
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
