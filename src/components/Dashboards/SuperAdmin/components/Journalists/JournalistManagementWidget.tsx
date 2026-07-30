import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import type { Journalist } from '../../types';
import { useConfirmation } from '../../../../../contexts/ConfirmationContext';

interface JournalistManagementWidgetProps {
  journalists: Journalist[];
  disputedJournalistsCount: number;
  toggleDispute: (journalistId: string) => void;
}

export const JournalistManagementWidget: React.FC<JournalistManagementWidgetProps> = ({
  journalists,
  disputedJournalistsCount,
  toggleDispute,
}) => {
  const { confirm } = useConfirmation();

  const handleDisputeClick = (j: Journalist) => {
    const isDisputing = !j.isDisputed;
    confirm({
      title: isDisputing ? `Dispute ${j.name}'s Article Credentials` : `Restore ${j.name}'s Article Credentials`,
      message: isDisputing
        ? `Are you sure you want to flag ${j.name}'s articles under Presidential Dispute? This action notifies the FA Council.`
        : `Are you sure you want to resolve the dispute and restore full publishing privileges to ${j.name}?`,
      confirmText: isDisputing ? 'Flag as Disputed' : 'Restore Privileges',
      variant: isDisputing ? 'danger' : 'primary',
      onConfirm: () => toggleDispute(j.id),
    });
  };

  return (
    <div className="bg-[#181818] border border-gray-800 rounded-xl p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Journalist Oversight & Presidential Dispute Toggle
            </h3>
            {disputedJournalistsCount > 0 && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                ⚠️ {disputedJournalistsCount} Article Disputed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Monitors article engagement, anonymous tip volume, and enables FA President override controls.
          </p>
        </div>
      </div>

      {/* Journalists Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800 font-mono">
            <tr>
              <th className="px-4 py-3">Verified Journalist</th>
              <th className="px-4 py-3">Faculty / Role</th>
              <th className="px-4 py-3 text-center">Articles</th>
              <th className="px-4 py-3 text-center">Total Engagement</th>
              <th className="px-4 py-3 text-center">Anon Tips</th>
              <th className="px-4 py-3">Latest Article Snippet</th>
              <th className="px-4 py-3 text-right">Presidential Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 bg-[#141414]">
            {journalists.map((j) => (
              <tr
                key={j.id}
                className={`hover:bg-gray-800/30 transition-colors ${
                  j.isDisputed ? 'bg-rose-950/20 border-l-2 border-l-rose-500' : ''
                }`}
              >
                <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {j.name.charAt(0)}
                  </div>
                  <div>
                    <div>{j.name}</div>
                    <span className="text-[9px] text-emerald-400 font-mono">✓ Verified</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  <div>{j.role}</div>
                  <div className="text-[10px] text-gray-400">{j.faculty}</div>
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold text-gray-200">
                  {j.articlesCount}
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold text-emerald-400">
                  {j.totalEngagement.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold text-blue-400">
                  {j.anonymousTipsVolume}
                </td>
                <td className="px-4 py-3 text-gray-300 max-w-xs truncate" title={j.lastArticleTitle}>
                  {j.lastArticleTitle}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDisputeClick(j)}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none min-h-[36px] ${
                      j.isDisputed
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                        : 'bg-gray-800 hover:bg-rose-900/50 border border-gray-700 hover:border-rose-500/50 text-gray-300 hover:text-rose-300'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {j.isDisputed ? '⚠️ Disputed (Click to Restore)' : '⚠️ Dispute Article'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
