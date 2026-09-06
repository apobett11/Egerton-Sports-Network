import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Shield,
  MapPin,
  UserCheck,
  CalendarDays,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type {
  SeasonModeView,
  OperationalMatch,
  SeasonReferee,
  SeasonPitch,
  SeasonTeam,
  OperationalAlert,
} from '../../types/seasonMode';
import { COMPETITIONS } from '../../constants/seasonConstants';
import { WeekendRefereeAllocationModal } from './WeekendRefereeAllocationModal';

interface OverviewViewProps {
  isDark: boolean;
  fixtures: OperationalMatch[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
  teams: SeasonTeam[];
  alerts: OperationalAlert[];
  setActiveView: (view: SeasonModeView) => void;
  onOpenCalendar: () => void;
  onCancelMatchday: (matchdayNumber: number, reason: string) => void;
  onSelectDate: (dateStr: string) => void;
  onRefresh?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  isDark,
  fixtures,
  referees,
  pitches,
  alerts,
  setActiveView,
  onOpenCalendar,
  onCancelMatchday,
  onSelectDate,
  onRefresh,
}) => {
  const [showCancelMatchdayModal, setShowCancelMatchdayModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isWeekendRefModalOpen, setIsWeekendRefModalOpen] = useState<boolean>(false);

  // Weekend playdays & referee allocation status (Open Friday & Saturday, used only once per weekend)
  const { isWeekendAllocationOpen, isAlreadyAllocated, satDateStr, sunDateStr } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    const isOpen = dayOfWeek === 5 || dayOfWeek === 6; // Open on Fridays and Saturdays
    const satOffset = (6 - dayOfWeek + 7) % 7;
    const sat = new Date(now);
    sat.setDate(now.getDate() + satOffset);
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);

    const sDate = sat.toISOString().split('T')[0];
    const suDate = sun.toISOString().split('T')[0];

    // Check if matches scheduled for next Saturday & Sunday already have center referees allocated
    const weekendFixtures = fixtures.filter((f) => {
      const timeStr = f.scheduled_time || '';
      const pDate = (f as any).play_date || '';
      return (
        timeStr.startsWith(sDate) ||
        timeStr.startsWith(suDate) ||
        pDate === sDate ||
        pDate === suDate
      );
    });

    const alreadyDone =
      weekendFixtures.length > 0 &&
      weekendFixtures.every((f) => Boolean(f.referee_id || (f as any).center_referee_id));

    return {
      isWeekendAllocationOpen: isOpen,
      isAlreadyAllocated: alreadyDone,
      satDateStr: sDate,
      sunDateStr: suDate,
    };
  }, [fixtures]);

  const todayStr = new Date().toISOString().split('T')[0];
  const formattedTodayDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Today's matches
  const todayMatches = fixtures.filter(
    (f) => f.scheduled_time && f.scheduled_time.startsWith(todayStr)
  );

  const eplToday = todayMatches.filter((f) => f.competition_id === COMPETITIONS.PREMIER_LEAGUE.id);
  const champToday = todayMatches.filter((f) => f.competition_id === COMPETITIONS.CHAMPIONSHIP.id);

  const todayPlayed = todayMatches.filter((f) => f.status === 'FT').length;
  const todayUpcoming = todayMatches.filter(
    (f) => f.status === 'UPCOMING' || f.status === 'LIVE' || f.status === 'HT'
  ).length;
  const todayCancelled = todayMatches.filter((f) => f.status === 'CANCELLED').length;
  const todayPostponed = todayMatches.filter((f) => f.status === 'POSTPONED').length;

  // Active Matchday calculations
  const activeMatchdayNumber = fixtures.length > 0 ? (fixtures.find((f) => f.status === 'LIVE' || f.status === 'UPCOMING')?.matchday || fixtures[0]?.matchday || 1) : 0;
  const activeMatchdayFixtures = fixtures.filter((f) => f.matchday === activeMatchdayNumber);
  const mdTotal = activeMatchdayFixtures.length;
  const mdCompleted = activeMatchdayFixtures.filter((f) => f.status === 'FT').length;
  const mdRemaining = Math.max(0, mdTotal - mdCompleted);
  const mdPercentage = mdTotal > 0 ? Math.round((mdCompleted / mdTotal) * 100) : 0;

  const activeReferees = referees.filter((r) => r.status === 'Active').length;
  const availablePitches = pitches.filter((p) => p.status === 'Available').length;

  const handleConfirmCancelMatchday = () => {
    onCancelMatchday(activeMatchdayNumber, cancelReason || 'Operational Directive');
    setShowCancelMatchdayModal(false);
    setCancelReason('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* SECTION 1: SEASON STATUS BANNER */}
      <div
        className={`p-5 sm:p-6 rounded-md border relative overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs'
            : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
        }`}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00b04f] animate-pulse" />
                Active Season
              </span>
              <span className="text-xs text-slate-400 font-bold">{formattedTodayDate}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* WEEKEND REFEREE ALLOCATION (AGENT 0 ALGO 4 & 5) */}
              <button
                onClick={() => setIsWeekendRefModalOpen(true)}
                disabled={isAlreadyAllocated}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-black text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-98 shadow-xs ${
                  isAlreadyAllocated
                    ? 'bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30 opacity-90 cursor-not-allowed'
                    : isWeekendAllocationOpen
                    ? 'bg-[#ff0046] hover:bg-[#e0003e] text-white shadow-sm'
                    : 'bg-[#152a40] hover:bg-[#1c3857] text-slate-300 border border-white/10'
                }`}
                title={
                  isAlreadyAllocated
                    ? `Referees already allocated for upcoming weekend (${satDateStr} & ${sunDateStr}). Used for this weekend.`
                    : !isWeekendAllocationOpen
                    ? 'Weekend referee allocation window opens on Fridays and Saturdays.'
                    : `Allocate referees for upcoming Saturday (${satDateStr}) & Sunday (${sunDateStr}) matchdays (Agent 0 Algorithm 4 & 5)`
                }
              >
                {isAlreadyAllocated ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#00b04f]" />
                    <span>Weekend Referees Allocated</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Allocate Weekend Referees</span>
                  </>
                )}
              </button>

              {/* Section 4: CALENDAR ICON BUTTON */}
              <button
                onClick={onOpenCalendar}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                <CalendarIcon className="w-4 h-4 text-[#ff0046]" />
                <span>Operational Calendar</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Egerton Sports Season Operational Control Centre
            </h1>
            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-3xl">
              Managing real-world execution for Egerton Premier League and Egerton Championships.
              Current Matchday: <span className="text-[#ff0046] font-bold">Matchday {activeMatchdayNumber}</span>
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: TODAY'S MATCHES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Today&apos;s Matches
            </h2>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#152a40] text-slate-300 border border-[#1a2e45]">
              {todayMatches.length} Scheduled
            </span>
          </div>
          <button
            onClick={() => {
              onSelectDate(todayStr);
              setActiveView('matchdays');
            }}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#ff0046] hover:underline cursor-pointer"
          >
            <span>Go to Today&apos;s Matchday</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            className={`p-4 rounded-md border transition-all ${
              isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Played</span>
              <CheckCircle2 className="w-4 h-4 text-[#00b04f]" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight">{todayPlayed}</div>
            <p className="text-[10px] text-slate-400 mt-1">Completed matches today</p>
          </div>

          <div
            className={`p-4 rounded-md border transition-all ${
              isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Unplayed / Scheduled</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight">{todayUpcoming}</div>
            <p className="text-[10px] text-slate-400 mt-1">Pending kick-off</p>
          </div>

          <div
            className={`p-4 rounded-md border transition-all ${
              isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Cancelled</span>
              <XCircle className="w-4 h-4 text-[#d63031]" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-[#d63031]">{todayCancelled}</div>
            <p className="text-[10px] text-slate-400 mt-1">Cancelled today</p>
          </div>

          <div
            className={`p-4 rounded-md border transition-all ${
              isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Postponed</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-amber-400">{todayPostponed}</div>
            <p className="text-[10px] text-slate-400 mt-1">Awaiting new fixture date</p>
          </div>
        </div>

        {/* Competition Division Breakdown */}
        <div
          className={`p-4 rounded-md border ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#14263b]">
            <div className="space-y-1.5 pr-0 md:pr-4">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#ff0046]" /> Egerton Premier League
                </span>
                <span className="text-xs font-bold text-slate-400">{eplToday.length} matches today</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Division 1 Competition Fixtures
              </p>
            </div>

            <div className="space-y-1.5 pt-3 md:pt-0 md:pl-4">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" /> Egerton Championships
                </span>
                <span className="text-xs font-bold text-slate-400">{champToday.length} matches today</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Division 2 Competition Fixtures
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: MATCHDAY PROGRESS & ACTION CARD */}
      <div
        className={`p-5 rounded-md border space-y-4 ${
          isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-white shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-900 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Matchday Progress — Matchday {activeMatchdayNumber}
              </h2>
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
                Current Operational Window
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {mdCompleted} played • {mdRemaining} remaining • {mdTotal} total fixtures
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('matchdays')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider cursor-pointer shadow-xs transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Browse Matchdays</span>
            </button>

            {/* Cancel Matchday Action Button */}
            <button
              onClick={() => setShowCancelMatchdayModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-black uppercase text-xs tracking-wider cursor-pointer transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Matchday</span>
            </button>
          </div>
        </div>

        {/* Clear Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Percentage Complete</span>
            <span className="text-[#ff0046] font-mono text-xs font-black">{mdPercentage}%</span>
          </div>
          <div className="w-full h-2 rounded-sm bg-[#14263b] overflow-hidden">
            <div
              className="h-full rounded-sm bg-[#ff0046] transition-all duration-500"
              style={{ width: `${mdPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* OPERATIONAL ALERTS DISPLAY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Operational Alerts
            </h2>
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {alerts.length} Active
            </span>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div
            className={`p-6 rounded-md border text-center space-y-2 ${
              isDark ? 'bg-[#0e1c2b] border-[#1a2e45] text-slate-300 shadow-xs' : 'bg-white border-[#e6e8ec] text-slate-700 shadow-xs'
            }`}
          >
            <CheckCircle2 className="w-7 h-7 text-[#00b04f] mx-auto" />
            <h3 className="font-black text-xs uppercase tracking-wider">No Active System Alerts</h3>
            <p className="text-xs text-slate-400">All matchday operations and referee assignments are running cleanly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-md border space-y-1.5 transition-all ${
                  alert.severity === 'high'
                    ? isDark
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                    : isDark
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {alert.title}
                  </h4>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-black/20">
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs opacity-90">{alert.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CANCEL MATCHDAY CONFIRMATION MODAL */}
      {showCancelMatchdayModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-md-title"
        >
          <div
            className={`w-full max-w-md ${
              isDark ? 'bg-[#0e1e2d] border-[#1a2e45] text-white' : 'bg-white border-[#e6e8ec] text-slate-900'
            } border rounded-xl p-5 space-y-4 shadow-2xl`}
          >
            <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-rose-500/20 text-rose-500 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 id="cancel-md-title" className="text-sm font-black uppercase tracking-wider">
                  Confirm Cancel Matchday {activeMatchdayNumber}
                </h3>
              </div>
              <button
                onClick={() => setShowCancelMatchdayModal(false)}
                aria-label="Close cancel matchday modal"
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer rounded-md hover:bg-[#152a40]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400 leading-relaxed font-medium">
                Cancelling Matchday {activeMatchdayNumber} will mark all unplayed fixtures in this matchday as CANCELLED.
                This action is logged in the operational audit log.
              </p>

              <div>
                <label htmlFor="cancel-md-reason" className="block text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-1">
                  Cancellation Reason / Weather State
                </label>
                <textarea
                  id="cancel-md-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Specify reason e.g. Extreme weather / pitch unplayable..."
                  className={`w-full p-2.5 rounded-md border text-xs focus:border-[#ff0046] focus:outline-none ${
                    isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#1a2e45]">
              <button
                onClick={() => setShowCancelMatchdayModal(false)}
                className="w-1/2 py-2 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                Keep Matchday
              </button>
              <button
                onClick={handleConfirmCancelMatchday}
                className="w-1/2 py-2 rounded-md bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WEEKEND REFEREE ALLOCATION ONE-PAGE MODULE */}
      <WeekendRefereeAllocationModal
        isOpen={isWeekendRefModalOpen}
        onClose={() => setIsWeekendRefModalOpen(false)}
        isDark={isDark}
        onAllocationComplete={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
