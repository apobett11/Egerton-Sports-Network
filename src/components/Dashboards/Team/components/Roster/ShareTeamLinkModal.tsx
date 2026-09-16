import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Shield, UserPlus } from 'lucide-react';
import { nameToSlug } from '../../lib/supabaseClient';

interface ShareTeamLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName?: string;
  onOpenManualAdd?: () => void;
  onShowToast: (msg: string) => void;
}

export const ShareTeamLinkModal: React.FC<ShareTeamLinkModalProps> = ({
  isOpen,
  onClose,
  teamId: _teamId,
  teamName = 'Your Team',
  onOpenManualAdd,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const teamSlug = nameToSlug(teamName || 'team');
  const updateUrl = `${window.location.origin}/#/update/player?team=${teamSlug}`;
  const whatsappShareText = `⚽ Official Squad Update: ${teamName} on Egerton Sports Network!\n\nPlease select your name and complete your squad profile details here:\n${updateUrl}\n\nUpdate your preferred squad name, phone number, playing position, and profile avatar.`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(updateUrl);
      setCopied(true);
      onShowToast('📋 Player update link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      onShowToast('Link: ' + updateUrl);
    }
  };

  const handleWhatsAppShare = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onShowToast('Opening WhatsApp to share update link...');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-[#ff0046]" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#14263b] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff0046]/10 flex items-center justify-center text-[#ff0046] shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                  Welcome Coach!
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Squad Profile Update
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Share this link with players in <strong className="text-slate-900 dark:text-white">{teamName}</strong> to update their squad information.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14263b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Explanation Card */}
        <div className="bg-slate-50/70 dark:bg-[#112236]/70 border border-slate-200/80 dark:border-[#1a2e45] rounded-xl p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#00b04f] font-bold">
            <Check className="w-4 h-4" />
            <span>Direct Team-Specific Player Squad Update</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
            Players access this link, select their name from the squad list, and update their preferred squad name, phone number, playing position, and profile avatar directly.
          </p>
        </div>

        {/* Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Team Squad Update Link
          </label>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={updateUrl}
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none px-2 select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-slate-900 dark:bg-[#152a40] hover:bg-slate-800 dark:hover:bg-[#1c3857] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00b04f]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100 dark:border-[#14263b]">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex-1 px-4 py-2.5 bg-[#00b04f] hover:bg-[#009944] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Share via WhatsApp</span>
          </button>

          {onOpenManualAdd && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenManualAdd();
              }}
              className="px-4 py-2.5 bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Manually</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareTeamLinkModal;
