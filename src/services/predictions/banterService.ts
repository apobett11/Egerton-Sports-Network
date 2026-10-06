import { supabase } from '../../lib/supabase';
import { BANTER_CONFIG, STORAGE_KEYS } from '../../lib/predictions/constants';
import { getStoredItem, setStoredItem } from '../../lib/predictions/utils';
import { anonymousIdentityService } from './anonymousIdentityService';
import {
  LAW_FC_TABLE_SCREENSHOT,
  SPARTANS_TACTICAL_SCREENSHOT,
  TOP_SCORER_SCREENSHOT,
} from '../../lib/predictions/banterScreenshots';
import type { BanterPost, BanterComment, ReactionType, BanterFilterType } from '../../types/predictions';

const FAN_HANDLE_POOL = [
  'Tatton Ultras',
  'Pavilion Connoisseur',
  'Ruiru VAR Official',
  'Engineering Hooligan',
  'Medical FC Scout',
  'Library Stand Ultras',
  'Hostel 4 Loyalist',
  'Njoro Pep Guardiola',
  'Sub-Camp Striker',
  'Grassroots Pundit',
  'Gate 2 Fanatic',
  'Yellow Card Collector',
  'Sunday League Ramos',
  'Zero Clean Sheets',
  'Tactical Visionary',
  'Muddy Boots Pundit',
  'BCOM Accountant',
  'Law School Advocate',
  'Campus Oracle',
  'Offside Flag Raiser',
];

