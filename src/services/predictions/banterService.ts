import { fictionalBanterPosts, fictionalComments, usesLocalFictionalSlate } from '../../lib/predictions/fictionalSlate';
import { supabase } from '../../lib/predictions/banterSupabase';
import { BANTER_CONFIG, STORAGE_KEYS } from '../../lib/predictions/constants';
import { getStoredItem, setStoredItem } from '../../lib/predictions/utils';
import { anonymousIdentityService } from './anonymousIdentityService';
import { getOrCreateDeviceIdentity } from '../../utils/deviceIdentity';
import { getDeviceCredentials } from '../../lib/deviceCopies';
import { getActiveSessionProfile, getOrCreatePermanentDeviceId } from '../../utils/sessionIdentity';
import type {
  BanterPost,
  BanterComment,
  ReactionType,
  AuthorType,
  BanterFilterType,
  BanterPoll,
  BanterPollOption,
  BanterMediaType,
  JournalistAnalytics
} from '../../types/predictions';

export interface CreatePostOptions {
  content: string;
  parentId?: string | null;
  rootId?: string | null;
  matchId?: string | null;
  matchContext?: BanterPost['matchContext'];
  imageUrl?: string | null;
  mediaUrls?: string[];
  mediaType?: BanterMediaType;
  poll?: {
    question: string;
    options: string[];
  };
  taggedTeamId?: string | null;
  taggedTeamName?: string | null;
  authorDeviceId?: string;
  uid?: string;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  authorType?: AuthorType;
  authorBadge?: string;
}

// -------------------------------------------------------------
// Pure Helpers for Video Validation & Thread Calculation (Exported for Unit Tests)
// -------------------------------------------------------------

export function checkVideoDurationLimit(duration: number, maxLimit = 15.0): boolean {
  return typeof duration === 'number' && duration > 0 && duration <= maxLimit;
}

export function validateVideoDuration(duration: number, maxLimit = 15.0): { valid: boolean; error?: string } {
  if (duration > maxLimit) {
    return { valid: false, error: 'Video exceeds 15-second limit.' };
  }
  return { valid: true };
}

export function validateVideoFile(file: File): Promise<{ valid: boolean; duration: number; error?: string }> {
  return new Promise((resolve) => {
    if (!file.type || !file.type.startsWith('video/')) {
      resolve({ valid: true, duration: 0 });
      return;
    }

    if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      // In non-browser environments, default to passing
      resolve({ valid: true, duration: 0 });
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = video.duration;
      if (duration > 15.0) {
        resolve({ valid: false, duration, error: 'Video exceeds 15-second limit.' });
      } else {
        resolve({ valid: true, duration });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, duration: 0, error: 'Unable to process video file.' });
    };

    video.src = objectUrl;
  });
}

export function calculateReplyMetadata(parent: {
  id: string;
  depth?: number;
  rootId?: string | null;
  root_id?: string | null;
}): { parentId: string; rootId: string; depth: number } {
  // Correct root_id inheritance: inherit true root_id from parent if present; otherwise parent is root
  const trueRootId = parent.rootId || parent.root_id ? (parent.rootId || parent.root_id)! : parent.id;
  return {
    parentId: parent.id,
    rootId: trueRootId,
    depth: (parent.depth ?? 0) + 1
  };
}

// -------------------------------------------------------------
// Pre-seeded high quality football community conversations with Threads & Polls
// -------------------------------------------------------------
const SEEDED_POLL_1: BanterPoll = {
  id: 'poll-seed-01',
  postId: 'post-seed-01',
  question: 'Will Santos keep their unbeaten streak against BCOM?',
  options: [
    { id: 1, text: 'Santos win comfortably', votes: 48 },
    { id: 2, text: 'BCOM counter shock', votes: 31 },
    { id: 3, text: 'Gritty 1-1 Draw', votes: 14 }
  ],
  totalVotes: 93,
  voters: {},
  expiresAt: new Date(Date.now() + 86400000).toISOString()
};

