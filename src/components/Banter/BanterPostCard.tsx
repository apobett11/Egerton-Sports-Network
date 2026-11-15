import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  Repeat2,
  BarChart2,
  Share,
  Bookmark,
  Film,
  Shield,
  Flame
} from 'lucide-react';
import { formatRelativeTime, formatTeamTag, getCleanMessageRef, MENTION_AND_TAG_REGEX } from '../../lib/predictions/utils';
import { shareBanterSnapshot } from '../../lib/shareSnapshot';
import { BanterReplyModal } from './BanterReplyModal';
import { XPollWidget } from '../Predictions/Banter/XPollWidget';
import { getActiveSessionProfile, getOrCreatePermanentDeviceId } from '../../utils/sessionIdentity';
import {
  getAuthorIdentityMeta,
  InstagramBlueTick,
  OrangeCoachTick,
  ChampionshipAmberCoachTick,
  AvatarViewModal
} from '../../lib/predictions/footballAvatars';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
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

function computePostEngagement(post: BanterPost) {
  const isMessage = Boolean(post.parentId || (post.rootId && post.rootId !== post.id));
  const isTrending = Boolean(post.isTrending && !isMessage);

  // Deterministic seed from post id
  let hash = 0;
  const idStr = String(post.id || 'seed');
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  // Age calculation
  const createdTs = new Date(post.createdAt || Date.now()).getTime();
  const ageSec = Math.max(0, (Date.now() - createdTs) / 1000);

  // When one immediately sends, repost, impression, replies all begin at 0, then impressions & reposts climb
  const isImmediatelySent = post.isMine && ageSec < 60;

  let impressions: number;
  let baseReposts: number;

  if (isImmediatelySent) {
    if (ageSec < 5) {
      impressions = 0;
      baseReposts = 0;
    } else {
      // Climb progressively with age
      impressions = Math.min(80, Math.floor(ageSec * 1.5));
      baseReposts = Math.floor(impressions / 60);
    }
  } else {
    // Numbers should never be zero: immediately add community engagement
    if (isTrending) {
      impressions = 1550 + (seed % 1450); // 1,550 - 3,000 views
      // Random high reposts, directly proportional to impressions
      baseReposts = Math.max(16, Math.floor(impressions / 50) + (seed % 18));
    } else {
      impressions = 320 + (seed % 680); // 320 - 1,000 views (never zero!)
      // Low (0, 1, or 2) for normal messages, directly proportional
      baseReposts = seed % 3;
    }
  }

  // Preserve higher persisted values if present
  if (post.impressions && post.impressions > impressions) {
    impressions = post.impressions;
  }

  // Replies are strictly organic - the algorithm NEVER touches replies
  const replies = post.commentCount || post.repliesCount || 0;

  return { impressions, baseReposts, replies };
}

