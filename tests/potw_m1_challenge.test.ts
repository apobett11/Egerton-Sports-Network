/**
 * Milestone 1 Empirical Challenge & Stress-Test Suite
 * Target: src/services/potwService.ts
 * Role: Challenger 1 (critic, specialist)
 */

import assert from 'node:assert';
import {
  EPL_COMP_ID,
  CHAMP_COMP_ID,
  ESN_DOMAIN,
  getLeagueSlug,
  buildWhatsAppShareUrl,
  buildMondayMysteryTeaser,
  buildMondayMysteryTeaserUrl,
  getWeeklyCycleStatus,
  getActiveBallotCandidates,
  hasDeviceVoted,
  castVote,
} from '../src/services/potwService';
import { supabase } from '../src/lib/supabase';
import type { PotwCandidate } from '../src/types/potw';

console.log('===============================================================');
console.log('CHALLENGER 1: EMPIRICAL STRESS TEST SUITE — POTW SERVICE (M1)');
console.log('===============================================================\n');

let passCount = 0;
let failCount = 0;
const findings: string[] = [];

function recordPass(testName: string) {
  passCount++;
  console.log(`  [PASS] ${testName}`);
}

function recordFail(testName: string, error: any) {
  failCount++;
  console.error(`  [FAIL] ${testName}`);
  console.error(`         Error: ${error?.message || error}`);
  findings.push(`${testName}: ${error?.message || error}`);
}

// ============================================================================
// SUITE 1: Candidate Condensation (getActiveBallotCandidates)
// ============================================================================
console.log('--- SUITE 1: Candidate Condensation Logic ---');

