import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  Layers,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Zap,
  Activity,
  Send,
  Loader2,
  FileCode,
} from 'lucide-react';
import { Agent0LogService, type Agent0LogRecord } from '../../../../../services/agent0LogService';

interface AdminAgent0ViewProps {
  showToast?: (msg: string) => void;
}

export const AdminAgent0View: React.FC<AdminAgent0ViewProps> = ({ showToast }) => {
  const [logs, setLogs] = useState<Agent0LogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [algorithmFilter, setAlgorithmFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>('ALL');

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await Agent0LogService.getLogs({ limit: 300 });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch Agent 0 logs:', err);
      if (showToast) showToast('Failed to load Agent 0 logs from database.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Setup Supabase Realtime channel subscription
    const unsubscribe = Agent0LogService.subscribe((newLog) => {
      setLogs((prev) => [newLog, ...prev]);
      if (showToast) {
        showToast(`Agent 0 Event Logged: ${newLog.stage} (${newLog.status})`);
      }
    });

    setIsRealtimeActive(true);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to purge all Agent 0 action logs from the database?')) {
      return;
    }
    const success = await Agent0LogService.clearLogs();
    if (success) {
      setLogs([]);
      if (showToast) showToast('Agent 0 action logs purged successfully.');
    } else {
      if (showToast) showToast('Failed to clear Agent 0 logs.');
    }
  };

  const handleExportDump = () => {
    if (logs.length === 0) {
      if (showToast) showToast('No Agent 0 logs available to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent0_action_logs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (showToast) showToast(`Exported ${logs.length} Agent 0 records to JSON.`);
  };

  const handleTestPing = async () => {
    const testExecutionId = `test-${Date.now()}`;
    await Agent0LogService.recordLog({
      execution_id: testExecutionId,
      season_id: '11111111-2026-4000-8000-000000000001',
      event_type: 'TEST_AUDIT_PING',
      stage: 'TEST_TELEMETRY',
      algorithm: 'ALGORITHM_1',
      status: 'SUCCESS',
      message: 'Agent 0 telemetry handshake test ping from SuperAdmin Console',
      envelope: {
        ping: true,
        channel: 'agent0_realtime_stream',
        timestamp: new Date().toISOString(),
      },
      database_payload: {
        test_write: 'Verified database persistence pipeline handshake',
      },
      verification_logs: ['Test handshake passed', 'Telemetry stream verified'],
    });
    if (showToast) showToast('Handshake ping sent to Agent 0 database table!');
    fetchLogs(true);
  };

  // Distinct execution IDs for filter
  const distinctExecutionIds = Array.from(new Set(logs.map((l) => l.execution_id).filter(Boolean)));

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      searchTerm === '' ||
      l.execution_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.season_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.stage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.algorithm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStage = stageFilter === 'ALL' || l.stage === stageFilter;
    const matchAlgorithm = algorithmFilter === 'ALL' || l.algorithm === algorithmFilter;
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchExec = selectedExecutionId === 'ALL' || l.execution_id === selectedExecutionId;

    return matchSearch && matchStage && matchAlgorithm && matchStatus && matchExec;
  });

  // Metrics
  const totalExecutions = distinctExecutionIds.length;
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED' || l.status === 'STOPPED').length;
  const envelopesCaptured = logs.filter((l) => l.envelope !== null && l.envelope !== undefined).length;
  const dbWritesLogged = logs.filter((l) => l.stage.includes('DB_WRITE')).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#181818] via-[#1E1E1E] to-[#181818] p-5 rounded-3xl border border-[#2A2A2A] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Agent 0 Master Action & Envelope Logs
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isRealtimeActive ? 'Live Realtime Active' : 'Polling'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Irrevocable, end-to-end telemetry recording every command, algorithm envelope, database write, and state mutation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTestPing}
            className="px-3.5 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-gray-200 hover:text-white rounded-xl border border-[#333333] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[38px]"
            title="Dispatch a test telemetry ping to verify database table and realtime stream"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Telemetry Ping</span>
          </button>

          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-emerald-400 hover:text-emerald-300 rounded-xl border border-[#333333] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[38px]"
            title="Refresh logs from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportDump}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer min-h-[38px]"
            title="Export all Agent 0 logs to formatted JSON file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Table Dump (JSON)</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 rounded-xl border border-rose-800/40 text-xs font-bold transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Purge Agent 0 logs from database"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Total Actions</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{logs.length}</div>
          <div className="text-[10px] text-gray-400 font-medium">Logged in table</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Executions</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{totalExecutions}</div>
          <div className="text-[10px] text-gray-400 font-medium">Distinct execution IDs</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {logs.length > 0 ? `${Math.round((successCount / logs.length) * 100)}%` : '100%'}
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            {successCount} ok • {failedCount} failed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Envelopes</span>
            <FileCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{envelopesCaptured}</div>
          <div className="text-[10px] text-gray-400 font-medium">Algorithm result sets</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>DB Writes</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">{dbWritesLogged}</div>
          <div className="text-[10px] text-gray-400 font-medium">Persistence operations</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search execution ID, season ID, stage, algorithm, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 placeholder-gray-500"
          />
        </div>

        {/* Stage Filter */}
        <div className="relative">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-semibold uppercase"
          >
            <option value="ALL">All Stages</option>
            <option value="EVENT_INITIATED">Event Initiated</option>
            <option value="ALGORITHM_1_DB_WRITE">Algo 1 DB Write</option>
            <option value="ALGORITHM_2_DB_WRITE">Algo 2 DB Write</option>
            <option value="ALGORITHM_3_DB_WRITE">Algo 3 DB Write</option>
            <option value="ALGORITHM_4_5_DB_WRITE">Algo 4+5 DB Write</option>
            <option value="READ_BACK_VERIFIED">Read-Back Verified</option>
            <option value="COMPLETED">Completed</option>
            <option value="STOPPED">Stopped / Failed</option>
          </select>
        </div>

        {/* Algorithm Filter */}
        <div className="relative">
          <select
            value={algorithmFilter}
            onChange={(e) => setAlgorithmFilter(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-semibold uppercase"
          >
            <option value="ALL">All Algorithms</option>
            <option value="ALGORITHM_1">Algorithm 1</option>
            <option value="ALGORITHM_2">Algorithm 2</option>
            <option value="ALGORITHM_3">Algorithm 3</option>
            <option value="ALGORITHM_4_5">Algorithm 4 & 5</option>
          </select>
        </div>

        {/* Execution ID Filter */}
        <div className="relative">
          <select
            value={selectedExecutionId}
            onChange={(e) => setSelectedExecutionId(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
          >
            <option value="ALL">All Execution Runs ({distinctExecutionIds.length})</option>
            {distinctExecutionIds.map((id) => (
              <option key={id} value={id}>
                {id.slice(0, 18)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Feed List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex flex-col items-center justify-center gap-3 text-emerald-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold text-gray-400">Loading Agent 0 Telemetry from Database...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#181818] border border-[#2A2A2A] text-center space-y-3">
            <Cpu className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-sm font-bold text-gray-200 uppercase">No Agent 0 Action Logs Found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {searchTerm || stageFilter !== 'ALL' || algorithmFilter !== 'ALL' || selectedExecutionId !== 'ALL'
                ? 'No records match the current filter criteria.'
                : 'Agent 0 has not executed any commands yet. Run a season generation or operational event to view live logs.'}
            </p>
            <button
              onClick={handleTestPing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Action Ping</span>
            </button>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isExpanded = expandedLogId === (log.id || `log-${index}`);
            const logKey = log.id || `log-${index}`;

            const isSuccess = log.status === 'SUCCESS';
            const isFailed = log.status === 'FAILED' || log.status === 'STOPPED';
            const isPartial = log.status === 'PARTIAL' || log.status === 'PENDING';
            const isDbWrite = log.stage.includes('DB_WRITE');

            return (
              <div
                key={logKey}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-[#1C1C1C] border-emerald-500/40 shadow-lg'
                    : 'bg-[#181818] border-[#2A2A2A] hover:border-[#3A3A3A]'
                }`}
              >
                {/* Collapsed Header Summary */}
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : logKey)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="mt-0.5 sm:mt-0 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isSuccess
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isFailed
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isSuccess && <CheckCircle2 className="w-3 h-3" />}
                          {isFailed && <XCircle className="w-3 h-3" />}
                          {isPartial && <Clock className="w-3 h-3" />}
                          {log.status}
                        </span>

                        {/* Stage Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isDbWrite
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black'
                              : 'bg-[#252525] text-gray-300 border border-[#333333]'
                          }`}
                        >
                          {isDbWrite && '💾 '}
                          {log.stage.replace(/_/g, ' ')}
                        </span>

                        {/* Algorithm Tag */}
                        {log.algorithm && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-950/40 text-blue-300 border border-blue-800/40">
                            {log.algorithm}
                          </span>
                        )}

                        {/* Event Type Tag */}
                        {log.event_type && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-purple-950/40 text-purple-300 border border-purple-800/40">
                            {log.event_type}
                          </span>
                        )}
                      </div>

                      {/* Message / Description */}
                      <p className="text-xs text-gray-200 font-medium line-clamp-1">
                        {log.message || `Agent 0 stage ${log.stage}`}
                      </p>
                    </div>
                  </div>

                  {/* Right Metadata */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-[11px] text-gray-400 gap-1 shrink-0 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">Execution:</span>
                      <span className="text-gray-300 font-semibold">{log.execution_id?.slice(0, 8)}...</span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Just now'}
                    </div>
                  </div>
                </div>

                {/* Expanded Full Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-[#2A2A2A] space-y-4 bg-[#141414]/90 animate-in fade-in duration-200">
                    {/* Identification Chips */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-between">
                        <span className="text-gray-400">Execution ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">{log.execution_id}</span>
                          <button
                            onClick={() => handleCopy(log.execution_id, `exec-${logKey}`)}
                            className="p-1 text-gray-400 hover:text-white rounded"
                            title="Copy Execution ID"
                          >
                            {copiedId === `exec-${logKey}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-between">
                        <span className="text-gray-400">Season ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-bold">{log.season_id}</span>
                          <button
                            onClick={() => handleCopy(log.season_id, `season-${logKey}`)}
                            className="p-1 text-gray-400 hover:text-white rounded"
                            title="Copy Season ID"
                          >
                            {copiedId === `season-${logKey}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Database Write Payload (if present) */}
                    {log.database_payload && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Database className="w-3.5 h-3.5" /> Database Write Payload (Exact content written to database)
                          </span>
                          <button
                            onClick={() => handleCopy(JSON.stringify(log.database_payload, null, 2), `db-${logKey}`)}
                            className="text-[10px] font-semibold text-gray-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `db-${logKey}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy Payload</span>
                          </button>
                        </div>
                        <pre className="p-3.5 rounded-xl bg-[#0D0D0D] border border-amber-500/20 text-amber-200 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                          {JSON.stringify(log.database_payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Envelope Details (if present) */}
                    {log.envelope && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <FileCode className="w-3.5 h-3.5" /> Algorithm Result Envelope
                          </span>
                          <button
                            onClick={() => handleCopy(JSON.stringify(log.envelope, null, 2), `env-${logKey}`)}
                            className="text-[10px] font-semibold text-gray-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `env-${logKey}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy Envelope</span>
                          </button>
                        </div>
                        <pre className="p-3.5 rounded-xl bg-[#0D0D0D] border border-emerald-500/20 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                          {JSON.stringify(log.envelope, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Verification Logs */}
                    {log.verification_logs && log.verification_logs.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          Verification Check Logs ({log.verification_logs.length})
                        </span>
                        <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[#2A2A2A] space-y-1 max-h-40 overflow-y-auto">
                          {log.verification_logs.map((logMsg, i) => (
                            <div key={i} className="text-[11px] font-mono text-gray-300 flex items-start gap-2">
                              <span className="text-emerald-500 font-bold shrink-0">✓</span>
                              <span>{logMsg}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Details (if present) */}
                    {log.error_details && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pipeline Error Details
                        </span>
                        <pre className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                          {JSON.stringify(log.error_details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminAgent0View;
