const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Read Supabase credentials
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) env[match[1]] = (match[2] || '').trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const PITCHES = {
  'Pitch A': { id: '91111111-1111-1111-1111-111111111111', name: 'Pitch A — Main Stadium Pitch' },
  'Pitch B': { id: '92222222-2222-2222-2222-222222222222', name: 'Pitch B — Pavilion Grounds' },
  'Pitch C': { id: '93333333-3333-3333-3333-333333333333', name: 'Pitch C — Tatton Complex Ground' }
};

const COMPS = {
  EPL: '11111111-1111-1111-1111-111111111111',
  CHAMPIONSHIP: '22222222-2222-2222-2222-222222222222',
  FRIENDLIES: '33333333-3333-3333-3333-333333333333'
};

const TEAMS = {
  celtic: '10000000-0000-4000-8000-00000000000b',          // Celtics FC (EPL)
  'blue blazers': '10000000-0000-4000-8000-000000000005', // Blue Blazers (EPL)
  rising: '10000000-0000-4000-8000-00000000000c',          // Rising stars (EPL)
  'five-star': '10000000-0000-4000-8000-000000000002',     // Five Stars fc (EPL)
  law: '20000000-0000-4000-8000-00000000000a',             // law fc (CHAMP)
  wazito: '10000000-0000-4000-8000-00000000000a',          // Wazito Fc (EPL)
  aged: '20000000-0000-4000-8000-000000000001',            // Aged FC (CHAMP)
  ajax: '20000000-0000-4000-8000-000000000002',            // Ajax fc (CHAMP)
  'super eagles': '10000000-0000-4000-8000-000000000001',  // Super eagles (EPL)
  'mighty blacks': '10000000-0000-4000-8000-000000000006', // Mighty Blacks (EPL)
  'legends fc': '10000000-0000-4000-8000-000000000007',    // Legends Fc (EPL)
  'young legends fc': '20000000-0000-4000-8000-000000000007', // Young legends (CHAMP)
  santos: '10000000-0000-4000-8000-000000000003',          // Santos fc (EPL)
  talanta: '20000000-0000-4000-8000-000000000006',         // Talanta fc (CHAMP)
  'young stars': '20000000-0000-4000-8000-000000000008',   // young stars (CHAMP)
  'fass elites': '20000000-0000-4000-8000-000000000003',   // Fass Elites (CHAMP)
  giants: '10000000-0000-4000-8000-000000000008',          // Giants FC (EPL)
  emsa: '20000000-0000-4000-8000-000000000004',            // Emsa FC (CHAMP)
  med: '10000000-0000-4000-8000-000000000009',             // Med fc (EPL)
  rangers: '20000000-0000-4000-8000-000000000009',         // Rangers fc (CHAMP)
  bcom: '10000000-0000-4000-8000-000000000004',            // BCOM FC (EPL)
  tatton: '20000000-0000-4000-8000-000000000005'           // Tatton fc (CHAMP)
};

// Date: Pushed from today (2026-11-28) to tomorrow (2026-11-29)
const PLAY_DATE = '2026-11-29';
const MATCHDAY = 23;

