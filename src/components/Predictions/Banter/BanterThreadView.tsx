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
  Send,
  BarChart2,
  AtSign,
  Smile,
  Flame
} from 'lucide-react';
import { supabase } from '../../../lib/predictions/banterSupabase';
import { banterService } from '../../../services/predictions/banterService';
import { shareBanterSnapshot } from '../../../lib/shareSnapshot';
import { BanterReplyModal } from '../../Banter/BanterReplyModal';
import { XPollWidget } from './XPollWidget';
import { BanterPostCard } from './BanterPostCard';
import { useBanterSession } from '../../../hooks/useBanterSession';
import { EPL_TEAMS } from '../../../lib/predictions/eplTeams';
import { getOrCreatePermanentDeviceId } from '../../../utils/sessionIdentity';
import {
  getAuthorIdentityMeta,
  InstagramBlueTick,
  OrangeCoachTick,
  ChampionshipAmberCoachTick,
  AvatarViewModal
} from '../../../lib/predictions/footballAvatars';
import type { BanterPost, BanterMediaType, ReactionType } from '../../../types/predictions';

interface BanterThreadViewProps {
  postId: string;
  onBack: (updatedCommentCount?: number, targetId?: string, targetContent?: string) => void;
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
  const { profile } = useBanterSession();
  const currentDeviceId = profile?.deviceId || (typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : '');
  const [post, setPost] = useState<BanterPost | null>(null);
  const [ancestry, setAncestry] = useState<BanterPost[]>([]);
  const [replies, setReplies] = useState<BanterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [repostCount, setRepostCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Main Reply State
  const [singleReplyText, setSingleReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [moreStories, setMoreStories] = useState<BanterPost[]>([]);
  const channelRef = useRef<any>(null);

  // Deep Reply (Reply to Reply) State
  const [activeDeepReplyTargetId, setActiveDeepReplyTargetId] = useState<string | null>(null);
  const [deepReplyText, setDeepReplyText] = useState('');
  const [activeReplyReactionPickerId, setActiveReplyReactionPickerId] = useState<string | null>(null);

  // Team Autocomplete State
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string; shortName?: string }>>(EPL_TEAMS);
  const [showThreadTeamDropdown, setShowThreadTeamDropdown] = useState(false);
  const [threadTeamFilterQuery, setThreadTeamFilterQuery] = useState('');
  const [selectedThreadTeam, setSelectedThreadTeam] = useState<{ id: string; name: string } | null>(null);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const authorMeta = post ? getAuthorIdentityMeta(post) : null;

  const rootAuthorDeviceId = post?.authorDeviceId || (post as any)?.author_device_id || post?.userId;
  const isRootYou = Boolean(currentDeviceId && rootAuthorDeviceId === currentDeviceId);

  const [threadReactions, setThreadReactions] = useState<{ fire: number; clown: number; skull: number }>({
    fire: 0,
    clown: 0,
    skull: 0,
  });
  const [threadUserReactions, setThreadUserReactions] = useState<{ fire?: boolean; clown?: boolean; skull?: boolean }>({});
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

  // Scroll to absolute top on mount / navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setVisibleRepliesCount(10);
  }, [postId]);

  const [visibleRepliesCount, setVisibleRepliesCount] = useState(10);
  const [replyTargetPost, setReplyTargetPost] = useState<BanterPost | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const scrollBottom = window.innerHeight + window.scrollY;
        if (scrollBottom >= document.body.offsetHeight - 500) {
          setVisibleRepliesCount(prev => (prev < replies.length ? prev + 5 : prev));
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [replies.length]);

  const loadThread = useCallback(async () => {
    setIsLoading(true);
    const devId = currentDeviceId || (typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : '');
    const data = await banterService.fetchThread(postId, devId);
    if (data.post) {
      setPost(data.post);
      setAncestry(data.ancestry);
      setReplies(data.replies);
      setLikeCount(data.post.reactionFireCount || data.post.likesCount || 0);
      setRepostCount(data.post.repostCount || data.post.repostsCount || 0);
      setLiked(Boolean(data.post.userReactions?.fire));
      setReposted(Boolean(data.post.isReposted));
      setThreadReactions({
        fire: data.post.reactionFireCount || data.post.likesCount || 0,
        clown: data.post.reactionClownCount || 0,
        skull: data.post.reactionSkullCount || 0,
      });
      setThreadUserReactions({
        fire: Boolean(data.post.userReactions?.fire),
        clown: Boolean(data.post.userReactions?.clown),
        skull: Boolean(data.post.userReactions?.skull),
      });
    }
    try {
      const feedPosts = await banterService.fetchPosts('trending', null, 8, 0, devId);
      setMoreStories((feedPosts as BanterPost[]).filter((p: BanterPost) => p.id !== postId).slice(0, 3));
    } catch {
      // offline safe
    }
    setIsLoading(false);
  }, [postId, currentDeviceId]);

  // Load campus teams for autocomplete
  useEffect(() => {
    let mounted = true;
    supabase.from('teams').select('id, name, short_name').then(
      ({ data, error }) => {
        if (mounted) {
          const teamMap = new Map<string, { id: string; name: string; shortName?: string }>();
          EPL_TEAMS.forEach(t => teamMap.set(t.name.toLowerCase(), t));
          if (!error && data && data.length > 0) {
            data.forEach((t: any) => {
              teamMap.set(t.name.toLowerCase(), {
                id: t.id,
                name: t.name,
                shortName: t.short_name || t.name.slice(0, 3).toUpperCase()
              });
            });
          }
          setAvailableTeams(Array.from(teamMap.values()));
        }
      },
      () => {
        if (mounted) {
          setAvailableTeams(EPL_TEAMS);
        }
      }
    );
    return () => { mounted = false; };
  }, []);

  // Supabase Realtime Channel & Broadcast Scoping with Channel Isolation & Safe Teardown
  useEffect(() => {
    if (!postId) return;

    loadThread();

    const selfDeviceId = profile?.deviceId || currentDeviceId;
    const channelName = `scoped_thread_${postId}`;
    const channel = supabase.channel(channelName, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'new_reply' }, (payload) => {
        if (payload?.payload?.reply) {
          const item = payload.payload.reply as BanterPost;
          if (item.authorDeviceId && item.authorDeviceId === selfDeviceId) return;
          setReplies((prev) => {
            if (prev.some((r) => r.id === item.id || (r.content === item.content && (r.authorDeviceId === item.authorDeviceId || r.authorHandle === item.authorHandle)))) return prev;
            return [...prev, item];
          });
          setPost((curr) => curr ? { ...curr, commentCount: (curr.commentCount || 0) + 1, repliesCount: (curr.repliesCount || 0) + 1 } : null);
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'banter_posts',
          filter: `root_id=eq.${postId}`,
        },
        (payload) => {
          if (payload?.new) {
            const item = payload.new as any;
            if (item.author_device_id && item.author_device_id === selfDeviceId) {
              setReplies((prev) => prev.map((r) => (r.content === item.content && r.id.startsWith('temp-')) ? { ...r, id: item.id } : r));
              return;
            }
            const mapped: BanterPost = {
              id: item.id,
              parentId: item.parent_id,
              rootId: item.root_id,
              depth: item.depth || 1,
              content: item.content,
              userId: item.author_device_id || item.user_id,
              authorDeviceId: item.author_device_id,
              author_device_id: item.author_device_id,
              authorHandle: item.author_handle || 'fanatic',
              authorName: item.author_name || 'Fanatic',
              authorAvatar: item.author_avatar || '#2563eb',
              authorType: item.author_type || 'user',
              sourceType: 'user',
              reactionFireCount: 0,
              reactionClownCount: 0,
              reactionSkullCount: 0,
              commentCount: 0,
              repliesCount: 0,
              createdAt: item.created_at || new Date().toISOString(),
            };
            setReplies((prev) => {
              if (prev.some((r) => r.id === mapped.id || (r.content === mapped.content && (r.authorDeviceId === mapped.authorDeviceId || r.authorHandle === mapped.authorHandle)))) {
                return prev.map(r => (r.content === mapped.content) ? { ...r, id: mapped.id } : r);
              }
              return [...prev, mapped];
            });
            setPost((curr) => curr ? { ...curr, commentCount: (curr.commentCount || 0) + 1, repliesCount: (curr.repliesCount || 0) + 1 } : null);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && channel) {
          (channel as any).state = 'joined';
        }
      });

    (channel as any).state = 'joined';
    channelRef.current = channel;
    if (typeof window !== 'undefined') {
      (window as any).__active_banter_channel = channel;
    }

    // Cross-context BroadcastChannel for zero-bleed room isolation
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(channelName);
        bc.onmessage = (event) => {
          if (event.data?.type === 'new_reply' && event.data?.reply) {
            const rep = event.data.reply as BanterPost;
            if (rep.authorDeviceId && rep.authorDeviceId === selfDeviceId) return;
            setReplies((prev) => {
              if (prev.some((r) => r.id === rep.id || (r.content === rep.content && (r.authorDeviceId === rep.authorDeviceId || r.authorHandle === rep.authorHandle)))) return prev;
              return [...prev, rep];
            });
            setPost((curr) => curr ? { ...curr, commentCount: (curr.commentCount || 0) + 1, repliesCount: (curr.repliesCount || 0) + 1 } : null);
          }
        };
      }
    } catch {}

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typeof window !== 'undefined') {
        if ((window as any).__active_banter_channel === channel) {
          (window as any).__active_banter_channel = { state: 'closed' };
        }
      }
      if (bc) {
        bc.close();
      }
    };
  }, [postId, loadThread]);

  const handleThreadReaction = async (type: ReactionType) => {
    if (!post) return;
    const active = !threadUserReactions[type];
    setThreadUserReactions((prev) => ({ ...prev, [type]: active }));
    setThreadReactions((prev) => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + (active ? 1 : -1)),
    }));
    if (type === 'fire') {
      setLiked(active);
      setLikeCount((prev) => Math.max(0, prev + (active ? 1 : -1)));
    }
    await banterService.toggleReaction(post.id, type);
  };

  const handleToggleLike = async () => {
    await handleThreadReaction('fire');
  };

  const handleToggleRepost = () => {
    if (!post) return;
    const nextReposted = !reposted;
    setReposted(nextReposted);
    setRepostCount(prev => prev + (nextReposted ? 1 : -1));
  };

  const handleShare = () => {
    if (!post) return;
    shareBanterSnapshot(post, null);
  };

  // Content change handler for @team autocomplete
  const handleSingleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 280);
    setSingleReplyText(val);

    const cursorPos = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursorPos);
    const match = textBefore.match(/@([a-zA-Z0-9_\s]*)$/);

    if (match) {
      const query = match[1];
      if (!query.includes('\n') && query.length < 25) {
        setThreadTeamFilterQuery(query.toLowerCase());
        setShowThreadTeamDropdown(true);
        return;
      }
    }
    setShowThreadTeamDropdown(false);
  };

  const handleSelectThreadTeam = (team: { id: string; name: string }) => {
    setSelectedThreadTeam(team);
    setShowThreadTeamDropdown(false);

    const atIndex = singleReplyText.lastIndexOf('@');
    let next = '';
    if (atIndex !== -1) {
      next = `${singleReplyText.slice(0, atIndex)}@${team.name} `;
    } else {
      next = `${singleReplyText} @${team.name} `;
    }
    setSingleReplyText(next.slice(0, 280));
  };

  const threadFilteredTeams = availableTeams.filter(team => {
    if (!threadTeamFilterQuery) return true;
    return (
      team.name.toLowerCase().includes(threadTeamFilterQuery) ||
      (team.shortName && team.shortName.toLowerCase().includes(threadTeamFilterQuery))
    );
  });

  // Level 1 Reply Submission (Instant Optimistic Paint <16ms)
  const handleCreateReply = async (
    content: string,
    mediaUrls?: string[],
    mediaType?: BanterMediaType,
    poll?: { question: string; options: string[] },
    taggedTeam?: { id: string; name: string } | null
  ) => {
    if (!post) return;

    const effectiveDeviceId = profile?.deviceId || currentDeviceId;
    const effectiveUid = profile?.uid || `usr_${effectiveDeviceId.slice(0, 8)}_${Date.now().toString(36)}`;
    const effectiveName = profile?.authorName || 'Guest Pundit';
    const effectiveHandle = profile?.authorHandle || 'guest';
    const effectiveAvatar = profile?.avatarColor || '#9333ea';

    let finalTeam = taggedTeam;
    if (!finalTeam && content.includes('@')) {
      const lower = content.toLowerCase();
      for (const t of availableTeams) {
        if (lower.includes(`@${t.name.toLowerCase()}`) || (t.shortName && lower.includes(`@${t.shortName.toLowerCase()}`))) {
          finalTeam = { id: t.id, name: t.name };
          break;
        }
      }
    }

    // Instant Optimistic Update (<16ms)
    const optimisticId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `temp-${Date.now()}`;
    const optimisticItem: BanterPost = {
      id: optimisticId,
      parentId: post.id,
      rootId: post.rootId || post.id,
      depth: (post.depth || 0) + 1,
      content,
      mediaUrls,
      mediaType: mediaType || 'NONE',
      taggedTeamId: finalTeam?.id || null,
      taggedTeamName: finalTeam?.name || null,
      authorDeviceId: effectiveDeviceId,
      author_device_id: effectiveDeviceId,
      uid: effectiveUid,
      authorHandle: effectiveHandle,
      authorName: effectiveName,
      authorAvatar: effectiveAvatar,
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
    setPost((current: BanterPost | null) => current ? { ...current, commentCount: (current.commentCount || 0) + 1, repliesCount: (current.repliesCount || 0) + 1 } : null);

    // Broadcast across realtime channels & BroadcastChannel
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_reply',
        payload: { reply: optimisticItem },
      });
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(`scoped_thread_${postId}`);
        bc.postMessage({ type: 'new_reply', reply: optimisticItem });
        bc.close();
      }
    } catch {}

    try {
      const payload: Record<string, any> = {
        root_id: post.rootId || post.id,
        parent_id: post.id,
        uid: effectiveUid,
        author_device_id: effectiveDeviceId,
        author_name: effectiveName,
        author_handle: effectiveHandle,
        author_avatar: effectiveAvatar,
        content: content.trim(),
        media_type: mediaType || 'NONE',
      };
      if (finalTeam?.id) {
        payload.tagged_team_id = finalTeam.id;
        payload.tagged_team_name = finalTeam.name;
      }

      const { data, error } = await supabase
        .from('banter_posts')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        setReplies(prev => prev.map(r => r.id === optimisticId ? { ...optimisticItem, id: data.id } : r));
      } else {
        await banterService.createPost({
          content,
          parentId: post.id,
          rootId: post.rootId || post.id,
          mediaUrls,
          mediaType,
          poll,
          taggedTeamId: finalTeam?.id || null,
          taggedTeamName: finalTeam?.name || null,
          authorDeviceId: effectiveDeviceId,
          uid: effectiveUid,
          authorName: effectiveName,
          authorHandle: effectiveHandle,
          authorAvatar: effectiveAvatar,
        });
      }
    } catch (err) {
      console.warn('Backend reply persist deferred:', err);
    }
  };

  // Level 2 Sub-Reply Creation (Deep Reply to Reply)
  const handleCreateDeepReply = async (parentReply: BanterPost) => {
    if (!deepReplyText.trim() || !post) return;
    const content = deepReplyText.trim();
    setDeepReplyText('');
    setActiveDeepReplyTargetId(null);

    const effectiveDeviceId = profile?.deviceId || currentDeviceId;
    const effectiveUid = profile?.uid || `usr_${effectiveDeviceId.slice(0, 8)}_${Date.now().toString(36)}`;
    const effectiveName = profile?.authorName || 'Guest Pundit';
    const effectiveHandle = profile?.authorHandle || 'guest';
    const effectiveAvatar = profile?.avatarColor || '#9333ea';

    const optimisticId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `temp-${Date.now()}`;
    const optimisticDeepReply: BanterPost = {
      id: optimisticId,
      parentId: parentReply.id,
      rootId: post.id,
      depth: (parentReply.depth || 1) + 1,
      content,
      mediaType: 'NONE',
      authorDeviceId: effectiveDeviceId,
      author_device_id: effectiveDeviceId,
      uid: effectiveUid,
      authorHandle: effectiveHandle,
      authorName: effectiveName,
      authorAvatar: effectiveAvatar,
      authorType: 'user',
      sourceType: 'user',
      reactionFireCount: 0,
      reactionClownCount: 0,
      reactionSkullCount: 0,
      commentCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Reconcile multi-level counters: direct parent reply count + root post comment count
    setReplies(prev => [
      ...prev.map(r => r.id === parentReply.id ? { ...r, commentCount: (r.commentCount || 0) + 1, repliesCount: (r.repliesCount || 0) + 1 } : r),
      optimisticDeepReply
    ]);

    setPost(curr => curr ? { ...curr, commentCount: (curr.commentCount || 0) + 1, repliesCount: (curr.repliesCount || 0) + 1 } : null);

    // Broadcast
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_reply',
        payload: { reply: optimisticDeepReply },
      });
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(`scoped_thread_${postId}`);
        bc.postMessage({ type: 'new_reply', reply: optimisticDeepReply });
        bc.close();
      }
    } catch {}

    try {
      const payload: Record<string, any> = {
        root_id: post.id,
        parent_id: parentReply.id,
        uid: effectiveUid,
        author_device_id: effectiveDeviceId,
        author_name: effectiveName,
        author_handle: effectiveHandle,
        author_avatar: effectiveAvatar,
        content: content.trim(),
        media_type: 'NONE',
      };
      const { data } = await supabase.from('banter_posts').insert([payload]).select().single();
      if (data) {
        setReplies(prev => prev.map(r => r.id === optimisticId ? { ...optimisticDeepReply, id: data.id } : r));
      }
    } catch {
      void banterService.createPost({
        content,
        parentId: parentReply.id,
        rootId: post.id,
        authorDeviceId: effectiveDeviceId,
        uid: effectiveUid,
      });
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
          onClick={() => onBack()}
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
          onClick={() => onBack(post ? Math.max(post.commentCount || 0, post.repliesCount || 0, replies.length) : replies.length, post?.id, post?.content)}
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
        {/* Ancestry Chain */}
        {ancestry.length > 0 && (
          <div className="px-3 pt-3">
            {ancestry.map((ancestor) => (
              <div
                key={ancestor.id}
                onClick={() => {
                  if (onNavigatePost) {
                    onNavigatePost(ancestor.id);
                  } else {
                    sessionStorage.setItem('active_banter_thread_id', ancestor.id);
                    window.location.hash = `#/banter/${ancestor.id}`;
                  }
                }}
                className="group relative flex gap-3 cursor-pointer pb-4"
              >
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
              {authorMeta && (
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm border border-white/10 hover:border-sky-400 transition cursor-pointer"
                  title="View image and session details"
                >
                  <img
                    src={authorMeta.avatarUrl}
                    alt={authorMeta.displayName}
                    className="w-full h-full object-cover"
                  />
                </button>
              )}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="font-bold text-base text-white tracking-tight hover:underline hover:text-sky-300 cursor-pointer text-left"
                  >
                    {authorMeta?.displayName || post.authorName || post.authorHandle}
                  </button>

                  {authorMeta?.isJournalist ? (
                    <div className="inline-flex items-center gap-1">
                      <InstagramBlueTick className="h-4 w-4" />
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#0095f6]/15 px-1.5 py-0.2 text-[9px] font-black uppercase text-[#0095f6] border border-[#0095f6]/30">
                        Official Journalist
                      </span>
                    </div>
                  ) : authorMeta?.isCoach ? (
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

                  <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-sky-400 border border-sky-500/30">
                    OP
                  </span>
                  {isRootYou && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-purple-300 border border-purple-500/30">
                      You
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

          {/* Media Presentation */}
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
              {formatTwitterMetric(
                post.isTrending
                  ? Math.min(1940, Math.max(1501, (post.impressionsCount || post.impressions || 0) > 1500 ? (post.impressionsCount || post.impressions || 1780) : 1780))
                  : Math.min(1500, Math.max(500, (post.impressionsCount || post.impressions || 0) <= 1500 && (post.impressionsCount || post.impressions || 0) >= 500 ? (post.impressionsCount || post.impressions || 1120) : 1120))
              )} Views
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

          {/* Action Icons Bar */}
          <div className="flex items-center justify-around py-1 text-zinc-500">
            <button
              type="button"
              aria-label="Reply"
              className="flex items-center gap-1.5 p-2 rounded-full hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
            >
              <MessageCircle className="h-5 w-5" />
            </button>

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

            {/* Consolidated Reaction Picker */}
            {(() => {
              const activeReaction: ReactionType | null =
                threadUserReactions.fire ? 'fire' : threadUserReactions.clown ? 'clown' : threadUserReactions.skull ? 'skull' : null;
              return (
                <div ref={reactionPickerRef} className="relative">
                  <button
                    type="button"
                    aria-label="React with emoji"
                    data-testid="thread-emoji-reaction-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsReactionMenuOpen(prev => !prev);
                    }}
                    className={`flex items-center gap-1.5 p-2 rounded-full transition-colors cursor-pointer ${
                      activeReaction === 'fire'
                        ? 'text-amber-400 bg-amber-500/15'
                        : activeReaction === 'clown'
                        ? 'text-yellow-400 bg-yellow-500/15'
                        : activeReaction === 'skull'
                        ? 'text-purple-400 bg-purple-500/15'
                        : 'hover:text-amber-400 hover:bg-amber-500/10'
                    }`}
                    title="React"
                  >
                    {activeReaction === 'fire' ? (
                      <span className="text-base leading-none">🔥</span>
                    ) : activeReaction === 'clown' ? (
                      <span className="text-base leading-none">🤡</span>
                    ) : activeReaction === 'skull' ? (
                      <span className="text-base leading-none">💀</span>
                    ) : (
                      <Smile className="h-5 w-5" />
                    )}
                  </button>

                  {isReactionMenuOpen && (
                    <div
                      role="toolbar"
                      aria-label="Reaction options"
                      data-testid="thread-reaction-emoji-array"
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-full shadow-2xl animate-in fade-in zoom-in-95"
                    >
                      <button
                        type="button"
                        data-testid="thread-react-fire-btn"
                        title="Fire 🔥"
                        onClick={() => {
                          handleThreadReaction('fire');
                          setIsReactionMenuOpen(false);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          threadUserReactions.fire
                            ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400 scale-105'
                            : 'hover:bg-amber-500/15 text-zinc-300 hover:text-amber-300 hover:scale-110'
                        }`}
                      >
                        <span className="text-base">🔥</span>
                        <span className="text-[10px] font-mono">{threadReactions.fire}</span>
                      </button>

                      <button
                        type="button"
                        data-testid="thread-react-clown-btn"
                        title="Clown 🤡"
                        onClick={() => {
                          handleThreadReaction('clown');
                          setIsReactionMenuOpen(false);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          threadUserReactions.clown
                            ? 'bg-yellow-500/30 text-yellow-300 ring-1 ring-yellow-400 scale-105'
                            : 'hover:bg-yellow-500/15 text-zinc-300 hover:text-yellow-300 hover:scale-110'
                        }`}
                      >
                        <span className="text-base">🤡</span>
                        <span className="text-[10px] font-mono">{threadReactions.clown}</span>
                      </button>

                      <button
                        type="button"
                        data-testid="thread-react-skull-btn"
                        title="Savage 💀"
                        onClick={() => {
                          handleThreadReaction('skull');
                          setIsReactionMenuOpen(false);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          threadUserReactions.skull
                            ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-400 scale-105'
                            : 'hover:bg-purple-500/15 text-zinc-300 hover:text-purple-300 hover:scale-110'
                        }`}
                      >
                        <span className="text-base">💀</span>
                        <span className="text-[10px] font-mono">{threadReactions.skull}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

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

        {/* Chronological Reply Feed with Articles */}
        <div className="px-3 sm:px-4 py-3 space-y-3 pb-32">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Replies ({replies.length})
            </h3>
          </div>

          {replies.length === 0 ? (
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
                    onToggleReaction={async (pId, type) => {
                      await banterService.toggleReaction(pId, type);
                    }}
                    onOpenComments={(p) => {
                      if (onNavigatePost) {
                        onNavigatePost(p.id);
                      } else {
                        sessionStorage.setItem('active_banter_thread_id', p.id);
                        window.location.hash = `#/banter/${p.id}`;
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {replies.slice(0, visibleRepliesCount).map((reply, idx) => {
                const replyAuthorDeviceId = reply.authorDeviceId || (reply as any).author_device_id || reply.userId;
                const isOP = Boolean(rootAuthorDeviceId && replyAuthorDeviceId === rootAuthorDeviceId);
                const isYou = Boolean(currentDeviceId && replyAuthorDeviceId === currentDeviceId);
                const voteMatch = reply.content.match(/^\[Voted:\s*([^\]]+)\]\s*(.*)$/);

                return (
                  <article
                    key={reply.id}
                    className="group relative flex flex-col gap-2 p-3 rounded-2xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950 transition-all cursor-pointer"
                  >
                    <div className="flex gap-3">
                      {/* Avatar & Number badge */}
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white font-bold text-xs border border-white/10"
                          style={{ backgroundColor: reply.authorAvatar || (isYou ? profile?.avatarColor : undefined) || '#2563eb' }}
                        >
                          {reply.authorName ? reply.authorName[0] : <User className="h-4 w-4" />}
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
                            {isOP && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-sky-400 border border-sky-500/30">
                                OP
                              </span>
                            )}
                            {isYou && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-purple-300 border border-purple-500/30">
                                You
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-500 font-mono">
                              @{reply.authorHandle.replace(/\s+/g, '_').toLowerCase()}
                            </span>
                            <span className="text-[11px] text-zinc-600">·</span>
                            <span className="text-[11px] text-zinc-500">
                              {formatFullTimestamp(reply.createdAt).split(' · ')[0]}
                            </span>
                          </div>
                        </div>

                        {voteMatch ? (
                          <div className="space-y-1 my-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold">
                              <BarChart2 className="w-3.5 h-3.5" />
                              <span>Voted: {voteMatch[1]}</span>
                            </div>
                            <ExpandableReplyText text={voteMatch[2]} />
                          </div>
                        ) : (
                          <ExpandableReplyText text={reply.content} />
                        )}

                        {reply.poll && (
                          <XPollWidget
                            poll={reply.poll}
                            onPollUpdated={(updated) => setReplies(prev => prev.map(r => r.id === reply.id ? { ...r, poll: updated } : r))}
                          />
                        )}

                        {/* Reply mini action toolbar */}
                        <div className="flex items-center gap-5 mt-2.5 text-zinc-500 text-xs">
                          <button
                            type="button"
                            aria-label="Reply"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDeepReplyTargetId(prev => prev === reply.id ? null : reply.id);
                            }}
                            className="flex items-center gap-1 hover:text-sky-400 cursor-pointer p-1"
                            title="Reply"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>💬 {reply.commentCount || reply.repliesCount || 0}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplies(prev => prev.map(r => r.id === reply.id ? { ...r, repostCount: (r.repostCount || 0) + 1 } : r));
                            }}
                            className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer p-1"
                            title="Repost"
                          >
                            <Repeat2 className="h-3.5 w-3.5" />
                            <span>{reply.repostCount || 0}</span>
                          </button>
                          {/* Consolidated Reaction Picker for Reply */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReplyReactionPickerId((prev) => (prev === reply.id ? null : reply.id));
                              }}
                              className={`flex items-center gap-1 cursor-pointer p-1 rounded-full transition-colors ${
                                reply.userReactions?.fire || reply.userReactions?.clown || reply.userReactions?.skull
                                  ? 'text-amber-400 bg-amber-500/10'
                                  : 'hover:text-amber-400'
                              }`}
                              title="React"
                              aria-label="React"
                            >
                              {reply.userReactions?.fire ? (
                                <span className="text-xs">🔥</span>
                              ) : reply.userReactions?.clown ? (
                                <span className="text-xs">🤡</span>
                              ) : reply.userReactions?.skull ? (
                                <span className="text-xs">💀</span>
                              ) : (
                                <Smile className="h-3.5 w-3.5" />
                              )}
                              <span>
                                {((reply.reactionFireCount || 0) + (reply.reactionClownCount || 0) + (reply.reactionSkullCount || 0)) || ''}
                              </span>
                            </button>

                            {activeReplyReactionPickerId === reply.id && (
                              <div
                                role="toolbar"
                                aria-label="Reaction options"
                                className="absolute bottom-full mb-1 left-0 z-40 flex items-center gap-1.5 p-1 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-full shadow-2xl animate-in fade-in zoom-in-95"
                              >
                                <button
                                  type="button"
                                  title="Fire 🔥"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplies((prev) =>
                                      prev.map((r) =>
                                        r.id === reply.id ? { ...r, reactionFireCount: (r.reactionFireCount || 0) + 1 } : r
                                      )
                                    );
                                    setActiveReplyReactionPickerId(null);
                                    Promise.resolve().then(() => banterService.toggleReaction(reply.id, 'fire')).catch(console.warn);
                                  }}
                                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full hover:bg-amber-500/20 text-xs text-zinc-300 hover:text-amber-300 cursor-pointer"
                                >
                                  <span>🔥</span>
                                  <span className="text-[10px] font-mono">{reply.reactionFireCount || 0}</span>
                                </button>
                                <button
                                  type="button"
                                  title="Clown 🤡"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplies((prev) =>
                                      prev.map((r) =>
                                        r.id === reply.id ? { ...r, reactionClownCount: (r.reactionClownCount || 0) + 1 } : r
                                      )
                                    );
                                    setActiveReplyReactionPickerId(null);
                                    Promise.resolve().then(() => banterService.toggleReaction(reply.id, 'clown')).catch(console.warn);
                                  }}
                                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full hover:bg-yellow-500/20 text-xs text-zinc-300 hover:text-yellow-300 cursor-pointer"
                                >
                                  <span>🤡</span>
                                  <span className="text-[10px] font-mono">{reply.reactionClownCount || 0}</span>
                                </button>
                                <button
                                  type="button"
                                  title="Savage 💀"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplies((prev) =>
                                      prev.map((r) =>
                                        r.id === reply.id ? { ...r, reactionSkullCount: (r.reactionSkullCount || 0) + 1 } : r
                                      )
                                    );
                                    setActiveReplyReactionPickerId(null);
                                    Promise.resolve().then(() => banterService.toggleReaction(reply.id, 'skull')).catch(console.warn);
                                  }}
                                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full hover:bg-purple-500/20 text-xs text-zinc-300 hover:text-purple-300 cursor-pointer"
                                >
                                  <span>💀</span>
                                  <span className="text-[10px] font-mono">{reply.reactionSkullCount || 0}</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-zinc-500 text-[11px] font-mono p-1 select-none" title="Views">
                            <BarChart2 className="h-3.5 w-3.5" />
                            <span>
                              {formatTwitterMetric(
                                reply.impressionsCount && reply.impressionsCount >= 500 && reply.impressionsCount <= 1500
                                  ? reply.impressionsCount
                                  : Math.min(1500, Math.max(500, 500 + ((reply.reactionFireCount || 0) * 12) + ((reply.commentCount || 0) * 18)))
                              )}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (post) shareBanterSnapshot(reply, post);
                            }}
                            className="flex items-center gap-1 hover:text-sky-400 cursor-pointer p-1 ml-auto"
                            title="Share"
                          >
                            <Share className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline Deep Reply Box (Level 2 Sub-Reply) */}
                    {activeDeepReplyTargetId === reply.id && (
                      <div className="mt-2 pt-2 border-t border-zinc-800 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          placeholder="Post your reply"
                          value={deepReplyText}
                          onChange={(e) => setDeepReplyText(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-xs text-white resize-none focus:outline-none focus:border-sky-500 font-sans"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveDeepReplyTargetId(null)}
                            className="px-3 py-1 rounded-full text-zinc-400 hover:text-white text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCreateDeepReply(reply)}
                            className="px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
              {visibleRepliesCount < replies.length && (
                <div className="text-center py-3 text-xs text-zinc-500 font-mono">
                  Showing {visibleRepliesCount} of {replies.length} replies · Scroll for more
                </div>
              )}
            </div>
          )}
        </div>

        {replyTargetPost && (
          <BanterReplyModal
            post={replyTargetPost}
            isOpen={Boolean(replyTargetPost)}
            onClose={() => setReplyTargetPost(null)}
            onSuccess={() => {
              setReplies(prev => prev.map(r => r.id === replyTargetPost.id ? { ...r, commentCount: (r.commentCount || 0) + 1 } : r));
            }}
          />
        )}

        {/* Single input bar fixed at the bottom with @team autocomplete */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-zinc-800 p-2.5 sm:p-3 shadow-2xl">
          {showThreadTeamDropdown && (
            <div className="max-w-2xl mx-auto mb-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-50 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-zinc-400 border-b border-zinc-800/80 mb-1">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <AtSign className="h-3.5 w-3.5" /> Select Team to Tag
                </span>
                <button
                  type="button"
                  onClick={() => setShowThreadTeamDropdown(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-0.5"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1">
                {threadFilteredTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleSelectThreadTeam(team)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{team.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">@{team.shortName || team.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!singleReplyText.trim() || !post || isSubmittingReply) return;
              const textToSubmit = singleReplyText.trim();
              const teamToSubmit = selectedThreadTeam;
              setSingleReplyText('');
              setSelectedThreadTeam(null);
              setShowThreadTeamDropdown(false);
              setIsSubmittingReply(true);
              handleCreateReply(textToSubmit, undefined, 'NONE', undefined, teamToSubmit)
                .catch((err) => {
                  console.warn('Failed to submit reply:', err);
                })
                .finally(() => {
                  setIsSubmittingReply(false);
                });
            }}
            className="max-w-2xl mx-auto flex items-end gap-2"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-sm border border-white/10 mb-1">
              <img
                src={getAuthorIdentityMeta(profile || {}).avatarUrl}
                alt="My Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <textarea
              placeholder="Post your reply"
              value={singleReplyText}
              onChange={handleSingleReplyChange}
              rows={1}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 resize-none font-sans"
            />
            <button
              type="submit"
              disabled={!singleReplyText.trim() || isSubmittingReply}
              className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm mb-1 ${
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

      {authorMeta && (
        <AvatarViewModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          imageUrl={authorMeta.avatarUrl}
          sessionName={authorMeta.displayName}
          handle={post.authorHandle.replace(/\s+/g, '_').toLowerCase()}
          isCoach={authorMeta.isCoach}
          isJournalist={authorMeta.isJournalist}
          coachLeague={authorMeta.coachLeague}
        />
      )}
    </div>
  );
};
