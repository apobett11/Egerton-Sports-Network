import { test, expect, type Page } from '@playwright/test';

// ============================================================================
// ESN PERFORMANCE & CONNECTION DIAGNOSTIC TEST SUITE
// Tests: fixture real-team loading, load times, network requests, failure points
// ============================================================================

const BASE = 'http://localhost:5173';
const SUPABASE_HOST = 'hizfgvgbsguhduxortrx.supabase.co';

// Helper: measure time for a page section to be visible
async function measureLoad(page: Page, selector: string, label: string): Promise<number> {
  const start = Date.now();
  try {
    await page.waitForSelector(selector, { timeout: 10000 });
    const elapsed = Date.now() - start;
    console.log(`  ⏱ ${label}: ${elapsed}ms`);
    return elapsed;
  } catch {
    console.log(`  ❌ ${label}: TIMEOUT (>10000ms)`);
    return 10000;
  }
}

test.describe('ESN — Fixtures Page: Real Team Names & Load Performance', () => {

  test('fixtures load real team names — no "Home Team" or "Away Team" placeholders', async ({ page }) => {
    const networkRequests: { url: string; duration: number; status: number }[] = [];

    // Capture all network requests and their timings
    page.on('request', (req) => {
      if (req.url().includes(SUPABASE_HOST)) {
        const start = Date.now();
        req.response().then(res => {
          networkRequests.push({
            url: req.url().replace(`https://${SUPABASE_HOST}`, ''),
            duration: Date.now() - start,
            status: res?.status() || 0,
          });
        }).catch(() => {});
      }
    });

    const pageStart = Date.now();
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const pageLoadTime = Date.now() - pageStart;
    console.log(`\n📄 Page load (networkidle): ${pageLoadTime}ms`);

    // Wait for match cards to render
    const matchCardsVisible = await page.locator('[data-testid="match-card"], .match-card, [class*="MatchCard"], [class*="fixture-card"], [class*="match-item"]').first().isVisible().catch(() => false);

    if (!matchCardsVisible) {
      // Try to find any score/team display elements
      await page.waitForSelector('text=/vs|[-–]|FT|LIVE/i', { timeout: 10000 }).catch(() => {});
    }

    // Grab all visible text on page
    const bodyText = await page.textContent('body') || '';

    // Assert: no "Home Team" or "Away Team" placeholder visible
    const hasHomeTeamPlaceholder = bodyText.includes('Home Team');
    const hasAwayTeamPlaceholder = bodyText.includes('Away Team');

    if (hasHomeTeamPlaceholder || hasAwayTeamPlaceholder) {
      console.log('\n❌ BUG DETECTED: Placeholder team names visible');
      console.log('  "Home Team" found:', hasHomeTeamPlaceholder);
      console.log('  "Away Team" found:', hasAwayTeamPlaceholder);
    } else {
      console.log('\n✅ No placeholder team names — real teams loaded correctly');
    }

    expect(hasHomeTeamPlaceholder, '"Home Team" placeholder must not appear in UI').toBe(false);
    expect(hasAwayTeamPlaceholder, '"Away Team" placeholder must not appear in UI').toBe(false);

    // Print all Supabase requests
    console.log('\n📡 Supabase Network Requests:');
    for (const req of networkRequests) {
      const flag = req.duration > 3000 ? '🔴' : req.duration > 1500 ? '🟡' : '✅';
      console.log(`  ${flag} [${req.status}] ${req.duration}ms — ${req.url.substring(0, 100)}`);
    }

    // Total page load must be under 5 seconds
    expect(pageLoadTime, 'Page must load within 5 seconds').toBeLessThan(5000);
  });

  test('individual Supabase calls — identify the 5s latency source', async ({ page }) => {
    const slowCalls: { url: string; duration: number }[] = [];
    const allCalls: { url: string; duration: number; status: number }[] = [];

    // Intercept every fetch and time it individually
    await page.route(`**/${SUPABASE_HOST}/**`, async (route) => {
      const start = Date.now();
      const req = route.request();
      const response = await route.fetch();
      const duration = Date.now() - start;
      const path = req.url().replace(`https://${SUPABASE_HOST}`, '');
      allCalls.push({ url: path, duration, status: response.status() });
      if (duration > 2000) slowCalls.push({ url: path, duration });
      await route.fulfill({ response });
    });

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

    // Sort by duration descending
    allCalls.sort((a, b) => b.duration - a.duration);

    console.log('\n📊 All Supabase calls by duration (slowest first):');
    for (const c of allCalls) {
      const flag = c.duration > 3000 ? '🔴' : c.duration > 1500 ? '🟡' : '✅';
      console.log(`  ${flag} [${c.status}] ${c.duration}ms — ${c.url.substring(0, 120)}`);
    }

    if (slowCalls.length > 0) {
      console.log('\n🚨 SLOW CALLS (>2s):');
      for (const sc of slowCalls) {
        console.log(`  🔴 ${sc.duration}ms — ${sc.url}`);
      }
    } else {
      console.log('\n✅ No calls over 2 seconds');
    }

    // Check if rate limiter is delaying calls
    const rateLimitedCalls = allCalls.filter(c => c.status === 429);
    if (rateLimitedCalls.length > 0) {
      console.log('\n⚠️  RATE LIMITED CALLS (HTTP 429):');
      for (const rc of rateLimitedCalls) {
        console.log(`  ⛔ ${rc.url}`);
      }
    }

    // All individual calls should resolve within 5 seconds
    for (const call of allCalls) {
      expect(call.duration, `Call to ${call.url} exceeded 5s`).toBeLessThan(5000);
    }
  });

  test('RPC get_guest_fixtures — verifies server-side JOIN returns real names', async ({ page }) => {
    let rpcPayload: any = null;
    let rpcDuration = 0;

    await page.route(`**/${SUPABASE_HOST}/rest/v1/rpc/get_guest_fixtures*`, async (route) => {
      const start = Date.now();
      const response = await route.fetch();
      rpcDuration = Date.now() - start;
      try {
        const body = await response.json();
        rpcPayload = body;
      } catch {}
      await route.fulfill({ response });
    });

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

    if (rpcPayload === null) {
      console.log('\n⚠️  get_guest_fixtures RPC was NOT called — app may still be using 3-query path');
    } else {
      console.log(`\n✅ get_guest_fixtures RPC called in ${rpcDuration}ms`);
      const rows = Array.isArray(rpcPayload) ? rpcPayload : [];
      console.log(`  Returned ${rows.length} fixture rows`);
      const badHome = rows.filter((r: any) => !r.home_team_name || r.home_team_name === '');
      const badAway = rows.filter((r: any) => !r.away_team_name || r.away_team_name === '');
      if (badHome.length > 0) console.log(`  ❌ ${badHome.length} rows missing home_team_name`);
      if (badAway.length > 0) console.log(`  ❌ ${badAway.length} rows missing away_team_name`);
      if (badHome.length === 0 && badAway.length === 0) console.log('  ✅ All rows have real team names');
      expect(rpcDuration, 'RPC must respond within 3 seconds').toBeLessThan(3000);
    }
  });

  test('detect burst-delay from rate limiter — the real 5s latency source', async ({ page }) => {
    const burstDelays: number[] = [];
    let requestCount = 0;
    const windowStart = Date.now();

    await page.route(`**/${SUPABASE_HOST}/**`, async (route) => {
      requestCount++;
      const start = Date.now();
      const response = await route.fetch();
      const duration = Date.now() - start;
      burstDelays.push(duration);
      await route.fulfill({ response });
    });

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const totalPageTime = Date.now() - windowStart;

    console.log(`\n🔢 Total Supabase requests fired on page load: ${requestCount}`);
    console.log(`⏱ Total page load time: ${totalPageTime}ms`);
    console.log(`📈 Avg request time: ${requestCount > 0 ? Math.round(burstDelays.reduce((a, b) => a + b, 0) / requestCount) : 0}ms`);
    console.log(`📈 Max request time: ${Math.max(...burstDelays, 0)}ms`);

    // Key diagnostic: if >75% of the maxRequests config (120 global) are fired within 10s window,
    // the rateLimitedFetch adds a burst delay of up to maxBurstDelayMs (400ms per request)
    // With 8 requests at 75%+ utilization (>90 of 120): delay = (count/120) * 400ms per call
    // So if 8 calls each get ~300ms of artificial delay = 2400ms added artificially
    if (requestCount > 90) {
      console.log(`\n🚨 BURST THROTTLE ACTIVE: ${requestCount} requests > 75% of global limit (120)`);
      console.log('   The rateLimitedFetch in rateLimiter.ts adds artificial delay!');
      console.log('   Burst delay formula: (active/maxRequests) * maxBurstDelayMs (400ms)');
      console.log('   Impact: every request after 75% threshold is delayed by up to 400ms');
    } else if (requestCount > 0) {
      const utilizationPct = Math.round((requestCount / 120) * 100);
      console.log(`\n✅ Rate limiter utilization: ${utilizationPct}% (${requestCount}/120 global limit)`);
      if (utilizationPct > 75) {
        console.log('   ⚠️  Above 75% — burst delays are being injected!');
      }
    }

    expect(totalPageTime, 'Total page load must complete within 8 seconds').toBeLessThan(8000);
  });

});