async function testCandidateCondensation() {
  const originalFrom = supabase.from;

  try {
    // Scenario 1.1: Player nominated twice in one weekend across two fixtures
    const mockNominations = [
      {
        id: 'nom-1',
        fixture_id: 'fix-1',
        player_id: 'player-101',
        team_id: 'team-alpha',
        competition_id: EPL_COMP_ID,
        referee_id: 'ref-1',
        created_at: '2026-09-12T16:00:00Z',
      },
      {
        id: 'nom-2',
        fixture_id: 'fix-2',
        player_id: 'player-101',
        team_id: 'team-alpha',
        competition_id: EPL_COMP_ID,
        referee_id: 'ref-2',
        created_at: '2026-09-13T16:00:00Z',
      },
    ];

    const mockFixtures = [
      {
        id: 'fix-1',
        matchday: 5,
        scheduled_time: '2026-09-12T14:00:00Z',
        score_home: 2,
        score_away: 1,
        home_team_id: 'team-alpha',
        away_team_id: 'team-beta',
      },
      {
        id: 'fix-2',
        matchday: 5,
        scheduled_time: '2026-09-13T14:00:00Z',
        score_home: 3,
        score_away: 0,
        home_team_id: 'team-alpha',
        away_team_id: 'team-gamma',
      },
    ];

    const mockPlayers = [
      { id: 'player-101', jersey_number: 10, position: 'FWD', profile_id: 'prof-101' },
    ];

    const mockTeams = [
      { id: 'team-alpha', name: 'Egerton FC', logo_url: 'http://egerton.png' },
      { id: 'team-beta', name: 'Njoro All-Stars', logo_url: 'http://njoro.png' },
      { id: 'team-gamma', name: 'Nakuru FC', logo_url: 'http://nakuru.png' },
    ];

    const mockProfiles = [
      { id: 'prof-101', first_name: 'John', last_name: 'Doe', avatar_url: null },
      { id: 'ref-1', first_name: 'Referee', last_name: 'One', avatar_url: null },
      { id: 'ref-2', first_name: 'Referee', last_name: 'Two', avatar_url: null },
    ];

    (supabase as any).from = (table: string) => {
      return {
        select: (cols: string) => ({
          eq: (col: string, val: any) => ({
            order: (oCol: string, opts: any) => Promise.resolve({ data: mockNominations, error: null }),
            maybeSingle: () => Promise.resolve({ data: { id: EPL_COMP_ID, name: 'Egerton Premier League' }, error: null }),
          }),
          in: (col: string, vals: any[]) => {
            if (table === 'fixtures') return Promise.resolve({ data: mockFixtures, error: null });
            if (table === 'players') return Promise.resolve({ data: mockPlayers, error: null });
            if (table === 'teams') return Promise.resolve({ data: mockTeams, error: null });
            if (table === 'profiles') return Promise.resolve({ data: mockProfiles, error: null });
            return Promise.resolve({ data: [], error: null });
          },
        }),
      };
    };

    const candidates = await getActiveBallotCandidates(EPL_COMP_ID);

    try {
      assert.strictEqual(candidates.length, 1, 'Multiple nominations for player-101 must condense to exactly 1 candidate');
      recordPass('Condensation: Exactly 1 entry produced for dual-nominated player');
    } catch (e) {
      recordFail('Condensation: Exactly 1 entry produced for dual-nominated player', e);
    }

    try {
      const c = candidates[0];
      assert.strictEqual(c.player_id, 'player-101');
      assert.strictEqual(c.player_name, 'John Doe');
      assert.strictEqual(c.team_name, 'Egerton FC');
      assert(
        c.match_details.includes('Egerton FC 2 - 1 Njoro All-Stars') &&
        c.match_details.includes('Egerton FC 3 - 0 Nakuru FC'),
        `Combined match details must include both fixtures. Got: "${c?.match_details}"`
      );
      assert(c.match_details.includes('•'), 'Match details should be separated by delimiter "•"');
      recordPass('Condensation: Match details consolidated across both weekend fixtures');
    } catch (e) {
      recordFail('Condensation: Match details consolidated across both weekend fixtures', e);
    }

    // Scenario 1.2: Duplicate nomination for the SAME fixture does not duplicate text
    const mockDuplicateNoms = [
      ...mockNominations,
      {
        id: 'nom-3',
        fixture_id: 'fix-1', // Same fixture again
        player_id: 'player-101',
        team_id: 'team-alpha',
        competition_id: EPL_COMP_ID,
        referee_id: 'ref-1',
        created_at: '2026-09-12T17:00:00Z',
      },
    ];

    (supabase as any).from = (table: string) => {
      return {
        select: (cols: string) => ({
          eq: (col: string, val: any) => ({
            order: () => Promise.resolve({ data: mockDuplicateNoms, error: null }),
            maybeSingle: () => Promise.resolve({ data: { id: EPL_COMP_ID, name: 'Egerton Premier League' }, error: null }),
          }),
          in: () => {
            if (table === 'fixtures') return Promise.resolve({ data: mockFixtures, error: null });
            if (table === 'players') return Promise.resolve({ data: mockPlayers, error: null });
            if (table === 'teams') return Promise.resolve({ data: mockTeams, error: null });
            if (table === 'profiles') return Promise.resolve({ data: mockProfiles, error: null });
            return Promise.resolve({ data: [], error: null });
          },
        }),
      };
    };

    const dedupCandidates = await getActiveBallotCandidates(EPL_COMP_ID);
    try {
      assert.strictEqual(dedupCandidates.length, 1);
      const occurrences = dedupCandidates[0].match_details.split('Egerton FC 2 - 1 Njoro All-Stars').length - 1;
      assert.strictEqual(occurrences, 1, 'Match details should not repeat the same match text twice');
      recordPass('Condensation: Deduplication prevents repeating the same fixture string');
    } catch (e) {
      recordFail('Condensation: Deduplication prevents repeating the same fixture string', e);
    }

    // Scenario 1.3: Empty nominations
    (supabase as any).from = () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
        in: () => Promise.resolve({ data: [], error: null }),
      }),
    });

    const emptyCandidates = await getActiveBallotCandidates(EPL_COMP_ID);
    try {
      assert.strictEqual(emptyCandidates.length, 0);
      recordPass('Condensation: Handles empty nominations cleanly without error');
    } catch (e) {
      recordFail('Condensation: Handles empty nominations cleanly without error', e);
    }

  } finally {
    (supabase as any).from = originalFrom;
  }
}

// ============================================================================
// SUITE 2: 1 Device = 1 Vote Rule (hasDeviceVoted & castVote)
// ============================================================================
console.log('\n--- SUITE 2: 1 Device = 1 Vote Rule Enforcement ---');

