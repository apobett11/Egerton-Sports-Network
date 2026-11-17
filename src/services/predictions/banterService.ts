import { supabase, supabaseBanterAdmin } from '../../lib/predictions/banterSupabase';
import { BANTER_CONFIG, STORAGE_KEYS } from '../../lib/predictions/constants';
import { getStoredItem, setStoredItem, getCleanMessageRef } from '../../lib/predictions/utils';
import { anonymousIdentityService } from './anonymousIdentityService';
import { getOrCreateDeviceIdentity } from '../../utils/deviceIdentity';
import { getDeviceCredentials } from '../../lib/deviceCopies';
import { getActiveSessionProfile, getOrCreatePermanentDeviceId } from '../../utils/sessionIdentity';

export interface PostAlgorithmMetrics {
  impressions: number;
  reposts: number;
  views: number;
  isTrending: boolean;
}

export function calculateDynamicMetrics(post: {
  id?: string;
  created_at?: string;
  createdAt?: string;
  impressions_count?: number;
  impressionsCount?: number;
  repost_count?: number;
  repostCount?: number;
  views_count?: number;
  viewsCount?: number;
  reaction_fire_count?: number;
  reactionClownCount?: number;
  reactionSkullCount?: number;
  comment_count?: number;
  commentCount?: number;
  parent_id?: string | null;
  parentId?: string | null;
}): PostAlgorithmMetrics {
  const isReply = Boolean(post.parent_id || post.parentId);
  const createdRaw = post.created_at || post.createdAt;
  const createdAtMs = createdRaw ? new Date(createdRaw).getTime() : Date.now();
  const now = Date.now();
  const elapsedMinutes = Math.max(0, (now - createdAtMs) / (1000 * 60));

  const idStr = post.id || 'msg';
  const idHash = (idStr.charCodeAt(0) || 0) + (idStr.charCodeAt(idStr.length - 1) || 0);

  if (isReply) {
    // Reply messages: start lower (6-12), rise gradually with time
    const replySeed = 6 + (idHash % 7);
    const replyTimeBonus = Math.floor(15 * Math.log(1 + elapsedMinutes * 0.1));
    const replyImpressions = Math.min(350, replySeed + replyTimeBonus);
    const replyViews = Math.max(1, Math.floor(replyImpressions * 0.35));
    // Reposts start at 0, only rise if impressions > 45
    const replyReposts = replyImpressions > 45 ? Math.floor((replyImpressions - 45) * 0.015) : 0;
    return {
      impressions: replyImpressions,
      reposts: replyReposts,
      views: replyViews,
      isTrending: false
    };
  }

  // Root post:
  // Initial baseline organic seed (18 to 35)
  const baseSeed = 18 + (idHash % 18);

  // Time decay / velocity curve based on time elapsed since sent:
  const timeBonus = Math.floor(45 * Math.log(1 + elapsedMinutes * 0.15));

  // Engagement bonuses from real reactions & replies
  const fires = post.reaction_fire_count || (post as any).reactionFireCount || 0;
  const clowns = (post as any).reaction_clown_count || post.reactionClownCount || 0;
  const skulls = (post as any).reaction_skull_count || post.reactionSkullCount || 0;
  const comments = post.comment_count || post.commentCount || 0;
  const engagementBonus = (fires * 14) + (clowns * 6) + (skulls * 6) + (comments * 22);

  const existingImpr = post.impressions_count ?? post.impressionsCount ?? 0;
  let impressions = Math.max(existingImpr || baseSeed, baseSeed + timeBonus + engagementBonus);

  // Regulate normal range (capped at 1500) and top space trending range (1501-1940)
  const isTrending = impressions > 1500;
  if (isTrending) {
    impressions = Math.min(1940, impressions);
  } else {
    impressions = Math.min(1500, impressions);
  }

  // Reposts naturally start from zero. Depending on real impressions, they rise accordingly:
  // Under 45 impressions: strictly 0
  // Above 45 impressions: rises gradually with impressions + fraction of fire reactions
  let reposts = 0;
  if (impressions > 45) {
    reposts = Math.floor((impressions - 45) * 0.02) + Math.floor(fires * 0.15);
  }

  const existingViews = post.views_count ?? post.viewsCount ?? 1;
  const views = Math.max(existingViews, Math.floor(impressions * 0.42));

  return { impressions, reposts, views, isTrending };
}
import {
  LEAGUE_PAUSE_OFFICIAL_NOTICE_SCREENSHOT,
  SUPER_EAGLES_RUNAWAY_LEADER_SCREENSHOT,
  REFEREE_JARK_CONTROVERSY_SCREENSHOT,
  MIGHTY_BLACKS_DEFENSE_COLLAPSE_SCREENSHOT,
  TOP_SCORER_SCREENSHOT,
  LAW_FC_TABLE_SCREENSHOT,
} from '../../lib/predictions/banterScreenshots';
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
  id?: string;
  content: string;
  parentId?: string | null;
  rootId?: string | null;
  matchId?: string | null;
  matchContext?: BanterPost['matchContext'];
  imageUrl?: string | null;
  mediaUrls?: string[];
  mediaType?: BanterMediaType;
  poll?: {
    id?: string;
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

export function sanitizePostText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function sanitizeMediaUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:text/html')) return '';
  return trimmed;
}

export function parseMediaFromContent(rawContent: string): {
  cleanContent: string;
  mediaUrls: string[];
  mediaType: BanterMediaType;
} {
  if (!rawContent) {
    return { cleanContent: '', mediaUrls: [], mediaType: 'NONE' };
  }

  const mediaUrls: string[] = [];
  let mediaType: BanterMediaType = 'NONE';

  const cleanContent = rawContent.replace(/\[media:(image|video):([^\]]+)\]/g, (_, type, url) => {
    const cleanUrl = url.trim();
    if (cleanUrl) {
      mediaUrls.push(cleanUrl);
      if (type === 'video') {
        mediaType = 'VIDEO';
      } else if (mediaType !== 'VIDEO') {
        mediaType = mediaUrls.length > 1 ? 'DUAL_IMAGE' : 'IMAGE';
      }
    }
    return '';
  }).trim();

  return { cleanContent, mediaUrls, mediaType };
}

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
    try {
      if (typeof video.load === 'function') {
        video.load();
      }
    } catch {
      // safe ignore
    }
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