const SEEDED_BANTER_POSTS: BanterPost[] = [
  {
    id: 'post-seed-01',
    parentId: null,
    rootId: 'post-seed-01',
    depth: 0,
    matchId: 'f0000000-0000-4000-8000-000000000002',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Santos FC',
      awayTeamName: 'BCOM FC',
      matchday: 7
    },
    authorHandle: 'Tatton Ultras #42',
    authorName: 'Tatton Ultras',
    authorType: 'user',
    content: 'Santos are celebrating already. BCOM scored 3 in transition last week. #Matchday #Derby',
    sourceType: 'seed',
    mediaType: 'NONE',
    pollId: 'poll-seed-01',
    poll: SEEDED_POLL_1,
    reactionFireCount: 38,
    reactionClownCount: 14,
    reactionSkullCount: 22,
    commentCount: 9,
    repliesCount: 2,
    repostCount: 14,
    impressionsCount: 2450,
    createdAt: new Date(Date.now() - 360000).toISOString()
  },
  {
    id: 'post-seed-01-reply-01',
    parentId: 'post-seed-01',
    rootId: 'post-seed-01',
    depth: 1,
    authorHandle: 'East Stand #09',
    authorName: 'East Stand',
    authorType: 'user',
    content: 'Their transition won’t bypass Santos midfield pivot today. Watch the 6 position.',
    sourceType: 'user',
    reactionFireCount: 12,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 1,
    repliesCount: 1,
    createdAt: new Date(Date.now() - 240000).toISOString()
  },
  {
    id: 'post-seed-01-reply-02',
    parentId: 'post-seed-01-reply-01',
    rootId: 'post-seed-01',
    depth: 2,
    authorHandle: 'Tatton Ultras #42',
    authorName: 'Tatton Ultras',
    authorType: 'user',
    content: 'Which pivot? The starter is out with an ankle sprain! Check the squad list.',
    sourceType: 'user',
    reactionFireCount: 8,
    reactionClownCount: 0,
    reactionSkullCount: 3,
    commentCount: 0,
    repliesCount: 0,
    createdAt: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: 'post-seed-02',
    parentId: null,
    rootId: 'post-seed-02',
    depth: 0,
    matchId: 'f0000000-0000-4000-8000-000000000005',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Legends FC',
      awayTeamName: 'Spartans United',
      matchday: 7
    },
    authorHandle: 'EgerSports Desk',
    authorName: 'Egerton Sports Desk',
    authorType: 'journalist',
    authorBadge: 'JOURNALIST',
    content: 'Legends fans think this is already won. Spartans have not conceded from a set piece all month. #Derby #POTW',
    sourceType: 'journalist',
    mediaType: 'NONE',
    reactionFireCount: 64,
    reactionClownCount: 5,
    reactionSkullCount: 9,
    commentCount: 18,
    repliesCount: 3,
    repostCount: 26,
    impressionsCount: 4200,
    createdAt: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'post-seed-03',
    parentId: null,
    rootId: 'post-seed-03',
    depth: 0,
    matchId: 'f0000000-0000-4000-8000-000000000003',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Blue Blazers',
      awayTeamName: 'Mighty Blacks',
      matchday: 7
    },
    authorHandle: 'Campus Oracle #19',
    authorName: 'Campus Oracle',
    authorType: 'user',
    content: "Blue Blazers midfield is walking. Mighty Blacks keep a clean sheet. That's the take. #EPL",
    sourceType: 'seed',
    mediaType: 'NONE',
    reactionFireCount: 21,
    reactionClownCount: 3,
    reactionSkullCount: 16,
    commentCount: 4,
    repliesCount: 0,
    repostCount: 7,
    impressionsCount: 1350,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'post-seed-04',
    parentId: null,
    rootId: 'post-seed-04',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Ruiru Pundit #88',
    authorName: 'Ruiru Pundit',
    authorType: 'user',
    content: 'Who picked the draw and went quiet? Say it. #Matchday #EPL',
    sourceType: 'user',
    mediaType: 'NONE',
    reactionFireCount: 45,
    reactionClownCount: 9,
    reactionSkullCount: 2,
    commentCount: 7,
    repliesCount: 0,
    repostCount: 11,
    impressionsCount: 2100,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'post-seed-coach-01',
    parentId: null,
    rootId: 'post-seed-coach-01',
    depth: 0,
    matchId: 'f0000000-0000-4000-8000-000000000005',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Legends FC',
      awayTeamName: 'Spartans United',
      matchday: 7
    },
    authorHandle: 'Legends FC Coach',
    authorName: 'Coach Eric (Legends)',
    authorType: 'journalist',
    authorBadge: 'COACH',
    content: 'Press the first pass. Spartans will sit in and wait. Stay patient and keep the full-backs high. #Derby',
    sourceType: 'journalist',
    mediaType: 'NONE',
    reactionFireCount: 12,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 3,
    repliesCount: 0,
    repostCount: 5,
    impressionsCount: 980,
    createdAt: new Date(Date.now() - 5400000).toISOString()
  }
];

export function isCoachPost(post: BanterPost): boolean {
  if (post.authorType === 'coach') return true;
  const badge = (post.authorBadge || '').toLowerCase();
  const handle = post.authorHandle.toLowerCase();
  return badge.includes('coach') || handle.includes('coach');
}

export function formatCoachTag(teamName?: string | null, badge?: string | null): string {
  const team = teamName || (badge && !badge.toLowerCase().includes('coach') ? badge : '') || 'Team';
  return `${team} Coach`;
}

export function compareTrending(a: BanterPost, b: BanterPost): number {
  const oneHourAgo = Date.now() - 3600000;
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  const aInHour = aTime >= oneHourAgo;
  const bInHour = bTime >= oneHourAgo;

  if (aInHour && !bInHour) return -1;
  if (!aInHour && bInHour) return 1;

  // 1. Most replies (commentCount / repliesCount)
  const aReplies = a.commentCount ?? a.repliesCount ?? 0;
  const bReplies = b.commentCount ?? b.repliesCount ?? 0;
  if (bReplies !== aReplies) return bReplies - aReplies;

  // 2. Favourites / reposts
  const aFav = a.repostCount ?? a.repostsCount ?? 0;
  const bFav = b.repostCount ?? b.repostsCount ?? 0;
  if (bFav !== aFav) return bFav - aFav;

  // 3. Likes
  const aLikes = a.reactionFireCount ?? a.likesCount ?? 0;
  const bLikes = b.reactionFireCount ?? b.likesCount ?? 0;
  if (bLikes !== aLikes) return bLikes - aLikes;

  return bTime - aTime;
}

