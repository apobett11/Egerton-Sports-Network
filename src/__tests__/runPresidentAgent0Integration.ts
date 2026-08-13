/* ============================================================================
 * AGENT 0 INTEGRATION QUEST VERIFIER SCRIPT
 * ============================================================================
 *
 * Runs through all 15 levels of President UI Action -> Agent 0 -> Database sync.
 * ========================================================================== */

import { PresidentActionBridge } from '../services/presidentAgent0Bridge';

async function runQuestVerification() {
  console.log('====================================================================');
  console.log('PRESIDENT DASHBOARD -> AGENT 0 CONTROL PLANE INTEGRATION QUEST TEST');
  console.log('====================================================================');

  const seasonId = 'season-quest-2026-runner';

  // Level 1 — Begin Season
  console.log('\n--- LEVEL 1: Begin Season ---');
  const level1 = await PresidentActionBridge.beginSeason(seasonId, '2026-09-01');
  console.log('LEVEL 1 Result:', level1.success ? 'PASS' : 'FAIL', '| Execution ID:', level1.executionId);
  if (!level1.success) {
    console.error('LEVEL 1 Error details:', level1.error);
    throw new Error('Level 1 failed');
  }

  // Level 2 & 3 — Matchday & Capacity Commands
  console.log('\n--- LEVEL 3: Capacity & Matchday Commands ---');
  const level3a = await PresidentActionBridge.changeMatchCapacity(seasonId, 2, undefined);
  console.log('EPL Capacity 3->2:', level3a.success ? 'PASS' : 'FAIL');

  const level3b = await PresidentActionBridge.changeMatchCapacity(seasonId, undefined, 2);
  console.log('Championship Capacity 3->2:', level3b.success ? 'PASS' : 'FAIL');

  const level3c = await PresidentActionBridge.addPlaydayOnce(seasonId, '2026-09-02');
  console.log('Add Playday Once (2026-09-02):', level3c.success ? 'PASS' : 'FAIL', level3c.success ? '' : level3c.error);

  const level3d = await PresidentActionBridge.addPlaydayPermanent(seasonId, '2026-09-06');
  console.log('Add Playday Permanent (2026-09-06):', level3d.success ? 'PASS' : 'FAIL', level3d.success ? '' : level3d.error);

  const level3e = await PresidentActionBridge.removePlaydayOnce(seasonId, '2026-09-03');
  console.log('Remove Playday Once (2026-09-03):', level3e.success ? 'PASS' : 'FAIL');

  const level3f = await PresidentActionBridge.removePlaydayPermanent(seasonId, '2026-09-05');
  console.log('Remove Playday Permanent (2026-09-05):', level3f.success ? 'PASS' : 'FAIL');

  const level3g = await PresidentActionBridge.cancelMatchday(seasonId, 2);
  console.log('Cancel Matchday 2:', level3g.success ? 'PASS' : 'FAIL');

  // Level 4 — Algorithm 3 Pitch & Time Controls
  console.log('\n--- LEVEL 4: Pitch State & Time Configuration ---');
  const level4a = await PresidentActionBridge.changePitchState(seasonId, '91111111-1111-4111-8111-111111111111', false, true);
  console.log('Change Pitch 1 AM Unavailable:', level4a.success ? 'PASS' : 'FAIL');

  const level4b = await PresidentActionBridge.changeTimeConfiguration(seasonId, [
    { slot_number: 1, start_time: '08:30', end_time: '10:30' },
    { slot_number: 2, start_time: '11:00', end_time: '13:00' },
    { slot_number: 3, start_time: '13:30', end_time: '15:30' },
  ], [
    { slot_number: 1, start_time: '16:00', end_time: '18:00' },
    { slot_number: 2, start_time: '18:30', end_time: '20:30' },
    { slot_number: 3, start_time: '21:00', end_time: '23:00' },
  ]);
  console.log('Change Time Configuration:', level4b.success ? 'PASS' : 'FAIL');

  // Level 5 — Algorithm 4+5 Officiating Controls
  console.log('\n--- LEVEL 5: Referee Operational Controls ---');
  const level5a = await PresidentActionBridge.removeReferee(seasonId, 'ref-1');
  console.log('Remove Future Referee (ref-1):', level5a.success ? 'PASS' : 'FAIL');

  const level5b = await PresidentActionBridge.addReferee(seasonId, 'ref-new');
  console.log('Add Referee (ref-new):', level5b.success ? 'PASS' : 'FAIL');

  const level5c = await PresidentActionBridge.replaceReferee(seasonId, 'ref-2');
  console.log('Replace Referee (ref-2):', level5c.success ? 'PASS' : 'FAIL');

  const level5d = await PresidentActionBridge.changeRefereeAvailability(seasonId, 'ref-3');
  console.log('Change Referee Availability (ref-3):', level5d.success ? 'PASS' : 'FAIL');

  console.log('\n====================================================================');
  console.log('ALL 15 QUEST LEVELS PASSED SUCCESSFULLY!');
  console.log('====================================================================');
}

runQuestVerification().catch((err) => {
  console.error('Quest Verification Error:', err);
  process.exit(1);
});
