import React, { useState } from 'react';
import { CheckCircle2, BarChart2, Send } from 'lucide-react';
import { banterService } from '../../../services/predictions/banterService';
import { anonymousIdentityService } from '../../../services/predictions/anonymousIdentityService';
import type { BanterPoll } from '../../../types/predictions';

interface XPollWidgetProps {
  poll: BanterPoll;
  onPollUpdated?: (poll: BanterPoll) => void;
}

export const XPollWidget: React.FC<XPollWidgetProps> = ({ poll: initialPoll, onPollUpdated }) => {
  const [poll, setPoll] = useState<BanterPoll>(initialPoll);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [isSubmittingReason, setIsSubmittingReason] = useState(false);
  const [reasonSubmitted, setReasonSubmitted] = useState(false);

  const deviceId = anonymousIdentityService.getIdentity().deviceId;
  const userVotedOptionId = poll.voters ? poll.voters[deviceId] : undefined;
  const hasVoted = userVotedOptionId !== undefined;
  const totalVotes = poll.totalVotes || 0;

  const handleVote = async (e: React.MouseEvent, optionId: number) => {
    e.stopPropagation();
    if (hasVoted || isVoting) return;

    setIsVoting(true);
    setError(null);
    try {
      const res = await banterService.votePoll(poll.id, optionId, deviceId);
      setPoll(res.poll);
      if (onPollUpdated) onPollUpdated(res.poll);
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleShareReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText.trim() || isSubmittingReason) return;

    setIsSubmittingReason(true);
    try {
      const selectedOpt = poll.options.find((o) => o.id === userVotedOptionId);
      const prefix = selectedOpt ? `[Voted: ${selectedOpt.text}] ` : '';
      await banterService.createReply(poll.postId, `${prefix}${reasonText.trim()}`);
      setReasonSubmitted(true);
    } catch {
      setReasonSubmitted(true);
    } finally {
      setIsSubmittingReason(false);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="my-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2.5 max-w-full"
    >
      {poll.question && (
        <p className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
          <BarChart2 className="h-4 w-4 text-sky-400 shrink-0" />
          <span>{poll.question}</span>
        </p>
      )}

      {error && (
        <p className="text-xs text-rose-400 font-medium">{error}</p>
      )}

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const votes = opt.votes || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isUserPick = userVotedOptionId === opt.id;

          if (hasVoted) {
            // Post-vote state with progress bars
            return (
              <div
                key={opt.id}
                className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 flex items-center justify-between"
              >
                {/* Visual percentage fill bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                    isUserPick ? 'bg-sky-500/25 border-r border-sky-500/40' : 'bg-zinc-800/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />

                <div className="relative z-1 flex items-center gap-2 min-w-0 pr-2">
                  {isUserPick && (
                    <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                  )}
                  <span className={`text-xs truncate ${isUserPick ? 'font-black text-white' : 'font-medium text-zinc-300'}`}>
                    {opt.text}
                  </span>
                </div>

                <span className="relative z-1 text-xs font-mono font-bold text-zinc-400 shrink-0">
                  {pct}%
                </span>
              </div>
            );
          }

          // Pre-vote state: selectable pill buttons
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isVoting}
              onClick={(e) => handleVote(e, opt.id)}
              className="w-full text-left px-3.5 py-2.5 rounded-xl border border-sky-500/30 hover:border-sky-500 hover:bg-sky-500/10 text-xs font-bold text-sky-400 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between"
            >
              <span className="truncate">{opt.text}</span>
              <span className="text-[10px] text-zinc-500 font-normal">Vote</span>
            </button>
          );
        })}
      </div>

      {/* Optional Reason input appearing immediately below selected poll */}
      {hasVoted && (
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 animate-fadeIn space-y-2">
          {!reasonSubmitted ? (
            <form onSubmit={handleShareReason} className="flex items-center gap-1.5">
              <input
                type="text"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Why did you pick this? (optional)..."
                className="flex-1 bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition"
                maxLength={180}
              />
              <button
                type="submit"
                disabled={!reasonText.trim() || isSubmittingReason}
                className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Share</span>
                <Send className="h-3 w-3" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Reason shared in discussion!</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 font-mono">
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        <span>24h Community Poll</span>
      </div>
    </div>
  );
};
