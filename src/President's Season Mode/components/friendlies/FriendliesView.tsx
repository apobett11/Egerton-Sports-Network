import React, { useState } from 'react';
import { Flame, PlusCircle, AlertTriangle, Calendar, Clock, MapPin, UserCheck, CheckCircle2 } from 'lucide-react';
import type {
  OperationalMatch,
  SeasonTeam,
  SeasonReferee,
  SeasonPitch,
  FriendlyMatchPayload,
} from '../../types/seasonMode';

interface FriendliesViewProps {
  isDark: boolean;
  fixtures: OperationalMatch[];
  teams: SeasonTeam[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
  onAddFriendly: (payload: FriendlyMatchPayload) => { success: boolean; error?: string };
}

export const FriendliesView: React.FC<FriendliesViewProps> = ({
  isDark,
  fixtures,
  teams,
  referees,
  pitches,
  onAddFriendly,
}) => {
  const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [friendlyName, setFriendlyName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('16:00');
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [refereeId, setRefereeId] = useState<string>('');
  const [pitchId, setPitchId] = useState<string>('');

  const friendliesList = fixtures.filter((f) => f.is_friendly || f.competition_id === 'friendlies');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!friendlyName || !homeTeamId || !awayTeamId || !refereeId || !pitchId) {
      setFormError('Please fill out all required friendly match fields.');
      return;
    }

    if (homeTeamId === awayTeamId) {
      setFormError('Home team and Away team cannot be the same team.');
      return;
    }

    const payload: FriendlyMatchPayload = {
      friendly_name: friendlyName,
      date,
      time,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      referee_id: refereeId,
      pitch_id: pitchId,
    };

    const res = onAddFriendly(payload);
    if (!res.success) {
      setFormError(res.error || 'Conflict detected.');
    } else {
      setIsOpenAddModal(false);
      setFriendlyName('');
      setFormError(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Friendly Match Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-wider">
              Non-League
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Friendlies are scheduled independently and do not impact EPL / Championship standings, official fixture DNA, or league matchday progression.
          </p>
        </div>

        <button
          onClick={() => {
            setIsOpenAddModal(true);
            setFormError(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-purple-600/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Friendly</span>
        </button>
      </div>

      {/* Friendlies List */}
      <div className="space-y-4">
        {friendliesList.length === 0 ? (
          <div
            className={`p-8 rounded-3xl border text-center space-y-3 ${
              isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <Flame className="w-8 h-8 text-purple-400 mx-auto" />
            <h3 className="font-extrabold text-sm text-slate-200">No Friendlies Scheduled</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Add Friendly&quot; above to create exhibition, warm-up, or varsity derby matches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friendliesList.map((f) => (
              <div
                key={f.id}
                className={`p-5 rounded-3xl border space-y-3 transition-all ${
                  isDark ? 'bg-[#0E1424] border-purple-900/30 hover:border-purple-500/40' : 'bg-white border-purple-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    FRIENDLY
                  </span>
                  <span className="text-xs font-extrabold text-slate-400">
                    {f.scheduled_time ? f.scheduled_time.replace('T', ' ').slice(0, 16) : 'TBD'}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-purple-300">
                    {f.friendly_name || 'Exhibition Match'}
                  </h4>
                  <div className="font-black text-base text-white mt-1">
                    {f.home_team?.name || 'Team A'} <span className="text-purple-400 text-xs px-1.5">vs</span> {f.away_team?.name || 'Team B'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/60 text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate">{f.venue}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate">{f.referee?.name || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD FRIENDLY MODAL */}
      {isOpenAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className={`w-full max-w-lg p-6 rounded-3xl border space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-purple-400 flex items-center gap-2">
                <Flame className="w-5 h-5" /> Schedule New Friendly
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-extrabold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-400">Friendly Match Title</label>
                <input
                  type="text"
                  required
                  value={friendlyName}
                  onChange={(e) => setFriendlyName(e.target.value)}
                  placeholder="e.g. Alumni Derby / Mid-Season Exhibition"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none mt-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-400">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none mt-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-400">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none mt-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-400">Team A (Home)</label>
                  <select
                    required
                    value={homeTeamId}
                    onChange={(e) => setHomeTeamId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none mt-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="">Select Team A</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-400">Team B (Away)</label>
                  <select
                    required
                    value={awayTeamId}
                    onChange={(e) => setAwayTeamId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none mt-1 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="">Select Team B</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-400">Center Referee</label>
                <select
                  required
                  value={refereeId}
                  onChange={(e) => setRefereeId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none mt-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">Select Center Referee</option>
                  {referees.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-400">Pitch Venue</label>
                <select
                  required
                  value={pitchId}
                  onChange={(e) => setPitchId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none mt-1 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">Select Pitch</option>
                  {pitches.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.short_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpenAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-extrabold text-xs cursor-pointer hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-purple-600/20"
              >
                Create Friendly
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
