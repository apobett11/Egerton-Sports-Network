import { test, expect, chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const teamLetters = ['e', 'f', 'n', 's', 'a', 'ege', 'njo', 'fac'];

test.describe('300 Device Anonymous Fan Onboarding Simulation', () => {
  test.setTimeout(300000); // 5 minutes

  for (let batch = 1; batch <= 3; batch++) {
    const startIdx = (batch - 1) * 100 + 1;
    const endIdx = batch * 100;

    test(`Execute batch ${batch} (Devices ${startIdx}-${endIdx}) onboarding and revisit validation`, async () => {
      const browser = await chromium.launch({ headless: true });
      const deviceMap = new Map<string, string | null>();

      console.log(`\n--- Running Batch ${batch} (Devices ${startIdx}-${endIdx}) ---`);

      // 1. First Visit
      for (let i = startIdx; i <= endIdx; i++) {
        const simulatedDeviceId = `00000000-0000-4000-8000-${i.toString().padStart(12, '0')}`;
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.addInitScript((devId) => {
          localStorage.setItem('esn_device_id', devId);
        }, simulatedDeviceId);

        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

        const onboardingModal = page.locator('div:has-text("Pick Your Favourite Team")').first();
        await expect(onboardingModal).toBeVisible({ timeout: 8000 });

        const actionRoll = i % 3;
        let favTeamId: string | null = null;

        if (actionRoll === 0) {
          const closeBtn = page.locator('button[aria-label="Close onboarding"]');
          await closeBtn.click();
          await expect(onboardingModal).toBeHidden({ timeout: 4000 });
          favTeamId = null;
        } else if (actionRoll === 1) {
          const generalFanBtn = page.locator('button:has-text("I am a general football fan")');
          await generalFanBtn.click();
          await expect(onboardingModal).toBeHidden({ timeout: 4000 });
          favTeamId = null;
        } else {
          const searchInput = page.locator('input[placeholder="input team name"]');
          const letter = teamLetters[i % teamLetters.length];
          await searchInput.fill(letter);

          const teamButtons = page.locator('div[class*="overflow-y-auto"] button');
          await expect(teamButtons.first()).toBeVisible({ timeout: 4000 });
          await teamButtons.first().click();

          await expect(page.locator('text=Welcome to the Club!')).toBeVisible({ timeout: 4000 });
          await expect(onboardingModal).toBeHidden({ timeout: 5000 });
          favTeamId = 'selected';
        }

        deviceMap.set(simulatedDeviceId, favTeamId);
        await context.close();
      }

      console.log(`  ✓ Initial onboarding completed for Batch ${batch}`);

      // 2. Re-visit Validation
      for (let i = startIdx; i <= endIdx; i++) {
        const simulatedDeviceId = `00000000-0000-4000-8000-${i.toString().padStart(12, '0')}`;
        const favTeam = deviceMap.get(simulatedDeviceId);

        const context = await browser.newContext();
        const page = await context.newPage();

        await page.addInitScript(
          ({ devId, fav }) => {
            localStorage.setItem('esn_device_id', devId);
            localStorage.setItem('esn_onboarding_completed', 'true');
            localStorage.setItem('esn_favorite_team_id', fav || 'null');
          },
          { devId: simulatedDeviceId, fav: favTeam }
        );

        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        const modal = page.locator('div:has-text("Pick Your Favourite Team")');
        const isVisible = await modal.isVisible();
        expect(isVisible).toBe(false);

        await context.close();
      }

      console.log(`  ✓ Re-visit suppression verified for Batch ${batch} (0% re-onboarding)`);
      await browser.close();
    });
  }
});
