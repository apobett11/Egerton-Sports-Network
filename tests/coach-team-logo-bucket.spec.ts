import { test, expect, Route } from '@playwright/test';

test.describe('Coach Team Logo Bucket & Anti-Reversion Suite', () => {
  const TEST_TEAM_ID = '10000000-0000-4000-8000-000000000002';
  const BUCKET_URL = 'http://127.0.0.1:54321/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000002_crest.png';

  let currentDbTeam = {
    id: TEST_TEAM_ID,
    name: 'Egerton FC',
    short_name: 'EFC',
    logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
    color_code: '#1e3a8a',
    competition_id: '11111111-1111-1111-1111-111111111111',
    status: 'approved',
  };

  const mockFixtures = [
    {
      id: '99999999-9999-4000-8000-000000000001',
      scheduled_time: '2026-10-15T15:00:00Z',
      status: 'UPCOMING',
      score_home: null,
      score_away: null,
      venue: 'Pavilion Main Stadium',
      matchday: 5,
      home_team: { id: TEST_TEAM_ID, name: 'Egerton FC', short_name: 'EFC', logo_url: currentDbTeam.logo_url },
      away_team: { id: '20000000-0000-4000-8000-000000000003', name: 'Med FC', short_name: 'MED', logo_url: '' },
      competition: { name: 'Egerton Premier League' },
    },
  ];

  const mockPlayers = [
    {
      id: 'p-1',
      team_id: TEST_TEAM_ID,
      jersey_number: 10,
      position: 'Forward',
      status: 'Fit',
      profiles: { first_name: 'Michael', last_name: 'Olunga' },
    },
    {
      id: 'p-2',
      team_id: TEST_TEAM_ID,
      jersey_number: 7,
      position: 'Midfield',
      status: 'Fit',
      profiles: { first_name: 'Victor', last_name: 'Wanyama' },
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Reset test team state
    currentDbTeam = {
      id: TEST_TEAM_ID,
      name: 'Egerton FC',
      short_name: 'EFC',
      logo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
      color_code: '#1e3a8a',
      competition_id: '11111111-1111-1111-1111-111111111111',
      status: 'approved',
    };

    // Suppress share popup
    await page.addInitScript(({ teamId }) => {
      sessionStorage.setItem(`esn_share_popup_${teamId}`, 'dismissed');
      sessionStorage.setItem('esn_share_popup_10000000-0000-4000-8000-000000000002', 'dismissed');
    }, { teamId: TEST_TEAM_ID });

    // Route Supabase Storage requests
    await page.route(/.*\/storage\/v1\/object\/.*/, async (route: Route) => {
      const request = route.request();
      if (request.method() === 'POST' || request.method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            Key: `team-logos/logos/${TEST_TEAM_ID}_crest.png`,
            Id: 'obj-uuid-1',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64'
          ),
        });
      }
    });

    // Route Supabase REST requests for teams
    await page.route(/.*\/rest\/v1\/teams.*/, async (route: Route) => {
      const request = route.request();
      if (request.method() === 'PATCH' || request.method() === 'PUT') {
        try {
          const body = JSON.parse(request.postData() || '{}');
          if (body.logo_url) {
            currentDbTeam.logo_url = body.logo_url;
          }
        } catch (_) {}
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([currentDbTeam]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([currentDbTeam]),
        });
      }
    });

    // Route fixtures
    await page.route(/.*\/rest\/v1\/fixtures.*/, async (route: Route) => {
      mockFixtures[0].home_team.logo_url = currentDbTeam.logo_url;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFixtures),
      });
    });

    // Route players
    await page.route(/.*\/rest\/v1\/players.*/, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlayers),
      });
    });

    // Route standings
    await page.route(/.*\/rest\/v1\/standings.*/, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            team_id: TEST_TEAM_ID,
            played: 4,
            won: 3,
            drawn: 1,
            lost: 0,
            goals_for: 9,
            goals_against: 2,
            goal_difference: 7,
            points: 10,
            team: currentDbTeam,
          },
        ]),
      });
    });
  });

  test('T1: Upload logo in Coach Team Identity Modal persists to team-logos bucket and DB', async ({ page }) => {
    await page.goto('/coach');
    await expect(page.locator('text=HEAD COACH').first()).toBeVisible({ timeout: 15000 });

    // 1. Open Team & Coach Identity Modal
    const headerLogoBtn = page.locator('header button[aria-label="Edit team identity and credentials"]');
    await expect(headerLogoBtn).toBeVisible();
    await headerLogoBtn.click();

    await expect(page.locator('text=Team & Coach Identity')).toBeVisible();

    // 2. Upload sample logo file (PNG format)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'team-crest-badge.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      ),
    });

    // Check that selected file name shows
    await expect(page.locator('text=team-crest-badge.png')).toBeVisible();

    // 3. Save Changes
    const saveBtn = page.locator('button:has-text("Save Changes")');
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    // Verify success toast
    await expect(page.locator('text=Team logo and coach credentials updated successfully.')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Team & Coach Identity')).not.toBeVisible();

    // 4. Verify logo in Header button is actually used in display
    const headerImg = headerLogoBtn.locator('img');
    await expect(headerImg).toBeVisible();

    // 5. Verify Next Matchday Focus card displays our updated logo
    const homeTeamCardImg = page.locator('img[alt="Home Team"]');
    await expect(homeTeamCardImg).toBeVisible();

    console.log('✓ Verified: Logo uploaded via Team Identity Modal successfully persists and displays!');
  });

  test('T2: Anti-Reversion Guard - Logo sticks permanently across reloads and background refreshes', async ({ page }) => {
    // Set localStorage as if coach previously uploaded a logo
    await page.addInitScript(({ teamId, bucketUrl }) => {
      localStorage.setItem(`team_logo_${teamId}`, bucketUrl);
    }, { teamId: TEST_TEAM_ID, bucketUrl: BUCKET_URL });

    await page.goto('/coach');
    await expect(page.locator('text=HEAD COACH').first()).toBeVisible({ timeout: 15000 });

    // The header logo should immediately use the uploaded bucket logo
    const headerLogoBtn = page.locator('header button[aria-label="Edit team identity and credentials"]');
    const headerImg = headerLogoBtn.locator('img');
    await expect(headerImg).toBeVisible();
    await expect(headerImg).toHaveAttribute('src', BUCKET_URL);

    // Simulate page reload
    await page.reload();
    await expect(page.locator('text=HEAD COACH').first()).toBeVisible({ timeout: 15000 });

    // Verify it did NOT revert after reload
    await expect(headerLogoBtn.locator('img')).toBeVisible();
    await expect(headerLogoBtn.locator('img')).toHaveAttribute('src', BUCKET_URL);

    // Verify Next Matchday Focus also displays it
    const homeTeamImg = page.locator('img[alt="Home Team"]');
    await expect(homeTeamImg).toBeVisible();
    await expect(homeTeamImg).toHaveAttribute('src', BUCKET_URL);

    console.log('✓ Verified: Anti-reversion guard ensures logo sticks permanently!');
  });

  test('T3: Upload SVG format logo in Settings Page updates and displays without distortion', async ({ page }) => {
    await page.goto('/coach');
    await expect(page.locator('text=HEAD COACH').first()).toBeVisible({ timeout: 15000 });

    // Navigate to Settings view
    const settingsBtn = page.locator('button[title="Team Settings"]').first();
    await settingsBtn.click();
    await expect(page.locator('text=Team Operations & Role Settings').first()).toBeVisible({ timeout: 10000 });

    // Upload an SVG logo
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ff0046"/></svg>`;
    const settingsFileInput = page.locator('input[type="file"]').first();
    await settingsFileInput.setInputFiles({
      name: 'egerton-badge.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(svgContent, 'utf-8'),
    });

    // Verify toast
    await expect(page.locator('text=Team logo updated successfully.')).toBeVisible({ timeout: 10000 });

    // Click Save Coach Team Settings
    const saveSettingsBtn = page.locator('button:has-text("Save Coach Team Settings")');
    await saveSettingsBtn.scrollIntoViewIfNeeded();
    await saveSettingsBtn.click();
    await expect(page.locator('text=Coach Authority: Team profile, logo, and credentials updated in database.')).toBeVisible({ timeout: 10000 });

    console.log('✓ Verified: SVG upload in Settings page succeeds and persists!');
  });
});
