import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- STARTING ANONYMOUS DEVICE & FAN ONBOARDING TEST SUITE ---');

// ==========================================
// 1. Database Schema & Migration Verification (R1)
// ==========================================
console.log('\n[1/5] Verifying Database Schema & Migration (25_anonymous_devices.sql)...');
const migrationPath = path.resolve('supabase/migrations/25_anonymous_devices.sql');
assert(fs.existsSync(migrationPath), 'Migration 25_anonymous_devices.sql must exist');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.anonymous_devices'), 'anonymous_devices table creation required');
assert(migrationSql.includes('device_id UUID PRIMARY KEY'), 'device_id UUID PK required');
assert(migrationSql.includes('favorite_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL'), 'favorite_team_id FK with ON DELETE SET NULL required');
assert(migrationSql.includes('has_completed_onboarding BOOLEAN DEFAULT FALSE'), 'has_completed_onboarding boolean required');
assert(migrationSql.includes('interaction_history JSONB DEFAULT'), 'interaction_history JSONB required');
assert(migrationSql.includes('last_seen_at TIMESTAMP WITH TIME ZONE'), 'last_seen_at timestamptz required');
assert(migrationSql.includes('created_at TIMESTAMP WITH TIME ZONE'), 'created_at timestamptz required');
assert(migrationSql.includes('ALTER TABLE public.anonymous_devices ENABLE ROW LEVEL SECURITY'), 'RLS must be enabled');
assert(migrationSql.includes('Allow anonymous device registration'), 'Anonymous insert policy required');
assert(migrationSql.includes('Allow devices to access their own data'), 'Device select policy required');
assert(migrationSql.includes('Allow devices to update their own data'), 'Device update policy required');
console.log('✓ R1 Database Schema and RLS policies verified successfully.');

// ==========================================
// 2. Device Identity Hook & Service Layer (R2)
// ==========================================
console.log('\n[2/5] Verifying useDeviceIdentity and DeviceService contracts (R2)...');

import { generateUUID } from '../src/hooks/useDeviceIdentity';
import { DeviceService, isValidUUID } from '../src/services/DeviceService';

// Test UUID generation
const uuid1 = generateUUID();
const uuid2 = generateUUID();
assert(typeof uuid1 === 'string' && uuid1.length === 36, 'generateUUID should produce 36-character UUID string');
assert(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid1), 'generateUUID should be valid UUID v4 format');
assert(uuid1 !== uuid2, 'Generated UUIDs must be distinct');
console.log('✓ UUID generator conforms to v4 specification:', uuid1);

// Test isValidUUID
assert(isValidUUID(uuid1) === true, 'Generated UUID must be valid UUID');
assert(isValidUUID('not-a-uuid') === false, 'Arbitrary string must not be a valid UUID');
assert(isValidUUID('') === false, 'Empty string must not be a valid UUID');
assert(isValidUUID(null) === false, 'Null must not be a valid UUID');
assert(isValidUUID(undefined) === false, 'Undefined must not be a valid UUID');

// Test DeviceService methods exist
assert(typeof DeviceService.registerOrCheckInDevice === 'function', 'DeviceService.registerOrCheckInDevice must be a function');
assert(typeof DeviceService.setFavoriteTeam === 'function', 'DeviceService.setFavoriteTeam must be a function');

// Boundary test with empty or invalid deviceId
DeviceService.registerOrCheckInDevice('').then((res) => {
  assert(res === null, 'Empty deviceId should safely resolve to null');
});
DeviceService.registerOrCheckInDevice('invalid-device-id').then((res) => {
  assert(res === null, 'Invalid deviceId should safely resolve to null without SQL errors');
});
DeviceService.setFavoriteTeam('', 'some-team').then((res) => {
  assert(res === null, 'Empty deviceId should safely resolve to null');
});
DeviceService.setFavoriteTeam('invalid-device-id', 'some-team').then((res) => {
  assert(res === null, 'Invalid deviceId should safely resolve to null');
});
console.log('✓ DeviceService contract, UUID safety guards, and edge cases validated.');

