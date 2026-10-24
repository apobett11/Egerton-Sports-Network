import React, { useState } from 'react';
import {
  MessageCircle,
  Repeat2,
  Heart,
  BarChart2,
  Share,
  Bookmark,
  CheckCircle2,
  ShieldCheck,
  User,
  Film,
  Shield
} from 'lucide-react';
import { formatRelativeTime } from '../../lib/predictions/utils';
import { shareService } from '../../services/predictions/shareService';
import { XPollWidget } from '../Predictions/Banter/XPollWidget';
import type { BanterPost, ReactionType } from '../../types/predictions';

interface BanterPostCardProps {
  post: BanterPost;
  isHot?: boolean;
  onToggleReaction: (postId: string, type: ReactionType) => void;
  onOpenComments: (post: BanterPost) => void;
  onSelectMatchContext?: (matchId: string) => void;
  onRepost?: (postId: string, active: boolean) => void;
}

function formatTwitterMetric(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

const MAX_VIEW_CHARS = 160;

export const BanterPostCard: React.FC<BanterPostCardProps> = ({
  post,
  isHot = false,
  onToggleReaction,
  onOpenComments,
  onSelectMatchContext,
  onRepost,
}) => {
  const isJournalist =
    post.authorType === 'journalist' ||
    (post.authorBadge || '').toLowerCase().includes('journalist');

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [repostCount, setRepostCount] = useState(
    post.repostCount || post.repostsCount || Math.floor((post.reactionFireCount + 5) * 1.4)
  );
  const [hasReposted, setHasReposted] = useState(false);
  const [isLiked, setIsLiked] = useState(Boolean(post.userReactions?.fire));
  const [likesCount, setLikesCount] = useState(
    post.likesCount || post.reactionFireCount || 0
  );

  const impressions =
    post.impressionsCount ||
    (post.reactionFireCount + post.reactionClownCount + post.commentCount + 8) * 64;

  const cleanHandle = post.authorHandle.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const handlePostClick = () => {
    // Navigate to full-page thread view (no popup)
    window.location.hash = `#/banter/${post.id}`;
    if (onOpenComments) onOpenComments(post);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !hasReposted;
    if (hasReposted) {
      setRepostCount((prev: number) => prev - 1);
      setHasReposted(false);
    } else {
      setRepostCount((prev: number) => prev + 1);
      setHasReposted(true);
    }
    if (onRepost) onRepost(post.id, next);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((prev: number) => prev + (next ? 1 : -1));
    onToggleReaction(post.id, 'fire');
  };

  const handleShareTake = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareService.shareTalk(post);
  };

  const renderTweetContent = (text: string) => {
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

  const mediaList = post.mediaUrls && post.mediaUrls.length > 0
    ? post.mediaUrls
    : post.imageUrl
    ? [post.imageUrl]
    : [];

  return (
    <article
      onClick={handlePostClick}
      className="border border-zinc-800/80 bg-[#09090b] hover:bg-[#000000] p-3 sm:p-4 rounded-2xl transition-all cursor-pointer hover:border-zinc-700 shadow-sm"
    >
      <div className="flex gap-3">
        {/* User Avatar Circle */}
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs shadow-sm">
            {isJournalist ? (
              <ShieldCheck className="h-4 w-4 text-sky-400" />
            ) : (
              <User className="h-4 w-4 text-zinc-400" />
            )}
          </div>
        </div>

        {/* Tweet Body Column */}
        <div className="flex-1 min-w-0">
          {/* Header: Name, Verified Badge, @Handle · Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <span className="font-bold text-white text-sm hover:underline truncate max-w-[150px]">
                {post.authorName || post.authorHandle}
              </span>

              {post.authorType === 'coach' ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase text-emerald-400 border border-emerald-500/40">
                  <Shield className="h-2.5 w-2.5 text-emerald-400" />
                  <span>{post.authorBadge || 'COACH'}</span>
                </span>
              ) : isJournalist ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase text-sky-400 border border-sky-500/40">
                  <CheckCircle2 className="h-2.5 w-2.5 text-sky-400" />
                  <span>{post.authorBadge || 'REPORTER'}</span>
                </span>
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20" />
              )}

              <span className="text-xs text-zinc-500 font-mono truncate max-w-[100px]">
                @{cleanHandle}
              </span>

              <span className="text-zinc-600 text-xs">·</span>

              <span className="text-xs text-zinc-500 whitespace-nowrap">
                {formatRelativeTime(post.createdAt)}
              </span>

              {isHot && (
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full border border-rose-500/20">
                  Hot
                </span>
              )}
            </div>
          </div>

          {/* Match Context & Tagged Team Badges */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {post.matchContext && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (post.matchId && onSelectMatchContext) onSelectMatchContext(post.matchId);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              >
                <span>⚽ {post.matchContext.homeTeamName} vs {post.matchContext.awayTeamName}</span>
              </button>
            )}

            {post.taggedTeamName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
                <Shield className="h-2.5 w-2.5" />
                <span>@{post.taggedTeamName}</span>
              </span>
            )}
          </div>

          {/* Tweet Text Content with Maximum View Limit */}
          <p className="mt-2 text-sm text-zinc-100 leading-relaxed break-words whitespace-pre-wrap select-text">
            {renderTweetContent(
              !expanded && post.content.length > MAX_VIEW_CHARS
                ? `${post.content.slice(0, MAX_VIEW_CHARS).trim()}…`
                : post.content
            )}
            {post.content.length > MAX_VIEW_CHARS && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePostClick();
                }}
                className="ml-1.5 text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer inline-flex items-center text-xs"
              >
                See more
              </button>
            )}
          </p>

          {/* Media Presentation: Single Card / Dual Grid / Video */}
          {mediaList.length > 0 && (
            <div className="mt-2.5">
              {post.mediaType === 'VIDEO' ? (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video max-h-72 flex items-center justify-center">
                  <video
                    src={mediaList[0]}
                    controls
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                    <Film className="h-3 w-3 text-sky-400" />
                    <span>≤ 15s</span>
                  </span>
                </div>
              ) : mediaList.length === 1 ? (
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video max-h-72">
                  <img
                    src={mediaList[0]}
                    alt="Banter visual"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden border border-zinc-800">
                  {mediaList.slice(0, 2).map((url: string, i: number) => (
                    <div key={i} className="aspect-square bg-zinc-950 overflow-hidden">
                      <img
                        src={url}
                        alt={`Banter visual ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive Community Poll */}
          {post.poll && (
            <XPollWidget poll={post.poll} />
          )}

          {/* Twitter Action Bar: seamlessly at the bottom of the message without separating line */}
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 max-w-md">
            {/* 1. Cyan Reply Hover */}
            <div
              className="flex items-center gap-1.5 p-1.5 rounded-full hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
              title="Reply"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium text-[11px]">{post.commentCount || 0}</span>
            </div>

            {/* 2. Green Repost Hover */}
            <button
              type="button"
              onClick={handleRepost}
              className={`flex items-center gap-1.5 p-1.5 rounded-full hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer ${
                hasReposted ? 'text-emerald-500' : ''
              }`}
              title="Repost"
            >
              <Repeat2 className="h-4 w-4" />
              <span className="font-medium text-[11px]">{repostCount}</span>
            </button>

            {/* 3. Pink Like Hover */}
            <button
              type="button"
              onClick={handleLikeClick}
              className={`flex items-center gap-1.5 p-1.5 rounded-full hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer ${
                isLiked ? 'text-rose-500' : ''
              }`}
              title="Like"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500' : ''}`} />
              <span className="font-medium text-[11px]">{likesCount}</span>
            </button>

            {/* 4. Impressions */}
            <div className="hidden xs:flex items-center gap-1 text-zinc-500" title="Views">
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="text-[11px] font-mono">{formatTwitterMetric(impressions)}</span>
            </div>

            {/* 5. Bookmark & Sky Share Hover */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBookmarked(prev => !prev);
                }}
                className={`p-1.5 rounded-full hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer ${
                  isBookmarked ? 'text-sky-500' : ''
                }`}
                title="Bookmark"
              >
                <Bookmark className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleShareTake}
                className="p-1.5 rounded-full hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
                title="Share"
              >
                <Share className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
