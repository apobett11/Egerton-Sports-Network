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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="w-full max-w-md bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 id="profile-modal-title" className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
            <User className="w-4 h-4 text-[#ff0046]" /> Press Credentials & Profile
          </h3>
          <button
            onClick={onClose}
            aria-label="Close profile modal"
            className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* PROFILE CARD */}
          <div className="flex items-center gap-4 p-4 rounded-sm bg-[#0e1c2b] border border-[#1a2e45]">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-16 h-16 rounded-sm object-cover border border-[#1a2e45] shadow-xs shrink-0"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-black text-lg text-white truncate">
                <span className="truncate">{displayName}</span>
                <CheckCircle2 className="w-4 h-4 text-[#ff0046] fill-[#ff0046]/20 shrink-0" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate">{userHandle}</p>
              <span className="bg-[#ff0046] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm inline-block">
                {roleTitle}
              </span>
            </div>
          </div>

          {/* EDITORIAL STATS GRID */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-3">
              <div className="font-mono font-black text-xl text-white">
                {performanceMetrics.publishedCount}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1 mt-1">
                <BookOpen className="w-3 h-3 text-[#ff0046]" /> Published
              </div>
            </div>

            <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-3">
              <div className="font-mono font-black text-xl text-[#38bdf8]">
                {performanceMetrics.reads >= 1000
                  ? `${(performanceMetrics.reads / 1000).toFixed(1)}k`
                  : performanceMetrics.reads}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1 mt-1">
                <Eye className="w-3 h-3 text-[#38bdf8]" /> Reads
              </div>
            </div>

            <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-3">
              <div className="font-mono font-black text-xl text-[#ff0046]">
                {performanceMetrics.engagementRate}%
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Engagement
              </div>
            </div>
          </div>

          {/* CREDENTIALS */}
          <div className="space-y-2.5">
            <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-3 flex items-center justify-between font-mono text-xs text-[#ff0046] font-bold">
              <span className="text-slate-400 flex items-center gap-2 font-sans font-bold uppercase text-[11px] tracking-wider">
                <Award className="w-4 h-4 text-[#ff0046]" /> Press Badge ID
              </span>
              <span>{pressBadgeId}</span>
            </div>
            <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-3 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="text-slate-400 flex items-center gap-2 uppercase text-[11px] tracking-wider">
                <FileText className="w-4 h-4 text-[#38bdf8]" /> Media House
              </span>
              <span className="text-white font-extrabold uppercase tracking-wider">Egerton Sports Network</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-[#0e1e2d] border-t border-[#1a2e45] px-6 py-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-black text-xs uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
