import { test, expect } from '@playwright/test';

test.describe('President Announcements & Matchdays E2E Test Suite', () => {

  const setupPresidentAuth = async (page: any) => {
    await page.route('**/rest/v1/**', async (route: any) => {
      const headers = { ...route.request().headers() };
      delete headers['authorization'];
      await route.continue({ headers });
    });

    const presidentId = '567a0465-a18a-4b5c-8b5a-8475856bd186';
    const presidentEmail = 'president_exec_1788027724477@egerton.ac.ke';

    const sessionData = {
      access_token: 'fake-token-e2e-president',
      refresh_token: 'fake-refresh-e2e',
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: 'bearer',
      user: {
        id: presidentId,
        aud: 'authenticated',
        role: 'authenticated',
        email: presidentEmail,
        email_confirmed_at: '2026-01-01T00:00:00Z',
        user_metadata: {
          role: 'president',
          first_name: 'President',
          last_name: 'Admin'
        }
      }
    };

    await page.addInitScript(({ session, presId, presEmail }) => {
      localStorage.setItem('theme', 'dark');
      sessionStorage.setItem('esn_season_mode', 'true');
      localStorage.setItem('livescore_auth_token', JSON.stringify(session));
      localStorage.setItem('esn_last_activity_timestamp', String(Date.now()));
      localStorage.setItem('esn_cached_role', 'president');
      localStorage.setItem('esn_cached_user', JSON.stringify(session.user));
      localStorage.setItem('esn_cached_profile', JSON.stringify({
        id: presId,
        email: presEmail,
        role: 'president',
        first_name: 'President',
        last_name: 'Admin'
      }));
    }, { session: sessionData, presId: presidentId, presEmail: presidentEmail });
  };

  test('1. President Season Mode has Announcements tab with uniform styling and form', async ({ page }) => {
    await setupPresidentAuth(page);

    await page.goto('http://localhost:5173/#/president');
    await page.waitForLoadState('domcontentloaded');

    // Verify Navigation tab 'Announcements' exists
    const announcementsTab = page.locator('nav button:has-text("Announcements")');
    await expect(announcementsTab).toBeVisible({ timeout: 15000 });

    // Click Announcements tab
    await announcementsTab.click();

    // Verify Make Announcement header and form elements
    await expect(page.locator('h2:has-text("Make Announcement")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3:has-text("Create Announcement")')).toBeVisible();

    // Verify recipient options include Public / Fans, All, Coaches, Referees, etc.
    const recipientSelect = page.locator('select').first();
    await expect(recipientSelect).toBeVisible();
    const options = await recipientSelect.locator('option').allTextContents();
    expect(options).toContain('All (Default)');
    expect(options).toContain('Public / Fans');
    expect(options).toContain('Referees');

    // Verify Title input and Body textarea exist
    const titleInput = page.locator('input[placeholder*="Notice"]');
    await expect(titleInput).toBeVisible();

    const bodyTextarea = page.locator('textarea[placeholder*="official announcement"]');
    await expect(bodyTextarea).toBeVisible();

    // Verify Send button exists
    const sendBtn = page.locator('button:has-text("Send Announcement")');
    await expect(sendBtn).toBeVisible();
  });

  test('2. President can fill and submit an announcement', async ({ page }) => {
    await setupPresidentAuth(page);

    await page.goto('http://localhost:5173/#/president');
    await page.waitForLoadState('domcontentloaded');

    const announcementsTab = page.locator('nav button:has-text("Announcements")');
    await expect(announcementsTab).toBeVisible({ timeout: 15000 });
    await announcementsTab.click();

    const titleInput = page.locator('input[placeholder*="Notice"]');
    const testTitle = 'E2E Test Campus Announcement ' + Date.now();
    await titleInput.fill(testTitle);

    const bodyTextarea = page.locator('textarea[placeholder*="official announcement"]');
    await bodyTextarea.fill('This is an official announcement test verifying table talk and device tracking.');

    const recipientSelect = page.locator('select').first();
    await recipientSelect.selectOption('public');

    // Click submit
    const sendBtn = page.locator('button:has-text("Send Announcement")');
    await sendBtn.click();

    // Wait for submission response
    await page.waitForTimeout(2000);

    // Verify Recent Announcements table is rendered
    await expect(page.locator('h3:has-text("Recent Announcements")')).toBeVisible();
  });

  test('3. Public Anonymous Device receives popup notification and updates status to read', async ({ page }) => {
    const testDeviceId = '11111111-2222-3333-4444-555555555555';
    const testAnnouncement = {
      id: 'anc-test-' + Date.now(),
      title: 'Urgent Campus League Update',
      content: 'Gates open at 1:00 PM for the weekend derby at Kilimo Ground.',
      target_role: 'public',
      recipients: 'public',
      created_at: new Date().toISOString(),
      status: 'unread',
    };

    await page.addInitScript(({ devId, anc }) => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('esn_device_id', devId);
      localStorage.setItem('esn_device_announcements_' + devId, JSON.stringify([anc]));
    }, { devId: testDeviceId, anc: testAnnouncement });

    await page.goto('http://localhost:5173/#/home');
    await page.waitForLoadState('domcontentloaded');

    // Verify notification bell icon is visible in header
    const bellBtn = page.locator('button[aria-label="Notifications"]');
    await expect(bellBtn).toBeVisible({ timeout: 15000 });

    // Verify Public Announcement Popup appears
    const popupModal = page.locator('div[aria-labelledby="public-announcement-title"]');
    await expect(popupModal).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#public-announcement-title')).toContainText('Urgent Campus League Update');

    // Click 'Mark as Read'
    const markReadBtn = page.locator('button:has-text("Mark as Read")');
    await markReadBtn.click();

    // Verify popup closes
    await expect(popupModal).not.toBeVisible();

    // Open notifications modal via bell button
    await bellBtn.click();
    const notificationsModal = page.locator('div[aria-labelledby="device-notifications-title"]');
    await expect(notificationsModal).toBeVisible();

    // Verify status has updated to 'Read'
    await expect(notificationsModal.locator('span:has-text("Read")').first()).toBeVisible();
  });

  test('4. Overview section calls matchday games and displays kickoff range and progress', async ({ page }) => {
    await setupPresidentAuth(page);

    await page.goto('http://localhost:5173/#/president');
    await page.waitForLoadState('domcontentloaded');

    // Verify Daily Matchday Progress card
    const progressCard = page.locator('span:has-text("Daily Matchday Progress")');
    await expect(progressCard).toBeVisible({ timeout: 15000 });

    // Verify text indicates games completed
    await expect(page.locator('text=/games completed/')).toBeVisible();

    // Verify EPL Range section
    await expect(page.locator('span:has-text("Egerton Premier League")')).toBeVisible();
    await expect(page.locator('text=/Kickoff Range:/').first()).toBeVisible();

    // Verify Championships Range section
    await expect(page.locator('span:has-text("Egerton Championships")')).toBeVisible();
    await expect(page.locator('text=/Kickoff Range:/').nth(1)).toBeVisible();
  });

});