export function isTestPost(post: BanterPost | { content?: string; id?: string }): boolean {
  if (!post.content || !post.content.trim()) return true;
  if (typeof window !== 'undefined' && ((window as any).__E2E_TEST__ || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return false;
  }
  const c = post.content.toLowerCase();
  return (
    c.includes('root derby match take') ||
    c.includes('thread alpha discussion') ||
    c.includes('thread beta discussion') ||
    c.includes('derby tactics: high pressing') ||
    c.includes('root post with root_id=self') ||
    c.includes('test post') ||
    c.includes('level 1 reply') ||
    c.includes('level 2 sub-reply') ||
    c.includes('alpha exclusive message') ||
    c.includes('paging @engineering fc')
  );
}

// -------------------------------------------------------------
// Pre-seeded high quality football community conversations with Threads & Polls
// -------------------------------------------------------------
export const POLL_PAUSE_RESUMPTION: BanterPoll = {
  id: 'poll-pause-01',
  postId: 'b1000000-0000-4000-8000-000000000002',
  question: 'Will the Matchday 13 pause break Super Eagles momentum?',
  options: [
    { id: 1, text: 'No, they will run away with title', votes: 78 },
    { id: 2, text: 'Legends or Wazito will close gap', votes: 34 },
    { id: 3, text: 'Teams will take 2 weeks to regain rhythm', votes: 21 },
  ],
  totalVotes: 133,
  voters: {},
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
};

export const POLL_OFFICIATING: BanterPoll = {
  id: 'poll-ref-02',
  postId: 'b1000000-0000-4000-8000-000000000003',
  question: 'Which referee has been the most consistent before the break?',
  options: [
    { id: 1, text: 'Referee Lamoh (Firm control & fair cards)', votes: 56 },
    { id: 2, text: 'Referee Ericko (Allows match to flow)', votes: 39 },
    { id: 3, text: 'Referee Jark (Strict on penalties)', votes: 28 },
    { id: 4, text: 'Referee Chalo (Strict on offsides)', votes: 14 },
  ],
  totalVotes: 137,
  voters: {},
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
};

export const POLL_CHAMPIONSHIP_PROMOTION: BanterPoll = {
  id: 'poll-champ-03',
  postId: 'b1000000-0000-4000-8000-000000000007',
  question: 'Who will gain automatic promotion to Egerton Premier League?',
  options: [
    { id: 1, text: 'Talanta fc (League leaders)', votes: 52 },
    { id: 2, text: 'Ajax fc (Free-scoring attack)', votes: 38 },
    { id: 3, text: 'Fass Elites / young stars', votes: 18 },
  ],
  totalVotes: 108,
  voters: {},
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
};

export const POLL_SURPRISE_TEAM: BanterPoll = {
  id: 'poll-qa-04',
  postId: 'b1000000-0000-4000-8000-000000000008',
  question: 'What was your biggest surprise of the first leg?',
  options: [
    { id: 1, text: 'Super Eagles +32 GD dominance', votes: 68 },
    { id: 2, text: 'Mighty Blacks conceding 39 goals', votes: 42 },
    { id: 3, text: 'Talanta FC leading Championship', votes: 27 },
    { id: 4, text: 'Santos FC down in 11th position', votes: 19 },
  ],
  totalVotes: 156,
  voters: {},
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
};

const SEEDED_POLL_1 = POLL_PAUSE_RESUMPTION;

export const SEEDED_BANTER_POSTS: BanterPost[] = [];

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

export function getPostEngagement(p: BanterPost): number {
  const replies = p.commentCount ?? p.repliesCount ?? 0;
  const reposts = p.repostCount ?? p.repostsCount ?? 0;
  const fires = p.reactionFireCount ?? p.likesCount ?? 0;
  const clowns = p.reactionClownCount ?? 0;
  const skulls = p.reactionSkullCount ?? 0;
  return replies * 3 + reposts * 2 + fires + clowns + skulls;
}

export function compareTrending(a: BanterPost, b: BanterPost): number {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  const aIn24h = aTime >= twentyFourHoursAgo;
  const bIn24h = bTime >= twentyFourHoursAgo;

  // Primary: highest engagement from the previous 24 hours
  if (aIn24h && !bIn24h) return -1;
  if (!aIn24h && bIn24h) return 1;

  const aEng = getPostEngagement(a);
  const bEng = getPostEngagement(b);
  if (bEng !== aEng) return bEng - aEng;

  // Secondary tiebreakers: replies, then reposts, then likes, then recency
  const aReplies = a.commentCount ?? a.repliesCount ?? 0;
  const bReplies = b.commentCount ?? b.repliesCount ?? 0;
  if (bReplies !== aReplies) return bReplies - aReplies;

  const aFav = a.repostCount ?? a.repostsCount ?? 0;
  const bFav = b.repostCount ?? b.repostsCount ?? 0;
  if (bFav !== aFav) return bFav - aFav;

  return bTime - aTime;
}

export function applyBanterFilter(posts: BanterPost[], filter: BanterFilterType | 'hot' | 'latest' | 'matchday'): BanterPost[] {
  let all = [...posts];
  if (filter === 'trending' || filter === 'hot') {
    all.sort((a, b) => getPostEngagement(b) - getPostEngagement(a));
  } else if (filter === 'top') {
    all.sort((a, b) => getPostEngagement(b) - getPostEngagement(a));
  } else if (filter === 'teams') {
    all = all.filter(p => Boolean(p.taggedTeamName || p.taggedTeamId || p.matchContext || p.leagueId || (p.content && (p.content.includes('@') || p.content.includes('#EPL') || p.content.includes('#Championship') || p.content.includes('#Derby') || p.content.includes('#Matchday')))));
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filter === 'coach') {
    all = all.filter(isCoachPost);
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filter === 'analytics') {
    all = all.filter(p => p.authorType === 'journalist' || (p.authorBadge || '').toLowerCase().includes('journalist'));
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filter === 'banter') {
    all = all.filter(p => !isCoachPost(p) && p.authorType !== 'journalist' && !(p.authorBadge || '').toLowerCase().includes('journalist'));
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filter === 'latest' || filter === 'today') {
    const oneDayAgo = Date.now() - 86400000;
    const recent = all.filter((post) => new Date(post.createdAt).getTime() >= oneDayAgo);
    all = recent.length > 0 ? recent : all;
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
        const isMsg = Boolean(p.parentId || (p.rootId && p.rootId !== p.id));
        if (p.isTrending && !isMsg) {
          // Top space for trending leader: strictly above 1,500 and capped at 1,940
          if (!p.impressionsCount || p.impressionsCount <= 1500) {
            p.impressionsCount = 1500 + Math.min(440, 220 + ((p.reactionFireCount || 0) * 2));
          } else if (p.impressionsCount > 1940) {
            p.impressionsCount = 1940;
          }
        }
        // Preserve algorithm numbers for normal posts and messages
        p.impressions = p.impressionsCount;
      });
    }
  }

  return all;
}

export class BanterService {
  private localPosts: BanterPost[] = [];
  private localPolls: Record<string, BanterPoll> = {};
  private lastPostTimestamp = 0;
  private postRefToIdMap: Record<string, string> = {};
  private postIdToRefMap: Record<string, string> = {};
  private knownPostsMap: Map<string, BanterPost> = new Map();

  constructor() {
    const rawLocal = getStoredItem<BanterPost[]>('egerscore_local_banter_posts', []);
    this.localPosts = rawLocal.filter((p) => !isTestPost(p));
    if (this.localPosts.length !== rawLocal.length) {
      setStoredItem('egerscore_local_banter_posts', this.localPosts);
    }
    this.localPolls = getStoredItem<Record<string, BanterPoll>>('egerscore_local_polls', {
      [POLL_PAUSE_RESUMPTION.id]: POLL_PAUSE_RESUMPTION,
      [POLL_OFFICIATING.id]: POLL_OFFICIATING,
      [POLL_CHAMPIONSHIP_PROMOTION.id]: POLL_CHAMPIONSHIP_PROMOTION,
      [POLL_SURPRISE_TEAM.id]: POLL_SURPRISE_TEAM,
    });
  }

  public registerPostRef(postId: string, ref: string): void {
    if (postId && ref) {
      this.postRefToIdMap[ref] = postId;
      this.postIdToRefMap[postId] = ref;
    }
  }

  public registerPost(post: BanterPost): void {
    if (!post || !post.id) return;
    this.knownPostsMap.set(post.id, post);
    const cleanRef = getCleanMessageRef(post);
    if (cleanRef) {
      this.knownPostsMap.set(cleanRef, post);
      this.registerPostRef(post.id, cleanRef);
    }
  }

  public resolvePostIdFromRef(refOrId: string): string {
    if (!refOrId) return '';
    if (this.postRefToIdMap[refOrId]) return this.postRefToIdMap[refOrId];
    return refOrId;
  }

