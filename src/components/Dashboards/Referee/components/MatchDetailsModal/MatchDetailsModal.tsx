import React from 'react';
import { 
  X, MapPin, Clock, CloudSun, UserCheck, ShieldCheck, 
  CheckCircle, XCircle, Trophy, Award, AlertCircle 
} from 'lucide-react';
import { MatchEventsDetailView } from '../../../../shared/MatchEventsDetailView';
import type { Match } from '../../../../../types';

interface MatchDetailsModalProps {
  match: Match;
  currentUserName: string;
  onClose: () => void;
  onEndMatch: (match: Match) => void;
  onCancelMatch: (fixtureId: string) => Promise<void>;
  onOpenWalkover: (match: Match) => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  currentUserName,
  onClose,
  onEndMatch,
  onCancelMatch,
  onOpenWalkover,
}) => {
  const isFinished = match.status === 'FT';
  const isCancelled = match.status === 'CANCELLED';
  const isLive = match.status === 'LIVE' || match.status === 'HT';

  const goals = (match.events || []).filter((e) => e.type === 'goal' || e.type === 'penalty');
  const yellowCards = (match.events || []).filter((e) => e.type === 'yellow');
  const redCards = (match.events || []).filter((e) => e.type === 'red');
  const injuries = (match.events || []).filter((e) => e.type === 'injury');

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'HT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase animate-pulse">
            ● {status}
          </span>
        );
      case 'FT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 uppercase">
            Full Time
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-modal-title"
    >
      <div
        className="bg-white dark:bg-[#121827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div>
              <h3 id="match-modal-title" className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                {match.league || 'Egerton Premier League'} • Matchday {match.matchday || 1}
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Fixture Details & Officiating Controls
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {renderStatusBadge(match.status)}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close match details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scoreboard Block */}
        <div className="bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 grid grid-cols-11 items-center gap-2">
          {/* Home */}
          <div className="col-span-5 flex items-center justify-end gap-3 text-right">
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {match.teamA.name}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Home</span>
            </div>
            <img
              src={match.teamA.logo}
              alt={match.teamA.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
            />
          </div>

          {/* Score / VS */}
          <div className="col-span-1 text-center font-mono font-black text-lg sm:text-xl text-amber-600 dark:text-[#D4AF37]">
            {isFinished || isLive || isCancelled ? `${match.scoreA} - ${match.scoreB}` : 'VS'}
          </div>

          {/* Away */}
          <div className="col-span-5 flex items-center justify-start gap-3 text-left">
            <img
              src={match.teamB.logo}
              alt={match.teamB.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
            />
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {match.teamB.name}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Away</span>
            </div>
          </div>
        </div>

        {/* Match Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-rose-500" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">PITCH / VENUE</span>
              <strong className="text-slate-800 dark:text-slate-200">{match.venue || 'Pavilion Main Pitch'}</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">KICKOFF TIME</span>
              <strong className="text-slate-800 dark:text-slate-200">{match.time || '16:00'}</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5">
            <CloudSun className="w-4 h-4 text-sky-500" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">PITCH CONDITIONS</span>
              <strong className="text-slate-800 dark:text-slate-200">Good, Dry Turf</strong>
            </div>
          </div>
        </div>

        {/* Assigned Match Officials / Linesmen */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-500" /> Assigned Match Officials & Linesmen
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-[#D4AF37] block">Center Referee</span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate block">{match.referee || currentUserName}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Linesman 1 (AR1)</span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate block">{match.assistantReferee1 || 'Assistant 1'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Linesman 2 (AR2)</span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate block">{match.assistantReferee2 || 'Assistant 2'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">4th Official</span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate block">{match.fourthOfficial || 'Table Official'}</span>
            </div>
          </div>
        </div>

        {/* Match Events Timeline (Non-overlapping, live by match UID) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <MatchEventsDetailView
            matchId={match.id}
            initialMatch={match}
            canEdit={false}
            role="referee"
          />
        </div>

        {/* Action Controls for Referee (End Match, Cancel Match, Walkover) */}
        {!isFinished && !isCancelled && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            {match.scheduledTime && new Date(match.scheduledTime).toDateString() !== new Date().toDateString() && new Date(match.scheduledTime).getTime() > new Date().getTime() ? (
              <div className="text-xs text-amber-500 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Matchday not arrived — Match actions locked until scheduled date</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Cancel match ${match.teamA.name} vs ${match.teamB.name}?`)) {
                      onCancelMatch(match.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Match</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWalkover(match);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Award Walkover (3-0)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEndMatch(match);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>End Match Portal</span>
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