export const BanterPostCard: React.FC<BanterPostCardProps> = ({
  post,
  isHot = false,
  onToggleReaction,
  onOpenComments,
  onSelectMatchContext,
  onRepost,
}) => {
  const session = getActiveSessionProfile();
  const currentDeviceId = session?.deviceId || (typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : null);
  const postAuthorDeviceId = post.authorDeviceId || (post as any).author_device_id || post.userId;
  const isYou = Boolean(currentDeviceId && postAuthorDeviceId === currentDeviceId);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const authorMeta = getAuthorIdentityMeta(post);

  const isJournalist = authorMeta.isJournalist;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  // Engagement algorithm: replies are strictly organic, impressions & reposts climb / non-zero
  const engagement = useMemo(() => computePostEngagement(post), [post]);
  const impressions = engagement.impressions;
  const [repostCount, setRepostCount] = useState(
    post.repostCount || post.repostsCount || engagement.baseReposts
  );
  const [hasReposted, setHasReposted] = useState(false);
  const [replyCount, setReplyCount] = useState(engagement.replies);

  const [expanded, setExpanded] = useState(false);

  const cleanHandle = post.authorHandle.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const handlePostClick = (e?: React.MouseEvent) => {
    if (lightboxImageUrl !== null) return;
    if (e) {
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        !target.isConnected ||
        target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('form') ||
        target.closest('img') ||
        target.closest('video') ||
        target.closest('[role="dialog"]') ||
        target.closest('[role="toolbar"]') ||
        target.closest('[title*="image"]') ||
        target.closest('[data-interactive-media]') ||
        target.closest('[data-testid="image-lightbox-modal"]') ||
        target.closest('[data-poll-widget]') ||
        target.closest('[data-testid="poll-widget"]') ||
        target.closest('[data-testid="poll-inline-reply-container"]') ||
        target.closest('[data-action-buttons]') ||
        target.closest('[data-testid="action-buttons-bar"]') ||
        target.closest('[data-testid="message-impressions"]')
      ) {
        return;
      }
    }
    // Navigate to full-page thread view (clean message ref, never internal UID)
    const messageRef = getCleanMessageRef(post);
    sessionStorage.setItem('active_banter_thread_id', post.id);
    sessionStorage.setItem(`banter_ref_${messageRef}`, post.id);
    window.location.hash = `#/banter/${messageRef}?id=${post.id}`;
    if (onOpenComments) onOpenComments(post);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !hasReposted;
    // Instant UI update
    setRepostCount((prev: number) => prev + (next ? 1 : -1));
    setHasReposted(next);
    // Background asynchronous promise
    if (onRepost) {
      Promise.resolve().then(() => onRepost(post.id, next)).catch(console.warn);
    }
  };

  const handleShareTake = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareBanterSnapshot(post, null);
  };

  const renderTweetContent = (text: string) => {
    const parts = text.split(MENTION_AND_TAG_REGEX);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <span key={idx} className="text-sky-400 font-semibold">
            {part}
          </span>
        );
      }
      if (part.startsWith('@')) {
        const rawTag = part.slice(1);
        const formatted = formatTeamTag(rawTag);
        return (
          <span
            key={idx}
            className="text-emerald-400 font-semibold inline-flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 text-xs sm:text-[13px]"
          >
            @{formatted}
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
      data-testid="banter-post-card"
      onClick={handlePostClick}
      className={`group relative overflow-hidden px-4 py-3.5 sm:px-4 sm:py-4 transition-colors duration-150 cursor-pointer hover:bg-white/[0.02] max-w-2xl mx-auto border-b border-zinc-800/70 ${
        isHot || post.isTrending ? 'bg-amber-500/[0.02]' : ''
      }`}
    >
      {(isHot || post.isTrending) && (
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      )}
      <div className="flex gap-3">
        {/* User Avatar / Logo - Made larger matching Google Stitch / X standard */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAvatarModalOpen(true);
            }}
            className="group/avatar flex h-12 w-12 items-center justify-center rounded-full overflow-hidden shadow-sm border border-white/10 hover:border-sky-400 transition cursor-pointer"
            title="View image and session details"
          >
            <img
              src={authorMeta.avatarUrl}
              alt={authorMeta.displayName}
              className="h-full w-full object-cover group-hover/avatar:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </button>
        </div>

        {/* Tweet Body Column */}
        <div className="flex-1 min-w-0">
          {/* Header: Name, Verified Badge, @Handle · Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAvatarModalOpen(true);
                }}
                className="font-bold text-white text-[15px] hover:underline hover:text-sky-300 truncate max-w-[170px] cursor-pointer text-left"
                title="View image and session details"
              >
                {authorMeta.displayName}
              </button>

              {isYou && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase text-purple-300 border border-purple-500/40">
                  You
                </span>
              )}

              {authorMeta.isJournalist ? (
                <div className="inline-flex items-center gap-1">
                  <InstagramBlueTick className="h-4 w-4" />
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#0095f6]/15 px-1.5 py-0.2 text-[9px] font-black uppercase text-[#0095f6] border border-[#0095f6]/30">
                    Official Journalist
                  </span>
                </div>
              ) : authorMeta.isCoach ? (
                authorMeta.coachLeague === 'championship' ? (
                  <div className="inline-flex items-center gap-1">
                    <ChampionshipAmberCoachTick className="h-4 w-4" />
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.2 text-[9px] font-black uppercase text-amber-400 border border-amber-500/30">
                      <Shield className="h-2.5 w-2.5 text-amber-400" />
                      <span>{post.taggedTeamName ? `${formatTeamTag(post.taggedTeamName)} Coach` : 'Championship Coach'}</span>
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    <OrangeCoachTick className="h-4 w-4" />
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/15 px-2 py-0.2 text-[9px] font-black uppercase text-orange-400 border border-orange-500/30">
                      <Shield className="h-2.5 w-2.5 text-orange-400" />
                      <span>{post.taggedTeamName ? `${formatTeamTag(post.taggedTeamName)} Coach` : 'EPL Coach'}</span>
                    </span>
                  </div>
                )
              ) : null}

              <span className="text-sm text-zinc-500 font-normal truncate max-w-[120px]">
                @{cleanHandle}
              </span>

              <span className="text-zinc-600 text-sm">·</span>

              <span
                data-post-link
                onClick={handlePostClick}
                className="text-sm text-zinc-500 whitespace-nowrap hover:underline cursor-pointer"
              >
                {formatRelativeTime(post.createdAt)}
              </span>

              {(isHot || post.isTrending) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-400/25 to-amber-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                  <Flame className="h-3 w-3 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>Trending</span>
                </span>
              )}
            </div>
          </div>

          {/* Match Context & Tagged Team Badges */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {post.matchContext && post.content.includes('#') && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-800">
                <span>⚽ {formatTeamTag(post.matchContext.homeTeamName)} vs {formatTeamTag(post.matchContext.awayTeamName)}</span>
              </span>
            )}

            {post.taggedTeamName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
                <Shield className="h-2.5 w-2.5" />
                <span>@{formatTeamTag(post.taggedTeamName)}</span>
              </span>
            )}
          </div>

          {/* Tweet Text Content with Maximum View Limit */}
          <p
            data-testid="banter-post-content"
            onClick={handlePostClick}
            className="mt-2 text-[15px] text-zinc-100 leading-relaxed break-words whitespace-pre-wrap select-text font-normal cursor-pointer"
          >
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
                <div
                  data-interactive-media
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImageUrl(mediaList[0]);
                  }}
                  className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video max-h-72 cursor-pointer group/img hover:border-zinc-700 transition"
                  title="Click to view image"
                >
                  <img
                    src={mediaList[0]}
                    alt="Banter visual"
                    data-interactive-media
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImageUrl(mediaList[0]);
                    }}
                    className="w-full h-full object-cover group-hover/img:scale-[1.02] transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden border border-zinc-800">
                  {mediaList.slice(0, 2).map((url: string, i: number) => (
                    <div
                      key={i}
                      data-interactive-media
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImageUrl(url);
                      }}
                      className="aspect-square bg-zinc-950 overflow-hidden cursor-pointer group/img hover:border-zinc-700 transition"
                      title="Click to view image"
                    >
                      <img
                        src={url}
                        alt={`Banter visual ${i + 1}`}
                        data-interactive-media
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImageUrl(url);
                        }}
                        className="w-full h-full object-cover group-hover/img:scale-[1.02] transition-transform duration-200"
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
            <div data-poll-widget onClick={(e) => e.stopPropagation()}>
              <XPollWidget
                poll={post.poll}
                onPollUpdated={(updated) => {
                  post.poll = updated;
                }}
              />
            </div>
          )}

          {/* Action & Banter Reactions Bar */}
          <div
            data-action-buttons
            data-testid="action-buttons-bar"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex items-center justify-between text-xs text-zinc-500 max-w-md"
          >
            {/* 1. Reply - Kept single non-white message bubble */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsReplyModalOpen(true);
              }}
              className="flex items-center gap-1.5 p-1.5 -ml-1.5 rounded-full hover:bg-[#1d9bf0]/10 transition-colors cursor-pointer group/reply text-zinc-400 hover:text-[#1d9bf0]"
              title="Reply"
            >
              <span className="font-medium text-xs font-mono">💬 {replyCount}</span>
            </button>

            {/* 2. Repost - Organic, directly proportional to impressions */}
            <button
              type="button"
              onClick={handleRepost}
              className={`flex items-center gap-1.5 p-1.5 rounded-full hover:text-[#00ba7c] hover:bg-[#00ba7c]/10 transition-colors cursor-pointer group/repost ${
                hasReposted ? 'text-[#00ba7c]' : ''
              }`}
              title="Repost"
            >
              <Repeat2 className="h-4 w-4 group-hover/repost:text-[#00ba7c]" />
              <span className="font-medium text-xs font-mono">{repostCount}</span>
            </button>

            {/* 3. Impressions (number of views per message in place of emojis) */}
            <div
              data-testid="message-impressions"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-sky-500/10 text-zinc-500 hover:text-sky-400 transition-colors cursor-default select-none"
              title={`${impressions.toLocaleString()} views`}
            >
              <BarChart2 className="h-4 w-4" />
              <span className="font-medium text-xs font-mono">{formatTwitterMetric(impressions)}</span>
            </div>

            {/* 4. Bookmark & Share */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBookmarked(prev => !prev);
                }}
                className={`p-1.5 rounded-full hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer ${
                  isBookmarked ? 'text-sky-400' : ''
                }`}
                title="Bookmark"
              >
                <Bookmark className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleShareTake}
                className="p-1.5 rounded-full hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                title="Share"
                aria-label="Share"
                data-testid="post-share-btn"
              >
                <Share className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BanterReplyModal
        post={post}
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        onSuccess={() => setReplyCount(prev => prev + 1)}
      />

      <AvatarViewModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        imageUrl={authorMeta.avatarUrl}
        sessionName={authorMeta.displayName}
        handle={cleanHandle}
        isCoach={authorMeta.isCoach}
        isJournalist={authorMeta.isJournalist}
        coachLeague={authorMeta.coachLeague}
      />

      <ImageLightboxModal
        isOpen={Boolean(lightboxImageUrl)}
        imageUrl={lightboxImageUrl}
        altText="Full preview"
        onClose={() => setLightboxImageUrl(null)}
      />
    </article>
  );
};