async function testDeviceVotingRule() {
  const originalFrom = supabase.from;
  const originalRpc = supabase.rpc;

  try {
    const votesDb = new Map<string, any>();
    const makeKey = (dev: string, comp: string, mw: number) => `${dev}::${comp}::${mw}`;

    // Mock RPC and table operations
    (supabase as any).rpc = async (fn: string, params: any) => {
      if (fn === 'has_device_voted_potw') {
        const key = makeKey(params.p_device_id, params.p_competition_id, params.p_matchweek);
        return { data: votesDb.has(key), error: null };
      }
      return { data: null, error: { message: 'Unknown RPC' } };
    };

    (supabase as any).from = (table: string) => {
      if (table === 'player_of_the_week_votes') {
        return {
          select: () => ({
            eq: (col1: string, val1: any) => ({
              eq: (col2: string, val2: any) => ({
                eq: (col3: string, val3: any) => ({
                  maybeSingle: async () => {
                    const key = makeKey(val1, val2, val3);
                    if (votesDb.has(key)) return { data: votesDb.get(key), error: null };
                    return { data: null, error: null };
                  },
                }),
              }),
            }),
          }),
          insert: async (row: any) => {
            const key = makeKey(row.device_id, row.competition_id, row.matchweek);
            if (votesDb.has(key)) {
              return { error: { code: '23505', message: 'duplicate key value violates unique constraint "uq_device_competition_matchweek"' } };
            }
            votesDb.set(key, { id: 'vote-uuid', ...row });
            return { error: null };
          },
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) };
    };

    const device1 = '11111111-aaaa-bbbb-cccc-111111111111';
    const playerA = 'player-aaa';
    const playerB = 'player-bbb';
    const matchweek = 1;

    // Test 2.1: First vote succeeds
    const vote1 = await castVote({
      deviceId: device1,
      playerId: playerA,
      competitionId: EPL_COMP_ID,
      matchweek,
    });

    try {
      assert.strictEqual(vote1.success, true);
      assert.strictEqual(vote1.error, undefined);
      recordPass('1-Device-1-Vote: First vote successfully accepted');
    } catch (e) {
      recordFail('1-Device-1-Vote: First vote successfully accepted', e);
    }

    // Test 2.2: hasDeviceVoted correctly reports true
    const hasVoted = await hasDeviceVoted(device1, EPL_COMP_ID, matchweek);
    try {
      assert.strictEqual(hasVoted, true);
      recordPass('1-Device-1-Vote: hasDeviceVoted returns true after vote cast');
    } catch (e) {
      recordFail('1-Device-1-Vote: hasDeviceVoted returns true after vote cast', e);
    }

    // Test 2.3: Second vote for same device, same league, same matchweek is REJECTED
    const vote2 = await castVote({
      deviceId: device1,
      playerId: playerB,
      competitionId: EPL_COMP_ID,
      matchweek,
    });

    try {
      assert.strictEqual(vote2.success, false);
      assert(
        vote2.error?.includes('already cast a vote'),
        `Error message must indicate duplicate vote. Got: "${vote2.error}"`
      );
      recordPass('1-Device-1-Vote: Second vote attempt correctly blocked with user notice');
    } catch (e) {
      recordFail('1-Device-1-Vote: Second vote attempt correctly blocked with user notice', e);
    }

    // Test 2.4: Same device voting in DIFFERENT competition in the same matchweek is ALLOWED
    const voteChamp = await castVote({
      deviceId: device1,
      playerId: playerB,
      competitionId: CHAMP_COMP_ID, // Championship league
      matchweek,
    });

    try {
      assert.strictEqual(voteChamp.success, true);
      recordPass('1-Device-1-Vote: Independent league separation allows voting in Championship too');
    } catch (e) {
      recordFail('1-Device-1-Vote: Independent league separation allows voting in Championship too', e);
    }

    // Test 2.5: Same device voting in DIFFERENT matchweek in the same competition is ALLOWED
    const voteMw2 = await castVote({
      deviceId: device1,
      playerId: playerA,
      competitionId: EPL_COMP_ID,
      matchweek: 2, // Matchweek 2
    });

    try {
      assert.strictEqual(voteMw2.success, true);
      recordPass('1-Device-1-Vote: New matchweek allows casting a fresh vote');
    } catch (e) {
      recordFail('1-Device-1-Vote: New matchweek allows casting a fresh vote', e);
    }

    // Test 2.6: Missing parameter validation
    const voteMissing = await castVote({
      deviceId: '',
      playerId: playerA,
      competitionId: EPL_COMP_ID,
      matchweek: 1,
    });

    try {
      assert.strictEqual(voteMissing.success, false);
      assert(voteMissing.error?.includes('Missing required'));
      recordPass('1-Device-1-Vote: Missing parameters rejected cleanly');
    } catch (e) {
      recordFail('1-Device-1-Vote: Missing parameters rejected cleanly', e);
    }

  } finally {
    (supabase as any).from = originalFrom;
    (supabase as any).rpc = originalRpc;
  }
}

