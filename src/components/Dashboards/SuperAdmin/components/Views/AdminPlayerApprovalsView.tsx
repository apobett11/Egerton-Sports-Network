import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Shield,
  Pencil,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Globe,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { AdminPlayerRow } from '../../types';

interface AdminPlayerApprovalsViewProps {
  players: AdminPlayerRow[];
  onApprovePlayer: (playerId: string) => Promise<void> | void;
  onRejectPlayer: (playerId: string) => Promise<void> | void;
  onUpdatePlayerName?: (playerId: string, firstName: string, lastName: string) => Promise<boolean | void>;
  onRefresh: () => void;
  teams?: Array<{
    id: string;
    name: string;
    logoUrl?: string;
    playersCount?: number;
    league?: string;
  }>;
}

export const AdminPlayerApprovalsView: React.FC<AdminPlayerApprovalsViewProps> = ({
  players,
  onApprovePlayer,
  onRejectPlayer,
  onUpdatePlayerName,
  onRefresh,
  teams = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit player name modal state
  const [editingPlayer, setEditingPlayer] = useState<AdminPlayerRow | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Combine teams from prop and derived from players
  const availableTeams = useMemo(() => {
    const map = new Map<string, { id: string; name: string; logoUrl?: string; count: number }>();

    // Add teams passed from teamOverview
    teams.forEach((t) => {
      map.set(t.name, {
        id: t.id,
        name: t.name,
        logoUrl: t.logoUrl,
        count: 0,
      });
    });

    // Count and merge players
    players.forEach((p) => {
      const key = p.teamName || 'Unassigned';
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.logoUrl && p.teamLogo) existing.logoUrl = p.teamLogo;
      } else {
        map.set(key, {
          id: p.teamId || key,
          name: key,
          logoUrl: p.teamLogo,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, players]);

  // Keyboard shortcut to close edit modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingPlayer && !isSavingName) {
        setEditingPlayer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingPlayer, isSavingName]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.studentId && p.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(p.jerseyNumber).includes(searchTerm);

      const matchesTeam =
        teamFilter === 'ALL' ||
        p.teamName === teamFilter ||
        p.teamId === teamFilter;

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'PENDING'
          ? !p.isApproved
          : p.isApproved;

      return matchesSearch && matchesTeam && matchesStatus;
    });
  }, [players, searchTerm, teamFilter, statusFilter]);

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

  const openEditModal = (player: AdminPlayerRow) => {
    let fName = player.firstName || '';
    let lName = player.lastName || '';
    if (!fName && !lName && player.name) {
      const parts = player.name.trim().split(/\s+/);
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ');
    }
    setEditingPlayer(player);
    setEditFirstName(fName);
    setEditLastName(lName);
    setEditError(null);
  };

  const handleSavePlayerName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingPlayer || !onUpdatePlayerName) return;

    const trimmedFirst = editFirstName.trim();
    const trimmedLast = editLastName.trim();

    if (!trimmedFirst) {
      setEditError('First name is required.');
      return;
    }

    setIsSavingName(true);
    setEditError(null);
    try {
      await onUpdatePlayerName(editingPlayer.id, trimmedFirst, trimmedLast);
      setEditingPlayer(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update player name globally.');
    } finally {
      setIsSavingName(false);
    }
  };

  const pendingCount = players.filter((p) => !p.isApproved).length;
  const selectedTeamData = availableTeams.find(
    (t) => t.name === teamFilter || t.id === teamFilter
  );

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
                <span>Player Management & Squad Approvals</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {pendingCount} Pending Review
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                Select a team, view rosters, edit player names with global synchronization, and approve squads.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-[#202020] hover:bg-[#2A2A2A] text-gray-300 hover:text-white rounded-xl border border-[#333333] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Refresh Player Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Team Selection & Filter Bar */}
      <div className="bg-[#161616] p-4 rounded-2xl border border-[#2A2A2A] flex flex-col gap-3 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
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

          {/* Select Team Dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-[#111111] border border-[#2A2A2A] rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Team:</span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="bg-transparent text-xs text-gray-200 font-bold focus:outline-none cursor-pointer max-w-[200px]"
              >
                <option value="ALL" className="bg-[#181818] text-white">
                  All Teams ({availableTeams.length})
                </option>
                {availableTeams.map((team) => (
                  <option key={team.id || team.name} value={team.name} className="bg-[#181818] text-white">
                    {team.name} ({team.count} players)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Dropdown */}
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

        {/* Selected Team Active Badge & Summary */}
        {selectedTeamData && teamFilter !== 'ALL' && (
          <div className="flex items-center justify-between bg-[#1F1F1F] border border-[#333333] rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#282828] border border-[#3D3D3D] flex items-center justify-center shrink-0 overflow-hidden">
                {selectedTeamData.logoUrl ? (
                  <img src={selectedTeamData.logoUrl} alt={selectedTeamData.name} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div>
                <span className="text-xs font-black text-white">{selectedTeamData.name}</span>
                <span className="text-[11px] text-gray-400 ml-2">
                  Showing {filteredPlayers.length} of {selectedTeamData.count} players
                </span>
              </div>
            </div>

            <button
              onClick={() => setTeamFilter('ALL')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Show All Teams</span>
            </button>
          </div>
        )}
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
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-gray-600" />
                      <span>No registered players matching your team or search criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => {
                  const isProcessing = processingId === player.id;
                  return (
                    <tr key={player.id} className="hover:bg-[#1C1C1C] transition-colors">
                      {/* Player Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-white text-xs">{player.name}</div>
                        </div>
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
                          {/* EDIT NAME BUTTON */}
                          <button
                            type="button"
                            onClick={() => openEditModal(player)}
                            className="px-2.5 py-1 bg-[#222222] hover:bg-[#2C2C2C] text-emerald-400 hover:text-emerald-300 border border-[#333333] hover:border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title="Edit player name globally"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit Name</span>
                          </button>

                          {/* APPROVE BUTTON (IF PENDING) */}
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

                          {/* REMOVE BUTTON */}
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

      {/* EDIT PLAYER NAME MODAL */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#2E2E2E] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#1D1D1D] px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">Edit Player Name</h3>
                  <p className="text-[11px] text-gray-400">Global update across all teams and matches</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingName}
                onClick={() => setEditingPlayer(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#282828] transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePlayerName} className="p-5 space-y-4">
              {/* Player Team & Current Info */}
              <div className="bg-[#121212] border border-[#262626] rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center shrink-0 overflow-hidden">
                    {editingPlayer.teamLogo ? (
                      <img src={editingPlayer.teamLogo} alt={editingPlayer.teamName} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{editingPlayer.teamName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      Jersey #{editingPlayer.jerseyNumber} • {editingPlayer.position}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Current Name</div>
                  <div className="text-xs font-extrabold text-gray-300">{editingPlayer.name}</div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1.5 tracking-wider">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editFirstName}
                    onChange={(e) => {
                      setEditFirstName(e.target.value);
                      if (editError) setEditError(null);
                    }}
                    placeholder="e.g. Victor"
                    className="w-full bg-[#111111] border border-[#333333] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1.5 tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => {
                      setEditLastName(e.target.value);
                      if (editError) setEditError(null);
                    }}
                    placeholder="e.g. Wanyama"
                    className="w-full bg-[#111111] border border-[#333333] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Global Display Preview</div>
                    <div className="text-xs font-black text-white">
                      {editFirstName.trim() || editLastName.trim()
                        ? `${editFirstName.trim()} ${editLastName.trim()}`.trim()
                        : '—'}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  Global Sync
                </span>
              </div>

              {/* Information Notice */}
              <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  This change is saved directly to the database and will update globally across all match fixtures, line-ups, live commentary, player statistics, and public leaderboards.
                </p>
              </div>

              {/* Error Banner */}
              {editError && (
                <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-2.5 flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2A2A2A]">
                <button
                  type="button"
                  disabled={isSavingName}
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#2C2C2C] text-gray-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingName || !editFirstName.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-wide flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
                >
                  {isSavingName ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Globally...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
