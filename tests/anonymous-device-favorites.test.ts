import assert from 'node:assert';
import { DeviceService, isValidUUID } from '../src/services/DeviceService';

console.log('--- TESTING ANONYMOUS DEVICE FAVORITES & PERSISTENCE ---');

// Mock localStorage in Node environment
const mockStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, val: string) => mockStorage.set(key, String(val)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

async function runTests() {
  const deviceId = 'a1b2c3d4-e5f6-4a1b-8c2d-e3f4a5b6c7d8';
  assert(isValidUUID(deviceId), 'Device ID must be valid UUID');

  // Test 1: Initially favorites list is empty
  const initialFavs = await DeviceService.getFavoriteMatches(deviceId);
  assert(Array.isArray(initialFavs), 'Favorites must be an array');
  assert.strictEqual(initialFavs.length, 0, 'Initial favorites must be empty');
  console.log('✓ Initial favorites is empty array');

  // Test 2: Add match 1 as favorite
  const match1 = '11111111-2222-3333-4444-555555555555';
  const afterAdd1 = await DeviceService.toggleFavoriteMatch(deviceId, match1);
  assert.strictEqual(afterAdd1.length, 1, 'Should have 1 favorite');
  assert(afterAdd1.includes(match1), 'Should include match1');
  console.log('✓ Added match1 to favorites');

  // Test 3: Add match 2 as favorite
  const match2 = '22222222-3333-4444-5555-666666666666';
  const afterAdd2 = await DeviceService.toggleFavoriteMatch(deviceId, match2);
  assert.strictEqual(afterAdd2.length, 2, 'Should have 2 favorites');
  assert(afterAdd2.includes(match1), 'Should still include match1');
  assert(afterAdd2.includes(match2), 'Should include match2');
  console.log('✓ Added match2 to favorites');

  // Test 4: Verify localStorage persistence
  const savedInLocal = JSON.parse(mockStorage.get(`esn_device_favorites_${deviceId}`) || '[]');
  assert.strictEqual(savedInLocal.length, 2, 'LocalStorage must have 2 favorites');
  assert(savedInLocal.includes(match1) && savedInLocal.includes(match2), 'LocalStorage must match');
  console.log('✓ Verified local storage synchronization for anonymous device');

  // Test 5: Toggle match 1 to remove it
  const afterRemove1 = await DeviceService.toggleFavoriteMatch(deviceId, match1);
  assert.strictEqual(afterRemove1.length, 1, 'Should have 1 favorite after removing match1');
  assert(!afterRemove1.includes(match1), 'match1 should be removed');
  assert(afterRemove1.includes(match2), 'match2 should remain');
  console.log('✓ Toggled match1 off from favorites');

  // Test 6: Set favorites directly
  const customList = [match1, match2, '33333333-4444-5555-6666-777777777777'];
  const directSet = await DeviceService.setFavoriteMatches(deviceId, customList);
  assert.strictEqual(directSet.length, 3, 'Should set 3 favorites directly');
  console.log('✓ Direct setFavoriteMatches verified');

  // Test 7: Complete onboarding
  const completeRes = await DeviceService.completeOnboarding(deviceId, null);
  console.log('✓ completeOnboarding callable without errors');

  // Test 8: Deduplication test
  const duplicateList = [match1, match1, match2, match1, match2];
  const deduplicated = await DeviceService.setFavoriteMatches(deviceId, duplicateList);
  assert.strictEqual(deduplicated.length, 2, 'Duplicates must be stripped');
  console.log('✓ Strict deduplication verified: no match can be registered twice');

  // Test 9: Matchday Completion Reset / Pruning
  const md3_match1 = '33333333-0001-4000-8000-000000000001';
  const md3_match2 = '33333333-0002-4000-8000-000000000002';
  const md4_match1 = '44444444-0001-4000-8000-000000000001';
  const md4_match2 = '44444444-0002-4000-8000-000000000002';

  // Device favorites md3_match1 (Matchday 3) and md4_match1 (Matchday 4)
  await DeviceService.setFavoriteMatches(deviceId, [md3_match1, md4_match1]);

  // Fixtures dataset where all Matchday 3 matches are finished (FT),
  // while Matchday 4 matches are still UPCOMING
  const fixturesState = [
    { id: md3_match1, status: 'FT', matchday: 3 },
    { id: md3_match2, status: 'FT', matchday: 3 },
    { id: md4_match1, status: 'UPCOMING', matchday: 4 },
    { id: md4_match2, status: 'UPCOMING', matchday: 4 },
  ];

  const prunedList = await DeviceService.pruneCompletedMatchdayFavorites(deviceId, fixturesState as any);
  assert.strictEqual(prunedList.includes(md3_match1), false, 'Matchday 3 favorite must be reset/cleared when matchday 3 is over');
  assert.strictEqual(prunedList.includes(md4_match1), true, 'Future Matchday 4 favorite must remain untouched');
  console.log('✓ Matchday reset verified: completed matchdays clear while future matchdays remain untouched');

  // Test 10: If a matchday is still ongoing (e.g. 1 match FT, 1 match LIVE), favorites in that matchday are NOT cleared
  const ongoingMd5_match1 = '55555555-0001-4000-8000-000000000001';
  const ongoingMd5_match2 = '55555555-0002-4000-8000-000000000002';
  await DeviceService.setFavoriteMatches(deviceId, [ongoingMd5_match1]);

  const ongoingFixtures = [
    { id: ongoingMd5_match1, status: 'FT', matchday: 5 },
    { id: ongoingMd5_match2, status: 'LIVE', matchday: 5 }, // Matchday 5 is still ongoing!
  ];

  const ongoingPruned = await DeviceService.pruneCompletedMatchdayFavorites(deviceId, ongoingFixtures as any);
  assert.strictEqual(ongoingPruned.includes(ongoingMd5_match1), true, 'Ongoing matchday favorites must NOT clear until entire matchday is over');
  console.log('✓ Ongoing matchday verification: favorites remain until entire matchday has concluded');

  console.log('\n======================================================');
  console.log('🎉 ALL ANONYMOUS DEVICE FAVORITES TESTS PASSED! 🎉');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
