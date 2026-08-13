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
});
