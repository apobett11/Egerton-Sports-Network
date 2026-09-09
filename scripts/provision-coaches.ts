import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hizfgvgbsguhduxortrx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpemZndmdic2d1aGR1eG9ydHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4NTk3MSwiZXhwIjoyMTAwOTYxOTcxfQ.5s2Khn3wBpjbwoVyW8VdKm7cWtckvhrnyjKWNMYgfG4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface CoachInput {
  full_name: string;
  nickname: string | null;
  phone_number: string;
  email: string;
  team: string;
  original_team_input: string;
}

interface Payload {
  EPL: CoachInput[];
  Championships: CoachInput[];
}

const payload: Payload = {
  "EPL": [
    {
      "full_name": "Richard Somoire",
      "nickname": "Rickky",
      "phone_number": "666 161",
      "email": "richkyson062@gmail.com",
      "team": "Santos fc",
      "original_team_input": "Santos"
    },
    {
      "full_name": "Johana kinuthia",
      "nickname": "Tactician",
      "phone_number": "0704676019",
      "email": "johanakinuthianew@gmail.com",
      "team": "Mighty Blacks",
      "original_team_input": "Mighty Blacks"
    },
    {
      "full_name": "Erdman ochieng",
      "nickname": "Sir Erdman",
      "phone_number": "0769333896",
      "email": "ochiengerdman@gmail.com",
      "team": "BCOM FC",
      "original_team_input": "Bcom Fc"
    },
    {
      "full_name": "Larneck Agwata",
      "nickname": "Lamoh",
      "phone_number": "0769251211",
      "email": "Lameckagwata0@gmail.com",
      "team": "Celtics FC",
      "original_team_input": "Celtic"
    },
    {
      "full_name": "The Special One",
      "nickname": "The Special One",
      "phone_number": "0795685641",
      "email": "ogolamiket@gmail.com",
      "team": "Super eagles",
      "original_team_input": "Super Eagles FC"
    },
    {
      "full_name": "Agrippa",
      "nickname": "Agrippa",
      "phone_number": "0793547480",
      "email": "ngetichagrippa357@gmail.com",
      "team": "Wazito Fc",
      "original_team_input": "Wazito FC (Burudani boys)"
    },
    {
      "full_name": "Churchill Kongo",
      "nickname": "Chacho",
      "phone_number": "0793552640",
      "email": "churchillkimori2@gmail.com",
      "team": "Med fc",
      "original_team_input": "MED FC"
    }
  ],
  "Championships": [
    {
      "full_name": "Ian kipruto",
      "nickname": "lanno75",
      "phone_number": "0713820297",
      "email": "Iankipruto166@gmail.com",
      "team": "Aged FC",
      "original_team_input": "AGED FC"
    },
    {
      "full_name": "Wallace Nyakombo",
      "nickname": "Wales",
      "phone_number": "0116644982",
      "email": "otienowallace222@gmail.com",
      "team": "Young legends",
      "original_team_input": "Young legends"
    },
    {
      "full_name": "Otieno Julius",
      "nickname": null,
      "phone_number": "0795380671",
      "email": "otienojulius421@gmail.com",
      "team": "Ajax fc",
      "original_team_input": "Ajax"
    }
  ]
};

function generateSecureTempPassword(): string {
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `EgerCoach2026!#${random4}`;
}

interface ManifestEntry {
  coach_name: string;
  email: string;
  phone: string;
  assigned_team: string;
  league: string;
  team_uuid: string;
  user_auth_uuid: string;
  generated_temp_password: string;
}

interface RejectionEntry {
  coach_name: string;
  email: string;
  requested_team: string;
  league: string;
  reason: string;
}

