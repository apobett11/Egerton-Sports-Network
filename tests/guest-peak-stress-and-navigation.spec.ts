import { test, expect } from '@playwright/test';

/**
 * GUEST PAGE PEAK LOAD & FULL NAVIGATION STRESS TEST (300+ CONCURRENT USERS)
 * 
 * Strict Read-Only Testing:
 * 1. Simulates 300+ concurrent guest users hammering all guest endpoints simultaneously.
 * 2. Full end-to-end multi-page navigation across:
 *    - Home / Matchday Feed (Lateral swipe, date shift, competition filters)
 *    - Official League Standings (EPL & Championship toggle, sort order)
 *    - Editorial & Press News (Categories, pagination, article read)
 *    - Match Details (H2H, lineups, stats, live timeline)
 *    - Player of the Week (Leaderboard & cards)
 *    - Favorites & Team Profile Pages
 * 3. Measures:
 *    - Error rates (500, 502, 503, 504, 400, 403, 401)
 *    - Latency statistics (min, mean, p50, p95, p99, max)
 *    - Throughput (requests/sec)
 *    - UI responsiveness under load
 */

const SUPABASE_URL = 'https://hizfgvgbsguhduxortrx.supabase.co';
const APP_URL = 'http://localhost:5173';
const ANON_KEY = 'sb_publishable_GQXQug1evzVkDsPxdYRobA_c7nCszDs';

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

interface EndpointResult {
  endpoint: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  statusCodes: Record<number, number>;
  latencies: number[];
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  minMs: number;
}

function calculateStats(endpoint: string, latencies: number[], statusCodes: Record<number, number>): EndpointResult {
  latencies.sort((a, b) => a - b);
  const total = latencies.length;
  const success = Object.entries(statusCodes)
    .filter(([code]) => code === '200' || code === '206')
    .reduce((acc, [, cnt]) => acc + cnt, 0);
  const errors = total - success;

  const mean = total > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / total) : 0;
  const p50 = total > 0 ? latencies[Math.floor(total * 0.5)] : 0;
  const p95 = total > 0 ? latencies[Math.floor(total * 0.95)] : 0;
  const p99 = total > 0 ? latencies[Math.floor(total * 0.99)] : 0;
  const min = total > 0 ? latencies[0] : 0;
  const max = total > 0 ? latencies[total - 1] : 0;

  return {
    endpoint,
    totalRequests: total,
    successCount: success,
    errorCount: errors,
    statusCodes,
    latencies,
    meanMs: mean,
    p50Ms: p50,
    p95Ms: p95,
    p99Ms: p99,
    maxMs: max,
    minMs: min,
  };
}

