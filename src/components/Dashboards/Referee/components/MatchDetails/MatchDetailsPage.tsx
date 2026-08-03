import React, { useState } from 'react';
import { EmptyState } from '../../../../common/UIComponents';
import { Trophy, MapPin, Clock, CloudSun, UserCheck, XCircle, CheckCircle, ArrowLeft, ShieldCheck, FileText } from 'lucide-react';
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
      <section className="bg-[#111111]/80 border border-[#2A2A2A] rounded-2xl p-6 shadow-2xl text-center">
        <EmptyState
          title="No Match Selected"
          message="Please select a fixture from My Matches to view match details."
          action={
            <button
              onClick={() => setActiveTab('my_matches')}
              className="min-h-[44px] px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Go to My Matches
            </button>
          }
        />
      </section>
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'HT':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
            {status}
          </span>
        );
      case 'FT':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-slate-800 border border-slate-700 text-slate-400 uppercase">
            {status}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase">
            {status}
          </span>
        );
    }
  };

  const goals = (selectedFixture.events || []).filter((e) => e.type === 'goal' || e.type === 'penalty');
  const yellowCards = (selectedFixture.events || []).filter((e) => e.type === 'yellow');
  const redCards = (selectedFixture.events || []).filter((e) => e.type === 'red');
  const injuries = (selectedFixture.events || []).filter((e) => e.type === 'injury');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => setActiveTab('my_matches')}
        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Matches
      </button>

      {/* SECTION CONTAINER BLOCK */}
      <section className="bg-[#111111]/80 border border-[#2A2A2A] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
        {/* Section Header Bar */}
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Match Details & Official Report
            </h2>
          </div>
          {renderStatusBadge(selectedFixture.status)}
        </div>

        {/* Teams Header Scoreboard Card */}
        <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 bg-[#111111] p-6 rounded-xl border border-[#2A2A2A]">
          <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-4 text-left md:text-right">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedFixture.teamA.name}</h3>
              <span className="text-xs text-gray-400 font-medium">Home Team</span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#191919] p-2 border border-[#2A2A2A] flex items-center justify-center flex-shrink-0">
              <img src={selectedFixture.teamA.logo} alt="" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="md:col-span-1 text-center font-mono font-bold text-2xl text-white py-2 md:py-0">
            {isFinished || isCancelled || selectedFixture.status === 'LIVE'
              ? `${selectedFixture.scoreA} - ${selectedFixture.scoreB}`
              : 'VS'}
          </div>

          <div className="md:col-span-5 flex items-center justify-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#191919] p-2 border border-[#2A2A2A] flex items-center justify-center flex-shrink-0">
              <img src={selectedFixture.teamB.logo} alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{selectedFixture.teamB.name}</h3>
              <span className="text-xs text-gray-400 font-medium">Away Team</span>
            </div>
          </div>
        </div>

        {/* Match Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-[#191919] p-4 rounded-xl border border-[#2A2A2A] shadow-md">
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Venue: <strong className="text-white">{selectedFixture.venue || 'Main Stadium'}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Kickoff: <strong className="text-white">{selectedFixture.time || '16:00'}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <CloudSun className="w-4 h-4 text-sky-400" />
            <span>Weather: <strong className="text-white">Clear, Pitch Normal</strong></span>
          </div>
        </div>

        {/* SUBMITTED REPORT SUMMARY */}
        {(isFinished || isCancelled || goals.length > 0 || yellowCards.length > 0) && (
          <div className="space-y-4 bg-[#191919] p-5 rounded-xl border border-[#2A2A2A] shadow-md">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Official Submitted Match Report Summary
              </h4>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                VERIFIED REPORT
              </span>
            </div>

            {/* Goals */}
            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-gray-300 block">Goal Scorers ({goals.length}):</span>
              {goals.length === 0 ? (
                <p className="text-gray-400 italic">No goals recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {goals.map((g) => (
                    <div key={g.id} className="p-2.5 bg-[#111111] rounded-lg border border-[#2A2A2A] flex items-center justify-between">
                      <span>⚽ <strong>{g.minute}'</strong> — {g.detailText || 'Goal'}</span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 rounded">GOAL</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Yellow Cards */}
            <div className="space-y-2 text-xs pt-2">
              <span className="font-extrabold text-amber-400 block">Yellow Cards ({yellowCards.length}):</span>
              {yellowCards.length === 0 ? (
                <p className="text-gray-400 italic">0 Yellow Cards Awarded.</p>
              ) : (
                <div className="space-y-1.5">
                  {yellowCards.map((c) => (
                    <div key={c.id} className="p-2.5 bg-[#111111] rounded-lg border border-[#2A2A2A] flex items-center justify-between">
                      <span>🟨 <strong>{c.minute}'</strong> — {c.detailText || 'Yellow Card'}</span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/10 text-amber-400 rounded">YELLOW</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Red Cards */}
            <div className="space-y-2 text-xs pt-2">
              <span className="font-extrabold text-rose-400 block">Red Cards ({redCards.length}):</span>
              {redCards.length === 0 ? (
                <p className="text-gray-400 italic">0 Red Cards Awarded.</p>
              ) : (
                <div className="space-y-1.5">
                  {redCards.map((c) => (
                    <div key={c.id} className="p-2.5 bg-[#111111] rounded-lg border border-[#2A2A2A] flex items-center justify-between">
                      <span>🟥 <strong>{c.minute}'</strong> — {c.detailText || 'Red Card'}</span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500/10 text-rose-400 rounded">RED CARD</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Injuries */}
            <div className="space-y-2 text-xs pt-2">
              <span className="font-extrabold text-sky-400 block">Injuries ({injuries.length}):</span>
              {injuries.length === 0 ? (
                <p className="text-gray-400 italic">No injury timeouts recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {injuries.map((i) => (
                    <div key={i.id} className="p-2.5 bg-[#111111] rounded-lg border border-[#2A2A2A]">
                      <span>🤕 <strong>{i.minute}'</strong> — {i.detailText || 'Injury timeout'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Officials */}
        <div className="space-y-3 bg-[#191919] p-4 rounded-xl border border-[#2A2A2A] shadow-md">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" /> Match Officials
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#111111] rounded-lg border border-[#2A2A2A]">
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Center Referee</span>
              <span className="font-bold text-white">{currentUserName}</span>
            </div>
            <div className="p-3 bg-[#111111] rounded-lg border border-[#2A2A2A]">
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Assistant Referee 1</span>
              <span className="font-bold text-white">Assistant Official 1</span>
            </div>
            <div className="p-3 bg-[#111111] rounded-lg border border-[#2A2A2A]">
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">Assistant Referee 2</span>
              <span className="font-bold text-white">Assistant Official 2</span>
            </div>
            <div className="p-3 bg-[#111111] rounded-lg border border-[#2A2A2A]">
              <span className="text-gray-400 block text-[10px] uppercase font-semibold">4th Official</span>
              <span className="font-bold text-white">4th Official</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: End Match & Cancel Match (if match not finished) */}
        {!isFinished && !isCancelled && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#2A2A2A]">
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancel}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Match</span>
            </button>

            <button
              type="button"
              onClick={onEndMatch}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span>End Match</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
