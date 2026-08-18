import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Badge } from '../../common/UIComponents';
import { LogOut } from 'lucide-react';

export const DashboardHeader: React.FC<{
  title: string;
  subtitle: string;
  role: string;
  onLogout?: () => void;
}> = ({ title, subtitle, role, onLogout }) => {
  const { profile, logout } = useAuth();

  const handleSignOut = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      window.location.hash = '/home';
    }
  };

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

      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-fit min-h-[40px]"
        title="Sign Out of Platform"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default DashboardHeader;
