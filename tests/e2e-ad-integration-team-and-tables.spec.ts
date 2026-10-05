import { test, expect } from '@playwright/test';

const DIRECT_LINK = 'https://omg10.com/4/11954980';

test.describe('Ad Breaks After Every Table & Team Profile Saturation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Table breaks: League Table page has breaks after every table', async ({ page }) => {
    await page.goto('/#/table', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Get count of ad banners on the table page
    const banners = await page.evaluate((targetUrl) => {
      const anchors = Array.from(document.querySelectorAll(`a[href="${targetUrl}"]`));
      return anchors.map((a) => {
        const rect = a.getBoundingClientRect();
        return {
          height: rect.height,
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel'),
          text: a.textContent || '',
        };
      });
    }, DIRECT_LINK);

    // We should have at least 5 banners on the standings page (EPL table break, Champ table break, EPL form break, Champ form break, Top scorers break, POTW break, Assists break, etc.)
    expect(banners.length).toBeGreaterThanOrEqual(5);

    for (const b of banners) {
      if (b.height > 0) {
        expect(b.height).toBeLessThanOrEqual(52);
        expect(b.target).toBe('_blank');
        expect(b.rel).toBe('noopener noreferrer');
      }
    }
  });

  test('Team Profile has ads all over: sticky footer and inline banners', async ({ page }) => {
    // Navigate to Standings and click on a team in tbody to open Team Profile
    await page.goto('/#/table', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const teamCell = page.locator('tbody td.standings-team-cell').first();
    if (await teamCell.count() > 0) {
      await teamCell.click();
      await page.waitForTimeout(2500);

      // Verify Sticky Footer Banner is present on Team Profile
      const stickyBanner = page.locator('aside[aria-label="Sponsored Match Ad"]');
      await expect(stickyBanner).toBeVisible();

      const stickyLink = stickyBanner.locator(`a[href="${DIRECT_LINK}"]`);
      await expect(stickyLink).toBeVisible();
      await expect(stickyLink).toHaveAttribute('target', '_blank');

      // Verify inline banners inside team details
      const inlineBanners = page.locator(`main a[href="${DIRECT_LINK}"]`);
      const count = await inlineBanners.count();
      expect(count).toBeGreaterThan(0);

      // Switch to Squad tab and verify banners
      const squadTab = page.locator('button:has-text("Squad")').first();
      if (await squadTab.count() > 0) {
        await squadTab.click();
        await page.waitForTimeout(1000);
        const squadBanners = await page.locator(`main a[href="${DIRECT_LINK}"]`).count();
        expect(squadBanners).toBeGreaterThan(0);
      }

      // Switch to Standings tab and verify banners after tables
      const standingsTab = page.locator('button:has-text("Standings")').first();
      if (await standingsTab.count() > 0) {
        await standingsTab.click();
        await page.waitForTimeout(1000);
        const tabBanners = await page.locator(`main a[href="${DIRECT_LINK}"]`).count();
        expect(tabBanners).toBeGreaterThan(0);
      }
    }
  });
});
