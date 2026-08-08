import React from 'react';
import { MapPin, ShieldCheck, Zap, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { SeasonPitch } from '../../types/seasonMode';
import { OPERATIONAL_STATUS_COLORS } from '../../constants/seasonConstants';

interface PitchesViewProps {
  isDark: boolean;
  pitches: SeasonPitch[];
}

export const PitchesView: React.FC<PitchesViewProps> = ({ isDark, pitches }) => {
  return (
    <div className="space-y-8">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Official Campus Pitches & Grounds
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Database-backed foundation records for Egerton University sports grounds.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-black">
          <ShieldCheck className="w-4 h-4" />
          <span>3 Official Egerton Pitches Active</span>
        </div>
      </div>

      {/* PITCH CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pitches.map((pitch) => (
          <div
            key={pitch.id}
            className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
              isDark ? 'bg-[#0E1424] border-slate-800 hover:border-teal-500/30' : 'bg-white border-slate-200 hover:border-teal-400'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white flex items-center justify-center font-black shadow-lg">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                      {pitch.name}
                    </h3>
                    <span className="text-xs text-teal-400 font-mono font-bold">{pitch.short_code}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                    OPERATIONAL_STATUS_COLORS[pitch.status || 'Available']
                  }`}
                >
                  {pitch.status || 'Available'}
                </span>
              </div>

              {/* Pitch Spec Metadata */}
              <div className="space-y-2.5 pt-4 border-t border-slate-800/40 text-xs font-medium text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Location:</span>
                  <span className="truncate max-w-[160px]">{pitch.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Spectator Capacity:</span>
                  <span className="font-extrabold text-white flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {pitch.capacity ? pitch.capacity.toLocaleString() : '5,000'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Surface Type:</span>
                  <span>{pitch.surface_type || 'Natural Grass'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">LED Floodlights:</span>
                  <span className="flex items-center gap-1 font-bold">
                    {pitch.has_lighting ? (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400">Commissioned</span>
                      </>
                    ) : (
                      <span className="text-slate-500">Day Fixtures Only</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>UUID: {pitch.id.slice(0, 8)}...</span>
              <span className="text-teal-400 font-extrabold">Ready for Allocation</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