// ============================================================================
// SUITE 3: WhatsApp Viral Share Deep Link Generation
// ============================================================================
console.log('\n--- SUITE 3: WhatsApp Deep Link Generation & Branding ---');

function testWhatsAppShareUrl() {
  const mockCandidateEpl: PotwCandidate = {
    player_id: 'p-uuid-999',
    player_name: 'Brian Ochieng',
    jersey_number: 7,
    position: 'MID',
    team_id: 'team-1',
    team_name: 'Tatton FC',
    competition_id: EPL_COMP_ID,
    competition_name: 'Egerton Premier League',
    fixture_id: 'fix-1',
    match_details: 'Tatton FC 2 - 0 Riverbank FC',
  };

  const shareUrl = buildWhatsAppShareUrl(mockCandidateEpl);

  try {
    assert(shareUrl.startsWith('https://wa.me/?text='), 'Share URL must use https://wa.me/?text= scheme');
    recordPass('WhatsApp Share: Correct wa.me base URL scheme');
  } catch (e) {
    recordFail('WhatsApp Share: Correct wa.me base URL scheme', e);
  }

  const encodedText = shareUrl.replace('https://wa.me/?text=', '');
  const decodedText = decodeURIComponent(encodedText);

  try {
    assert(
      decodedText.includes('?potw_player=p-uuid-999&league=epl'),
      `Deep link must contain ?potw_player=p-uuid-999&league=epl. Found: "${decodedText}"`
    );
    recordPass('WhatsApp Share: Deep link query params ?potw_player=<id>&league=<league>');
  } catch (e) {
    recordFail('WhatsApp Share: Deep link query params ?potw_player=<id>&league=<league>', e);
  }

  try {
    assert(decodedText.includes('Brian Ochieng'), 'Must include candidate name');
    assert(decodedText.includes('Tatton FC'), 'Must include candidate team name');
    assert(decodedText.includes('Tatton FC 2 - 0 Riverbank FC'), 'Must include match details');
    recordPass('WhatsApp Share: Contains player name, team, and match details');
  } catch (e) {
    recordFail('WhatsApp Share: Contains player name, team, and match details', e);
  }

  try {
    assert(decodedText.includes('egersports.com'), 'Must incorporate egersports.com branding');
    assert(decodedText.includes('Egerton Sports Network'), 'Must include Egerton Sports Network branding');
    recordPass('WhatsApp Share: Incorporates official egersports.com branding');
  } catch (e) {
    recordFail('WhatsApp Share: Incorporates official egersports.com branding', e);
  }

  // Test Championship candidate slug
  const mockCandidateChamp: PotwCandidate = {
    ...mockCandidateEpl,
    competition_id: CHAMP_COMP_ID,
    competition_name: 'Egerton Championship',
  };
  const champShareUrl = buildWhatsAppShareUrl(mockCandidateChamp);
  const decodedChampText = decodeURIComponent(champShareUrl.replace('https://wa.me/?text=', ''));

  try {
    assert(decodedChampText.includes('&league=champ'), 'Championship league must produce league=champ slug');
    recordPass('WhatsApp Share: Championship slug mapped to league=champ');
  } catch (e) {
    recordFail('WhatsApp Share: Championship slug mapped to league=champ', e);
  }
}

// ============================================================================
// SUITE 4: Monday Admin Mystery Teaser
// ============================================================================
console.log('\n--- SUITE 4: Monday Admin Mystery Teaser ---');

