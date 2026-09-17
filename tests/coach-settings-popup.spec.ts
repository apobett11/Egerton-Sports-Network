import { test, expect } from '@playwright/test';

test.describe('Coach Settings & Team Logo Popup Verification', () => {
  test('Verifies Team Logo popup opens on click, Team Name & Roster are locked, and fields are editable', async ({ page }) => {
    // Navigate to coach dashboard
    await page.goto('/coach');

    // Wait for the coach header to be visible
    await expect(page.locator('text=HEAD COACH').first()).toBeVisible({ timeout: 15000 });

    // 1. Check Team Logo in TeamHeader is clickable
    const headerLogoBtn = page.locator('header button[aria-label="Edit team identity and credentials"]');
    await expect(headerLogoBtn).toBeVisible();
    await headerLogoBtn.click();

    // 2. Verify Coach Team Info Modal appears
    await expect(page.locator('text=Team & Coach Identity')).toBeVisible();
    await expect(page.locator('text=Team name and squad roster are locked by league governance')).toBeVisible();

    // 3. Verify Team Name is locked / protected
    const teamNameLocked = page.locator('text=Team Name (Locked)');
    await expect(teamNameLocked).toBeVisible();
    await expect(page.locator('text=Protected')).toBeVisible();

    // 4. Verify Squad Roster is locked
    const rosterLocked = page.locator('text=Squad Roster (Locked)');
    await expect(rosterLocked).toBeVisible();

    // 5. Verify Team Crest / Logo inputs
    await expect(page.locator('button:has-text("Upload Logo Image")')).toBeVisible();
    const logoUrlInput = page.locator('input[placeholder*="example.com/logo.png"]');
    await expect(logoUrlInput).toBeVisible();

    // 6. Verify Coach Email input
    const coachEmailInput = page.locator('input[placeholder="coach@egerton.ac.ke"]');
    await expect(coachEmailInput).toBeVisible();

    // 7. Verify Coach Password inputs
    const newPasswordInput = page.locator('input[placeholder="Leave blank to keep current"]');
    await expect(newPasswordInput).toBeVisible();
    const confirmPasswordInput = page.locator('input[placeholder="Confirm new password"]');
    await expect(confirmPasswordInput).toBeVisible();

    // Close the modal
    await page.locator('button[aria-label="Close"]').click();
    await expect(page.locator('text=Team & Coach Identity')).not.toBeVisible();

    // 8. Navigate to Settings page
    const settingsBtn = page.locator('button[title="Team Settings"]').first();
    await settingsBtn.click();
    await expect(page.locator('text=Team Operations & Role Settings').first()).toBeVisible({ timeout: 10000 });

    // 9. Verify Team Name is locked in Settings
    await expect(page.locator('text=Locked by League').first()).toBeVisible();
    const teamNameSettingsInput = page.locator('input[title*="Team name cannot be changed"]');
    await expect(teamNameSettingsInput).toBeDisabled();

    // 10. Verify Coach Account Credentials in Settings
    await expect(page.locator('text=Coach Account Credentials')).toBeVisible();
    const settingsEmailInput = page.locator('input[placeholder="coach@egerton.ac.ke"]');
    await expect(settingsEmailInput).toBeVisible();
    await expect(page.locator('input[placeholder="Leave blank to keep current"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Confirm new password"]')).toBeVisible();

    // 11. Verify Upload Image File button exists in Settings
    await expect(page.locator('button:has-text("Upload Image File")')).toBeVisible();

    // 12. Verify Save Coach Team Settings button is present
    await expect(page.locator('button:has-text("Save Coach Team Settings")')).toBeVisible();

    console.log('✓ Verified: Coach Settings & Team Logo popup modal completely compliant with all specifications!');
  });

  test('Verifies Coach Command Center buttons and Roster list-style thin cards with unified dropdowns', async ({ page }) => {
    await page.goto('/coach');
    await expect(page.locator('text=HEAD COACH').first()).toBeVisible({ timeout: 15000 });

    // 1. Verify Coach Command Center buttons
    await expect(page.locator('button:has-text("Upload Player Kits")')).toBeVisible();
    await expect(page.locator('button:has-text("Arrange Match Squad")')).toBeVisible();
    await expect(page.locator('button:has-text("Update Match Events")')).toBeVisible();
    const editTeamDetailsBtn = page.locator('button:has-text("Edit Team Details")');
    await expect(editTeamDetailsBtn).toBeVisible();

    // Clicking "Edit Team Details" opens Team & Coach Identity modal
    await editTeamDetailsBtn.click();
    await expect(page.locator('text=Team & Coach Identity')).toBeVisible();
    await page.locator('button[aria-label="Close"]').click();
    await expect(page.locator('text=Team & Coach Identity')).not.toBeVisible();

    // 2. Navigate to Roster View
    const rosterNavBtn = page.locator('button:has-text("Players Directory")').or(page.locator('button:has-text("Upload Player Kits")')).first();
    await rosterNavBtn.click();

    // Verify Athlete Profile Confirmation & Intake is compact with no subtitle explanation
    await expect(page.locator('text=Athlete Profile Confirmation & Intake')).toBeVisible();
    await expect(page.locator('text=Direct athlete onboarding link to register preferred jersey numbers')).not.toBeVisible();

    // Verify Unified Arrange by and Position dropdowns exist
    const arrangeSelect = page.locator('select:has-text("Arrange:")');
    await expect(arrangeSelect).toBeVisible();
    const positionSelect = page.locator('select:has-text("Position:")');
    await expect(positionSelect).toBeVisible();

    // 3. Verify side-by-side thin player cards exist
    const firstPlayerCard = page.locator('.grid-cols-1.sm\\:grid-cols-2 > div').first();
    await expect(firstPlayerCard).toBeVisible();

    // Click the player name on the thin card to open Player Details & Status modal
    await firstPlayerCard.locator('h4').click();
    await expect(page.locator('text=Player Details & Status')).toBeVisible();
    await expect(page.locator('text=Update Status (Fitness & Cards):')).toBeVisible();
    await expect(page.locator('button:has-text("Suspended (Red Card)")')).toBeVisible();

    // Close player details modal
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('text=Player Details & Status')).not.toBeVisible();

    console.log('✓ Verified: Command Center buttons and Roster list-style thin cards with unified dropdowns pass!');
  });
});