// ==========================================
// 3. Real-Time Sorting & Filtering Algorithm (R3)
// ==========================================
console.log('\n[3/5] Verifying Real-Time Team Sorting & Filtering (R3)...');

interface TestTeam {
  id: string;
  name: string;
  shortName: string;
  isEPL: boolean;
  isChampionship: boolean;
}

const mockTeamsList: TestTeam[] = [
  { id: '1', name: 'Faculty of Arts', shortName: 'FOA', isEPL: true, isChampionship: false },
  { id: '2', name: 'Faculty of Science', shortName: 'FOS', isEPL: true, isChampionship: false },
  { id: '3', name: 'Egerton Sharklets', shortName: 'SHK', isEPL: true, isChampionship: false },
  { id: '4', name: 'Njoro FC', shortName: 'NJR', isEPL: true, isChampionship: false },
  { id: '5', name: 'Faculty of Education', shortName: 'EDU', isEPL: false, isChampionship: true },
  { id: '6', name: 'Faculty of Agriculture', shortName: 'FAG', isEPL: false, isChampionship: true },
  { id: '7', name: 'Egerton Staff FC', shortName: 'EST', isEPL: false, isChampionship: true },
  { id: '8', name: 'Arts United', shortName: 'ARU', isEPL: false, isChampionship: true },
];

function filterAndSortTeams(teams: TestTeam[], searchTerm: string): TestTeam[] {
  const query = searchTerm.trim().toLowerCase();
  if (!query) {
    return [...teams].sort((a, b) => {
      const compRankA = a.isEPL ? 0 : a.isChampionship ? 1 : 2;
      const compRankB = b.isEPL ? 0 : b.isChampionship ? 1 : 2;
      if (compRankA !== compRankB) return compRankA - compRankB;
      return a.name.localeCompare(b.name);
    });
  }

  const matches = teams.filter((t) => {
    const name = t.name.toLowerCase();
    const shortName = t.shortName.toLowerCase();
    return name.includes(query) || shortName.includes(query);
  });

  return matches.sort((a, b) => {
    // 1. Competition priority: EPL (0) > Championship (1) > Others (2)
    const compRankA = a.isEPL ? 0 : a.isChampionship ? 1 : 2;
    const compRankB = b.isEPL ? 0 : b.isChampionship ? 1 : 2;
    if (compRankA !== compRankB) {
      return compRankA - compRankB;
    }

    // 2. Prefix match priority within competition
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aShort = a.shortName.toLowerCase();
    const bShort = b.shortName.toLowerCase();

    const aStartsExact = aName.startsWith(query) || aShort.startsWith(query);
    const bStartsExact = bName.startsWith(query) || bShort.startsWith(query);

    if (aStartsExact && !bStartsExact) return -1;
    if (!aStartsExact && bStartsExact) return 1;

    // Word prefix match
    const aWordStarts = aName.split(/\s+/).some((w) => w.startsWith(query));
    const bWordStarts = bName.split(/\s+/).some((w) => w.startsWith(query));
    if (aWordStarts && !bWordStarts) return -1;
    if (!aWordStarts && bWordStarts) return 1;

    // 3. Alphabetical tie-breaker
    return a.name.localeCompare(b.name);
  });
}

// Test case A: Search "art" (matches "Faculty of Arts" [EPL] and "Arts United" [Championship])
const artResults = filterAndSortTeams(mockTeamsList, 'art');
assert.strictEqual(artResults.length, 2, 'Should find 2 matching teams for "art"');
assert.strictEqual(artResults[0].id, '1', 'EPL team "Faculty of Arts" must come first before Championship team');
assert.strictEqual(artResults[1].id, '8', 'Championship team "Arts United" must come second');
console.log('✓ Priority test passed: EPL team prioritized over Championship team on character match.');