async function main() {
  console.log('===============================================================');
  console.log('STARTING COACH PROVISIONING & LEAGUE BINDING ENGINE');
  console.log('===============================================================\n');

  // 1. Pre-Flight Verification: Fetch all teams and competitions
  const { data: competitions, error: compError } = await supabase
    .from('competitions')
    .select('id, name, slug');

  if (compError) {
    throw new Error(`Failed to fetch competitions: ${compError.message}`);
  }

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, short_name, competition_id, coach_id, status');

  if (teamsError) {
    throw new Error(`Failed to fetch teams: ${teamsError.message}`);
  }

  console.log(`[PRE-FLIGHT] Loaded ${competitions?.length || 0} competitions and ${teams?.length || 0} existing teams.`);

  // Build lookup maps
  const competitionMap = new Map<string, string>();
  for (const c of competitions || []) {
    competitionMap.set(c.id, c.name);
  }

  // Map lowercase trimmed team name to team row
  const teamLookup = new Map<string, typeof teams[0]>();
  for (const t of teams || []) {
    teamLookup.set(t.name.trim().toLowerCase(), t);
  }

  const manifest: ManifestEntry[] = [];
  const rejections: RejectionEntry[] = [];

  // 2. Iterate through each league category and coach
  for (const [leagueKey, coaches] of Object.entries(payload)) {
    console.log(`\n--- Processing League: ${leagueKey} (${coaches.length} coaches) ---`);

    for (const coach of coaches) {
      const normalizedTeamName = coach.team.trim().toLowerCase();
      const matchedTeam = teamLookup.get(normalizedTeamName);

      // PRE-FLIGHT TEAM VERIFICATION (CRITICAL CONSTRAINT: DO NOT CREATE TEAMS)
      if (!matchedTeam) {
        console.error(`[REJECTED: Team not found] Coach "${coach.full_name}" requested team "${coach.team}" (original: "${coach.original_team_input}") not found in public.teams`);
        rejections.push({
          coach_name: coach.full_name,
          email: coach.email,
          requested_team: coach.team,
          league: leagueKey,
          reason: 'REJECTED: Team not found in public.teams'
        });
        continue;
      }

      // League validation check
      const teamLeagueName = competitionMap.get(matchedTeam.competition_id) || 'Unknown League';
      console.log(`[VERIFIED] Team "${matchedTeam.name}" (ID: ${matchedTeam.id}) mapped to League "${teamLeagueName}"`);

      // Name splitting
      const nameParts = coach.full_name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const cleanEmail = coach.email.trim().toLowerCase();
      const tempPassword = generateSecureTempPassword();

      let authUserId: string;

      // AUTHENTICATION INJECTION (auth.users)
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          role: 'COACH',
          full_name: coach.full_name,
          nickname: coach.nickname,
          phone_number: coach.phone_number
        }
      });

      if (createError) {
        if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
          console.log(`[INFO] User ${cleanEmail} already exists in auth.users. Updating credentials...`);
          // List to find existing user UUID
          const { data: listUsersData, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`);
          }
          const existingUser = listUsersData.users.find(u => u.email?.toLowerCase() === cleanEmail);
          if (!existingUser) {
            throw new Error(`Could not find existing user ${cleanEmail}`);
          }
          authUserId = existingUser.id;

          const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              role: 'COACH',
              full_name: coach.full_name,
              nickname: coach.nickname,
              phone_number: coach.phone_number
            }
          });
          if (updateError) {
            throw new Error(`Failed to update user ${cleanEmail}: ${updateError.message}`);
          }
        } else {
          console.error(`[AUTH ERROR] Failed to create auth user for ${cleanEmail}: ${createError.message}`);
          rejections.push({
            coach_name: coach.full_name,
            email: coach.email,
            requested_team: coach.team,
            league: leagueKey,
            reason: `AUTH ERROR: ${createError.message}`
          });
          continue;
        }
      } else {
        authUserId = createData.user.id;
      }

      // APPLICATION LAYER BINDING (public.profiles)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUserId,
          role: 'COACH',
          first_name: firstName,
          last_name: lastName,
          email: cleanEmail,
          phone: coach.phone_number,
          team_id: matchedTeam.id,
          bio: `Head Coach of ${matchedTeam.name}`,
          is_verified: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.error(`[PROFILE ERROR] Failed to upsert profile for ${cleanEmail}: ${profileError.message}`);
        rejections.push({
          coach_name: coach.full_name,
          email: coach.email,
          requested_team: coach.team,
          league: leagueKey,
          reason: `PROFILE ERROR: ${profileError.message}`
        });
        continue;
      }

      // TEAMS TABLE BINDING (public.teams.coach_id = authUserId)
      const { error: teamUpdateError } = await supabase
        .from('teams')
        .update({
          coach_id: authUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchedTeam.id);

      if (teamUpdateError) {
        console.error(`[TEAM UPDATE ERROR] Failed to update coach_id for team ${matchedTeam.name}: ${teamUpdateError.message}`);
      }

      manifest.push({
        coach_name: coach.full_name,
        email: cleanEmail,
        phone: coach.phone_number,
        assigned_team: matchedTeam.name,
        league: teamLeagueName,
        team_uuid: matchedTeam.id,
        user_auth_uuid: authUserId,
        generated_temp_password: tempPassword
      });

      console.log(`[SUCCESS] Provisioned ${coach.full_name} (${cleanEmail}) -> Team: ${matchedTeam.name} (${matchedTeam.id})`);
    }
  }

  // 3. Print Execution Manifest Table & Ledger
  console.log('\n===============================================================');
  console.log('PROVISIONING MANIFEST TABLE');
  console.log('===============================================================');
  console.table(manifest.map(m => ({
    "Coach Name": m.coach_name,
    "Assigned Team": m.assigned_team,
    "League": m.league,
    "Team UUID": m.team_uuid,
    "User Auth UUID": m.user_auth_uuid,
    "Email": m.email,
    "Generated Temp Password": m.generated_temp_password
  })));

  console.log('\n===============================================================');
  console.log('REJECTION LOG');
  console.log('===============================================================');
  if (rejections.length === 0) {
    console.log('NO REJECTIONS: All 10 coaches successfully mapped and provisioned against existing database teams.');
  } else {
    console.table(rejections);
  }

  // 4. Output Keyset Pagination query demonstration
  console.log('\n===============================================================');
  console.log('PAGINATION-READY ARCHITECTURE (KEYSET / CURSOR PAGINATION)');
  console.log('===============================================================');
  console.log('Optimized Query:');
  console.log(`SELECT id, first_name, last_name, jersey_number, position, created_at
FROM public.players
WHERE team_id = $1
  AND (created_at, id) < ($last_created_at, $last_id)
ORDER BY team_id, created_at DESC, id
LIMIT 10;`);
  console.log('Index Utilized: idx_players_team_pagination (team_id, created_at DESC, id)\n');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
