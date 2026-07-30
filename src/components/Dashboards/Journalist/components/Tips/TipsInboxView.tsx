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
    <div className={`p-6 rounded-2xl border ${cardBg} space-y-6 shadow-xl`}>
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[#148A54]" /> Anonymous Tips Inbox ({tips.length})
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Encrypted anonymous whistleblower submissions from campus sports network.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {tips.map((tip) => (
          <div key={tip.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-[10px] uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded">
                Source: {tip.sourceCategory}
              </span>
              <span className="text-gray-400 font-mono text-[10px]">{tip.timestamp}</span>
            </div>

            <h4 className="font-black text-sm text-slate-900 dark:text-white">{tip.matchContext || 'Whistleblower Scoop'}</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{tip.tipText}</p>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
              <span className="text-[11px] font-bold text-gray-400">
                Status: <strong className="text-emerald-500">{tip.isSaved ? 'Claimed' : 'Unclaimed'}</strong>
              </span>

              <div className="flex items-center gap-2">
                {!tip.isSaved && (
                  <button
                    onClick={() => handleClaimTip(tip.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 cursor-pointer"
                  >
                    Claim Tip
                  </button>
                )}
                <button
                  onClick={() => handleConvertTipToDraft(tip)}
                  className="px-3 py-1.5 rounded-lg bg-[#148A54] text-white font-black text-xs hover:bg-[#107244] flex items-center gap-1 cursor-pointer"
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