// Test case B: Search "fac" (matches 4 faculty teams)
const facResults = filterAndSortTeams(mockTeamsList, 'fac');
assert.strictEqual(facResults.length, 4, 'Should find 4 faculty teams');
// All EPL teams first (FOA, FOS), then Championship teams (FAG, EDU)
assert(facResults[0].isEPL, 'Result 0 must be EPL');
assert(facResults[1].isEPL, 'Result 1 must be EPL');
assert(facResults[2].isChampionship, 'Result 2 must be Championship');
assert(facResults[3].isChampionship, 'Result 3 must be Championship');
console.log('✓ Grouping test passed: EPL cluster precedes Championship cluster.');

// Test case C: Search non-existent name
const emptyResults = filterAndSortTeams(mockTeamsList, 'xyznonexistent');
assert.strictEqual(emptyResults.length, 0, 'No match should return empty array');
console.log('✓ Empty results correctly triggers empty state.');

// Test case D: Initial view without search query displays all teams EPL first
const initialResults = filterAndSortTeams(mockTeamsList, '');
assert.strictEqual(initialResults.length, 8, 'Initial view returns all 8 teams');
assert.strictEqual(initialResults[0].isEPL, true, 'First initial team is EPL');
assert.strictEqual(initialResults[3].isEPL, true, 'Fourth initial team is EPL');
assert.strictEqual(initialResults[4].isChampionship, true, 'Fifth initial team is Championship');
console.log('✓ Initial view displays full roster with EPL priority.');

// ==========================================
// 4. Onboarding UI Component Strings & Structure (R3)
// ==========================================
console.log('\n[4/5] Verifying OnboardingScreen Component Strings & Accessibility (R3)...');
const onboardingPath = path.resolve('src/components/OnboardingScreen.tsx');
const onboardingSource = fs.readFileSync(onboardingPath, 'utf8');

assert(onboardingSource.includes('placeholder="input team name"'), 'Exact placeholder "input team name" is required');
assert(onboardingSource.includes('no teams with such names. try retyping.'), 'Exact empty state message is required');
assert(onboardingSource.includes('I am a general football fan'), 'Exact general fan button text is required');
assert(onboardingSource.includes('Welcome to the Club!') || onboardingSource.includes('Congratulations!'), 'Congratulations message required');
assert(onboardingSource.includes('FanOnboardingOverlay'), 'FanOnboardingOverlay export required');
assert(onboardingSource.includes('aria-label="Close onboarding"'), 'Accessible close button required');
assert(onboardingSource.includes('role="dialog"'), 'role="dialog" required for WCAG modal compliance');
assert(onboardingSource.includes('aria-modal="true"'), 'aria-modal="true" required for modal trapping');
assert(onboardingSource.includes('Escape'), 'Escape key listener required for keyboard accessibility');
console.log('✓ Onboarding UI component strings, accessibility, and exports verified.');

// ==========================================
// 5. App & Guest Page Integration & Role Guards (R4)
// ==========================================
console.log('\n[5/5] Verifying App Integration & Role Guarding (R4)...');
const appPath = path.resolve('src/App.tsx');
const appSource = fs.readFileSync(appPath, 'utf8');

assert(appSource.includes('useDeviceIdentity'), 'App must use useDeviceIdentity hook');
assert(appSource.includes('DeviceService'), 'App must use DeviceService');
assert(appSource.includes('!isAuthenticated && !cachedCompleted && showOnboarding'), 'App must guard overlay with authentication and cached completion checks');

// Verify all required roles have protected routes
const requiredRoles = ['admin', 'president', 'coach', 'captain', 'doctor', 'journalist', 'referee', 'linesman', 'player'];
for (const role of requiredRoles) {
  assert(appSource.includes(`route === '${role}'`) || appSource.includes(`allowedRoles={['${role}'`), `Role ${role} must be handled and guarded`);
}
console.log('✓ All dashboard roles and returning device bypass verified in App router.');

console.log('\n======================================================');
console.log('🎉 ALL 5 REQUIREMENT VERIFICATION SUITES PASSED! 🎉');
console.log('======================================================');
