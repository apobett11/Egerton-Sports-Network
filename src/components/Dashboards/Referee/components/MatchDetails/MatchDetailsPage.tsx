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
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-6 shadow-xs text-center">
        <EmptyState
          title="No Match Selected"
          message="Please select a fixture from My Matches to view match details."
          action={
            <button
              onClick={() => setActiveTab('my_matches')}
              className="min-h-[44px] px-5 py-2.5 bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider rounded-md shadow-xs cursor-pointer"
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
  const isLive = selectedFixture.status === 'LIVE' || selectedFixture.status === 'HT';

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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white animate-pulse">
            ● {status}
          </span>
        );
      case 'FT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00b04f] text-white">
            FT
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#152e4d] text-sky-200 border border-sky-400/20">
            Upcoming
          </span>
        );
    }
  };

  const goals = (selectedFixture.events || []).filter((e) => e.type === 'goal' || e.type === 'penalty');
  const yellowCards = (selectedFixture.events || []).filter((e) => e.type === 'yellow');
  const redCards = (selectedFixture.events || []).filter((e) => e.type === 'red');
  const injuries = (selectedFixture.events || []).filter((e) => e.type === 'injury');

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Back button */}
      <button
        onClick={() => setActiveTab('my_matches')}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Matches
      </button>

      {/* SECTION CONTAINER BLOCK */}
      <section className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 sm:p-6 shadow-xs space-y-6">
        {/* Section Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#14263b] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#ff0046]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Match Details & Official Report
            </h2>
          </div>
          {renderStatusBadge(selectedFixture.status)}
        </div>

        {/* Teams Header Scoreboard Card */}
        <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 bg-slate-50 dark:bg-[#102237] p-6 rounded-md border border-slate-200 dark:border-[#1a2e45]">
          <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-4 text-left md:text-right">
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{selectedFixture.teamA.name}</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Home Team</span>
            </div>
            <div className="w-14 h-14 rounded-sm bg-white dark:bg-[#0e1c2b] p-2 border border-slate-200 dark:border-[#1a2e45] flex items-center justify-center flex-shrink-0 shadow-xs">
              {selectedFixture.teamA.logo ? (
                <img src={selectedFixture.teamA.logo} alt={selectedFixture.teamA.name} className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-xs text-slate-900 dark:text-white">{selectedFixture.teamA.shortName || 'HOM'}</span>
              )}
            </div>
          </div>

          <div className={`md:col-span-1 text-center font-mono font-black text-3xl sm:text-4xl ${isLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'} tracking-tight py-2 md:py-0`}>
            {isFinished || isCancelled || isLive
              ? `${selectedFixture.scoreA} - ${selectedFixture.scoreB}`
              : 'VS'}
          </div>

          <div className="md:col-span-5 flex items-center justify-start gap-4">
            <div className="w-14 h-14 rounded-sm bg-white dark:bg-[#0e1c2b] p-2 border border-slate-200 dark:border-[#1a2e45] flex items-center justify-center flex-shrink-0 shadow-xs">
              {selectedFixture.teamB.logo ? (
                <img src={selectedFixture.teamB.logo} alt={selectedFixture.teamB.name} className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-xs text-slate-900 dark:text-white">{selectedFixture.teamB.shortName || 'AWY'}</span>
              )}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{selectedFixture.teamB.name}</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Away Team</span>
            </div>
          </div>
        </div>

        {/* Match Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-100 dark:bg-[#15273b] p-4 rounded-md border border-slate-200 dark:border-[#223b56]">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="uppercase tracking-wider font-medium">Venue: <strong className="text-slate-900 dark:text-white font-bold">{selectedFixture.venue || 'Main Stadium'}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4 text-[#00b04f]" />
            <span className="uppercase tracking-wider font-medium">Kickoff: <strong className="text-slate-900 dark:text-white font-bold">{selectedFixture.time || '16:00'}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <CloudSun className="w-4 h-4 text-sky-400" />
            <span className="uppercase tracking-wider font-medium">Weather: <strong className="text-slate-900 dark:text-white font-bold">Clear, Pitch Normal</strong></span>
          </div>
        </div>

        {/* SUBMITTED REPORT SUMMARY */}
        {(isFinished || isCancelled || goals.length > 0 || yellowCards.length > 0) && (
          <div className="space-y-4 bg-slate-50 dark:bg-[#102237] p-5 rounded-md border border-slate-200 dark:border-[#1a2e45]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#14263b] pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00b04f]" /> Official Submitted Match Report Summary
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00b04f]/15 border border-[#00b04f]/30 text-[#00b04f]">
                VERIFIED REPORT
              </span>
            </div>

            {/* Goals */}
            <div className="space-y-2 text-xs">
              <span className="font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">Goal Scorers ({goals.length}):</span>
              {goals.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 italic">No goals recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {goals.map((g) => (
                    <div key={g.id} className="p-2.5 bg-white dark:bg-[#0e1c2b] rounded-sm border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between text-slate-900 dark:text-white font-medium">
                      <span>⚽ <strong>{g.minute}'</strong> — {g.detailText || 'Goal'}</span>
                      <span className="px-2 py-0.5 text-[10px] font-black bg-[#00b04f]/15 text-[#00b04f] rounded-xs uppercase tracking-wider">GOAL</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Yellow Cards */}
            <div className="space-y-2 text-xs pt-2">
              <span className="font-black uppercase tracking-wider text-amber-500 block">Yellow Cards ({yellowCards.length}):</span>
              {yellowCards.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 italic">0 Yellow Cards Awarded.</p>
              ) : (
                <div className="space-y-1.5">
                  {yellowCards.map((c) => (
                    <div key={c.id} className="p-2.5 bg-white dark:bg-[#0e1c2b] rounded-sm border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between text-slate-900 dark:text-white font-medium">
                      <span>🟨 <strong>{c.minute}'</strong> — {c.detailText || 'Yellow Card'}</span>
                      <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500/15 text-amber-500 rounded-xs uppercase tracking-wider">YELLOW</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Red Cards */}
            <div className="space-y-2 text-xs pt-2">
              <span className="font-black uppercase tracking-wider text-rose-500 block">Red Cards ({redCards.length}):</span>
              {redCards.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 italic">0 Red Cards Awarded.</p>
              ) : (
                <div className="space-y-1.5">
                  {redCards.map((c) => (
                    <div key={c.id} className="p-2.5 bg-white dark:bg-[#0e1c2b] rounded-sm border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between text-slate-900 dark:text-white font-medium">
                      <span>🟥 <strong>{c.minute}'</strong> — {c.detailText || 'Red Card'}</span>
                      <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500/15 text-rose-500 rounded-xs uppercase tracking-wider">RED CARD</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Injuries */}
            <div className="space-y-2 text-xs pt-2">
              <span className="font-black uppercase tracking-wider text-sky-400 block">Injuries ({injuries.length}):</span>
              {injuries.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 italic">No injury timeouts recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {injuries.map((i) => (
                    <div key={i.id} className="p-2.5 bg-white dark:bg-[#0e1c2b] rounded-sm border border-slate-200 dark:border-[#1a2e45] text-slate-900 dark:text-white font-medium">
                      <span>🤕 <strong>{i.minute}'</strong> — {i.detailText || 'Injury timeout'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Officials */}
        <div className="space-y-3 bg-slate-50 dark:bg-[#102237] p-4 rounded-md border border-slate-200 dark:border-[#1a2e45]">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-400" /> Match Officials
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-[#0e1c2b] rounded-sm border border-slate-200 dark:border-[#1a2e45]">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Center Referee</span>
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs sm:text-sm">{currentUserName}</span>
            </div>
            <div className="p-3 bg-white dark:bg-[#0e1c2b] rounded-sm border border-slate-200 dark:border-[#1a2e45]">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Assistant Referee 1</span>
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs sm:text-sm">{selectedFixture.assistantReferee1 || 'Assistant Official 1'}</span>
            </div>
            <div className="p-3 bg-white dark:bg-[#0e1c2b] rounded-sm border border-slate-200 dark:border-[#1a2e45]">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Assistant Referee 2</span>
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs sm:text-sm">{selectedFixture.assistantReferee2 || 'Assistant Official 2'}</span>
            </div>
            <div className="p-3 bg-white dark:bg-[#0e1c2b] rounded-sm border border-slate-200 dark:border-[#1a2e45]">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">4th Official</span>
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs sm:text-sm">4th Official</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: End Match & Cancel Match (if match not finished) */}
        {!isFinished && !isCancelled && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#14263b]">
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancel}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold uppercase text-xs tracking-wider rounded-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Match</span>
            </button>

            <button
              type="button"
              onClick={onEndMatch}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider rounded-md shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