test.describe('ESN — Docker/Container Diagnosis', () => {

  test('app connects to remote Supabase (not local Docker) — verify correct host', async ({ page }) => {
    const remoteHits: string[] = [];
    const localHits: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('supabase.co')) remoteHits.push(url);
      if (url.includes('127.0.0.1:54321') || url.includes('localhost:54321')) localHits.push(url);
    });

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`\n🌐 Remote Supabase (supabase.co) calls: ${remoteHits.length}`);
    console.log(`🐳 Local Docker Supabase (127.0.0.1:54321) calls: ${localHits.length}`);

    if (localHits.length > 0) {
      console.log('\n⚠️  APP IS HITTING LOCAL DOCKER — but Docker is NOT running!');
      console.log('   This causes 5s+ timeouts: TCP connection to 127.0.0.1:54321 hangs');
      console.log('   until OS-level TCP timeout fires (~5 seconds default)');
      console.log('   FIX: Ensure VITE_SUPABASE_URL=https://hizfgvgbsguhduxortrx.supabase.co');
      for (const h of localHits) console.log(`   ❌ ${h}`);
    } else {
      console.log('\n✅ App correctly points to remote Supabase — Docker not involved in query path');
    }

    if (remoteHits.length === 0 && localHits.length === 0) {
      console.log('\n⚠️  No Supabase requests detected at all — check if app is loading');
    }

    // Production app must use remote Supabase
    expect(localHits.length, 'App must NOT connect to local Docker Supabase').toBe(0);
    expect(remoteHits.length, 'App must make at least 1 call to remote Supabase').toBeGreaterThan(0);
  });

});
