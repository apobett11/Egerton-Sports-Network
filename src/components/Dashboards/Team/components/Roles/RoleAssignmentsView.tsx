import React from 'react';
import { UserCheck, Award, Zap, Activity, ShieldCheck, Check } from 'lucide-react';
import type { Player, UserRole, RoleAssignments } from '../../types';

interface RoleAssignmentsViewProps {
  roleAssignments: RoleAssignments;
  setRoleAssignments: React.Dispatch<React.SetStateAction<RoleAssignments>>;
  roster: Player[];
  currentRole: UserRole;
  showToast: (msg: string) => void;
  onSaveRoles?: () => void;
}

export const RoleAssignmentsView: React.FC<RoleAssignmentsViewProps> = ({
  roleAssignments,
  setRoleAssignments,
  roster,
  currentRole,
  showToast,
  onSaveRoles,
}) => {
  const isCoach = currentRole === 'COACH';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-5 md:p-6 space-y-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2A] pb-4">
          <div>
            <h2 className="text-sm md:text-base font-bold tracking-wide text-gray-100 flex items-center gap-2 uppercase">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>In-Match Tactical Roles</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Designate match leaders, vice captains, set-piece specialists, and corner takers.
            </p>
          </div>

          {isCoach && (
            <button
              onClick={() => {
                if (onSaveRoles) onSaveRoles();
                else showToast('Saved Roles successfully');
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>Save Roles</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Captain */}
          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Team Captain</span>
            </label>
            <select
              disabled={!isCoach}
              value={roleAssignments.captainId}
              onChange={e => {
                setRoleAssignments((prev: RoleAssignments) => ({ ...prev, captainId: e.target.value }));
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {roster.map((p: Player) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position} - {p.rating} OVR)
                </option>
              ))}
            </select>
          </div>

          {/* Vice Captain */}
          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Vice Captain</span>
            </label>
            <select
              disabled={!isCoach}
              value={roleAssignments.viceCaptainId || ''}
              onChange={e => {
                setRoleAssignments((prev: RoleAssignments) => ({ ...prev, viceCaptainId: e.target.value }));
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {roster.map((p: Player) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position} - {p.rating} OVR)
                </option>
              ))}
            </select>
          </div>

          {/* Penalty Taker */}
          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Penalty Taker</span>
            </label>
            <select
              disabled={!isCoach}
              value={roleAssignments.penaltyTakerId}
              onChange={e => {
                setRoleAssignments((prev: RoleAssignments) => ({ ...prev, penaltyTakerId: e.target.value }));
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {roster.map((p: Player) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} (Shooting: {p.shooting})
                </option>
              ))}
            </select>
          </div>

          {/* Free Kick Specialist */}
          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Free Kick Specialist</span>
            </label>
            <select
              disabled={!isCoach}
              value={roleAssignments.freeKickTakerId}
              onChange={e => {
                setRoleAssignments((prev: RoleAssignments) => ({ ...prev, freeKickTakerId: e.target.value }));
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {roster.map((p: Player) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} (Passing: {p.passing})
                </option>
              ))}
            </select>
          </div>

          {/* Left Corner Taker */}
          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Left Corner Kick Taker</span>
            </label>
            <select
              disabled={!isCoach}
              value={roleAssignments.leftCornerTakerId}
              onChange={e => {
                setRoleAssignments((prev: RoleAssignments) => ({ ...prev, leftCornerTakerId: e.target.value }));
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {roster.map((p: Player) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position})
                </option>
              ))}
            </select>
          </div>

          {/* Right Corner Taker */}
          <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
            <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Right Corner Kick Taker</span>
            </label>
            <select
              disabled={!isCoach}
              value={roleAssignments.rightCornerTakerId}
              onChange={e => {
                setRoleAssignments((prev: RoleAssignments) => ({ ...prev, rightCornerTakerId: e.target.value }));
              }}
              className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {roster.map((p: Player) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignmentsView;
