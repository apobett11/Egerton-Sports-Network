import React from 'react';
import { UserCheck, Award, Zap, Activity, Check, X } from 'lucide-react';
import type { Player, UserRole } from '../../types';
import type { RoleAssignments } from '../../hooks/useTeamDashboard';

interface RoleAssignmentsViewProps {
  roleAssignments: RoleAssignments;
  setRoleAssignments: React.Dispatch<React.SetStateAction<RoleAssignments>>;
  roster: Player[];
  currentRole: UserRole;
  showToast: (msg: string) => void;
}

export const RoleAssignmentsView: React.FC<RoleAssignmentsViewProps> = ({
  roleAssignments,
  setRoleAssignments,
  roster,
  currentRole,
  showToast,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-5 md:p-6 space-y-5 shadow-lg">
        <div>
          <h2 className="text-sm md:text-base font-semibold tracking-wide text-gray-100 flex items-center gap-2">
            In-Match Role Assignments
          </h2>
          <p className="text-xs md:text-sm font-normal leading-relaxed text-gray-300 mt-1">
            Designate match leaders, set-piece specialists, and penalty takers for official fixtures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Team Captain (On Pitch)</span>
            </label>
            <select
              value={roleAssignments.captainId}
              onChange={e => {
                setRoleAssignments(prev => ({ ...prev, captainId: e.target.value }));
                showToast('Updated Team Captain assignment');
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
            >
              {roster.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position} - {p.rating} OVR)
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Penalty Taker</span>
            </label>
            <select
              value={roleAssignments.penaltyTakerId}
              onChange={e => {
                setRoleAssignments(prev => ({ ...prev, penaltyTakerId: e.target.value }));
                showToast('Updated Penalty Taker assignment');
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
            >
              {roster.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} (Shooting: {p.shooting})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Free Kick Specialist</span>
            </label>
            <select
              value={roleAssignments.freeKickTakerId}
              onChange={e => {
                setRoleAssignments(prev => ({ ...prev, freeKickTakerId: e.target.value }));
                showToast('Updated Free Kick Specialist');
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
            >
              {roster.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} (Passing: {p.passing})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Left Corner Kick Taker</span>
            </label>
            <select
              value={roleAssignments.leftCornerTakerId}
              onChange={e => {
                setRoleAssignments(prev => ({ ...prev, leftCornerTakerId: e.target.value }));
                showToast('Updated Left Corner Taker');
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
            >
              {roster.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div>
            <h3 className="text-sm md:text-base font-semibold tracking-wide text-gray-100">
              Active Authority Rights
            </h3>
            <p className="text-[11px] md:text-xs font-medium text-gray-400">
              Current user permissions ({currentRole})
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
            {currentRole} ROLE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm text-gray-300">
          <div className="flex items-center gap-2 p-3 bg-[#111111] rounded-lg border border-[#2A2A2A]">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Modify Starting XI Formations</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-[#111111] rounded-lg border border-[#2A2A2A]">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Execute Match Substitutions</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-[#111111] rounded-lg border border-[#2A2A2A]">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Assign Corner & Penalty Takers</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-[#111111] rounded-lg border border-[#2A2A2A]">
            {currentRole === 'COACH' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <X className="w-4 h-4 text-rose-400" />
            )}
            <span>Add/Drop Roster Athletes ({currentRole === 'COACH' ? 'Unlocked' : 'Coach Only'})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
