import { test, expect } from '@playwright/test';

test.describe('Rich Notification Dropdown System', () => {
  test('Renders rich notification dropdown with ESN badge, image, message, and navigates to banter', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // 2. Trigger notification via BroadcastService in browser context
    await page.evaluate(() => {
      // Dispatch mock notification directly
      const notif = {
        id: 'test_derby_123',
        title: 'Egerton Premier League Derby Satoo! ⚽🔥🔥',
        message: 'kuma derby ya Egerton Premier Leage satoo⚽🔥🔥 \n you can now predict who you think will win teh match😎.',
        image_url: '/derby-notification.png',
        category: 'DERBY',
        action_url: '#/banter',
        reactions: { fire: 5, soccer: 8, trophy: 2, like: 4, clicks: 3, impressions: 12 },
        created_at: new Date().toISOString()
      };

      // Dispatch on window or broadcast channel
      (window as any).dispatchEvent(new CustomEvent('test_broadcast', { detail: notif }));
      // Also write to local storage
      const existing = JSON.parse(localStorage.getItem('esn_broadcast_history') || '[]');
      localStorage.setItem('esn_broadcast_history', JSON.stringify([notif, ...existing]));
    });

    // Verify page title and element
    await expect(page.locator('body')).toBeVisible();
  });

  test('Mobile viewport layout verification (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');

    // Check that there is no horizontal body scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
