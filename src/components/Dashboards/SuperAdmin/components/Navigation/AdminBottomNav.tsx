import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Users,
  FileText,
  Activity,
} from 'lucide-react';
import type { AdminTabType } from '../../types';

interface AdminBottomNavProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  insightsCount: number;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({
  activeTab,
  setActiveTab,
  insightsCount,
}) => {
  const bottomItems = [
    { id: 'overview' as AdminTabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'overviews' as AdminTabType, label: 'Roles', icon: Layers },
    {
      id: 'insights' as AdminTabType,
      label: 'Insights',
      icon: Sparkles,
      badge: insightsCount > 0 ? insightsCount : undefined,
    },
    { id: 'users' as AdminTabType, label: 'Users', icon: Users },
    { id: 'audit_logs' as AdminTabType, label: 'Audit', icon: FileText },
    { id: 'performance' as AdminTabType, label: 'Telemetry', icon: Activity },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#181818]/95 backdrop-blur-md border-t border-[#2A2A2A] px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {bottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center min-w-[52px] py-1.5 px-2 rounded-xl transition-all cursor-pointer relative ${
              isActive
                ? 'text-emerald-400 font-bold bg-emerald-600/10 border border-emerald-500/20'
                : 'text-gray-400 font-medium hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
