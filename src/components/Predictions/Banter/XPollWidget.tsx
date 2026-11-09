import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, BarChart2, Send } from 'lucide-react';
import { banterService } from '../../../services/predictions/banterService';
import { anonymousIdentityService } from '../../../services/predictions/anonymousIdentityService';
import { getActiveSessionProfile, getOrCreatePermanentDeviceId } from '../../../utils/sessionIdentity';
import type { BanterPoll } from '../../../types/predictions';

interface XPollWidgetProps {
  poll: BanterPoll;
  onPollUpdated?: (poll: BanterPoll) => void;
}

const getStoredUserVote = (pollId: string): number | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(`egerscore_poll_voted_${pollId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'number') return parsed;
      if (parsed?.optionId !== undefined) return Number(parsed.optionId);
    }
    const legacy = localStorage.getItem(`banter_poll_voted_${pollId}`);
    if (legacy) {
      const parsed = parseInt(legacy, 10);
      if (!isNaN(parsed)) return parsed;
    }
    const votedMapRaw = localStorage.getItem('egerscore_voted_polls');
    if (votedMapRaw) {
      const votedMap = JSON.parse(votedMapRaw);
      if (votedMap && votedMap[pollId] !== undefined) {
        return Number(votedMap[pollId]);
      }
    }
  } catch {}
  return undefined;
};

export const XPollWidget: React.FC<XPollWidgetProps> = ({ poll: initialPoll, onPollUpdated }) => {
  const [poll, setPoll] = useState<BanterPoll>(initialPoll);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [isSubmittingReason, setIsSubmittingReason] = useState(false);
  const [reasonSubmitted, setReasonSubmitted] = useState(false);
  const [submittedReasonText, setSubmittedReasonText] = useState('');

  const session = getActiveSessionProfile();
  const permanentDeviceId = typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : '';
  const deviceId = session?.deviceId || permanentDeviceId || anonymousIdentityService.getIdentity().deviceId;

  const candidateDeviceIds = useMemo(() => {
    return [
      deviceId,
      session?.deviceId,
      permanentDeviceId,
      typeof window !== 'undefined' ? localStorage.getItem('esn_device_id') : null,
      typeof window !== 'undefined' ? localStorage.getItem('esn_permanent_device_id') : null,
      anonymousIdentityService.getIdentity().deviceId,
    ].filter(Boolean) as string[];
  }, [deviceId, session?.deviceId, permanentDeviceId]);

  // Sync state if initialPoll changes from parent, keeping existing local voters intact
  useEffect(() => {
    setPoll(prev => {
      const mergedVoters = { ...(prev.voters || {}), ...(initialPoll.voters || {}) };
      return {
        ...initialPoll,
        voters: mergedVoters,
        totalVotes: Math.max(initialPoll.totalVotes || 0, Object.keys(mergedVoters).length)
      };
    });
  }, [initialPoll]);

  // Determine if this device has already voted
  const userVotedOptionId = useMemo(() => {
    const stored = getStoredUserVote(poll.id);
    if (stored !== undefined) return stored;
    if (poll.voters) {
      for (const dId of candidateDeviceIds) {
        if (poll.voters[dId] !== undefined) {
          return Number(poll.voters[dId]);
        }
      }
    }
    return undefined;
  }, [poll.id, poll.voters, candidateDeviceIds]);

  const hasVoted = userVotedOptionId !== undefined;
  const totalVotes = Math.max(poll.totalVotes || 0, hasVoted ? 1 : 0);

  const handleVote = async (e: React.MouseEvent, optionId: number) => {
    e.stopPropagation();
    if (hasVoted || isVoting) return;

    const userVoterId = deviceId;
    const updatedOptions = poll.options.map(o => o.id === optionId ? { ...o, votes: (o.votes || 0) + 1 } : o);
    const updatedTotalVotes = (poll.totalVotes || 0) + 1;
    const optimisticPoll: BanterPoll = {
      ...poll,
      options: updatedOptions,
      totalVotes: updatedTotalVotes,
      voters: { ...(poll.voters || {}), [userVoterId]: optionId }
    };
    setPoll(optimisticPoll);
    if (onPollUpdated) onPollUpdated(optimisticPoll);

    // Persist immediately to localStorage so this device permanently remembers it has voted
    try {
      localStorage.setItem(`egerscore_poll_voted_${poll.id}`, JSON.stringify({ optionId, deviceId, votedAt: Date.now() }));
      localStorage.setItem(`banter_poll_voted_${poll.id}`, String(optionId));
      const votedMapRaw = localStorage.getItem('egerscore_voted_polls');
      const votedMap = votedMapRaw ? JSON.parse(votedMapRaw) : {};
      votedMap[poll.id] = optionId;
      localStorage.setItem('egerscore_voted_polls', JSON.stringify(votedMap));
    } catch {}

    setIsVoting(true);
    setError(null);
    try {
      const res = await banterService.votePoll(poll.id, optionId, deviceId);
      setPoll(res.poll);
      if (onPollUpdated) onPollUpdated(res.poll);
    } catch (err: any) {
      if (!err.message?.includes('already voted')) {
        setError(err.message || 'Failed to submit vote');
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleShareReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText.trim() || isSubmittingReason) return;

    const val = reasonText.trim();
    setIsSubmittingReason(true);
    setSubmittedReasonText(val);
    try {
      const selectedOpt = poll.options.find((o) => o.id === userVotedOptionId);
      const prefix = selectedOpt ? `[Voted: ${selectedOpt.text}] ` : '';
      await banterService.createReply(poll.postId, `${prefix}${val}`);
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
          const isUserPick = userVotedOptionId === opt.id;
          let votes = opt.votes || 0;
          if (hasVoted && isUserPick && votes === 0 && (poll.totalVotes || 0) === 0) {
            votes = 1;
          }
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

          if (hasVoted) {
            // Post-vote state with progress bars
            return (
              <button
                key={opt.id}
                type="button"
                disabled={true}
                className="w-full text-left relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 flex items-center justify-between cursor-default"
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
              </button>
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
          {reasonSubmitted ? (
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-200 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Your reason (posted as reply in discussion):</span>
              </div>
              <p className="text-zinc-200 leading-relaxed italic">"{submittedReasonText || reasonText}"</p>
            </div>
          ) : (
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
