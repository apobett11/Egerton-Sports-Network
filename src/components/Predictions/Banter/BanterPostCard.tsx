import React, { useState } from 'react';
import {
  MessageCircle,
  Repeat2,
  BarChart2,
  Share,
  Bookmark,
  CheckCircle2,
  ShieldCheck,
  User
} from 'lucide-react';
import { formatRelativeTime } from '../../../lib/predictions/utils';
import { shareService } from '../../../services/predictions/shareService';
import { banterService } from '../../../services/predictions/banterService';
import type { BanterPost, ReactionType } from '../../../types/predictions';

interface BanterPostCardProps {
  post: BanterPost;
  isHot?: boolean;
  onToggleReaction: (postId: string, type: ReactionType) => void;
  onOpenComments: (post: BanterPost) => void;
  onSelectMatchContext?: (matchId: string) => void;
  onRepost?: (postId: string, active: boolean) => void;
}

// Format numbers like Twitter: 1,420 -> 1.4K, 12,500 -> 12.5K
function formatTwitterMetric(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export const BanterPostCard: React.FC<BanterPostCardProps> = ({
  post,
  isHot = false,
  onToggleReaction,
  onOpenComments,
  onSelectMatchContext,
  onRepost,
}) => {
  const isJournalist = post.authorType === 'journalist';
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount || Math.floor((post.reactionFireCount + 5) * 1.4));
  const [hasReposted, setHasReposted] = useState(false);

  // Record impression for viewing this post
  React.useEffect(() => {
    banterService.recordImpression(post.id);
  }, [post.id]);

  // Impressions simulation strictly between 10 and 100
  const impressions = post.impressionsCount ?? Math.min(99, Math.max(12, (post.reactionFireCount + post.reactionClownCount + post.commentCount) * 2 + 15));

  const cleanHandle = post.authorHandle.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !hasReposted;
    if (hasReposted) {
      setRepostCount(prev => prev - 1);
      setHasReposted(false);
    } else {
      setRepostCount(prev => prev + 1);
      setHasReposted(true);
    }
    if (onRepost) onRepost(post.id, next);
  };

  const handleShareTake = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareService.shareTalk(post);
  };

  const handleReactionClick = (e: React.MouseEvent, type: ReactionType) => {
    e.stopPropagation();
    onToggleReaction(post.id, type);
  };

  // Render content with highlighted hashtags #EPL, #Team
  const renderTweetContent = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <span key={idx} className="text-[#1d9bf0] font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article
      onClick={() => onOpenComments(post)}
      className="border border-slate-800/80 bg-[#0b1624] hover:bg-[#0e1c2b] p-3 rounded-xl tactical-card-shadow transition-all cursor-pointer hover:border-slate-700"
    >
      <div className="flex gap-2.5">
        {/* Twitter Avatar Circle */}
        <div className="flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1d9bf0]/20 via-[#152a40] to-[#ff0046]/20 border border-slate-700 text-white font-bold text-xs shadow-sm">
            {isJournalist ? (
              <ShieldCheck className="h-4 w-4 text-[#ff0046]" />
            ) : (
              <User className="h-4 w-4 text-slate-300" />
            )}
          </div>
        </div>

        {/* Tweet Body Column */}
        <div className="flex-1 min-w-0">
          {/* Tweet Header: Display Name, Badge, @Handle · Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap leading-none">
              <span className="font-bold text-white text-xs hover:underline truncate max-w-[140px]">
                {post.authorHandle}
              </span>

              {isJournalist ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#ff0046]/20 px-1.5 py-0.2 text-[9px] font-black uppercase text-[#ff0046] border border-[#ff0046]/40">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#ff0046]" />
                  <span>{post.authorBadge || 'DESK'}</span>
                </span>
              ) : (
                <CheckCircle2 className="h-3 w-3 text-[#1d9bf0] fill-[#1d9bf0]/20" />
              )}

              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[90px]">
                @{cleanHandle}
              </span>

              <span className="text-slate-600 text-[10px]">·</span>

              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {formatRelativeTime(post.createdAt)}
              </span>
              {isHot && (
                <span className="text-[9px] font-black uppercase text-[#ff0046]">Hot</span>
              )}
            </div>
          </div>

          {/* Match Context Pill if linked */}
          {post.matchContext && (
            <div className="mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (post.matchId && onSelectMatchContext) onSelectMatchContext(post.matchId);
                }}
                className="inline-flex items-center gap-1 rounded bg-[#14263b] px-2 py-0.5 text-[9px] font-bold text-slate-300 hover:text-white border border-[#16283d] transition-colors cursor-pointer"
              >
                <span>⚽ {post.matchContext.homeTeamName} vs {post.matchContext.awayTeamName}</span>
              </button>
            </div>
          )}

          {/* Tweet Text Content */}
          <p className="mt-1.5 text-xs text-slate-100 leading-relaxed break-words">
            {renderTweetContent(!expanded && post.content.length > 160 ? `${post.content.slice(0, 160).trim()}…` : post.content)}
            {post.content.length > 160 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className="ml-1 text-[#1d9bf0] font-bold cursor-pointer"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
          {post.commentCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments(post);
              }}
              className="mt-1 text-[11px] text-[#1d9bf0] font-bold cursor-pointer"
            >
              {post.commentCount} {post.commentCount === 1 ? 'reply' : 'replies'} — open the thread
            </button>
          )}

          {/* Attached Image if present */}
          {post.imageUrl && (
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-700/80 max-h-60 bg-black/40">
              <img
                src={post.imageUrl}
                alt="Banter visual"
                className="w-full h-auto object-cover max-h-60 rounded-md"
                loading="lazy"
              />
            </div>
          )}

          {/* Twitter Action Bar */}
          <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400">
            {/* 1. Comment / Reply */}
            <div className="flex items-center gap-1 hover:text-[#1d9bf0] transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="font-medium">Reply</span>
            </div>

            {/* 2. Retweet / Repost */}
            <button
              type="button"
              onClick={handleRepost}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                hasReposted ? 'text-[#00ba7c]' : 'hover:text-[#00ba7c]'
              }`}
              title="Repost"
            >
              <Repeat2 className="h-3.5 w-3.5" />
              <span className="font-medium">{hasReposted ? 'Reposted' : 'Repost'}</span>
            </button>

            {/* 3. Fan Reactions: Fire / Clown / Skull */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => handleReactionClick(e, 'fire')}
                className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-all cursor-pointer ${
                  post.userReactions?.fire
                    ? 'text-[#ff0046] font-bold bg-[#ff0046]/10'
                    : 'hover:text-[#ff0046]'
                }`}
                title="Fire Reaction"
              >
                <span className="text-xs">🔥</span>
                <span className="text-[10px]">{post.reactionFireCount}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleReactionClick(e, 'clown')}
                className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-all cursor-pointer ${
                  post.userReactions?.clown
                    ? 'text-amber-400 font-bold bg-amber-400/10'
                    : 'hover:text-amber-400'
                }`}
                title="Clown Reaction"
              >
                <span className="text-xs">🤡</span>
                <span className="text-[10px]">{post.reactionClownCount}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleReactionClick(e, 'skull')}
                className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-all cursor-pointer ${
                  post.userReactions?.skull
                    ? 'text-purple-400 font-bold bg-purple-400/10'
                    : 'hover:text-purple-400'
                }`}
                title="Skull Reaction"
              >
                <span className="text-xs">💀</span>
                <span className="text-[10px]">{post.reactionSkullCount}</span>
              </button>
            </div>

            {/* 4. Views / Impressions */}
            <div className="hidden xs:flex items-center gap-1 text-slate-500" title="Views">
              <BarChart2 className="h-3 w-3" />
              <span className="text-[10px] font-mono">{formatTwitterMetric(impressions)}</span>
            </div>

            {/* 5. Bookmark & Share */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBookmarked(prev => !prev);
                }}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isBookmarked ? 'text-[#1d9bf0]' : 'hover:text-[#1d9bf0]'
                }`}
                title="Bookmark"
              >
                <Bookmark className="h-3 w-3" />
              </button>

              <button
                type="button"
                onClick={handleShareTake}
                className="p-1 rounded hover:text-[#1d9bf0] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                title="Share on WhatsApp"
              >
                <Share className="h-3 w-3" />
                <span className="text-[10px]">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
