import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, BarChart2, Send, MessageCircle } from 'lucide-react';
import { banterService } from '../../../services/predictions/banterService';
import { anonymousIdentityService } from '../../../services/predictions/anonymousIdentityService';
import { getActiveSessionProfile, getOrCreatePermanentDeviceId } from '../../../utils/sessionIdentity';
import type { BanterPoll } from '../../../types/predictions';

interface XPollWidgetProps {
  poll: BanterPoll;
  onPollUpdated?: (poll: BanterPoll) => void;
}

export function getPollBaseline(
  pollId: string,
  optionsCount: number,
  createdAt?: string | number | Date
): { baseTotal: number; optionShares: number[] } {
  let hash = 0;
  for (let i = 0; i < pollId.length; i++) {
    hash = (hash << 5) - hash + pollId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Saturation window between 8h (28,800s) and 15h (54,000s)
  const windowSec = 28800 + (positiveHash % 25201);
  const t0 = windowSec * 0.45;
  const k = 10.0 / windowSec;

  const createdTs = createdAt ? new Date(createdAt).getTime() : Date.now();
  const ageSeconds = Math.max(0, (Date.now() - createdTs) / 1000);

  // Strict start at 1 vote at age <= 5 seconds (fresh poll)
  if (ageSeconds <= 5) {
    const optionShares = Array.from({ length: optionsCount }, (_, idx) => (idx === 0 ? 1 : 0));
    return { baseTotal: 1, optionShares };
  }

  // Normalized Sigmoid S-Curve
  const clampU = (u: number) => Math.min(30.0, Math.max(-30.0, u));
  const f0 = 1.0 / (1.0 + Math.exp(clampU(-k * (0.0 - t0))));
  const fT = 1.0 / (1.0 + Math.exp(clampU(-k * (windowSec - t0))));
  const ft = 1.0 / (1.0 + Math.exp(clampU(-k * (ageSeconds - t0))));

  let sNorm = (ft - f0) / (fT - f0);
  sNorm = Math.min(1.0, Math.max(0.0, sNorm));

  // Micro-jitter smoothly faded in after 15 minutes (900s)
  let microJitter = 0.0;
  if (ageSeconds > 900.0) {
    const fade = Math.min(1.0, (ageSeconds - 900.0) / 900.0);
    microJitter = fade * Math.sin(ageSeconds / 900.0 + (positiveHash % 6283) / 1000.0) * 1.5;
  }

  const targetTotal = 54 + (positiveHash % 127); // 54 - 180 votes ceiling
  const simulatedVotes = Math.max(0, Math.floor((targetTotal - 1) * sNorm + microJitter));
  const baseTotal = 1 + simulatedVotes; // Starts at 1 and climbs smoothly with sigmoid curve

  if (optionsCount <= 1) {
    return { baseTotal, optionShares: [baseTotal] };
  }

  if (optionsCount === 2) {
    const splitPct = 42 + (positiveHash % 22); // 42% - 63%
    const votes1 = Math.max(1, Math.round((baseTotal * splitPct) / 100));
    const votes2 = Math.max(0, baseTotal - votes1);
    return { baseTotal, optionShares: [votes1, votes2] };
  }

  const rawWeights = Array.from({ length: optionsCount }, (_, idx) => 15 + ((positiveHash + idx * 37) % 50));
  const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
  let allocated = 0;
  const optionShares = rawWeights.map((w, idx) => {
    if (idx === optionsCount - 1) {
      return Math.max(0, baseTotal - allocated);
    }
    const val = Math.max(idx === 0 ? 1 : 0, Math.round((baseTotal * w) / totalWeight));
    allocated += val;
    return val;
  });

  return { baseTotal, optionShares };
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

  // Per-option reply inputs and submissions
  const [reasonInputs, setReasonInputs] = useState<Record<number, string>>({});
  const [isSubmittingReason, setIsSubmittingReason] = useState<Record<number, boolean>>({});
  const [submittedReasons, setSubmittedReasons] = useState<Record<number, string>>({});

  // Active reply option: only set immediately when user votes in the current session (never restored on reload/mount)
  const [activeReplyOptionId, setActiveReplyOptionId] = useState<number | null>(null);
  const [voteTimestamp, setVoteTimestamp] = useState<number | null>(null);

  // 5-minute window rule: cannot add a reply after 5 minutes of selection
  useEffect(() => {
    if (!activeReplyOptionId || !voteTimestamp) return;

    const remainingMs = Math.max(0, 5 * 60 * 1000 - (Date.now() - voteTimestamp));
    if (remainingMs === 0) {
      setActiveReplyOptionId(null);
      return;
    }

    const timer = setTimeout(() => {
      setActiveReplyOptionId(null);
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [activeReplyOptionId, voteTimestamp]);

  const session = getActiveSessionProfile();
  const permanentDeviceId = typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : '';
  const deviceId = permanentDeviceId || session?.deviceId || anonymousIdentityService.getIdentity().deviceId;

  const candidateDeviceIds = useMemo(() => {
    return [
      permanentDeviceId,
      deviceId,
      session?.deviceId,
      typeof window !== 'undefined' ? localStorage.getItem('esn_permanent_device_id') : null,
      typeof window !== 'undefined' ? localStorage.getItem('esn_device_id') : null,
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

  // Load saved submitted reasons for this poll
  useEffect(() => {
    try {
      const submittedRaw = localStorage.getItem(`egerscore_poll_my_reasons_${poll.id}`);
      const initialSubmissions = submittedRaw ? JSON.parse(submittedRaw) : {};
      const singleReason = localStorage.getItem(`egerscore_poll_reason_${poll.id}`);
      if (singleReason) {
        // Map single reason across voted options
        poll.options.forEach(o => {
          if (!initialSubmissions[o.id]) initialSubmissions[o.id] = singleReason;
        });
      }
      setSubmittedReasons(initialSubmissions);
    } catch {}
  }, [poll.id, poll.options]);

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

  // Baseline community engagement climbing smoothly from 1 vote following the sigmoid adoption curve
  const baseline = useMemo(() => {
    return getPollBaseline(
      poll.id || 'poll-default',
      poll.options.length,
      poll.createdAt || poll.created_at
    );
  }, [poll.id, poll.options.length, poll.createdAt, poll.created_at]);

  const effectiveOptionVotes = useMemo(() => {
    return poll.options.map((opt, idx) => {
      const base = baseline.optionShares[idx] || 0;
      const actual = opt.votes || 0;
      return base + actual;
    });
  }, [poll.options, baseline]);

  const effectiveTotalVotes = useMemo(() => {
    const sum = effectiveOptionVotes.reduce((a, b) => a + b, 0);
    return Math.max(baseline.baseTotal, sum);
  }, [effectiveOptionVotes, baseline.baseTotal]);

  const optionPcts = useMemo(() => {
    return effectiveOptionVotes.map((v) =>
      effectiveTotalVotes > 0 ? Math.round((v / effectiveTotalVotes) * 100) : 0
    );
  }, [effectiveOptionVotes, effectiveTotalVotes]);

  const handleVote = async (e: React.MouseEvent, optionId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVoted || isVoting) return;

    const now = Date.now();
    const userVoterId = permanentDeviceId || deviceId;
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

    // Prompt for optional reply right after active selection in this session within 5m
    setActiveReplyOptionId(optionId);
    setVoteTimestamp(now);

    // Persist immediately to localStorage so this device permanently remembers it has voted
    try {
      localStorage.setItem(`egerscore_poll_voted_${poll.id}`, JSON.stringify({ optionId, deviceId: userVoterId, votedAt: now }));
      localStorage.setItem(`banter_poll_voted_${poll.id}`, String(optionId));
      const votedMapRaw = localStorage.getItem('egerscore_voted_polls');
      const votedMap = votedMapRaw ? JSON.parse(votedMapRaw) : {};
      votedMap[poll.id] = optionId;
      localStorage.setItem('egerscore_voted_polls', JSON.stringify(votedMap));
    } catch {}

    setIsVoting(true);
    setError(null);
    try {
      const res = await banterService.votePoll(poll.id, optionId, userVoterId);
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

  const handleShareReasonForOption = async (e: React.FormEvent, optionId: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Enforce 5-minute limit from selection
    if (voteTimestamp && Date.now() - voteTimestamp > 5 * 60 * 1000) {
      setActiveReplyOptionId(null);
      return;
    }

    const textVal = (reasonInputs[optionId] || '').trim();
    if (!textVal || isSubmittingReason[optionId]) return;

    setIsSubmittingReason(prev => ({ ...prev, [optionId]: true }));
    try {
      const selectedOpt = poll.options.find((o) => o.id === optionId);
      const prefix = selectedOpt ? `[Voted: ${selectedOpt.text}] ` : '';
      await banterService.createReply(poll.postId, `${prefix}${textVal}`);

      const updatedSubmissions = { ...submittedReasons, [optionId]: textVal };
      setSubmittedReasons(updatedSubmissions);

      try {
        localStorage.setItem(`egerscore_poll_my_reasons_${poll.id}`, JSON.stringify(updatedSubmissions));
        localStorage.setItem(`egerscore_poll_reason_${poll.id}`, textVal);
      } catch {}

      // Clear input and close active reply prompt
      setReasonInputs(prev => ({ ...prev, [optionId]: '' }));
      setActiveReplyOptionId(null);
    } catch (err) {
      console.warn('Poll reply deferred:', err);
    } finally {
      setIsSubmittingReason(prev => ({ ...prev, [optionId]: false }));
    }
  };

  return (
    <div
      data-poll-widget
      data-testid="poll-widget"
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

      {/* Sequential Poll Options with Inline Highlighted Input Immediately Below Selected Option */}
      <div className="space-y-2">
        {poll.options.map((opt, idx) => {
          const isUserPick = userVotedOptionId === opt.id;
          const pct = optionPcts[idx] !== undefined ? optionPcts[idx] : 0;

          const isWithin5Minutes = !!(voteTimestamp && Date.now() - voteTimestamp <= 5 * 60 * 1000);
          // Optional reply prompt ONLY upon active vote selection in current session within 5m
          const showReplyPrompt = hasVoted && isUserPick && activeReplyOptionId === opt.id && isWithin5Minutes && !submittedReasons[opt.id];

          return (
            <React.Fragment key={opt.id}>
              {/* Poll Option Row */}
              {hasVoted ? (
                // Post-vote State: Highlighted with blue border if selected
                <div
                  className={`w-full text-left relative overflow-hidden rounded-xl p-2.5 flex items-center justify-between transition-all select-none ${
                    isUserPick
                      ? 'border-2 border-[#1d9bf0] bg-zinc-900 shadow-md ring-2 ring-[#1d9bf0]/20'
                      : 'border border-zinc-800 bg-zinc-900/60'
                  }`}
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

                  <div className="relative z-1 flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      {pct}%
                    </span>
                  </div>
                </div>
              ) : (
                // Pre-vote State
                <button
                  type="button"
                  disabled={isVoting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(e, opt.id);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl border border-sky-500/30 hover:border-sky-500 hover:bg-sky-500/10 text-xs font-bold text-sky-400 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between"
                >
                  <span className="truncate">{opt.text}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Vote</span>
                </button>
              )}

              {/* IMMEDIATELY BELOW THE SELECTED OPTION: Input for the user to add their reply */}
              {showReplyPrompt && (
                <div
                  className="rounded-xl border-2 border-[#1d9bf0] bg-zinc-900/90 p-3 shadow-lg animate-fadeIn space-y-2.5"
                  data-testid="poll-inline-reply-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Reason / Reply for "{opt.text}" (Optional)</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReplyOptionId(null);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition cursor-pointer"
                      title="Skip reply"
                    >
                      Skip
                    </button>
                  </div>

                  {/* Input form - submissions appear as separate comments under the message */}
                  <form onSubmit={(e) => handleShareReasonForOption(e, opt.id)} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={reasonInputs[opt.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReasonInputs(prev => ({ ...prev, [opt.id]: val }));
                      }}
                      placeholder={`Why did you pick ${opt.text}? Add your reply...`}
                      className="flex-1 bg-black/60 border border-sky-500/40 focus:border-sky-400 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition shadow-inner"
                      maxLength={180}
                    />
                    <button
                      type="submit"
                      disabled={!(reasonInputs[opt.id] || '').trim() || isSubmittingReason[opt.id]}
                      className="px-3 py-1.5 rounded-xl bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-40 disabled:hover:bg-[#1d9bf0] text-white text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    >
                      <span>Reply</span>
                      <Send className="h-3 w-3" />
                    </button>
                  </form>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 font-mono">
        <span>{effectiveTotalVotes} votes</span>
        <span>24h Community Poll</span>
      </div>
    </div>
  );
};
