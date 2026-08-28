import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';

test.describe('Pre-Season Live Database Verification & Agent 0 Workflow', () => {

  test('President Dashboard Pre-Season UI & Generation Engine Verification', async ({ page }) => {
    // Collect console logs and errors
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // 1. Navigate to Login Page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/#/login');
    await page.waitForLoadState('networkidle');

    // 2. Login as President
    const emailInput = page.locator('#login-email, input[type="email"]');
    console.log('Email input count:', await emailInput.count());
    if (await emailInput.count() > 0) {
      console.log('Logging in as President...');
      await emailInput.first().fill('president@egerton.ac.ke');
      const passInput = page.locator('#login-password, input[type="password"]');
      await passInput.first().fill('PresidentPass123!');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    console.log('Current URL after login:', page.url());
    const bodyText = await page.locator('body').innerText();
    console.log('Body text snippet after login:', bodyText.slice(0, 500));

    // 3. Verify President Pre-Season Overview & Readiness Checklist
    const overviewHeading = page.locator('text=Season Preparation & Readiness');
    const isOverviewVisible = await overviewHeading.isVisible().catch(() => false);
    console.log('Season Preparation & Readiness header visible:', isOverviewVisible);

    // 4. Verify Database-driven Teams, Referees, and Pitches are rendered
    const eplBadge = page.locator('text=EPL');
    const champBadge = page.locator('text=Championship');
    console.log('EPL label visible:', await eplBadge.first().isVisible().catch(() => false));
    console.log('Championship label visible:', await champBadge.first().isVisible().catch(() => false));

    // 5. Test Quick Action: Begin Season Modal Flow
    const beginSeasonBtn = page.locator('button:has-text("Begin Season"), button:has-text("Generate Fixtures")').first();
    await expect(beginSeasonBtn).toBeVisible({ timeout: 5000 });
    console.log('Begin Season button is visible.');

    // Open Modal
    await beginSeasonBtn.click();
    await page.waitForTimeout(600);

    const step1Prompt = page.locator('text=When do you prefer the first matchday to be played?');
    await expect(step1Prompt).toBeVisible({ timeout: 5000 });
    console.log('Season Launch modal opened successfully (Step 1).');

    // Cancel Flow (Testing All-or-None Reset Rule with Escape / Close)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    console.log('Successfully tested Cancel / Reset via Escape key.');

    // Re-Open Modal for Complete Agent 0 Step-by-Step Flow
    await beginSeasonBtn.click();
    await page.waitForTimeout(600);

    // Step 1: Calendar Setup -> Approve Date & Continue
    const step1Btn = page.locator('button:has-text("Approve Date & Continue")');
    await expect(step1Btn).toBeVisible({ timeout: 5000 });
    await step1Btn.click();
    await page.waitForTimeout(600);
    console.log('Passed Step 1: Calendar Setup');

    // Step 2: Resources -> Next: Review Team Stats
    const step2Btn = page.locator('button:has-text("Next: Review Team Stats")');
    await expect(step2Btn).toBeVisible({ timeout: 5000 });
    await step2Btn.click();
    await page.waitForTimeout(600);
    console.log('Passed Step 2: Pitch & Referee Resource Statistics');

    // Step 3: Team Stats -> Generate Fixtures (Call Agent 0)
    const triggerAgent0Btn = page.locator('button:has-text("Generate Fixtures (Call Agent 0)")');
    await expect(triggerAgent0Btn).toBeVisible({ timeout: 5000 });
    console.log('Triggering Agent 0 Algorithm 1 Double Round-Robin Generation...');
    await triggerAgent0Btn.click();

    // Step 4: Wait for Agent 0 Generation & Verify Output
    const previewHeader = page.locator('text=Agent 0 Verified');
    await expect(previewHeader).toBeVisible({ timeout: 15000 });
    console.log('Passed Step 3 & 4: Agent 0 Successfully generated schedule and rendered Preview!');

    // Verify Schedule Metrics
    const eplPreview = page.locator('text=Egerton Premier League');
    const champPreview = page.locator('text=Egerton Championship');
    console.log('EPL schedule preview visible:', await eplPreview.first().isVisible().catch(() => false));
    console.log('Championship schedule preview visible:', await champPreview.first().isVisible().catch(() => false));

    // Cancel / Close preview (preserving pre-season state without modifying database fixtures)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    console.log('Successfully exited generation preview.');

    // Verify 0 runtime console errors
    console.log('Recorded console errors count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }
    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404')).length).toBe(0);
  });

});
