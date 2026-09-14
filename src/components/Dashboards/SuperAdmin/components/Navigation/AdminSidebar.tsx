import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Users,
  ShieldCheck,
  FileText,
  Activity,
  Megaphone,
  UserCheck,
  LogOut,
  RefreshCw,
  Zap,
  Award,
  Lock,
  Shield,
} from 'lucide-react';
import type { AdminTabType } from '../../types';

interface SidebarNavItem {
  id: AdminTabType;
  label: string;
  icon: any;
  isSpecial?: boolean;
  badge?: string | number;
  badgeColor?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarNavItem[];
}

interface AdminSidebarProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  onRefresh: () => void;
  onLogout: () => void;
  insightsCount?: number;
  pendingPlayersCount?: number;
  isAdmin2Unlocked?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  onLogout,
  pendingPlayersCount = 0,
  isAdmin2Unlocked = false,
}) => {
  const sections: SidebarSection[] = [
    {
      title: 'Operations',
      items: [
        {
          id: 'overview' as AdminTabType,
          label: 'Executive Overview',
          icon: LayoutDashboard,
        },
        {
          id: 'health' as AdminTabType,
          label: 'Health & Diagnostics',
          icon: Activity,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          id: 'users' as AdminTabType,
          label: 'User Directory',
          icon: Users,
        },
        {
          id: 'roles' as AdminTabType,
          label: 'Role Permissions & RLS',
          icon: ShieldCheck,
        },
        {
          id: 'players' as AdminTabType,
          label: 'Player Approvals',
          icon: UserCheck,
          badge: pendingPlayersCount > 0 ? pendingPlayersCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        },
        {
          id: 'announcements' as AdminTabType,
          label: 'Broadcast Announcements',
          icon: Megaphone,
        },
      ],
    },
    {
      title: 'Governance & Auditing',
      items: [
        {
          id: 'audit_logs' as AdminTabType,
          label: 'System Audit Logs',
          icon: FileText,
        },
        {
          id: 'potw' as AdminTabType,
          label: 'POTW Audit Portal',
          icon: Award,
        },
        {
          id: 'agent0' as AdminTabType,
          label: 'Agent 0 Controller',
          icon: Cpu,
        },
      ],
    },
    {
      title: 'Deep Telemetry',
      items: [
        {
          id: 'admin_2' as AdminTabType,
          label: 'Admin 2 Telemetry',
          icon: Lock,
          isSpecial: true,
          badge: isAdmin2Unlocked ? 'UNLOCKED' : 'LOCKED 🔒',
          badgeColor: isAdmin2Unlocked
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        },
      ],
    },
    {
      title: 'Administrator',
      items: [
        {
          id: 'profile' as AdminTabType,
          label: 'Admin Profile & 2FA',
          icon: Shield,
        },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#161616] border-r border-[#262626] h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight text-white uppercase">
              Operations Center
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors cursor-pointer"
          title="Refresh Operations Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-1">
            <div className="text-[9px] uppercase font-extrabold text-gray-500 px-3 pt-1 pb-0.5 tracking-wider">
              {sec.title}
            </div>

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer min-h-[40px] ${
                    isActive
                      ? item.isSpecial
                        ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : item.isSpecial
                      ? 'text-amber-300/80 hover:text-amber-200 hover:bg-[#221E14] border border-transparent'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#202020] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? item.isSpecial
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                          : item.isSpecial
                          ? 'text-amber-400/80'
                          : 'text-gray-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        item.badgeColor || 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Account */}
      <div className="p-3 border-t border-[#262626] bg-[#121212] space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-200 truncate">System Administrator</div>
            <div className="text-[10px] text-gray-500 truncate">admin@egerton.ac.ke</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2 px-3 bg-[#1A1A1A] hover:bg-rose-950/40 hover:text-rose-400 text-gray-400 rounded-xl border border-[#2A2A2A] hover:border-rose-900/50 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[36px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
