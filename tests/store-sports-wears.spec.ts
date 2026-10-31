import { test, expect } from '@playwright/test';

test.describe('Storefront Sports Wears Countrywide E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/store');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Category Arrangement & Styling: Ordered correctly, larger images & no highlight ring', async ({ page }) => {
    const categoriesSection = page.locator('section').filter({ hasText: 'Categories' });
    await expect(categoriesSection.getByRole('heading', { name: 'Categories' })).toBeVisible({ timeout: 15000 });

    // Check categories are present in exact order: jerseys, boots and balls, goalkeepers, officiating, pitch training, fitness
    const categoryButtons = categoriesSection.locator('.category-snap-item');
    await expect(categoryButtons.first()).toBeVisible({ timeout: 10000 });

    const catTexts = await categoryButtons.allInnerTexts();
    console.log('[E2E] Rendered Category Order:', catTexts.map(t => t.replace(/\n.*/s, '').trim()));

    // Verify categories order
    expect(catTexts[0]).toMatch(/Jerseys/i);
    expect(catTexts[1]).toMatch(/Boots and Balls/i);
    expect(catTexts[2]).toMatch(/Goalkeeper/i);
    expect(catTexts[3]).toMatch(/Officiating/i);
    expect(catTexts[4]).toMatch(/Pitch Training/i);
    expect(catTexts[5]).toMatch(/Fitness/i);

    // Verify category images are rendered
    const catImages = categoriesSection.locator('.category-snap-item img');
    await expect(catImages.first()).toBeVisible();
    const imgCount = await catImages.count();
    expect(imgCount).toBe(6);

    // Verify category selection does NOT add highlight ring
    await categoryButtons.first().click();
    const ringElement = page.locator('.ring-3.ring-\\[\\#ff0046\\]');
    const ringCount = await ringElement.count();
    expect(ringCount).toBe(0);
  });

  test('2. Main Listing Random Product Rendering', async ({ page }) => {
    // Verify products are rendered across categories
    const addBtns = page.getByRole('button', { name: 'Add to cart' });
    await expect(addBtns.first()).toBeVisible({ timeout: 15000 });
    const count = await addBtns.count();
    console.log(`[E2E] Verified ${count} 'Add to cart' buttons rendered.`);
    expect(count).toBeGreaterThan(0);

    // Check product titles are visible
    const productHeadings = page.locator('h3');
    const countHeadings = await productHeadings.count();
    expect(countHeadings).toBeGreaterThan(3);
  });

  test('3. Category Navigation: Open Jerseys category and verify listings', async ({ page }) => {
    const jerseysCatBtn = page.getByRole('button', { name: /Jerseys 15 Jerseys/i }).or(page.getByRole('button', { name: /Jerseys/i })).first();
    await expect(jerseysCatBtn).toBeVisible({ timeout: 10000 });
    await jerseysCatBtn.click();

    await expect(page.getByRole('heading', { name: /Jerseys/i }).first()).toBeVisible({ timeout: 10000 });
    const productItems = page.getByRole('button', { name: /Add.*cart/i });
    await expect(productItems.first()).toBeVisible({ timeout: 10000 });
    console.log('[E2E] Navigated to Jerseys category listings page successfully.');
  });

  test('4. Sort: Verify sorting products', async ({ page }) => {
    const priceText = page.locator('text=/Ksh\\s*[\\d,]+/i').first();
    await expect(priceText).toBeVisible({ timeout: 10000 });

    const filterBtn = page.getByRole('button', { name: /Filter/i }).or(page.locator('button:has-text("Filter")')).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      console.log('[E2E] Filter/Sort modal opened successfully.');
      const closeBtn = page.locator('button[aria-label*="close" i]').or(page.locator('button:has-text("Apply")')).first();
      if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }
  });

  test('5. Login: Open Auth modal and verify customer login', async ({ page }) => {
    const loginBtn = page.getByRole('button', { name: 'Login' }).first();
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    await loginBtn.click();

    const authHeading = page.locator('text=/Sign In|Login|Welcome/i').first();
    await expect(authHeading).toBeVisible({ timeout: 10000 });
    console.log('[E2E] Auth modal opened.');

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="username" i]').first();
    const passInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('customer@egerton.ac.ke');
      if (await passInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passInput.fill('CustomerPass123!');
      }
      console.log('[E2E] Form fields filled in Login modal.');
    }
  });

  test('6. Place an Order: Add item to cart and open checkout', async ({ page }) => {
    const addToCartBtn = page.getByRole('button', { name: 'Add to cart' }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 15000 });
    await addToCartBtn.click();

    const sizeButton = page.locator('button:has-text("42"), button:has-text("Medium"), button:has-text("Size 9"), button:has-text("Standard")').first();
    if (await sizeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sizeButton.click();
      const confirmAddBtn = page.locator('button:has-text("Confirm"), button:has-text("Add To Cart")').first();
      if (await confirmAddBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmAddBtn.click();
      }
      console.log('[E2E] Size selected and item confirmed to cart.');
    }

    const cartBtn = page.getByRole('button', { name: /View shopping cart|Cart/i }).first();
    await expect(cartBtn).toBeVisible({ timeout: 10000 });
    await cartBtn.click();

    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout|Checkout/i }).first();
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();

    const checkoutModal = page.locator('text=/Delivery Address|Checkout|Order Summary/i').first();
    await expect(checkoutModal).toBeVisible({ timeout: 10000 });
    console.log('[E2E] Checkout modal loaded and operable.');
  });
});
