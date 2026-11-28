import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  BarChart2,
  Bookmark,
  Heart,
  Film,
  Shield,
  Flame,
  AlertCircle,
  MoreHorizontal,
  Pin
} from 'lucide-react';
import { formatRelativeTime, formatTeamTag, getCleanMessageRef, MENTION_AND_TAG_REGEX } from '../../lib/predictions/utils';
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
import { banterService, parsePollFromContent, parseMediaFromContent } from '../../services/predictions/banterService';
import { supabase } from '../../lib/supabase';
import type { BanterPost, ReactionType } from '../../types/predictions';

interface BanterPostCardProps {
  post: BanterPost;
  isHot?: boolean;
  onToggleReaction: (postId: string, type: ReactionType) => void;
  onOpenComments: (post: BanterPost) => void;
  onSelectMatchContext?: (matchId: string) => void;
  onRepost?: (postId: string, active: boolean) => void;
  onNavigateTeamProfile?: (team: string) => void;
  onPinChange?: () => void;
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
  onNavigateTeamProfile,
  onPinChange,
}) => {
  const session = getActiveSessionProfile();
  const currentDeviceId = session?.deviceId || (typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : null);
  const postAuthorDeviceId = post.authorDeviceId || (post as any).author_device_id || post.userId;
  const isYou = Boolean(currentDeviceId && postAuthorDeviceId === currentDeviceId);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const authorMeta = getAuthorIdentityMeta(post);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    Boolean((post as any).isBookmarked || (post as any).is_bookmarked)
  );
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  // Pure Database-Driven Metrics: all strictly defaulting to 0, zero client seeds
  const impressions = post.impressionsCount ?? post.impressions ?? (post as any).views_count ?? 0;

  const [replyCount, setReplyCount] = useState(post.commentCount ?? post.repliesCount ?? 0);
  useEffect(() => {
    setReplyCount(post.commentCount ?? post.repliesCount ?? 0);
  }, [post.commentCount, post.repliesCount]);

  const initialLikes = post.likesCount ?? post.reactionFireCount ?? (post as any).likes ?? 0;
  const [likesCount, setLikesCount] = useState<number>(initialLikes);
  const initialLiked = Boolean(post.isLiked || post.userReactions?.fire);
  const [isLiked, setIsLiked] = useState<boolean>(initialLiked);

  useEffect(() => {
    setLikesCount(post.likesCount ?? post.reactionFireCount ?? (post as any).likes ?? 0);
    setIsLiked(Boolean(post.isLiked || post.userReactions?.fire));
  }, [post.likesCount, post.reactionFireCount, post.isLiked, post.userReactions]);

  // Pinned state & 3-dots dropdown options
  const initialPinned = Boolean(post.isPinned || (post as any).is_pinned);
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinInputValue, setPinInputValue] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsPinned(Boolean(post.isPinned || (post as any).is_pinned));
  }, [post.isPinned, (post as any).is_pinned]);

  // Close menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowPinInput(false);
        setPinInputValue('');
        setPinError(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const [expanded, setExpanded] = useState(false);

  const cleanHandle = post.authorHandle.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const handlePostClick = (e?: React.MouseEvent) => {
    if (lightboxImageUrl !== null || isMenuOpen) return;
    if (e) {
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        !target.isConnected ||
        target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
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
        target.closest('[data-testid="post-options-dropdown"]') ||
        target.closest('[data-testid="see-team-profile-btn"]')
      ) {
        return;
      }
    }
    // Navigate to full-page thread view (clean message ref, never internal UID)
    const messageRef = getCleanMessageRef(post);
    try {
      sessionStorage.setItem('active_banter_thread_id', post.id);
      sessionStorage.setItem(`banter_ref_${messageRef}`, post.id);
      sessionStorage.setItem('active_banter_post', JSON.stringify(post));
    } catch {}
    banterService.registerPost(post);
    banterService.registerPostRef(post.id, messageRef);
    window.location.hash = `#/banter/${messageRef}?id=${post.id}`;
    if (onOpenComments) onOpenComments(post);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((prev) => Math.max(0, prev + (next ? 1 : -1)));
    if (onToggleReaction) {
      onToggleReaction(post.id, 'fire');
    } else {
      banterService.toggleReaction(post.id, 'fire').catch(console.warn);
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isBookmarked;
    setIsBookmarked(next);
    banterService.toggleBookmark(post.id, next).catch(console.warn);
  };

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = pinInputValue.trim();
    if (trimmed !== '1574') {
      setPinError('Invalid PIN code.');
      return;
    }

    setIsPinSubmitting(true);
    setPinError(null);

    try {
      if (!isPinned) {
        // Enforce max 2 pinned limitation
        let currentlyPinnedCount = 0;
        try {
          const { data, error } = await supabase
            .from('banter_posts')
            .select('id')
            .eq('is_pinned', true);
          if (!error && data) {
            currentlyPinnedCount = data.length;
          }
        } catch (err) {
          console.warn('Check pinned count error:', err);
        }

        if (currentlyPinnedCount >= 2) {
          setPinError('Only 2 messages can be pinned at a time. One must be unpinned to pin another.');
          setIsPinSubmitting(false);
          return;
        }

        if (typeof (banterService as any).pinBanterPost === 'function') {
          await (banterService as any).pinBanterPost(post.id, trimmed);
        } else {
          const { error } = await supabase.rpc('pin_banter_post', {
            p_post_id: post.id,
            p_pin: trimmed,
          });
          if (error) throw error;
        }

        setIsPinned(true);
        post.isPinned = true;
        (post as any).is_pinned = true;
      } else {
        if (typeof (banterService as any).unpinBanterPost === 'function') {
          await (banterService as any).unpinBanterPost(post.id, trimmed);
        } else {
          const { error } = await supabase.rpc('unpin_banter_post', {
            p_post_id: post.id,
            p_pin: trimmed,
          });
          if (error) throw error;
        }

        setIsPinned(false);
        post.isPinned = false;
        (post as any).is_pinned = false;
      }

      setIsMenuOpen(false);
      setShowPinInput(false);
      setPinInputValue('');
      if (onPinChange) onPinChange();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('unpinned') || msg.includes('2') || msg.includes('limit') || msg.includes('pinned')) {
        setPinError('Only 2 messages can be pinned at a time. One must be unpinned to pin another.');
      } else if (msg.includes('PIN') || msg.includes('pin')) {
        setPinError('Invalid PIN code.');
      } else {
        setPinError(msg || 'Failed to update pin status.');
      }
    } finally {
      setIsPinSubmitting(false);
    }
  };

  const taggedTeam = useMemo(() => {
    if (post.taggedTeamName) return post.taggedTeamName;
    if ((post as any).tagged_team) return (post as any).tagged_team;
    if ((post as any).tagged_team_name) return (post as any).tagged_team_name;
    if ((post as any).team) return (post as any).team;
    if (post.content) {
      const match = post.content.match(/[@#]([a-zA-Z0-9_\s]{3,25})/);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }, [post.taggedTeamName, (post as any).tagged_team, (post as any).tagged_team_name, (post as any).team, post.content]);

  const handleNavigateToTeamProfile = (teamIdentifier: string) => {
    if (onNavigateTeamProfile) {
      onNavigateTeamProfile(teamIdentifier);
    } else {
      try {
        window.dispatchEvent(new CustomEvent('navigate-team-profile', { detail: { team: teamIdentifier } }));
      } catch {}
      window.location.hash = `#/team/${encodeURIComponent(teamIdentifier)}`;
    }
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

  const parsedFromContent = useMemo(() => {
    return parseMediaFromContent(post.content || '');
  }, [post.content]);

  const mediaList = useMemo(() => {
    if (post.mediaUrls && post.mediaUrls.length > 0) return post.mediaUrls;
    if (post.imageUrl) return [post.imageUrl];
    return parsedFromContent.mediaUrls;
  }, [post.mediaUrls, post.imageUrl, parsedFromContent.mediaUrls]);

  const effectiveMediaType = useMemo(() => {
    if (post.mediaType && post.mediaType !== 'NONE') return post.mediaType;
    if (parsedFromContent.mediaType !== 'NONE') return parsedFromContent.mediaType;
    return mediaList.some(u => typeof u === 'string' && u.includes('.mp4')) ? 'VIDEO' : (mediaList.length > 1 ? 'DUAL_IMAGE' : (mediaList.length === 1 ? 'IMAGE' : 'NONE'));
  }, [post.mediaType, parsedFromContent.mediaType, mediaList]);

  const parsedPollFromContent = useMemo(() => {
    return parsePollFromContent(post.content || '', post.id);
  }, [post.content, post.id]);

  const effectivePoll = useMemo(() => {
    if (post.poll) return post.poll;
    if (post.pollId) {
      const fromSvc = banterService.getPollById(post.pollId);
      if (fromSvc) return fromSvc;
    }
    return parsedPollFromContent.poll;
  }, [post.poll, post.pollId, parsedPollFromContent.poll]);

  const isPoll = Boolean(
    post.type === 'poll' ||
    (Array.isArray(post.type) && post.type.includes('poll')) ||
    (Array.isArray(post.types) && post.types.includes('poll')) ||
    effectivePoll
  );

  const displayContent = useMemo(() => {
    let raw = post.content || '';
    if (raw.includes('[poll:')) {
      raw = raw.replace(/\[poll:[\s\S]*?\]/g, '').trim();
    }
    if (raw.includes('[media:')) {
      raw = raw.replace(/\[media:(image|video):[^\]]+\]/g, '').trim();
    }
    if (!raw && effectivePoll) {
      return effectivePoll.question;
    }
    return raw;
  }, [post.content, effectivePoll]);

  return (
    <article
      data-testid="banter-post-card"
      onClick={handlePostClick}
      className={`group relative overflow-hidden px-1 py-3 sm:px-1.5 sm:py-3.5 transition-all duration-300 cursor-pointer hover:bg-white/[0.02] max-w-2xl mx-auto border-b border-zinc-800/70 ${
        isHot || post.isTrending ? 'bg-amber-500/[0.02]' : ''
      } ${post.isPending ? 'opacity-70 filter brightness-85 blur-[0.4px] select-none pointer-events-none' : ''}`}
    >
      {/* Thin Blue Range Strip flowing across when posting */}
      {post.isPending && (
        <div className="banter-range-strip">
          <div className="banter-range-strip-bar" />
        </div>
      )}

      {/* Pinned Message Indicator */}
      {isPinned && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1.5 pl-12" data-testid="pinned-badge">
          <Pin className="h-3.5 w-3.5 fill-amber-400 rotate-45" />
          <span>Pinned message</span>
        </div>
      )}

      {post.postError && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span>Database write failed: {post.postError}</span>
          </span>
        </div>
      )}

      {(isHot || post.isTrending) && !post.isPending && (
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      )}
      <div className="flex gap-2.5 sm:gap-3">
        {/* User Avatar / Logo */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAvatarModalOpen(true);
            }}
            className="group/avatar flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full overflow-hidden shadow-sm border border-white/10 hover:border-sky-400 transition cursor-pointer"
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
          {/* Header: Name, Verified Badge, @Handle · Time + 3-dots Menu */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAvatarModalOpen(true);
                }}
                className="font-bold text-white text-[15px] hover:underline hover:text-sky-300 truncate max-w-[130px] sm:max-w-[170px] cursor-pointer text-left"
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

              <span className="text-sm text-zinc-500 font-normal truncate max-w-[100px] sm:max-w-[120px]">
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

            {/* 3-Dots Dropdown Options Menu */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                  setShowPinInput(false);
                  setPinInputValue('');
                  setPinError(null);
                }}
                className="p-1 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title="More options"
                aria-label="More options"
                data-testid="post-options-menu-button"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-7 z-30 w-56 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1.5 text-xs text-zinc-200 animate-fadeIn"
                  data-testid="post-options-dropdown"
                >
                  {!showPinInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPinInput(true);
                        setPinError(null);
                        setPinInputValue('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-left text-zinc-200 hover:text-white transition-colors cursor-pointer"
                      data-testid="pin-toggle-menu-item"
                    >
                      <Pin className="h-3.5 w-3.5 text-amber-400 rotate-45" />
                      <span>{isPinned ? 'Unpin message' : 'Pin message'}</span>
                    </button>
                  ) : (
                    <div className="p-2 space-y-2">
                      <div className="text-[11px] text-zinc-400 font-medium">
                        {isPinned ? 'Enter PIN to unpin' : 'Enter PIN to pin message'}
                      </div>
                      <form onSubmit={handlePinSubmit} className="space-y-2">
                        <input
                          type="password"
                          value={pinInputValue}
                          onChange={(e) => {
                            setPinInputValue(e.target.value);
                            setPinError(null);
                          }}
                          placeholder="Enter PIN"
                          autoFocus
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                          data-testid="pin-input-field"
                        />
                        {pinError && (
                          <div className="text-[11px] text-rose-400 leading-tight font-medium" data-testid="pin-error-message">
                            {pinError}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPinInput(false);
                              setPinError(null);
                              setPinInputValue('');
                            }}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isPinSubmitting}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] cursor-pointer disabled:opacity-50"
                            data-testid="pin-submit-button"
                          >
                            {isPinSubmitting ? '...' : isPinned ? 'Unpin' : 'Pin'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
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

          {/* Replying to indicator if this is a reply card */}
          {(post.replyingToHandle || (post as any).replying_to) && (
            <div className="mt-1 text-xs text-zinc-500 font-sans">
              <span>Replying to </span>
              <span className="text-sky-400 font-medium">
                @{((post.replyingToHandle || (post as any).replying_to) as string).replace(/[^a-z0-9_]/gi, '')}
              </span>
            </div>
          )}

          {/* Tweet Text Content with Maximum View Limit */}
          <p
            data-testid="banter-post-content"
            onClick={handlePostClick}
            className="mt-2 text-[15px] text-zinc-100 leading-relaxed break-words whitespace-pre-wrap select-text font-normal cursor-pointer"
          >
            {renderTweetContent(
              !expanded && displayContent.length > MAX_VIEW_CHARS
                ? `${displayContent.slice(0, MAX_VIEW_CHARS).trim()}…`
                : displayContent
            )}
            {displayContent.length > MAX_VIEW_CHARS && (
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
              {effectiveMediaType === 'VIDEO' ? (
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
          {isPoll && effectivePoll && (
            <div data-poll-widget onClick={(e) => e.stopPropagation()}>
              <XPollWidget
                poll={effectivePoll}
                onPollUpdated={(updated) => {
                  post.poll = updated;
                }}
              />
            </div>
          )}

          {/* Tagged Team Button */}
          {taggedTeam && (
            <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateToTeamProfile(taggedTeam);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/25 transition-colors text-xs font-semibold cursor-pointer"
                data-testid="see-team-profile-btn"
                aria-label={`see ${formatTeamTag(taggedTeam) || taggedTeam} profile`}
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>see {formatTeamTag(taggedTeam) || taggedTeam} profile</span>
              </button>
            </div>
          )}

          {/* Action & Banter Reactions Bar */}
          <div
            data-action-buttons
            data-testid="action-buttons-bar"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex items-center justify-between text-xs text-zinc-500 max-w-md"
          >
            {/* 1. Comments */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsReplyModalOpen(true);
              }}
              className="flex items-center gap-1.5 p-1.5 -ml-1 rounded-full hover:bg-sky-500/10 text-zinc-400 hover:text-sky-400 transition-colors cursor-pointer group/reply"
              title="Reply / Comments"
              data-testid="post-comments-btn"
            >
              <MessageCircle className="h-4 w-4 group-hover/reply:text-sky-400 transition-colors" />
              <span className="font-medium text-xs font-mono">{replyCount}</span>
            </button>

            {/* 2. Likes (adequate space provided) */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 p-1.5 px-3 rounded-full hover:bg-rose-500/10 transition-colors cursor-pointer group/like shrink-0 min-w-[3.75rem] ${
                isLiked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
              data-testid="post-like-btn"
              aria-label="Like"
            >
              <Heart className={`h-4 w-4 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'group-hover/like:text-rose-500'}`} />
              <span className="font-medium text-xs font-mono">{likesCount}</span>
            </button>

            {/* 3. Impressions (clicking opens main message) */}
            <button
              type="button"
              data-testid="message-impressions"
              onClick={(e) => {
                e.stopPropagation();
                handlePostClick();
              }}
              className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-sky-500/10 text-zinc-500 hover:text-sky-400 transition-colors cursor-pointer select-none group"
              title={`${impressions.toLocaleString()} views - View post`}
              aria-label="View post"
            >
              <BarChart2 className="h-4 w-4 group-hover:text-sky-400 transition-colors" />
              <span className="font-medium text-xs font-mono group-hover:text-sky-400 transition-colors">
                {formatTwitterMetric(impressions)}
              </span>
            </button>

            {/* 4. Favourite (Bookmark) */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-1.5 rounded-full hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer ${
                isBookmarked ? 'text-amber-400' : 'text-zinc-500'
              }`}
              title={isBookmarked ? 'Remove Favourite' : 'Favourite'}
              data-testid="post-bookmark-btn"
              aria-label="Bookmark"
            >
              <Bookmark className={`h-4 w-4 transition-colors ${isBookmarked ? 'fill-amber-400 text-amber-400' : 'group-hover/bookmark:text-amber-400'}`} />
            </button>
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
