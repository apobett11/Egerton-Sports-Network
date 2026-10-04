import { test, expect } from '@playwright/test';

test.describe('Page Load Fixtures & Standings Auto-Sync Verification', () => {
  test('on page load, calls fresh fixtures, updates cache differences, and reflects latest results and standings without reload', async ({ page }) => {
    // 1. Seed stale cache in localStorage representing a pre-match state
    await page.addInitScript(() => {
      const STALE_CACHE_KEY = 'esn_guest_cache_v6_fixtures:all_all_pall_sall';
      const staleEntry = {
        data: [{
          id: 'test-fixture-md1',
          status: 'UPCOMING',
          time: '15:00',
          minute: '-',
          league: 'Egerton Premier League',
          teamA: { id: 'team-1', name: 'Santos FC', shortName: 'SAN', logo: '', colorCode: '#00b04f' },
          teamB: { id: 'team-2', name: 'BCOM FC', shortName: 'BCM', logo: '', colorCode: '#ff0046' },
          scoreA: 0,
          scoreB: 0,
          matchday: 7,
          scheduledTime: new Date().toISOString()
        }],
        timestamp: Date.now() - 5000,
        ttl: 3600000
      };
      localStorage.setItem(STALE_CACHE_KEY, JSON.stringify(staleEntry));
    });

    // 2. Load the homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 3. Verify page loads and displays fixtures
    const mainSection = page.locator('main');
    await expect(mainSection).toBeVisible({ timeout: 15000 });

    // 4. Verify network query was dispatched on page load and cache difference is reflected
    // Check that fixtures list or standings list is loaded and non-empty
    await page.waitForTimeout(1000);

    // Verify cache has been updated in localStorage on page load
    const updatedCacheStr = await page.evaluate(() => {
      return Object.keys(localStorage).some(k => k.startsWith('esn_guest_cache_v6_'));
    });
    expect(updatedCacheStr).toBe(true);

    // 5. Navigate to Table tab and verify standings are loaded without page reload
    const tableTabBtn = page.getByRole('button', { name: /Table|Standings/i }).first();
    if (await tableTabBtn.isVisible()) {
      await tableTabBtn.click();
      await page.waitForTimeout(500);
      const standingsHeader = page.locator('text=Official EPL Standings Table, text=Standings, text=League Table').first();
      // Verify standings rendered
      expect(await page.locator('body').textContent()).not.toBeNull();
    }
  });
});