function testMondayMysteryTeaser() {
  const teamName = 'Maringo Rangers';
  const compName = 'Egerton Premier League';

  const teaser = buildMondayMysteryTeaser(teamName, compName);

  try {
    assert(teaser.includes('Maringo Rangers'), 'Teaser MUST show leading team name');
    recordPass('Monday Teaser: Displays the leading team name clearly');
  } catch (e) {
    recordFail('Monday Teaser: Displays the leading team name clearly', e);
  }

  try {
    assert(
      teaser.includes('[Player Name Concealed: ████████]'),
      'Teaser MUST conceal the player identity'
    );
    // Ensure no actual player name or accidental leak
    assert(!teaser.includes('undefined') && !teaser.includes('null'));
    recordPass('Monday Teaser: Conceals the player identity with suspenseful redaction');
  } catch (e) {
    recordFail('Monday Teaser: Conceals the player identity with suspenseful redaction', e);
  }

  try {
    assert(teaser.includes('egersports.com'), 'Teaser must include egersports.com');
    assert(teaser.includes('TUESDAY at 5:00 PM'), 'Teaser must mention Tuesday 5:00 PM deadline');
    assert(teaser.includes('?potw=true&league=epl'), 'Teaser must link to voting section');
    recordPass('Monday Teaser: Includes deadline, voting URL, and portal branding');
  } catch (e) {
    recordFail('Monday Teaser: Includes deadline, voting URL, and portal branding', e);
  }

  const teaserUrl = buildMondayMysteryTeaserUrl(teamName, compName);
  try {
    assert(teaserUrl.startsWith('https://wa.me/?text='));
    const decodedUrl = decodeURIComponent(teaserUrl.replace('https://wa.me/?text=', ''));
    assert(decodedUrl.includes('Maringo Rangers'));
    assert(decodedUrl.includes('[Player Name Concealed: ████████]'));
    recordPass('Monday Teaser URL: Generates fully-encoded WhatsApp share link');
  } catch (e) {
    recordFail('Monday Teaser URL: Generates fully-encoded WhatsApp share link', e);
  }
}

// ============================================================================
// SUITE 5: Weekly Cycle Calculations (Friday 11:00 AM & Tuesday 5:00 PM EAT)
// ============================================================================
console.log('\n--- SUITE 5: Weekly Cycle Calculations & Timezone Stress-Testing ---');

