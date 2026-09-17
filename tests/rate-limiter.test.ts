import { rateLimiter, classifyRequestScope, rateLimitedFetch, RateLimitError } from '../src/lib/rateLimiter.ts';

async function runTests() {
  console.log('🧪 Starting Universal Rate Limiter Verification Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failed++;
    }
  }

  // 1. Classification Tests
  console.log('\n--- 1. Scope Classification Tests ---');
  assert(classifyRequestScope('https://hizfgvgbsguhduxortrx.supabase.co/rest/v1/players') === 'dashboard-doctor' || classifyRequestScope('https://hizfgvgbsguhduxortrx.supabase.co/rest/v1/injuries') === 'dashboard-doctor', 'Doctor scope classified');
  assert(classifyRequestScope('https://hizfgvgbsguhduxortrx.supabase.co/rest/v1/news_articles') === 'dashboard-journalist', 'Journalist scope classified');
  assert(classifyRequestScope('https://hizfgvgbsguhduxortrx.supabase.co/rest/v1/pitches') === 'dashboard-president', 'President scope classified');
  assert(classifyRequestScope('https://hizfgvgbsguhduxortrx.supabase.co/rest/v1/match_events') === 'dashboard-referee', 'Referee scope classified');
  assert(classifyRequestScope('https://hizfgvgbsguhduxortrx.supabase.co/rest/v1/temporary_match_squad') === 'dashboard-team', 'Team scope classified');
  assert(classifyRequestScope('https://hizfgvgbsguhduxortrx.supabase.co/functions/v1/admin-2fa') === 'admin-2fa', 'Admin 2FA scope classified');
  assert(classifyRequestScope('https://hizfgvgbsguhduxortrx.supabase.co/rest/v1/system_settings', { method: 'POST' }) === 'admin-operations', 'Admin operations scope classified');

  // 2. Rate Limiting Enactment & Quota Exhaustion
  console.log('\n--- 2. Rate Limit Quota & 429 Violation Tests ---');
  rateLimiter.reset();
  const testScope = 'test-admin-quota';
  rateLimiter.setConfig(testScope, {
    maxRequests: 3,
    windowMs: 5000,
    maxBurstDelayMs: 0,
    description: 'Test Admin Quota',
  });

  // First 3 calls should succeed
  await rateLimiter.acquire(testScope);
  await rateLimiter.acquire(testScope);
  await rateLimiter.acquire(testScope);
  assert(rateLimiter.check(testScope).remaining === 0, 'Remaining quota is 0 after 3 hits');

  // 4th call must throw RateLimitError with status 429
  let caughtError: any = null;
  try {
    await rateLimiter.acquire(testScope);
  } catch (err) {
    caughtError = err;
  }
  assert(caughtError instanceof RateLimitError, '4th call throws RateLimitError');
  assert(caughtError?.status === 429, 'RateLimitError has status 429');
  assert(caughtError?.retryAfterSeconds > 0, 'RateLimitError includes retryAfterSeconds');

  // 3. Listener Notification Test
  console.log('\n--- 3. Rate Limit Notification Listener Test ---');
  let notified = false;
  let notifiedScope = '';
  const unsub = rateLimiter.onRateLimit((result) => {
    notified = true;
    notifiedScope = result.scope;
  });

  try {
    await rateLimiter.acquire(testScope);
  } catch {}
  unsub();

  assert(notified === true, 'Listener was notified of rate limit violation');
  assert(notifiedScope === testScope, 'Notified scope matches violated scope');

  // 4. Rate-limited Fetch Wrapper HTTP 429 Response Test
  console.log('\n--- 4. rateLimitedFetch Interception Test ---');
  const testFetchScope = 'test-dashboard-fetch';
  rateLimiter.setConfig(testFetchScope, {
    maxRequests: 2,
    windowMs: 5000,
    maxBurstDelayMs: 0,
    description: 'Fetch Test Scope',
  });

  // Call 1 & 2 via acquire
  await rateLimiter.acquire(testFetchScope);
  await rateLimiter.acquire(testFetchScope);

  // Directly verify simulated fetch response for rate-limited endpoint
  const mockUrl = 'https://hizfgvgbsguhduxortrx.supabase.co/functions/v1/admin-2fa';
  rateLimiter.setConfig('admin-2fa', {
    maxRequests: 1,
    windowMs: 5000,
    maxBurstDelayMs: 0,
  });
  await rateLimiter.acquire('admin-2fa'); // exhaust quota

  const response429 = await rateLimitedFetch(mockUrl);
  assert(response429.status === 429, 'rateLimitedFetch returns HTTP 429 on quota exhaustion');
  assert(response429.headers.get('Retry-After') !== null, 'HTTP 429 response contains Retry-After header');
  const responseJson = await response429.json();
  assert(responseJson.statusCode === 429, 'Response body JSON contains statusCode 429');

  console.log(`\n==================================================`);
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
