import React, { useState } from 'react';
import { 
  X, MapPin, Clock, CloudSun, UserCheck, 
  CheckCircle, XCircle, Trophy, AlertTriangle, Save, Loader2 
} from 'lucide-react';
import { MatchEventsDetailView } from '../../../../shared/MatchEventsDetailView';
import type { Match, MatchStatus } from '../../../../../types';

interface MatchDetailsModalProps {
  match: Match;
  currentUserName: string;
  activeRefereeId?: string;
  isAssignedToMe?: boolean;
  onSaveMatchDetails?: (
    fixtureId: string,
    updates: {
      scheduledTime?: string;
      time?: string;
      scoreA?: number;
      scoreB?: number;
      status?: MatchStatus;
      venue?: string;
    }
  ) => Promise<void>;
  onClose: () => void;
  onEndMatch: (match: Match) => void;
  onCancelMatch: (fixtureId: string) => Promise<void>;
  onOpenWalkover: (match: Match) => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  match,
  currentUserName,
  activeRefereeId,
  isAssignedToMe,
  onSaveMatchDetails,
  onClose,
  onEndMatch,
  onCancelMatch,
  onOpenWalkover,
}) => {
  // Unified Match Operations: All matches are editable and actionable by any logged-in referee
  const assigned = true;

  // Game Fill editable state (editable at any time by assigned referee)
  const [kickoffTime, setKickoffTime] = useState<string>(() => {
    if (match.time && match.time.includes(':')) {
      const parts = match.time.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    if (match.scheduledTime) {
      const d = new Date(match.scheduledTime);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return '16:00';
  });

  const [scoreHome, setScoreHome] = useState<number>(match.scoreA ?? 0);
  const [scoreAway, setScoreAway] = useState<number>(match.scoreB ?? 0);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>(match.status || 'UPCOMING');
  const [venue, setVenue] = useState<string>(match.venue || 'Pitch A — Main Stadium Pitch');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isFinished = matchStatus === 'FT';
  const isCancelled = matchStatus === 'CANCELLED';
  const isLive = matchStatus === 'LIVE' || matchStatus === 'HT';

  const handleSaveGameFill = async () => {
    if (!assigned) return;
    if (!onSaveMatchDetails) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onSaveMatchDetails(match.id, {
        time: kickoffTime,
        scoreA: scoreHome,
        scoreB: scoreAway,
        status: matchStatus,
        venue,
      });
      setSaveMessage('Match updated and live on guest page!');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message || 'Failed to save'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'HT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ff0046]/15 text-[#ff0046] border border-[#ff0046]/30 uppercase tracking-wider animate-pulse">
            ● {status}
          </span>
        );
      case 'FT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30 uppercase tracking-wider">
            Full Time
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase tracking-wider">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-[#152a40] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 uppercase tracking-wider">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-modal-title"
    >
      <div
        className="bg-white dark:bg-[#0e1e2d] border border-slate-200 dark:border-[#1a2e45] rounded-xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2e45] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#ff0046]/10 border border-[#ff0046]/30 flex items-center justify-center text-[#ff0046]">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 id="match-modal-title" className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                {match.league || 'Egerton Premier League'} • Matchday {match.matchday || 1}
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Official Game Fill & Match Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {renderStatusBadge(matchStatus)}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152a40] transition-colors cursor-pointer"
              aria-label="Close match details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ASSIGNMENT WARNING BANNER: If not assigned to this referee UID */}
        {!assigned && (
          <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-md text-amber-500 text-xs font-black uppercase tracking-wider flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>You cannot confirm a match that is not assigned to you.</span>
          </div>
        )}

        {/* Scoreboard Block */}
        <div className="bg-slate-50 dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-md p-5 grid grid-cols-11 items-center gap-2 shadow-xs">
          {/* Home */}
          <div className="col-span-5 flex items-center justify-end gap-3 text-right">
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tight">
                {match.teamA.name}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Home</span>
            </div>
            <img
              src={match.teamA.logo}
              alt={match.teamA.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
            />
          </div>

          {/* Score / VS */}
          <div className="col-span-1 text-center font-mono font-black text-lg sm:text-xl text-[#ff0046]">
            {isFinished || isLive || isCancelled ? `${scoreHome} - ${scoreAway}` : 'VS'}
          </div>

          {/* Away */}
          <div className="col-span-5 flex items-center justify-start gap-3 text-left">
            <img
              src={match.teamB.logo}
              alt={match.teamB.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
            />
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tight">
                {match.teamB.name}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Away</span>
            </div>
          </div>
        </div>

        {/* GAME FILL & ANY-TIME SAVE CONTROLS */}
        <div className="bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] rounded-md p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1a2e45] pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ff0046]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Game Fill: Update Match At Any Time
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Syncs Live to Frontend Guest Page
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Kickoff Time */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" /> Kickoff Time (EAT)
              </label>
              <input
                type="time"
                value={kickoffTime}
                disabled={!assigned || isSaving}
                onChange={(e) => setKickoffTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-md bg-white dark:bg-[#0a1520] border border-slate-200 dark:border-[#223b56] text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-hidden disabled:opacity-50"
              />
            </div>

            {/* 2. Match Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Match Status
              </label>
              <select
                value={matchStatus}
                disabled={!assigned || isSaving}
                onChange={(e) => setMatchStatus(e.target.value as MatchStatus)}
                className="w-full px-3 py-2 text-xs font-bold rounded-md bg-white dark:bg-[#0a1520] border border-slate-200 dark:border-[#223b56] text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-hidden disabled:opacity-50"
              >
                <option value="UPCOMING">UPCOMING</option>
                <option value="LIVE">LIVE (In Progress)</option>
                <option value="HT">HT (Half Time)</option>
                <option value="FT">FT (Full Time)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* 3. Venue */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#ff0046]" /> Venue
              </label>
              <input
                type="text"
                value={venue}
                disabled={!assigned || isSaving}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-md bg-white dark:bg-[#0a1520] border border-slate-200 dark:border-[#223b56] text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-hidden disabled:opacity-50 truncate"
              />
            </div>
          </div>

          {/* Score adjustments for live or manual referee score updates */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-md bg-white dark:bg-[#0a1520] border border-slate-200 dark:border-[#223b56] flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase truncate pr-2 text-slate-800 dark:text-slate-200">
                {match.teamA.shortName || 'Home'} Score:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!assigned || scoreHome <= 0 || isSaving}
                  onClick={() => setScoreHome((prev) => Math.max(0, prev - 1))}
                  className="w-6 h-6 rounded-sm bg-slate-100 dark:bg-[#152a40] text-slate-700 dark:text-white font-black text-xs hover:bg-[#ff0046] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-black text-sm text-[#ff0046] w-6 text-center">{scoreHome}</span>
                <button
                  type="button"
                  disabled={!assigned || isSaving}
                  onClick={() => setScoreHome((prev) => prev + 1)}
                  className="w-6 h-6 rounded-sm bg-slate-100 dark:bg-[#152a40] text-slate-700 dark:text-white font-black text-xs hover:bg-[#ff0046] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-white dark:bg-[#0a1520] border border-slate-200 dark:border-[#223b56] flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase truncate pr-2 text-slate-800 dark:text-slate-200">
                {match.teamB.shortName || 'Away'} Score:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!assigned || scoreAway <= 0 || isSaving}
                  onClick={() => setScoreAway((prev) => Math.max(0, prev - 1))}
                  className="w-6 h-6 rounded-sm bg-slate-100 dark:bg-[#152a40] text-slate-700 dark:text-white font-black text-xs hover:bg-[#ff0046] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-black text-sm text-[#ff0046] w-6 text-center">{scoreAway}</span>
                <button
                  type="button"
                  disabled={!assigned || isSaving}
                  onClick={() => setScoreAway((prev) => prev + 1)}
                  className="w-6 h-6 rounded-sm bg-slate-100 dark:bg-[#152a40] text-slate-700 dark:text-white font-black text-xs hover:bg-[#ff0046] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1a2e45]">
            {saveMessage ? (
              <span className="text-xs font-black uppercase tracking-wider text-emerald-500">
                {saveMessage}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">
                Save match details anytime. Changes broadcast instantly to guest users.
              </span>
            )}

            <button
              type="button"
              disabled={!assigned || isSaving}
              onClick={handleSaveGameFill}
              className="px-4 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs disabled:opacity-40 flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Match Details</span>
            </button>
          </div>
        </div>

        {/* Assigned Match Officials / Linesmen */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#ff0046]" /> Assigned Match Officials & Linesmen
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] space-y-0.5">
              <span className="text-[9px] uppercase font-black tracking-wider text-[#ff0046] block">Center Referee</span>
              <span className="font-black text-slate-900 dark:text-white truncate block">{match.referee || currentUserName}</span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] space-y-0.5">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Linesman 1 (AR1)</span>
              <span className="font-black text-slate-900 dark:text-white truncate block">{match.assistantReferee1 || 'Assistant 1'}</span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] space-y-0.5">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Linesman 2 (AR2)</span>
              <span className="font-black text-slate-900 dark:text-white truncate block">{match.assistantReferee2 || 'Assistant 2'}</span>
            </div>
            <div className="p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] space-y-0.5">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">4th Official</span>
              <span className="font-black text-slate-900 dark:text-white truncate block">{match.fourthOfficial || 'Table Official'}</span>
            </div>
          </div>
        </div>

        {/* Match Events Timeline (Non-overlapping, live by match UID) */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1a2e45]">
          <MatchEventsDetailView
            matchId={match.id}
            initialMatch={match}
            canEdit={false}
            role="referee"
          />
        </div>

        {/* Action Controls for Referee (End Match, Cancel Match, Walkover) */}
        {!isFinished && !isCancelled && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-[#1a2e45]">
            <button
              type="button"
              disabled={!assigned}
              onClick={() => {
                if (window.confirm(`Cancel match ${match.teamA.name} vs ${match.teamB.name}?`)) {
                  onCancelMatch(match.id);
                  onClose();
                }
              }}
              className="px-4 py-2.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Match</span>
            </button>

            <button
              type="button"
              disabled={!assigned}
              onClick={() => {
                onClose();
                onOpenWalkover(match);
              }}
              className="px-4 py-2.5 rounded-md bg-slate-100 dark:bg-[#152a40] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Award Walkover (3-0)</span>
            </button>

            <button
              type="button"
              disabled={!assigned}
              onClick={() => {
                onClose();
                onEndMatch(match);
              }}
              className="px-5 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>End Match Portal</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default MatchDetailsModal;
