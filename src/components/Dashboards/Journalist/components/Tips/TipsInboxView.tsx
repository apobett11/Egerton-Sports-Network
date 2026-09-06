import React from 'react';
import { Inbox, FileText } from 'lucide-react';
import type { AnonymousTip } from '../../JournalistTypes';

interface TipsInboxViewProps {
  cardBg: string;
  tips: AnonymousTip[];
  handleClaimTip: (id: string) => void;
  handleConvertTipToDraft: (tip: AnonymousTip) => void;
}

export const TipsInboxView: React.FC<TipsInboxViewProps> = ({
  cardBg,
  tips,
  handleClaimTip,
  handleConvertTipToDraft,
}) => {
  return (
    <div className={`p-4 sm:p-6 rounded-none sm:rounded-sm border ${cardBg} space-y-5 shadow-xs`}>
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#1a2e45] pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
            <Inbox className="w-5 h-5 text-[#ff0046]" /> Anonymous Tips Inbox ({tips.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Encrypted anonymous whistleblower submissions from campus sports network.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tips.map((tip) => (
          <div key={tip.id} className="p-4 rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] space-y-3 text-xs shadow-xs">
            <div className="flex items-center justify-between">
              <span className="bg-[#14263b] text-slate-300 border border-[#223b56] text-[10px] font-bold uppercase tracking-wider rounded-sm px-2 py-0.5">
                Source: {tip.sourceCategory}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">{tip.timestamp}</span>
            </div>

            <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">{tip.matchContext || 'Whistleblower Scoop'}</h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{tip.tipText}</p>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-[#14263b]">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Status: <strong className={tip.isSaved ? 'text-[#ff0046]' : 'text-amber-500'}>{tip.isSaved ? 'Claimed' : 'Unclaimed'}</strong>
              </span>

              <div className="flex items-center gap-2">
                {!tip.isSaved && (
                  <button
                    onClick={() => handleClaimTip(tip.id)}
                    className="px-3 py-1.5 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                  >
                    Claim Tip
                  </button>
                )}
                <button
                  onClick={() => handleConvertTipToDraft(tip)}
                  className="px-3 py-1.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Convert to Article Draft
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
