import { test, expect } from '@playwright/test';

const DEVICE_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

test.describe('Livescore prediction dashboard', () => {
  test('device cache skips onboarding after a club is chosen', async ({ page }) => {
    await page.addInitScript((deviceId) => {
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_prediction_dash_v1', JSON.stringify({
        deviceId,
        favouriteTeam: 'Santos FC',
        favouriteTeamId: null,
        fanaticAnswered: true,
        footballFanatic: 'yes',
        predictions: [],
        step: 'derby',
        slipListOpen: false,
        activeDayKey: null,
        lockedSaturday: null,
        lockedSunday: null,
        updatedAt: new Date().toISOString(),
      }));
    }, DEVICE_ID);

    await page.goto('/#/home');
    await page.waitForLoadState('domcontentloaded');
    const news = page.getByRole('button', { name: /^NEWS$/i }).first();
    if (await news.isVisible()) {
      await news.click();
    }

    await expect(page.getByText(/Are you a football fanatic/i)).toHaveCount(0);
  });
});
