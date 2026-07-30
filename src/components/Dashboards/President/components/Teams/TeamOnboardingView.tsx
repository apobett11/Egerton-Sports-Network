import React from 'react';
import type { PendingTeam } from '../../types';

interface TeamOnboardingViewProps {
  isDark: boolean;
  pendingTeams: PendingTeam[];
  handleApproveTeam: (pt: PendingTeam) => void;
  setRejectingTeamId: (id: string | null) => void;
}

export const TeamOnboardingView: React.FC<TeamOnboardingViewProps> = ({
  isDark,
  pendingTeams,
  handleApproveTeam,
  setRejectingTeamId,
}) => {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          TAB 2 — Team Onboarding & Approvals
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Review team applications, validate roster bounds (15-25), verify head coach assignment, assign league & division, and audit approvals.
        </p>
      </div>

      {/* PENDING TEAMS TABLE */}
      <div className={`p-6 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Pending Team Registrations ({pendingTeams.length})</h3>
        </div>

        {pendingTeams.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-bold">No pending team applications to review.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-3">Team Name & Code</th>
                  <th className="px-4 py-3">Head Coach</th>
                  <th className="px-4 py-3">Roster Count</th>
                  <th className="px-4 py-3">Requested League</th>
                  <th className="px-4 py-3">Validations</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {pendingTeams.map((pt) => {
                  const rosterValid = pt.playerCount >= 15 && pt.playerCount <= 25;
                  const coachValid = pt.coachAssigned && pt.coachName;
                  return (
                    <tr key={pt.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      <td className="px-4 py-3 font-black">
                        <div>{pt.name}</div>
                        <span className="text-[10px] font-mono text-slate-500">[{pt.code}]</span>
                      </td>
                      <td className="px-4 py-3 font-bold">{pt.coachName || 'Unassigned'}</td>
                      <td className="px-4 py-3 font-black">{pt.playerCount} Players</td>
                      <td className="px-4 py-3 uppercase">{pt.requestedLeague} ({pt.division})</td>
                      <td className="px-4 py-3 space-y-1">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${rosterValid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            Roster (15-25): {rosterValid ? '✓' : 'FAIL'}
                          </span>
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${coachValid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            Coach Assigned: {coachValid ? '✓' : 'FAIL'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleApproveTeam(pt)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-500 transition-all cursor-pointer"
                        >
                          Approve Team
                        </button>
                        <button
                          onClick={() => setRejectingTeamId(pt.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs hover:bg-rose-500 transition-all cursor-pointer"
                        >
                          Reject Team
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
