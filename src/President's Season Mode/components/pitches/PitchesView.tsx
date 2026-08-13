import React, { useState } from 'react';
import { MapPin, Users, AlertTriangle, CheckCircle2, Sliders, Clock, Map } from 'lucide-react';
import type { SeasonPitch, OperationalMatch, PitchAvailabilityMode } from '../../types/seasonMode';

interface PitchesViewProps {
  isDark: boolean;
  pitches: SeasonPitch[];
  fixtures: OperationalMatch[];
  onUpdatePitchAvailability: (pitchId: string, mode: PitchAvailabilityMode) => void;
  pitchConflictModalData: { pitch: SeasonPitch; mode: PitchAvailabilityMode; affected: OperationalMatch[] } | null;
  onClosePitchConflictModal: () => void;
}

export const PitchesView: React.FC<PitchesViewProps> = ({
  isDark,
  pitches,
  fixtures,
  onUpdatePitchAvailability,
  pitchConflictModalData,
  onClosePitchConflictModal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Official Pitch Infrastructure & Availability Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage official Egerton campus pitch availability modes and inspect schedule impact.
          </p>
        </div>
      </div>

      {/* PITCHES INLINE CARDS LIST */}
      <div className="space-y-4">
        {pitches.map((pitch) => {
          const todayUsage = fixtures.filter(
            (f) =>
              (f.venue === pitch.name || f.venue === pitch.short_code) &&
              f.scheduled_time?.startsWith(todayStr) &&
              f.status !== 'CANCELLED'
          );

          const upcomingUsage = fixtures.filter(
            (f) => (f.venue === pitch.name || f.venue === pitch.short_code) && f.status === 'UPCOMING'
          );

          const currentMode: PitchAvailabilityMode =
            pitch.status === 'Unavailable' ? 'Unavailable' : pitch.status === 'Occupied' ? 'Morning only' : 'Available';

          return (
            <div
              key={pitch.id}
              className={`p-5 rounded-2xl border transition-all ${
                pitch.status === 'Unavailable'
                  ? isDark
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : 'bg-rose-50 border-rose-200'
                  : isDark
                  ? 'bg-[#0E1424] border-slate-800 hover:border-emerald-500/40'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Pitch Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {pitch.short_code || 'PITCH'}
                    </span>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {pitch.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>{pitch.location || 'Egerton Campus Grounds'}</span>
                    <span>•</span>
                    <span>{pitch.capacity ? pitch.capacity.toLocaleString() : 5000} Spectators</span>
                    <span>•</span>
                    <span>{pitch.surface_type || 'Natural Grass'}</span>
                  </p>
                </div>

                {/* Match Usage Badge */}
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-300">
                    Today: <strong className="text-emerald-400">{todayUsage.length} match(es)</strong>
                  </span>

                  <span className="px-3 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-300">
                    Total: <strong className="text-blue-400">{upcomingUsage.length} match(es)</strong>
                  </span>
                </div>

                {/* Dropdown Control */}
                <div className="min-w-[200px]">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Availability Control
                  </label>
                  <select
                    value={currentMode}
                    onChange={(e) => onUpdatePitchAvailability(pitch.id, e.target.value as PitchAvailabilityMode)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-extrabold outline-none cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Available">Available</option>
                    <option value="Morning only">Morning only</option>
                    <option value="Afternoon only">Afternoon only</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AFFECTED MATCHES CONFLICT MODAL */}
      {pitchConflictModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg p-6 rounded-3xl border space-y-4 animate-scaleUp ${
              isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-black text-lg">
                Pitch Closure Impact: {pitchConflictModalData.pitch.name}
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Updating {pitchConflictModalData.pitch.name} to &quot;{pitchConflictModalData.mode}&quot; impacts {pitchConflictModalData.affected.length} upcoming match(es) on this ground:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pitchConflictModalData.affected.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-bold text-white">
                    {m.home_team?.name} vs {m.away_team?.name}
                  </span>
                  <span className="text-slate-400 font-mono">{m.scheduled_time?.replace('T', ' ')}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onClosePitchConflictModal}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow-md min-h-[44px]"
            >
              Acknowledge & Confirm Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
