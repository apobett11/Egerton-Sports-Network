import React, { useState } from 'react';
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
}) => {
  const [showCancelMatchdayModal, setShowCancelMatchdayModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

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
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* SECTION 1: SEASON STATUS BANNER */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-r from-[#0E1424] via-[#121A2E] to-[#0A101D] border-slate-800/90 shadow-2xl'
            : 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-800 shadow-xl'
        }`}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Season
              </span>
              <span className="text-xs text-slate-300 font-extrabold">{formattedTodayDate}</span>
            </div>

            {/* Section 4: CALENDAR ICON BUTTON */}
            <button
              onClick={onOpenCalendar}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs cursor-pointer backdrop-blur-md transition-all active:scale-95"
            >
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>Operational Calendar</span>
            </button>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Egerton Sports Season Operational Control Centre
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl font-medium leading-relaxed">
              Managing real-world execution for Egerton Premier League and Egerton Championships.
              Current Matchday: <span className="text-emerald-400 font-bold">Matchday {activeMatchdayNumber}</span>
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: TODAY'S MATCHES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Today&apos;s Matches</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {todayMatches.length} Scheduled
            </span>
          </div>
          <button
            onClick={() => {
              onSelectDate(todayStr);
              setActiveView('matchdays');
            }}
            className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <span>Go to Today&apos;s Matchday</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Played</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black tracking-tight">{todayPlayed}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Completed matches today</p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Unplayed / Scheduled</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black tracking-tight">{todayUpcoming}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Pending kick-off</p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Cancelled</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">{todayCancelled}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cancelled today</p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider">Postponed</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">{todayPostponed}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Awaiting new fixture date</p>
          </div>
        </div>

        {/* Competition Division Breakdown */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800/40">
            <div className="space-y-2 pr-0 md:pr-4">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" /> Egerton Premier League
                </span>
                <span className="text-xs font-extrabold">{eplToday.length} matches today</span>
              </div>
              <p className="text-xs text-slate-400">
                Official Division 1 Competition Fixtures
              </p>
            </div>

            <div className="space-y-2 pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" /> Egerton Championships
                </span>
                <span className="text-xs font-extrabold">{champToday.length} matches today</span>
              </div>
              <p className="text-xs text-slate-400">
                Official Division 2 Competition Fixtures
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: MATCHDAY PROGRESS & ACTION CARD */}
      <div
        className={`p-6 rounded-3xl border space-y-5 ${
          isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">Matchday Progress — Matchday {activeMatchdayNumber}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-sm"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Browse Matchdays</span>
            </button>

            {/* Cancel Matchday Action Button */}
            <button
              onClick={() => setShowCancelMatchdayModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 font-extrabold text-xs cursor-pointer transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Matchday</span>
            </button>
          </div>
        </div>

        {/* Clear Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-extrabold">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Percentage Complete</span>
            <span className="text-emerald-400 font-mono text-sm">{mdPercentage}%</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-slate-800/60 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${mdPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* OPERATIONAL ALERTS DISPLAY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Operational Alerts</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {alerts.length} Active
            </span>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div
            className={`p-6 rounded-2xl border text-center space-y-2 ${
              isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-extrabold text-sm">No Active System Alerts</h3>
            <p className="text-xs text-slate-400">All matchday operations and referee assignments are running cleanly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border space-y-2 transition-all ${
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
                  <h4 className="font-extrabold text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {alert.title}
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20">
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
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-md-title"
        >
          <div
            className={`w-full max-w-md ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } border rounded-3xl p-6 space-y-5 shadow-2xl`}
          >
            <div className="flex items-center justify-between border-b border-slate-700/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 id="cancel-md-title" className="text-base font-black">
                  Confirm Cancel Matchday {activeMatchdayNumber}
                </h3>
              </div>
              <button
                onClick={() => setShowCancelMatchdayModal(false)}
                aria-label="Close cancel matchday modal"
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed font-medium">
                Cancelling Matchday {activeMatchdayNumber} will mark all unplayed fixtures in this matchday as CANCELLED.
                This action is logged in the operational audit log.
              </p>

              <div>
                <label htmlFor="cancel-md-reason" className="block text-slate-400 uppercase font-bold mb-1">
                  Cancellation Reason / Weather State
                </label>
                <textarea
                  id="cancel-md-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Specify reason e.g. Extreme weather / pitch unplayable..."
                  className={`w-full p-3 rounded-xl border text-xs focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
                    isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowCancelMatchdayModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Keep Matchday
              </button>
              <button
                onClick={handleConfirmCancelMatchday}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
