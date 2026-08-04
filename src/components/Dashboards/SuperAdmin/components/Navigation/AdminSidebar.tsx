import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Users,
  ShieldCheck,
  FileText,
  Activity,
  Megaphone,
  UserCheck,
  LogOut,
  RefreshCw,
  Zap,
} from 'lucide-react';
import type { AdminTabType } from '../../types';

interface AdminSidebarProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  onRefresh: () => void;
  onLogout: () => void;
  insightsCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  onLogout,
  insightsCount,
}) => {
  const navItems = [
    {
      id: 'overview' as AdminTabType,
      label: 'Operations Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'overviews' as AdminTabType,
      label: 'Role Overviews',
      icon: Layers,
    },
    {
      id: 'insights' as AdminTabType,
      label: 'Platform Insights',
      icon: Sparkles,
      badge: insightsCount > 0 ? insightsCount : undefined,
    },
    {
      id: 'users' as AdminTabType,
      label: 'User Directory',
      icon: Users,
    },
    {
      id: 'roles' as AdminTabType,
      label: 'Role Management',
      icon: ShieldCheck,
    },
    {
      id: 'audit_logs' as AdminTabType,
      label: 'System Audit Logs',
      icon: FileText,
    },
    {
      id: 'performance' as AdminTabType,
      label: 'Performance Telemetry',
      icon: Activity,
    },
    {
      id: 'settings' as AdminTabType,
      label: 'Announcements & Settings',
      icon: Megaphone,
    },
    {
      id: 'profile' as AdminTabType,
      label: 'Admin Profile',
      icon: UserCheck,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#181818] border-r border-[#2A2A2A] h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">
              Operations Center
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors cursor-pointer"
          title="Refresh Operations Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[10px] uppercase font-bold text-gray-400 px-3 pt-2 pb-1 tracking-wider">
          System Control
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer min-h-[44px] ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#222222] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="p-4 border-t border-[#2A2A2A] bg-[#141414] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="flex-1 truncate">
            <div className="text-xs font-bold text-gray-100 truncate">System Administrator</div>
            <div className="text-[10px] text-gray-400 truncate">admin@egerton.ac.ke</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2.5 px-3 bg-[#1F1F1F] hover:bg-rose-950/40 hover:text-rose-400 text-gray-400 rounded-xl border border-[#2A2A2A] hover:border-rose-900/50 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[40px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </button>
      </div>
    </aside>
  );
};
