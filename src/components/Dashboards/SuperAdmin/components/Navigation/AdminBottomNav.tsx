import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Users,
  FileText,
  Lock,
  UserCheck,
} from 'lucide-react';
import type { AdminTabType } from '../../types';

interface AdminBottomNavProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  pendingPlayersCount?: number;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingPlayersCount = 0,
}) => {
  const bottomItems = [
    { id: 'overview' as AdminTabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'health' as AdminTabType, label: 'Health', icon: Activity },
    { id: 'users' as AdminTabType, label: 'Users', icon: Users },
    {
      id: 'players' as AdminTabType,
      label: 'Players',
      icon: UserCheck,
      badge: pendingPlayersCount > 0 ? pendingPlayersCount : undefined,
    },
    { id: 'admin_2' as AdminTabType, label: 'Admin 2', icon: Lock, isSpecial: true },
    { id: 'audit_logs' as AdminTabType, label: 'Audit', icon: FileText },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161616]/95 backdrop-blur-md border-t border-[#262626] px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {bottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center min-w-[50px] py-1 px-1.5 rounded-xl transition-all cursor-pointer relative ${
              isActive
                ? item.isSpecial
                  ? 'text-amber-400 font-bold bg-amber-600/15 border border-amber-500/30'
                  : 'text-emerald-400 font-bold bg-emerald-600/15 border border-emerald-500/30'
                : item.isSpecial
                ? 'text-amber-400/70 font-medium'
                : 'text-gray-400 font-medium hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-4 h-4" />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[8px] font-black flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[9px] tracking-tight mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
