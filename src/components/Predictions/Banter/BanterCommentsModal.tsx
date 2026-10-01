import React, { useState, useEffect } from 'react';
import { X, MessageSquare, AlertCircle, User, ArrowLeft, BarChart2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatRelativeTime } from '../../../lib/predictions/utils';
import { banterService } from '../../../services/predictions/banterService';
import { BANTER_CONFIG } from '../../../lib/predictions/constants';
import type { BanterPost, BanterComment, ReactionType } from '../../../types/predictions';

interface BanterCommentsModalProps {
  post: BanterPost;
  onClose: () => void;
  onCommentAdded?: () => void;
  onToggleReaction?: (postId: string, type: ReactionType) => void;
}

export const BanterCommentsModal: React.FC<BanterCommentsModalProps> = ({
  post,
  onClose,
  onCommentAdded,
  onToggleReaction,
}) => {
  const [comments, setComments] = useState<BanterComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    banterService.fetchComments(post.id).then(res => {
      if (mounted) {
        setComments(res);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [post.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const added = await banterService.addComment(post.id, commentText);
      setComments(prev => [...prev, added]);
      setCommentText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isJournalist = post.authorType === 'journalist';
  const cleanHandle = post.authorHandle.toLowerCase().replace(/[^a-z0-9]/g, '_');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex flex-col h-[85vh] w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0e1c2b] text-white tactical-modal-shadow overflow-hidden">
        {/* Header - Back / Close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0b1624]">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Feed</span>
          </button>
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Reply to this take
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Area: Original Post + Flat Replies */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Main Original Tweet */}
          <div className="rounded-xl bg-[#081018] p-4 border border-slate-800">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1d9bf0]/20 via-[#152a40] to-[#ff0046]/20 border border-slate-700 text-white font-bold text-xs">
                {isJournalist ? (
                  <ShieldCheck className="h-5 w-5 text-[#ff0046]" />
                ) : (
                  <User className="h-5 w-5 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-sm">{post.authorHandle}</span>
                  {isJournalist ? (
                    <span className="rounded-full bg-[#ff0046]/20 px-1.5 py-0.2 text-[9px] font-black uppercase text-[#ff0046] border border-[#ff0046]/40">
                      DESK
                    </span>
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-[#1d9bf0]" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">@{cleanHandle} • {formatRelativeTime(post.createdAt)}</span>
              </div>
            </div>

            {post.matchContext && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 rounded bg-[#14263b] px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-[#16283d]">
                  ⚽ {post.matchContext.homeTeamName} vs {post.matchContext.awayTeamName}
                </span>
              </div>
            )}

            <p className="text-sm text-slate-100 leading-relaxed break-words">{post.content}</p>

            {post.imageUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-700/80 max-h-72 bg-black/40">
                <img src={post.imageUrl} alt="Banter media" className="w-full h-auto object-cover max-h-72 rounded-lg" />
              </div>
            )}

            {/* Reactions & Impressions bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                  🔥 {post.reactionFireCount}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                  🤡 {post.reactionClownCount}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                  💀 {post.reactionSkullCount}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <BarChart2 className="h-3.5 w-3.5" />
                <span>{post.impressionsCount || 850} Views</span>
              </div>
            </div>
          </div>

          {/* Replies Section Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[#ff0046]" />
              {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
            </span>
          </div>

          {/* Flat List of Replies (No nested replies for now) */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
                Loading replies...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No replies yet. Be the first.
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="rounded-xl bg-[#08121c] p-3 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <div className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                        <User className="h-3 w-3 text-slate-400" />
                      </div>
                      <span>{c.authorHandle}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{formatRelativeTime(c.createdAt)}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed break-words pl-6.5">{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-[#0b1624]">
          {errorMsg && (
            <div className="mb-2 flex items-center gap-1 text-xs text-[#ff0046]">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              maxLength={BANTER_CONFIG.MAX_COMMENT_CHARS}
              onChange={e => setCommentText(e.target.value)}
              placeholder={`Reply to @${cleanHandle}`}
              className="flex-1 rounded-xl border border-slate-700 bg-[#081018] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#1d9bf0] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                commentText.trim() && !isSubmitting
                  ? 'bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
