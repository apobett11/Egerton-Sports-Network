import React from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { AuditLogRecord } from '../../types';

interface AdminAuditLogsViewProps {
  auditLogs: AuditLogRecord[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  roleFilter: string;
  setRoleFilter: (r: string) => void;
  actionFilter: string;
  setActionFilter: (a: string) => void;
  onExportCSV: () => void;
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({
  auditLogs,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  actionFilter,
  setActionFilter,
  onExportCSV,
}) => {
  const roles = ['ALL', 'admin', 'president', 'coach', 'captain', 'referee', 'journalist', 'player', 'system'];
  const actions = ['ALL', 'SUSPEND', 'ACTIVATE', 'PASSWORD', 'ANNOUNCEMENT', 'SQUAD', 'REPORT', 'ARTICLE', 'FIXTURE'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Irrevocable System Audit Trail
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Read-only, immutable security log recording every critical platform action.
          </p>
        </div>

        <button
          onClick={onExportCSV}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search action, user, or record..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Role */}
        <div className="relative">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 uppercase font-semibold"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                Filter Role: {r}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Action */}
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 uppercase font-semibold"
          >
            {actions.map((a) => (
              <option key={a} value={a}>
                Action: {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase font-mono">
            Showing {auditLogs.length} Recorded Entries
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            Read-Only Audit Ledger
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
          <table className="w-full text-left font-sans">
            <thead className="bg-[#111111] text-gray-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Executed Action</th>
                <th className="p-3">Affected Record</th>
                <th className="p-3">IP Address</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-gray-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1F1F1F]">
                    <td className="p-3 font-mono text-xs text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3 font-semibold text-white">{log.userName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#222222] border border-[#333333] rounded text-[10px] font-bold uppercase text-emerald-400">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-emerald-300 font-bold">{log.action}</td>
                    <td className="p-3 text-gray-300 text-xs truncate max-w-[200px]">{log.affectedRecord}</td>
                    <td className="p-3 font-mono text-xs text-gray-400">{log.ipAddress}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
