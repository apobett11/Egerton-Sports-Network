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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className={`text-xl md:text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Team Onboarding & Approvals
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Review team applications, validate roster bounds (15-25), verify head coach assignment, assign league & division, and audit approvals.
        </p>
      </div>

      {/* PENDING TEAMS TABLE */}
      <div className={`p-4 sm:p-5 rounded-none sm:rounded-sm border space-y-4 shadow-xs ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <div className="flex items-center justify-between border-b pb-3 border-[#14263b]">
          <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Pending Team Registrations ({pendingTeams.length})</h3>
        </div>

        {pendingTeams.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-bold">No pending team applications to review.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#112236] border-[#1a2e45] text-slate-400' : 'bg-[#f8f9fa] border-[#e6e8ec] text-slate-600'}`}>
                <tr>
                  <th className="px-4 py-2.5">Team Name & Code</th>
                  <th className="px-4 py-2.5">Head Coach</th>
                  <th className="px-4 py-2.5">Roster Count</th>
                  <th className="px-4 py-2.5">Requested League</th>
                  <th className="px-4 py-2.5">Validations</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14263b]">
                {pendingTeams.map((pt) => {
                  const rosterValid = pt.playerCount >= 15 && pt.playerCount <= 25;
                  const coachValid = pt.coachAssigned && pt.coachName;
                  return (
                    <tr key={pt.id} className={`hover:bg-[#13263b] transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <td className="px-4 py-2.5 font-black">
                        <div>{pt.name}</div>
                        <span className="text-[10px] font-mono text-slate-500">[{pt.code}]</span>
                      </td>
                      <td className="px-4 py-2.5 font-bold">{pt.coachName || 'Unassigned'}</td>
                      <td className="px-4 py-2.5 font-mono font-bold">{pt.playerCount} Players</td>
                      <td className="px-4 py-2.5 uppercase font-bold text-slate-300">{pt.requestedLeague} ({pt.division})</td>
                      <td className="px-4 py-2.5 space-y-1">
                        <div>
                          <span className={`px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider ${rosterValid ? 'bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/20' : 'bg-rose-500/10 text-[#ff0046] border border-rose-500/20'}`}>
                            Roster (15-25): {rosterValid ? '✓' : 'FAIL'}
                          </span>
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider ${coachValid ? 'bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/20' : 'bg-rose-500/10 text-[#ff0046] border border-rose-500/20'}`}>
                            Coach Assigned: {coachValid ? '✓' : 'FAIL'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        <button
                          onClick={() => handleApproveTeam(pt)}
                          className="px-3 py-1.5 rounded-md bg-[#00b04f] hover:bg-[#009643] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingTeamId(pt.id)}
                          className="px-3 py-1.5 rounded-md bg-[#152a40] hover:bg-[#ff0046] text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
                        >
                          Reject
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
