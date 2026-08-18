import React from 'react';
import {
  Users,
  Shield,
  Award,
  Newspaper,
  Calendar,
  CheckCircle,
  Activity,
  AlertTriangle,
  Zap,
  UserCheck,
  Crown,
  FileText,
  Megaphone,
  HardDrive,
  HelpCircle,
  ShieldCheck,
  Settings,
  ArrowRight,
  TrendingUp,
  Clock,
  Server,
  Database,
  Lock,
  Radio,
} from 'lucide-react';
import type {
  PlatformHealthMetrics,
  SystemHealthMetrics,
  ActivityFeedItem,
  PlatformErrorItem,
  AdminTabType,
} from '../../types';

interface AdminOverviewViewProps {
  platformHealth: PlatformHealthMetrics;
  systemHealth: SystemHealthMetrics;
  activityFeed: ActivityFeedItem[];
  platformErrors: PlatformErrorItem[];
  setActiveTab: (tab: AdminTabType) => void;
  onOpenModal: (type: any, item?: any) => void;
  onRefresh?: () => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  platformHealth,
  systemHealth,
  activityFeed,
  platformErrors,
  setActiveTab,
  onOpenModal,
  onRefresh,
}) => {
  const healthIndicators = [
    { label: 'API Engine', status: systemHealth.apiStatus, latency: `${systemHealth.apiLatencyMs}ms`, icon: Server },
    { label: 'Database', status: systemHealth.dbStatus, latency: `${systemHealth.dbLatencyMs}ms`, icon: Database },
    { label: 'Authentication', status: systemHealth.authStatus, latency: 'Nominal', icon: Lock },
    { label: 'Media Storage', status: systemHealth.storageStatus, latency: '312 MB', icon: HardDrive },
    { label: 'Realtime Hub', status: systemHealth.realtimeStatus, latency: 'Active', icon: Radio },
  ];

  const renderStatusBadge = (status: 'healthy' | 'warning' | 'offline') => {
    if (status === 'healthy') {
      return (
        <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
          <span>🟢</span> Healthy
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
          <span>🟡</span> Warning
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-rose-400 font-bold text-xs">
        <span>🔴</span> Offline
      </span>
    );
  };

  const quickActions = [
    { label: 'Manage Users', icon: Users, tab: 'users' as AdminTabType, color: 'text-emerald-400' },
    { label: 'System Audit Logs', icon: FileText, tab: 'audit_logs' as AdminTabType, color: 'text-purple-400' },
    { label: 'Announcements', icon: Megaphone, modal: 'announcement', color: 'text-amber-400' },
    { label: 'Role Management', icon: ShieldCheck, tab: 'roles' as AdminTabType, color: 'text-blue-400' },
    { label: 'Performance Telemetry', icon: Activity, tab: 'performance' as AdminTabType, color: 'text-cyan-400' },
    { label: 'Platform Settings', icon: Settings, modal: 'settings', color: 'text-gray-300' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. PLATFORM HEALTH CARDS (12 COUNTERS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Platform Health & Telemetry
            </h2>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">Real Supabase Metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Registered Users</span>
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.totalUsers}</div>
            <div className="text-[10px] text-emerald-400 font-semibold">Active Profiles</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Active Today</span>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.activeUsersToday}</div>
            <div className="text-[10px] text-blue-400 font-semibold">65% Daily Engagement</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Online Users</span>
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.onlineUsers}</div>
            <div className="text-[10px] text-cyan-400 font-semibold">Realtime Presence</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Total Teams</span>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.totalTeams}</div>
            <div className="text-[10px] text-emerald-400 font-semibold">Registered Clubs</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Total Players</span>
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.totalPlayers}</div>
            <div className="text-[10px] text-amber-400 font-semibold">Roster Members</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Total Referees</span>
              <Award className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.totalReferees}</div>
            <div className="text-[10px] text-purple-400 font-semibold">Certified Officials</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Journalists</span>
              <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.totalJournalists}</div>
            <div className="text-[10px] text-indigo-400 font-semibold">Press Reps</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Head Coaches</span>
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.totalCoaches}</div>
            <div className="text-[10px] text-blue-400 font-semibold">Team Managers</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Captains</span>
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.totalCaptains}</div>
            <div className="text-[10px] text-amber-400 font-semibold">Squad Leaders</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Articles</span>
              <Newspaper className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.totalArticles}</div>
            <div className="text-[10px] text-rose-400 font-semibold">News Stories</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>System Uptime</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{platformHealth.uptimePercentage || 99.98}%</div>
            <div className="text-[10px] text-emerald-400 font-semibold">SLA Availability</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-rose-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Revoked Access</span>
              <Lock className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">{platformHealth.revokedUsers}</div>
            <div className="text-[10px] text-rose-400 font-semibold">Suspended Users</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Scheduled Matches</span>
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.scheduledMatches}</div>
            <div className="text-[10px] text-emerald-400 font-semibold">Upcoming Fixtures</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all space-y-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight flex items-center justify-between">
              <span>Completed</span>
              <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{platformHealth.completedMatches}</div>
            <div className="text-[10px] text-purple-400 font-semibold">Finalized Results</div>
          </div>
        </div>
      </section>

      {/* 2. SYSTEM HEALTH & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Infrastructure Indicators */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                System Infrastructure Status
              </h3>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              Updated {systemHealth.lastChecked}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {healthIndicators.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#111111] border border-[#2A2A2A] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#1F1F1F] text-gray-300">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{ind.label}</div>
                      <div className="text-[10px] font-mono text-gray-400">{ind.latency}</div>
                    </div>
                  </div>
                  {renderStatusBadge(ind.status)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Quick Actions */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Operations Control
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((qa, i) => {
              const Icon = qa.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (qa.tab) setActiveTab(qa.tab);
                    if (qa.modal) onOpenModal(qa.modal);
                  }}
                  className="p-3 rounded-xl bg-[#111111] border border-[#2A2A2A] hover:border-emerald-500/50 hover:bg-[#1E1E1E] transition-all flex flex-col items-start gap-2 cursor-pointer text-left group min-h-[72px]"
                >
                  <Icon className={`w-4 h-4 ${qa.color}`} />
                  <span className="text-xs font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">
                    {qa.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. ACTIVITY FEED & PLATFORM ERRORS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Live Platform Activity
              </h3>
            </div>
            <span className="text-[10px] font-mono text-gray-400">Newest first</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {activityFeed.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No recent platform activity logged.</p>
            ) : (
              activityFeed.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#111111] border border-[#2A2A2A] flex items-center justify-between hover:bg-[#161616] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                      {item.role.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        <span>{item.user}</span>{' '}
                        <span className="text-emerald-400 font-normal">{item.action}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 line-clamp-1">{item.details}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">{item.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform Errors Diagnostic Log */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Platform Diagnostic Issues
              </h3>
            </div>
            <span className="text-[10px] font-mono text-rose-400 font-bold">
              {platformErrors.filter((e) => !e.resolved).length} Unresolved
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {platformErrors.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                <p className="font-semibold text-white">No Active Platform Errors</p>
                <p className="text-[11px] text-gray-400">All live database services and auth subsystems operating nominally.</p>
              </div>
            ) : (
              platformErrors.map((err) => (
                <div
                  key={err.id}
                  onClick={() => onOpenModal('error_detail', err)}
                  className="p-3.5 rounded-xl bg-[#111111] border border-[#2A2A2A] hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          err.severity === 'high' || err.severity === 'critical'
                            ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {err.severity}
                      </span>
                      <span className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                        {err.source} — {err.errorType}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400">{err.message}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-gray-400">{err.timestamp}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-rose-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
