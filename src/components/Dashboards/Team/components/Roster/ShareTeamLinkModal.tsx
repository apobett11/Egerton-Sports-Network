import React, { useState } from 'react';
import { X, Copy, Check, Share2, UserPlus, MessageCircle, Sparkles, Shield } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#161B22] border border-[#2A3441] rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#2A3441] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Welcome Coach!</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  0 Players Registered
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Onboard your squad for <span className="text-emerald-400 font-bold">{teamName}</span> via your team link.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#0D1117] border border-[#2A3441] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative explanation */}
        <div className="bg-[#0D1117] border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Direct Team-Specific Player Registration</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11.5px]">
            Players registering through your custom team link are automatically assigned the <span className="text-white font-semibold">Player</span> role, linked to <span className="text-emerald-300 font-semibold">{teamName}</span>, and displayed immediately in your squad roster.
          </p>
        </div>

        {/* Link Box */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">Your Team Registration Link</label>
          <div className="flex items-center gap-2 bg-[#0D1117] border border-[#2A3441] rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={registrationUrl}
              className="flex-1 bg-transparent text-xs text-slate-200 font-mono focus:outline-none px-2 select-all"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Direct Share Button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 fill-white text-transparent" />
            <span>Share to Players via WhatsApp Direct</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onClose();
                if (onOpenManualAdd) onOpenManualAdd();
              }}
              className="py-2.5 px-3 bg-[#0D1117] hover:bg-[#1C2331] border border-[#2A3441] text-slate-300 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Add Player Manually</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-3 bg-[#0D1117] hover:bg-[#1C2331] border border-[#2A3441] text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer transition-all"
            >
              <span>Maybe Later</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
