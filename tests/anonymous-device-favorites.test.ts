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

  console.log('\n======================================================');
  console.log('🎉 ALL ANONYMOUS DEVICE FAVORITES TESTS PASSED! 🎉');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
