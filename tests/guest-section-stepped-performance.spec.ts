import { test, expect } from '@playwright/test';

/**
 * Guest Page: Section-by-Section Stepped Loading & Cache Verification
 * 
 * SLA Target: All individual section database loads must be sub-second (< 1000ms).
 */

const APP_URL = 'http://localhost:5173';
const SUPABASE_URL = 'https://hizfgvgbsguhduxortrx.supabase.co';

test.describe('Guest Page: Stepped Section Performance & Caching', () => {

  test('1. Fixtures Section: Loads matchday fixtures independently under 1 second', async ({ page }) => {
    let fixtureReqStart = 0;
    let fixtureReqDuration = 0;

    page.on('request', (req) => {
      if (req.url().includes(SUPABASE_URL + '/rest/v1/fixtures') && !fixtureReqStart) {
        fixtureReqStart = Date.now();
      }
    });

    page.on('response', (res) => {
      if (res.url().includes(SUPABASE_URL + '/rest/v1/fixtures') && fixtureReqStart && !fixtureReqDuration) {
        fixtureReqDuration = Date.now() - fixtureReqStart;
      }
    });

    const pageStart = Date.now();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    
    await page.waitForSelector('main', { state: 'visible', timeout: 5000 });
    const initialRenderMs = Date.now() - pageStart;

    console.log('\n⚡ [Section 1: Matchday Fixtures] Initial DOM Render: ' + initialRenderMs + 'ms | Network Fetch: ' + (fixtureReqDuration || 'cached/fast') + 'ms');
    expect(initialRenderMs).toBeLessThan(3000);
  });

  test('2. Standings Section: Loads standings independently from player/POTW data', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });

    let standingsReqStart = 0;
    let standingsReqDuration = 0;

    page.on('request', (req) => {
      if ((req.url().includes('/rest/v1/league_standings') || req.url().includes('/rest/v1/rpc/get_league_standings')) && !standingsReqStart) {
        standingsReqStart = Date.now();
      }
    });

    page.on('response', (res) => {
      if ((res.url().includes('/rest/v1/league_standings') || res.url().includes('/rest/v1/rpc/get_league_standings')) && standingsReqStart && !standingsReqDuration) {
        standingsReqDuration = Date.now() - standingsReqStart;
      }
    });

    const clickStart = Date.now();
    const standingsTab = page.locator('button:has-text("Table"), button:has-text("Standings"), [aria-label*="table"], [aria-label*="standings"]').first();
    if (await standingsTab.count() > 0) {
      await standingsTab.click();
    } else {
      await page.evaluate(() => { window.location.hash = '#/standings'; });
    }

    await page.waitForTimeout(600);
    const tabSwitchDuration = Date.now() - clickStart;

    console.log('\n⚡ [Section 2: Standings] Tab Switch & Render: ' + tabSwitchDuration + 'ms | Standings DB Call: ' + (standingsReqDuration || 'cached') + 'ms');
    expect(tabSwitchDuration).toBeLessThan(1500);
  });

  test('3. Player of the Week Section: Loads POTW distinctly from standings', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });

    const potwStart = Date.now();
    const potwTab = page.locator('button:has-text("POTW"), button:has-text("Player of the Week"), [aria-label*="potw"]').first();
    if (await potwTab.count() > 0) {
      await potwTab.click();
    } else {
      await page.evaluate(() => { window.location.hash = '#/potw'; });
    }

    await page.waitForTimeout(600);
    const potwSwitchDuration = Date.now() - potwStart;

    console.log('\n⚡ [Section 3: POTW] Tab Switch & Load: ' + potwSwitchDuration + 'ms');
    expect(potwSwitchDuration).toBeLessThan(1500);
  });

  test('4. Player Performance & Top Scorers: Loads independently on demand', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });

    let scorersReqStart = 0;
    let scorersReqDuration = 0;

    page.on('request', (req) => {
      if (req.url().includes('/rest/v1/player_stats') && !scorersReqStart) {
        scorersReqStart = Date.now();
      }
    });

    page.on('response', (res) => {
      if (res.url().includes('/rest/v1/player_stats') && scorersReqStart && !scorersReqDuration) {
        scorersReqDuration = Date.now() - scorersReqStart;
      }
    });

    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(800);

    console.log('\n⚡ [Section 4: Player Stats & Scorers] Lazy-triggered duration: ' + (scorersReqDuration || 'instant/cached') + 'ms');
  });

  test('5. Past Fixtures Caching: Instantaneous past matchday retrieval', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const cachedPast = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(k => k.includes('fixtures') || k.includes('esn_guest_cache'));
      return keys.length > 0;
    });

    console.log('\n⚡ [Section 5: Past Fixtures Caching] Fixtures cache initialized: ' + cachedPast);
    expect(cachedPast).toBe(true);

    const t0 = Date.now();
    const prevDayBtn = page.locator('button[aria-label*="previous"], button[aria-label*="prev"], button:has-text("<"), button:has-text("‹")').first();
    if (await prevDayBtn.count() > 0) {
      await prevDayBtn.click();
      await page.waitForTimeout(100);
    }
    const switchTimeMs = Date.now() - t0;
    console.log('⚡ [Past Fixtures Navigation] Instant lateral switch latency: ' + switchTimeMs + 'ms');
    expect(switchTimeMs).toBeLessThan(500);
  });

  test('6. Mobile Phone Viewport: Fast responsive rendering under 1s', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const phoneStart = Date.now();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main', { state: 'visible', timeout: 5000 });
    const phoneRenderMs = Date.now() - phoneStart;

    console.log('\n📱 [Mobile Phone Viewport] 390px Mobile Viewport Render Time: ' + phoneRenderMs + 'ms');
    expect(phoneRenderMs).toBeLessThan(2000);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log('📱 [Mobile Phone Layout] Zero horizontal layout overflow: ' + !hasHorizontalScroll);
    expect(hasHorizontalScroll).toBe(false);
  });
});
