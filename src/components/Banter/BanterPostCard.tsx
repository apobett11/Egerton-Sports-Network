import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Repeat2,
  BarChart2,
  Share,
  Bookmark,
  Film,
  Shield,
  Flame,
  Smile
} from 'lucide-react';
import { formatRelativeTime } from '../../lib/predictions/utils';
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
  const session = getActiveSessionProfile();
  const currentDeviceId = session?.deviceId || (typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : null);
  const postAuthorDeviceId = post.authorDeviceId || (post as any).author_device_id || post.userId;
  const isYou = Boolean(currentDeviceId && postAuthorDeviceId === currentDeviceId);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const authorMeta = getAuthorIdentityMeta(post);

  const isJournalist = authorMeta.isJournalist;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyCount, setReplyCount] = useState(post.commentCount || post.repliesCount || 0);
  React.useEffect(() => {
    setReplyCount(post.commentCount || post.repliesCount || 0);
  }, [post.commentCount, post.repliesCount]);
  const [expanded, setExpanded] = useState(false);
  const [repostCount, setRepostCount] = useState(
    post.repostCount || post.repostsCount || Math.floor((post.reactionFireCount + 5) * 1.4)
  );
  const [hasReposted, setHasReposted] = useState(false);
  const [isLiked, setIsLiked] = useState(Boolean(post.userReactions?.fire));
  const [likesCount, setLikesCount] = useState(
    post.likesCount || post.reactionFireCount || 0
  );

  const isMessage = Boolean(post.parentId || (post.rootId && post.rootId !== post.id));
  const isTrending = Boolean(post.isTrending && !isMessage);
  let baseImp = post.impressions ?? post.impressionsCount;
  if (!baseImp) {
    if (isTrending) {
      baseImp = 1500 + Math.min(440, 220 + ((post.reactionFireCount || 0) * 2));
    } else {
      baseImp = Math.min(1500, Math.max(500, 500 + ((post.reactionFireCount || 0) * 8) + ((post.commentCount || 0) * 12)));
    }
  } else if (isTrending) {
    baseImp = Math.min(1940, Math.max(1501, baseImp > 1500 ? baseImp : 1500 + (baseImp % 440)));
  } else {
    if (baseImp > 1500) {
      baseImp = Math.min(1500, Math.max(500, 500 + (baseImp % 1000)));
    } else if (baseImp < 500 && (baseImp < 18 || baseImp > 45)) {
      baseImp = Math.min(1500, Math.max(500, 500 + (baseImp % 500)));
    }
  }
  const impressions = baseImp;

  const cleanHandle = post.authorHandle.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const [reactions, setReactions] = useState({
    fire: post.reactionFireCount || 0,
    clown: post.reactionClownCount || 0,
    skull: post.reactionSkullCount || 0,
  });
  const [userReactions, setUserReactions] = useState({
    fire: Boolean(post.userReactions?.fire),
    clown: Boolean(post.userReactions?.clown),
    skull: Boolean(post.userReactions?.skull),
  });
  const [isReactionMenuOpen, setIsReactionMenuOpen] = useState(false);
  const reactionPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReactionMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) {
        setIsReactionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isReactionMenuOpen]);

  const handlePostClick = () => {
    // Navigate to full-page thread view
    sessionStorage.setItem('active_banter_thread_id', post.id);
    window.location.hash = `#/banter/${post.id}`;
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

  const handleBanterReaction = (e: React.MouseEvent, type: ReactionType) => {
    e.stopPropagation();
    const active = !userReactions[type];
    setUserReactions((prev) => ({ ...prev, [type]: active }));
    setReactions((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + (active ? 1 : -1)),
    }));
    if (type === 'fire') {
      setIsLiked(active);
      setLikesCount((prev) => Math.max(0, prev + (active ? 1 : -1)));
    }
    Promise.resolve().then(() => onToggleReaction(post.id, type)).catch(console.warn);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    handleBanterReaction(e, 'fire');
  };

  const handleShareTake = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareBanterSnapshot(post, null);
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
      className={`group relative overflow-hidden px-4 py-3.5 sm:px-4 sm:py-4 transition-colors duration-150 cursor-pointer hover:bg-white/[0.02] ${
        isHot || post.isTrending ? 'bg-amber-500/[0.02]' : ''
      }`}
    >
      {(isHot || post.isTrending) && (
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      )}
      <div className="flex gap-3">
        {/* User Avatar - Clicking opens Large Image Modal with Session Name & Privacy Notice */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAvatarModalOpen(true);
            }}
            className="group/avatar flex h-10 w-10 items-center justify-center rounded-full overflow-hidden shadow-sm border border-white/10 hover:border-sky-400 transition cursor-pointer"
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
                className="font-bold text-white text-sm hover:underline hover:text-sky-300 truncate max-w-[150px] cursor-pointer text-left"
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
                      <span>{post.taggedTeamName ? `${post.taggedTeamName} Coach` : 'Championship Coach'}</span>
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    <OrangeCoachTick className="h-4 w-4" />
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/15 px-2 py-0.2 text-[9px] font-black uppercase text-orange-400 border border-orange-500/30">
                      <Shield className="h-2.5 w-2.5 text-orange-400" />
                      <span>{post.taggedTeamName ? `${post.taggedTeamName} Coach` : 'EPL Coach'}</span>
                    </span>
                  </div>
                )
              ) : null}

              <span className="text-xs text-zinc-500 font-mono truncate max-w-[100px]">
                @{cleanHandle}
              </span>

              <span className="text-zinc-600 text-xs">·</span>

              <span className="text-xs text-zinc-500 whitespace-nowrap">
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
                <span>⚽ {post.matchContext.homeTeamName} vs {post.matchContext.awayTeamName}</span>
              </span>
            )}

            {post.taggedTeamName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
                <Shield className="h-2.5 w-2.5" />
                <span>@{post.taggedTeamName}</span>
              </span>
            )}
          </div>

          {/* Tweet Text Content with Maximum View Limit */}
          <p
            data-testid="banter-post-content"
            className="mt-2 text-[15px] text-zinc-100 leading-relaxed break-words whitespace-pre-wrap select-text font-normal"
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
            <XPollWidget
              poll={post.poll}
              onPollUpdated={(updated) => {
                post.poll = updated;
              }}
            />
          )}

          {/* Action & Banter Reactions Bar */}
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 max-w-md">
            {/* 1. Reply */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsReplyModalOpen(true);
              }}
              className="flex items-center gap-1.5 p-1.5 -ml-1.5 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors cursor-pointer group/reply"
              title="Reply"
            >
              <MessageCircle className="h-4 w-4 group-hover/reply:text-[#1d9bf0]" />
              <span className="font-medium text-xs">💬 {replyCount}</span>
            </button>

            {/* 2. Repost */}
            <button
              type="button"
              onClick={handleRepost}
              className={`flex items-center gap-1.5 p-1.5 rounded-full hover:text-[#00ba7c] hover:bg-[#00ba7c]/10 transition-colors cursor-pointer group/repost ${
                hasReposted ? 'text-[#00ba7c]' : ''
              }`}
              title="Repost"
            >
              <Repeat2 className="h-4 w-4 group-hover/repost:text-[#00ba7c]" />
              <span className="font-medium text-xs">{repostCount}</span>
            </button>

            {/* 3. Consolidated Emoji Reaction Picker */}
            {(() => {
              const activeUserReactionType: ReactionType | null =
                userReactions.fire ? 'fire' : userReactions.clown ? 'clown' : userReactions.skull ? 'skull' : null;
              const totalReactions = (reactions.fire || 0) + (reactions.clown || 0) + (reactions.skull || 0);

              return (
                <div
                  ref={reactionPickerRef}
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsReactionMenuOpen((prev) => !prev);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-all cursor-pointer group ${
                      activeUserReactionType === 'fire'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                        : activeUserReactionType === 'clown'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                        : activeUserReactionType === 'skull'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
                        : 'hover:bg-zinc-800 text-zinc-400 hover:text-amber-400'
                    }`}
                    title="React"
                    aria-label="React"
                    data-testid="emoji-reaction-trigger"
                  >
                    {activeUserReactionType === 'fire' ? (
                      <span className="text-xs">🔥</span>
                    ) : activeUserReactionType === 'clown' ? (
                      <span className="text-xs">🤡</span>
                    ) : activeUserReactionType === 'skull' ? (
                      <span className="text-xs">💀</span>
                    ) : (
                      <Smile className="h-3.5 w-3.5 text-zinc-400 group-hover:text-amber-400" />
                    )}
                    <span className="text-[11px] font-mono">
                      {totalReactions > 0 ? totalReactions : ''}
                    </span>
                  </button>

                  {/* Reaction Popover Array */}
                  {isReactionMenuOpen && (
                    <div
                      role="toolbar"
                      aria-label="Reaction options"
                      data-testid="reaction-emoji-array"
                      className="absolute bottom-full mb-1.5 left-0 z-40 flex items-center gap-1.5 p-1.5 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-full shadow-2xl animate-in fade-in zoom-in-95"
                    >
                      <button
                        type="button"
                        data-testid="react-fire-btn"
                        aria-label="Fire reaction"
                        title="Fire Take 🔥"
                        onClick={(e) => {
                          handleBanterReaction(e, 'fire');
                          setIsReactionMenuOpen(false);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          userReactions.fire
                            ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400 scale-105'
                            : 'hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 hover:scale-110'
                        }`}
                      >
                        <span className="text-sm">🔥</span>
                        <span className="text-[10px] font-mono">{reactions.fire}</span>
                      </button>

                      <button
                        type="button"
                        data-testid="react-clown-btn"
                        aria-label="Clown reaction"
                        title="Clown / Delusional 🤡"
                        onClick={(e) => {
                          handleBanterReaction(e, 'clown');
                          setIsReactionMenuOpen(false);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          userReactions.clown
                            ? 'bg-yellow-500/30 text-yellow-300 ring-1 ring-yellow-400 scale-105'
                            : 'hover:bg-yellow-500/15 text-zinc-300 hover:text-yellow-300 hover:scale-110'
                        }`}
                      >
                        <span className="text-sm">🤡</span>
                        <span className="text-[10px] font-mono">{reactions.clown}</span>
                      </button>

                      <button
                        type="button"
                        data-testid="react-skull-btn"
                        aria-label="Skull reaction"
                        title="Savage Take 💀"
                        onClick={(e) => {
                          handleBanterReaction(e, 'skull');
                          setIsReactionMenuOpen(false);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          userReactions.skull
                            ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-400 scale-105'
                            : 'hover:bg-purple-500/15 text-zinc-300 hover:text-purple-300 hover:scale-110'
                        }`}
                      >
                        <span className="text-sm">💀</span>
                        <span className="text-[10px] font-mono">{reactions.skull}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 6. Impressions */}
            <div className="hidden xs:flex items-center gap-1 text-zinc-500" title="Views">
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="text-[11px] font-mono">{formatTwitterMetric(impressions)}</span>
            </div>

            {/* 7. Bookmark & Share */}
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
    </article>
  );
};