const GAMES = [
  {
    home: 'celtic',
    away: 'blue blazers',
    label: 'Celtic vs Blue Blazers',
    pitch: 'Pitch A',
    start: '09:50',
    end: '11:00',
    period: 'AM',
    slot: 2,
    scheduledUtc: `${PLAY_DATE}T06:50:00+00:00`,
    comp: COMPS.EPL,
    league: 'EPL'
  },
  {
    home: 'rising',
    away: 'five-star',
    label: 'Rising vs Five-Star',
    pitch: 'Pitch A',
    start: '11:10',
    end: '12:20',
    period: 'AM',
    slot: 3,
    scheduledUtc: `${PLAY_DATE}T08:10:00+00:00`,
    comp: COMPS.EPL,
    league: 'EPL'
  },
  {
    home: 'law',
    away: 'wazito',
    label: 'Law vs Wazito',
    pitch: 'Pitch A',
    start: '12:30',
    end: '13:40',
    period: 'PM',
    slot: 4,
    scheduledUtc: `${PLAY_DATE}T09:30:00+00:00`,
    comp: COMPS.FRIENDLIES,
    league: 'CHAMPIONSHIP'
  },
  {
    home: 'aged',
    away: 'ajax',
    label: 'Aged vs Ajax',
    pitch: 'Pitch B',
    start: '08:30',
    end: '09:40',
    period: 'AM',
    slot: 1,
    scheduledUtc: `${PLAY_DATE}T05:30:00+00:00`,
    comp: COMPS.CHAMPIONSHIP,
    league: 'CHAMPIONSHIP'
  },
  {
    home: 'super eagles',
    away: 'mighty blacks',
    label: 'Super Eagles vs Mighty Blacks',
    pitch: 'Pitch B',
    start: '09:50',
    end: '11:00',
    period: 'AM',
    slot: 2,
    scheduledUtc: `${PLAY_DATE}T06:50:00+00:00`,
    comp: COMPS.EPL,
    league: 'EPL'
  },
  {
    home: 'legends fc',
    away: 'young legends fc',
    label: 'Legends FC vs Young Legends FC',
    pitch: 'Pitch B',
    start: '11:10',
    end: '12:20',
    period: 'AM',
    slot: 3,
    scheduledUtc: `${PLAY_DATE}T08:10:00+00:00`,
    comp: COMPS.FRIENDLIES,
    league: 'EPL'
  },
  {
    home: 'santos',
    away: 'talanta',
    label: 'Santos vs Talanta',
    pitch: 'Pitch B',
    start: '12:30',
    end: '13:40',
    period: 'PM',
    slot: 4,
    scheduledUtc: `${PLAY_DATE}T09:30:00+00:00`,
    comp: COMPS.FRIENDLIES,
    league: 'EPL'
  },
  {
    home: 'young stars',
    away: 'fass elites',
    label: 'Young Stars vs Fass Elites',
    pitch: 'Pitch C',
    start: '08:30',
    end: '09:40',
    period: 'AM',
    slot: 1,
    scheduledUtc: `${PLAY_DATE}T05:30:00+00:00`,
    comp: COMPS.CHAMPIONSHIP,
    league: 'CHAMPIONSHIP'
  },
  {
    home: 'giants',
    away: 'emsa',
    label: 'Giants vs Emsa',
    pitch: 'Pitch C',
    start: '09:50',
    end: '11:00',
    period: 'AM',
    slot: 2,
    scheduledUtc: `${PLAY_DATE}T06:50:00+00:00`,
    comp: COMPS.FRIENDLIES,
    league: 'EPL'
  },
  {
    home: 'med',
    away: 'rangers',
    label: 'Med vs Rangers',
    pitch: 'Pitch C',
    start: '11:10',
    end: '12:20',
    period: 'AM',
    slot: 3,
    scheduledUtc: `${PLAY_DATE}T08:10:00+00:00`,
    comp: COMPS.FRIENDLIES,
    league: 'EPL'
  },
  {
    home: 'bcom',
    away: 'tatton',
    label: 'Bcom vs Tatton',
    pitch: 'Pitch C',
    start: '12:30',
    end: '13:40',
    period: 'PM',
    slot: 4,
    scheduledUtc: `${PLAY_DATE}T09:30:00+00:00`,
    comp: COMPS.FRIENDLIES,
    league: 'EPL'
  }
];