  public getCachedMainPosts(filter: string, matchId?: string | null): BanterPost[] | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const cacheKey = `egerscore_banter_cache_${filter}_${matchId || 'all'}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }

  public setCachedMainPosts(filter: string, matchId: string | null | undefined, posts: BanterPost[]): void {
    if (typeof localStorage === 'undefined' || !Array.isArray(posts) || posts.length === 0) return;
    posts.forEach((p) => {
      if (p && p.id) {
        this.knownPostsMap.set(p.id, p);
        const ref = getCleanMessageRef(p);
        if (ref) {
          this.knownPostsMap.set(ref, p);
          this.registerPostRef(p.id, ref);
        }
      }
    });
    try {
      const cacheKey = `egerscore_banter_cache_${filter}_${matchId || 'all'}`;
      localStorage.setItem(cacheKey, JSON.stringify(posts.slice(0, 30)));
    } catch {}
  }

  public getAuthoritativeDeviceId(preferredDeviceId?: string): string {
    if (typeof window === 'undefined') return preferredDeviceId || 'ssr-device';
    try {
      if (
        preferredDeviceId &&
        preferredDeviceId.length > 5 &&
        !preferredDeviceId.startsWith('usr_') &&
        !preferredDeviceId.startsWith('user_')
      ) {
        localStorage.setItem('esn_permanent_device_id', preferredDeviceId);
        localStorage.setItem('esn_device_id', preferredDeviceId);
        return preferredDeviceId;
      }

      // 1. Check permanent device key
      let deviceId = localStorage.getItem('esn_permanent_device_id');
      if (deviceId && deviceId.length > 5) {
        if (!localStorage.getItem('esn_device_id')) {
          localStorage.setItem('esn_device_id', deviceId);
        }
        return deviceId;
      }

      // 2. Check active session profile device ID
      const session = getActiveSessionProfile();
      if (session?.deviceId && session.deviceId.length > 5) {
        localStorage.setItem('esn_permanent_device_id', session.deviceId);
        localStorage.setItem('esn_device_id', session.deviceId);
        return session.deviceId;
      }

      // 3. Check legacy esn_device_id
      const legacy = localStorage.getItem('esn_device_id');
      if (legacy && legacy.length > 5) {
        localStorage.setItem('esn_permanent_device_id', legacy);
        return legacy;
      }

      // 4. Check esn_device_identity
      const rawIdentity = localStorage.getItem('esn_device_identity');
      if (rawIdentity) {
        try {
          const parsed = JSON.parse(rawIdentity);
          if (parsed?.deviceId && parsed.deviceId.length > 5) {
            localStorage.setItem('esn_permanent_device_id', parsed.deviceId);
            localStorage.setItem('esn_device_id', parsed.deviceId);
            return parsed.deviceId;
          }
        } catch {}
      }

      // 5. Generate and persist single permanent device ID
      const created = getOrCreatePermanentDeviceId();
      if (created) {
        localStorage.setItem('esn_permanent_device_id', created);
        localStorage.setItem('esn_device_id', created);
        return created;
      }
    } catch {}
    return 'anon-device';
  }

  /**
   * Batch fetches and auto-fills poll states for only the given poll IDs and device.
   * Avoids N+1 queries by fetching polls and device votes in direct batch calls.
   */
  public async syncPollsForDevice(pollIds: string[], deviceId?: string): Promise<Record<string, BanterPoll>> {
    if (!pollIds || pollIds.length === 0) return {};
    const devId = deviceId || this.getAuthoritativeDeviceId();
    const uniquePollIds = Array.from(new Set(pollIds.filter(Boolean)));
    if (uniquePollIds.length === 0) return {};

    const updatedMap: Record<string, BanterPoll> = {};

    // 1. Direct batch query for polls (only the ones that have been fetched)
    try {
      const { data: pollsData } = await supabase
        .from('banter_polls')
        .select('*')
        .in('id', uniquePollIds);

      if (pollsData && pollsData.length > 0) {
        pollsData.forEach((p: any) => {
          const mapped = this.mapDatabaseRowToPoll(p, devId);
          this.localPolls[mapped.id] = mapped;
          updatedMap[mapped.id] = mapped;
        });
      }
    } catch {
      // offline safe
    }

    // Ensure seeded / local polls are available if requested
    uniquePollIds.forEach((pid) => {
      if (!updatedMap[pid]) {
        const local = this.getPollById(pid);
        if (local) updatedMap[pid] = local;
      }
    });

    // 2. Direct batch query for device votes on only these polls (avoids N+1)
    if (devId && devId !== 'ssr-device' && devId !== 'anon-device') {
      try {
        const { data: votesData } = await supabase
          .from('banter_poll_votes')
          .select('poll_id, option_id, reason')
          .eq('device_id', devId)
          .in('poll_id', uniquePollIds);

        if (votesData && votesData.length > 0) {
          votesData.forEach((v: any) => {
            const p = updatedMap[v.poll_id] || this.getPollById(v.poll_id);
            if (p) {
              const optId = Number(v.option_id);
              const mergedVoters = { ...(p.voters || {}), [devId]: optId };
              p.voters = mergedVoters;
              p.totalVotes = Math.max(p.totalVotes || 0, Object.keys(mergedVoters).length);
              this.savePoll(p);
              updatedMap[p.id] = p;

              // Ensure localStorage is aligned so all sessions/tabs reflect the vote
              try {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem(`egerscore_poll_voted_${p.id}`, JSON.stringify({ optionId: optId, deviceId: devId, votedAt: Date.now() }));
                  localStorage.setItem(`banter_poll_voted_${p.id}`, String(optId));
                  const votedMapRaw = localStorage.getItem('egerscore_voted_polls');
                  const votedMap = votedMapRaw ? JSON.parse(votedMapRaw) : {};
                  votedMap[p.id] = optId;
                  localStorage.setItem('egerscore_voted_polls', JSON.stringify(votedMap));
                  if (v.reason) {
                    localStorage.setItem(`egerscore_poll_reason_${p.id}`, v.reason);
                  }
                }
              } catch {}
            }
          });
        }
      } catch {
        // offline safe
      }
    }

    // 3. Local fallback check for device votes across browser storage
    uniquePollIds.forEach((pid) => {
      const p = updatedMap[pid] || this.getPollById(pid);
      if (p) {
        let votedOption: number | undefined;
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(`egerscore_poll_voted_${pid}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (typeof parsed === 'number') votedOption = parsed;
              else if (parsed?.optionId !== undefined) votedOption = Number(parsed.optionId);
            }
            if (votedOption === undefined) {
              const legacy = localStorage.getItem(`banter_poll_voted_${pid}`);
              if (legacy) {
                const parsed = parseInt(legacy, 10);
                if (!isNaN(parsed)) votedOption = parsed;
              }
            }
            if (votedOption === undefined) {
              const votedMapRaw = localStorage.getItem('egerscore_voted_polls');
              if (votedMapRaw) {
                const vm = JSON.parse(votedMapRaw);
                if (vm && vm[pid] !== undefined) votedOption = Number(vm[pid]);
              }
            }
          }
        } catch {}

        if (votedOption !== undefined && (!p.voters || p.voters[devId] === undefined)) {
          p.voters = { ...(p.voters || {}), [devId]: votedOption };
          p.totalVotes = Math.max(p.totalVotes || 0, Object.keys(p.voters).length);
          this.savePoll(p);
          updatedMap[pid] = p;
        }
      }
    });

    return updatedMap;
  }

  public getPollById(pollId: string): BanterPoll | null {
    if (this.localPolls[pollId]) return this.localPolls[pollId];
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
    const known: Record<string, BanterPoll> = {
      [POLL_PAUSE_RESUMPTION.id]: POLL_PAUSE_RESUMPTION,
      [POLL_OFFICIATING.id]: POLL_OFFICIATING,
      [POLL_CHAMPIONSHIP_PROMOTION.id]: POLL_CHAMPIONSHIP_PROMOTION,
      [POLL_SURPRISE_TEAM.id]: POLL_SURPRISE_TEAM,
    };
    if (known[pollId]) return known[pollId];
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

  public async getPostById(postId: string, deviceId?: string): Promise<BanterPost | null> {
    if (!postId) return null;
    const devId = deviceId || this.getAuthoritativeDeviceId();
    const resolvedId = this.resolvePostIdFromRef(postId);
    const matchesId = (p: BanterPost) =>
      Boolean(
        p &&
        (p.id === resolvedId ||
          p.id === postId ||
          p.id.endsWith(resolvedId) ||
          p.id.replace(/^post-seed-/, '') === resolvedId ||
          getCleanMessageRef(p) === postId ||
          getCleanMessageRef(p) === resolvedId ||
          (resolvedId.length >= 6 && p.id.startsWith(resolvedId)))
      );

    // 1. Check in-memory registered posts
    if (this.knownPostsMap.has(postId)) {
      const p = this.knownPostsMap.get(postId)!;
      this.registerPostRef(p.id, getCleanMessageRef(p));
      return p;
    }
    if (this.knownPostsMap.has(resolvedId)) {
      const p = this.knownPostsMap.get(resolvedId)!;
      this.registerPostRef(p.id, getCleanMessageRef(p));
      return p;
    }

    // 2. Check local posts
    const post = this.localPosts.find(matchesId);
    if (post) {
      this.registerPost(post);
      if (post.pollId) {
        await this.syncPollsForDevice([post.pollId], devId);
        post.poll = this.getPollById(post.pollId) || post.poll;
      }
      return post;
    }

    // 3. Check cached posts in localStorage across all feed tabs
    const cacheFilters = ['trending', 'all', 'recent', 'hot'];
    for (const f of cacheFilters) {
      const cached = this.getCachedMainPosts(f);
      if (cached && cached.length > 0) {
        const found = cached.find(matchesId);
        if (found) {
          this.registerPost(found);
          return found;
        }
      }
    }

    // 4. Check sessionStorage active_banter_post
    if (typeof sessionStorage !== 'undefined') {
      try {
        const storedActive = sessionStorage.getItem('active_banter_post');
        if (storedActive) {
          const parsed = JSON.parse(storedActive);
          if (parsed && matchesId(parsed)) {
            this.registerPost(parsed);
            return parsed;
          }
        }
      } catch {}
    }

    const client = supabaseBanterAdmin || supabase;

    try {
      const isUuid = /^[0-9a-f-]{36}$/i.test(resolvedId);
      if (isUuid) {
        const { data, error } = await client
          .from('banter_posts')
          .select('*')
          .eq('id', resolvedId)
          .maybeSingle();

        if (!error && data) {
          this.registerPostRef(data.id, getCleanMessageRef(data.id));
          if (data.poll_id) {
            await this.syncPollsForDevice([data.poll_id], devId);
          }
          const metrics = calculateDynamicMetrics(data);
          data.impressions_count = metrics.impressions;
          data.repost_count = metrics.reposts;
          data.views_count = metrics.views;
          const mapped = this.mapDatabaseRowToPost(data, {}, devId);
          this.registerPost(mapped);
          return mapped;
        }

        // If not in banter_posts, look up in banter_comments
        const { data: cData, error: cErr } = await client
          .from('banter_comments')
          .select('*')
          .eq('id', resolvedId)
          .maybeSingle();

        if (!cErr && cData) {
          const parsedMedia = parseMediaFromContent(cData.content || '');
          const metrics = calculateDynamicMetrics({
            id: cData.id,
            created_at: cData.created_at,
            parent_id: cData.post_id
          });
          const mappedComment: BanterPost = {
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
            content: parsedMedia.cleanContent || cData.content,
            mediaUrls: parsedMedia.mediaUrls,
            mediaType: parsedMedia.mediaType,
            imageUrl: parsedMedia.mediaUrls[0] || undefined,
            reactionFireCount: 0,
            reactionClownCount: 0,
            reactionSkullCount: 0,
            commentCount: 0,
            repliesCount: 0,
            repostCount: metrics.reposts,
            impressionsCount: metrics.impressions,
            viewsCount: metrics.views,
            createdAt: cData.created_at,
          };
          this.registerPost(mappedComment);
          return mappedComment;
        }
      } else {
        // Look up by clean ref in recent active posts
        const { data: recentPosts } = await client
          .from('banter_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (recentPosts) {
          const matched = recentPosts.find((p: any) => getCleanMessageRef(p.id) === resolvedId || p.id === resolvedId);
          if (matched) {
            this.registerPostRef(matched.id, resolvedId);
            const metrics = calculateDynamicMetrics(matched);
            matched.impressions_count = metrics.impressions;
            matched.repost_count = metrics.reposts;
            matched.views_count = metrics.views;
            return this.mapDatabaseRowToPost(matched, {}, devId);
          }
        }
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
    offset = 0,
    deviceId?: string
  ): Promise<BanterPost[]> {
    // 1. Device ID is the first thing checked
    const devId = deviceId || this.getAuthoritativeDeviceId();

    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    const client = supabaseBanterAdmin || supabase;
    let rawDbPosts: any[] = [];

    try {
      let query = client
        .from('banter_posts')
        .select('*')
        .eq('status', 'active');

      if (matchId) {
        query = query.eq('match_id', matchId);
      }

      if (filter === 'trending' || filter === 'hot') {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        query = query
          .gte('created_at', twentyFourHoursAgo)
          .order('comment_count', { ascending: false })
          .order('repost_count', { ascending: false })
          .order('reaction_fire_count', { ascending: false });
      } else if (filter === 'coach') {
        query = query.or('author_type.eq.coach,author_badge.ilike.%coach%').order('created_at', { ascending: false });
      } else if (filter === 'analytics') {
        query = query.or('author_type.eq.journalist,author_badge.ilike.%journalist%').order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Paginated query: avoids returning entire tables or only device ID
      query = query.range(offset, offset + limit - 1);
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        rawDbPosts = data;
      }
    } catch {
      // offline fallback
    }

    // Fallback to /api/messages endpoint if direct query was empty at offset 0
    if (rawDbPosts.length === 0 && offset === 0) {
      try {
        const res = await fetch('/api/messages?limit=' + limit);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.posts) && json.posts.length > 0) {
            rawDbPosts = json.posts;
          }
        }
      } catch {}
    }

    if (rawDbPosts.length > 0) {
      // Collect poll IDs for background synchronization without blocking message rendering
      const pollIds = rawDbPosts.map((d: any) => d.poll_id).filter(Boolean);
      if (pollIds.length > 0) {
        void this.syncPollsForDevice(pollIds, devId).catch(() => {});
      }

      // Execute dynamic metrics calculation from elapsed time since sent (Read-only presentation, zero DB write on scroll)
      const posts: BanterPost[] = rawDbPosts
        .filter((d: any) => !isTestPost(d))
        .map((d: any) => {
          const metrics = calculateDynamicMetrics(d);
          d.impressions_count = Math.max(d.impressions_count || 0, metrics.impressions);
          d.repost_count = Math.max(d.repost_count || 0, metrics.reposts);
          d.views_count = Math.max(d.views_count || 0, metrics.views);
          return this.mapDatabaseRowToPost(d, userReactions, devId);
        });

      // Merge local posts that are not in database yet (e.g. pending optimistic posts)
      const unSyncedLocal = this.localPosts.filter(
        (lp) => !lp.parentId && !posts.some((p) => p.id === lp.id) && !isTestPost(lp)
      );

      const unSyncedPollIds = unSyncedLocal.map((p) => p.pollId).filter(Boolean) as string[];
      if (unSyncedPollIds.length > 0) {
        void this.syncPollsForDevice(unSyncedPollIds, devId).catch(() => {});
      }

      const syncedUnSyncedLocal = unSyncedLocal.map((p) => ({
        ...p,
        poll: p.pollId ? (this.getPollById(p.pollId) || p.poll) : undefined
      }));

      const combined = [...syncedUnSyncedLocal, ...posts];

      const filtered = applyBanterFilter(combined, filter);
      if (filtered.length > 0) {
        const result = filtered.slice(0, limit);
        if (offset === 0) {
          this.setCachedMainPosts(filter, matchId, result);
        }
        return result;
      }
    }

    // Offline / cached posts fallback
    const allRoot = this.localPosts.filter(p => (!p.parentId || p.depth === 0) && !isTestPost(p));
    let all = allRoot;
    if (matchId) {
      all = all.filter(p => p.matchId === matchId);
    }

    const fallbackPollIds = all.map(p => p.pollId).filter(Boolean) as string[];
    if (fallbackPollIds.length > 0) {
      void this.syncPollsForDevice(fallbackPollIds, devId).catch(() => {});
    }

    all = all.map(p => {
      const metrics = calculateDynamicMetrics(p);
      return {
        ...p,
        poll: p.pollId ? (this.getPollById(p.pollId) || p.poll) : undefined,
        repostCount: metrics.reposts,
        impressionsCount: metrics.impressions,
        impressions: metrics.impressions,
        viewsCount: metrics.views,
        userReactions: userReactions[p.id] || {}
      };
    });

    return applyBanterFilter(all, filter).slice(offset, offset + limit);
  }

  public async fetchThread(postId: string, deviceId?: string): Promise<{
    post: BanterPost | null;
    ancestry: BanterPost[];
    replies: BanterPost[];
  }> {
    // 1. Device ID is the first thing checked
    const devId = deviceId || this.getAuthoritativeDeviceId();

    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    // Section Load: Resolve the active post and its complete ancestry chain
    const activePost = await this.getPostById(postId, devId);
    const effectivePostId = activePost?.id || this.resolvePostIdFromRef(postId);
    const ancestry: BanterPost[] = [];

    // Traverse upwards to assemble the complete ancestry chain with continuous vertical connectors
    let currentAncestorId = activePost?.parentId;
    while (currentAncestorId) {
      const ancestor = await this.getPostById(currentAncestorId, devId);
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

    // Section Load: Load direct replies for this thread from banter_comments in database
    // When the replies are zero, no calls are done
    const replyCount = activePost ? (activePost.commentCount ?? activePost.repliesCount ?? 0) : 0;
    let replies: BanterPost[] = [];

    if (replyCount > 0) {
      try {
        const isUuid = /^[0-9a-f-]{36}$/i.test(effectivePostId);
        if (isUuid) {
          const client = supabaseBanterAdmin || supabase;
          const { data, error } = await client
            .from('banter_comments')
            .select('*')
            .eq('post_id', effectivePostId)
            .eq('status', 'active')
            .order('created_at', { ascending: true })
            .limit(100);

          if (!error && data && data.length > 0) {
            replies = data
              .filter((d: any) => !isTestPost(d))
              .map((d: any) => {
                const parsedMedia = parseMediaFromContent(d.content || '');
                let aType = d.author_type || 'user';
                let aBadge = d.author_badge;
                if (aType === 'coach' || (aBadge || '').toLowerCase().includes('coach')) {
                  aType = 'coach';
                }
                const metrics = calculateDynamicMetrics({
                  id: d.id,
                  created_at: d.created_at,
                  parent_id: d.post_id
                });
                return {
                  id: d.id,
                  parentId: d.post_id,
                  rootId: d.post_id,
                  depth: 1,
                  userId: d.device_id,
                  authorDeviceId: d.device_id,
                  author_device_id: d.device_id,
                  authorHandle: d.author_handle || 'Fanatic',
                  authorName: (d.author_handle || 'Fanatic').split(' #')[0],
                  authorType: aType,
                  authorBadge: aBadge,
                  content: parsedMedia.cleanContent || d.content,
                  mediaUrls: parsedMedia.mediaUrls,
                  mediaType: parsedMedia.mediaType,
                  imageUrl: parsedMedia.mediaUrls[0] || undefined,
                  sourceType: 'user' as const,
                  reactionFireCount: 0,
                  reactionClownCount: 0,
                  reactionSkullCount: 0,
                  commentCount: 0,
                  repliesCount: 0,
                  repostCount: metrics.reposts,
                  impressionsCount: metrics.impressions,
                  viewsCount: metrics.views,
                  createdAt: d.created_at,
                  userReactions: userReactions[d.id] || {}
                };
              });
          }
        }
      } catch {
        // offline safe
      }
    }

    // Include local replies directly attached to this post (not yet in remote DB)
    const localReplies = this.localPosts
      .filter((p) => p.parentId === postId && !replies.some((r) => r.id === p.id) && !isTestPost(p))
      .map((p) => ({
        ...p,
        userReactions: userReactions[p.id] || {}
      }));

    replies = [...replies, ...localReplies];

    // Collect poll IDs from active post, ancestry, and only fetched replies (avoid N+1)
    const threadPollIds: string[] = [];
    if (activePost?.pollId) threadPollIds.push(activePost.pollId);
    ancestry.forEach((a) => { if (a.pollId) threadPollIds.push(a.pollId); });
    replies.forEach((r) => { if (r.pollId) threadPollIds.push(r.pollId); });

    if (threadPollIds.length > 0) {
      await this.syncPollsForDevice(threadPollIds, devId);
      if (activePost?.pollId) {
        activePost.poll = this.getPollById(activePost.pollId) || activePost.poll;
      }
      ancestry.forEach((a) => {
        if (a.pollId) a.poll = this.getPollById(a.pollId) || a.poll;
      });
      replies = replies.map((r) => ({
        ...r,
        poll: r.pollId ? (this.getPollById(r.pollId) || r.poll) : undefined
      }));
    }

    return {
      post: activePost,
      ancestry,
      replies
    };
  }

  public async writePostToDatabase(
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

    const rawTrimmed = (opts.content || '').trim();
    const hasMedia = Boolean((opts.mediaUrls && opts.mediaUrls.length > 0) || opts.imageUrl);
    const hasPoll = Boolean(opts.poll && opts.poll.options && opts.poll.options.length >= 2);

    if (!rawTrimmed && !hasMedia && !hasPoll) {
      throw new Error('Post content cannot be empty.');
    }

    // 1. Anti-injection sanitization
    const sanitizedContent = sanitizePostText(rawTrimmed);
    const sessionProfile = getActiveSessionProfile();
    const identity = anonymousIdentityService.getIdentity();
    const deviceIdentity = getOrCreateDeviceIdentity();
    const effectiveDeviceId = opts.authorDeviceId || sessionProfile?.deviceId || deviceIdentity.deviceId || identity.deviceId;
    const effectiveAuthorName = sanitizePostText(opts.authorName || sessionProfile?.authorName || identity.publicHandle.split(' #')[0] || 'Fanatic').slice(0, 80);
    const effectiveAuthorHandle = sanitizePostText(opts.authorHandle || sessionProfile?.authorHandle || identity.publicHandle).slice(0, 80);
    const effectiveAuthorAvatar = opts.authorAvatar || sessionProfile?.avatarColor;
    const effectiveBadge = opts.authorBadge ? sanitizePostText(opts.authorBadge).slice(0, 60) : undefined;
    const postId = (opts.id && /^[0-9a-f-]{36}$/i.test(opts.id)) ? opts.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

    // Determine media type & URLs
    let finalMediaType: BanterMediaType = opts.mediaType || 'NONE';
    let mediaUrls: string[] = (opts.mediaUrls || []).map(sanitizeMediaUrl).filter(Boolean);
    if (opts.imageUrl && mediaUrls.length === 0) {
      mediaUrls = [sanitizeMediaUrl(opts.imageUrl)];
      finalMediaType = 'IMAGE';
    } else if (mediaUrls.length === 1 && finalMediaType === 'NONE') {
      finalMediaType = 'IMAGE';
    } else if (mediaUrls.length >= 2 && (finalMediaType === 'NONE' || finalMediaType === 'IMAGE')) {
      finalMediaType = 'DUAL_IMAGE';
    }

    // Format content with media tags keeping within check constraints
    const maxChars = opts.parentId ? 200 : 280;
    let formattedContent = sanitizedContent;
    if (mediaUrls.length > 0) {
      const tag = finalMediaType === 'VIDEO' ? 'video' : 'image';
      for (const url of mediaUrls) {
        if (!url.startsWith('data:') && !formattedContent.includes(url)) {
          const appendTag = ` [media:${tag}:${url}]`;
          if ((formattedContent + appendTag).length <= maxChars) {
            formattedContent = `${formattedContent}${appendTag}`.trim();
          }
        }
      }
    }
    if (formattedContent.length > maxChars) {
      formattedContent = formattedContent.slice(0, maxChars).trim();
    }
    if (!formattedContent && !hasPoll) {
      formattedContent = 'Matchday take';
    }

    // Baseline engagement numbers computed by algorithm in database
    const baselineImpressions = Math.floor(18 + Math.random() * 24); // 18-42 baseline organic impressions
    const baselineViews = Math.max(1, Math.floor(baselineImpressions * 0.4));
    const baselineReposts = 0;

    const validAuthorTypes = ['user', 'journalist', 'admin', 'seed'];
    const dbAuthorType = validAuthorTypes.includes(opts.authorType || 'user') ? (opts.authorType || 'user') : 'user';
    const dbBadge = opts.authorType === 'coach' ? (effectiveBadge || 'HEAD COACH') : effectiveBadge;

    let savedDbRow: any = null;

    // Handle Reply (parentId present)
    if (opts.parentId) {
      // 1. Try server-side API first
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: postId,
            parentId: opts.parentId,
            content: formattedContent,
            authorHandle: effectiveAuthorHandle,
            authorType: dbAuthorType,
            authorBadge: dbBadge,
            mediaUrls,
            mediaType: finalMediaType
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.reply) savedDbRow = json.reply;
        }
      } catch {}

      // 2. Direct authorized database write
      if (!savedDbRow && supabaseBanterAdmin) {
        const commentPayload: any = {
          post_id: opts.parentId,
          author_handle: effectiveAuthorHandle,
          author_type: dbAuthorType,
          content: (formattedContent || 'Reply take').slice(0, 200),
          status: 'active'
        };
        if (postId) commentPayload.id = postId;

        const { data, error } = await supabaseBanterAdmin
          .from('banter_comments')
          .insert([commentPayload])
          .select()
          .single();

        if (error || !data) {
          throw new Error(error?.message || 'Database write to banter_comments failed.');
        }
        savedDbRow = data;

        // Increment parent post comment count in DB
        try {
          const { data: p } = await supabaseBanterAdmin
            .from('banter_posts')
            .select('comment_count')
            .eq('id', opts.parentId)
            .single();
          if (p) {
            await supabaseBanterAdmin
              .from('banter_posts')
              .update({ comment_count: (p.comment_count || 0) + 1 })
              .eq('id', opts.parentId);
          }
        } catch {}
      }

      if (!savedDbRow) {
        throw new Error('Database write failed for reply message.');
      }

      const replyPost: BanterPost = {
        id: savedDbRow.id,
        parentId: opts.parentId,
        rootId: opts.rootId || opts.parentId,
        depth: 1,
        userId: effectiveDeviceId,
        authorDeviceId: effectiveDeviceId,
        author_device_id: effectiveDeviceId,
        uid: opts.uid || sessionProfile?.uid,
        taggedTeamId: opts.taggedTeamId || null,
        taggedTeamName: opts.taggedTeamName || null,
        matchId: opts.matchId || null,
        leagueId: '11111111-1111-1111-1111-111111111111',
        matchContext: opts.matchContext,
        authorHandle: effectiveAuthorHandle,
        authorName: effectiveAuthorName,
        authorAvatar: effectiveAuthorAvatar,
        authorType: opts.authorType || 'user',
        authorBadge: dbBadge,
        content: sanitizedContent,
        mediaUrls,
        mediaType: finalMediaType,
        imageUrl: mediaUrls[0] || undefined,
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
        createdAt: savedDbRow.created_at || new Date().toISOString(),
        userReactions: {}
      };

      this.localPosts = [replyPost, ...this.localPosts.filter(p => p.id !== replyPost.id)];
      setStoredItem('egerscore_local_banter_posts', this.localPosts);
      return replyPost;
    }

    // Handle Root Post
    // 1. Try server-side API first
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          content: formattedContent,
          authorHandle: effectiveAuthorHandle,
          authorType: dbAuthorType,
          authorBadge: dbBadge,
          matchId: opts.matchId || null,
          leagueId: '11111111-1111-1111-1111-111111111111',
          mediaUrls,
          mediaType: finalMediaType,
          poll: opts.poll
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.post) savedDbRow = json.post;
      }
    } catch {}

    // 2. Direct authorized database write
    if (!savedDbRow && supabaseBanterAdmin) {
      const postPayload: any = {
        author_handle: effectiveAuthorHandle,
        author_type: dbAuthorType,
        author_badge: dbBadge || null,
        content: (formattedContent || 'Matchday take').slice(0, 280),
        source_type: 'user',
        status: 'active',
        match_id: opts.matchId || null,
        league_id: '11111111-1111-1111-1111-111111111111',
        reaction_fire_count: 0,
        reaction_clown_count: 0,
        reaction_skull_count: 0,
        comment_count: 0,
        impressions_count: baselineImpressions,
        views_count: baselineViews,
        repost_count: baselineReposts
      };
      if (postId) postPayload.id = postId;

      const { data, error } = await supabaseBanterAdmin
        .from('banter_posts')
        .insert([postPayload])
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Database write to banter_posts failed.');
      }
      savedDbRow = data;
    }

    if (!savedDbRow || !savedDbRow.id) {
      throw new Error('Database write failed. Post was not stored.');
    }

    // Poll Attachment (stored as thread comment under the post to prevent injection)
    let pollObj: BanterPoll | null = null;
    if (opts.poll && opts.poll.options && opts.poll.options.length >= 2) {
      const sanitizedQ = sanitizePostText(opts.poll.question).slice(0, 70) || 'Community Poll';
      const sanitizedOpts = opts.poll.options.map(o => sanitizePostText(o).slice(0, 50)).filter(Boolean);
      pollObj = {
        id: opts.poll.id || `poll-${savedDbRow.id}`,
        postId: savedDbRow.id,
        question: sanitizedQ,
        options: sanitizedOpts.map((optText, idx) => ({ id: idx + 1, text: optText, votes: 0 })),
        totalVotes: 0,
        voters: {},
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
      this.savePoll(pollObj);

      // Store poll in thread comment in banter_comments
      if (supabaseBanterAdmin) {
        try {
          const pollComment = `[poll:${JSON.stringify({ q: sanitizedQ, o: sanitizedOpts })}]`.slice(0, 200);
          await supabaseBanterAdmin.from('banter_comments').insert([{
            post_id: savedDbRow.id,
            author_handle: 'poll_bot',
            author_type: 'user',
            content: pollComment,
            status: 'active'
          }]);
        } catch (pollErr) {
          console.warn('Thread poll comment store deferred:', pollErr);
        }
      }
    }

    // Build the confirmed post with its DB numbers attached directly
    const finalPost: BanterPost = {
      id: savedDbRow.id,
      parentId: null,
      rootId: savedDbRow.id,
      depth: 0,
      userId: effectiveDeviceId,
      authorDeviceId: effectiveDeviceId,
      author_device_id: effectiveDeviceId,
      uid: opts.uid || sessionProfile?.uid,
      taggedTeamId: opts.taggedTeamId || null,
      taggedTeamName: opts.taggedTeamName || null,
      matchId: savedDbRow.match_id || opts.matchId || null,
      leagueId: savedDbRow.league_id || null,
      matchContext: opts.matchContext,
      authorHandle: savedDbRow.author_handle || effectiveAuthorHandle,
      authorName: effectiveAuthorName,
      authorAvatar: effectiveAuthorAvatar,
      authorType: (savedDbRow.author_type || dbAuthorType) as AuthorType,
      authorBadge: savedDbRow.author_badge || dbBadge || undefined,
      content: sanitizedContent,
      mediaUrls,
      mediaType: finalMediaType,
      imageUrl: mediaUrls[0] || undefined,
      pollId: pollObj ? pollObj.id : null,
      poll: pollObj,
      sourceType: 'user',
      likesCount: savedDbRow.reaction_fire_count || 0,
      repliesCount: savedDbRow.comment_count || 0,
      repostsCount: savedDbRow.repost_count || 0,
      reactionFireCount: savedDbRow.reaction_fire_count || 0,
      reactionClownCount: savedDbRow.reaction_clown_count || 0,
      reactionSkullCount: savedDbRow.reaction_skull_count || 0,
      commentCount: savedDbRow.comment_count || 0,
      repostCount: savedDbRow.repost_count || 0,
      impressionsCount: savedDbRow.impressions_count ?? baselineImpressions,
      impressions: savedDbRow.impressions_count ?? baselineImpressions,
      viewsCount: savedDbRow.views_count ?? baselineViews,
      isMine: true,
      createdAt: savedDbRow.created_at || new Date().toISOString(),
      userReactions: {}
    };

    // Update local cache immediately for sender
    this.localPosts = [finalPost, ...this.localPosts.filter(p => p.id !== finalPost.id)];
    setStoredItem('egerscore_local_banter_posts', this.localPosts);
    const existingCache = this.getCachedMainPosts('all', finalPost.matchId) || [];
    this.setCachedMainPosts('all', finalPost.matchId, [finalPost, ...existingCache.filter(p => p.id !== finalPost.id)]);

    return finalPost;
  }

  public async createPost(
    contentOrOptions: string | CreatePostOptions,
    matchId?: string | null,
    matchContext?: BanterPost['matchContext'],
    imageUrl?: string | null,
    extraOptions?: Partial<CreatePostOptions>
  ): Promise<BanterPost> {
    return this.writePostToDatabase(contentOrOptions, matchId, matchContext, imageUrl, extraOptions);
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
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`egerscore_poll_voted_${pollId}`, JSON.stringify({ optionId, deviceId: voterId, votedAt: Date.now() }));
            localStorage.setItem(`banter_poll_voted_${pollId}`, String(optionId));
            const votedMapRaw = localStorage.getItem('egerscore_voted_polls');
            const votedMap = votedMapRaw ? JSON.parse(votedMapRaw) : {};
            votedMap[pollId] = optionId;
            localStorage.setItem('egerscore_voted_polls', JSON.stringify(votedMap));
          }
        } catch {}
        return { success: true, poll: mapped };
      }
      if (error && (error.message?.includes('already voted') || error.message?.includes('Device has already voted'))) {
        try {
          if (typeof localStorage !== 'undefined') {
            const votedMapRaw = localStorage.getItem('egerscore_voted_polls');
            const votedMap = votedMapRaw ? JSON.parse(votedMapRaw) : {};
            votedMap[pollId] = optionId;
            localStorage.setItem('egerscore_voted_polls', JSON.stringify(votedMap));
          }
        } catch {}
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

  private pendingImpressionIds: Set<string> = new Set();
  private batchFlushTimer: any = null;

  public recordImpression(postId: string): void {
    if (!postId || !/^[0-9a-f-]{36}$/i.test(postId)) return;
    this.pendingImpressionIds.add(postId);
    if (!this.batchFlushTimer) {
      this.batchFlushTimer = setTimeout(() => {
        this.flushPendingImpressions().catch(() => {});
      }, 30000);
    }
  }

  public async flushPendingImpressions(): Promise<void> {
    if (this.batchFlushTimer) {
      clearTimeout(this.batchFlushTimer);
      this.batchFlushTimer = null;
    }
    const ids = Array.from(this.pendingImpressionIds);
    this.pendingImpressionIds.clear();
    if (ids.length === 0) return;

    try {
      const impressions = ids.map(() => 1);
      const reposts = ids.map(() => 0);
      const views = ids.map(() => 1);
      await supabase.rpc('batch_increment_banter_metrics', {
        p_post_ids: ids,
        p_impressions: impressions,
        p_reposts: reposts,
        p_views: views,
      });
    } catch {
      // offline safe
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

    const targetPost = this.localPosts.find((p: BanterPost) => p.id === postId);

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
      let formattedContent = post.content || '';
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        const tag = post.mediaType === 'VIDEO' ? 'video' : 'image';
        post.mediaUrls.forEach((url) => {
          if (!formattedContent.includes(url)) {
            formattedContent = `${formattedContent} [media:${tag}:${url}]`.trim();
          }
        });
      }

      // 1. Try server-side API first (reliable backend insertion with service role)
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: post.id,
            content: formattedContent,
            authorHandle: post.authorHandle,
            authorType: post.authorType || 'user',
            authorBadge: post.authorBadge,
            matchId: post.matchId || null,
            leagueId: post.leagueId || null,
            mediaUrls: post.mediaUrls,
            mediaType: post.mediaType
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.post?.id) {
            post.id = json.post.id;
            return;
          }
        }
      } catch {
        // Fallback to client insert
      }

      // 2. Direct Supabase insert into banter_posts with valid columns only
      const validAuthorTypes = ['user', 'journalist', 'admin', 'seed'];
      const dbAuthorType = validAuthorTypes.includes(post.authorType) ? post.authorType : 'user';
      const dbBadge = post.authorType === 'coach' ? (post.authorBadge || 'HEAD COACH') : post.authorBadge;

      const payload: Record<string, any> = {
        author_handle: post.authorHandle || 'Fanatic',
        author_type: dbAuthorType,
        author_badge: dbBadge || null,
        content: formattedContent,
        match_id: post.matchId || null,
        league_id: post.leagueId || null,
        source_type: post.sourceType || 'user',
        status: 'active'
      };

      if (/^[0-9a-f-]{36}$/i.test(post.id)) {
        payload.id = post.id;
      }

      const { data, error } = await supabase
        .from('banter_posts')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        post.id = data.id;
        const targetPoll = poll || post.poll;
        if (targetPoll) {
          this.savePoll(targetPoll);
          try {
            await supabase.from('banter_polls').upsert([{
              id: targetPoll.id,
              post_id: data.id,
              question: targetPoll.question,
              options: targetPoll.options,
              total_votes: targetPoll.totalVotes || 0,
              voters: targetPoll.voters || {},
              expires_at: targetPoll.expiresAt
            }]);
          } catch (pollErr) {
            console.warn('Poll backend persist deferred:', pollErr);
          }
        }
        return;
      }

      // 3. Fallback to RPC if direct insert fails
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
          p_content: formattedContent
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

      let formattedContent = reply.content || '';
      if (reply.mediaUrls && reply.mediaUrls.length > 0) {
        const tag = reply.mediaType === 'VIDEO' ? 'video' : 'image';
        reply.mediaUrls.forEach((url) => {
          if (!formattedContent.includes(url)) {
            formattedContent = `${formattedContent} [media:${tag}:${url}]`.trim();
          }
        });
      }

      // 1. Try server-side API first (reliable backend insertion into banter_comments)
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: reply.id,
            parentId: reply.parentId,
            content: formattedContent,
            authorHandle: reply.authorHandle,
            authorType: reply.authorType || 'user',
            authorBadge: reply.authorBadge,
            mediaUrls: reply.mediaUrls,
            mediaType: reply.mediaType
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.reply?.id) {
            reply.id = json.reply.id;
            return;
          }
        }
      } catch {
        // Fallback to client insert
      }

      // 2. Direct Supabase insert into banter_comments
      const commentPayload: any = {
        post_id: reply.parentId,
        author_handle: reply.authorHandle || 'Fanatic',
        author_type: reply.authorType || 'user',
        content: formattedContent,
        status: 'active'
      };

      if (/^[0-9a-f-]{36}$/i.test(reply.id)) {
        commentPayload.id = reply.id;
      }

      const { data, error } = await supabase
        .from('banter_comments')
        .insert([commentPayload])
        .select()
        .single();

      if (!error && data) {
        reply.id = data.id;
        return;
      }

      // 3. Fallback to RPC if direct insert fails
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
          p_content: formattedContent
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
    try {
      const { data, error } = await supabase
        .from('banter_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .range(0, 49);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          const parsedMedia = parseMediaFromContent(d.content || '');
          return {
            id: d.id,
            postId: d.post_id,
            authorHandle: d.author_handle || 'Fanatic',
            authorType: d.author_type || 'user',
            authorBadge: d.author_badge,
            content: parsedMedia.cleanContent || d.content,
            createdAt: d.created_at
          };
        });
      }
    } catch {
      // offline fallback
    }

    const localComments = getStoredItem<BanterComment[]>(`egerscore_comments_${postId}`, []);
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
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `comment-${Date.now()}`,
      postId,
      authorHandle: identity.publicHandle,
      authorType: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    const existing = getStoredItem<BanterComment[]>(`egerscore_comments_${postId}`, []);
    setStoredItem(`egerscore_comments_${postId}`, [...existing, comment]);

    // Persist to backend and await
    try {
      await this.persistReplyToBackend({
        ...comment,
        parentId: postId
      } as any);
    } catch (err) {
      console.warn('Comment persist deferred:', err);
    }

    return comment;
  }

  private mapDatabaseRowToPost(d: any, userReactions: Record<string, any> = {}, deviceId?: string): BanterPost {
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

    const parsedMedia = parseMediaFromContent(d.content || '');
    const cleanContent = parsedMedia.cleanContent || d.content;
    const mediaUrls = d.media_urls || (parsedMedia.mediaUrls.length > 0 ? parsedMedia.mediaUrls : (d.image_url ? [d.image_url] : []));
    const mediaType = d.media_type || (parsedMedia.mediaType !== 'NONE' ? parsedMedia.mediaType : (mediaUrls.length > 1 ? 'DUAL_IMAGE' : (mediaUrls.length === 1 ? 'IMAGE' : 'NONE')));
    const pollId = d.poll_id || null;
    let poll = pollId ? this.getPollById(pollId) : undefined;
    if (poll && deviceId && !poll.voters[deviceId]) {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(`egerscore_poll_voted_${poll.id}`) : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const opt = typeof parsed === 'number' ? parsed : parsed?.optionId;
          if (opt !== undefined) {
            poll = { ...poll, voters: { ...poll.voters, [deviceId]: Number(opt) } };
          }
        } catch {}
      }
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
      content: cleanContent,
      mediaUrls,
      mediaType,
      imageUrl: mediaUrls[0] || d.image_url,
      sourceType: d.source_type || 'user',
      likesCount: d.likes_count ?? d.reaction_fire_count ?? 0,
      repliesCount: d.comment_count ?? d.replies_count ?? 0,
      repostsCount: d.repost_count ?? d.reposts_count ?? 0,
      reactionFireCount: d.reaction_fire_count ?? 0,
      reactionClownCount: d.reaction_clown_count ?? 0,
      reactionSkullCount: d.reaction_skull_count ?? 0,
      commentCount: d.comment_count ?? 0,
      repostCount: d.repost_count ?? d.reposts_count ?? 0,
      isTrending: Boolean(d.is_trending),
      impressions: d.impressions_count ?? d.impressions ?? 0,
      impressionsCount: d.impressions_count ?? d.impressions ?? 0,
      viewsCount: d.views_count ?? 1,
      pollId,
      poll: poll || undefined,
      taggedTeamId: d.tagged_team_id || null,
      taggedTeamName: d.tagged_team_name || null,
      uid: d.uid || null,
      authorDeviceId: d.author_device_id || d.device_id || null,
      author_device_id: d.author_device_id || d.device_id || null,
      createdAt: d.created_at,
      userReactions: userReactions[d.id] || {}
    };
  }

  public async fetchPostsForTeam(teamId?: string, teamName?: string, deviceId?: string): Promise<BanterPost[]> {
    const devId = this.getAuthoritativeDeviceId(deviceId);
    const userReactions = getStoredItem<Record<string, Record<ReactionType, boolean>>>(
      STORAGE_KEYS.USER_REACTIONS,
      {}
    );

    try {
      let query = supabase
        .from('banter_posts')
        .select('*')
        .eq('status', 'active');

      if (teamName) {
        query = query.or(`content.ilike.%@${teamName}%,content.ilike.%${teamName}%,author_handle.ilike.%${teamName}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        const posts = data.map((d: any) => this.mapDatabaseRowToPost(d, userReactions, devId));
        return posts;
      }
    } catch {
      // offline fallback
    }

    const all = this.localPosts;
    const normalizedName = (teamName || '').toLowerCase();
    return all.filter(p => {
      if (teamName && p.content.toLowerCase().includes(`@${normalizedName}`)) return true;
      if (teamName && p.content.toLowerCase().includes(normalizedName)) return true;
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

    const all = this.localPosts;
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

  private mapDatabaseRowToPoll(p: any, deviceId?: string): BanterPoll {
    const voters = typeof p.voters === 'string' ? JSON.parse(p.voters) : (p.voters || {});
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`egerscore_poll_voted_${p.id}`);
        const permanentId = deviceId || localStorage.getItem('esn_permanent_device_id') || localStorage.getItem('esn_device_id');
        if (stored && permanentId && voters[permanentId] === undefined) {
          const parsed = JSON.parse(stored);
          const optId = typeof parsed === 'number' ? parsed : parsed?.optionId;
          if (optId !== undefined) {
            voters[permanentId] = Number(optId);
          }
        }
        const votedMapRaw = localStorage.getItem('egerscore_voted_polls');
        if (votedMapRaw && permanentId && voters[permanentId] === undefined) {
          const votedMap = JSON.parse(votedMapRaw);
          if (votedMap && votedMap[p.id] !== undefined) {
            voters[permanentId] = Number(votedMap[p.id]);
          }
        }
      }
    } catch {}
    const totalVotes = Math.max(p.total_votes || 0, Object.keys(voters).length);
    return {
      id: p.id,
      postId: p.post_id,
      question: p.question,
      options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options,
      totalVotes,
      voters,
      expiresAt: p.expires_at
    };
  }
}

export const banterService = new BanterService();
