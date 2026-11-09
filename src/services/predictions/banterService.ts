import { fictionalBanterPosts, fictionalComments, usesLocalFictionalSlate } from '../../lib/predictions/fictionalSlate';
import { supabase } from '../../lib/predictions/banterSupabase';
import { BANTER_CONFIG, STORAGE_KEYS } from '../../lib/predictions/constants';
import { getStoredItem, setStoredItem } from '../../lib/predictions/utils';
import { anonymousIdentityService } from './anonymousIdentityService';
import { getOrCreateDeviceIdentity } from '../../utils/deviceIdentity';
import { getDeviceCredentials } from '../../lib/deviceCopies';
import { getActiveSessionProfile, getOrCreatePermanentDeviceId } from '../../utils/sessionIdentity';
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

export const SEEDED_BANTER_POSTS: BanterPost[] = [
  // 1. League pause official circular
  {
    id: 'b1000000-0000-4000-8000-000000000001',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000001',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'EgerSports Desk',
    authorName: 'Egerton Sports Desk',
    authorType: 'journalist',
    authorBadge: 'SECRETARIAT',
    content: 'OFFICIAL: Egerton Sports Directorate confirms Matchday 13 remains paused while Pavilion Pitch B leveling and Main Stadium drainage works continue. No fixtures will be played until grounds committee certifies readiness. #EgertonSportsNetwork #EPLPause',
    sourceType: 'journalist',
    mediaType: 'IMAGE',
    mediaUrls: [LEAGUE_PAUSE_OFFICIAL_NOTICE_SCREENSHOT],
    imageUrl: LEAGUE_PAUSE_OFFICIAL_NOTICE_SCREENSHOT,
    reactionFireCount: 84,
    reactionClownCount: 5,
    reactionSkullCount: 12,
    commentCount: 3,
    repliesCount: 3,
    repostCount: 24,
    impressionsCount: 3200,
    createdAt: '2026-10-26T10:00:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000101',
    parentId: 'b1000000-0000-4000-8000-000000000001',
    rootId: 'b1000000-0000-4000-8000-000000000001',
    depth: 1,
    authorHandle: 'Tatton Ultras #42',
    authorName: 'Tatton Ultras',
    authorType: 'user',
    content: 'Player safety is first. Last rainy Saturday at Pavilion was water polo not football. Good call by the directorate.',
    sourceType: 'user',
    reactionFireCount: 19,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-10-26T10:45:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000102',
    parentId: 'b1000000-0000-4000-8000-000000000001',
    rootId: 'b1000000-0000-4000-8000-000000000001',
    depth: 1,
    authorHandle: 'SuperEagles Diehard #09',
    authorName: 'SuperEagles Diehard',
    authorType: 'user',
    content: 'Why now though?! We had 11 wins in 12 games and 41 goals scored! Chasing pack needed oxygen and they got a ventilator 😂',
    sourceType: 'user',
    reactionFireCount: 31,
    reactionClownCount: 4,
    reactionSkullCount: 6,
    commentCount: 0,
    createdAt: '2026-10-26T11:15:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000103',
    parentId: 'b1000000-0000-4000-8000-000000000001',
    rootId: 'b1000000-0000-4000-8000-000000000001',
    depth: 1,
    authorHandle: 'Legends Army #10',
    authorName: 'Legends Army',
    authorType: 'user',
    content: 'Ventilator for who? We have 26 points and we beat your local rivals. MD13 resumption will humble the birds.',
    sourceType: 'user',
    reactionFireCount: 22,
    reactionClownCount: 2,
    reactionSkullCount: 1,
    commentCount: 0,
    createdAt: '2026-10-26T12:00:00.000Z',
  },

  // 2. Title race dominance + Poll
  {
    id: 'b1000000-0000-4000-8000-000000000002',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000002',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Campus Oracle #19',
    authorName: 'Campus Oracle',
    authorType: 'user',
    authorBadge: 'ANALYST',
    content: '41 goals scored by Super Eagles vs 39 goals conceded by Mighty Blacks... The goal difference gap (+32 vs -30) is 62 goals across 12 games! Has there EVER been a more lopsided league in Egerton history? 💀🔥 #EPL #EgertonStandings #CampusBanter',
    sourceType: 'seed',
    mediaType: 'IMAGE',
    mediaUrls: [SUPER_EAGLES_RUNAWAY_LEADER_SCREENSHOT],
    imageUrl: SUPER_EAGLES_RUNAWAY_LEADER_SCREENSHOT,
    pollId: 'poll-pause-01',
    poll: POLL_PAUSE_RESUMPTION,
    reactionFireCount: 112,
    reactionClownCount: 18,
    reactionSkullCount: 45,
    commentCount: 3,
    repliesCount: 3,
    repostCount: 38,
    impressionsCount: 4850,
    createdAt: '2026-10-27T14:30:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000201',
    parentId: 'b1000000-0000-4000-8000-000000000002',
    rootId: 'b1000000-0000-4000-8000-000000000002',
    depth: 1,
    authorHandle: 'Mighty Blacks Faithful #03',
    authorName: 'Mighty Blacks Faithful',
    authorType: 'user',
    content: 'Admin delete this immediately. We are already dealing with internal club issues, no need to broadcast our suffering 😭',
    sourceType: 'user',
    reactionFireCount: 14,
    reactionClownCount: 9,
    reactionSkullCount: 28,
    commentCount: 0,
    createdAt: '2026-10-27T15:10:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000202',
    parentId: 'b1000000-0000-4000-8000-000000000002',
    rootId: 'b1000000-0000-4000-8000-000000000002',
    depth: 1,
    authorHandle: 'Varsity Scout #07',
    authorName: 'Varsity Scout',
    authorType: 'user',
    content: 'Mighty Blacks midfield is leaving their back four exposed. Distance between lines is 35m! Any through ball is a 1-on-1.',
    sourceType: 'user',
    reactionFireCount: 26,
    reactionClownCount: 0,
    reactionSkullCount: 2,
    commentCount: 0,
    createdAt: '2026-10-27T16:00:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000203',
    parentId: 'b1000000-0000-4000-8000-000000000002',
    rootId: 'b1000000-0000-4000-8000-000000000002',
    depth: 1,
    authorHandle: 'BCOM Sniper #11',
    authorName: 'BCOM Sniper',
    authorType: 'user',
    content: 'Super Eagles play direct on the wings. When they face a compact low block on Pitch C they will drop points.',
    sourceType: 'user',
    reactionFireCount: 18,
    reactionClownCount: 3,
    reactionSkullCount: 1,
    commentCount: 0,
    createdAt: '2026-10-27T16:45:00.000Z',
  },

  // 3. Referee audit + Poll
  {
    id: 'b1000000-0000-4000-8000-000000000003',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000003',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Ref Watch Egerton',
    authorName: 'Ref Watch Egerton',
    authorType: 'journalist',
    authorBadge: 'OFFICIALS',
    content: 'Mid-season referee audit 📝: Referee Jark leads university with 14 penalties. Ref Lamoh flashed 38 cards without losing control once. Ref Chalo still disallowing any goal within 5 yards of the keeper. Who has been your best ref? #RefWatch #OfficiatingAudit',
    sourceType: 'journalist',
    mediaType: 'IMAGE',
    mediaUrls: [REFEREE_JARK_CONTROVERSY_SCREENSHOT],
    imageUrl: REFEREE_JARK_CONTROVERSY_SCREENSHOT,
    pollId: 'poll-ref-02',
    poll: POLL_OFFICIATING,
    reactionFireCount: 67,
    reactionClownCount: 8,
    reactionSkullCount: 14,
    commentCount: 3,
    repliesCount: 3,
    repostCount: 19,
    impressionsCount: 2750,
    createdAt: '2026-10-28T16:15:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000301',
    parentId: 'b1000000-0000-4000-8000-000000000003',
    rootId: 'b1000000-0000-4000-8000-000000000003',
    depth: 1,
    authorHandle: 'Celtics Captain #04',
    authorName: 'Celtics Captain',
    authorType: 'user',
    content: 'Lamoh is the only ref who explains decisions to captains calmly. The rest blow whistles like security on curfew.',
    sourceType: 'user',
    reactionFireCount: 34,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-10-28T17:00:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000302',
    parentId: 'b1000000-0000-4000-8000-000000000003',
    rootId: 'b1000000-0000-4000-8000-000000000003',
    depth: 1,
    authorHandle: 'Pavilion Pundit #21',
    authorName: 'Pavilion Pundit',
    authorType: 'user',
    content: 'Jark gave two penalties to BCOM against us in 15 mins! If you trip over your own boots at the box he points to the spot!',
    sourceType: 'user',
    reactionFireCount: 28,
    reactionClownCount: 7,
    reactionSkullCount: 12,
    commentCount: 0,
    createdAt: '2026-10-28T17:40:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000303',
    parentId: 'b1000000-0000-4000-8000-000000000003',
    rootId: 'b1000000-0000-4000-8000-000000000003',
    depth: 1,
    authorHandle: 'Ref Watch Egerton',
    authorName: 'Ref Watch Egerton',
    authorType: 'journalist',
    content: 'Both fouls were clear studs-up on match video. Referee committee confirmed Jark was 100% justified.',
    sourceType: 'journalist',
    reactionFireCount: 15,
    reactionClownCount: 2,
    reactionSkullCount: 1,
    commentCount: 0,
    createdAt: '2026-10-28T18:15:00.000Z',
  },

  // 4. Legends Coach Tactical statement
  {
    id: 'b1000000-0000-4000-8000-000000000004',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000004',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Legends FC Coach',
    authorName: 'Coach Eric (Legends)',
    authorType: 'coach',
    authorBadge: 'Legends FC Coach',
    content: 'Coach Eric (Legends FC): We are using this pause effectively. Double tactical sessions at Pavilion gymnasium. 26 points puts us right within striking distance. We will not concede easy goals when MD13 resumes. #LegendsFC #CoachNotes #TitleRace',
    sourceType: 'journalist',
    mediaType: 'NONE',
    taggedTeamName: 'Legends Fc',
    reactionFireCount: 42,
    reactionClownCount: 2,
    reactionSkullCount: 1,
    commentCount: 2,
    repliesCount: 2,
    repostCount: 11,
    impressionsCount: 1890,
    createdAt: '2026-10-29T11:00:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000401',
    parentId: 'b1000000-0000-4000-8000-000000000004',
    rootId: 'b1000000-0000-4000-8000-000000000004',
    depth: 1,
    authorHandle: 'Tatton Striker #14',
    authorName: 'Tatton Striker',
    authorType: 'user',
    content: 'Coach please start Kamau on the right wing, he creates twice as many chances from wide areas than through the middle.',
    sourceType: 'user',
    reactionFireCount: 16,
    reactionClownCount: 0,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-10-29T11:45:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000402',
    parentId: 'b1000000-0000-4000-8000-000000000004',
    rootId: 'b1000000-0000-4000-8000-000000000004',
    depth: 1,
    authorHandle: 'Legends FC Coach',
    authorName: 'Coach Eric (Legends)',
    authorType: 'coach',
    authorBadge: 'Legends FC Coach',
    content: 'Noted. Tactical versatility is what will win the title in the second leg.',
    sourceType: 'journalist',
    reactionFireCount: 24,
    reactionClownCount: 0,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-10-29T12:30:00.000Z',
  },

  // 5. Mighty Blacks meme
  {
    id: 'b1000000-0000-4000-8000-000000000005',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000005',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Njoro Troll Football',
    authorName: 'Njoro Troll Football',
    authorType: 'user',
    content: 'Mighty Blacks defense: 39 goals shipped in 12 games. Even HELB gives students more security than this backline. Coach needs to park two varsity buses in front of goal when MD13 kicks off! 🚌🛑 #EPLBanter #MightyBlacks #SieveDefense',
    sourceType: 'seed',
    mediaType: 'IMAGE',
    mediaUrls: [MIGHTY_BLACKS_DEFENSE_COLLAPSE_SCREENSHOT],
    imageUrl: MIGHTY_BLACKS_DEFENSE_COLLAPSE_SCREENSHOT,
    reactionFireCount: 98,
    reactionClownCount: 29,
    reactionSkullCount: 53,
    commentCount: 2,
    repliesCount: 2,
    repostCount: 41,
    impressionsCount: 5400,
    createdAt: '2026-10-30T18:45:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000501',
    parentId: 'b1000000-0000-4000-8000-000000000005',
    rootId: 'b1000000-0000-4000-8000-000000000005',
    depth: 1,
    authorHandle: 'Black Panther #99',
    authorName: 'Black Panther',
    authorType: 'user',
    content: 'Leave HELB out of our football miseries please 😭 We conceded 5 against Super Eagles, we are numb to the pain.',
    sourceType: 'user',
    reactionFireCount: 15,
    reactionClownCount: 11,
    reactionSkullCount: 33,
    commentCount: 0,
    createdAt: '2026-10-30T19:20:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000502',
    parentId: 'b1000000-0000-4000-8000-000000000005',
    rootId: 'b1000000-0000-4000-8000-000000000005',
    depth: 1,
    authorHandle: 'Blue Blazers Fan #16',
    authorName: 'Blue Blazers Fan',
    authorType: 'user',
    content: 'At least you have 2 wins. Santos are 11th with only 2 wins and spent the whole pre-season hyping their signings!',
    sourceType: 'user',
    reactionFireCount: 27,
    reactionClownCount: 5,
    reactionSkullCount: 12,
    commentCount: 0,
    createdAt: '2026-10-30T20:00:00.000Z',
  },

  // 6. Golden Boot leader
  {
    id: 'b1000000-0000-4000-8000-000000000006',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000006',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'EgerSports Desk',
    authorName: 'Egerton Sports Desk',
    authorType: 'journalist',
    authorBadge: 'JOURNALIST',
    content: 'M. Ochieng has 14 goals in 12 games for Super Eagles before the league paused. On pace to shatter the all-time Egerton single-season scoring record (19 goals). Is he currently the best university baller in Nakuru County? 👟⚽🔥 #GoldenBoot #EPLTopScorer',
    sourceType: 'journalist',
    mediaType: 'IMAGE',
    mediaUrls: [TOP_SCORER_SCREENSHOT],
    imageUrl: TOP_SCORER_SCREENSHOT,
    taggedTeamName: 'Super eagles',
    reactionFireCount: 88,
    reactionClownCount: 4,
    reactionSkullCount: 9,
    commentCount: 2,
    repliesCount: 2,
    repostCount: 28,
    impressionsCount: 3600,
    createdAt: '2026-10-30T21:10:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000601',
    parentId: 'b1000000-0000-4000-8000-000000000006',
    rootId: 'b1000000-0000-4000-8000-000000000006',
    depth: 1,
    authorHandle: 'Varsity Striker #04',
    authorName: 'Varsity Striker',
    authorType: 'user',
    content: 'He has blistering pace on the counter. Once center backs push past halfway, nobody in this league can catch him.',
    sourceType: 'user',
    reactionFireCount: 29,
    reactionClownCount: 0,
    reactionSkullCount: 1,
    commentCount: 0,
    createdAt: '2026-10-30T21:45:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000602',
    parentId: 'b1000000-0000-4000-8000-000000000006',
    rootId: 'b1000000-0000-4000-8000-000000000006',
    depth: 1,
    authorHandle: 'Wazito Hardcore #08',
    authorName: 'Wazito Hardcore',
    authorType: 'user',
    content: 'Wait until he plays Wazito on Pitch A. Our captain will give him 90 minutes of strict man-marking.',
    sourceType: 'user',
    reactionFireCount: 21,
    reactionClownCount: 2,
    reactionSkullCount: 3,
    commentCount: 0,
    createdAt: '2026-10-30T22:30:00.000Z',
  },

  // 7. Championship banter + Law FC + Poll
  {
    id: 'b1000000-0000-4000-8000-000000000007',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000007',
    depth: 0,
    matchId: null,
    leagueId: '22222222-2222-2222-2222-222222222222',
    authorHandle: 'Campus Oracle #19',
    authorName: 'Campus Oracle',
    authorType: 'user',
    authorBadge: 'ANALYST',
    content: 'Championship race: Talanta FC (25 pts) and Ajax FC (22 pts) are playing champagne football! Meanwhile Law FC are 10th with 4 points and currently drafting an injunction against the referee offside flag ⚖️📂😂 #ChampionshipBanter #LawFC #TalantaFC',
    sourceType: 'user',
    mediaType: 'IMAGE',
    mediaUrls: [LAW_FC_TABLE_SCREENSHOT],
    imageUrl: LAW_FC_TABLE_SCREENSHOT,
    pollId: 'poll-champ-03',
    poll: POLL_CHAMPIONSHIP_PROMOTION,
    reactionFireCount: 73,
    reactionClownCount: 19,
    reactionSkullCount: 32,
    commentCount: 2,
    repliesCount: 2,
    repostCount: 22,
    impressionsCount: 3100,
    createdAt: '2026-10-31T15:20:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000701',
    parentId: 'b1000000-0000-4000-8000-000000000007',
    rootId: 'b1000000-0000-4000-8000-000000000007',
    depth: 1,
    authorHandle: 'Law Campus Rep #01',
    authorName: 'Law Campus Rep',
    authorType: 'user',
    content: 'We are not filing an injunction, but that 84th min penalty against Ajax was an egregious injustice! We demand VAR!',
    sourceType: 'user',
    reactionFireCount: 16,
    reactionClownCount: 8,
    reactionSkullCount: 20,
    commentCount: 0,
    createdAt: '2026-10-31T16:00:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000702',
    parentId: 'b1000000-0000-4000-8000-000000000007',
    rootId: 'b1000000-0000-4000-8000-000000000007',
    depth: 1,
    authorHandle: 'Talanta Supporter #20',
    authorName: 'Talanta Supporter',
    authorType: 'user',
    content: 'Lawyers should stick to moot courts! Talanta are getting promoted to EPL next season, book the date!',
    sourceType: 'user',
    reactionFireCount: 28,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-10-31T16:50:00.000Z',
  },

  // 8. Match of the season Q&A + Poll
  {
    id: 'b1000000-0000-4000-8000-000000000008',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000008',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Tatton Ultras #42',
    authorName: 'Tatton Ultras',
    authorType: 'user',
    authorBadge: 'FAN REP',
    content: 'QUESTION FOR THE FANS 🎤: What has been your match of the season so far before this pause? Best goal, wildest derby, or biggest heartbreak? Drop your take below 👇 #EgertonFootball #CampusDebate #MatchOfTheSeason',
    sourceType: 'user',
    mediaType: 'NONE',
    pollId: 'poll-qa-04',
    poll: POLL_SURPRISE_TEAM,
    reactionFireCount: 55,
    reactionClownCount: 3,
    reactionSkullCount: 4,
    commentCount: 3,
    repliesCount: 3,
    repostCount: 14,
    impressionsCount: 2150,
    createdAt: '2026-11-01T08:30:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000801',
    parentId: 'b1000000-0000-4000-8000-000000000008',
    rootId: 'b1000000-0000-4000-8000-000000000008',
    depth: 1,
    authorHandle: 'BCOM Sniper #11',
    authorName: 'BCOM Sniper',
    authorType: 'user',
    content: 'BCOM 3-2 Legends! The rain started in the 70th min, Pitch A was electric, and we scored the winner in the 93rd min!',
    sourceType: 'user',
    reactionFireCount: 32,
    reactionClownCount: 0,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-11-01T09:00:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000802',
    parentId: 'b1000000-0000-4000-8000-000000000008',
    rootId: 'b1000000-0000-4000-8000-000000000008',
    depth: 1,
    authorHandle: 'SuperEagles Diehard #09',
    authorName: 'SuperEagles Diehard',
    authorType: 'user',
    content: 'Super Eagles 4-1 Wazito. Pure football perfection. 4 different scorers and our keeper saved a penalty.',
    sourceType: 'user',
    reactionFireCount: 26,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-11-01T09:30:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000803',
    parentId: 'b1000000-0000-4000-8000-000000000008',
    rootId: 'b1000000-0000-4000-8000-000000000008',
    depth: 1,
    authorHandle: 'Santos Side Rep #27',
    authorName: 'Santos Side Rep',
    authorType: 'user',
    content: 'Santos 2-1 Mighty Blacks. The only weekend this semester where our hostel was in a celebratory mood.',
    sourceType: 'user',
    reactionFireCount: 18,
    reactionClownCount: 4,
    reactionSkullCount: 5,
    commentCount: 0,
    createdAt: '2026-11-01T09:50:00.000Z',
  },

  // 9. Super Eagles Coach statement
  {
    id: 'b1000000-0000-4000-8000-000000000009',
    parentId: null,
    rootId: 'b1000000-0000-4000-8000-000000000009',
    depth: 0,
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Super Eagles Coach',
    authorName: 'Coach Super Eagles',
    authorType: 'coach',
    authorBadge: 'Super Eagles Coach',
    content: 'Coach Super Eagles: To our fans: thank you for the energy in the first 12 rounds. 33 points is a solid start, but trophies are won in December, not October. We are staying sharp in training and respecting every opponent when MD13 resumes. #EagleMentality',
    sourceType: 'journalist',
    mediaType: 'NONE',
    taggedTeamName: 'Super eagles',
    reactionFireCount: 61,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 2,
    repliesCount: 2,
    repostCount: 16,
    impressionsCount: 2300,
    createdAt: '2026-11-01T10:15:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000901',
    parentId: 'b1000000-0000-4000-8000-000000000009',
    rootId: 'b1000000-0000-4000-8000-000000000009',
    depth: 1,
    authorHandle: 'Campus Scout #15',
    authorName: 'Campus Scout',
    authorType: 'user',
    content: 'Humility from the league leaders. That is why they are 7 points clear at the top.',
    sourceType: 'user',
    reactionFireCount: 19,
    reactionClownCount: 0,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-11-01T10:45:00.000Z',
  },
  {
    id: 'b1000000-0000-4000-8000-000000000902',
    parentId: 'b1000000-0000-4000-8000-000000000009',
    rootId: 'b1000000-0000-4000-8000-000000000009',
    depth: 1,
    authorHandle: 'Tatton Ultras #42',
    authorName: 'Tatton Ultras',
    authorType: 'user',
    content: 'Bring on MD13! We are ready to fill the sidelines at Pitch A!',
    sourceType: 'user',
    reactionFireCount: 23,
    reactionClownCount: 0,
    reactionSkullCount: 0,
    commentCount: 0,
    createdAt: '2026-11-01T11:20:00.000Z',
  },
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
    all.sort(compareTrending);
  } else if (filter === 'top') {
    all.sort((a, b) => getPostEngagement(b) - getPostEngagement(a));
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
  // Only the trendings will have the top space (> 1,500 and <= 1,940).
  // The normal posts and messages will have the normal range between 500 and 1,500.
  if (all.length > 0) {
    const trendingLeader = [...all].sort(compareTrending)[0];
    if (trendingLeader) {
      all.forEach((p) => {
        p.isTrending = p.id === trendingLeader.id;
        const isMsg = Boolean(p.parentId || (p.rootId && p.rootId !== p.id));
        if (p.isTrending && !isMsg) {
          // Top space: strictly above 1,500 and capped at 1,940
          if (!p.impressionsCount || p.impressionsCount <= 1500) {
            p.impressionsCount = 1500 + Math.min(440, 220 + ((p.reactionFireCount || 0) * 2));
          } else if (p.impressionsCount > 1940) {
            p.impressionsCount = 1940;
          }
        } else {
          // Normal posts and messages: range between 500 and 1,500 (never exceeding 1,500)
          if (p.impressionsCount && p.impressionsCount >= 18 && p.impressionsCount <= 45) {
            // Preserve initial fresh seed
          } else if (!p.impressionsCount || p.impressionsCount > 1500) {
            p.impressionsCount = Math.min(1500, Math.max(500, 500 + ((p.reactionFireCount || 0) * 8) + ((p.commentCount || 0) * 12)));
          } else if (p.impressionsCount < 500) {
            p.impressionsCount = Math.min(1500, Math.max(500, 500 + (p.impressionsCount % 500)));
          }
        }
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

  public async getPostById(postId: string): Promise<BanterPost | null> {
    const matchesId = (p: BanterPost) =>
      p.id === postId ||
      p.id.endsWith(postId) ||
      p.id.replace(/^post-seed-/, '') === postId ||
      (postId.length >= 6 && p.id.startsWith(postId));

    const post = this.localPosts.find(matchesId)
      || SEEDED_BANTER_POSTS.find(matchesId)
      || (fictionalBanterPosts() as BanterPost[]).find(matchesId);

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

    const seededPosts = SEEDED_BANTER_POSTS;

    try {
      let query = supabase
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

      query = query.range(offset, offset + limit - 1);
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const pollIds = data.map((d: any) => d.poll_id).filter(Boolean);
        if (pollIds.length > 0) {
          try {
            const { data: pollsData } = await supabase.from('banter_polls').select('*').in('id', pollIds);
            if (pollsData && pollsData.length > 0) {
              pollsData.forEach((p: any) => {
                this.localPolls[p.id] = this.mapDatabaseRowToPoll(p);
              });
            }
          } catch {}
        }
        const posts: BanterPost[] = data
          .filter((d: any) => !isTestPost(d))
          .map((d: any) => this.mapDatabaseRowToPost(d, userReactions));

        // Merge local posts and seeded posts that are not in database yet
        const unSyncedLocal = this.localPosts.filter(
          (lp) => !lp.parentId && !posts.some((p) => p.id === lp.id) && !isTestPost(lp)
        );
        const unSyncedSeeded = seededPosts.filter(
          (sp) => (!sp.parentId || sp.depth === 0) && !posts.some((p) => p.id === sp.id) && !isTestPost(sp)
        );
        const combined = [...unSyncedLocal, ...posts, ...unSyncedSeeded];

        const filtered = applyBanterFilter(combined, filter);
        if (filtered.length > 0) {
          return filtered.slice(0, limit);
        }
      }
    } catch {
      // offline fallback
    }

    // Combine local user root posts + seeded root posts
    const allRoot = [...this.localPosts, ...seededPosts].filter(p => (!p.parentId || p.depth === 0) && !isTestPost(p));
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
        .from('banter_posts')
        .select('*')
        .or(`root_id.eq.${postId},parent_id.eq.${postId}`)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data && data.length > 0) {
        replies = data
          .filter((d: any) => !isTestPost(d))
          .map((d: any) => this.mapDatabaseRowToPost(d, userReactions));
      }
    } catch {
      // offline safe
    }

    // Include seeded and local replies directly attached to this post
    const seededReplies = SEEDED_BANTER_POSTS
      .filter((p) => p.parentId === postId && !replies.some((r) => r.id === p.id) && !isTestPost(p))
      .map((p) => ({
        ...p,
        userReactions: userReactions[p.id] || {}
      }));

    const localReplies = this.localPosts
      .filter((p) => p.parentId === postId && !replies.some((r) => r.id === p.id) && !isTestPost(p))
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
    if (!opts.parentId && (now - this.lastPostTimestamp < BANTER_CONFIG.RATE_LIMIT_COOLDOWN_MS)) {
      // Allow rapid posting in test environments or automated flows
      const isTest = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || (window as any).__E2E_TEST__);
      if (!isTest) {
        throw new Error('Please wait a few seconds before posting another hot take.');
      }
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
    const postId = opts.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}`);

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
      pollId = opts.poll.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `poll-${Date.now()}`);
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

    // Persist to Supabase
    try {
      await this.persistPostToBackend(newPost, pollObj);
    } catch (err) {
      console.warn('Backend banter post persist deferred:', err);
    }

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

      const targetPoll = poll || post.poll;
      const pollId = targetPoll?.id || post.pollId || null;

      const payload: Record<string, any> = {
        root_id: (post.rootId && post.rootId !== post.id) ? post.rootId : (post.parentId || null),
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
        status: 'active',
        poll_id: pollId
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
    const seededMatch = SEEDED_BANTER_POSTS.find((p) => p.id === d.id);
    let authorType = seededMatch?.authorType || d.author_type || 'user';
    let authorBadge = seededMatch?.authorBadge || d.author_badge;
    const authorHandle = seededMatch?.authorHandle || d.author_handle || 'Fanatic';

    if (
      authorType === 'coach' ||
      (authorBadge || '').toLowerCase().includes('coach') ||
      authorHandle.toLowerCase().includes('coach')
    ) {
      authorType = 'coach';
      authorBadge = formatCoachTag(seededMatch?.taggedTeamName || d.tagged_team_name, authorBadge);
    }

    const mediaUrls = seededMatch?.mediaUrls || d.media_urls || (d.image_url ? [d.image_url] : []);
    const mediaType = seededMatch?.mediaType || d.media_type || (mediaUrls.length > 0 ? 'IMAGE' : 'NONE');
    const pollId = seededMatch?.pollId || d.poll_id || null;
    const poll = seededMatch?.poll || (pollId ? this.getPollById(pollId) : undefined);

    return {
      id: d.id,
      parentId: d.parent_id || null,
      rootId: d.root_id || d.id,
      depth: d.depth || 0,
      userId: d.user_id || d.device_id,
      matchId: d.match_id,
      leagueId: d.league_id,
      authorHandle,
      authorName: seededMatch?.authorName || d.author_name || authorHandle.split(' #')[0],
      authorAvatar: d.author_avatar,
      authorType,
      authorBadge,
      content: d.content,
      mediaUrls,
      mediaType,
      imageUrl: seededMatch?.imageUrl || mediaUrls[0] || d.image_url,
      sourceType: seededMatch?.sourceType || d.source_type || 'user',
      likesCount: d.likes_count || d.reaction_fire_count || 0,
      repliesCount: d.replies_count || d.comment_count || 0,
      repostsCount: d.reposts_count || Math.floor(((d.reaction_fire_count || 0) + 4) * 1.3),
      reactionFireCount: d.reaction_fire_count || 0,
      reactionClownCount: d.reaction_clown_count || 0,
      reactionSkullCount: d.reaction_skull_count || 0,
      commentCount: d.comment_count || 0,
      repostCount: d.repost_count || Math.floor(((d.reaction_fire_count || 0) + 4) * 1.3),
      isTrending: Boolean(d.is_trending || seededMatch?.isTrending),
      impressions: d.impressions ?? d.impressions_count ?? Math.min(1500, Math.max(500, 500 + ((d.reaction_fire_count || 0) * 8))),
      impressionsCount: d.impressions ?? d.impressions_count ?? Math.min(1500, Math.max(500, 500 + ((d.reaction_fire_count || 0) * 8))),
      pollId,
      poll: poll || undefined,
      taggedTeamId: seededMatch?.taggedTeamId || d.tagged_team_id || null,
      taggedTeamName: seededMatch?.taggedTeamName || d.tagged_team_name || null,
      uid: d.uid || null,
      authorDeviceId: d.author_device_id || d.device_id || null,
      author_device_id: d.author_device_id || d.device_id || null,
      createdAt: d.created_at,
      userReactions: userReactions[d.id] || {}
    };
  }

  public async fetchPostsForTeam(teamId?: string, teamName?: string): Promise<BanterPost[]> {
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
      } else {
        query = query.or('tagged_team_name.not.is.null,content.ilike.%@%');
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
      if (teamId && p.taggedTeamId && p.taggedTeamId === teamId) return true;
      if (teamName && p.taggedTeamName && p.taggedTeamName.toLowerCase().includes(normalizedName)) return true;
      if (teamName && p.content.toLowerCase().includes(`@${normalizedName}`)) return true;
      if (!teamId && !teamName) return Boolean(p.taggedTeamId || p.taggedTeamName || p.content.includes('@'));
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
    const voters = typeof p.voters === 'string' ? JSON.parse(p.voters) : (p.voters || {});
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`egerscore_poll_voted_${p.id}`);
        const permanentId = localStorage.getItem('esn_permanent_device_id') || localStorage.getItem('esn_device_id');
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
