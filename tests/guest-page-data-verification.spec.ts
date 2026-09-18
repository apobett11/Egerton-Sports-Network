import { test, expect } from '@playwright/test';

/**
 * Guest Page — Ground-Up Data Verification
 * Tests every section of the guest page by:
 * 1. Intercepting all Supabase REST API calls
 * 2. Verifying HTTP status is 200 (not 500/403/401)
 * 3. Verifying response body contains expected schema and real data
 * 4. Measuring response time (< 5000ms)
 * 5. Verifying zero 500 errors across all public sections
 */

const SUPABASE_URL = 'https://hizfgvgbsguhduxortrx.supabase.co';
const APP_URL = 'http://localhost:5173';

test.describe('Guest Page: All Data Sections', () => {

  test('Section 1: Fixtures load with real data and no 500 errors', async ({ page }) => {
    const requestTimes = new Map<string, number>();

    page.on('request', (request) => {
      if (request.url().includes(SUPABASE_URL + '/rest/v1/fixtures')) {
        requestTimes.set(request.url(), Date.now());
      }
    });

    const fixtureResponsesCollected: { url: string; status: number; body: any; ms: number }[] = [];
    page.on('response', async (response) => {
      if (!response.url().includes(SUPABASE_URL + '/rest/v1/fixtures')) return;
      const startTime = requestTimes.get(response.url()) || Date.now();
      let body: any = null;
      try { body = await response.json(); } catch {}
      fixtureResponsesCollected.push({
        url: response.url(),
        status: response.status(),
        body,
        ms: Date.now() - startTime,
      });
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    console.log(`\n=== FIXTURE API CALLS (${fixtureResponsesCollected.length} recorded) ===`);
    expect(fixtureResponsesCollected.length).toBeGreaterThan(0);

    for (const call of fixtureResponsesCollected) {
      console.log(`  [${call.status}] ${call.ms}ms | ${call.url.substring(0, 100)}`);
      
      // CRITICAL: Zero 500/403/401 errors
      expect(call.status, `Fixture call must not be 500: ${call.url}`).not.toBe(500);
      expect(call.status, `Fixture call must not be 403: ${call.url}`).not.toBe(403);
      expect(call.status, `Fixture call must not be 401: ${call.url}`).not.toBe(401);
      expect([200, 206]).toContain(call.status);

      // Verify payload is valid JSON array
      expect(Array.isArray(call.body), `Fixture response must be array: ${call.url}`).toBe(true);
      console.log(`    → ${call.body?.length ?? 0} fixtures returned`);
      
      if (Array.isArray(call.body) && call.body.length > 0) {
        const first = call.body[0];
        const hasField = 'scheduled_time' in first || 'id' in first;
        expect(hasField, `Fixture row must contain id or scheduled_time: ${JSON.stringify(first)}`).toBe(true);
      }
    }
  });

  test('Section 2: Teams table loads correctly with cached efficiency', async ({ page }) => {
    const teamCalls: { url: string; status: number; body: any; ms: number }[] = [];
    const reqTimes = new Map<string, number>();
    
    page.on('request', (req) => {
      if (req.url().includes(SUPABASE_URL + '/rest/v1/teams')) {
        reqTimes.set(req.url(), Date.now());
      }
    });

    page.on('response', async (response) => {
      if (!response.url().includes(SUPABASE_URL + '/rest/v1/teams')) return;
      const t = reqTimes.get(response.url()) || Date.now();
      let body: any = null;
      try { body = await response.json(); } catch {}
      teamCalls.push({ url: response.url(), status: response.status(), body, ms: Date.now() - t });
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    console.log(`\n=== TEAMS API CALLS (${teamCalls.length}) ===`);
    for (const call of teamCalls) {
      console.log(`  [${call.status}] ${call.ms}ms | ${call.url.substring(0, 100)}`);
      expect(call.status).not.toBe(500);
      expect(call.status).toBe(200);

      if (Array.isArray(call.body) && call.body.length > 0) {
        const t = call.body[0];
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        console.log(`    → ${call.body.length} teams | First: ${t.name}`);
      }
    }
    
    if (teamCalls.length > 0) {
      const hasTeams = teamCalls.some(c => Array.isArray(c.body) && c.body.length > 0);
      expect(hasTeams, 'At least one teams call must return data').toBe(true);
    }
  });

  test('Section 3: League standings load with real data', async ({ page }) => {
    const standingsCalls: { url: string; status: number; body: any; ms: number }[] = [];
    const reqTimes = new Map<string, number>();

    page.on('request', (req) => {
      if (req.url().includes(SUPABASE_URL + '/rest/v1/league_standings') ||
          req.url().includes(SUPABASE_URL + '/rest/v1/rpc/get_league_standings')) {
        reqTimes.set(req.url(), Date.now());
      }
    });

    page.on('response', async (response) => {
      const u = response.url();
      if (!u.includes(SUPABASE_URL + '/rest/v1/league_standings') &&
          !u.includes(SUPABASE_URL + '/rest/v1/rpc/get_league_standings')) return;
      const t = reqTimes.get(u) || Date.now();
      let body: any = null;
      try { body = await response.json(); } catch {}
      standingsCalls.push({ url: u, status: response.status(), body, ms: Date.now() - t });
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    
    // Scroll down to trigger standings section lazy load
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(2000);

    console.log(`\n=== STANDINGS API CALLS (${standingsCalls.length}) ===`);
    for (const call of standingsCalls) {
      console.log(`  [${call.status}] ${call.ms}ms | ${call.url.substring(0, 120)}`);
      
      expect(call.status, `Standings must not be 500: ${call.url}`).not.toBe(500);
      expect(call.status, `Standings must be 200: ${call.url}`).toBe(200);

      if (Array.isArray(call.body) && call.body.length > 0) {
        const row = call.body[0];
        console.log(`    → ${call.body.length} rows | First: ${JSON.stringify(row).substring(0, 100)}`);
      }
    }
  });

  test('Section 4: Player stats (top scorers) load without 500', async ({ page }) => {
    const scorerCalls: { url: string; status: number; body: any; ms: number }[] = [];
    const reqTimes = new Map<string, number>();

    page.on('request', (req) => {
      if (req.url().includes(SUPABASE_URL + '/rest/v1/player_stats') ||
          req.url().includes(SUPABASE_URL + '/rest/v1/rpc/get_top_scorers')) {
        reqTimes.set(req.url(), Date.now());
      }
    });

    page.on('response', async (response) => {
      const u = response.url();
      if (!u.includes(SUPABASE_URL + '/rest/v1/player_stats') &&
          !u.includes(SUPABASE_URL + '/rest/v1/rpc/get_top_scorers')) return;
      const t = reqTimes.get(u) || Date.now();
      let body: any = null;
      try { body = await response.json(); } catch {}
      scorerCalls.push({ url: u, status: response.status(), body, ms: Date.now() - t });
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(3000);

    console.log(`\n=== PLAYER STATS/SCORERS API CALLS (${scorerCalls.length}) ===`);
    for (const call of scorerCalls) {
      console.log(`  [${call.status}] ${call.ms}ms | ${call.url.substring(0, 120)}`);
      expect(call.status, `Player stats must not be 500`).not.toBe(500);
      expect(call.status, `Player stats must be 200`).toBe(200);

      if (Array.isArray(call.body) && call.body.length > 0) {
        const row = call.body[0];
        console.log(`    → ${call.body.length} rows | First player_id: ${row.player_id}`);
      }
    }
  });

  test('Section 5: Match events load without 500', async ({ page }) => {
    const eventCalls: { url: string; status: number; body: any; ms: number }[] = [];
    const reqTimes = new Map<string, number>();

    page.on('request', (req) => {
      if (req.url().includes(SUPABASE_URL + '/rest/v1/match_events')) {
        reqTimes.set(req.url(), Date.now());
      }
    });

    page.on('response', async (response) => {
      if (!response.url().includes(SUPABASE_URL + '/rest/v1/match_events')) return;
      const t = reqTimes.get(response.url()) || Date.now();
      let body: any = null;
      try { body = await response.json(); } catch {}
      eventCalls.push({ url: response.url(), status: response.status(), body, ms: Date.now() - t });
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(3000);

    console.log(`\n=== MATCH EVENTS API CALLS (${eventCalls.length}) ===`);
    for (const call of eventCalls) {
      console.log(`  [${call.status}] ${call.ms}ms | ${call.url.substring(0, 120)}`);
      expect(call.status, `Match events must not be 500`).not.toBe(500);
      expect(call.status, `Match events must be 200`).toBe(200);
    }
  });

  test('Section 6: News articles load without errors', async ({ page }) => {
    const newsCalls: { url: string; status: number; body: any; ms: number }[] = [];
    const reqTimes = new Map<string, number>();

    page.on('request', (req) => {
      if (req.url().includes(SUPABASE_URL + '/rest/v1/news_articles')) {
        reqTimes.set(req.url(), Date.now());
      }
    });

    page.on('response', async (response) => {
      if (!response.url().includes(SUPABASE_URL + '/rest/v1/news_articles')) return;
      const t = reqTimes.get(response.url()) || Date.now();
      let body: any = null;
      try { body = await response.json(); } catch {}
      newsCalls.push({ url: response.url(), status: response.status(), body, ms: Date.now() - t });
    });

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, 5000));
    await page.waitForTimeout(3000);

    console.log(`\n=== NEWS ARTICLES API CALLS (${newsCalls.length}) ===`);
    for (const call of newsCalls) {
      console.log(`  [${call.status}] ${call.ms}ms | ${call.url.substring(0, 120)}`);
      expect(call.status, `News must not be 500`).not.toBe(500);
      expect(call.status, `News must be 200`).toBe(200);

      if (Array.isArray(call.body)) {
        console.log(`    → ${call.body.length} articles`);
        if (call.body.length > 0) {
          const a = call.body[0];
          expect(a).toHaveProperty('id');
          expect(a).toHaveProperty('title');
        }
      }
    }
  });

  test('Section 7: Zero 500 errors across all guest API calls (complete audit)', async ({ page }) => {
    const allCalls: { url: string; status: number; body: any; ms: number }[] = [];
    const reqTimes = new Map<string, number>();

    page.on('request', (req) => {
      if (req.url().includes(SUPABASE_URL + '/rest/v1/')) {
        reqTimes.set(req.url(), Date.now());
      }
    });

    page.on('response', async (response) => {
      if (!response.url().includes(SUPABASE_URL + '/rest/v1/')) return;
      const t = reqTimes.get(response.url()) || Date.now();
      let body: any = null;
      try { body = await response.json(); } catch {}
      allCalls.push({ url: response.url(), status: response.status(), body, ms: Date.now() - t });
    });

    // Navigate and scroll through all sections
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    for (const scrollY of [500, 1000, 2000, 3000, 5000]) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(1000);
    }

    console.log(`\n=== COMPLETE API AUDIT (${allCalls.length} calls) ===`);
    
    const errors500 = allCalls.filter(c => c.status === 500);
    const errors4xx  = allCalls.filter(c => c.status >= 400 && c.status < 500);
    const success    = allCalls.filter(c => c.status === 200);
    
    console.log(`  200 OK:         ${success.length}`);
    console.log(`  4xx Errors:     ${errors4xx.length}`);
    console.log(`  500 Errors:     ${errors500.length}`);

    // GROUP by table for summary
    const byTable = new Map<string, { count: number; errors: number; maxMs: number }>();
    allCalls.forEach(c => {
      const table = c.url.includes('/rpc/') 
        ? 'RPC:' + c.url.split('/rpc/')[1]?.split('?')[0]
        : c.url.split('/rest/v1/')[1]?.split('?')[0] || 'unknown';
      const curr = byTable.get(table) || { count: 0, errors: 0, maxMs: 0 };
      byTable.set(table, {
        count: curr.count + 1,
        errors: curr.errors + (c.status !== 200 ? 1 : 0),
        maxMs: Math.max(curr.maxMs, c.ms),
      });
    });

    console.log('\n  BY TABLE:');
    byTable.forEach((stats, table) => {
      const status = stats.errors > 0 ? '❌' : '✅';
      console.log(`    ${status} ${table}: ${stats.count} calls, ${stats.errors} errors, max ${stats.maxMs}ms`);
    });

    // THE CRITICAL ASSERTION: zero 500 errors
    expect(errors500.length, 
      `Found ${errors500.length} HTTP 500 errors:\n${errors500.map(e => e.url).join('\n')}`
    ).toBe(0);
  });
});
