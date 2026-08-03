import React, { useState } from 'react';
import { Card, Badge, Button, EmptyState } from '../../../../common/UIComponents';
import { Trophy, MapPin, Clock, CloudSun, UserCheck, XCircle, CheckCircle, ArrowLeft } from 'lucide-react';
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
              <span className="text-xs text-slate-400">Current Status:</span>
              <Badge
                variant={
                  selectedFixture.status === 'FT'
                    ? 'default'
                    : selectedFixture.status === 'LIVE'
                    ? 'danger'
                    : selectedFixture.status === 'CANCELLED'
                    ? 'danger'
                    : 'warning'
                }
              >
                {selectedFixture.status}
              </Badge>
            </div>
          </div>

          {/* Teams Header */}
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
              {selectedFixture.scoreA} - {selectedFixture.scoreB}
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
              <span>Weather: <strong className="text-white">Clear, 22°C Pitch Wet</strong></span>
            </div>
          </div>

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

          {/* Action Buttons: End Match & Cancel Match ONLY */}
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
        </div>
      </Card>
    </div>
  );
};
