import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Independent Favourites System E2E Suite', () => {
  test('Instant UI update, orange background, white icon, pop animation, and success toast', async ({ page }) => {
    const testDeviceId = '12345678-1234-4000-8000-1234567890ab';

    // 1. Initialize anonymous device ID & mark onboarding as completed to prevent popup interruption
    await page.addInitScript((devId) => {
      localStorage.setItem('esn_device_id', devId);
      localStorage.setItem('esn_onboarding_completed', 'true');
      localStorage.setItem(`esn_device_favorites_${devId}`, '[]');
      localStorage.setItem('favorites', '[]');
    }, testDeviceId);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // 2. Locate first match favorite button by data-testid
    const firstFavBtn = page.locator('[data-testid^="favorite-btn-"]').first();
    await expect(firstFavBtn).toBeVisible({ timeout: 15000 });
    await expect(firstFavBtn).toHaveAttribute('aria-label', 'Add to favourites');

    // 3. Click favorite button
    await firstFavBtn.click();

    // 4. Verification of INSTANT visual changes on the clicked match:
    // - Background turns orange (bg-amber-500)
    // - Container has text-white
    // - Star icon turns white (fill-white text-white)
    // - Animation class is present (.animate-favorite-pop)
    // - Accessible aria-label updates to "Remove from favourites"
    await expect(firstFavBtn).toHaveClass(/bg-amber-500/, { timeout: 3000 });
    await expect(firstFavBtn).toHaveClass(/text-white/);
    await expect(firstFavBtn).toHaveAttribute('aria-label', 'Remove from favourites');
    
    const starIcon = firstFavBtn.locator('svg');
    await expect(starIcon).toHaveClass(/fill-white/);
    await expect(starIcon).toHaveClass(/animate-favorite-pop/);

    // 5. Verification of Toast notification:
    const toast = page.locator('text=Added to favourites').first();
    await expect(toast).toBeVisible({ timeout: 4000 });

    // 6. Verification of Device-Rooted Local Storage Persistence:
    const storedFavorites = await page.evaluate((devId) => {
      const val = localStorage.getItem(`esn_device_favorites_${devId}`);
      return val ? JSON.parse(val) : [];
    }, testDeviceId);

    expect(storedFavorites.length).toBe(1);

    // 7. Verify match is displayed in Favourites Tab:
    const favTabBtn = page.locator('button[aria-label*="Favourites"]').first();
    await favTabBtn.click();

    // In favorites tab, the favorited match is visible with active orange button
    const favActiveBtn = page.locator('[data-testid^="favorite-btn-"]').first();
    await expect(favActiveBtn).toBeVisible({ timeout: 5000 });
    await expect(favActiveBtn).toHaveAttribute('aria-label', 'Remove from favourites');
    await expect(favActiveBtn).toHaveClass(/bg-amber-500/);

    // 8. Toggle off (remove from favorites)
    await favActiveBtn.click();

    // Verification of instant removal from storage
    await page.waitForTimeout(500);
    const emptyFavorites = await page.evaluate((devId) => {
      const val = localStorage.getItem(`esn_device_favorites_${devId}`);
      return val ? JSON.parse(val) : [];
    }, testDeviceId);

    expect(emptyFavorites.length).toBe(0);
  });

  test('Matchday Reset & Deduplication: Matchday over clears, future matchday stays untouched, no duplicate entries', async ({ page }) => {
    const testDeviceId = '87654321-4321-4000-8000-ba0987654321';

    await page.addInitScript((devId) => {
      localStorage.setItem('esn_device_id', devId);
      localStorage.setItem('esn_onboarding_completed', 'true');
    }, testDeviceId);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Execute in browser runtime to test service-level deduplication and matchday reset
    const result = await page.evaluate(async (devId) => {
      const { DeviceService, pruneCompletedFavorites } = await import('/src/services/DeviceService.ts');

      // Test A: Deduplication under rapid clicks
      const m1 = 'aaaaaaaa-1111-4000-8000-000000000001';
      const m2 = 'bbbbbbbb-2222-4000-8000-000000000002';
      
      const set1 = await DeviceService.setFavoriteMatches(devId, [m1, m1, m2, m1, m2]);
      const noDuplicates = set1.length === 2 && set1.includes(m1) && set1.includes(m2);

      // Test B: Matchday Completion Reset
      const md3_1 = '33333333-1111-4000-8000-000000000001';
      const md3_2 = '33333333-2222-4000-8000-000000000002';
      const md4_1 = '44444444-1111-4000-8000-000000000001';
      const md4_2 = '44444444-2222-4000-8000-000000000002';

      // User favorites a matchday 3 match and a future matchday 4 match
      const currentFavs = [md3_1, md4_1];

      // Simulated fixtures where Matchday 3 has concluded, Matchday 4 is upcoming
      const fixtures = [
        { id: md3_1, status: 'FT', matchday: 3 },
        { id: md3_2, status: 'FINAL', matchday: 3 },
        { id: md4_1, status: 'UPCOMING', matchday: 4 },
        { id: md4_2, status: 'UPCOMING', matchday: 4 },
      ];

      const { pruned } = pruneCompletedFavorites(currentFavs, fixtures);

      return {
        noDuplicates,
        md3Cleared: !pruned.includes(md3_1),
        md4Preserved: pruned.includes(md4_1),
        prunedLength: pruned.length
      };
    }, testDeviceId);

    expect(result.noDuplicates).toBe(true);
    expect(result.md3Cleared).toBe(true);
    expect(result.md4Preserved).toBe(true);
    expect(result.prunedLength).toBe(1);
  });
});
