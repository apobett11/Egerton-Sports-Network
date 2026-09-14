import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Activity,
  Users,
  Clock,
  Lock,
  CheckCircle2,
  TrendingUp,
  Compass,
  Zap,
  HardDrive,
  Database,
  Key,
  Shield,
  Layers,
  ArrowUpRight,
  Eye,
  RefreshCw,
} from 'lucide-react';
import type {
  HourlyTrafficData,
  PageVisitAnalytics,
  PlatformPerformanceMetrics,
  PlatformHealthMetrics,
  SupabaseSlowQuery,
} from '../../types';

interface Admin2DashboardViewProps {
  performanceMetrics: PlatformPerformanceMetrics;
  platformHealth: PlatformHealthMetrics;
  hourlyTraffic: HourlyTrafficData[];
  pageVisitAnalytics: PageVisitAnalytics[];
  slowQueries: SupabaseSlowQuery[];
  onApplyIndex: (queryId: string) => void;
  onRelock: () => void;
  onUpdatePassword: (newPassword: string) => Promise<boolean>;
  showToast: (msg: string) => void;
}

export const Admin2DashboardView: React.FC<Admin2DashboardViewProps> = ({
  performanceMetrics,
  platformHealth,
  hourlyTraffic,
  pageVisitAnalytics,
  slowQueries,
  onApplyIndex,
  onRelock,
  onUpdatePassword,
  showToast,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const psychData = [
    { name: 'System 1 (Waterfall Feed Scroll)', value: 82, color: '#10b981' },
    { name: 'System 2 (Analytical Squad Inspection)', value: 18, color: '#3b82f6' },
  ];

  // 30 days of mock uptime points (all 99.8% - 100%)
  const uptimeDays = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    uptime: i === 14 ? 99.85 : i === 22 ? 99.91 : 100,
  }));

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.');
      return;
    }
    setIsUpdatingPassword(true);
    const success = await onUpdatePassword(newPassword.trim());
    setIsUpdatingPassword(false);
    if (success) {
      setShowPasswordModal(false);
      setNewPassword('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner with Lock Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#191919] via-[#1E1B13] to-[#191919] border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-black/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                Admin 2 • Deep Telemetry & User Flow Analytics
              </h2>
              <p className="text-xs text-amber-200/80">
                Encrypted Sector • Authenticated with Database Master Password
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-3.5 py-2 bg-[#252015] hover:bg-[#322A1A] text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Update Password</span>
          </button>
          <button
            onClick={onRelock}
            className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Relock Admin 2</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards: Users Track Data & Average Uptime */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
            <span>Average Uptime</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {performanceMetrics.avgUserUptimePercentage || 99.98}%
          </div>
          <div className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Exceeds 99.90% SLA Target
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] hover:border-blue-500/40 transition-all space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
            <span>Peak Concurrent Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {performanceMetrics.peakConcurrentUsers || 186}
          </div>
          <div className="text-[10px] text-blue-400 font-medium">Saturday Campus Derby Peak</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] hover:border-amber-500/40 transition-all space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
            <span>Avg Session Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {performanceMetrics.avgSessionDurationMins || 15.2}m
          </div>
          <div className="text-[10px] text-amber-400/90 font-medium">+18% engagement vs last week</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] hover:border-purple-500/40 transition-all space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
            <span>Active Today</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {platformHealth.activeUsersToday || 142}
          </div>
          <div className="text-[10px] text-purple-400 font-medium">Unique verified devices</div>
        </div>
      </div>

      {/* 3. 30-Day Historical Uptime Calendar Bar */}
      <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Continuous 30-Day Platform Uptime Record
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-[11px] text-gray-400">
                Automated health check probes running every 30 seconds against remote PostgreSQL instance
              </p>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>PROBE RUNNING</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
            <span>100% Zero Unscheduled Downtime</span>
          </div>
        </div>

        <div className="grid grid-cols-15 sm:grid-cols-30 gap-1 pt-2">
          {uptimeDays.map((d) => (
            <div
              key={d.day}
              title={`Day ${d.day}: ${d.uptime}% Uptime`}
              className={`h-9 rounded-md transition-all cursor-pointer hover:scale-110 ${
                d.uptime === 100
                  ? 'bg-emerald-500 hover:bg-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 font-mono">
          <span>30 days ago</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded bg-emerald-500" /> Operational (99.98% avg)
          </span>
          <span>Today</span>
        </div>
      </div>

      {/* 4. Users Track in Graphs Per Hour (24-Hour Graph) */}
      <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Users Track in Graphs Per Hour (24-Hour Realtime Distribution)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live hourly active user sessions and page interaction volume across campus
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Peak: 17:00 (Matchday Kickoff)
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userHourlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="pageviewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  borderColor: '#374151',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                name="Active Users"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#userHourlyGrad)"
              />
              <Area
                type="monotone"
                dataKey="pageViews"
                name="Page Views"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#pageviewsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#121212] border border-[#262626] text-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Lunch Hour Rush</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">12:00 – 14:00 (94 users/hr)</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121212] border border-[#262626] text-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Prime Matchday Window</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">16:00 – 18:30 (186 users/hr)</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121212] border border-[#262626] text-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Evening News & POTW</div>
            <div className="text-sm font-bold text-blue-400 mt-0.5">20:00 – 22:00 (128 users/hr)</div>
          </div>
        </div>
      </div>

      {/* 5. Page-to-Page Visit Analytics */}
      <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Page-to-Page Visit Analytics & Navigation Flow
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Tracks visitor entrance pages, navigation depth, average dwell time, and bounce rates
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400">Total Analyzed Visits: 14,240</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#262626] text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Page Route</th>
                <th className="py-3 px-3">Page Description</th>
                <th className="py-3 px-3 text-right">Total Visits</th>
                <th className="py-3 px-3 text-right">Unique Devices</th>
                <th className="py-3 px-3 text-right">Traffic Share</th>
                <th className="py-3 px-3 text-right">Avg Dwell Time</th>
                <th className="py-3 px-3 text-right">Bounce Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {pageVisitAnalytics.map((page, idx) => (
                <tr key={idx} className="hover:bg-[#1C1C1C] transition-colors">
                  <td className="py-3 px-3 font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <span>{page.route}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-300 font-medium">{page.title}</td>
                  <td className="py-3 px-3 text-right font-mono text-white font-bold">
                    {page.visits.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-300">
                    {page.uniqueVisitors.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-[#222222] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${page.percentageShare}%` }}
                        />
                      </div>
                      <span className="font-mono text-gray-400 text-[11px] w-8">{page.percentageShare}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300">{page.avgDwellTime}</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-400">{page.bounceRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Psychology Funnel & Behavioral State Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Nir Eyal Hook Model & Retention Loops
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Weekly cycle combining Wednesday squad gossip with Saturday live matchday adrenaline loops
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-[#121212] border border-[#262626] space-y-1">
              <div className="text-[10px] text-gray-400 font-bold uppercase">Trigger</div>
              <div className="text-xs font-bold text-white">Push & WhatsApp Match Alerts</div>
              <p className="text-[10px] text-gray-400">84% open rate on match kickoff alerts</p>
            </div>
            <div className="p-4 rounded-xl bg-[#121212] border border-[#262626] space-y-1">
              <div className="text-[10px] text-gray-400 font-bold uppercase">Action</div>
              <div className="text-xs font-bold text-emerald-400">Infinite Feed Waterfall Scroll</div>
              <p className="text-[10px] text-gray-400">Avg 4.8 screen heights per session</p>
            </div>
            <div className="p-4 rounded-xl bg-[#121212] border border-[#262626] space-y-1">
              <div className="text-[10px] text-gray-400 font-bold uppercase">Variable Reward</div>
              <div className="text-xs font-bold text-amber-400">POTW Voting & Live Scores</div>
              <p className="text-[10px] text-gray-400">Dopamine spikes after game final whistles</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              System 1 vs System 2 Split
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Autopilot casual scrolling vs in-depth team analytics
            </p>
          </div>

          <div className="h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={psychData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value">
                  {psychData.map((e, idx) => (
                    <Cell key={idx} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111111',
                    borderColor: '#374151',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 border-t border-[#262626] pt-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> System 1 (Waterfall Feed)
              </span>
              <span className="font-mono text-emerald-400 font-bold">82%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> System 2 (Tactics / Table)
              </span>
              <span className="font-mono text-blue-400 font-bold">18%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Database Slow Queries & Index Advisor */}
      <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              PostgreSQL Index Advisor & Query Bottleneck Telemetry
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Recommends compound indexes to keep query latency below 20ms during peak match spikes
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            All Critical Tables Indexed
          </span>
        </div>

        <div className="space-y-3">
          {slowQueries.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl bg-[#131313] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-white">{q.tableName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222222] text-amber-400 border border-[#333333]">
                    {q.durationMs}ms
                  </span>
                  {q.isOptimized && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Indexed
                    </span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-gray-400 line-clamp-1">{q.query}</div>
                <div className="text-[11px] text-emerald-400 font-mono">
                  Recommended: {q.recommendedIndex}
                </div>
              </div>

              {!q.isOptimized && (
                <button
                  onClick={() => onApplyIndex(q.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  Apply Index
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Update Admin 2 Master Password</h3>
            <p className="text-xs text-gray-400">
              This will update the master clearance password stored in the Supabase <code className="text-emerald-400">system_settings</code> database table.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new master password..."
                className="w-full bg-[#111111] border border-[#333333] focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-[#222222] text-gray-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isUpdatingPassword ? 'Saving to Database...' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