function applyBanterFilter(posts: BanterPost[], filter: BanterFilterType | 'hot' | 'latest' | 'matchday'): BanterPost[] {
  let all = [...posts];
  if (filter === 'trending' || filter === 'hot') {
    all.sort(compareTrending);
  } else if (filter === 'top') {
    all.sort((a, b) => (b.reactionFireCount + b.commentCount + (b.repostCount || 0)) - (a.reactionFireCount + a.commentCount + (a.repostCount || 0)));
  } else if (filter === 'coach') {
    all = all.filter(isCoachPost);
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filter === 'banter') {
    all = all.filter(p => !isCoachPost(p) && p.authorType !== 'journalist' && !(p.authorBadge || '').toLowerCase().includes('journalist'));
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filter === 'latest' || filter === 'today') {
    const oneDayAgo = Date.now() - 86400000;
    all = all.filter((post) => new Date(post.createdAt).getTime() >= oneDayAgo);
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // Default 'all'
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Identify top trending post and tag with isTrending = true
  if (all.length > 0) {
    const trendingLeader = [...all].sort(compareTrending)[0];
    if (trendingLeader) {
      all.forEach((p) => {
        p.isTrending = p.id === trendingLeader.id;
      });
    }
  }

  return all;
}

export class BanterService {
  private localPosts: BanterPost[] = [];
  private localPolls: Record<string, BanterPoll> = {};
  private lastPostTimestamp = 0;

  constructor() {
    this.localPosts = getStoredItem<BanterPost[]>('egerscore_local_banter_posts', []);
    this.localPolls = getStoredItem<Record<string, BanterPoll>>('egerscore_local_polls', {
      [SEEDED_POLL_1.id]: SEEDED_POLL_1
    });
  }

  public getPollById(pollId: string): BanterPoll | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`egerscore_banter_poll_${pollId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.localPolls[pollId] = parsed;
          return parsed;
        }
      }
    } catch {}
    if (this.localPolls[pollId]) return this.localPolls[pollId];
    if (SEEDED_POLL_1.id === pollId) return SEEDED_POLL_1;
    return null;
  }

  public savePoll(poll: BanterPoll): void {
    this.localPolls[poll.id] = poll;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`egerscore_banter_poll_${poll.id}`, JSON.stringify(poll));
      }
    } catch {}
    setStoredItem('egerscore_local_polls', this.localPolls);
  }

  public async getPostById(postId: string): Promise<BanterPost | null> {
    const post = this.localPosts.find((p: BanterPost) => p.id === postId)
      || SEEDED_BANTER_POSTS.find((p: BanterPost) => p.id === postId)
      || (fictionalBanterPosts() as BanterPost[]).find((p: BanterPost) => p.id === postId);

    if (post) {
      if (post.pollId) {
        post.poll = this.getPollById(post.pollId) || post.poll;
      }
      return post;
    }

    try {
      const { data, error } = await supabase
        .from('banter_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (!error && data) {
        const mapped = this.mapDatabaseRowToPost(data);
        if (mapped.pollId) {
          const { data: pData } = await supabase.from('banter_polls').select('*').eq('id', mapped.pollId).maybeSingle();
          if (pData) mapped.poll = this.mapDatabaseRowToPoll(pData);
        }
        return mapped;
      }

      // If not in banter_posts, look up in banter_comments
      const { data: cData, error: cErr } = await supabase
        .from('banter_comments')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (!cErr && cData) {
        return {
          id: cData.id,
          parentId: cData.post_id,
          rootId: cData.post_id,
          depth: 1,
          userId: cData.device_id,
          authorDeviceId: cData.device_id,
          authorHandle: cData.author_handle || 'guest',
          authorName: (cData.author_handle || 'Guest').split(' #')[0],
          authorType: cData.author_type || 'user',
          sourceType: 'user' as const,
          content: cData.content,
          reactionFireCount: 0,
          reactionClownCount: 0,
          reactionSkullCount: 0,
          commentCount: 0,
          repliesCount: 0,
          repostCount: 0,
          impressionsCount: 1,
          createdAt: cData.created_at,
          userReactions: {}
        };
      }
    } catch {
      // offline safe
    }

    return null;
  }

  public async fetchPosts(
    filter: BanterFilterType | 'hot' | 'latest' | 'matchday',
    matchId?: string | null,
    limit = 20,
    offset = 0
  ): Promise<BanterPost[]> {
    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    const seededPosts = usesLocalFictionalSlate() ? fictionalBanterPosts() : SEEDED_BANTER_POSTS;

    try {
      let query = supabase
        .from('banter_posts')
        .select('*')
        .eq('status', 'active');

      if (matchId) {
        query = query.eq('match_id', matchId);
      }

      if (filter === 'trending' || filter === 'hot') {
        query = query
          .order('comment_count', { ascending: false })
          .order('repost_count', { ascending: false })
          .order('reaction_fire_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const posts: BanterPost[] = data.map((d: any) => this.mapDatabaseRowToPost(d, userReactions));

        // Merge local posts that are not in database yet (e.g. freshly posted)
        const unSyncedLocal = this.localPosts.filter(
          (lp) => !lp.parentId && !posts.some((p) => p.id === lp.id)
        );
        const combined = [...unSyncedLocal, ...posts];

        const filtered = applyBanterFilter(combined, filter);
        if (filtered.length > 0) {
          return filtered.slice(0, limit);
        }
      }
    } catch {
      // offline fallback
    }

    // Combine local user root posts + seeded root posts
    const allRoot = [...this.localPosts, ...seededPosts].filter(p => !p.parentId || p.depth === 0);
    let all = allRoot;
    if (matchId) {
      all = all.filter(p => p.matchId === matchId);
    }

    all = all.map(p => ({
      ...p,
      poll: p.pollId ? (p.poll || this.getPollById(p.pollId)) : undefined,
      repostCount: p.repostCount || Math.floor((p.reactionFireCount + 5) * 1.4),
      impressionsCount: p.impressionsCount || (p.reactionFireCount + p.reactionClownCount + p.commentCount + 10) * 72,
      userReactions: userReactions[p.id] || {}
    }));

    return applyBanterFilter(all, filter).slice(offset, offset + limit);
  }

  public async fetchThread(postId: string): Promise<{
    post: BanterPost | null;
    ancestry: BanterPost[];
    replies: BanterPost[];
  }> {
    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    // Section Load: Resolve the active post and its complete ancestry chain
    const activePost = await this.getPostById(postId);
    const ancestry: BanterPost[] = [];

    // Traverse upwards to assemble the complete ancestry chain with continuous vertical connectors
    let currentAncestorId = activePost?.parentId;
    while (currentAncestorId) {
      const ancestor = await this.getPostById(currentAncestorId);
      if (ancestor) {
        ancestry.unshift({
          ...ancestor,
          userReactions: userReactions[ancestor.id] || {}
        });
        currentAncestorId = ancestor.parentId;
      } else {
        break;
      }
    }

    // Section Load: Only load direct replies for this thread from banter_comments (avoids deep recursive overhead)
    let replies: BanterPost[] = [];

    try {
      const { data, error } = await supabase
        .from('banter_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data && data.length > 0) {
        replies = data.map((d: any) => ({
          id: d.id,
          parentId: postId,
          rootId: activePost?.rootId || postId,
          depth: (activePost?.depth || 0) + 1,
          userId: d.device_id,
          authorDeviceId: d.device_id,
          matchId: activePost?.matchId || null,
          leagueId: activePost?.leagueId || null,
          authorHandle: d.author_handle,
          authorName: d.author_handle.split(' #')[0],
          authorType: d.author_type || 'user',
          sourceType: 'user',
          content: d.content,
          reactionFireCount: 0,
          reactionClownCount: 0,
          reactionSkullCount: 0,
          commentCount: 0,
          repliesCount: 0,
          repostCount: 0,
          impressionsCount: 1,
          createdAt: d.created_at,
          userReactions: userReactions[d.id] || {}
        }));
      }
    } catch {
      // offline safe
    }

    // Include seeded and local replies directly attached to this post
    const seededReplies = SEEDED_BANTER_POSTS
      .filter((p) => p.parentId === postId && !replies.some((r) => r.id === p.id))
      .map((p) => ({
        ...p,
        userReactions: userReactions[p.id] || {}
      }));

    const localReplies = this.localPosts
      .filter((p) => p.parentId === postId && !replies.some((r) => r.id === p.id))
      .map((p) => ({
        ...p,
        userReactions: userReactions[p.id] || {}
      }));

    replies = [...replies, ...seededReplies, ...localReplies];

    return {
      post: activePost,
      ancestry,
      replies
    };
  }

  public async createPost(
    contentOrOptions: string | CreatePostOptions,
    matchId?: string | null,
    matchContext?: BanterPost['matchContext'],
    imageUrl?: string | null,
    extraOptions?: Partial<CreatePostOptions>
  ): Promise<BanterPost> {
    const opts: CreatePostOptions = typeof contentOrOptions === 'string'
      ? {
          content: contentOrOptions,
          matchId,
          matchContext,
          imageUrl,
          ...extraOptions
        }
      : contentOrOptions;

    const trimmed = (opts.content || '').trim();
    const hasMedia = Boolean((opts.mediaUrls && opts.mediaUrls.length > 0) || opts.imageUrl);
    const hasPoll = Boolean(opts.poll && opts.poll.options && opts.poll.options.length >= 2);

    if (!trimmed && !hasMedia && !hasPoll) {
      throw new Error('Post content cannot be empty.');
    }
    if (trimmed.length > BANTER_CONFIG.MAX_POST_CHARS) {
      throw new Error(`Post exceeds maximum length of ${BANTER_CONFIG.MAX_POST_CHARS} characters.`);
    }

    const now = Date.now();
    if (now - this.lastPostTimestamp < BANTER_CONFIG.RATE_LIMIT_COOLDOWN_MS) {
      throw new Error('Please wait a few seconds before posting another hot take.');
    }
    this.lastPostTimestamp = now;

    const sessionProfile = getActiveSessionProfile();
    const identity = anonymousIdentityService.getIdentity();
    const deviceIdentity = getOrCreateDeviceIdentity();
    const effectiveDeviceId = opts.authorDeviceId || sessionProfile?.deviceId || deviceIdentity.deviceId || identity.deviceId;
    const effectiveUid = opts.uid || sessionProfile?.uid || `usr_${effectiveDeviceId.slice(0, 8)}_${Date.now().toString(36)}`;
    const effectiveAuthorName = opts.authorName || sessionProfile?.authorName || identity.publicHandle.split(' #')[0] || 'Fanatic';
    const effectiveAuthorHandle = opts.authorHandle || sessionProfile?.authorHandle || identity.publicHandle;
    const effectiveAuthorAvatar = opts.authorAvatar || sessionProfile?.avatarColor;
    const postId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}`;

    // Calculate depth and rootId using Self-Referential Adjacency Tree
    let parentId: string | null = null;
    let rootId: string = postId;
    let depth = 0;

    if (opts.parentId) {
      const parent = await this.getPostById(opts.parentId);
      if (parent) {
        const meta = calculateReplyMetadata(parent);
        parentId = meta.parentId;
        rootId = meta.rootId;
        depth = meta.depth;
        parent.commentCount = (parent.commentCount || 0) + 1;
        parent.repliesCount = (parent.repliesCount || 0) + 1;

        // If deep reply (parentId != rootId), also increment root post counters
        if (rootId && rootId !== parent.id) {
          const rootPost = await this.getPostById(rootId);
          if (rootPost) {
            rootPost.commentCount = (rootPost.commentCount || 0) + 1;
            rootPost.repliesCount = (rootPost.repliesCount || 0) + 1;
          }
        }
      }
    }

    // Determine media type
    let finalMediaType: BanterMediaType = opts.mediaType || 'NONE';
    let mediaUrls: string[] = opts.mediaUrls || [];
    if (opts.imageUrl && mediaUrls.length === 0) {
      mediaUrls = [opts.imageUrl];
      finalMediaType = 'IMAGE';
    } else if (mediaUrls.length === 1 && finalMediaType === 'NONE') {
      finalMediaType = 'IMAGE';
    } else if (mediaUrls.length >= 2 && (finalMediaType === 'NONE' || finalMediaType === 'IMAGE')) {
      finalMediaType = 'DUAL_IMAGE';
    }

    // Create Poll if requested
    let pollId: string | null = null;
    let pollObj: BanterPoll | null = null;

    if (opts.poll && opts.poll.options && opts.poll.options.length >= 2) {
      pollId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `poll-${Date.now()}`;
      pollObj = {
        id: pollId,
        postId,
        question: opts.poll.question.trim() || 'Community Poll',
        options: opts.poll.options.map((optText, idx) => ({
          id: idx + 1,
          text: optText.trim(),
          votes: 0
        })),
        totalVotes: 0,
        voters: {},
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
      this.savePoll(pollObj);
    }

    // If this is a reply to an opened thread, route to thread reply persistence
    if (opts.parentId) {
      const parent = await this.getPostById(opts.parentId);
      if (parent) {
        parent.commentCount = (parent.commentCount || 0) + 1;
        parent.repliesCount = (parent.repliesCount || 0) + 1;
      }

      const replyPost: BanterPost = {
        id: postId,
        parentId: opts.parentId,
        rootId: opts.parentId,
        depth: 1,
        userId: effectiveDeviceId,
        authorDeviceId: effectiveDeviceId,
        author_device_id: effectiveDeviceId,
        uid: effectiveUid,
        taggedTeamId: opts.taggedTeamId || null,
        taggedTeamName: opts.taggedTeamName || null,
        matchId: opts.matchId || null,
        leagueId: '11111111-1111-1111-1111-111111111111',
        matchContext: opts.matchContext,
        authorHandle: effectiveAuthorHandle,
        authorName: effectiveAuthorName,
        authorAvatar: effectiveAuthorAvatar,
        authorType: opts.authorType || 'user',
        authorBadge: opts.authorBadge,
        content: trimmed,
        mediaUrls,
        mediaType: finalMediaType,
        imageUrl: mediaUrls[0] || opts.imageUrl || undefined,
        sourceType: 'user',
        reactionFireCount: 0,
        reactionClownCount: 0,
        reactionSkullCount: 0,
        commentCount: 0,
        repliesCount: 0,
        repostCount: 0,
        impressionsCount: 1,
        viewsCount: 1,
        isMine: true,
        createdAt: new Date().toISOString(),
        userReactions: {}
      };

      // Optimistically update local array
      this.localPosts = [replyPost, ...this.localPosts];
      setStoredItem('egerscore_local_banter_posts', this.localPosts);

      // Persist reply to backend in background via Promise
      this.persistReplyToBackend(replyPost).catch((err) => {
        console.warn('Backend reply persist deferred:', err);
      });

      return replyPost;
    }

    const newPost: BanterPost = {
      id: postId,
      parentId,
      rootId,
      depth,
      userId: effectiveDeviceId,
      authorDeviceId: effectiveDeviceId,
      author_device_id: effectiveDeviceId,
      uid: effectiveUid,
      taggedTeamId: opts.taggedTeamId || null,
      taggedTeamName: opts.taggedTeamName || null,
      matchId: opts.matchId || null,
      leagueId: '11111111-1111-1111-1111-111111111111',
      matchContext: opts.matchContext,
      authorHandle: effectiveAuthorHandle,
      authorName: effectiveAuthorName,
      authorAvatar: effectiveAuthorAvatar,
      authorType: opts.authorType || 'user',
      authorBadge: opts.authorBadge,
      content: trimmed,
      mediaUrls,
      mediaType: finalMediaType,
      imageUrl: mediaUrls[0] || opts.imageUrl || undefined,
      pollId,
      poll: pollObj,
      sourceType: opts.authorType === 'journalist' ? 'journalist' : 'user',
      likesCount: 0,
      repliesCount: 0,
      repostsCount: 0,
      reactionFireCount: 0,
      reactionClownCount: 0,
      reactionSkullCount: 0,
      commentCount: 0,
      repostCount: 0,
      impressionsCount: 1,
      viewsCount: 1,
      isMine: true,
      createdAt: new Date().toISOString(),
      userReactions: {}
    };

    // Optimistically update local array
    this.localPosts = [newPost, ...this.localPosts];
    setStoredItem('egerscore_local_banter_posts', this.localPosts);

    // Persist to Supabase in background
    this.persistPostToBackend(newPost, pollObj).catch(err => {
      console.warn('Backend banter post persist deferred:', err);
    });

    return newPost;
  }

  public async createReply(parentId: string, content: string, extra?: Partial<CreatePostOptions>): Promise<BanterPost> {
    return this.createPost({
      content,
      parentId,
      ...extra
    });
  }

  public async votePoll(
    pollId: string,
    optionId: number,
    deviceId?: string
  ): Promise<{ success: boolean; poll: BanterPoll }> {
    const session = getActiveSessionProfile();
    const voterId = deviceId || session?.deviceId || anonymousIdentityService.getIdentity().deviceId;

    // Try executing atomic database function via Supabase RPC to prevent concurrent race conditions
    try {
      const { data, error } = await supabase.rpc('vote_banter_poll', {
        p_poll_id: pollId,
        p_option_id: optionId,
        p_device_id: voterId
      });

      if (!error && data) {
        const mapped = this.mapDatabaseRowToPoll(data);
        this.savePoll(mapped);
        return { success: true, poll: mapped };
      }
      if (error && (error.message?.includes('already voted') || error.message?.includes('Device has already voted'))) {
        throw new Error('Device has already voted on this poll.');
      }
    } catch (err: any) {
      if (err.message?.includes('already voted') || err.message?.includes('Device has already voted')) {
        throw err;
      }
      // Offline fallback
    }

    let poll = this.getPollById(pollId);
    if (!poll) {
      throw new Error('Poll not found.');
    }

    if (poll.voters && poll.voters[voterId] !== undefined) {
      throw new Error('Device has already voted on this poll.');
    }

    const updatedOptions = poll.options.map(opt =>
      opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );
    const updatedTotalVotes = (poll.totalVotes || 0) + 1;
    const updatedVoters = { ...(poll.voters || {}), [voterId]: optionId };

    const updatedPoll: BanterPoll = {
      ...poll,
      options: updatedOptions,
      totalVotes: updatedTotalVotes,
      voters: updatedVoters
    };

    this.savePoll(updatedPoll);

    // Update in any cached posts
    this.localPosts.forEach(p => {
      if (p.pollId === pollId) p.poll = updatedPoll;
    });
    setStoredItem('egerscore_local_banter_posts', this.localPosts);

    return { success: true, poll: updatedPoll };
  }

  public recordImpression(postId: string): void {
    // Recorded impression
  }

  public async toggleReaction(
    postId: string,
    reactionType: ReactionType
  ): Promise<{ active: boolean; newCount: number }> {
    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    const postReactions = userReactions[postId] || { fire: false, clown: false, skull: false };
    const currentlyActive = !!postReactions[reactionType];
    const willBeActive = !currentlyActive;

    // Update local state
    postReactions[reactionType] = willBeActive;
    userReactions[postId] = postReactions;
    setStoredItem(STORAGE_KEYS.USER_REACTIONS, userReactions);

    const targetPost = this.localPosts.find((p: BanterPost) => p.id === postId)
      || SEEDED_BANTER_POSTS.find((p: BanterPost) => p.id === postId)
      || (fictionalBanterPosts() as BanterPost[]).find((p: BanterPost) => p.id === postId);

    let countField: 'reactionFireCount' | 'reactionClownCount' | 'reactionSkullCount' = 'reactionFireCount';
    if (reactionType === 'clown') countField = 'reactionClownCount';
    if (reactionType === 'skull') countField = 'reactionSkullCount';

    let count = 0;
    if (targetPost) {
      targetPost[countField] = Math.max(0, targetPost[countField] + (willBeActive ? 1 : -1));
      targetPost.likesCount = targetPost.reactionFireCount;
      count = targetPost[countField];
      setStoredItem('egerscore_local_banter_posts', this.localPosts);
    }

    this.persistReactionToBackend(postId, reactionType, willBeActive).catch(() => {});

    return { active: willBeActive, newCount: count };
  }

  private async persistPostToBackend(post: BanterPost, poll?: BanterPoll | null): Promise<void> {
    try {
      const session = getActiveSessionProfile();
      const devId = post.authorDeviceId || session?.deviceId || getOrCreatePermanentDeviceId();
      const uid = post.uid || session?.uid || `usr_${devId.slice(0, 8)}_${Date.now().toString(36)}`;

      const payload: Record<string, any> = {
        root_id: post.rootId || post.parentId || null,
        parent_id: post.parentId || null,
        uid,
        author_device_id: devId,
        author_name: post.authorName,
        author_handle: post.authorHandle,
        author_avatar: post.authorAvatar,
        content: post.content,
        media_type: post.mediaType || 'NONE',
        match_id: post.matchId || null,
        league_id: post.leagueId || null,
        status: 'active'
      };

      if (/^[0-9a-f-]{36}$/i.test(post.id)) {
        payload.id = post.id;
      }
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        payload.media_urls = post.mediaUrls;
      }
      if (post.taggedTeamId) {
        payload.tagged_team_id = post.taggedTeamId;
        payload.tagged_team_name = post.taggedTeamName;
      }

      const { data, error } = await supabase
        .from('banter_posts')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        post.id = data.id;
        return;
      }

      // Fallback to RPC if direct insert fails
      const creds = await getDeviceCredentials();
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      const effectiveDeviceId = creds.deviceId || devRowId;

      if (effectiveDeviceId && creds.secret) {
        await supabase.rpc('register_or_check_in_device', {
          p_device_id: effectiveDeviceId,
          p_secret: creds.secret,
          p_platform: 'web',
          p_label: post.authorHandle
        });

        const { data: rpcData } = await supabase.rpc('post_device_banter', {
          p_device_id: effectiveDeviceId,
          p_secret: creds.secret,
          p_post_id: /^[0-9a-f-]{36}$/i.test(post.id) ? post.id : null,
          p_match_id: post.matchId || null,
          p_league_id: post.leagueId || null,
          p_author_handle: post.authorHandle,
          p_content: post.content
        });

        if (rpcData) {
          post.id = rpcData;
          return;
        }
      }
    } catch (err) {
      console.warn('Backend banter post persist deferred:', err);
    }
  }

  private async persistReplyToBackend(reply: BanterPost): Promise<void> {
    try {
      if (!reply.parentId) return;
      const session = getActiveSessionProfile();
      const devId = reply.authorDeviceId || session?.deviceId || getOrCreatePermanentDeviceId();
      const uid = reply.uid || session?.uid || `usr_${devId.slice(0, 8)}_${Date.now().toString(36)}`;

      const payload: Record<string, any> = {
        root_id: reply.rootId || reply.parentId,
        parent_id: reply.parentId,
        uid,
        author_device_id: devId,
        author_name: reply.authorName,
        author_handle: reply.authorHandle,
        author_avatar: reply.authorAvatar,
        content: reply.content,
        media_type: reply.mediaType || 'NONE',
        status: 'active'
      };

      if (/^[0-9a-f-]{36}$/i.test(reply.id)) {
        payload.id = reply.id;
      }

      const { data, error } = await supabase
        .from('banter_posts')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        reply.id = data.id;
        return;
      }

      // Fallback to RPC if direct insert fails
      const creds = await getDeviceCredentials();
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      const effectiveDeviceId = creds.deviceId || devRowId;

      if (effectiveDeviceId && creds.secret) {
        await supabase.rpc('register_or_check_in_device', {
          p_device_id: effectiveDeviceId,
          p_secret: creds.secret,
          p_platform: 'web',
          p_label: reply.authorHandle
        });

        const { data: rpcData } = await supabase.rpc('post_device_banter_comment', {
          p_device_id: effectiveDeviceId,
          p_secret: creds.secret,
          p_post_id: reply.parentId,
          p_author_handle: reply.authorHandle,
          p_content: reply.content
        });

        if (rpcData) {
          reply.id = rpcData;
          return;
        }
      }
    } catch (err) {
      console.warn('Backend reply persist deferred:', err);
    }
  }

  private async persistReactionToBackend(
    postId: string,
    reactionType: ReactionType,
    isActive: boolean
  ): Promise<void> {
    try {
      const creds = await getDeviceCredentials();
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      const effectiveDeviceId = creds.deviceId || devRowId;

      if (effectiveDeviceId && creds.secret) {
        await supabase.rpc('register_or_check_in_device', {
          p_device_id: effectiveDeviceId,
          p_secret: creds.secret,
          p_platform: 'web',
          p_label: 'Reaction Voter'
        });

        await supabase.rpc('toggle_device_banter_reaction', {
          p_device_id: effectiveDeviceId,
          p_secret: creds.secret,
          p_post_id: postId,
          p_reaction_type: reactionType,
          p_active: isActive
        });
      }
    } catch (err) {
      console.warn('Backend reaction persist deferred:', err);
    }
  }

  public async fetchComments(postId: string): Promise<BanterComment[]> {
    if (usesLocalFictionalSlate()) {
      const seeded = fictionalComments(postId);
      return getStoredItem<BanterComment[]>(`egerscore_comments_${postId}`, seeded);
    }

    try {
      const { data, error } = await supabase
        .from('banter_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .range(0, 49);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          postId: d.post_id,
          authorHandle: d.author_handle,
          authorType: d.author_type || 'user',
          authorBadge: d.author_badge,
          content: d.content,
          createdAt: d.created_at
        }));
      }
    } catch {
      // offline fallback
    }

    const localComments = getStoredItem<BanterComment[]>(`egerscore_comments_${postId}`, [
      {
        id: `c-seed-${postId}-1`,
        postId,
        authorHandle: 'East Stand #09',
        authorType: 'user',
        content: 'Spot on mate! Couldn’t agree more.',
        createdAt: new Date(Date.now() - 120000).toISOString()
      }
    ]);
    return localComments;
  }

  public async addComment(postId: string, content: string): Promise<BanterComment> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Comment cannot be empty.');
    if (trimmed.length > BANTER_CONFIG.MAX_COMMENT_CHARS) {
      throw new Error(`Comment must be under ${BANTER_CONFIG.MAX_COMMENT_CHARS} characters.`);
    }

    const identity = anonymousIdentityService.getIdentity();
    const comment: BanterComment = {
      id: `comment-${Date.now()}`,
      postId,
      authorHandle: identity.publicHandle,
      authorType: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    const existing = getStoredItem<BanterComment[]>(`egerscore_comments_${postId}`, []);
    setStoredItem(`egerscore_comments_${postId}`, [...existing, comment]);

    // Persist to backend asynchronously via Promise
    this.persistReplyToBackend({
      ...comment,
      parentId: postId
    } as any).catch(() => {});

    return comment;
  }

  private mapDatabaseRowToPost(d: any, userReactions: Record<string, any> = {}): BanterPost {
    let authorType = d.author_type || 'user';
    let authorBadge = d.author_badge;
    const authorHandle = d.author_handle || 'Fanatic';

    if (
      authorType === 'coach' ||
      (authorBadge || '').toLowerCase().includes('coach') ||
      authorHandle.toLowerCase().includes('coach')
    ) {
      authorType = 'coach';
      authorBadge = formatCoachTag(d.tagged_team_name, authorBadge);
    }

    return {
      id: d.id,
      parentId: d.parent_id || null,
      rootId: d.root_id || d.id,
      depth: d.depth || 0,
      userId: d.user_id || d.device_id,
      matchId: d.match_id,
      leagueId: d.league_id,
      authorHandle,
      authorName: d.author_name || authorHandle.split(' #')[0],
      authorAvatar: d.author_avatar,
      authorType,
      authorBadge,
      content: d.content,
      mediaUrls: d.media_urls || (d.image_url ? [d.image_url] : []),
      mediaType: d.media_type || (d.image_url ? 'IMAGE' : 'NONE'),
      imageUrl: d.media_urls?.[0] || d.image_url,
      sourceType: d.source_type || 'user',
      likesCount: d.likes_count || d.reaction_fire_count || 0,
      repliesCount: d.replies_count || d.comment_count || 0,
      repostsCount: d.reposts_count || Math.floor(((d.reaction_fire_count || 0) + 4) * 1.3),
      reactionFireCount: d.reaction_fire_count || 0,
      reactionClownCount: d.reaction_clown_count || 0,
      reactionSkullCount: d.reaction_skull_count || 0,
      commentCount: d.comment_count || 0,
      repostCount: d.repost_count || Math.floor(((d.reaction_fire_count || 0) + 4) * 1.3),
      impressionsCount: d.impressions_count || ((d.reaction_fire_count || 0) + (d.comment_count || 0) + 12) * 58,
      pollId: d.poll_id || null,
      taggedTeamId: d.tagged_team_id || null,
      taggedTeamName: d.tagged_team_name || null,
      uid: d.uid || null,
      authorDeviceId: d.author_device_id || d.device_id || null,
      author_device_id: d.author_device_id || d.device_id || null,
      createdAt: d.created_at,
      userReactions: userReactions[d.id] || {}
    };
  }

  public async fetchPostsForTeam(teamId: string, teamName?: string): Promise<BanterPost[]> {
    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    try {
      let query = supabase
        .from('banter_posts')
        .select('*')
        .eq('status', 'active');

      if (teamId && teamName) {
        query = query.or(`tagged_team_id.eq.${teamId},tagged_team_name.ilike.%${teamName}%`);
      } else if (teamId) {
        query = query.eq('tagged_team_id', teamId);
      } else if (teamName) {
        query = query.ilike('tagged_team_name', `%${teamName}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => this.mapDatabaseRowToPost(d, userReactions));
      }
    } catch {
      // offline fallback
    }

    // Local / seeded fallback
    const all = [...this.localPosts, ...SEEDED_BANTER_POSTS];
    const normalizedName = (teamName || '').toLowerCase();
    return all.filter(p => {
      if (p.taggedTeamId && p.taggedTeamId === teamId) return true;
      if (p.taggedTeamName && teamName && p.taggedTeamName.toLowerCase().includes(normalizedName)) return true;
      if (teamName && p.content.toLowerCase().includes(`@${normalizedName}`)) return true;
      return false;
    });
  }

  public async fetchJournalistAnalytics(): Promise<JournalistAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_journalist_banter_analytics');
      if (!error && data) {
        return data as JournalistAnalytics;
      }
    } catch {
      // fallback to computed local stats
    }

    const all = [...this.localPosts, ...SEEDED_BANTER_POSTS];
    const totalPosts = all.filter(p => !p.parentId).length;
    const totalReplies = all.filter(p => Boolean(p.parentId)).length;
    const deviceSet = new Set(all.map(p => p.authorDeviceId || p.userId || p.id));

    const teamCounts: Record<string, { id: string; name: string; count: number }> = {};
    for (const post of all) {
      if (post.taggedTeamName) {
        const key = post.taggedTeamName;
        if (!teamCounts[key]) {
          teamCounts[key] = {
            id: post.taggedTeamId || key,
            name: post.taggedTeamName,
            count: 0
          };
        }
        teamCounts[key].count += 1;
      }
    }

    const topTeams = Object.values(teamCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(t => ({
        tagged_team_id: t.id,
        tagged_team_name: t.name,
        tag_count: t.count
      }));

    const hourlyCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyCounts[h] = 0;
    for (const post of all) {
      const h = new Date(post.createdAt).getHours();
      hourlyCounts[h] = (hourlyCounts[h] || 0) + 1;
    }

    const hourlyDistribution = Object.entries(hourlyCounts).map(([hour, count]) => ({
      hour_of_day: Number(hour),
      post_count: count
    }));

    return {
      total_posts_7d: totalPosts,
      total_replies_7d: totalReplies,
      active_devices_7d: Math.max(1, deviceSet.size),
      top_tagged_teams: topTeams.length > 0 ? topTeams : [
        { tagged_team_id: 'epl-santos', tagged_team_name: 'Santos FC', tag_count: 8 },
        { tagged_team_id: 'epl-legends', tagged_team_name: 'Legends FC', tag_count: 6 },
        { tagged_team_id: 'epl-bcom', tagged_team_name: 'BCOM FC', tag_count: 4 },
        { tagged_team_id: 'epl-giants', tagged_team_name: 'Giants FC', tag_count: 3 },
      ],
      hourly_distribution_24h: hourlyDistribution
    };
  }

  private mapDatabaseRowToPoll(p: any): BanterPoll {
    return {
      id: p.id,
      postId: p.post_id,
      question: p.question,
      options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options,
      totalVotes: p.total_votes || 0,
      voters: typeof p.voters === 'string' ? JSON.parse(p.voters) : (p.voters || {}),
      expiresAt: p.expires_at
    };
  }
}

export const banterService = new BanterService();
