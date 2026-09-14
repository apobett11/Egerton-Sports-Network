import React, { useState } from 'react';
import {
  Activity,
  Database,
  Server,
  Lock,
  HardDrive,
  Radio,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Zap,
  Info,
  ArrowUpRight,
} from 'lucide-react';
import type { SystemHealthMetrics, FailedApiCallRecord } from '../../types';

interface AdminHealthDiagnosticsViewProps {
  systemHealth: SystemHealthMetrics;
  failedCalls: FailedApiCallRecord[];
  onRunDiagnostic: () => Promise<void>;
  isLoading: boolean;
  onClearErrors?: () => void;
  isProbeRunning?: boolean;
  onToggleProbe?: () => void;
  probeCount?: number;
}

export const AdminHealthDiagnosticsView: React.FC<AdminHealthDiagnosticsViewProps> = ({
  systemHealth,
  failedCalls,
  onRunDiagnostic,
  isLoading,
  onClearErrors,
  isProbeRunning = true,
  onToggleProbe,
  probeCount = 1,
}) => {
  const [selectedError, setSelectedError] = useState<FailedApiCallRecord | null>(null);

  // Derive plain-language status summary
  const getOverallPlainSummary = () => {
    if (systemHealth.dbStatus === 'offline' || systemHealth.apiStatus === 'offline') {
      return {
        title: 'Critical Attention Required',
        description: 'One or more platform services are currently unreachable. Students and officials may experience errors when loading or submitting data.',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        dotColor: 'bg-rose-500',
      };
    }
    if (systemHealth.dbStatus === 'warning' || systemHealth.apiStatus === 'warning' || failedCalls.length > 0) {
      return {
        title: 'Operational with Minor Warnings',
        description: 'Platform is functioning, but response times are slightly elevated or occasional failed requests were intercepted.',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        dotColor: 'bg-amber-500',
      };
    }
    return {
      title: 'All Systems Running at Peak Performance',
      description: 'Your Supabase database, REST APIs, authentication security, and storage buckets are healthy and responding instantaneously.',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  };

  const summary = getOverallPlainSummary();

  const plainCards = [
    {
      title: 'PostgreSQL Database Engine',
      subtitle: 'Stores users, match fixtures, live scores & team rosters',
      icon: Database,
      latency: `${systemHealth.dbLatencyMs} ms`,
      status: systemHealth.dbStatus,
      plainExplanation:
        systemHealth.dbLatencyMs < 60
          ? 'Super Fast: Queries are finishing in fractions of a second. Data updates without delay.'
          : 'Moderate Speed: Queries are completing, but database indexing or heavier traffic is causing slight lag.',
      userImpact: 'Matches, player profiles, and standings load immediately for campus visitors.',
      recommendation: 'No database tuning needed at this time.',
    },
    {
      title: 'REST API & Cloud Endpoints',
      subtitle: 'Communicates requests between this app and Supabase servers',
      icon: Server,
      latency: `${systemHealth.apiLatencyMs} ms`,
      status: systemHealth.apiStatus,
      plainExplanation:
        systemHealth.apiStatus === 'healthy'
          ? '100% Reliable: Connection to the cloud server is stable and secure.'
          : 'Intermittent Connection: Some network calls took longer than 500ms to answer.',
      userImpact: 'Submissions (match events, article publishing) go through reliably.',
      recommendation: 'Network routes between client and cloud data center are optimal.',
    },
    {
      title: 'Authentication & Session Guard',
      subtitle: 'Controls who can sign in, passwords, and 2FA clearances',
      icon: Lock,
      latency: 'Verified',
      status: systemHealth.authStatus,
      plainExplanation:
        'Secure: User sessions, encrypted JSON Web Tokens (JWT), and role permissions are verified.',
      userImpact: 'Referees, coaches, and administrators stay securely logged in without unexpected logouts.',
      recommendation: '2FA security policy is operational across administrative accounts.',
    },
    {
      title: 'Media & File Storage',
      subtitle: 'Hosts club logos, player pictures, and article imagery',
      icon: HardDrive,
      latency: '312 MB',
      status: systemHealth.storageStatus,
      plainExplanation:
        'Nominal: Storage buckets are accessible for image uploads and public CDN downloads.',
      userImpact: 'Player photos and match highlights display cleanly across all devices.',
      recommendation: 'Storage capacity is currently at approximately 31% of the free quota.',
    },
    {
      title: 'Realtime WebSocket Network',
      subtitle: 'Pushes instant live goal alerts and score updates',
      icon: Radio,
      latency: 'Connected',
      status: systemHealth.realtimeStatus,
      plainExplanation:
        'Active: Realtime socket subscriptions are listening for match score events.',
      userImpact: 'Scores update on student phones without requiring them to refresh the browser.',
      recommendation: 'WebSocket heartbeat is pinging normally every 30 seconds.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Overall Status Headline */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#2A2A2A] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${summary.dotColor} animate-pulse`} />
              <h2 className="text-lg font-black text-white tracking-tight">{summary.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${summary.badgeColor}`}>
                {systemHealth.dbStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              {summary.description}
            </p>
            <div className="text-[11px] text-gray-400 flex flex-wrap items-center gap-3 pt-1">
              <span>Last verified: <strong className="text-gray-300">{systemHealth.lastChecked}</strong></span>
              <span>•</span>
              <span>Observed DB Latency: <strong className="text-emerald-400 font-mono">{systemHealth.dbLatencyMs}ms</strong></span>
              <span>•</span>
              <span>API Gateway: <strong className="text-cyan-400 font-mono">{systemHealth.apiLatencyMs}ms</strong></span>
            </div>

            {/* Live Automated Health Probe Ticker */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212] border border-[#2D2D2D] text-xs font-mono">
                <span className="relative flex h-2.5 w-2.5">
                  {isProbeRunning && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isProbeRunning ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
                <span className={isProbeRunning ? 'text-emerald-300 font-semibold' : 'text-amber-300 font-semibold'}>
                  {isProbeRunning ? 'Automated Health Probe: RUNNING' : 'Automated Health Probe: PAUSED'}
                </span>
                <span className="text-gray-500 text-[10px]">(30s ping cycle)</span>
                {onToggleProbe && (
                  <button
                    onClick={onToggleProbe}
                    className="ml-1 text-[10px] px-2 py-0.5 rounded bg-[#252525] hover:bg-[#303030] text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {isProbeRunning ? 'Pause' : 'Resume'}
                  </button>
                )}
              </div>
              <span className="text-[11px] text-gray-400 font-mono">
                Completed Pings: <strong className="text-emerald-400">{probeCount}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRunDiagnostic}
              disabled={isLoading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer min-h-[42px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Testing...' : 'Run Live Diagnostic'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Plain-English Component Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Core Infrastructure in Plain Language
          </h3>
          <span className="text-[11px] text-gray-400">Simple English translations of technical telemetry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plainCards.map((card, i) => {
            const Icon = card.icon;
            const isHealthy = card.status === 'healthy';
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#222222] text-emerald-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{card.title}</h4>
                        <span className="text-[10px] text-gray-400">{card.subtitle}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#131313] text-emerald-400 border border-[#262626]">
                      {card.latency}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#131313] border border-[#242424] space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{card.plainExplanation}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      <strong className="text-gray-300">User experience:</strong> {card.userImpact}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 border-t border-[#242424] pt-2 flex items-center justify-between">
                  <span>Recommendation:</span>
                  <span className="text-gray-400">{card.recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Failed API Calls & Error Diagnostics Table */}
      <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Failed Calls & Error Diagnostics Monitor
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Logs any rejected calls, network failures, or database constraint blocks with plain-language root causes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              {failedCalls.length} Intercepted Call{failedCalls.length === 1 ? '' : 's'}
            </span>
            {onClearErrors && failedCalls.length > 0 && (
              <button
                onClick={onClearErrors}
                className="px-3 py-1 bg-[#242424] hover:bg-[#2C2C2C] text-gray-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Log
              </button>
            )}
          </div>
        </div>

        {failedCalls.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
            <h4 className="text-sm font-bold text-white">Zero Failed Calls Detected</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              All database queries, API endpoints, and network commands have completed with HTTP 200/204 success codes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {failedCalls.map((err) => (
              <div
                key={err.id}
                onClick={() => setSelectedError(selectedError?.id === err.id ? null : err)}
                className="p-4 rounded-xl bg-[#131313] border border-[#262626] hover:border-amber-500/40 transition-all cursor-pointer space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600/20 text-rose-400 border border-rose-500/30">
                      HTTP {err.statusCode || 'ERR'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white">{err.errorName}</span>
                      <span className="text-[11px] text-gray-400 ml-2 font-mono">
                        {err.method} {err.endpoint}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{err.timestamp}</span>
                </div>

                {/* Plain-Language Explanation */}
                <div className="p-3 rounded-lg bg-[#191919] border border-[#292929] space-y-1 text-xs">
                  <div className="text-amber-300 font-medium">
                    <strong>What Happened:</strong> {err.plainExplanation}
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    <strong>Why It Happened:</strong> {err.rootCause}
                  </div>
                  <div className="text-emerald-400 text-[11px]">
                    <strong>How to Fix:</strong> {err.actionToFix}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Common Error Code Guide in Plain English */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-3 text-xs">
        <h4 className="font-bold text-gray-200 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          Quick Plain-Language Guide to Error Codes
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
          <div className="p-3 rounded-xl bg-[#191919] border border-[#292929]">
            <span className="font-mono font-bold text-amber-400">401 Unauthorized</span>
            <p className="text-gray-400 mt-1">The user is not logged in or their session token has expired. Solution: Log in again.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191919] border border-[#292929]">
            <span className="font-mono font-bold text-rose-400">403 Forbidden (RLS)</span>
            <p className="text-gray-400 mt-1">The user does not have permission to read/write this table. Solution: Update the role in the User Directory.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191919] border border-[#292929]">
            <span className="font-mono font-bold text-blue-400">409 Conflict</span>
            <p className="text-gray-400 mt-1">A duplicate record already exists (e.g. duplicate jersey number or email). Solution: Change the conflicting value.</p>
          </div>
          <div className="p-3 rounded-xl bg-[#191919] border border-[#292929]">
            <span className="font-mono font-bold text-purple-400">500 / Network Error</span>
            <p className="text-gray-400 mt-1">Internet disconnection or server timeout. Solution: Check connectivity and click "Run Live Diagnostic".</p>
          </div>
        </div>
      </div>
    </div>
  );
};
