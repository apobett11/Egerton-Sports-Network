import React from 'react';
import { UserCheck, Award, Zap, Activity, ShieldCheck, Check, X } from 'lucide-react';
import type { Player, UserRole } from '../../types';
import type { RoleAssignments } from '../../hooks/useTeamDashboard';

interface RoleAssignmentsViewProps {
  roleAssignments: RoleAssignments;
  setRoleAssignments: React.Dispatch<React.SetStateAction<RoleAssignments>>;
  roster: Player[];
  currentRole: UserRole;
  showToast: (msg: string) => void;
  onSaveRoles?: () => void;
  onClose?: () => void;
}

export const RoleAssignmentsView: React.FC<RoleAssignmentsViewProps> = ({
  roleAssignments,
  setRoleAssignments,
  roster,
  currentRole,
  showToast,
  onSaveRoles,
  onClose,
}) => {
  const isCaptain = currentRole === 'CAPTAIN';

  const content = (
    <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-5 md:p-6 space-y-5 shadow-2xl max-w-4xl w-full mx-auto">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
        <div>
          <h2 className="text-sm md:text-base font-bold tracking-wide text-gray-100 flex items-center gap-2 uppercase">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>In-Match Tactical Roles</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isCaptain
              ? 'Captain Control: Designate match leaders, set-piece takers, and corner kickers.'
              : 'Coach View: In-match tactical role designations (Read-Only).'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCaptain && (
            <button
              onClick={() => {
                if (onSaveRoles) onSaveRoles();
                else showToast('Saved Roles successfully');
                if (onClose) onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>Save Roles</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2A2A2A] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Captain */}
        <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
          <label className="text-xs md:text-sm font-semibold text-gray-200 block mb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Team Captain</span>
          </label>
          <select
            disabled={!isCaptain}
            value={roleAssignments.captainId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, captainId: e.target.value }));
            }}
            className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {roster.map(p => (
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
            disabled={!isCaptain}
            value={roleAssignments.viceCaptainId || ''}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, viceCaptainId: e.target.value }));
            }}
            className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {roster.map(p => (
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
            disabled={!isCaptain}
            value={roleAssignments.penaltyTakerId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, penaltyTakerId: e.target.value }));
            }}
            className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {roster.map(p => (
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
            disabled={!isCaptain}
            value={roleAssignments.freeKickTakerId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, freeKickTakerId: e.target.value }));
            }}
            className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {roster.map(p => (
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
            disabled={!isCaptain}
            value={roleAssignments.leftCornerTakerId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, leftCornerTakerId: e.target.value }));
            }}
            className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {roster.map(p => (
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
            disabled={!isCaptain}
            value={roleAssignments.rightCornerTakerId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, rightCornerTakerId: e.target.value }));
            }}
            className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
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
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
};

export default RoleAssignmentsView;
