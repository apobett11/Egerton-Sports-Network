import React from 'react';
import { X, User, Award, FileText, CheckCircle2, Eye, BookOpen } from 'lucide-react';
import type { ProfileUser, PerformanceMetrics } from '../../JournalistTypes';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: ProfileUser | null;
  performanceMetrics: PerformanceMetrics;
  cardBg: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  performanceMetrics,
  cardBg,
}) => {
  if (!isOpen) return null;

  const displayName = currentUserProfile
    ? `${currentUserProfile.firstName || ''} ${currentUserProfile.lastName || ''}`.trim() || 'Sports Journalist'
    : 'Sports Journalist';

  const userHandle = currentUserProfile?.email
    ? `@${currentUserProfile.email.split('@')[0]}`
    : `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

  const roleTitle = currentUserProfile?.role
    ? `${currentUserProfile.role.toUpperCase()} Reporter`
    : 'Lead Sports Correspondent';

  const avatarSrc =
    currentUserProfile?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const pressBadgeId = currentUserProfile?.id
    ? `PRESS-${currentUserProfile.id.slice(0, 8).toUpperCase()}`
    : 'PRESS-ESN-AUTH';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className={`w-full max-w-md ${cardBg} p-6 rounded-3xl shadow-2xl space-y-5 border border-slate-700/60`}>
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 id="profile-modal-title" className="font-extrabold text-base tracking-tight flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" /> Press Credentials & Profile
          </h3>
          <button
            onClick={onClose}
            aria-label="Close profile modal"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROFILE CARD */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <img
            src={avatarSrc}
            alt={displayName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
          />
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">
              <span className="truncate">{displayName}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20 shrink-0" />
            </div>
            <p className="text-xs text-slate-400 font-semibold truncate">{userHandle}</p>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {roleTitle}
            </span>
          </div>
        </div>

        {/* DATABASE STATS */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="font-black text-lg text-slate-900 dark:text-slate-100">
              {performanceMetrics.publishedCount}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
              <BookOpen className="w-3 h-3 text-emerald-500" /> Published
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="font-black text-lg text-emerald-500">
              {performanceMetrics.reads >= 1000
                ? `${(performanceMetrics.reads / 1000).toFixed(1)}k`
                : performanceMetrics.reads}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
              <Eye className="w-3 h-3 text-blue-500" /> Reads
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="font-black text-lg text-purple-500">
              {performanceMetrics.engagementRate}%
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">
              Engagement
            </div>
          </div>
        </div>

        {/* CREDENTIALS */}
        <div className="space-y-2 text-xs font-semibold">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" /> Press Badge ID
            </span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{pressBadgeId}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Media House
            </span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">Egerton Sports Network</span>
          </div>
        </div>
      </div>
    </div>
  );
};