export function getRandomFanHandle(): string {
  const name = FAN_HANDLE_POOL[Math.floor(Math.random() * FAN_HANDLE_POOL.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${name} #${num}`;
}

// 20 High-engagement community & Troll Football style banter posts for Egerton Premier League
const SEEDED_BANTER_POSTS: BanterPost[] = [
  // 1. Trending #1 (Highest impressions: 96)
  {
    id: 'post-seed-01',
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Egerton Troll Football',
    authorType: 'user',
    content: 'Law FC conceded 20 GOALS IN ONE WEEKEND?! Are their defenders practicing social distancing or conducting a census in the 6-yard box?! 😭😭 Even the goalkeeper was seen checking the student portal during corner kicks 💀💀 #LawFC #EPL',
    imageUrl: LAW_FC_TABLE_SCREENSHOT,
    sourceType: 'seed',
    reactionFireCount: 25,
    reactionClownCount: 9,
    reactionSkullCount: 12,
    commentCount: 5,
    repostCount: 14,
    impressionsCount: 96,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },

  // 2. Trending #2 (Impressions: 92)
  {
    id: 'post-seed-02',
    matchId: 'f0000000-0000-4000-8000-000000000001',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Super Eagles',
      awayTeamName: 'BCOM FC',
      matchday: 7,
    },
    authorHandle: 'Pavilion Connoisseur',
    authorType: 'user',
    content: '@SuperEagles arrived at Pitch A with JBL party speakers blasting the UCL anthem only to get dismantled 4-0 by @BCOM_FC before halftime 😭😭 At least the warm-up warm-down photos look cinematic bro 🔥 #CampusDerby #EgertonFootball',
    sourceType: 'seed',
    reactionFireCount: 23,
    reactionClownCount: 7,
    reactionSkullCount: 10,
    commentCount: 4,
    repostCount: 12,
    impressionsCount: 92,
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },

  // 3. Trending #3 (Impressions: 89)
  {
    id: 'post-seed-03',
    matchId: 'f0000000-0000-4000-8000-000000000005',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Legends FC',
      awayTeamName: 'Spartans United',
      matchday: 7,
    },
    authorHandle: 'Njoro Wind Whisperer',
    authorType: 'user',
    content: '@SpartansUtd defensive masterclass: 0 set-piece goals conceded all month because all 11 players stand inside the goal net. Jose Mourinho is shedding tears of pure joy watching this terrorism on Pitch C 😭💀 #ParkTheBus #EPL',
    imageUrl: SPARTANS_TACTICAL_SCREENSHOT,
    sourceType: 'seed',
    reactionFireCount: 22,
    reactionClownCount: 11,
    reactionSkullCount: 8,
    commentCount: 4,
    repostCount: 11,
    impressionsCount: 89,
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
  },

  // 4. Trending #4 (Impressions: 85)
  {
    id: 'post-seed-04',
    matchId: 'f0000000-0000-4000-8000-000000000002',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Santos FC',
      awayTeamName: 'Mighty Blacks',
      matchday: 7,
    },
    authorHandle: 'Tatton Ultras #42',
    authorType: 'user',
    content: 'Watching @SantosFC defend corners is an extreme psychological thriller. No marking, pure faith and vibes. The goalkeeper jumped, grabbed the crossbar, and the ball bounced off his back into the net 😭😭 #CleanSheetWhere #TrollFootball',
    sourceType: 'seed',
    reactionFireCount: 20,
    reactionClownCount: 8,
    reactionSkullCount: 9,
    commentCount: 3,
    repostCount: 10,
    impressionsCount: 85,
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
  },

  // 5. Trending #5 (Impressions: 82)
  {
    id: 'post-seed-05',
    matchId: 'f0000000-0000-4000-8000-000000000001',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Super Eagles',
      awayTeamName: 'BCOM FC',
      matchday: 7,
    },
    authorHandle: 'Campus Oracle #19',
    authorType: 'user',
    content: 'M. Ochieng has 8 goals this season for @SuperEagles while the rest of his squad looks like they met in the cafeteria 15 minutes before kickoff. Free this man from campus slavery before his knees give out 💀🏃‍♂️ #TopScorer #EgertonFootball',
    imageUrl: TOP_SCORER_SCREENSHOT,
    sourceType: 'seed',
    reactionFireCount: 19,
    reactionClownCount: 6,
    reactionSkullCount: 7,
    commentCount: 3,
    repostCount: 9,
    impressionsCount: 82,
    createdAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
  },

  // 6. Impressions: 76
  {
    id: 'post-seed-06',
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Medical Labベンター',
    authorType: 'user',
    content: '@MedFC had 3 players sub themselves off after 12 minutes because they diagnosed their own mild hamstring tightness and refused to risk their clinical rotations on Monday 🏥😭 Pure medical intelligence! #MedFC #EPL',
    sourceType: 'seed',
    reactionFireCount: 16,
    reactionClownCount: 5,
    reactionSkullCount: 4,
    commentCount: 2,
    repostCount: 6,
    impressionsCount: 76,
    createdAt: new Date(Date.now() - 250 * 60 * 1000).toISOString(),
  },

  // 7. Impressions: 71
  {
    id: 'post-seed-07',
    matchId: 'f0000000-0000-4000-8000-000000000003',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Blue Blazers',
      awayTeamName: 'Law FC',
      matchday: 7,
    },
    authorHandle: 'Engineering Hooligan',
    authorType: 'user',
    content: 'Blue Blazers midfield spent the entire second half walking. Bro K. Otieno was walking so casually I thought he was waiting for the campus shuttle at gate 2 😭😭 #BlueBlazers #TattonPark',
    sourceType: 'seed',
    reactionFireCount: 15,
    reactionClownCount: 4,
    reactionSkullCount: 5,
    commentCount: 2,
    repostCount: 5,
    impressionsCount: 71,
    createdAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
  },

  // 8. Impressions: 66
  {
    id: 'post-seed-08',
    matchId: 'f0000000-0000-4000-8000-000000000002',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Santos FC',
      awayTeamName: 'Mighty Blacks',
      matchday: 7,
    },
    authorHandle: 'Ruiru VAR Analyst',
    authorType: 'user',
    content: 'Mighty Blacks centre back made a no-look pass straight to the referee who was wearing a lime green vest. Bro really thought the ref was on the overlap 😭😭😭 #MightyBlacks #EPL',
    sourceType: 'seed',
    reactionFireCount: 14,
    reactionClownCount: 5,
    reactionSkullCount: 3,
    commentCount: 1,
    repostCount: 4,
    impressionsCount: 66,
    createdAt: new Date(Date.now() - 410 * 60 * 1000).toISOString(),
  },

  // 9. Impressions: 61
  {
    id: 'post-seed-09',
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'EgerSports Desk',
    authorType: 'journalist',
    authorBadge: 'JOURNALIST',
    content: 'REPORT: 88% of prediction slips backed Legends FC to cruise on Saturday. The match ended 0-0 with 3 yellow cards, 1 brawl over an offside throw-in, and zero shots on goal. The consensus in shambles 📊🔥 #PredictionSlip #EPL',
    sourceType: 'journalist',
    reactionFireCount: 13,
    reactionClownCount: 2,
    reactionSkullCount: 3,
    commentCount: 2,
    repostCount: 4,
    impressionsCount: 61,
    createdAt: new Date(Date.now() - 500 * 60 * 1000).toISOString(),
  },

  // 10. Impressions: 56
  {
    id: 'post-seed-10',
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Law School Advocate #01',
    authorType: 'user',
    content: 'To everyone making fun of @LawFC conceding 20 goals: Section 4 of the Egerton Sports Code states football is about participation, not goal arithmetic. We remain undefeated in spirit and courtroom arguments ⚖️😭 #LawFC #JusticeForLaw',
    sourceType: 'seed',
    reactionFireCount: 11,
    reactionClownCount: 4,
    reactionSkullCount: 4,
    commentCount: 1,
    repostCount: 3,
    impressionsCount: 56,
    createdAt: new Date(Date.now() - 610 * 60 * 1000).toISOString(),
  },

  // 11. Impressions: 51
  {
    id: 'post-seed-11',
    matchId: 'f0000000-0000-4000-8000-000000000005',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Legends FC',
      awayTeamName: 'Celtics FC',
      matchday: 7,
    },
    authorHandle: 'Sunday League Ramos',
    authorType: 'user',
    content: 'Celtics FC striker screamed "CHECK VAR" for 6 minutes after his goal was ruled out. My brother in Christ, the referee is using an analog stopwatch from 2004 and the linesman has one shoe untied 😭😭 #CelticsFC #NoVAR',
    sourceType: 'seed',
    reactionFireCount: 10,
    reactionClownCount: 3,
    reactionSkullCount: 3,
    commentCount: 1,
    repostCount: 3,
    impressionsCount: 51,
    createdAt: new Date(Date.now() - 720 * 60 * 1000).toISOString(),
  },

  // 12. Impressions: 47
  {
    id: 'post-seed-12',
    matchId: 'f0000000-0000-4000-8000-000000000004',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'FASS Elites',
      awayTeamName: 'Spartans United',
      matchday: 7,
    },
    authorHandle: 'Library Stand Ultras',
    authorType: 'user',
    content: 'FASS Elites celebrating winning a corner kick like they scored in a Champions League final while being 5-0 down is the elite campus mental health coping mechanism we all need 😭😭 #FASSElites #CampusLife',
    sourceType: 'seed',
    reactionFireCount: 9,
    reactionClownCount: 2,
    reactionSkullCount: 2,
    commentCount: 0,
    repostCount: 2,
    impressionsCount: 47,
    createdAt: new Date(Date.now() - 840 * 60 * 1000).toISOString(),
  },

  // 13. Impressions: 43
  {
    id: 'post-seed-13',
    matchId: 'f0000000-0000-4000-8000-000000000011',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'BCOM FC',
      awayTeamName: 'Legends FC',
      matchday: 8,
    },
    authorHandle: 'BCOM FC Coach',
    authorType: 'journalist',
    authorBadge: 'COACH',
    content: 'Tactical reminder for Matchday 8: We do not play hero football. Quick transitions, keep the fullbacks wide, and avoid unnecessary shots from 40 yards into the hostel parking lot. Stay disciplined.',
    sourceType: 'journalist',
    reactionFireCount: 9,
    reactionClownCount: 1,
    reactionSkullCount: 1,
    commentCount: 1,
    repostCount: 2,
    impressionsCount: 43,
    createdAt: new Date(Date.now() - 960 * 60 * 1000).toISOString(),
  },

  // 14. Impressions: 39
  {
    id: 'post-seed-14',
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Njoro Pep Guardiola',
    authorType: 'user',
    content: 'The Njoro 4PM crosswind on Pitch B is the best defender in campus football. Striker took a penalty and the wind curved it backwards toward the center circle. Newton is rolling in his grave 💨⚽ #NjoroPhysics #EPL',
    sourceType: 'seed',
    reactionFireCount: 8,
    reactionClownCount: 2,
    reactionSkullCount: 2,
    commentCount: 1,
    repostCount: 2,
    impressionsCount: 39,
    createdAt: new Date(Date.now() - 1100 * 60 * 1000).toISOString(),
  },

  // 15. Impressions: 36
  {
    id: 'post-seed-15',
    matchId: 'f0000000-0000-4000-8000-000000000011',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'BCOM FC',
      awayTeamName: 'Legends FC',
      matchday: 8,
    },
    authorHandle: 'Legends FC Coach',
    authorType: 'journalist',
    authorBadge: 'COACH',
    content: '16 points from 6 matches. Top of the table. To the fans chanting quadruple: one game at a time. The derby against BCOM on Sunday is our biggest test yet. Humility first.',
    sourceType: 'journalist',
    reactionFireCount: 8,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 1,
    repostCount: 2,
    impressionsCount: 36,
    createdAt: new Date(Date.now() - 1240 * 60 * 1000).toISOString(),
  },

  // 16. Impressions: 31
  {
    id: 'post-seed-16',
    matchId: 'f0000000-0000-4000-8000-000000000006',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Giants FC',
      awayTeamName: 'Wazito FC',
      matchday: 7,
    },
    authorHandle: 'Yellow Card Collector',
    authorType: 'user',
    content: 'Giants FC centre back received a yellow card before kickoff because he slid into the opposition captain during the coin toss. That is pure captain mentality right there 😤💀 #GiantsFC #PhysicalGame',
    sourceType: 'seed',
    reactionFireCount: 6,
    reactionClownCount: 2,
    reactionSkullCount: 1,
    commentCount: 0,
    repostCount: 1,
    impressionsCount: 31,
    createdAt: new Date(Date.now() - 1380 * 60 * 1000).toISOString(),
  },

  // 17. Impressions: 27
  {
    id: 'post-seed-17',
    matchId: 'f0000000-0000-4000-8000-000000000006',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Giants FC',
      awayTeamName: 'Wazito FC',
      matchday: 7,
    },
    authorHandle: 'Hostel 4 Ultras',
    authorType: 'user',
    content: 'Wazito FC goalkeeper got distracted by someone carrying mandazis behind the goal post and conceded a 35-yard daisy cutter. Food is temporary, -3 points is forever bro 😭🥐 #WazitoFC #EPL',
    sourceType: 'seed',
    reactionFireCount: 5,
    reactionClownCount: 1,
    reactionSkullCount: 1,
    commentCount: 0,
    repostCount: 1,
    impressionsCount: 27,
    createdAt: new Date(Date.now() - 1490 * 60 * 1000).toISOString(),
  },

  // 18. Impressions: 23
  {
    id: 'post-seed-18',
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Offside Flag Raiser',
    authorType: 'user',
    content: 'Shoutout to the five fans supporting Five Stars FC in the torrential Njoro rain with one tiny umbrella between all of them. True loyalty right there 🌧️☔ #FiveStarsFC #RealFans',
    sourceType: 'seed',
    reactionFireCount: 4,
    reactionClownCount: 1,
    reactionSkullCount: 1,
    commentCount: 0,
    repostCount: 1,
    impressionsCount: 23,
    createdAt: new Date(Date.now() - 1580 * 60 * 1000).toISOString(),
  },

  // 19. Impressions: 19
  {
    id: 'post-seed-19',
    matchId: 'f0000000-0000-4000-8000-000000000012',
    leagueId: '11111111-1111-1111-1111-111111111111',
    matchContext: {
      homeTeamName: 'Santos FC',
      awayTeamName: 'Blue Blazers',
      matchday: 8,
    },
    authorHandle: 'BCOM Accountant #07',
    authorType: 'user',
    content: 'Matchday 8 math: If @LegendsFC draw and @SantosFC win by 3 goals, Santos take #1 on goal differential. Scientific calculator is already loaded in the pocket for Sunday 📊🔥 #StatNerd #EPL',
    sourceType: 'seed',
    reactionFireCount: 4,
    reactionClownCount: 0,
    reactionSkullCount: 1,
    commentCount: 0,
    repostCount: 1,
    impressionsCount: 19,
    createdAt: new Date(Date.now() - 1650 * 60 * 1000).toISOString(),
  },

  // 20. Impressions: 15
  {
    id: 'post-seed-20',
    matchId: null,
    leagueId: '11111111-1111-1111-1111-111111111111',
    authorHandle: 'Muddy Boots Pundit',
    authorType: 'user',
    content: 'Pitch A has officially been declared a certified rice paddy field after today\'s shower. Boots taped with electrical tape, let the mud derby commence! ⚽🌧️ #EgertonFootball',
    sourceType: 'seed',
    reactionFireCount: 3,
    reactionClownCount: 1,
    reactionSkullCount: 0,
    commentCount: 0,
    repostCount: 0,
    impressionsCount: 15,
    createdAt: new Date(Date.now() - 1720 * 60 * 1000).toISOString(),
  },
];

