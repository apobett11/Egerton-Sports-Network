/* ============================================================================
 * PRESIDENT DASHBOARD — AGENT 0 INTEGRATION QUEST TEST SUITE
 * ============================================================================
 *
 * Tests the 15 Quest Levels of President Action -> Agent 0 -> Algorithm routing -> Database sync
 * WITHOUT modifying any algorithm code or protocols.
 * ========================================================================== */

import { PresidentActionBridge } from '../services/presidentAgent0Bridge';

describe('President Action Service to Agent 0 Integration Suite', () => {
  const seasonId = 'season-quest-2026';

  test('LEVEL 1: Begin Season via Agent 0', async () => {
    const res = await PresidentActionBridge.beginSeason(seasonId, '2026-03-02');
    expect(res.success).toBe(true);
    expect(res.executionId).toBeDefined();
    expect(res.algorithms.algorithm1?.used).toBe(true);
    expect(res.algorithms.algorithm2?.used).toBe(true);
    expect(res.algorithms.algorithm3?.used).toBe(true);
    expect(res.algorithms.algorithm45?.used).toBe(true);
  });

  test('LEVEL 3: Change EPL Capacity via Agent 0', async () => {
    const res = await PresidentActionBridge.changeMatchCapacity(seasonId, 2, undefined);
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm2?.used).toBe(true);
  });

  test('LEVEL 3: Change Championship Capacity via Agent 0', async () => {
    const res = await PresidentActionBridge.changeMatchCapacity(seasonId, undefined, 2);
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm2?.used).toBe(true);
  });

  test('LEVEL 3: Add One-Time Playday via Agent 0', async () => {
    const res = await PresidentActionBridge.addPlaydayOnce(seasonId, '2026-03-04');
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm2?.used).toBe(true);
  });

  test('LEVEL 3: Add Permanent Playday via Agent 0', async () => {
    const res = await PresidentActionBridge.addPlaydayPermanent(seasonId, '2026-03-05');
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm2?.used).toBe(true);
  });

  test('LEVEL 3: Remove One-Time Playday via Agent 0', async () => {
    const res = await PresidentActionBridge.removePlaydayOnce(seasonId, '2026-03-04');
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm2?.used).toBe(true);
  });

  test('LEVEL 3: Remove Permanent Playday via Agent 0', async () => {
    const res = await PresidentActionBridge.removePlaydayPermanent(seasonId, '2026-03-05');
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm2?.used).toBe(true);
  });

  test('LEVEL 3: Cancel Matchday via Agent 0', async () => {
    const res = await PresidentActionBridge.cancelMatchday(seasonId, 2);
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm2?.used).toBe(true);
  });

  test('LEVEL 4: Change Pitch State via Agent 0', async () => {
    const res = await PresidentActionBridge.changePitchState(seasonId, 'pitch-1', false, true);
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm3?.used).toBe(true);
  });

  test('LEVEL 4: Change Time Configuration via Agent 0', async () => {
    const res = await PresidentActionBridge.changeTimeConfiguration(seasonId, [
      { slot_number: 1, start_time: '10:00', end_time: '12:00' },
      { slot_number: 2, start_time: '12:30', end_time: '14:30' },
      { slot_number: 3, start_time: '15:00', end_time: '17:00' },
    ]);
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm3?.used).toBe(true);
  });

  test('LEVEL 5: Remove Referee via Agent 0', async () => {
    const res = await PresidentActionBridge.removeReferee(seasonId, 'ref-1');
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm45?.used).toBe(true);
  });

  test('LEVEL 5: Add Referee via Agent 0', async () => {
    const res = await PresidentActionBridge.addReferee(seasonId, 'ref-new');
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm45?.used).toBe(true);
  });

  test('LEVEL 5: Replace Referee via Agent 0', async () => {
    const res = await PresidentActionBridge.replaceReferee(seasonId, 'ref-2');
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm45?.used).toBe(true);
  });

  test('LEVEL 5: Change Referee Availability via Agent 0', async () => {
    const res = await PresidentActionBridge.changeRefereeAvailability(seasonId, 'ref-3');
    expect(res.success).toBe(true);
    expect(res.algorithms.algorithm45?.used).toBe(true);
  });

  test('ALGORITHM 1 & AGENT 0: UID Handover, Pure Match Generation, Verification, Frontend Preview & DB Lock', async () => {
    const EPL_LEAGUE_UID = '11111111-1111-1111-1111-111111111111';
    const CHAMP_LEAGUE_UID = '22222222-2222-2222-2222-222222222222';

    // 10 EPL Team UIDs
    const eplTeamUIDs = [
      'e0000001-0000-4000-8000-000000000001',
      'e0000002-0000-4000-8000-000000000002',
      'e0000003-0000-4000-8000-000000000003',
      'e0000004-0000-4000-8000-000000000004',
      'e0000005-0000-4000-8000-000000000005',
      'e0000006-0000-4000-8000-000000000006',
      'e0000007-0000-4000-8000-000000000007',
      'e0000008-0000-4000-8000-000000000008',
      'e0000009-0000-4000-8000-000000000009',
      'e0000010-0000-4000-8000-000000000010',
    ];

    // 13 Championship Team UIDs
    const champTeamUIDs = [
      'c0000001-0000-4000-8000-000000000001',
      'c0000002-0000-4000-8000-000000000002',
      'c0000003-0000-4000-8000-000000000003',
      'c0000004-0000-4000-8000-000000000004',
      'c0000005-0000-4000-8000-000000000005',
      'c0000006-0000-4000-8000-000000000006',
      'c0000007-0000-4000-8000-000000000007',
      'c0000008-0000-4000-8000-000000000008',
      'c0000009-0000-4000-8000-000000000009',
      'c0000010-0000-4000-8000-000000000010',
      'c0000011-0000-4000-8000-000000000011',
      'c0000012-0000-4000-8000-000000000012',
      'c0000013-0000-4000-8000-000000000013',
    ];

    const leaguesInput = [
      { league_id: EPL_LEAGUE_UID, teams: eplTeamUIDs },
      { league_id: CHAMP_LEAGUE_UID, teams: champTeamUIDs },
    ];

    // Step 1: Agent 0 takes UIDs of leagues and teams, invokes Algorithm 1
    const genRes = await PresidentActionBridge.generateFixturesViaAgent0(seasonId, leaguesInput);

    expect(genRes.success).toBe(true);
    expect(genRes.executionId).toBeDefined();
    expect(genRes.generatedResult).toBeDefined();
    expect(genRes.generatedResult.status).toBe('success');

    // Verify Algorithm 1 generates pure matches ONLY (team A and team B, no ref, no time)
    const eplData = genRes.generatedResult.data[EPL_LEAGUE_UID];
    const champData = genRes.generatedResult.data[CHAMP_LEAGUE_UID];

    expect(eplData).toBeDefined();
    expect(champData).toBeDefined();

    // 10 teams -> 45 Leg 1, 45 Leg 2 = 90 total matches
    expect(eplData.leg_1.length).toBe(45);
    expect(eplData.leg_2.length).toBe(45);

    // 13 teams -> 78 Leg 1, 78 Leg 2 = 156 total matches
    expect(champData.leg_1.length).toBe(78);
    expect(champData.leg_2.length).toBe(78);

    // Pure match structure check
    for (const match of [...eplData.leg_1, ...eplData.leg_2]) {
      expect(match.home_id).toBeDefined();
      expect(match.away_id).toBeDefined();
      expect(match.home_id).not.toBe(match.away_id);
      expect((match as any).center_referee_id).toBeUndefined();
      expect((match as any).pitch_id).toBeUndefined();
      expect((match as any).start_time).toBeUndefined();
    }

    // Step 2: Confirm and Lock to Database via Agent 0
    const lockRes = await PresidentActionBridge.confirmAndLockViaAgent0(
      seasonId,
      genRes.executionId,
      genRes.generatedResult
    );

    expect(lockRes.success).toBe(true);
    expect(lockRes.count).toBe(246);
    expect(lockRes.eplCount).toBe(90);
    expect(lockRes.champCount).toBe(156);
    expect(lockRes.reReadVerified).toBe(true);
  });
});
