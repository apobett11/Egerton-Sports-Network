import { test, expect } from '@playwright/test';

test.describe('Storefront Bottom Navigation & Instant Drawer Switching', () => {
  test('switches between bottom navigation drawers immediately without showing behind another', async ({ page }) => {
    // Set mobile viewport so bottom navigation is active
    await page.setViewportSize({ width: 390, height: 844 });

    // 1. Navigate to store
    await page.goto('/#/store', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Ensure store is loaded
    const bottomNav = page.locator('nav.fixed.bottom-0');
    await expect(bottomNav).toBeVisible({ timeout: 10000 });

    // 2. Click Categories in bottom navigation
    const categoriesTab = bottomNav.locator('button:has-text("Categories")');
    await categoriesTab.click();
    const t0 = Date.now();

    // Verify Categories modal opens fast (sub-second)
    const categoriesModal = page.locator('h3:has-text("Store Categories")');
    await expect(categoriesModal).toBeVisible({ timeout: 1000 });
    const categoriesOpenDuration = Date.now() - t0;
    console.log(`[Test] Categories drawer rendered in ${categoriesOpenDuration}ms (sub-second)`);
    expect(categoriesOpenDuration).toBeLessThan(1000);

    // 3. While Categories is open, immediately click Contact tab in bottom nav
    const contactTab = bottomNav.locator('button:has-text("Contact")');
    await contactTab.click();
    const t1 = Date.now();

    // Verify Contact modal opened and Categories modal is GONE (closed immediately)
    const contactModal = page.locator('h3:has-text("Instant Contact Channels")');
    await expect(contactModal).toBeVisible({ timeout: 1000 });
    await expect(categoriesModal).not.toBeVisible();
    const contactSwitchDuration = Date.now() - t1;
    console.log(`[Test] Switched to Contact in ${contactSwitchDuration}ms, Categories immediately closed`);
    expect(contactSwitchDuration).toBeLessThan(1000);

    // 4. While Contact is open, immediately click Cart tab in bottom nav
    const cartTab = bottomNav.locator('button:has-text("Cart")');
    await cartTab.click();
    const t2 = Date.now();

    // Verify Cart opened and Contact is GONE
    const cartModal = page.locator('h2:has-text("Shopping Cart")');
    await expect(cartModal).toBeVisible({ timeout: 1000 });
    await expect(contactModal).not.toBeVisible();
    const cartSwitchDuration = Date.now() - t2;
    console.log(`[Test] Switched to Cart in ${cartSwitchDuration}ms, Contact immediately closed`);
    expect(cartSwitchDuration).toBeLessThan(1000);

    // 5. While Cart is open, click Home tab in bottom nav
    const homeTab = bottomNav.locator('button:has-text("Home")');
    await homeTab.click();
    const t3 = Date.now();

    // Verify all drawers are closed and storefront catalog is visible
    await expect(cartModal).not.toBeVisible();
    await expect(contactModal).not.toBeVisible();
    await expect(categoriesModal).not.toBeVisible();
    const homeDuration = Date.now() - t3;
    console.log(`[Test] Closed all drawers and returned Home in ${homeDuration}ms`);

    // Verify no modals are showing behind another
    const openBackdrops = await page.locator('.fixed.inset-0.z-50').count();
    expect(openBackdrops).toBe(0);

    console.log('[Test] SUCCESS: Bottom navigation drawers switch sub-second and never show behind another.');
  });
});
