/**
 * Empirical Verification Suite for POTW System (Milestone 1)
 * Challenger 2
 *
 * Empirically tests database migration 45_player_of_the_week_system.sql:
 * 1. SQL syntax, constraints, foreign keys, triggers, and functions.
 * 2. purge_potw_weekly_cycle() idempotency and non-deletion from player_of_the_week_winners.
 * 3. Unique constraint on player_of_the_week_votes covering (device_id, competition_id, matchweek).
 * 4. RLS policy blocking anonymous SELECT on live vote tallies before finalization.
 * 5. fn_finalize_potw_winners Cartesian join bug and mathematical integrity.
 * 6. has_device_voted_potw RPC behavior.
 */

import { spawnSync, execSync } from 'node:child_process';

interface TestCaseResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestCaseResult[] = [];

function runPsql(sql: string): string {
  const res = spawnSync(
    'docker',
    ['exec', '-i', 'supabase_db_livescore', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-F', '|'],
    {
      input: sql,
      encoding: 'utf-8',
    }
  );

  if (res.status !== 0) {
    const err = (res.stderr || res.stdout || `Exit code ${res.status}`).trim();
    throw new Error(err);
  }
  return (res.stdout || '').trim();
}

function runPsqlSafe(sql: string): { success: boolean; output: string; error?: string } {
  try {
    const out = runPsql(sql);
    return { success: true, output: out };
  } catch (err: any) {
    return { success: false, output: '', error: err.message };
  }
}

function recordTest(suite: string, test: string, passed: boolean, details?: string, error?: string) {
  results.push({ suite, test, passed, details, error });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] [${suite}] ${test}`);
  if (details) console.log(`       Details: ${details}`);
  if (error) console.error(`       Error: ${error}`);
}

async function runSuite() {
  console.log('================================================================');
  console.log('  POTW SYSTEM M1: EMPIRICAL VERIFICATION SUITE — CHALLENGER 2');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // SUITE 1: DDL, Schema, Constraints & Migration Syntax
  // -------------------------------------------------------------------------
  console.log('--- SUITE 1: DDL, Tables, Foreign Keys & Schema Integrity ---');

  // 1.1 Check tables existence
  const tablesRes = runPsqlSafe(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('man_of_the_match_nominations', 'player_of_the_week_votes', 'player_of_the_week_winners')
    ORDER BY table_name;
  `);

  const foundTables = tablesRes.output.split('\n').filter(Boolean);
  const hasAllTables =
    foundTables.includes('man_of_the_match_nominations') &&
    foundTables.includes('player_of_the_week_votes') &&
    foundTables.includes('player_of_the_week_winners');

  recordTest(
    'DDL Integrity',
    'All 3 POTW tables exist in public schema',
    hasAllTables,
    `Found tables: ${foundTables.join(', ')}`
  );

  // 1.2 Test Migration 45 RLS Policy Creation Failure (Empirical Bug Reproduction)
  const testPolicyRaw = runPsqlSafe(`
    DO $$ BEGIN
        CREATE POLICY "Test policy fail on superadmin"
        ON public.player_of_the_week_votes FOR SELECT
        TO anon, authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')
            )
        );
    END $$;
  `);

  const failedWithEnumError = !testPolicyRaw.success && testPolicyRaw.error?.includes('invalid input value for enum user_role: "superadmin"');
  recordTest(
    'DDL Integrity',
    'Migration 45 syntax bug: profiles.role IN (\'admin\', \'superadmin\') throws invalid enum error',
    failedWithEnumError,
    failedWithEnumError
      ? `CONFIRMED: Migration fails with verbatim error: ${testPolicyRaw.error}`
      : `Unexpected result: ${testPolicyRaw.output}`
  );

  // Check which policies currently exist in pg_policies
  const policiesRes = runPsqlSafe(`
    SELECT tablename || ' -> ' || policyname 
    FROM pg_policies 
    WHERE tablename IN ('man_of_the_match_nominations', 'player_of_the_week_votes', 'player_of_the_week_winners')
    ORDER BY tablename, policyname;
  `);
  const createdPolicies = policiesRes.output.split('\n').filter(Boolean);
  const hasRestrictedSelect = createdPolicies.some((p) => p.includes('Restricted select on potw votes'));
  const hasAdminsManageWinners = createdPolicies.some((p) => p.includes('Admins manage potw winners'));

  recordTest(
    'DDL Integrity',
    'Policy "Restricted select on potw votes" exists in database',
    hasRestrictedSelect,
    hasRestrictedSelect ? 'Policy exists' : 'POLICY MISSING: Migration 45 failed to create this policy due to enum error!',
    hasRestrictedSelect ? undefined : 'Policy not found in pg_policies'
  );

  recordTest(
    'DDL Integrity',
    'Policy "Admins manage potw winners" exists in database',
    hasAdminsManageWinners,
    hasAdminsManageWinners ? 'Policy exists' : 'POLICY MISSING: Migration 45 failed to create this policy due to enum error!',
    hasAdminsManageWinners ? undefined : 'Policy not found in pg_policies'
  );

  // 1.3 Check Foreign Keys
  const fkRes = runPsqlSafe(`
    SELECT
      tc.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('man_of_the_match_nominations', 'player_of_the_week_votes', 'player_of_the_week_winners')
    ORDER BY tc.table_name, kcu.column_name;
  `);
  const fks = fkRes.output.split('\n').filter(Boolean);
  recordTest(
    'DDL Integrity',
    'Foreign key relationships properly defined',
    fks.length >= 6,
    `Foreign keys (${fks.length}):\n${fks.map((k) => '       ' + k).join('\n')}`
  );

  // -------------------------------------------------------------------------
  // SUITE 2: Unique Constraint on player_of_the_week_votes
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Unique Constraint on player_of_the_week_votes ---');

  const uqCheck = runPsqlSafe(`
    SELECT conname || ' : ' || pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'player_of_the_week_votes' AND c.contype = 'u';
  `);
  const uqCoversExpected =
    uqCheck.output.includes('device_id') &&
    uqCheck.output.includes('competition_id') &&
    uqCheck.output.includes('matchweek');

  recordTest(
    'Unique Constraint',
    'Unique constraint uq_device_competition_matchweek covers (device_id, competition_id, matchweek)',
    uqCoversExpected,
    `Constraint: ${uqCheck.output}`
  );

  // Empirical test of unique constraint
  const comp1 = '11111111-1111-1111-1111-111111111111';
  const comp2 = '22222222-2222-2222-2222-222222222222';
  const testDev1 = '99999999-9999-9999-9999-999999999901';
  const testDev2 = '99999999-9999-9999-9999-999999999902';

  const players = runPsql(`SELECT id FROM public.players LIMIT 2;`).split('\n').filter(Boolean);
  const p1 = players[0];
  const p2 = players[1];

  runPsql(`DELETE FROM public.player_of_the_week_votes WHERE device_id IN ('${testDev1}', '${testDev2}');`);

  // 2.1 First vote succeeds
  const vote1 = runPsqlSafe(`
    INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
    VALUES ('${testDev1}', '${p1}', '${comp1}', 1)
    RETURNING id;
  `);
  recordTest('Unique Constraint', 'Initial vote from Device 1 in Matchweek 1 succeeds', vote1.success, `Vote ID: ${vote1.output}`);

  // 2.2 Duplicate vote from same device, same league, same matchweek MUST fail
  const voteDup = runPsqlSafe(`
    INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
    VALUES ('${testDev1}', '${p2}', '${comp1}', 1)
    RETURNING id;
  `);
  const dupBlocked = !voteDup.success && (voteDup.error?.includes('uq_device_competition_matchweek') || voteDup.error?.includes('23505'));
  recordTest(
    'Unique Constraint',
    'Duplicate vote from same device, same league, same matchweek throws unique violation 23505',
    dupBlocked,
    `Caught violation: ${voteDup.error?.split('\n')[0]}`
  );

  // 2.3 Vote from same device in different league succeeds
  const voteComp2 = runPsqlSafe(`
    INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
    VALUES ('${testDev1}', '${p2}', '${comp2}', 1)
    RETURNING id;
  `);
  recordTest(
    'Unique Constraint',
    'Vote from same device in DIFFERENT league succeeds (league independence)',
    voteComp2.success,
    `Vote ID: ${voteComp2.output}`
  );

  // 2.4 Vote from same device in same league for next matchweek succeeds
  const voteWeek2 = runPsqlSafe(`
    INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
    VALUES ('${testDev1}', '${p1}', '${comp1}', 2)
    RETURNING id;
  `);
  recordTest(
    'Unique Constraint',
    'Vote from same device in SAME league for NEXT matchweek (week 2) succeeds',
    voteWeek2.success,
    `Vote ID: ${voteWeek2.output}`
  );

  // 2.5 Vote from different device succeeds
  const voteDev2 = runPsqlSafe(`
    INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
    VALUES ('${testDev2}', '${p1}', '${comp1}', 1)
    RETURNING id;
  `);
  recordTest(
    'Unique Constraint',
    'Vote from DIFFERENT device (Device 2) for same player & matchweek succeeds',
    voteDev2.success,
    `Vote ID: ${voteDev2.output}`
  );

  runPsql(`DELETE FROM public.player_of_the_week_votes WHERE device_id IN ('${testDev1}', '${testDev2}');`);

  // -------------------------------------------------------------------------
  // SUITE 3: Idempotency & Safety of purge_potw_weekly_cycle()
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Idempotency & Safety of purge_potw_weekly_cycle() ---');

  const fixture = runPsql(`SELECT id FROM public.fixtures LIMIT 1;`);
  const team = runPsql(`SELECT id FROM public.teams LIMIT 1;`);

  // Seed test records
  runPsql(`
    INSERT INTO public.man_of_the_match_nominations (fixture_id, player_id, team_id, competition_id)
    VALUES ('${fixture}', '${p1}', '${team}', '${comp1}')
    ON CONFLICT (fixture_id) DO UPDATE SET player_id = EXCLUDED.player_id;

    INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
    VALUES ('${testDev1}', '${p1}', '${comp1}', 10);

    INSERT INTO public.player_of_the_week_winners (
      player_id, team_id, competition_id, matchweek, vote_count, vote_share_percentage, player_name, team_name, status
    ) VALUES (
      '${p1}', '${team}', '${comp1}', 10, 50, 75.0, 'Historical Champion', 'Test FC', 'ACTIVE'
    ) ON CONFLICT (competition_id, matchweek) DO UPDATE SET vote_count = 50;
  `);

  const countWinnersBefore = parseInt(runPsql(`SELECT count(*) FROM public.player_of_the_week_winners;`), 10);
  const countVotesBefore = parseInt(runPsql(`SELECT count(*) FROM public.player_of_the_week_votes;`), 10);
  const countNomsBefore = parseInt(runPsql(`SELECT count(*) FROM public.man_of_the_match_nominations;`), 10);

  recordTest(
    'Purge Idempotency',
    'Test fixtures seeded (votes > 0, nominations > 0, winners > 0)',
    countWinnersBefore > 0 && countVotesBefore > 0 && countNomsBefore > 0,
    `Votes: ${countVotesBefore}, Noms: ${countNomsBefore}, Winners: ${countWinnersBefore}`
  );

  // Run 1 of purge_potw_weekly_cycle
  const purge1 = runPsqlSafe(`SELECT public.purge_potw_weekly_cycle();`);
  const countVotesAfter1 = parseInt(runPsql(`SELECT count(*) FROM public.player_of_the_week_votes;`), 10);
  const countNomsAfter1 = parseInt(runPsql(`SELECT count(*) FROM public.man_of_the_match_nominations;`), 10);
  const countWinnersAfter1 = parseInt(runPsql(`SELECT count(*) FROM public.player_of_the_week_winners;`), 10);

  recordTest(
    'Purge Idempotency',
    'First run purges votes and nominations to 0',
    purge1.success && countVotesAfter1 === 0 && countNomsAfter1 === 0,
    `Output: ${purge1.output}`
  );

  recordTest(
    'Purge Idempotency',
    'First run strictly PRESERVES player_of_the_week_winners (zero deletions)',
    countWinnersAfter1 === countWinnersBefore,
    `Winners before: ${countWinnersBefore}, after: ${countWinnersAfter1}`
  );

  // Run 2 of purge_potw_weekly_cycle (idempotency)
  const purge2 = runPsqlSafe(`SELECT public.purge_potw_weekly_cycle();`);
  const countWinnersAfter2 = parseInt(runPsql(`SELECT count(*) FROM public.player_of_the_week_winners;`), 10);
  const isIdempotent = purge2.success && purge2.output.includes('"purged_votes": 0') && countWinnersAfter2 === countWinnersBefore;

  recordTest(
    'Purge Idempotency',
    'Second run is strictly idempotent (0 purged, no error, winners preserved)',
    isIdempotent,
    `Output: ${purge2.output}`
  );

  // Run 3 of purge_potw_weekly_cycle
  const purge3 = runPsqlSafe(`SELECT public.purge_potw_weekly_cycle();`);
  recordTest(
    'Purge Idempotency',
    'Third run confirms persistent stability across repeated calls',
    purge3.success && purge3.output.includes('"success": true')
  );

  runPsql(`DELETE FROM public.player_of_the_week_winners WHERE player_name = 'Historical Champion';`);

  // -------------------------------------------------------------------------
  // SUITE 4: RLS Security & Live Vote Tally Privacy
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 4: RLS Security & Live Vote Tally Privacy ---');

  // We test the intended policy by temporarily applying the safe enum syntax:
  runPsql(`
    DO $$ BEGIN
      DROP POLICY IF EXISTS "Restricted select on potw votes" ON public.player_of_the_week_votes;
      CREATE POLICY "Restricted select on potw votes"
      ON public.player_of_the_week_votes FOR SELECT
      TO anon, authenticated
      USING (
          EXISTS (
              SELECT 1 FROM public.profiles
              WHERE profiles.id = auth.uid() AND profiles.role::text IN ('admin', 'superadmin')
          )
          OR device_id = NULLIF(current_setting('request.headers', true)::json->>'x-device-id', '')::UUID
      );
    END $$;
  `);

  // Seed two votes from different devices
  runPsql(`
    INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
    VALUES 
      ('${testDev1}', '${p1}', '${comp1}', 1),
      ('${testDev2}', '${p2}', '${comp1}', 1);
  `);

  // 4.1 Anonymous request with NO x-device-id header
  const anonNoHeader = runPsqlSafe(`
    SET ROLE anon;
    SELECT count(*) FROM public.player_of_the_week_votes;
  `);
  const anonNoHeaderLines = anonNoHeader.output.split('\n').map((s) => s.trim()).filter(Boolean);
  const anonNoHeaderCount = anonNoHeaderLines[anonNoHeaderLines.length - 1];
  recordTest(
    'RLS Security',
    'Anonymous user with no x-device-id header sees 0 rows (live tallies hidden)',
    anonNoHeader.success && anonNoHeaderCount === '0',
    `Rows visible: ${anonNoHeaderCount}`
  );

  // 4.2 Anonymous request with Device 1 header
  const anonWithDev1 = runPsqlSafe(`
    SET ROLE anon;
    SET request.headers = '{"x-device-id": "${testDev1}"}';
    SELECT count(*), max(player_id::text) FROM public.player_of_the_week_votes;
  `);
  recordTest(
    'RLS Security',
    'Anonymous user with x-device-id header can ONLY see their own vote (1 row)',
    anonWithDev1.success && anonWithDev1.output.includes('1|' + p1),
    `Result: ${anonWithDev1.output.split('\n').filter(l => l.includes('|'))[0] || anonWithDev1.output}`
  );

  // 4.3 Anonymous request trying to query Device 2
  const anonQueryDev2 = runPsqlSafe(`
    SET ROLE anon;
    SET request.headers = '{"x-device-id": "${testDev1}"}';
    SELECT count(*) FROM public.player_of_the_week_votes WHERE device_id = '${testDev2}';
  `);
  const anonQueryDev2Lines = anonQueryDev2.output.split('\n').map((s) => s.trim()).filter(Boolean);
  const anonQueryDev2Count = anonQueryDev2Lines[anonQueryDev2Lines.length - 1];
  recordTest(
    'RLS Security',
    'Anonymous user CANNOT query or view other devices votes',
    anonQueryDev2.success && anonQueryDev2Count === '0',
    `Count: ${anonQueryDev2Count}`
  );

  // 4.4 Stress test: Malformed non-UUID x-device-id header
  const malformedHeader = runPsqlSafe(`
    SET ROLE anon;
    SET request.headers = '{"x-device-id": "hacker-input-string"}';
    SELECT count(*) FROM public.player_of_the_week_votes;
  `);
  const crashesOnBadUuid = !malformedHeader.success && malformedHeader.error?.includes('invalid input syntax for type uuid');
  recordTest(
    'RLS Security',
    'Adversarial Caveat: Malformed non-UUID header causes SQL 22P02 exception',
    crashesOnBadUuid,
    crashesOnBadUuid
      ? `CRASH CONFIRMED: ::UUID cast in policy throws: ${malformedHeader.error?.split('\n')[0]}`
      : `Output: ${malformedHeader.output}`
  );

  runPsql(`DELETE FROM public.player_of_the_week_votes WHERE device_id IN ('${testDev1}', '${testDev2}');`);

  // -------------------------------------------------------------------------
  // SUITE 5: fn_finalize_potw_winners Stress-Testing & Cartesian Analysis
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 5: fn_finalize_potw_winners Stress-Testing & Cartesian Analysis ---');

  // 5.1 Zero votes scenario
  const finalizeZero = runPsqlSafe(`SELECT public.fn_finalize_potw_winners(999, '${comp1}');`);
  recordTest(
    'Finalization Logic',
    'Zero votes returns graceful failure JSON',
    finalizeZero.success && finalizeZero.output.includes('"success": false'),
    `Output: ${finalizeZero.output}`
  );

  // 5.2 Clean vote finalization
  const devA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const devB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const devC = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  runPsql(`
    DELETE FROM public.player_of_the_week_votes WHERE matchweek = 100;
    DELETE FROM public.player_of_the_week_winners WHERE matchweek = 100;

    INSERT INTO public.man_of_the_match_nominations (fixture_id, player_id, team_id, competition_id)
    VALUES ('${fixture}', '${p1}', '${team}', '${comp1}')
    ON CONFLICT (fixture_id) DO UPDATE SET player_id = EXCLUDED.player_id;

    INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
    VALUES 
      ('${devA}', '${p1}', '${comp1}', 100),
      ('${devB}', '${p1}', '${comp1}', 100),
      ('${devC}', '${p2}', '${comp1}', 100);
  `);

  const finalizeClean = runPsqlSafe(`SELECT public.fn_finalize_potw_winners(100, '${comp1}');`);
  const cleanPass = finalizeClean.success && finalizeClean.output.includes(p1) && finalizeClean.output.includes('"vote_count": 2');
  recordTest(
    'Finalization Logic',
    'Clean voting correctly crowns P1 with 2 votes (66.7% share)',
    cleanPass,
    `Result: ${finalizeClean.output}`
  );

  // 5.3 Idempotency of finalization
  const finalizeIdempotent = runPsqlSafe(`SELECT public.fn_finalize_potw_winners(100, '${comp1}');`);
  recordTest(
    'Finalization Logic',
    'fn_finalize_potw_winners is idempotent (ON CONFLICT DO UPDATE succeeds without duplicate error)',
    finalizeIdempotent.success && finalizeIdempotent.output.includes('"success": true'),
    `Result: ${finalizeIdempotent.output}`
  );

  // 5.4 CRITICAL ADVERSARIAL STRESS TEST: CARTESIAN DUPLICATION IN fn_finalize_potw_winners
  // Requirement R2 states: "Weekend (Saturday & Sunday) MOTM nominees are sampled and condensed by player UID
  // (if a player receives multiple nominations in one weekend, they appear only once on the ballot)."
  // Suppose Player 1 played in TWO fixtures over the weekend and was nominated in BOTH!
  const fixturesList = runPsql(`SELECT id FROM public.fixtures LIMIT 2;`).split('\n').filter(Boolean);
  const devD = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const devE = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

  if (fixturesList.length >= 2) {
    runPsql(`
      DELETE FROM public.player_of_the_week_votes WHERE matchweek = 101;
      DELETE FROM public.player_of_the_week_winners WHERE matchweek = 101;

      -- Player 1 gets 2 nominations (two different fixtures in same competition)
      INSERT INTO public.man_of_the_match_nominations (fixture_id, player_id, team_id, competition_id)
      VALUES 
        ('${fixturesList[0]}', '${p1}', '${team}', '${comp1}'),
        ('${fixturesList[1]}', '${p1}', '${team}', '${comp1}')
      ON CONFLICT (fixture_id) DO UPDATE SET player_id = EXCLUDED.player_id;

      -- Real fan votes:
      -- Player 1 gets 2 votes (devA, devB)
      -- Player 2 gets 3 votes (devC, devD, devE)
      -- PLAYER 2 MUST WIN! (3 votes > 2 votes)
      INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek)
      VALUES 
        ('${devA}', '${p1}', '${comp1}', 101),
        ('${devB}', '${p1}', '${comp1}', 101),
        ('${devC}', '${p2}', '${comp1}', 101),
        ('${devD}', '${p2}', '${comp1}', 101),
        ('${devE}', '${p2}', '${comp1}', 101);
    `);

    const cartesianRes = runPsqlSafe(`SELECT public.fn_finalize_potw_winners(101, '${comp1}');`);
    const parsed = JSON.parse(cartesianRes.output);

    // If Cartesian bug exists, Player 1 was awarded 4 votes (2 votes * 2 nominations) and crowned winner over Player 2!
    const isCartesianBugConfirmed = parsed.winner_player_id === p1 && parsed.vote_count === 4;

    recordTest(
      'Finalization Logic',
      'Adversarial Bug: LEFT JOIN with multiple nominations causes Cartesian vote multiplication',
      !isCartesianBugConfirmed,
      isCartesianBugConfirmed
        ? `CARTESIAN VOTE MULTIPLICATION BUG CONFIRMED: Player 1 had 2 real votes, but because of 2 MOTM nominations, candidate_votes was doubled to 4, falsely defeating Player 2 who had 3 real votes! (Winner: ${parsed.winner_player_id}, Votes: ${parsed.vote_count})`
        : `Legitimate winner crowned: ${parsed.winner_player_id} with ${parsed.vote_count} votes.`
    );
  }

  // Clean test records
  runPsql(`
    DELETE FROM public.player_of_the_week_votes WHERE matchweek IN (100, 101);
    DELETE FROM public.player_of_the_week_winners WHERE matchweek IN (100, 101);
    DELETE FROM public.man_of_the_match_nominations WHERE fixture_id IN ('${fixturesList.join("','")}');
  `);

  // -------------------------------------------------------------------------
  // SUITE 6: RPC has_device_voted_potw
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 6: RPC has_device_voted_potw ---');

  const checkBefore = runPsql(`SELECT public.has_device_voted_potw('${testDev1}', '${comp1}', 5);`);
  runPsql(`INSERT INTO public.player_of_the_week_votes (device_id, player_id, competition_id, matchweek) VALUES ('${testDev1}', '${p1}', '${comp1}', 5);`);
  const checkAfter = runPsql(`SELECT public.has_device_voted_potw('${testDev1}', '${comp1}', 5);`);
  const checkDifferentWeek = runPsql(`SELECT public.has_device_voted_potw('${testDev1}', '${comp1}', 6);`);
  const checkDifferentComp = runPsql(`SELECT public.has_device_voted_potw('${testDev1}', '${comp2}', 5);`);

  runPsql(`DELETE FROM public.player_of_the_week_votes WHERE device_id = '${testDev1}';`);

  recordTest(
    'RPC Helper',
    'has_device_voted_potw returns false before vote and true after vote',
    checkBefore === 'f' && checkAfter === 't',
    `Before: ${checkBefore}, After: ${checkAfter}`
  );

  recordTest(
    'RPC Helper',
    'has_device_voted_potw isolates by matchweek and competition',
    checkDifferentWeek === 'f' && checkDifferentComp === 'f',
    `Different week: ${checkDifferentWeek}, Different comp: ${checkDifferentComp}`
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                      VERIFICATION SUMMARY                      ');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total tests:  ${total}`);
  console.log(`Passed:       ${passed}`);
  console.log(`Failed:       ${failed}`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter((r) => !r.passed).forEach((f) => {
      console.log(`  - [${f.suite}] ${f.test}`);
      if (f.details) console.log(`    Details: ${f.details}`);
      if (f.error) console.log(`    Error: ${f.error}`);
    });
  }
}

runSuite().catch(console.error);
