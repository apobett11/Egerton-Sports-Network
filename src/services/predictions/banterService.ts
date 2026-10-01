import { supabase } from '../../lib/supabase';
import { BANTER_CONFIG, STORAGE_KEYS } from '../../lib/predictions/constants';
import { getStoredItem, setStoredItem } from '../../lib/predictions/utils';
import { anonymousIdentityService } from './anonymousIdentityService';
import type { BanterPost, BanterComment, ReactionType, AuthorType, BanterFilterType } from '../../types/predictions';

// Pre-seeded high quality football community conversations
const SEEDED_BANTER_POSTS: BanterPost[] = [
  {
    id: 'post-seed-01',
    matchId: 'f0000000-0000-4000-8000-000000000002',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Santos FC',
      awayTeamName: 'BCOM FC',
      matchday: 7
    },
    authorHandle: 'Tatton Ultras #42',
    authorType: 'user',
    content: 'Santos are celebrating already. BCOM scored 3 in transition last week. #Matchday',
    sourceType: 'seed',
    reactionFireCount: 38,
    reactionClownCount: 14,
    reactionSkullCount: 22,
    commentCount: 9,
    createdAt: new Date(Date.now() - 360000).toISOString()
  },
  {
    id: 'post-seed-02',
    matchId: 'f0000000-0000-4000-8000-000000000005',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Legends FC',
      awayTeamName: 'Spartans United',
      matchday: 7
    },
    authorHandle: 'EgerSports Desk',
    authorType: 'journalist',
    authorBadge: 'JOURNALIST',
    content: 'Legends fans think this is already won. Spartans have not conceded from a set piece all month. #Derby',
    sourceType: 'journalist',
    reactionFireCount: 64,
    reactionClownCount: 5,
    reactionSkullCount: 9,
    commentCount: 18,
    createdAt: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'post-seed-03',
    matchId: 'f0000000-0000-4000-8000-000000000003',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Blue Blazers',
      awayTeamName: 'Mighty Blacks',
      matchday: 7
    },
    authorHandle: 'Campus Oracle #19',
    authorType: 'user',
    content: "Blue Blazers midfield is walking. Mighty Blacks keep a clean sheet. That's the take. #EPL",
    sourceType: 'seed',
    reactionFireCount: 21,
    reactionClownCount: 3,
    reactionSkullCount: 16,
    commentCount: 4,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'post-seed-04',
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Ruiru Pundit #88',
    authorType: 'user',
    content: 'Who picked the draw and went quiet? Say it. #Matchday',
    sourceType: 'user',
    reactionFireCount: 45,
    reactionClownCount: 9,
    reactionSkullCount: 2,
    commentCount: 7,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'post-seed-coach-01',
    matchId: 'f0000000-0000-4000-8000-000000000005',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Legends FC',
      awayTeamName: 'Spartans United',
      matchday: 7
    },
    authorHandle: 'Legends FC Coach',
    authorType: 'journalist',
    authorBadge: 'COACH',
    content: 'Press the first pass. Spartans will sit in and wait. Stay patient and keep the full-backs high.',
    sourceType: 'journalist',
    reactionFireCount: 12,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 3,
    createdAt: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: 'post-seed-coach-02',
    matchId: 'f0000000-0000-4000-8000-000000000011',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'BCOM FC',
      awayTeamName: 'Legends FC',
      matchday: 8
    },
    authorHandle: 'BCOM FC Coach',
    authorType: 'journalist',
    authorBadge: 'COACH',
    content: 'Matchday 8 note: we start compact. Legends like the early ball in behind. First 20 minutes, no hero passes.',
    sourceType: 'journalist',
    reactionFireCount: 8,
    reactionClownCount: 0,
    reactionSkullCount: 1,
    commentCount: 2,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

function isCoachPost(post: BanterPost): boolean {
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
  } else if (filter === 'latest' || filter === 'today') {
    const oneDayAgo = Date.now() - 86400000;
    all = all.filter((post) => new Date(post.createdAt).getTime() >= oneDayAgo);
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return all;
}

class BanterService {
  private localPosts: BanterPost[] = [];
  private lastPostTimestamp = 0;

  constructor() {
    this.localPosts = getStoredItem<BanterPost[]>('egerscore_local_banter_posts', []);
  }

