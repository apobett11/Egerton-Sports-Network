import React from 'react';
import {
  Activity,
  Zap,
  Server,
  Database,
  Radio,
  HardDrive,
  Clock,
  Users,
  TrendingUp,
} from 'lucide-react';
import type { PlatformPerformanceMetrics, SystemHealthMetrics } from '../../types';

interface AdminPerformanceViewProps {
  metrics: PlatformPerformanceMetrics;
  systemHealth: SystemHealthMetrics;
}

export const AdminPerformanceView: React.FC<AdminPerformanceViewProps> = ({
  metrics,
  systemHealth,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Platform Performance & Telemetry
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time API response metrics, database query timings, and infrastructure load.
          </p>
        </div>
      </div>

      {/* Main Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase">
            <span>Average API Response</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">{systemHealth.apiLatencyMs} ms</div>
          <div className="text-[11px] text-gray-400">Measured via active Supabase telemetry ping</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase">
            <span>Database Read Latency</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black font-mono text-blue-400">{systemHealth.dbLatencyMs} ms</div>
          <div className="text-[11px] text-gray-400">Query execution time for main schema</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase">
            <span>Realtime Broadcast Latency</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-cyan-400">{metrics.realtimeLatencyMs} ms</div>
          <div className="text-[11px] text-gray-400">Supabase WebSocket channel propagation</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase">
            <span>Average Session Duration</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">{metrics.avgSessionDurationMins} mins</div>
          <div className="text-[11px] text-gray-400">Client retention per active session</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase">
            <span>Media Storage Usage</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-purple-400">{metrics.storageUsageMb} MB</div>
          <div className="text-[11px] text-gray-400">Supabase storage bucket utilization</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase">
            <span>Peak Concurrent Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-indigo-400">{metrics.peakConcurrentUsers}</div>
          <div className="text-[11px] text-gray-400">Simultaneous active user connections</div>
        </div>
      </div>
    </div>
  );
};
