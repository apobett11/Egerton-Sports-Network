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
  currentRole: _currentRole,
  showToast,
  onSaveRoles,
  onClose,
}) => {
  const content = (
    <div className="w-full max-w-3xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-2xl overflow-hidden select-none relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00b04f] via-blue-500 to-[#ff0046]" />

      {/* Minimalist Header */}
      <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#14263b] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0b1623]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#00b04f] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
              Tactical Set-Piece & Match Leaders
            </h2>
            <p className="text-[11px] text-slate-400">
              Assign on-pitch designated duties and dead-ball specialists
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onSaveRoles) onSaveRoles();
              else showToast('Saved Roles successfully');
              if (onClose) onClose();
            }}
            className="px-4 py-2 bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Roles</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Minimalist Role Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
        {/* Team Captain */}
        <div className="bg-slate-50/60 dark:bg-[#112236]/60 p-4 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-[#00b04f] flex items-center justify-center">
              <UserCheck className="w-3 h-3" />
            </div>
            <span>Team Captain</span>
          </label>
          <select
            value={roleAssignments.captainId}
            onChange={(e) => {
              setRoleAssignments((prev) => ({ ...prev, captainId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
          >
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} ({p.position} - {p.rating} OVR)
              </option>
            ))}
          </select>
        </div>

        {/* Vice Captain */}
        <div className="bg-slate-50/60 dark:bg-[#112236]/60 p-4 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <UserCheck className="w-3 h-3" />
            </div>
            <span>Vice Captain</span>
          </label>
          <select
            value={roleAssignments.viceCaptainId || ''}
            onChange={(e) => {
              setRoleAssignments((prev) => ({ ...prev, viceCaptainId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
          >
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} ({p.position} - {p.rating} OVR)
              </option>
            ))}
          </select>
        </div>

        {/* Penalty Taker */}
        <div className="bg-slate-50/60 dark:bg-[#112236]/60 p-4 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Award className="w-3 h-3" />
            </div>
            <span>Penalty Taker</span>
          </label>
          <select
            value={roleAssignments.penaltyTakerId}
            onChange={(e) => {
              setRoleAssignments((prev) => ({ ...prev, penaltyTakerId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
          >
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} (Shooting: {p.shooting})
              </option>
            ))}
          </select>
        </div>

        {/* Free Kick Specialist */}
        <div className="bg-slate-50/60 dark:bg-[#112236]/60 p-4 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#ff0046]/15 text-[#ff0046] flex items-center justify-center">
              <Zap className="w-3 h-3" />
            </div>
            <span>Free Kick Specialist</span>
          </label>
          <select
            value={roleAssignments.freeKickTakerId}
            onChange={(e) => {
              setRoleAssignments((prev) => ({ ...prev, freeKickTakerId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
          >
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} (Passing: {p.passing})
              </option>
            ))}
          </select>
        </div>

        {/* Left Corner Taker */}
        <div className="bg-slate-50/60 dark:bg-[#112236]/60 p-4 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <Activity className="w-3 h-3" />
            </div>
            <span>Left Corner Kick Taker</span>
          </label>
          <select
            value={roleAssignments.leftCornerTakerId}
            onChange={(e) => {
              setRoleAssignments((prev) => ({ ...prev, leftCornerTakerId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
          >
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} ({p.position})
              </option>
            ))}
          </select>
        </div>

        {/* Right Corner Taker */}
        <div className="bg-slate-50/60 dark:bg-[#112236]/60 p-4 rounded-xl border border-slate-200/80 dark:border-[#1a2e45] space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <Activity className="w-3 h-3" />
            </div>
            <span>Right Corner Kick Taker</span>
          </label>
          <select
            value={roleAssignments.rightCornerTakerId}
            onChange={(e) => {
              setRoleAssignments((prev) => ({ ...prev, rightCornerTakerId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#ff0046] focus:ring-1 focus:ring-[#ff0046] cursor-pointer transition-all"
          >
            {roster.map((p) => (
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
      <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        {content}
      </div>
    );
  }

  return content;
};

export default RoleAssignmentsView;
