// Script 2: Team-Specific Player Ingestion Script
// Each team gets an identical copy of a Player Registration Sheet with TEAM_ID configured in Project Settings -> Script Properties.

const SUPABASE_PROJECT_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY";

// Set TEAM_ID in Apps Script Settings: Script Properties
const SCRIPT_PROP = PropertiesService.getScriptProperties();
const TEAM_ID = SCRIPT_PROP.getProperty("TEAM_ID");

function onPlayerRegistrationSubmit(e) {
  if (!TEAM_ID) {
    Logger.log("FATAL: TEAM_ID not bound in Script Properties.");
    return;
  }

  const [timestamp, fullName, jerseyNumber, position, studentId, phone] = e.values;

  const payload = {
    p_team_id: TEAM_ID,
    p_full_name: (fullName || '').trim(),
    p_jersey_number: parseInt(jerseyNumber, 10),
    p_position: (position || 'FWD').trim(),
    p_student_id: studentId ? studentId.trim() : null,
    p_phone: phone ? phone.trim() : null
  };

  const response = UrlFetchApp.fetch(`${SUPABASE_PROJECT_URL}/rest/v1/rpc/import_player_from_team_sheet`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  Logger.log(`Player import status for ${fullName}: ${response.getContentText()}`);
}
