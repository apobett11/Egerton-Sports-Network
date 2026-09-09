import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Users,
  Shield,
  Filter,
} from 'lucide-react';
import type { AdminPlayerRow } from '../../types';

interface AdminPlayerApprovalsViewProps {
  players: AdminPlayerRow[];
  onApprovePlayer: (playerId: string) => Promise<void> | void;
  onRejectPlayer: (playerId: string) => Promise<void> | void;
  onRefresh: () => void;
}

export const AdminPlayerApprovalsView: React.FC<AdminPlayerApprovalsViewProps> = ({
  players,
  onApprovePlayer,
  onRejectPlayer,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Derive unique team names for filter dropdown
  const teamNames = Array.from(new Set(players.map((p) => p.teamName).filter(Boolean)));

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.studentId && p.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(p.jerseyNumber).includes(searchTerm);

    const matchesTeam = teamFilter === 'ALL' || p.teamName === teamFilter;
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? !p.isApproved
        : p.isApproved;

    return matchesSearch && matchesTeam && matchesStatus;
  });

  const handleApprove = async (playerId: string) => {
    setProcessingId(playerId);
    try {
      await onApprovePlayer(playerId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (playerId: string) => {
    if (!window.confirm('Are you sure you want to remove this registered player?')) return;
    setProcessingId(playerId);
    try {
      await onRejectPlayer(playerId);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = players.filter((p) => !p.isApproved).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Player Squad Approvals & Registrations</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {pendingCount} Pending Review
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                Review and approve players registered through team-specific links and coach invitations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#161616] p-4 rounded-2xl border border-[#2A2A2A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by player name, student ID, jersey number or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="bg-[#111111] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-gray-200 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Teams ({teamNames.length})</option>
            {teamNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111111] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-gray-200 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved & Active</option>
          </select>
        </div>
      </div>

      {/* Players List Table */}
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A] text-gray-400 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Club / Team</th>
                <th className="py-3 px-4">Jersey & Position</th>
                <th className="py-3 px-4">Student ID / Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424]">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-bold">
                    No registered players matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const isProcessing = processingId === player.id;
                  return (
                    <tr key={player.id} className="hover:bg-[#1C1C1C] transition-colors">
                      {/* Player Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs">{player.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{player.email}</div>
                      </td>

                      {/* Club Team */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center shrink-0 overflow-hidden">
                            {player.teamLogo ? (
                              <img src={player.teamLogo} alt={player.teamName} className="w-full h-full object-cover" />
                            ) : (
                              <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                          <span className="font-semibold text-gray-200">{player.teamName}</span>
                        </div>
                      </td>

                      {/* Jersey & Position */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-[#252525] border border-[#333333] font-mono font-black text-gray-200 text-[10px]">
                            #{player.jerseyNumber}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black text-[9px] uppercase">
                            {player.position}
                          </span>
                        </div>
                      </td>

                      {/* Student ID & Phone */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="font-mono text-gray-300 font-semibold">{player.studentId || 'N/A'}</div>
                        <div className="text-gray-500">{player.phone || 'No phone'}</div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4">
                        {player.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!player.isApproved && (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleApprove(player.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                              title="Approve Player"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          <button
                            disabled={isProcessing}
                            onClick={() => handleReject(player.id)}
                            className="p-1.5 bg-[#252525] hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer border border-[#333333] hover:border-rose-800 disabled:opacity-50"
                            title="Remove Player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
