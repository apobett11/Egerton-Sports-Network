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

interface PollReplyItem {
  id: string;
  optionId: number;
  authorName: string;
  text: string;
  createdAt: string;
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
  const [pollReplies, setPollReplies] = useState<PollReplyItem[]>([]);
  const [expandedRepliesOption, setExpandedRepliesOption] = useState<number | null>(null);

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

  // Load saved replies and submitted reason for this poll
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`egerscore_poll_replies_${poll.id}`);
      if (raw) {
        setPollReplies(JSON.parse(raw));
      } else {
        // Seed initial friendly replies for options if available
        const seeds: PollReplyItem[] = [];
        if (poll.options.length >= 2) {
          seeds.push({
            id: `seed-1-${poll.id}`,
            optionId: poll.options[0].id,
            authorName: 'Tactical Mind',
            text: `Clear winner for me based on recent form!`,
            createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
          });
          seeds.push({
            id: `seed-2-${poll.id}`,
            optionId: poll.options[1].id,
            authorName: 'Campus Pundit',
            text: `Underdogs always turn up in this fixture.`,
            createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
          });
        }
        setPollReplies(seeds);
      }

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
  const totalVotes = Math.max(poll.totalVotes || 0, hasVoted ? 1 : 0);

  const handleVote = async (e: React.MouseEvent, optionId: number) => {
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
    setExpandedRepliesOption(optionId);

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

      const newReplyItem: PollReplyItem = {
        id: `reply-${Date.now()}`,
        optionId,
        authorName: session?.authorName || 'You',
        text: textVal,
        createdAt: new Date().toISOString(),
      };

      const updatedReplies = [newReplyItem, ...pollReplies];
      setPollReplies(updatedReplies);
      const updatedSubmissions = { ...submittedReasons, [optionId]: textVal };
      setSubmittedReasons(updatedSubmissions);

      try {
        localStorage.setItem(`egerscore_poll_replies_${poll.id}`, JSON.stringify(updatedReplies));
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
        {poll.options.map((opt) => {
          const isUserPick = userVotedOptionId === opt.id;
          let votes = opt.votes || 0;
          if (hasVoted && isUserPick && votes === 0 && (poll.totalVotes || 0) === 0) {
            votes = 1;
          }
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const optReplies = pollReplies.filter(r => r.optionId === opt.id);

          const isWithin5Minutes = !!(voteTimestamp && Date.now() - voteTimestamp <= 5 * 60 * 1000);
          // Optional reply prompt ONLY upon active vote selection in current session within 5m (NEVER on message load or page reload)
          const showReplyPrompt = hasVoted && isUserPick && activeReplyOptionId === opt.id && isWithin5Minutes && !submittedReasons[opt.id];
          const showOptionReplies = expandedRepliesOption === opt.id && !showReplyPrompt;

          return (
            <React.Fragment key={opt.id}>
              {/* Poll Option Row */}
              {hasVoted ? (
                // Post-vote State: Highlighted with blue border if selected
                <button
                  type="button"
                  onClick={() => setExpandedRepliesOption(prev => prev === opt.id ? null : opt.id)}
                  className={`w-full text-left relative overflow-hidden rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                    isUserPick
                      ? 'border-2 border-[#1d9bf0] bg-zinc-900 shadow-md ring-2 ring-[#1d9bf0]/20'
                      : 'border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                  title="Click to view replies for this option"
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
                    {optReplies.length > 0 && (
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                        <MessageCircle className="h-3 w-3 text-sky-400" />
                        <span>{optReplies.length}</span>
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      {pct}%
                    </span>
                  </div>
                </button>
              ) : (
                // Pre-vote State
                <button
                  type="button"
                  disabled={isVoting}
                  onClick={(e) => handleVote(e, opt.id)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl border border-sky-500/30 hover:border-sky-500 hover:bg-sky-500/10 text-xs font-bold text-sky-400 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between"
                >
                  <span className="truncate">{opt.text}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Vote</span>
                </button>
              )}

              {/* IMMEDIATELY BELOW THE SELECTED OPTION: Optional Reply Input only upon active selection within 5m */}
              {showReplyPrompt && (
                <div
                  className="rounded-xl border-2 border-[#1d9bf0] bg-zinc-900/90 p-3 shadow-lg animate-fadeIn space-y-2.5"
                  data-testid="poll-inline-reply-container"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Reason / Reply for "{opt.text}" (Optional)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveReplyOptionId(null)}
                      className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition cursor-pointer"
                      title="Skip reply"
                    >
                      Skip
                    </button>
                  </div>

                  {/* Input highlighted with blue border and placeholder - no autoFocus to prevent viewport jumping */}
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

                  {/* Fan Replies for this Option */}
                  {optReplies.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                        Option Replies ({optReplies.length})
                      </span>
                      {optReplies.map((rep) => (
                        <div key={rep.id} className="text-xs bg-black/40 rounded-lg p-2 border border-zinc-800/80">
                          <span className="font-bold text-white text-[11px] block">{rep.authorName}:</span>
                          <p className="text-zinc-300 italic">{rep.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Option replies and user's saved reason on click toggle */}
              {hasVoted && showOptionReplies && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-2.5 shadow-md animate-fadeIn space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-sky-400" />
                      <span>Replies for "{opt.text}" ({optReplies.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedRepliesOption(null)}
                      className="text-[10px] text-zinc-500 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-zinc-800 transition"
                    >
                      Hide
                    </button>
                  </div>

                  {/* User's submitted reason if present */}
                  {submittedReasons[opt.id] && (
                    <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/25 text-xs text-sky-200">
                      <span className="text-[10px] font-bold text-emerald-400 block mb-0.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Your Reason
                      </span>
                      <p className="italic">"{submittedReasons[opt.id]}"</p>
                    </div>
                  )}

                  {optReplies.length === 0 && !submittedReasons[opt.id] ? (
                    <p className="text-[11px] text-zinc-500 italic">No replies yet for this option.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {optReplies.map((rep) => (
                        <div key={rep.id} className="text-xs bg-black/40 rounded-lg p-2 border border-zinc-800">
                          <span className="font-bold text-white text-[11px] block">{rep.authorName}:</span>
                          <p className="text-zinc-300 italic">{rep.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 font-mono">
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        <span>24h Community Poll</span>
      </div>
    </div>
  );
};