async function run() {
  console.log(`\n========================================`);
  console.log(`Inserting 11 games for Matchday ${MATCHDAY} on ${PLAY_DATE}`);
  console.log(`========================================\n`);

  // Get max match_sequence from base_fixtures
  const { data: maxSeqData } = await supabase
    .from('base_fixtures')
    .select('match_sequence')
    .order('match_sequence', { ascending: false })
    .limit(1);
  let nextSeq = (maxSeqData && maxSeqData[0] ? maxSeqData[0].match_sequence : 132) + 1;

  for (let i = 0; i < GAMES.length; i++) {
    const g = GAMES[i];
    const pitch = PITCHES[g.pitch];
    const homeTeamId = TEAMS[g.home];
    const awayTeamId = TEAMS[g.away];

    console.log(`[${i + 1}/${GAMES.length}] Processing: ${g.label} (${g.pitch}, ${g.start}-${g.end})...`);

    // 1. Insert into public.fixtures
    const fixturePayload = {
      competition_id: g.comp,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      scheduled_time: g.scheduledUtc,
      status: 'UPCOMING',
      score_home: 0,
      score_away: 0,
      venue: pitch.name,
      matchday: MATCHDAY,
      assignment_status: 'pending',
      added_time: 0,
      home_penalty_score: 0,
      away_penalty_score: 0,
      referee_verification_status: 'UNVERIFIED',
      stats_processed: false
    };

    const { data: fixRes, error: fixErr } = await supabase
      .from('fixtures')
      .insert(fixturePayload)
      .select('id');

    if (fixErr) {
      console.error(`  ❌ Error inserting into fixtures:`, fixErr.message);
      continue;
    }
    const fixtureId = fixRes[0].id;
    console.log(`  ✓ Created fixtures record: ${fixtureId}`);

    // 2. Insert into public.base_fixtures
    const basePayload = {
      competition_id: g.comp,
      league: g.league,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      leg: 1,
      match_sequence: nextSeq++
    };

    const { data: baseRes, error: baseErr } = await supabase
      .from('base_fixtures')
      .insert(basePayload)
      .select('id');

    if (baseErr) {
      console.error(`  ❌ Error inserting into base_fixtures:`, baseErr.message);
      continue;
    }
    const baseFixtureId = baseRes[0].id;
    console.log(`  ✓ Created base_fixtures record: ${baseFixtureId}`);

    // 3. Insert into public.matchday_schedules
    const schedPayload = {
      fixture_id: baseFixtureId,
      competition_id: g.comp,
      league: g.league,
      matchday_number: MATCHDAY,
      play_date: PLAY_DATE,
      is_weekend: true,
      pitch_id: pitch.id,
      slot_number: g.slot,
      period: g.period,
      start_time: g.start,
      end_time: g.end,
      status: 'SCHEDULED'
    };

    const { data: schedRes, error: schedErr } = await supabase
      .from('matchday_schedules')
      .insert(schedPayload)
      .select('id');

    if (schedErr) {
      console.error(`  ❌ Error inserting into matchday_schedules:`, schedErr.message);
      continue;
    }
    console.log(`  ✓ Created matchday_schedules record: ${schedRes[0].id}`);
  }

  // Verification step
  console.log(`\n========================================`);
  console.log(`VERIFICATION of Database State`);
  console.log(`========================================\n`);

  const { data: insertedFix } = await supabase
    .from('fixtures')
    .select(`
      id,
      scheduled_time,
      venue,
      status,
      matchday,
      home:teams!fixtures_home_team_id_fkey(name),
      away:teams!fixtures_away_team_id_fkey(name)
    `)
    .gte('scheduled_time', `${PLAY_DATE}T00:00:00Z`)
    .lte('scheduled_time', `${PLAY_DATE}T23:59:59Z`)
    .order('scheduled_time', { ascending: true });

  console.log(`Total fixtures on ${PLAY_DATE}: ${insertedFix ? insertedFix.length : 0}`);
  if (insertedFix) {
    console.table(insertedFix.map(f => ({
      ID: f.id.slice(0, 8),
      Match: `${f.home?.name} vs ${f.away?.name}`,
      Time_UTC: f.scheduled_time.split('T')[1].slice(0, 5),
      Venue: f.venue.split('—')[0].trim(),
      Matchday: f.matchday,
      Status: f.status
    })));
  }

  const { data: insertedSched } = await supabase
    .from('matchday_schedules')
    .select('id, play_date, start_time, end_time, slot_number, period, pitch_id')
    .eq('play_date', PLAY_DATE)
    .order('start_time', { ascending: true });

  console.log(`\nTotal schedules on ${PLAY_DATE}: ${insertedSched ? insertedSched.length : 0}`);
  console.log('\nAll 11 matches successfully placed into database!');
}

run().catch(console.error);
