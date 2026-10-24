import { fictionalBanterPosts, fictionalComments, usesLocalFictionalSlate } from '../../lib/predictions/fictionalSlate';
import { supabase } from '../../lib/predictions/banterSupabase';
import { BANTER_CONFIG, STORAGE_KEYS } from '../../lib/predictions/constants';
import { getStoredItem, setStoredItem } from '../../lib/predictions/utils';
import { anonymousIdentityService } from './anonymousIdentityService';
import { getOrCreateDeviceIdentity } from '../../utils/deviceIdentity';
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

function isCoachPost(post: BanterPost): boolean {
  if (post.authorType === 'coach') return true;
  const badge = (post.authorBadge || '').toLowerCase();
  const handle = post.authorHandle.toLowerCase();
  return badge.includes('coach') || handle.includes('coach');
}

function applyBanterFilter(posts: BanterPost[], filter: BanterFilterType | 'hot' | 'latest' | 'matchday'): BanterPost[] {
  let all = [...posts];
  if (filter === 'trending' || filter === 'hot') {
    all.sort((a, b) => (b.reactionFireCount * 2 + b.commentCount * 3) - (a.reactionFireCount * 2 + a.commentCount * 3));
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
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    if (this.localPolls[pollId]) return this.localPolls[pollId];
    if (SEEDED_POLL_1.id === pollId) return SEEDED_POLL_1;
    return null;
  }

  public savePoll(poll: BanterPoll): void {
    this.localPolls[poll.id] = poll;
    setStoredItem('egerscore_local_polls', this.localPolls);
  }

  public async getPostById(postId: string): Promise<BanterPost | null> {
    const post = this.localPosts.find((p: BanterPost) => p.id === postId)
      || SEEDED_BANTER_POSTS.find((p: BanterPost) => p.id === postId)
      || (fictionalBanterPosts() as BanterPost[]).find((p: BanterPost) => p.id === postId);

    if (post) {
      if (post.pollId && !post.poll) {
        post.poll = this.getPollById(post.pollId);
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
    } catch {
      // offline safe
    }

    return null;
  }

  public async fetchPosts(
    filter: BanterFilterType | 'hot' | 'latest' | 'matchday',
    matchId?: string | null,
    limit = 30
  ): Promise<BanterPost[]> {
    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    const seededPosts = usesLocalFictionalSlate() ? fictionalBanterPosts() : SEEDED_BANTER_POSTS;

    if (!usesLocalFictionalSlate()) {
      try {
        let query = supabase
          .from('banter_posts')
          .select('*')
          .is('parent_id', null); // Fetch root posts for feed

        if (matchId) {
          query = query.eq('match_id', matchId);
        }

        if (filter === 'trending' || filter === 'hot') {
          query = query.order('reaction_fire_count', { ascending: false });
        } else if (filter === 'top') {
          query = query.order('comment_count', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(limit);

        if (!error && data && data.length > 0) {
          const posts: BanterPost[] = data.map((d: any) => this.mapDatabaseRowToPost(d, userReactions));
          
          // Attach polls where available
          const pollIds = posts.map(p => p.pollId).filter(Boolean) as string[];
          if (pollIds.length > 0) {
            const { data: pollData } = await supabase
              .from('banter_polls')
              .select('*')
              .in('id', pollIds);
            if (pollData) {
              const pollMap = new Map(pollData.map((p: any) => [p.id, this.mapDatabaseRowToPoll(p)]));
              posts.forEach(p => {
                if (p.pollId && pollMap.has(p.pollId)) {
                  p.poll = pollMap.get(p.pollId);
                }
              });
            }
          }

          const filtered = applyBanterFilter(posts, filter);
          if (filtered.length > 0) {
            return filtered.slice(0, limit);
          }
        }
      } catch {
        // offline fallback
      }
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

    return applyBanterFilter(all, filter).slice(0, limit);
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

    let activePost = await this.getPostById(postId);

    // Build Ancestry chain
    const ancestry: BanterPost[] = [];
    let currentParentId = activePost?.parentId;

    while (currentParentId) {
      const parentPost = await this.getPostById(currentParentId);
      if (!parentPost) break;
      ancestry.unshift(parentPost);
      currentParentId = parentPost.parentId;
    }

    // Build Replies
    let replies: BanterPost[] = [];

    if (!usesLocalFictionalSlate()) {
      try {
        const { data, error } = await supabase
          .from('banter_posts')
          .select('*')
          .or(`parent_id.eq.${postId},root_id.eq.${activePost?.rootId || postId}`)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          replies = data
            .filter((d: any) => d.id !== postId && d.parent_id === postId)
            .map((d: any) => this.mapDatabaseRowToPost(d, userReactions));
        }
      } catch {
        // fallback to memory
      }
    }

    if (replies.length === 0) {
      const allKnown = [...this.localPosts, ...SEEDED_BANTER_POSTS];
      replies = allKnown
        .filter(p => p.parentId === postId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(p => ({
          ...p,
          userReactions: userReactions[p.id] || {}
        }));
    }

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
    extraOptions?: {
      parentId?: string | null;
      mediaUrls?: string[];
      mediaType?: BanterMediaType;
      poll?: { question: string; options: string[] };
      taggedTeamId?: string | null;
      taggedTeamName?: string | null;
      authorDeviceId?: string;
      authorType?: AuthorType;
      authorBadge?: string;
    }
  ): Promise<BanterPost> {
    const opts: CreatePostOptions = typeof contentOrOptions === 'string'
      ? {
          content: contentOrOptions,
          matchId,
          matchContext,
          imageUrl,
          parentId: extraOptions?.parentId,
          mediaUrls: extraOptions?.mediaUrls,
          mediaType: extraOptions?.mediaType,
          poll: extraOptions?.poll,
          taggedTeamId: extraOptions?.taggedTeamId,
          taggedTeamName: extraOptions?.taggedTeamName,
          authorDeviceId: extraOptions?.authorDeviceId,
          authorType: extraOptions?.authorType,
          authorBadge: extraOptions?.authorBadge
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

    const identity = anonymousIdentityService.getIdentity();
    const deviceIdentity = getOrCreateDeviceIdentity();
    const effectiveDeviceId = opts.authorDeviceId || deviceIdentity.deviceId || identity.deviceId;
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

    const newPost: BanterPost = {
      id: postId,
      parentId,
      rootId,
      depth,
      userId: effectiveDeviceId,
      authorDeviceId: effectiveDeviceId,
      taggedTeamId: opts.taggedTeamId || null,
      taggedTeamName: opts.taggedTeamName || null,
      matchId: opts.matchId || null,
      leagueId: '11111111-1111-1111-1111-111111111111',
      matchContext: opts.matchContext,
      authorHandle: identity.publicHandle,
      authorName: identity.publicHandle.split(' #')[0] || 'Fanatic',
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
    const voterId = deviceId || anonymousIdentityService.getIdentity().deviceId;

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
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();

      if (poll) {
        await supabase.from('banter_polls').insert({
          id: poll.id,
          post_id: post.id,
          question: poll.question,
          options: poll.options,
          total_votes: poll.totalVotes,
          voters: poll.voters,
          expires_at: poll.expiresAt
        });
      }

      await supabase.from('banter_posts').insert({
        id: post.id,
        parent_id: post.parentId || null,
        root_id: post.rootId || post.id,
        depth: post.depth || 0,
        user_id: post.userId || devRowId || 'anonymous-device',
        author_device_id: post.authorDeviceId || devRowId || post.userId,
        tagged_team_id: post.taggedTeamId || null,
        tagged_team_name: post.taggedTeamName || null,
        match_id: post.matchId,
        league_id: post.leagueId,
        device_id: devRowId,
        author_handle: post.authorHandle,
        author_name: post.authorName || post.authorHandle,
        author_type: post.authorType,
        author_badge: post.authorBadge,
        content: post.content,
        media_urls: post.mediaUrls || [],
        media_type: post.mediaType || 'NONE',
        poll_id: post.pollId || null,
        source_type: post.sourceType || 'user',
        status: 'active'
      });
    } catch {
      // offline fallback
    }
  }

  private async persistReactionToBackend(
    postId: string,
    reactionType: ReactionType,
    isActive: boolean
  ): Promise<void> {
    try {
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      if (!devRowId) return;

      if (isActive) {
        await supabase.from('banter_reactions').insert({
          post_id: postId,
          device_id: devRowId,
          reaction_type: reactionType
        });
      } else {
        await supabase
          .from('banter_reactions')
          .delete()
          .match({
            post_id: postId,
            device_id: devRowId,
            reaction_type: reactionType
          });
      }
    } catch {
      // offline safe
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

    try {
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      if (devRowId) {
        await supabase.from('banter_comments').insert({
          post_id: postId,
          device_id: devRowId,
          author_handle: comment.authorHandle,
          content: comment.content
        });
      }
    } catch {
      // offline safe
    }

    return comment;
  }

  private mapDatabaseRowToPost(d: any, userReactions: Record<string, any> = {}): BanterPost {
    return {
      id: d.id,
      parentId: d.parent_id || null,
      rootId: d.root_id || d.id,
      depth: d.depth || 0,
      userId: d.user_id || d.device_id,
      matchId: d.match_id,
      leagueId: d.league_id,
      authorHandle: d.author_handle,
      authorName: d.author_name || d.author_handle.split(' #')[0],
      authorAvatar: d.author_avatar,
      authorType: d.author_type || 'user',
      authorBadge: d.author_badge,
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
      authorDeviceId: d.author_device_id || null,
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
