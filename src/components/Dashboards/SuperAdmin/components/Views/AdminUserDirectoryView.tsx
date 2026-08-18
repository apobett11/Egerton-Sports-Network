import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  KeyRound,
  FileText,
  Eye,
  Shield,
} from 'lucide-react';
import type { UserProfileRow, AdminTabType } from '../../types';

interface AdminUserDirectoryViewProps {
  users: UserProfileRow[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  roleFilter: string;
  setRoleFilter: (r: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  onOpenUserModal: (user: UserProfileRow) => void;
  onSuspendUser: (id: string) => void;
  onActivateUser: (id: string) => void;
  onChangeUserRole?: (id: string, newRole: string) => void;
  onResetPassword: (email: string) => void;
  setActiveTab: (tab: AdminTabType) => void;
  setAuditSearchTerm: (s: string) => void;
}

export const AdminUserDirectoryView: React.FC<AdminUserDirectoryViewProps> = ({
  users,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onOpenUserModal,
  onSuspendUser,
  onActivateUser,
  onChangeUserRole,
  onResetPassword,
  setActiveTab,
  setAuditSearchTerm,
}) => {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  const roles = [
    'ALL',
    'journalist',
    'referee',
    'linesman',
    'coach',
    'captain',
    'president',
    'admin',
    'player',
    'doctor',
  ];

  const groupedRoles = ['journalist', 'referee', 'linesman', 'coach', 'captain', 'president', 'admin', 'player', 'doctor'];

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-rose-600/20 text-rose-400 border-rose-500/30';
      case 'president':
        return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      case 'coach':
        return 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30';
      case 'captain':
        return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30';
      case 'referee':
        return 'bg-amber-600/20 text-amber-400 border-amber-500/30';
      case 'linesman':
        return 'bg-lime-600/20 text-lime-400 border-lime-500/30';
      case 'doctor':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      case 'journalist':
        return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Consolidated Platform User Directory
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Single-page user management grouped across all operational roles.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 uppercase font-semibold"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                Role: {r}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 uppercase font-semibold"
          >
            <option value="ALL">Status: All Users</option>
            <option value="active">Status: Active Only</option>
            <option value="suspended">Status: Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Grouped Sections */}
      <div className="space-y-6">
        {groupedRoles.map((roleGroup) => {
          const roleUsers = users.filter((u) => u.role.toLowerCase() === roleGroup);
          if (roleUsers.length === 0 && roleFilter !== 'ALL' && roleFilter.toLowerCase() !== roleGroup) {
            return null;
          }

          return (
            <div key={roleGroup} className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase border ${getRoleBadgeStyle(roleGroup)}`}>
                    {roleGroup}s
                  </span>
                  <span className="text-xs text-gray-400 font-mono">({roleUsers.length} accounts)</span>
                </div>
              </div>

              {roleUsers.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No accounts matching current filter.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-[#111111] text-gray-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">User Profile</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Contact Email</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Team / Dept</th>
                        <th className="p-3">Last Login</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
                      {roleUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#1F1F1F]">
                          <td className="p-3 font-semibold text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getRoleBadgeStyle(u.role)}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-gray-300 font-mono text-xs">{u.email}</td>
                          <td className="p-3 text-gray-400 font-mono text-xs">{u.phone}</td>
                          <td className="p-3 font-semibold text-emerald-400">{u.teamName}</td>
                          <td className="p-3 text-gray-400 font-mono text-xs">{u.lastLogin}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.status === 'active'
                                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3 text-right relative">
                            <div className="inline-block text-left">
                              <button
                                onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMenuUserId === u.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-30 p-1 space-y-0.5 text-xs text-left">
                                  <button
                                    onClick={() => {
                                      setActiveMenuUserId(null);
                                      onOpenUserModal(u);
                                    }}
                                    className="w-full px-3 py-2 text-gray-200 hover:bg-[#252525] rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>View Details</span>
                                  </button>

                                  {u.status === 'active' ? (
                                    <button
                                      onClick={() => {
                                        setActiveMenuUserId(null);
                                        onSuspendUser(u.id);
                                      }}
                                      className="w-full px-3 py-2 text-rose-400 hover:bg-rose-950/30 rounded-lg flex items-center gap-2 cursor-pointer"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Revoke Access (Suspend)</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setActiveMenuUserId(null);
                                        onActivateUser(u.id);
                                      }}
                                      className="w-full px-3 py-2 text-emerald-400 hover:bg-emerald-950/30 rounded-lg flex items-center gap-2 cursor-pointer"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Restore Access</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setActiveMenuUserId(null);
                                      onResetPassword(u.email);
                                    }}
                                    className="w-full px-3 py-2 text-amber-400 hover:bg-amber-950/30 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    <span>Reset Password</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMenuUserId(null);
                                      setAuditSearchTerm(u.email);
                                      setActiveTab('audit_logs');
                                    }}
                                    className="w-full px-3 py-2 text-purple-400 hover:bg-purple-950/30 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>View Audit Logs</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
