import React from 'react';
import {
  ShieldCheck,
  Users,
  Lock,
  CheckCircle,
  XCircle,
  Award,
  Crown,
  Newspaper,
  Shield,
  UserCheck,
} from 'lucide-react';
import type { PlatformHealthMetrics, UserProfileRow } from '../../types';

interface AdminRoleManagementViewProps {
  platformHealth: PlatformHealthMetrics;
  userDirectory: UserProfileRow[];
}

export const AdminRoleManagementView: React.FC<AdminRoleManagementViewProps> = ({
  platformHealth,
  userDirectory,
}) => {
  const rolePermissions = [
    {
      role: 'Admin',
      count: platformHealth.totalUsers > 0 ? 2 : 1,
      description: 'Platform infrastructure, user moderation, telemetry & system configuration.',
      canSubmitSquads: false,
      canSubmitReports: false,
      canPublishNews: false,
      canGenerateFixtures: false,
      canModerateUsers: true,
      canReadTelemetry: true,
    },
    {
      role: 'President',
      count: 1,
      description: 'League governance, fixture generation, executive broadcasts, rules alignment.',
      canSubmitSquads: false,
      canSubmitReports: false,
      canPublishNews: false,
      canGenerateFixtures: true,
      canModerateUsers: false,
      canReadTelemetry: true,
    },
    {
      role: 'Coach',
      count: platformHealth.totalCoaches,
      description: 'Team tactics, starting XI selection, roster management, squad submissions.',
      canSubmitSquads: true,
      canSubmitReports: false,
      canPublishNews: false,
      canGenerateFixtures: false,
      canModerateUsers: false,
      canReadTelemetry: false,
    },
    {
      role: 'Captain',
      count: platformHealth.totalCaptains,
      description: 'On-field leadership, roster backup management, practice coordination.',
      canSubmitSquads: true,
      canSubmitReports: false,
      canPublishNews: false,
      canGenerateFixtures: false,
      canModerateUsers: false,
      canReadTelemetry: false,
    },
    {
      role: 'Referee',
      count: platformHealth.totalReferees,
      description: 'Match officiating, event recording, official match report submissions.',
      canSubmitSquads: false,
      canSubmitReports: true,
      canPublishNews: false,
      canGenerateFixtures: false,
      canModerateUsers: false,
      canReadTelemetry: false,
    },
    {
      role: 'Journalist',
      count: platformHealth.totalJournalists,
      description: 'Press coverage, article creation, campus sports editorial publishing.',
      canSubmitSquads: false,
      canSubmitReports: false,
      canPublishNews: true,
      canGenerateFixtures: false,
      canModerateUsers: false,
      canReadTelemetry: false,
    },
    {
      role: 'Player',
      count: platformHealth.totalPlayers,
      description: 'Individual player profile, stats tracking, match performance records.',
      canSubmitSquads: false,
      canSubmitReports: false,
      canPublishNews: false,
      canGenerateFixtures: false,
      canModerateUsers: false,
      canReadTelemetry: false,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Role Management & Permissions Matrix
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Overview of platform roles, user counts, permissions, and security boundaries.
          </p>
        </div>
      </div>

      {/* Role Permission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rolePermissions.map((rp) => (
          <div key={rp.role} className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white uppercase">{rp.role}</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                {rp.count} active
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed min-h-[36px]">{rp.description}</p>

            <div className="space-y-2 pt-2 border-t border-[#2A2A2A] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Moderate Platform Users</span>
                {rp.canModerateUsers ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Submit Match Squads</span>
                {rp.canSubmitSquads ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Submit Official Reports</span>
                {rp.canSubmitReports ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Publish News Articles</span>
                {rp.canPublishNews ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Generate Fixtures</span>
                {rp.canGenerateFixtures ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