  public async fetchPosts(
    filter: BanterFilterType | 'hot' | 'latest' | 'matchday',
    matchId?: string | null,
    limit = 20
  ): Promise<BanterPost[]> {
    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    try {
      let query = supabase
        .from('banter_posts')
        .select('*')
        .eq('status', 'active');

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
        const posts: BanterPost[] = data.map((d: any) => ({
          id: d.id,
          matchId: d.match_id,
          leagueId: d.league_id,
          authorHandle: d.author_handle,
          authorType: d.author_type || 'user',
          authorBadge: d.author_badge,
          content: d.content,
          sourceType: d.source_type || 'user',
          reactionFireCount: d.reaction_fire_count || 0,
          reactionClownCount: d.reaction_clown_count || 0,
          reactionSkullCount: d.reaction_skull_count || 0,
          commentCount: d.comment_count || 0,
          repostCount: Math.floor(((d.reaction_fire_count || 0) + 4) * 1.3),
          impressionsCount: ((d.reaction_fire_count || 0) + (d.comment_count || 0) + 12) * 58,
          createdAt: d.created_at,
          userReactions: userReactions[d.id] || {}
        }));
        const filtered = applyBanterFilter(posts, filter);
        if (filtered.length > 0) {
          return filtered.slice(0, limit);
        }
      }
    } catch {
      // offline fallback
    }

    // Combine local user posts + seeded posts
    let all = [...this.localPosts, ...SEEDED_BANTER_POSTS];
    if (matchId) {
      all = all.filter(p => p.matchId === matchId);
    }

    // Apply user reaction flags and Twitter metrics
    all = all.map(p => ({
      ...p,
      repostCount: p.repostCount || Math.floor((p.reactionFireCount + 5) * 1.4),
      impressionsCount: p.impressionsCount || (p.reactionFireCount + p.reactionClownCount + p.commentCount + 10) * 72,
      userReactions: userReactions[p.id] || {}
    }));

    return applyBanterFilter(all, filter).slice(0, limit);
  }

  public async createPost(
    content: string,
    matchId?: string | null,
    matchContext?: BanterPost['matchContext'],
    imageUrl?: string | null
  ): Promise<BanterPost> {
    const trimmed = content.trim();
    if (!trimmed && !imageUrl) {
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

    const newPost: BanterPost = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}`,
      matchId: matchId || null,
      leagueId: '11111111-1111-1111-1111-111111111111',
      matchContext,
      authorHandle: identity.publicHandle,
      authorType: 'user',
      content: trimmed,
      imageUrl: imageUrl || undefined,
      sourceType: 'user',
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
    this.persistPostToBackend(newPost).catch(err => {
      console.warn('Backend banter post persist deferred:', err);
    });

    return newPost;
  }

  private async persistPostToBackend(post: BanterPost): Promise<void> {
    try {
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      if (!devRowId) return;
      const creds = await import('../../lib/deviceCopies').then((mod) => mod.getDeviceCredentials());
      if (!creds.secret) return;

      await supabase.rpc('post_device_banter', {
        p_device_id: devRowId,
        p_secret: creds.secret,
        p_post_id: post.id,
        p_match_id: post.matchId,
        p_league_id: post.leagueId,
        p_author_handle: post.authorHandle,
        p_content: post.content,
      });
    } catch {
      // offline fallback
    }
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

    // Update in local memory posts
    const targetPost = this.localPosts.find(p => p.id === postId) || SEEDED_BANTER_POSTS.find(p => p.id === postId);
    let countField: 'reactionFireCount' | 'reactionClownCount' | 'reactionSkullCount' = 'reactionFireCount';
    if (reactionType === 'clown') countField = 'reactionClownCount';
    if (reactionType === 'skull') countField = 'reactionSkullCount';

    let count = 0;
    if (targetPost) {
      targetPost[countField] = Math.max(0, targetPost[countField] + (willBeActive ? 1 : -1));
      count = targetPost[countField];
      setStoredItem('egerscore_local_banter_posts', this.localPosts);
    }

    // Persist to backend
    this.persistReactionToBackend(postId, reactionType, willBeActive).catch(() => {});

    return { active: willBeActive, newCount: count };
  }

  private async persistReactionToBackend(
    postId: string,
    reactionType: ReactionType,
    isActive: boolean
  ): Promise<void> {
    try {
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      if (!devRowId) return;
      const creds = await import('../../lib/deviceCopies').then((mod) => mod.getDeviceCredentials());
      if (!creds.secret) return;

      await supabase.rpc('toggle_device_banter_reaction', {
        p_device_id: devRowId,
        p_secret: creds.secret,
        p_post_id: postId,
        p_reaction_type: reactionType,
        p_active: isActive,
      });
    } catch {
      // offline safe
    }
  }

  public async fetchComments(postId: string): Promise<BanterComment[]> {
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

    // Background push
    try {
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      const creds = await import('../../lib/deviceCopies').then((mod) => mod.getDeviceCredentials());
      if (devRowId && creds.secret) await supabase.rpc('post_device_banter_comment', {
        p_device_id: devRowId,
        p_secret: creds.secret,
        p_post_id: postId,
        p_author_handle: comment.authorHandle,
        p_content: comment.content,
      });
    } catch {
      // offline safe
    }

    return comment;
  }
}

export const banterService = new BanterService();
