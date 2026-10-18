import { test, expect } from '@playwright/test';

test.describe('Storefront Guest Cart Persistence', () => {
  test('persists cart items for unauthenticated guest across tab close and reopening', async ({ context }) => {
    // 1. Open the initial tab
    const page = await context.newPage();
    await page.goto('/#/store', { waitUntil: 'domcontentloaded' });

    // Ensure we start with clean guest storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for store product cards to load
    const addButtons = page.locator('button[aria-label="Add product to cart"]');
    await expect(addButtons.first()).toBeVisible({ timeout: 15000 });
    const availableProductCount = await addButtons.count();
    expect(availableProductCount).toBeGreaterThanOrEqual(4);

    // Pick a random number of items between 2 and 4 (less than 6 so login is not triggered)
    const randomCount = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    console.log(`[Test] Random items selected to add: ${randomCount}`);

    const selectedProductNames: string[] = [];

    for (let i = 0; i < randomCount; i++) {
      // Find the i-th add-to-cart button that is not yet added
      const currentAddBtn = page.locator('button[aria-label="Add product to cart"]').nth(0);
      await currentAddBtn.scrollIntoViewIfNeeded();
      await currentAddBtn.click();

      // Specifications modal opens
      const confirmBtn = page.locator('button:has-text("Confirm & Add to Cart")');
      await expect(confirmBtn).toBeVisible({ timeout: 5000 });

      // Grab the product name from modal
      const modalProductName = await page.locator('.fixed.inset-0.z-50 h3').first().innerText();
      selectedProductNames.push(modalProductName.trim());
      console.log(`[Test] Added product (${i + 1}/${randomCount}): ${modalProductName.trim()}`);

      // Click Confirm & Add to Cart
      await confirmBtn.click();
      await expect(confirmBtn).not.toBeVisible({ timeout: 5000 });

      // Small pause to allow state & local storage write
      await page.waitForTimeout(300);
    }

    // Verify login modal was NOT triggered because count < 6
    const authModalHeading = page.locator('text=Create Account to Save Cart');
    await expect(authModalHeading).not.toBeVisible();

    // Verify header floating cart count displays the expected random count
    const cartButton = page.locator('button[aria-label="View shopping cart"]');
    await expect(cartButton).toBeVisible();
    await expect(cartButton).toContainText(String(randomCount));

    // 2. Completely close the tab as requested by the user
    console.log('[Test] Closing the active store tab...');
    await page.close();

    // 3. Open a new tab in the same browser context (same localStorage)
    console.log('[Test] Opening a new tab to access the store again...');
    const newPage = await context.newPage();
    await newPage.goto('/#/store', { waitUntil: 'domcontentloaded' });

    // Verify floating cart badge retained the exact random count after reopening
    const newCartButton = newPage.locator('button[aria-label="View shopping cart"]');
    await expect(newCartButton).toBeVisible({ timeout: 15000 });
    await expect(newCartButton).toContainText(String(randomCount));

    // Open Cart Drawer
    await newCartButton.click();

    // Verify Cart Drawer is open
    const cartHeading = newPage.locator('text=Shopping Cart');
    await expect(cartHeading).toBeVisible({ timeout: 5000 });

    // Verify each selected product name is present in the reopened cart
    for (const name of selectedProductNames) {
      console.log(`[Test] Verifying persistence of item: "${name}"`);
      const itemTitle = newPage.locator(`h4:has-text("${name}")`).first();
      await expect(itemTitle).toBeVisible();
    }

    console.log(`[Test] SUCCESS: All ${randomCount} items verified intact in the cart after tab was completely closed and reopened.`);
  });
});
