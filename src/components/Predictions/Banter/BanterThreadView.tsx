import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  Bookmark,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Film,
  Shield,
  Send
} from 'lucide-react';
import { supabase } from '../../../lib/predictions/banterSupabase';
import { banterService } from '../../../services/predictions/banterService';
import { shareService } from '../../../services/predictions/shareService';
import { XPollWidget } from './XPollWidget';
import { BanterPostCard } from './BanterPostCard';
import type { BanterPost, ReactionType, BanterMediaType } from '../../../types/predictions';

interface BanterThreadViewProps {
  postId: string;
  onBack: () => void;
  onNavigatePost?: (postId: string) => void;
}

function formatFullTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `${time} · ${date}`;
  } catch {
    return dateStr;
  }
}

function formatTwitterMetric(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export const BanterThreadView: React.FC<BanterThreadViewProps> = ({
  postId,
  onBack,
  onNavigatePost
}) => {
  const [post, setPost] = useState<BanterPost | null>(null);
  const [ancestry, setAncestry] = useState<BanterPost[]>([]);
  const [replies, setReplies] = useState<BanterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [repostCount, setRepostCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [singleReplyText, setSingleReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [moreStories, setMoreStories] = useState<BanterPost[]>([]);
  const channelRef = useRef<any>(null);

  // Scroll to absolute top on mount / navigation: no auto-scroll to input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [postId]);

  const loadThread = useCallback(async () => {
    setIsLoading(true);
    const data = await banterService.fetchThread(postId);
    if (data.post) {
      setPost(data.post);
      setAncestry(data.ancestry);
      setReplies(data.replies);
      setLikeCount(data.post.reactionFireCount || data.post.likesCount || 0);
      setRepostCount(data.post.repostCount || data.post.repostsCount || 0);
      setLiked(Boolean(data.post.userReactions?.fire));
      setReposted(Boolean(data.post.isReposted));
    }
    try {
      const feedPosts = await banterService.fetchPosts('trending', null, 8);
      setMoreStories((feedPosts as BanterPost[]).filter((p: BanterPost) => p.id !== postId).slice(0, 3));
    } catch {
      // offline safe
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    loadThread();

    return () => {
      channelRef.current = null;
    };
  }, [postId, loadThread]);

  const handleToggleLike = async () => {
    if (!post) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(prev => prev + (nextLiked ? 1 : -1));
    await banterService.toggleReaction(post.id, 'fire');
  };

  const handleToggleRepost = () => {
    if (!post) return;
    const nextReposted = !reposted;
    setReposted(nextReposted);
    setRepostCount(prev => prev + (nextReposted ? 1 : -1));
  };

  const handleShare = () => {
    if (!post) return;
    shareService.shareTalk(post);
  };

  const handleCreateReply = async (
    content: string,
    mediaUrls?: string[],
    mediaType?: BanterMediaType,
    poll?: { question: string; options: string[] },
    taggedTeam?: { id: string; name: string } | null
  ) => {
    if (!post) return;

    // Optimistic Update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticItem: BanterPost = {
      id: optimisticId,
      parentId: post.id,
      rootId: post.rootId || post.id,
      depth: (post.depth || 0) + 1,
      content,
      mediaUrls,
      mediaType: mediaType || 'NONE',
      taggedTeamId: taggedTeam?.id || null,
      taggedTeamName: taggedTeam?.name || null,
      authorHandle: 'Me',
      authorName: 'Me',
      authorType: 'user',
      sourceType: 'user',
      reactionFireCount: 0,
      reactionClownCount: 0,
      reactionSkullCount: 0,
      commentCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
    };

    setReplies(prev => [...prev, optimisticItem]);
    setPost((current: BanterPost | null) => current ? { ...current, commentCount: current.commentCount + 1, repliesCount: (current.repliesCount || 0) + 1 } : null);

    try {
      const newReply = await banterService.createPost({
        content,
        parentId: post.id,
        mediaUrls,
        mediaType,
        poll,
        taggedTeamId: taggedTeam?.id || null,
        taggedTeamName: taggedTeam?.name || null
      });

      setReplies(prev => prev.map(r => r.id === optimisticId ? newReply : r));

      // Broadcast to other viewers in this thread room only
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_reply',
          payload: { reply: newReply },
        });
      }
    } catch (err) {
      setReplies(prev => prev.filter(r => r.id !== optimisticId));
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-6 space-y-4 animate-fadeIn">
        <div className="h-10 w-24 bg-zinc-900 rounded-full animate-pulse" />
        <div className="h-44 bg-zinc-900/60 rounded-2xl border border-zinc-800 animate-pulse" />
        <div className="h-28 bg-zinc-900/40 rounded-2xl border border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 text-center text-white">
        <p className="text-base font-bold text-zinc-300">This take doesn’t exist or was removed.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-full bg-sky-500 text-white text-xs font-bold hover:bg-sky-400 cursor-pointer"
        >
          ← Back to Banter
        </button>
      </div>
    );
  }

  const renderContent = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_\s]{2,20}(?=\s|$|[.,!?]))/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <span key={idx} className="text-sky-400 font-semibold">
            {part}
          </span>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span
            key={idx}
            className="text-emerald-400 font-semibold inline-flex items-center gap-0.5 bg-emerald-500/10 px-1 rounded border border-emerald-500/20"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const ExpandableReplyText: React.FC<{ text: string }> = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    const MAX_VIEW_CHARS = 160;

    if (text.length <= MAX_VIEW_CHARS) {
      return (
        <p className="mt-1 text-sm text-zinc-200 leading-normal whitespace-pre-wrap select-text">
          {renderContent(text)}
        </p>
      );
    }

    return (
      <p className="mt-1 text-sm text-zinc-200 leading-normal whitespace-pre-wrap select-text">
        {renderContent(expanded ? text : `${text.slice(0, MAX_VIEW_CHARS).trim()}…`)}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="ml-1.5 text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer inline-flex items-center text-xs"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      </p>
    );
  };

  const isJournalist = post.authorType === 'journalist' || (post.authorBadge || '').toLowerCase().includes('journalist');

  return (
    <div
      className="w-full max-w-2xl mx-auto min-h-screen bg-[#000000] text-white pb-24"
      data-testid="banter-thread-view"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 flex items-center gap-4 bg-black/85 backdrop-blur-md px-3 py-3 border-b border-zinc-800">
        <button
          type="button"
          aria-label="Back to feed"
          onClick={onBack}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
            <span>Post</span>
          </h1>
          <p className="text-[11px] text-zinc-500">
            {post.authorName || post.authorHandle}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="divide-y divide-zinc-900">
        {/* Ancestry Chain: Parent posts above the spotlight post linked with vertical connector thread line */}
        {ancestry.length > 0 && (
          <div className="px-3 pt-3">
            {ancestry.map((ancestor, aIdx) => (
              <div
                key={ancestor.id}
                onClick={() => onNavigatePost ? onNavigatePost(ancestor.id) : (window.location.hash = `#/banter/${ancestor.id}`)}
                className="group relative flex gap-3 cursor-pointer pb-4"
              >
                {/* Vertical Continuous Thread Line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="w-0.5 bg-zinc-800 grow mt-1 group-hover:bg-zinc-700 transition-colors" />
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-white group-hover:underline">
                      {ancestor.authorName || ancestor.authorHandle}
                    </span>
                    <span className="text-xs text-zinc-500">
                      @{ancestor.authorHandle.replace(/\s+/g, '_').toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-200 leading-normal">
                    {renderContent(ancestor.content)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Spotlight Post */}
        <article className="px-3 sm:px-4 py-4 space-y-3">
          {/* Author Strip */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 shadow-sm">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-white tracking-tight">
                    {post.authorName || post.authorHandle}
                  </span>
                  {isJournalist && (
                    <span title="Verified Reporter">
                      <ShieldCheck className="h-4 w-4 text-sky-400" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  @{post.authorHandle.replace(/\s+/g, '_').toLowerCase()}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {post.matchContext && (
                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold">
                  {post.matchContext.homeTeamName.split(' ')[0]} v {post.matchContext.awayTeamName.split(' ')[0]}
                </span>
              )}
              {post.taggedTeamName && (
                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  <span>@{post.taggedTeamName}</span>
                </span>
              )}
            </div>
          </div>

          {/* Headline Typography Content */}
          <p className="text-lg md:text-xl text-white font-normal leading-relaxed whitespace-pre-wrap select-text">
            {renderContent(post.content)}
          </p>

          {/* Media Presentation: Single Card / Dual Grid / 15s Video */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="my-3">
              {post.mediaType === 'VIDEO' ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video max-h-96 flex items-center justify-center">
                  <video
                    src={post.mediaUrls[0]}
                    controls
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                    <Film className="h-3 w-3 text-sky-400" />
                    <span>≤ 15s Clip</span>
                  </span>
                </div>
              ) : post.mediaUrls.length === 1 ? (
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video max-h-96">
                  <img
                    src={post.mediaUrls[0]}
                    alt="Post media"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-zinc-800">
                  {post.mediaUrls.slice(0, 2).map((url: string, i: number) => (
                    <div key={i} className="aspect-square bg-zinc-950 overflow-hidden">
                      <img
                        src={url}
                        alt={`Media ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive Community Poll */}
          {post.poll && (
            <XPollWidget
              poll={post.poll}
              onPollUpdated={(updated) => setPost((curr: BanterPost | null) => curr ? { ...curr, poll: updated } : null)}
            />
          )}

          {/* Full Timestamp & Views */}
          <div className="flex items-center gap-2 pt-2 text-xs text-zinc-500 border-t border-zinc-900 font-sans">
            <span>{formatFullTimestamp(post.createdAt)}</span>
            <span>·</span>
            <span className="font-semibold text-zinc-400">
              {formatTwitterMetric(post.impressionsCount || 1420)} Views
            </span>
          </div>

          {/* Metrics Strip */}
          <div className="flex items-center gap-5 py-3 border-t border-b border-zinc-900 text-xs text-zinc-400 font-sans">
            <div>
              <span className="font-black text-white">{repostCount}</span>{' '}
              <span className="text-zinc-500">Reposts</span>
            </div>
            <div>
              <span className="font-black text-white">{likeCount}</span>{' '}
              <span className="text-zinc-500">Likes</span>
            </div>
            <div>
              <span className="font-black text-white">{post.commentCount || 0}</span>{' '}
              <span className="text-zinc-500">Replies</span>
            </div>
          </div>

          {/* Action Icons Bar with X Hovers */}
          <div className="flex items-center justify-around py-1 text-zinc-500">
            {/* Reply: Cyan hover */}
            <button
              type="button"
              aria-label="Reply"
              className="flex items-center gap-1.5 p-2 rounded-full hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
            </button>

            {/* Repost: Green hover */}
            <button
              type="button"
              aria-label="Repost"
              onClick={handleToggleRepost}
              className={`flex items-center gap-1.5 p-2 rounded-full hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer ${
                reposted ? 'text-emerald-500' : ''
              }`}
            >
              <Repeat2 className="h-5 w-5" />
            </button>

            {/* Like: Pink hover */}
            <button
              type="button"
              aria-label="Like"
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 p-2 rounded-full hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer ${
                liked ? 'text-rose-500 fill-rose-500' : ''
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-rose-500' : ''}`} />
            </button>

            {/* Bookmark */}
            <button
              type="button"
              aria-label="Bookmark"
              onClick={() => setIsBookmarked(prev => !prev)}
              className={`flex items-center gap-1.5 p-2 rounded-full hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer ${
                isBookmarked ? 'text-sky-500' : ''
              }`}
            >
              <Bookmark className="h-5 w-5" />
            </button>

            {/* Share: Sky hover */}
            <button
              type="button"
              aria-label="Share"
              onClick={handleShare}
              className="flex items-center gap-1.5 p-2 rounded-full hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
            >
              <Share className="h-5 w-5" />
            </button>
          </div>
        </article>

        {/* Chronological Reply Feed with Numbers */}
        <div className="px-3 sm:px-4 py-3 space-y-3 pb-24">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Replies ({replies.length})
            </h3>
          </div>

          {replies.length === 0 ? (
            /* If no replies, then related messages. 2 or 3. Just "more stories" section */
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-zinc-900">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  More stories
                </h4>
              </div>
              <div className="space-y-3">
                {moreStories.map((story) => (
                  <BanterPostCard
                    key={story.id}
                    post={story}
                    onToggleReaction={async (postId, type) => {
                      await banterService.toggleReaction(postId, type);
                    }}
                    onOpenComments={(p) => {
                      if (onNavigatePost) {
                        onNavigatePost(p.id);
                      } else {
                        window.location.hash = `#/banter/${p.id}`;
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {replies.map((reply, idx) => (
                <div
                  key={reply.id}
                  onClick={() => onNavigatePost ? onNavigatePost(reply.id) : (window.location.hash = `#/banter/${reply.id}`)}
                  className="group relative flex gap-3 p-3 rounded-2xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950 transition-all cursor-pointer"
                >
                  {/* Avatar & Number badge */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white group-hover:underline">
                          {reply.authorName || reply.authorHandle}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          @{reply.authorHandle.replace(/\s+/g, '_').toLowerCase()}
                        </span>
                        <span className="text-[11px] text-zinc-600">·</span>
                        <span className="text-[11px] text-zinc-500">
                          {formatFullTimestamp(reply.createdAt).split(' · ')[0]}
                        </span>
                      </div>
                    </div>

                    <ExpandableReplyText text={reply.content} />

                    {reply.poll && (
                      <XPollWidget poll={reply.poll} />
                    )}

                    {/* Reply mini action toolbar */}
                    <div className="flex items-center gap-6 mt-2 text-zinc-500 text-xs">
                      <span className="flex items-center gap-1 hover:text-sky-400">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{reply.commentCount || 0}</span>
                      </span>
                      <span className="flex items-center gap-1 hover:text-emerald-400">
                        <Repeat2 className="h-3.5 w-3.5" />
                        <span>{reply.repostCount || 0}</span>
                      </span>
                      <span className="flex items-center gap-1 hover:text-rose-400">
                        <Heart className="h-3.5 w-3.5" />
                        <span>{reply.reactionFireCount || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Single input bar fixed at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-zinc-800 p-2.5 sm:p-3 shadow-2xl">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!singleReplyText.trim() || !post || isSubmittingReply) return;
              setIsSubmittingReply(true);
              const textToSubmit = singleReplyText.trim();
              try {
                await handleCreateReply(textToSubmit);
                setSingleReplyText('');
              } catch (err) {
                console.warn('Failed to submit reply:', err);
              } finally {
                setIsSubmittingReply(false);
              }
            }}
            className="max-w-2xl mx-auto flex items-center gap-2"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={singleReplyText}
              onChange={(e) => setSingleReplyText(e.target.value.slice(0, 280))}
              maxLength={280}
              placeholder="Post your reply..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!singleReplyText.trim() || isSubmittingReply}
              className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm ${
                singleReplyText.trim() && !isSubmittingReply
                  ? 'bg-sky-500 hover:bg-sky-400 text-white cursor-pointer active:scale-95'
                  : 'bg-sky-500/30 text-white/40 cursor-not-allowed'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmittingReply ? 'Posting...' : 'Reply'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
