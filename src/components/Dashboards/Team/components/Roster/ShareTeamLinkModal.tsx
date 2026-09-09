import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Shield, UserPlus } from 'lucide-react';

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
  teamId,
  teamName = 'Your Team',
  onOpenManualAdd,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const registrationUrl = `${window.location.origin}/#/register/player?teamId=${teamId}`;
  const whatsappShareText = `⚽ Official Invitation: Join ${teamName} on Egerton Sports Network!\n\nPlease complete your player registration directly here:\n${registrationUrl}\n\nYour profile will be automatically linked to our squad.`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      onShowToast('📋 Registration link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      onShowToast('Link: ' + registrationUrl);
    }
  };

  const handleWhatsAppShare = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onShowToast('Opening WhatsApp to share registration link...');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-2xl overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#ff0046]/15 flex items-center justify-center text-[#ff0046] shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Welcome Coach!
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Squad Onboarding
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Onboard players for <strong className="text-slate-900 dark:text-white">{teamName}</strong> via your custom link.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Explanation */}
        <div className="bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[#00b04f] font-bold">
            <Check className="w-3.5 h-3.5" />
            <span>Direct Team-Specific Player Registration</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            Players registering through this link are automatically assigned to <strong className="text-slate-900 dark:text-white">{teamName}</strong> and appear in your squad list.
          </p>
        </div>

        {/* Link Box */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Team Registration Link
          </label>
          <div className="flex items-center gap-2 bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm p-1.5">
            <input
              type="text"
              readOnly
              value={registrationUrl}
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none px-2 select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1 bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00b04f]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#e6e8ec] dark:border-[#1a2e45]">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex-1 px-4 py-2 bg-[#00b04f] hover:bg-[#009944] text-white text-xs font-black rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
              className="px-4 py-2 bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-black rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Manually</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450] text-xs font-bold rounded-full transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareTeamLinkModal;
