import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';
import type { SupabaseSlowQuery } from '../../types';
import { useConfirmation } from '../../../../../contexts/ConfirmationContext';

interface DatabaseHealthWidgetProps {
  queries: SupabaseSlowQuery[];
  flaggedQueriesCount: number;
  readLatency: number;
  writeLatency: number;
  applyIndexOptimization: (queryId: string) => void;
}

export const DatabaseHealthWidget: React.FC<DatabaseHealthWidgetProps> = ({
  queries,
  flaggedQueriesCount,
  readLatency,
  writeLatency,
  applyIndexOptimization,
}) => {
  const { confirm } = useConfirmation();

  const handleApplyIndex = (q: SupabaseSlowQuery) => {
    confirm({
      title: `Apply PostgreSQL Index on ${q.tableName}`,
      message: `Are you sure you want to execute index creation: "${q.recommendedIndex}"? This will optimize read queries under heavy concurrent traffic.`,
      confirmText: 'Execute SQL Index',
      variant: 'primary',
      onConfirm: () => applyIndexOptimization(q.id),
    });
  };

  return (
    <div className="bg-[#181818] border border-gray-800 rounded-xl p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Infrastructure Health & Supabase Index Advisor
            </h3>
            {flaggedQueriesCount > 0 ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ⚠️ {flaggedQueriesCount} Queries &gt; 50ms
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✓ All Queries Optimized
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Monitors database read/write latencies and automatically recommends PostgreSQL indexes before weekend traffic spikes.
          </p>
        </div>

        {/* Latency Gauges */}
        <div className="flex items-center gap-4 bg-gray-900/80 px-4 py-2 rounded-xl border border-gray-800">
          <div className="text-center">
            <div className="text-[10px] text-gray-400 font-semibold uppercase">DB Read Latency</div>
            <div className={`text-base font-mono font-bold ${readLatency > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {readLatency} ms
            </div>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-gray-400 font-semibold uppercase">DB Write Latency</div>
            <div className={`text-base font-mono font-bold ${writeLatency > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {writeLatency} ms
            </div>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-gray-400 font-semibold uppercase">Pool Connections</div>
            <div className="text-base font-mono font-bold text-blue-400">42 / 100</div>
          </div>
        </div>
      </div>

      {/* Slow Queries Table */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
          Active Database Query Analysis (`index_advisor` Flagged)
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-4 py-3">Table Name</th>
                <th className="px-4 py-3">PostgreSQL Query</th>
                <th className="px-4 py-3 text-center">Execution Time</th>
                <th className="px-4 py-3">Index Advisor Recommendation</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 bg-[#141414]">
              {queries.map((q) => {
                const isSlow = q.durationMs > 50 && !q.isOptimized;
                return (
                  <tr key={q.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-emerald-400">{q.tableName}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate" title={q.query}>
                      {q.query}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          q.isOptimized
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isSlow
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {q.durationMs} ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-sm truncate" title={q.recommendedIndex}>
                      <code className="text-[11px] text-amber-300/90">{q.recommendedIndex}</code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {q.isOptimized ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Optimized
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplyIndex(q)}
                          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none min-h-[32px]"
                        >
                          ⚡ Apply Index
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