// Seeded replies for trending posts & popular takes
const SEEDED_BANTER_COMMENTS: Record<string, BanterComment[]> = {
  'post-seed-01': [
    {
      id: 'c-seed-01-1',
      postId: 'post-seed-01',
      authorHandle: 'Ruiru VAR Official',
      authorType: 'user',
      content: 'Rumour has it their captain asked the referee for a judicial injunction to stop the second half 😭⚖️',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-01-2',
      postId: 'post-seed-01',
      authorHandle: 'Tatton Ultras #42',
      authorType: 'user',
      content: '20 goals in 2 days is not campus football, that is a semester tuition fee calculation 💀',
      createdAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-01-3',
      postId: 'post-seed-01',
      authorHandle: 'Law School Advocate #01',
      authorType: 'user',
      content: 'We are appealing this fixture before the Dean of Students. Gross negligence by the back four 😭',
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-01-4',
      postId: 'post-seed-01',
      authorHandle: 'Pavilion Connoisseur',
      authorType: 'user',
      content: 'Their goalkeeper made more saves picking balls out of the nearby bushes than on the pitch 😭',
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-01-5',
      postId: 'post-seed-01',
      authorHandle: 'BCOM Accountant #07',
      authorType: 'user',
      content: 'Audited the match data: a goal conceded every 9 minutes. Consistent execution at least 💀',
      createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-02': [
    {
      id: 'c-seed-02-1',
      postId: 'post-seed-02',
      authorHandle: 'Njoro Pep Guardiola',
      authorType: 'user',
      content: 'Warmup playlist: 10/10. Jersey quality: 10/10. Football played: -5/10 💀',
      createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-02-2',
      postId: 'post-seed-02',
      authorHandle: 'Sub-Camp Striker',
      authorType: 'user',
      content: 'The DJ on their JBL party speaker had better delivery than their entire midfield 😭',
      createdAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-02-3',
      postId: 'post-seed-02',
      authorHandle: 'Engineering Hooligan',
      authorType: 'user',
      content: 'They spent 45 minutes adjusting socks and 0 minutes tracking the opposition winger 🤡',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-02-4',
      postId: 'post-seed-02',
      authorHandle: 'BCOM Supporter',
      authorType: 'user',
      content: 'Accountants do not joke around when balancing the goal difference! 💼🔥',
      createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-03': [
    {
      id: 'c-seed-03-1',
      postId: 'post-seed-03',
      authorHandle: 'Hostel 4 Ultras',
      authorType: 'user',
      content: 'Even the Spartans coach was standing in the 18-yard box defending 😭',
      createdAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-03-2',
      postId: 'post-seed-03',
      authorHandle: 'Legends FC Fan',
      authorType: 'user',
      content: '90 minutes of 11 guys kicking the ball into Tatton maize plantation. Football was murdered today 💀',
      createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-03-3',
      postId: 'post-seed-03',
      authorHandle: 'Campus Oracle #19',
      authorType: 'user',
      content: 'Terrorism wins titles my friend. 1 shot, 0 on target, 1 penalty won, 3 points secured 🔥',
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-03-4',
      postId: 'post-seed-03',
      authorHandle: 'Muddy Boots Pundit',
      authorType: 'user',
      content: 'Their keeper didn’t even get his kit dirty, just stood behind 10 centre backs 🤡',
      createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-04': [
    {
      id: 'c-seed-04-1',
      postId: 'post-seed-04',
      authorHandle: 'Zero Clean Sheets',
      authorType: 'user',
      content: 'The crossbar did more defending than their two centre backs combined 💀',
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-04-2',
      postId: 'post-seed-04',
      authorHandle: 'Library Stand Ultras',
      authorType: 'user',
      content: 'Coach was chewing roasted maize furiously on the touchline like it was tactical guidance 😭🌽',
      createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-04-3',
      postId: 'post-seed-04',
      authorHandle: 'Santos FC Ultras',
      authorType: 'user',
      content: 'Delete this immediately admin. We are holding a prayer vigil before Matchday 8 🙏',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-05': [
    {
      id: 'c-seed-05-1',
      postId: 'post-seed-05',
      authorHandle: 'Doctor Striker #10',
      authorType: 'user',
      content: 'His spine is genuinely broken from carrying 10 grown men every Saturday 😭🚑',
      createdAt: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-05-2',
      postId: 'post-seed-05',
      authorHandle: 'Egerton Fabrizio',
      authorType: 'user',
      content: 'Sources confirm M. Ochieng has submitted a transfer request for a plate of fries and soda 🍟',
      createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-05-3',
      postId: 'post-seed-05',
      authorHandle: 'Yellow Card Collector',
      authorType: 'user',
      content: 'Opponents literally foul him 14 times per match because no one else can dribble 💀',
      createdAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-06': [
    {
      id: 'c-seed-06-1',
      postId: 'post-seed-06',
      authorHandle: 'Campus Oracle #19',
      authorType: 'user',
      content: 'Subbed off to go revise pharmacology notes in the ambulance 😭💀',
      createdAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-06-2',
      postId: 'post-seed-06',
      authorHandle: 'Pavilion Connoisseur',
      authorType: 'user',
      content: 'The first football team where the subs bench looks like a clinical ward 🚑',
      createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-07': [
    {
      id: 'c-seed-07-1',
      postId: 'post-seed-07',
      authorHandle: 'Sunday League Ramos',
      authorType: 'user',
      content: 'Distance covered: 800m. Steps on Apple watch: 1,200. Match played: 90 mins 💀',
      createdAt: new Date(Date.now() - 260 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-07-2',
      postId: 'post-seed-07',
      authorHandle: 'Tatton Ultras #42',
      authorType: 'user',
      content: 'Man came to hit his daily fitness step goal, not compete in Division 1 🤡',
      createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-08': [
    {
      id: 'c-seed-08-1',
      postId: 'post-seed-08',
      authorHandle: 'Offside Flag Raiser',
      authorType: 'user',
      content: 'The referee had better positioning than their left winger to be fair 💀',
      createdAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-09': [
    {
      id: 'c-seed-09-1',
      postId: 'post-seed-09',
      authorHandle: 'BCOM Accountant #07',
      authorType: 'user',
      content: 'My 6-match slip was burned by minute 22. Never trusting campus derbies again 💀',
      createdAt: new Date(Date.now() - 420 * 60 * 1000).toISOString(),
    },
    {
      id: 'c-seed-09-2',
      postId: 'post-seed-09',
      authorHandle: 'Egerton Troll Football',
      authorType: 'user',
      content: 'Consensus predictor: "Easy home win". Pitch C grass: "Hold my drink" 😭',
      createdAt: new Date(Date.now() - 350 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-10': [
    {
      id: 'c-seed-10-1',
      postId: 'post-seed-10',
      authorHandle: 'Engineering Hooligan',
      authorType: 'user',
      content: 'Undefeated in spirit, -24 goal difference on paper bro 💀💀',
      createdAt: new Date(Date.now() - 510 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-11': [
    {
      id: 'c-seed-11-1',
      postId: 'post-seed-11',
      authorHandle: 'Pavilion Connoisseur',
      authorType: 'user',
      content: 'VAR check complete: The linesman’s watch battery died 30 minutes ago bro 💀',
      createdAt: new Date(Date.now() - 610 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-13': [
    {
      id: 'c-seed-13-1',
      postId: 'post-seed-13',
      authorHandle: 'BCOM Accountant #07',
      authorType: 'user',
      content: 'Tell the #9 striker specifically coach! He damaged two solar lights last week 😭💀',
      createdAt: new Date(Date.now() - 820 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-14': [
    {
      id: 'c-seed-14-1',
      postId: 'post-seed-14',
      authorHandle: 'Tatton Ultras #42',
      authorType: 'user',
      content: 'Aerodynamics > Tactical formations any day at Egerton 😭',
      createdAt: new Date(Date.now() - 950 * 60 * 1000).toISOString(),
    },
  ],
  'post-seed-15': [
    {
      id: 'c-seed-15-1',
      postId: 'post-seed-15',
      authorHandle: 'Hostel 4 Ultras',
      authorType: 'user',
      content: 'Humility? Coach we are cooking them 3-0 on Sunday, book the celebration cake! 🔥🏆',
      createdAt: new Date(Date.now() - 1100 * 60 * 1000).toISOString(),
    },
  ],
};

function isCoachPost(post: BanterPost): boolean {
  const badge = (post.authorBadge || '').toLowerCase();
  const handle = post.authorHandle.toLowerCase();
  return badge.includes('coach') || handle.includes('coach');
}

function applyBanterFilter(posts: BanterPost[], filter: BanterFilterType | 'hot' | 'latest' | 'matchday'): BanterPost[] {
  let all = [...posts];
  if (filter === 'trending' || filter === 'hot') {
    // Sort highest impressions to the top for trending/hot
    all.sort((a, b) => (b.impressionsCount || 0) - (a.impressionsCount || 0));
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
  private viewedPostIds = new Set<string>();

  constructor() {
    this.localPosts = getStoredItem<BanterPost[]>('egerscore_local_banter_posts', []);
  }

  public async fetchPosts(
    filter: BanterFilterType | 'hot' | 'latest' | 'matchday',
    matchId?: string | null,
    limit = 25
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
        query = query.order('impressions_count', { ascending: false });
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
          imageUrl: d.image_url || undefined,
          sourceType: d.source_type || 'user',
          reactionFireCount: d.reaction_fire_count || 0,
          reactionClownCount: d.reaction_clown_count || 0,
          reactionSkullCount: d.reaction_skull_count || 0,
          commentCount: d.comment_count || 0,
          repostCount: d.repost_count || Math.floor(((d.reaction_fire_count || 0) + 4) * 0.5),
          impressionsCount: d.impressions_count || Math.min(99, Math.max(12, ((d.reaction_fire_count || 0) + (d.comment_count || 0)) * 2 + 15)),
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

    // Combine local user posts + seeded community trolls
    let all = [...this.localPosts, ...SEEDED_BANTER_POSTS];
    if (matchId) {
      all = all.filter(p => p.matchId === matchId);
    }

    // Apply user reaction flags and consistent impressions (10 - 100)
    all = all.map(p => ({
      ...p,
      repostCount: p.repostCount ?? Math.floor((p.reactionFireCount + 4) * 0.5),
      impressionsCount: p.impressionsCount ?? Math.min(99, Math.max(12, (p.reactionFireCount + p.reactionClownCount + p.commentCount) * 2 + 15)),
      userReactions: userReactions[p.id] || {}
    }));

    return applyBanterFilter(all, filter).slice(0, limit);
  }

  public recordImpression(postId: string): void {
    if (this.viewedPostIds.has(postId)) return;
    this.viewedPostIds.add(postId);

    // Optimistically update in-memory post impressions
    const targetPost = this.localPosts.find(p => p.id === postId) || SEEDED_BANTER_POSTS.find(p => p.id === postId);
    if (targetPost) {
      targetPost.impressionsCount = Math.min(99, (targetPost.impressionsCount || 10) + 1);
      setStoredItem('egerscore_local_banter_posts', this.localPosts);
    }

    // Persist to backend asynchronously
    this.persistImpressionToBackend(postId).catch(() => {});
  }

  private async persistImpressionToBackend(postId: string): Promise<void> {
    try {
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      await supabase.rpc('record_banter_impression', {
        p_post_id: postId,
        p_device_id: devRowId || null,
      });
    } catch {
      // offline safe
    }
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

    // Use random tweeting fan handle while retaining device ID
    const randomHandle = getRandomFanHandle();

    const newPost: BanterPost = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}`,
      matchId: matchId || null,
      leagueId: '11111111-1111-1111-1111-111111111111',
      matchContext,
      authorHandle: randomHandle,
      authorType: 'user',
      content: trimmed,
      imageUrl: imageUrl || undefined,
      sourceType: 'user',
      reactionFireCount: 0,
      reactionClownCount: 0,
      reactionSkullCount: 0,
      commentCount: 0,
      repostCount: 0,
      impressionsCount: 14,
      viewsCount: 14,
      isMine: true,
      createdAt: new Date().toISOString(),
      userReactions: {}
    };

    // Optimistically update local array immediately
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

    // Update local state immediately
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

    // Persist to backend asynchronously
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

    const seeded = SEEDED_BANTER_COMMENTS[postId] || [];
    const localComments = getStoredItem<BanterComment[]>(`egerscore_comments_${postId}`, seeded);
    return localComments;
  }

  public async addComment(postId: string, content: string): Promise<BanterComment> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Comment cannot be empty.');
    if (trimmed.length > BANTER_CONFIG.MAX_COMMENT_CHARS) {
      throw new Error(`Comment must be under ${BANTER_CONFIG.MAX_COMMENT_CHARS} characters.`);
    }

    const randomHandle = getRandomFanHandle();
    const comment: BanterComment = {
      id: `comment-${Date.now()}`,
      postId,
      authorHandle: randomHandle,
      authorType: 'user',
      content: trimmed,
      createdAt: new Date().toISOString()
    };

    const seeded = SEEDED_BANTER_COMMENTS[postId] || [];
    const existing = getStoredItem<BanterComment[]>(`egerscore_comments_${postId}`, seeded);
    setStoredItem(`egerscore_comments_${postId}`, [...existing, comment]);

    // Update commentCount on target post optimistically
    const targetPost = this.localPosts.find(p => p.id === postId) || SEEDED_BANTER_POSTS.find(p => p.id === postId);
    if (targetPost) {
      targetPost.commentCount = (targetPost.commentCount || 0) + 1;
      setStoredItem('egerscore_local_banter_posts', this.localPosts);
    }

    // Background push to database
    try {
      const devRowId = await anonymousIdentityService.ensureDeviceRegistered();
      const creds = await import('../../lib/deviceCopies').then((mod) => mod.getDeviceCredentials());
      if (devRowId && creds.secret) {
        await supabase.rpc('post_device_banter_comment', {
          p_device_id: devRowId,
          p_secret: creds.secret,
          p_post_id: postId,
          p_author_handle: comment.authorHandle,
          p_content: comment.content,
        });
      }
    } catch {
      // offline safe
    }

    return comment;
  }
}

export const banterService = new BanterService();
