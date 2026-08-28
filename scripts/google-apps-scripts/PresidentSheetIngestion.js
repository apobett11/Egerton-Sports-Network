// Script 1: President's Dashboard Ingestion (Coaches & Referees)
// Attach this Google Apps Script to the President's Master Registration Sheet.
// Trigger: On form submit / spreadsheet onFormSubmit(e) or onEdit(e)

const SUPABASE_PROJECT_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY";
const APP_REDIRECT_URL = "https://your-domain.com/#/auth/reset-password";

function onPresidentSheetSubmit(e) {
  const [timestamp, fullName, email, phone, roleInput, leagueSelection, teamName, badgeNumber] = e.values;

  const role = roleInput ? roleInput.trim().toLowerCase() : 'coach'; // 'coach' or 'referee'
  const cleanEmail = email.trim().toLowerCase();
  const nameParts = (fullName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // 1. Sync Profile & Role with Database
  const payload = {
    p_email: cleanEmail,
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone ? phone.trim() : null,
    p_role: role,
    p_league_name: leagueSelection ? leagueSelection.trim() : null,
    p_team_name: teamName ? teamName.trim() : null,
    p_badge_number: badgeNumber ? badgeNumber.trim() : null
  };

  const dbRes = UrlFetchApp.fetch(`${SUPABASE_PROJECT_URL}/rest/v1/rpc/register_official_and_invite`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (dbRes.getResponseCode() !== 200) {
    Logger.log(`Database Error for ${cleanEmail}: ${dbRes.getContentText()}`);
    return;
  }

  // 2. Generate Single-Use Setup/Magic Link (Invalidates on 1 use)
  const linkPayload = {
    type: "magiclink",
    email: cleanEmail,
    options: {
      redirectTo: APP_REDIRECT_URL
    }
  };

  const inviteRes = UrlFetchApp.fetch(`${SUPABASE_PROJECT_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(linkPayload),
    muteHttpExceptions: true
  });

  const inviteData = JSON.parse(inviteRes.getContentText());
  const singleUseLink = inviteData.action_link || (inviteData.properties && inviteData.properties.action_link);

  // 3. Send Official Onboarding Email
  if (singleUseLink) {
    MailApp.sendEmail({
      to: cleanEmail,
      subject: `Official Portal Invitation: ${role.toUpperCase()} Access`,
      htmlBody: `
        <h3>Welcome ${fullName},</h3>
        <p>You have been registered as an official <strong>${role.toUpperCase()}</strong> on the Egerton Sports Network.</p>
        <p>Click the secure link below to activate your account and configure your permanent password:</p>
        <p style="margin: 20px 0;">
          <a href="${singleUseLink}" style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Activate Account & Set Password
          </a>
        </p>
        <p><em>Note: This setup link can only be used once.</em></p>
      `
    });
  }
}