function testWeeklyCycleCalculations() {
  const OriginalDate = global.Date;

  function mockCurrentDate(isoString: string) {
    const fixedTime = new Date(isoString).getTime();
    const MockDate: any = function (arg: any) {
      if (arg !== undefined) {
        return new OriginalDate(arg);
      }
      return new OriginalDate(fixedTime);
    };
    MockDate.prototype = OriginalDate.prototype;
    MockDate.now = () => fixedTime;
    MockDate.parse = OriginalDate.parse;
    MockDate.UTC = OriginalDate.UTC;
    global.Date = MockDate;
  }

  function restoreDate() {
    global.Date = OriginalDate;
  }

  try {
    // EAT is UTC+3.
    // Friday 11:00 AM EAT is Friday 08:00:00 UTC.
    // Tuesday 5:00 PM EAT (17:00 EAT) is Tuesday 14:00:00 UTC.

    // 5.1: Friday 10:59:59 EAT (Friday 07:59:59 UTC) — Maintenance reset before 11:00 AM
    mockCurrentDate('2026-09-18T07:59:59.000Z');
    const friBefore11 = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(friBefore11.isVotingOpen, false, 'Voting should NOT be open before Friday 11:00 AM EAT');
      assert.strictEqual(friBefore11.stage, 'MAINTENANCE_RESET', 'Stage before Friday 11:00 AM should be MAINTENANCE_RESET');
      recordPass('Cycle: Friday 10:59:59 AM EAT -> MAINTENANCE_RESET (voting closed)');
    } catch (e) {
      recordFail('Cycle: Friday 10:59:59 AM EAT -> MAINTENANCE_RESET (voting closed)', e);
    }

    // 5.2: Friday 11:00:00 EAT (Friday 08:00:00 UTC) — Reset complete, voting opens
    mockCurrentDate('2026-09-18T08:00:00.000Z');
    const friAt11 = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(friAt11.isVotingOpen, true, 'Voting should OPEN at Friday 11:00:00 AM EAT');
      assert.strictEqual(friAt11.stage, 'VOTING_ACTIVE', 'Stage should be VOTING_ACTIVE');
      recordPass('Cycle: Friday 11:00:00 AM EAT -> VOTING_ACTIVE (voting open)');
    } catch (e) {
      recordFail('Cycle: Friday 11:00:00 AM EAT -> VOTING_ACTIVE (voting open)', e);
    }

    // 5.3: Saturday 15:00:00 EAT (Saturday 12:00:00 UTC) — Matchday voting active
    mockCurrentDate('2026-09-19T12:00:00.000Z');
    const satActive = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(satActive.isVotingOpen, true);
      assert.strictEqual(satActive.stage, 'VOTING_ACTIVE');
      recordPass('Cycle: Saturday 15:00:00 EAT -> VOTING_ACTIVE');
    } catch (e) {
      recordFail('Cycle: Saturday 15:00:00 EAT -> VOTING_ACTIVE', e);
    }

    // 5.4: Sunday 18:00:00 EAT (Sunday 15:00:00 UTC) — Matchday voting active
    mockCurrentDate('2026-09-20T15:00:00.000Z');
    const sunActive = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(sunActive.isVotingOpen, true);
      assert.strictEqual(sunActive.stage, 'VOTING_ACTIVE');
      recordPass('Cycle: Sunday 18:00:00 EAT -> VOTING_ACTIVE');
    } catch (e) {
      recordFail('Cycle: Sunday 18:00:00 EAT -> VOTING_ACTIVE', e);
    }

    // 5.5: Monday 10:00:00 EAT (Monday 07:00:00 UTC) — Teaser day, voting active
    mockCurrentDate('2026-09-21T07:00:00.000Z');
    const monActive = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(monActive.isVotingOpen, true);
      assert.strictEqual(monActive.stage, 'VOTING_ACTIVE');
      recordPass('Cycle: Monday 10:00:00 EAT -> VOTING_ACTIVE');
    } catch (e) {
      recordFail('Cycle: Monday 10:00:00 EAT -> VOTING_ACTIVE', e);
    }

    // 5.6: Tuesday 16:59:00 EAT (Tuesday 13:59:00 UTC) — 1 minute before Tuesday 5:00 PM deadline
    mockCurrentDate('2026-09-22T13:59:00.000Z');
    const tue1MinBefore = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(tue1MinBefore.isVotingOpen, true);
      assert.strictEqual(tue1MinBefore.stage, 'VOTING_ACTIVE');
      assert.strictEqual(tue1MinBefore.timeRemainingSeconds, 60, 'Should have exactly 60s remaining until 17:00 EAT');
      recordPass('Cycle: Tuesday 16:59:00 EAT -> VOTING_ACTIVE with exactly 60s remaining');
    } catch (e) {
      recordFail('Cycle: Tuesday 16:59:00 EAT -> VOTING_ACTIVE with exactly 60s remaining', e);
    }

    // 5.7: Tuesday 16:59:59 EAT (Tuesday 13:59:59 UTC) — 1 second before deadline
    mockCurrentDate('2026-09-22T13:59:59.000Z');
    const tue1SecBefore = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(tue1SecBefore.isVotingOpen, true);
      assert.strictEqual(tue1SecBefore.stage, 'VOTING_ACTIVE');
      assert.strictEqual(tue1SecBefore.timeRemainingSeconds, 1, 'Should have exactly 1s remaining until 17:00 EAT');
      recordPass('Cycle: Tuesday 16:59:59 EAT -> VOTING_ACTIVE with 1s remaining');
    } catch (e) {
      recordFail('Cycle: Tuesday 16:59:59 EAT -> VOTING_ACTIVE with 1s remaining', e);
    }

    // 5.8: Tuesday 17:00:00 EAT (Tuesday 14:00:00 UTC) — EXACT DEADLINE STRESS TEST
    mockCurrentDate('2026-09-22T14:00:00.000Z');
    const tueAtDeadline = getWeeklyCycleStatus(1);
    console.log(`    [OBSERVATION] Tuesday 17:00:00 EAT status: isVotingOpen=${tueAtDeadline.isVotingOpen}, stage=${tueAtDeadline.stage}, timeRemainingSeconds=${tueAtDeadline.timeRemainingSeconds}`);

    try {
      // Challenging the behavior at exactly 17:00:00:
      // In potwService.ts line 568: `if (hour < 17 || (hour === 17 && minutes === 0))`
      // At 17:00:00, isVotingOpen is TRUE. But targetTransition computed:
      // daysUntilTuesday === 0 && hour >= 17 ? 7 : daysUntilTuesday -> jumps by 7 days (604,800 seconds)!
      if (tueAtDeadline.isVotingOpen === true && tueAtDeadline.timeRemainingSeconds > 600000) {
        findings.push(
          'ANOMALY_CONFIRMED: At Tuesday 17:00:00 EAT (the exact deadline), isVotingOpen is true due to `hour === 17 && minutes === 0`, but targetTransition has already jumped 7 days into the future (timeRemainingSeconds = ' +
          tueAtDeadline.timeRemainingSeconds + 's / ~7 days), presenting an incorrect 7-day countdown for 60 seconds before closing at 17:01.'
        );
        recordFail('Cycle Boundary Challenge: Tuesday 17:00:00 countdown anomaly', new Error(
          `At 17:00:00 EAT, isVotingOpen is TRUE but countdown jumped to ${tueAtDeadline.timeRemainingSeconds}s (7 days)! Expected closed or 0s remaining.`
        ));
      } else {
        recordPass('Cycle: Tuesday 17:00:00 EAT handled without jumping 7 days');
      }
    } catch (e) {
      recordFail('Cycle: Tuesday 17:00:00 EAT deadline behavior', e);
    }

    // 5.9: Tuesday 17:01:00 EAT (Tuesday 14:01:00 UTC) — Voting closed, results announced
    mockCurrentDate('2026-09-22T14:01:00.000Z');
    const tueAfterDeadline = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(tueAfterDeadline.isVotingOpen, false, 'Voting MUST be closed at Tuesday 17:01 EAT');
      assert.strictEqual(tueAfterDeadline.stage, 'RESULTS_ANNOUNCED', 'Stage must be RESULTS_ANNOUNCED');
      recordPass('Cycle: Tuesday 17:01:00 EAT -> RESULTS_ANNOUNCED (voting closed)');
    } catch (e) {
      recordFail('Cycle: Tuesday 17:01:00 EAT -> RESULTS_ANNOUNCED (voting closed)', e);
    }

    // 5.10: Wednesday 12:00:00 EAT (Wednesday 09:00:00 UTC) — Closed, results announced
    mockCurrentDate('2026-09-23T09:00:00.000Z');
    const wedClosed = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(wedClosed.isVotingOpen, false);
      assert.strictEqual(wedClosed.stage, 'RESULTS_ANNOUNCED');
      recordPass('Cycle: Wednesday 12:00:00 EAT -> RESULTS_ANNOUNCED');
    } catch (e) {
      recordFail('Cycle: Wednesday 12:00:00 EAT -> RESULTS_ANNOUNCED', e);
    }

    // 5.11: Thursday 15:00:00 EAT (Thursday 12:00:00 UTC) — Closed, results announced
    mockCurrentDate('2026-09-24T12:00:00.000Z');
    const thuClosed = getWeeklyCycleStatus(1);
    try {
      assert.strictEqual(thuClosed.isVotingOpen, false);
      assert.strictEqual(thuClosed.stage, 'RESULTS_ANNOUNCED');
      recordPass('Cycle: Thursday 15:00:00 EAT -> RESULTS_ANNOUNCED');
    } catch (e) {
      recordFail('Cycle: Thursday 15:00:00 EAT -> RESULTS_ANNOUNCED', e);
    }

  } finally {
    restoreDate();
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function runAllTests() {
  await testCandidateCondensation();
  await testDeviceVotingRule();
  testWhatsAppShareUrl();
  testMondayMysteryTeaser();
  testWeeklyCycleCalculations();

  console.log('\n===============================================================');
  console.log(`TEST RESULTS SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('===============================================================');

  if (findings.length > 0) {
    console.log('\nADVERSARIAL CHALLENGE FINDINGS:');
    findings.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
  }

  // Write empirical results file
  const resultsPayload = {
    timestamp: new Date().toISOString(),
    totalTests: passCount + failCount,
    passCount,
    failCount,
    findings,
  };

  console.log('\nEmpirical test run finished.');
  process.exit(0);
}

runAllTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