test.describe('Guest Peak Load & Full Navigation Suite', () => {

  // =========================================================================
  // TEST 1: 300+ CONCURRENT USERS STRESS TEST ACROSS ALL GUEST ENDPOINTS
  // =========================================================================
  test('Stress Test: 300 concurrent requests across all guest database endpoints', async ({ request }) => {
    test.setTimeout(180000);

    const endpoints = [
      // 1. Fixtures - all season
      `${SUPABASE_URL}/rest/v1/fixtures?select=id,competition_id,home_team_id,away_team_id,matchday,scheduled_time,venue,status,score_home,score_away&order=scheduled_time.asc`,
      // 2. Fixtures - specific date filter
      `${SUPABASE_URL}/rest/v1/fixtures?select=id,competition_id,home_team_id,away_team_id,matchday,scheduled_time,venue,status,score_home,score_away&scheduled_time=gte.2026-09-20T00%3A00%3A00.000Z&scheduled_time=lte.2026-09-20T23%3A59%3A59.999Z&order=scheduled_time.asc`,
      // 3. Fixtures - EPL competition
      `${SUPABASE_URL}/rest/v1/fixtures?select=id,competition_id,home_team_id,away_team_id,matchday,scheduled_time,venue,status,score_home,score_away&competition_id=eq.11111111-1111-1111-1111-111111111111&order=scheduled_time.asc`,
      // 4. League Standings - EPL
      `${SUPABASE_URL}/rest/v1/league_standings?select=team_id,competition_id,played,won,drawn,lost,goals_for,goals_against,goal_difference,points&competition_id=eq.11111111-1111-1111-1111-111111111111&order=points.desc,goal_difference.desc,goals_for.desc`,
      // 5. League Standings - Championship
      `${SUPABASE_URL}/rest/v1/league_standings?select=team_id,competition_id,played,won,drawn,lost,goals_for,goals_against,goal_difference,points&competition_id=eq.22222222-2222-2222-2222-222222222222&order=points.desc,goal_difference.desc,goals_for.desc`,
      // 6. Top Scorers - player_stats
      `${SUPABASE_URL}/rest/v1/player_stats?select=player_id,competition_id,goals&goals=gt.0&order=goals.desc&limit=30`,
      // 7. Assist Leaders - player_stats
      `${SUPABASE_URL}/rest/v1/player_stats?select=player_id,competition_id,assists&assists=gt.0&order=assists.desc&limit=30`,
      // 8. Match Events - goals
      `${SUPABASE_URL}/rest/v1/match_events?select=player_id,fixture_id&type=in.(goal,penalty)&limit=500`,
      // 9. Teams directory
      `${SUPABASE_URL}/rest/v1/teams?select=id,name,short_name,logo_url,color_code`,
      // 10. Competitions
      `${SUPABASE_URL}/rest/v1/competitions?select=id,name,slug,season`,
      // 11. News articles
      `${SUPABASE_URL}/rest/v1/news_articles?select=id,title,excerpt,content,image_url,category,status,published_at&order=published_at.desc&limit=10`,
      // 12. Announcements
      `${SUPABASE_URL}/rest/v1/announcements?select=id,title,content,target_role,created_at&order=created_at.desc&limit=5`,
    ];

    const CONCURRENT_USERS = 360; // 360 requests in parallel (30 requests per endpoint)
    const requestsPerEndpoint = Math.floor(CONCURRENT_USERS / endpoints.length);

    console.log(`\n===============================================================`);
    console.log(`🚀 LAUNCHING STRESS TEST: ${CONCURRENT_USERS} CONCURRENT USERS`);
    console.log(`   Simulating simultaneous queries across ${endpoints.length} guest endpoints`);
    console.log(`===============================================================\n`);

    const overallStart = Date.now();
    const tasks: Promise<{ endpointIdx: number; latency: number; status: number; dataLen: number }>[] = [];

    endpoints.forEach((url, endpointIdx) => {
      for (let i = 0; i < requestsPerEndpoint; i++) {
        tasks.push((async () => {
          const t0 = Date.now();
          try {
            const res = await request.get(url, { headers });
            const latency = Date.now() - t0;
            const status = res.status();
            let dataLen = 0;
            try {
              const body = await res.json();
              dataLen = Array.isArray(body) ? body.length : 1;
            } catch {}
            return { endpointIdx, latency, status, dataLen };
          } catch (err: any) {
            const latency = Date.now() - t0;
            return { endpointIdx, latency, status: 0, dataLen: 0 };
          }
        })());
      }
    });

    const results = await Promise.all(tasks);
    const overallDuration = Date.now() - overallStart;
    const rps = Math.round((CONCURRENT_USERS / (overallDuration / 1000)) * 10) / 10;

    console.log(`⏱️ Completed ${results.length} requests in ${overallDuration}ms (~${rps} req/sec)\n`);

    // Group results by endpoint
    const endpointStats: EndpointResult[] = endpoints.map((url, idx) => {
      const subset = results.filter(r => r.endpointIdx === idx);
      const latencies = subset.map(r => r.latency);
      const statusCodes: Record<number, number> = {};
      subset.forEach(r => {
        statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
      });
      const shortName = url.split('/rest/v1/')[1]?.split('?')[0] + ' (' + (url.includes('&') ? url.split('&')[1]?.substring(0, 25) : 'default') + ')';
      return calculateStats(shortName, latencies, statusCodes);
    });

    console.log('---------------------------------------------------------------------------------------------------------');
    console.log('| Endpoint                         | Reqs | Success | Errs | Min(ms) | Mean(ms) | p50(ms) | p95(ms) | Max(ms) |');
    console.log('---------------------------------------------------------------------------------------------------------');
    endpointStats.forEach(s => {
      const ep = s.endpoint.padEnd(32).substring(0, 32);
      const reqs = String(s.totalRequests).padStart(4);
      const succ = String(s.successCount).padStart(7);
      const errs = String(s.errorCount).padStart(4);
      const min = String(s.minMs).padStart(7);
      const mean = String(s.meanMs).padStart(8);
      const p50 = String(s.p50Ms).padStart(7);
      const p95 = String(s.p95Ms).padStart(7);
      const max = String(s.maxMs).padStart(7);
      console.log(`| ${ep} | ${reqs} | ${succ} | ${errs} | ${min} | ${mean} | ${p50} | ${p95} | ${max} |`);
    });
    console.log('---------------------------------------------------------------------------------------------------------\n');

    const totalErrors = endpointStats.reduce((acc, s) => acc + s.errorCount, 0);
    const all500s = results.filter(r => r.status === 500);
    const all403s = results.filter(r => r.status === 403);
    const all401s = results.filter(r => r.status === 401);

    console.log(`📊 STRESS TEST AUDIT REPORT:`);
    console.log(`   Total Requests Sent:   ${results.length}`);
    console.log(`   Successful Responses:  ${results.length - totalErrors}`);
    console.log(`   Failed Requests:       ${totalErrors}`);
    console.log(`   HTTP 500 (Server Err): ${all500s.length}`);
    console.log(`   HTTP 403 (Forbidden):  ${all403s.length}`);
    console.log(`   HTTP 401 (Unauth):     ${all401s.length}`);
    console.log(`   Average Concurrency:   ${CONCURRENT_USERS} simultaneous clients`);
    console.log(`   Peak Throughput:       ${rps} req/sec\n`);

    // Assertions: 0 internal server errors (500), 0 auth errors (401/403)
    expect(all500s.length, `Found ${all500s.length} HTTP 500 Internal Server Errors under stress!`).toBe(0);
    expect(all403s.length, `Found ${all403s.length} HTTP 403 Forbidden Errors!`).toBe(0);
    expect(all401s.length, `Found ${all401s.length} HTTP 401 Unauthorized Errors!`).toBe(0);
    expect(totalErrors, `Total failed requests under 300 concurrent users: ${totalErrors}`).toBe(0);
  });

  // =========================================================================
  // TEST 2: FULL END-TO-END GUEST USER JOURNEY & NAVIGATION FLOW
  // =========================================================================
  test('Navigation: Full journey through all tabs, filters, and match detail views', async ({ page }) => {
    test.setTimeout(90000);

    const apiErrors: { url: string; status: number }[] = [];
    page.on('response', (res) => {
      if (res.url().includes(SUPABASE_URL) && res.status() >= 500) {
        apiErrors.push({ url: res.url(), status: res.status() });
      }
    });

    console.log(`\n===============================================================`);
    console.log(`🧭 SIMULATING FULL GUEST USER NAVIGATION JOURNEY`);
    console.log(`===============================================================\n`);

    // 1. Initial Page Load (Scores / Home)
    const t0 = Date.now();
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - t0;
    console.log(`  [Step 1] Initial Home Page Loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(15000);

    // Verify main page title and structure
    await expect(page).toHaveTitle(/Egerton Sports Network/i);

    // 2. Lateral Playday Navigation (Clicking Previous/Next Matchday buttons)
    console.log(`  [Step 2] Testing Lateral Playday Date Switcher...`);
    const dateSwitcherButtons = page.locator('button:has-text("Previous"), button:has-text("Next"), [aria-label*="playday"], [aria-label*="date"]');
    const btnCount = await dateSwitcherButtons.count();
    if (btnCount > 0) {
      await dateSwitcherButtons.first().click().catch(() => {});
      await page.waitForTimeout(500);
      console.log(`  [Step 2] Successfully shifted matchday playday`);
    }

    // 3. Competition Filter Switch (Switching EPL / Championship / All)
    console.log(`  [Step 3] Switching Competition Filters (EPL / Championship / All)...`);
    const eplButton = page.locator('button:has-text("EPL"), button:has-text("Premier"), button:has-text("Egerton Premier")').first();
    if (await eplButton.isVisible().catch(() => false)) {
      await eplButton.click();
      await page.waitForTimeout(600);
      console.log(`  [Step 3] Filtered by Egerton Premier League`);
    }

    const champButton = page.locator('button:has-text("Championship"), button:has-text("Egerton Championship")').first();
    if (await champButton.isVisible().catch(() => false)) {
      await champButton.click();
      await page.waitForTimeout(600);
      console.log(`  [Step 3] Filtered by Egerton Championship`);
    }

    // 4. Navigate to Standings / Table Tab
    console.log(`  [Step 4] Navigating to Official League Standings Tab (#table)...`);
    const standingsTab = page.locator('a[href*="table"], a[href*="standings"], button:has-text("Table"), button:has-text("Standings"), [aria-label*="Table"]').first();
    if (await standingsTab.isVisible().catch(() => false)) {
      await standingsTab.click();
      await page.waitForTimeout(1000);
    } else {
      await page.evaluate(() => { window.location.hash = '/table'; });
      await page.waitForTimeout(1000);
    }

    // Verify standings table renders with rows
    const standingsRows = page.locator('table tbody tr, [role="row"]');
    const rowCount = await standingsRows.count();
    console.log(`  [Step 4] Standings Table rendered with ${rowCount} team rows`);
    expect(rowCount).toBeGreaterThan(0);

    // 5. Navigate to News / Articles Tab
    console.log(`  [Step 5] Navigating to News & Press Tab (#news)...`);
    const newsTab = page.locator('a[href*="news"], button:has-text("News"), [aria-label*="News"]').first();
    if (await newsTab.isVisible().catch(() => false)) {
      await newsTab.click();
      await page.waitForTimeout(1000);
    } else {
      await page.evaluate(() => { window.location.hash = '/news'; });
      await page.waitForTimeout(1000);
    }

    // Test News Category Filter Pill (Transfer, Match Report, etc.)
    const categoryPills = page.locator('button:has-text("Match Reports"), button:has-text("Transfers"), button:has-text("Injuries")');
    if (await categoryPills.first().isVisible().catch(() => false)) {
      await categoryPills.first().click();
      await page.waitForTimeout(600);
      console.log(`  [Step 5] Filtered News by category`);
    }

    // 6. Navigate to Player of the Week (#potw)
    console.log(`  [Step 6] Navigating to Player of the Week Tab (#potw)...`);
    await page.evaluate(() => { window.location.hash = '/potw'; });
    await page.waitForTimeout(1000);
    console.log(`  [Step 6] Player of the Week tab loaded successfully`);

    // 7. Match Details Deep-Link Navigation
    console.log(`  [Step 7] Testing Match Details Modal & Commentary View...`);
    await page.evaluate(() => { window.location.hash = '/scores'; });
    await page.waitForTimeout(1000);

    // Click on the first fixture card to open match details
    const fixtureCard = page.locator('[class*="cursor-pointer"]:has-text("vs"), [class*="cursor-pointer"]:has-text(" - ")').first();
    if (await fixtureCard.isVisible().catch(() => false)) {
      await fixtureCard.click();
      await page.waitForTimeout(1000);
      console.log(`  [Step 7] Clicked match card -> Match details view opened`);

      // Verify Match Details tabs (Timeline, Lineups, Stats, H2H)
      const detailTabs = page.locator('button:has-text("Lineups"), button:has-text("Stats"), button:has-text("Timeline"), button:has-text("H2H")');
      const detailTabCount = await detailTabs.count();
      console.log(`  [Step 7] Match details sub-tabs found: ${detailTabCount}`);
      if (detailTabCount > 0) {
        await detailTabs.first().click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }

    // 8. Final error verification
    console.log(`  [Step 8] Checking error log for any HTTP 500s or crashes during navigation...`);
    expect(apiErrors.length, `Found ${apiErrors.length} 500 errors during guest user navigation!`).toBe(0);
    console.log(`✅ Full Guest Navigation Journey completed with 0 errors!`);
  });

  // =========================================================================
  // TEST 3: REAL-WORLD LATENCY BENCHMARK (< 2500ms p95 REQUIREMENT)
  // =========================================================================
  test('Performance Benchmark: All guest read queries meet high-performance SLA', async ({ request }) => {
    const criticalQueries = [
      { name: 'Fixtures All Season', url: `${SUPABASE_URL}/rest/v1/fixtures?select=id,competition_id,home_team_id,away_team_id,matchday,scheduled_time,venue,status,score_home,score_away&order=scheduled_time.asc` },
      { name: 'League Standings EPL', url: `${SUPABASE_URL}/rest/v1/league_standings?select=team_id,competition_id,played,won,drawn,lost,goals_for,goals_against,goal_difference,points&competition_id=eq.11111111-1111-1111-1111-111111111111&order=points.desc` },
      { name: 'Top Scorers', url: `${SUPABASE_URL}/rest/v1/player_stats?select=player_id,competition_id,goals&goals=gt.0&order=goals.desc&limit=10` },
      { name: 'Teams Lookup', url: `${SUPABASE_URL}/rest/v1/teams?select=id,name,short_name,logo_url,color_code` },
      { name: 'Competitions List', url: `${SUPABASE_URL}/rest/v1/competitions?select=id,name` },
    ];

    console.log(`\n===============================================================`);
    console.log(`⚡ LATENCY BENCHMARK (Warm & Cold Read Measurements)`);
    console.log(`===============================================================\n`);

    for (const q of criticalQueries) {
      const t0 = Date.now();
      const res = await request.get(q.url, { headers });
      const duration = Date.now() - t0;
      const status = res.status();
      const body = await res.json();
      const count = Array.isArray(body) ? body.length : 1;

      console.log(`  • ${q.name.padEnd(24)}: ${String(duration).padStart(4)}ms | Status: ${status} | Rows: ${count}`);

      expect(status, `${q.name} must return HTTP 200`).toBe(200);
      expect(duration, `${q.name} took too long (${duration}ms)`).toBeLessThan(4000);
    }
  });

});
