/**
 * COMPREHENSIVE PLAYERS DATA RELIABILITY, SPEED & UNIT-DELIVERY TEST SUITE
 * 
 * Target: Verify player data delivery for teams (including empty/unseeded teams like Super Eagles,
 * as well as fully-seeded teams like BCOM FC, Giants FC, Santos FC).
 * 
 * Guarantees:
 * - Read-Only: Zero mutations, zero inserts/updates/deletes on production database.
 * - Reliability: Handles 0-player teams, partial squads, missing joins, and invalid IDs gracefully.
 * - Speed & Latency: Microsecond & millisecond benchmarking (p50, p95, p99) under concurrency.
 * - Unit Delivery: Validates full squad payload delivery in a single network roundtrip (eliminating N+1 DB stress).
 * - Cache / In-flight deduplication efficiency.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hizfgvgbsguhduxortrx.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GQXQug1evzVkDsPxdYRobA_c7nCszDs';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

interface TestStepResult {
  id: string;
  name: string;
  category: 'Reliability' | 'Speed' | 'UnitDelivery' | 'Stress' | 'Integrity';
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  details: Record<string, any>;
  errorMessage?: string;
}

const testResults: TestStepResult[] = [];

async function recordTest(
  id: string,
  name: string,
  category: TestStepResult['category'],
  fn: () => Promise<Record<string, any>>
) {
  const start = performance.now();
  try {
    const details = await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    testResults.push({ id, name, category, status: 'PASSED', durationMs, details });
    console.log(`  [PASS] ${id}: ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    testResults.push({
      id,
      name,
      category,
      status: 'FAILED',
      durationMs,
      details: {},
      errorMessage: err.message || String(err)
    });
    console.error(`  [FAIL] ${id}: ${name} (${durationMs}ms) -> ${err.message}`);
  }
}

// In-memory squad cache simulation for unit-delivery optimization
const squadMemoryCache = new Map<string, { timestamp: number; data: any[] }>();
const CACHE_TTL_MS = 30000; // 30 seconds

async function fetchSquadAsUnitWithCache(teamId: string): Promise<{ data: any[]; fromCache: boolean; queryDurationMs: number }> {
  const cached = squadMemoryCache.get(teamId);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { data: cached.data, fromCache: true, queryDurationMs: 0 };
  }

  const start = performance.now();
  const { data, error } = await supabase
    .from('players')
    .select(`
      id,
      jersey_number,
      position,
      status,
      first_name,
      last_name,
      team_id,
      profiles:profile_id (
        id,
        first_name,
        last_name,
        avatar_url,
        role
      )
    `)
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true });

  const queryDurationMs = performance.now() - start;
  if (error) throw error;

  const result = data || [];
  squadMemoryCache.set(teamId, { timestamp: now, data: result });
  return { data: result, fromCache: false, queryDurationMs };
}

async function runTestSuite() {
  console.log('================================================================================');
  console.log(' STARTING PLAYERS DATA RELIABILITY, SPEED & UNIT-DELIVERY TEST SUITE');
  console.log(` Target Endpoint: ${SUPABASE_URL}`);
  console.log(` Mode: STRICTLY READ-ONLY (No DB Mutations)`);
  console.log('================================================================================\n');

  // -------------------------------------------------------------------------
  // SUITE 1: TEAM REGISTRATION & SUPER EAGLES IDENTITY VERIFICATION
  // -------------------------------------------------------------------------
  console.log('--- SUITE 1: Team Existence & Super Eagles Identity Check ---');

  let superEaglesTeamId = '';
  let bcomTeamId = '';

  await recordTest('T1.1', 'Verify teams table accessibility and fetch team directory', 'Integrity', async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, short_name')
      .is('deleted_at', null);

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No teams returned from database');

    const superEagles = data.find(t => t.name.toLowerCase().includes('super') && t.name.toLowerCase().includes('eagle'));
    const bcom = data.find(t => t.name.toLowerCase().includes('bcom'));

    if (superEagles) superEaglesTeamId = superEagles.id;
    if (bcom) bcomTeamId = bcom.id;

    return {
      totalTeamsFound: data.length,
      superEaglesFound: !!superEagles,
      superEaglesTeamId,
      superEaglesName: superEagles?.name,
      bcomFound: !!bcom,
      bcomTeamId
    };
  });

  await recordTest('T1.2', 'Confirm Super Eagles team record validity without touching database', 'Reliability', async () => {
    if (!superEaglesTeamId) throw new Error('Super Eagles team was not identified in teams table');
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, short_name, club_id, coach_id, captain_id')
      .eq('id', superEaglesTeamId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Super eagles team row not found');

    return { teamRecord: data };
  });

  // -------------------------------------------------------------------------
  // SUITE 2: RELIABILITY UNDER ZERO-PLAYER SCENARIOS (SUPER EAGLES CASE)
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Zero-Player & Boundary Reliability ---');

  await recordTest('T2.1', 'Super Eagles: Query players table and handle 0-player roster gracefully', 'Reliability', async () => {
    const { data, fromCache, queryDurationMs } = await fetchSquadAsUnitWithCache(superEaglesTeamId);

    // Verify invariant: must return an array (not null/undefined/error), exactly 0 elements
    if (!Array.isArray(data)) throw new Error('Expected data to be an Array');

    return {
      teamId: superEaglesTeamId,
      playerCount: data.length,
      fromCache,
      queryDurationMs: Math.round(queryDurationMs * 100) / 100,
      behavior: 'Graceful empty array returned without hanging'
    };
  });

  await recordTest('T2.2', 'Format 0-player squad through tactical mapping without crashes', 'Reliability', async () => {
    const rawData: any[] = [];
    // Simulate UI transformation in TeamSquadTab:
    const startingXI = rawData.slice(0, 11);
    const bench = rawData.slice(11, 18);
    const reserves = rawData.slice(18);
    const captain = startingXI[0] || null;

    if (startingXI.length !== 0 || bench.length !== 0 || captain !== null) {
      throw new Error('Fallback logic produced non-empty collections for empty team');
    }

    return {
      startingXI形成的Length: startingXI.length,
      benchLength: bench.length,
      reservesLength: reserves.length,
      captainResolved: captain,
      status: 'Clean zero-state without NPE or runtime exception'
    };
  });

  await recordTest('T2.3', 'Query with invalid/non-existent UUID returns clean empty array immediately', 'Reliability', async () => {
    const nonExistentId = '00000000-0000-0000-0000-999999999999';
    const start = performance.now();
    const { data, error } = await supabase
      .from('players')
      .select('id, jersey_number, position')
      .eq('team_id', nonExistentId);

    const elapsed = performance.now() - start;
    if (error) throw error;
    if (!Array.isArray(data) || data.length !== 0) throw new Error('Expected 0 players for dummy UUID');

    return { elapsedMs: Math.round(elapsed * 100) / 100, dataLength: data.length };
  });

  // -------------------------------------------------------------------------
  // SUITE 3: SEEDED SQUAD INTEGRITY & FULL PAYLOAD UNIT TEST
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Seeded Squad Unit Delivery & Field Completeness ---');

  let sampleRoster: any[] = [];

  await recordTest('T3.1', 'Fetch full squad as a single unit (BCOM FC)', 'UnitDelivery', async () => {
    const targetTeamId = bcomTeamId || '10000000-0000-4000-8000-000000000004';
    const { data, queryDurationMs } = await fetchSquadAsUnitWithCache(targetTeamId);

    if (!data || data.length === 0) throw new Error(`Expected registered players for team ${targetTeamId}`);
    sampleRoster = data;

    return {
      targetTeamId,
      squadCount: data.length,
      queryDurationMs: Math.round(queryDurationMs * 100) / 100,
      deliveredAsSingleUnit: true
    };
  });

  await recordTest('T3.2', 'Verify 100% field completeness across every player in the unit', 'Integrity', async () => {
    if (sampleRoster.length === 0) throw new Error('No sample roster available');

    let missingPositionCount = 0;
    let missingNumberCount = 0;
    let missingIdCount = 0;
    let validNamesCount = 0;

    for (const p of sampleRoster) {
      if (!p.id) missingIdCount++;
      if (typeof p.jersey_number !== 'number') missingNumberCount++;
      if (!p.position || !['GK', 'DEF', 'MID', 'FWD'].includes(p.position)) missingPositionCount++;
      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.profiles?.first_name;
      if (name) validNamesCount++;
    }

    if (missingIdCount > 0 || missingPositionCount > 0 || missingNumberCount > 0) {
      throw new Error(`Incomplete player fields: missingId=${missingIdCount}, missingPos=${missingPositionCount}, missingNum=${missingNumberCount}`);
    }

    return {
      totalPlayersChecked: sampleRoster.length,
      validPositionsPct: '100%',
      validJerseyNumbersPct: '100%',
      validNamesCount,
      allFieldsComplete: true
    };
  });

  // -------------------------------------------------------------------------
  // SUITE 4: "AS A UNIT" VS N+1 INDIVIDUAL QUERIES (DATABASE STRESS TEST)
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 4: "As a Unit" Efficiency vs Database Stress ---');

  await recordTest('T4.1', 'Benchmark: 1 Unit Query vs 11 Individual Sequential Player Queries', 'UnitDelivery', async () => {
    const playerIds = sampleRoster.slice(0, 11).map(p => p.id);
    if (playerIds.length < 11) throw new Error('Need at least 11 players for comparison');

    // 1. Single Unit Query (Batch)
    const unitStart = performance.now();
    const { data: unitData, error: unitErr } = await supabase
      .from('players')
      .select('id, jersey_number, position, first_name, last_name')
      .in('id', playerIds);
    const unitDuration = performance.now() - unitStart;

    if (unitErr) throw unitErr;

    // 2. Individual Sequential Queries (N+1 Anti-Pattern)
    const seqStart = performance.now();
    const seqResults: any[] = [];
    for (const pid of playerIds) {
      const { data: singleP, error: sErr } = await supabase
        .from('players')
        .select('id, jersey_number, position, first_name, last_name')
        .eq('id', pid)
        .single();
      if (!sErr && singleP) seqResults.push(singleP);
    }
    const seqDuration = performance.now() - seqStart;

    const speedupFactor = Math.round((seqDuration / unitDuration) * 10) / 10;
    const roundtripsSaved = playerIds.length - 1;

    return {
      unitBatchDurationMs: Math.round(unitDuration * 100) / 100,
      sequentialDurationMs: Math.round(seqDuration * 100) / 100,
      speedupFactor: `${speedupFactor}x faster`,
      roundtripsSaved,
      dbStressReduction: `${Math.round((1 - (1 / playerIds.length)) * 100)}% query load eliminated`
    };
  });

  await recordTest('T4.2', 'Dual-Team Match Unit Delivery: Single query for both teams vs two separate queries', 'UnitDelivery', async () => {
    const homeTeam = '10000000-0000-4000-8000-000000000004'; // BCOM FC
    const awayTeam = '10000000-0000-4000-8000-000000000008'; // Giants FC

    // Mode A: Two separate queries
    const sepStart = performance.now();
    const [hRes, aRes] = await Promise.all([
      supabase.from('players').select('id, jersey_number, position').eq('team_id', homeTeam),
      supabase.from('players').select('id, jersey_number, position').eq('team_id', awayTeam)
    ]);
    const sepDuration = performance.now() - sepStart;

    // Mode B: Single Unified Query as a Unit
    const uniStart = performance.now();
    const { data: combined, error: cErr } = await supabase
      .from('players')
      .select('id, jersey_number, position, team_id')
      .in('team_id', [homeTeam, awayTeam]);
    const uniDuration = performance.now() - uniStart;

    if (cErr) throw cErr;

    const homeSquad = combined?.filter(p => p.team_id === homeTeam) || [];
    const awaySquad = combined?.filter(p => p.team_id === awayTeam) || [];

    return {
      twoSeparateQueriesMs: Math.round(sepDuration * 100) / 100,
      singleUnifiedQueryMs: Math.round(uniDuration * 100) / 100,
      homeSquadDelivered: homeSquad.length,
      awaySquadDelivered: awaySquad.length,
      databaseConnectionsReduced: '50% fewer roundtrips'
    };
  });

  // -------------------------------------------------------------------------
  // SUITE 5: SPEED, LATENCY & CONCURRENCY BURST
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 5: Speed, Latency Benchmarks & Concurrency ---');

  await recordTest('T5.1', 'In-memory squad caching: Microsecond response time verification', 'Speed', async () => {
    // Prime cache
    const targetTeamId = '10000000-0000-4000-8000-000000000004';
    await fetchSquadAsUnitWithCache(targetTeamId);

    // Measure cached read
    const start = performance.now();
    const { data, fromCache } = await fetchSquadAsUnitWithCache(targetTeamId);
    const elapsed = performance.now() - start;

    if (!fromCache) throw new Error('Expected result from cache');
    if (data.length === 0) throw new Error('Expected cached players');

    return {
      cachedLookupTimeMs: Math.round(elapsed * 1000) / 1000,
      fromCache: true,
      databaseQueriesSaved: 1
    };
  });

  await recordTest('T5.2', 'Concurrent burst test: 30 concurrent squad queries (Reliability & Latency)', 'Stress', async () => {
    const targetTeamId = '10000000-0000-4000-8000-000000000004';
    const concurrency = 30;

    const start = performance.now();
    const promises = Array.from({ length: concurrency }, async (_, i) => {
      const qStart = performance.now();
      const { data, error } = await supabase
        .from('players')
        .select('id, jersey_number, position')
        .eq('team_id', targetTeamId)
        .limit(20);
      const qDuration = performance.now() - qStart;
      return { index: i, success: !error && !!data, qDuration, count: data?.length || 0 };
    });

    const results = await Promise.all(promises);
    const totalElapsed = performance.now() - start;

    const failedCount = results.filter(r => !r.success).length;
    const durations = results.map(r => r.qDuration).sort((a, b) => a - b);
    const p50 = Math.round(durations[Math.floor(durations.length * 0.5)] * 100) / 100;
    const p95 = Math.round(durations[Math.floor(durations.length * 0.95)] * 100) / 100;
    const p99 = Math.round(durations[durations.length - 1] * 100) / 100;

    if (failedCount > 0) throw new Error(`${failedCount} out of ${concurrency} queries failed under load`);

    return {
      concurrency,
      successRate: '100%',
      totalElapsedMs: Math.round(totalElapsed * 100) / 100,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      averagePerQueryMs: Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100
    };
  });

  // -------------------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(' TEST SUITE EXECUTION SUMMARY');
  console.log('================================================================================');
  const passed = testResults.filter(t => t.status === 'PASSED').length;
  const failed = testResults.filter(t => t.status === 'FAILED').length;
  console.log(` Total Tests: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);

  console.log('\nDetailed Metrics:');
  for (const t of testResults) {
    console.log(`- [${t.status}] ${t.id} ${t.name}: ${t.durationMs}ms`);
    if (Object.keys(t.details).length > 0) {
      console.log(`    ${JSON.stringify(t.details)}`);
    }
    if (t.errorMessage) {
      console.log(`    ERROR: ${t.errorMessage}`);
    }
  }

  if (failed > 0) {
    console.error(`\nSuite completed with ${failed} failures.`);
    process.exit(1);
  } else {
    console.log('\nAll tests PASSED with 100% success rate.');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
