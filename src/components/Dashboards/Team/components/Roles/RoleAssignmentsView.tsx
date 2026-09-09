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
    <div className="w-full max-w-3xl bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-2xl overflow-hidden select-none">
      {/* Header Banner */}
      <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#ff0046]" />
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Tactical Set-Piece & Match Leaders
            </h2>
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
            className="px-4 py-1.5 bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-black rounded-full transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Roles</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Role Selectors */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto">
        {/* Captain */}
        <div className="bg-[#f8f9fa] dark:bg-[#112236] p-3 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45] space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#00b04f]" />
            <span>Team Captain</span>
          </label>
          <select
            value={roleAssignments.captainId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, captainId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
          >
            {roster.map(p => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} ({p.position} - {p.rating} OVR)
              </option>
            ))}
          </select>
        </div>

        {/* Vice Captain */}
        <div className="bg-[#f8f9fa] dark:bg-[#112236] p-3 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45] space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Vice Captain</span>
          </label>
          <select
            value={roleAssignments.viceCaptainId || ''}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, viceCaptainId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
          >
            {roster.map(p => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} ({p.position} - {p.rating} OVR)
              </option>
            ))}
          </select>
        </div>

        {/* Penalty Taker */}
        <div className="bg-[#f8f9fa] dark:bg-[#112236] p-3 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45] space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Penalty Taker</span>
          </label>
          <select
            value={roleAssignments.penaltyTakerId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, penaltyTakerId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
          >
            {roster.map(p => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} (Shooting: {p.shooting})
              </option>
            ))}
          </select>
        </div>

        {/* Free Kick Specialist */}
        <div className="bg-[#f8f9fa] dark:bg-[#112236] p-3 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45] space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#ff0046]" />
            <span>Free Kick Specialist</span>
          </label>
          <select
            value={roleAssignments.freeKickTakerId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, freeKickTakerId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
          >
            {roster.map(p => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} (Passing: {p.passing})
              </option>
            ))}
          </select>
        </div>

        {/* Left Corner Taker */}
        <div className="bg-[#f8f9fa] dark:bg-[#112236] p-3 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45] space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            <span>Left Corner Kick Taker</span>
          </label>
          <select
            value={roleAssignments.leftCornerTakerId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, leftCornerTakerId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
          >
            {roster.map(p => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name} ({p.position})
              </option>
            ))}
          </select>
        </div>

        {/* Right Corner Taker */}
        <div className="bg-[#f8f9fa] dark:bg-[#112236] p-3 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45] space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            <span>Right Corner Kick Taker</span>
          </label>
          <select
            value={roleAssignments.rightCornerTakerId}
            onChange={e => {
              setRoleAssignments(prev => ({ ...prev, rightCornerTakerId: e.target.value }));
            }}
            className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer"
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
      <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        {content}
      </div>
    );
  }

  return content;
};

export default RoleAssignmentsView;
