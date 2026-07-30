import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Badge } from '../../common/UIComponents';

export const DashboardHeader: React.FC<{ title: string; subtitle: string; role: string }> = ({ title, subtitle, role }) => {
  const { profile } = useAuth();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#191c1e] to-slate-900 border border-slate-800 text-white mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="gold">{role.toUpperCase()} DASHBOARD</Badge>
          <span className="text-xs text-slate-400">Welcome, {profile?.first_name || 'Member'} {profile?.last_name || ''}</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
        <p className="text-xs text-slate-300">{subtitle}</p>
      </div>
    </div>
  );
};

export default DashboardHeader;
