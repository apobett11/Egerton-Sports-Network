const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL.');

  // 1. Purge all test posts and any empty posts
  console.log('Purging all test and unnecessary posts...');
  const purgeRes = await client.query(`
    DELETE FROM public.banter_posts WHERE 
      content LIKE '%Root Derby Match Take%' OR
      content LIKE '%Thread Alpha Discussion%' OR
      content LIKE '%Thread Beta Discussion%' OR
      content LIKE '%Derby Tactics: High Pressing%' OR
      content LIKE '%Root post with root_id=self%' OR
      content LIKE '%Test post%' OR
      content LIKE '%Level 1 Reply%' OR
      content LIKE '%Level 2 Sub-Reply%' OR
      content LIKE '%Alpha Exclusive Message%' OR
      content LIKE '%Author follow-up clarification%' OR
      content LIKE '%Replier comment%' OR
      content LIKE '%Paging @%' OR
      trim(content) = '';
  `);
  console.log(`Purged ${purgeRes.rowCount} test posts.`);

  // 2. Ensure official polls and posts are inserted / updated
  const rootPosts = [
    {
      id: 'b1000000-0000-4000-8000-000000000001',
      root_id: 'b1000000-0000-4000-8000-000000000001',
      parent_id: null,
      author_handle: 'EgerSports Desk',
      author_name: 'Egerton Sports Desk',
      author_type: 'journalist',
      author_badge: 'SECRETARIAT',
      content: 'OFFICIAL: Egerton Sports Directorate confirms Matchday 13 remains paused while Pavilion Pitch B leveling and Main Stadium drainage works continue. No fixtures will be played until grounds committee certifies readiness. #EgertonSportsNetwork #EPLPause',
      media_type: 'IMAGE',
      media_urls: ['/images/banter/league_pause_official_notice.png'],
      reaction_fire_count: 84,
      reaction_clown_count: 5,
      reaction_skull_count: 12,
      repost_count: 24,
      raw_views: 450,
      impressions: 1480,
      is_trending: false,
      created_at: '2026-10-26T10:00:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000002',
      root_id: 'b1000000-0000-4000-8000-000000000002',
      parent_id: null,
      author_handle: 'Campus Oracle #19',
      author_name: 'Campus Oracle',
      author_type: 'user',
      author_badge: 'ANALYST',
      content: '41 goals scored by Super Eagles vs 39 goals conceded by Mighty Blacks... The goal difference gap (+32 vs -30) is 62 goals across 12 games! Has there EVER been a more lopsided league in Egerton history? 💀🔥 #EPL #EgertonStandings #CampusBanter',
      media_type: 'IMAGE',
      media_urls: ['/images/banter/super_eagles_runaway_leader.png'],
      poll_id: 'poll-pause-01',
      reaction_fire_count: 112,
      reaction_clown_count: 18,
      reaction_skull_count: 45,
      repost_count: 38,
      raw_views: 680,
      impressions: 1880,
      is_trending: true,
      created_at: '2026-10-27T14:30:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000003',
      root_id: 'b1000000-0000-4000-8000-000000000003',
      parent_id: null,
      author_handle: 'Ref Watch Egerton',
      author_name: 'Ref Watch Egerton',
      author_type: 'journalist',
      author_badge: 'OFFICIALS',
      content: 'Mid-season referee audit 📝: Referee Jark leads university with 14 penalties. Ref Lamoh flashed 38 cards without losing control once. Ref Chalo still disallowing any goal within 5 yards of the keeper. Who has been your best ref? #RefWatch #OfficiatingAudit',
      media_type: 'IMAGE',
      media_urls: ['/images/banter/referee_jark_controversy.png'],
      poll_id: 'poll-ref-02',
      reaction_fire_count: 67,
      reaction_clown_count: 8,
      reaction_skull_count: 14,
      repost_count: 19,
      raw_views: 390,
      impressions: 1350,
      is_trending: false,
      created_at: '2026-10-28T16:15:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000004',
      root_id: 'b1000000-0000-4000-8000-000000000004',
      parent_id: null,
      author_handle: 'Legends FC Coach',
      author_name: 'Coach Eric (Legends)',
      author_type: 'coach',
      author_badge: 'Legends FC Coach',
      tagged_team_name: 'Legends Fc',
      content: 'Coach Eric (Legends FC): We are using this pause effectively. Double tactical sessions at Pavilion gymnasium. 26 points puts us right within striking distance. We will not concede easy goals when MD13 resumes. #LegendsFC #CoachNotes #TitleRace',
      media_type: 'NONE',
      reaction_fire_count: 42,
      reaction_clown_count: 2,
      reaction_skull_count: 1,
      repost_count: 11,
      raw_views: 290,
      impressions: 980,
      is_trending: false,
      created_at: '2026-10-29T11:00:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000005',
      root_id: 'b1000000-0000-4000-8000-000000000005',
      parent_id: null,
      author_handle: 'Njoro Troll Football',
      author_name: 'Njoro Troll Football',
      author_type: 'user',
      content: 'Mighty Blacks defense: 39 goals shipped in 12 games. Even HELB gives students more security than this backline. Coach needs to park two varsity buses in front of goal when MD13 kicks off! 🚌🛑 #EPLBanter #MightyBlacks #SieveDefense',
      media_type: 'IMAGE',
      media_urls: ['/images/banter/mighty_blacks_defense_collapse.png'],
      reaction_fire_count: 98,
      reaction_clown_count: 29,
      reaction_skull_count: 53,
      repost_count: 41,
      raw_views: 480,
      impressions: 1490,
      is_trending: false,
      created_at: '2026-10-30T18:45:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000006',
      root_id: 'b1000000-0000-4000-8000-000000000006',
      parent_id: null,
      author_handle: 'EgerSports Desk',
      author_name: 'Egerton Sports Desk',
      author_type: 'journalist',
      author_badge: 'JOURNALIST',
      tagged_team_name: 'Super eagles',
      content: 'M. Ochieng has 14 goals in 12 games for Super Eagles before the league paused. On pace to shatter the all-time Egerton single-season scoring record (19 goals). Is he currently the best university baller in Nakuru County? 👟⚽🔥 #GoldenBoot #EPLTopScorer',
      media_type: 'IMAGE',
      media_urls: ['/images/banter/top_scorer.png'],
      reaction_fire_count: 88,
      reaction_clown_count: 4,
      reaction_skull_count: 9,
      repost_count: 28,
      raw_views: 420,
      impressions: 1420,
      is_trending: false,
      created_at: '2026-10-30T21:10:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000007',
      root_id: 'b1000000-0000-4000-8000-000000000007',
      parent_id: null,
      author_handle: 'Campus Oracle #19',
      author_name: 'Campus Oracle',
      author_type: 'user',
      author_badge: 'ANALYST',
      content: 'Championship race: Talanta FC (25 pts) and Ajax FC (22 pts) are playing champagne football! Meanwhile Law FC are 10th with 4 points and currently drafting an injunction against the referee offside flag ⚖️📂😂 #ChampionshipBanter #LawFC #TalantaFC',
      media_type: 'IMAGE',
      media_urls: ['/images/banter/law_fc_table.png'],
      poll_id: 'poll-champ-03',
      reaction_fire_count: 73,
      reaction_clown_count: 19,
      reaction_skull_count: 32,
      repost_count: 22,
      raw_views: 380,
      impressions: 1290,
      is_trending: false,
      created_at: '2026-10-31T15:20:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000008',
      root_id: 'b1000000-0000-4000-8000-000000000008',
      parent_id: null,
      author_handle: 'Tatton Ultras #42',
      author_name: 'Tatton Ultras',
      author_type: 'user',
      author_badge: 'FAN REP',
      content: 'QUESTION FOR THE FANS 🎤: What has been your match of the season so far before this pause? Best goal, wildest derby, or biggest heartbreak? Drop your take below 👇 #EgertonFootball #CampusDebate #MatchOfTheSeason',
      media_type: 'NONE',
      poll_id: 'poll-qa-04',
      reaction_fire_count: 55,
      reaction_clown_count: 3,
      reaction_skull_count: 4,
      repost_count: 14,
      raw_views: 310,
      impressions: 1150,
      is_trending: false,
      created_at: '2026-11-01T08:30:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000009',
      root_id: 'b1000000-0000-4000-8000-000000000009',
      parent_id: null,
      author_handle: 'Super Eagles Coach',
      author_name: 'Coach Super Eagles',
      author_type: 'coach',
      author_badge: 'Super Eagles Coach',
      tagged_team_name: 'Super eagles',
      content: 'Coach Super Eagles: To our fans: thank you for the energy in the first 12 rounds. 33 points is a solid start, but trophies are won in December, not October. We are staying sharp in training and respecting every opponent when MD13 resumes. #EagleMentality',
      media_type: 'NONE',
      reaction_fire_count: 61,
      reaction_clown_count: 1,
      reaction_skull_count: 0,
      repost_count: 16,
      raw_views: 340,
      impressions: 1220,
      is_trending: false,
      created_at: '2026-11-01T10:15:00.000Z'
    }
  ];

  for (const p of rootPosts) {
    await client.query(`
      INSERT INTO public.banter_posts (
        id, root_id, parent_id, author_handle, author_name, author_type, author_badge,
        content, media_type, media_urls, poll_id, reaction_fire_count, reaction_clown_count,
        reaction_skull_count, comment_count, replies_count, repost_count, raw_views,
        impressions, is_trending, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, 0, $15, $16, $17, $18, 'active', $19
      )
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        author_handle = EXCLUDED.author_handle,
        author_name = EXCLUDED.author_name,
        author_type = EXCLUDED.author_type,
        author_badge = EXCLUDED.author_badge,
        poll_id = EXCLUDED.poll_id,
        reaction_fire_count = EXCLUDED.reaction_fire_count,
        reaction_clown_count = EXCLUDED.reaction_clown_count,
        reaction_skull_count = EXCLUDED.reaction_skull_count,
        repost_count = EXCLUDED.repost_count,
        is_trending = EXCLUDED.is_trending,
        status = 'active';
    `, [
      p.id, p.root_id, p.parent_id, p.author_handle, p.author_name, p.author_type, p.author_badge,
      p.content, p.media_type, p.media_urls, p.poll_id || null, p.reaction_fire_count, p.reaction_clown_count,
      p.reaction_skull_count, p.repost_count, p.raw_views, p.impressions, p.is_trending, p.created_at
    ]);
  }
  console.log(`Inserted ${rootPosts.length} root football posts.`);

  // 3. Insert Polls
  const polls = [
    {
      id: 'poll-pause-01',
      post_id: 'b1000000-0000-4000-8000-000000000002',
      question: 'Will the Matchday 13 pause break Super Eagles momentum?',
      options: [
        { id: 1, text: 'No, they will run away with title', votes: 78 },
        { id: 2, text: 'Legends or Wazito will close gap', votes: 34 },
        { id: 3, text: 'Teams will take 2 weeks to regain rhythm', votes: 21 },
      ],
      total_votes: 133
    },
    {
      id: 'poll-ref-02',
      post_id: 'b1000000-0000-4000-8000-000000000003',
      question: 'Which referee has been the most consistent before the break?',
      options: [
        { id: 1, text: 'Referee Lamoh (Firm control & fair cards)', votes: 56 },
        { id: 2, text: 'Referee Ericko (Allows match to flow)', votes: 39 },
        { id: 3, text: 'Referee Jark (Strict on penalties)', votes: 28 },
        { id: 4, text: 'Referee Chalo (Strict on offsides)', votes: 14 },
      ],
      total_votes: 137
    },
    {
      id: 'poll-champ-03',
      post_id: 'b1000000-0000-4000-8000-000000000007',
      question: 'Who will gain automatic promotion to Egerton Premier League?',
      options: [
        { id: 1, text: 'Talanta fc (League leaders)', votes: 52 },
        { id: 2, text: 'Ajax fc (Free-scoring attack)', votes: 38 },
        { id: 3, text: 'Fass Elites / young stars', votes: 18 },
      ],
      total_votes: 108
    },
    {
      id: 'poll-qa-04',
      post_id: 'b1000000-0000-4000-8000-000000000008',
      question: 'What was your biggest surprise of the first leg?',
      options: [
        { id: 1, text: 'Super Eagles +32 GD dominance', votes: 68 },
        { id: 2, text: 'Mighty Blacks conceding 39 goals', votes: 42 },
        { id: 3, text: 'Talanta FC leading Championship', votes: 27 },
        { id: 4, text: 'Santos FC down in 11th position', votes: 19 },
      ],
      total_votes: 156
    }
  ];

  for (const pl of polls) {
    await client.query(`
      INSERT INTO public.banter_polls (id, post_id, question, options, total_votes, voters, expires_at)
      VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, NOW() + INTERVAL '7 days')
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        total_votes = EXCLUDED.total_votes;
    `, [pl.id, pl.post_id, pl.question, JSON.stringify(pl.options), pl.total_votes]);
  }
  console.log(`Inserted ${polls.length} polls.`);

  // 4. Insert Replies
  const replies = [
    // Replies to post 1
    {
      id: 'b1000000-0000-4000-8000-000000000101',
      parent_id: 'b1000000-0000-4000-8000-000000000001',
      root_id: 'b1000000-0000-4000-8000-000000000001',
      author_handle: 'Tatton Ultras #42',
      author_name: 'Tatton Ultras',
      author_type: 'user',
      content: 'Player safety is first. Last rainy Saturday at Pavilion was water polo not football. Good call by the directorate.',
      reaction_fire_count: 19,
      reaction_clown_count: 1,
      reaction_skull_count: 0,
      created_at: '2026-10-26T10:45:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000102',
      parent_id: 'b1000000-0000-4000-8000-000000000001',
      root_id: 'b1000000-0000-4000-8000-000000000001',
      author_handle: 'SuperEagles Diehard #09',
      author_name: 'SuperEagles Diehard',
      author_type: 'user',
      content: 'Why now though?! We had 11 wins in 12 games and 41 goals scored! Chasing pack needed oxygen and they got a ventilator 😂',
      reaction_fire_count: 31,
      reaction_clown_count: 4,
      reaction_skull_count: 6,
      created_at: '2026-10-26T11:15:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000103',
      parent_id: 'b1000000-0000-4000-8000-000000000001',
      root_id: 'b1000000-0000-4000-8000-000000000001',
      author_handle: 'Legends Army #10',
      author_name: 'Legends Army',
      author_type: 'user',
      content: 'Ventilator for who? We have 26 points and we beat your local rivals. MD13 resumption will humble the birds.',
      reaction_fire_count: 22,
      reaction_clown_count: 2,
      reaction_skull_count: 1,
      created_at: '2026-10-26T12:00:00.000Z'
    },
    // Replies to post 2
    {
      id: 'b1000000-0000-4000-8000-000000000201',
      parent_id: 'b1000000-0000-4000-8000-000000000002',
      root_id: 'b1000000-0000-4000-8000-000000000002',
      author_handle: 'Mighty Blacks Faithful #03',
      author_name: 'Mighty Blacks Faithful',
      author_type: 'user',
      content: 'Admin delete this immediately. We are already dealing with internal club issues, no need to broadcast our suffering 😭',
      reaction_fire_count: 14,
      reaction_clown_count: 9,
      reaction_skull_count: 28,
      created_at: '2026-10-27T15:10:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000202',
      parent_id: 'b1000000-0000-4000-8000-000000000002',
      root_id: 'b1000000-0000-4000-8000-000000000002',
      author_handle: 'Varsity Scout #07',
      author_name: 'Varsity Scout',
      author_type: 'user',
      content: 'Mighty Blacks midfield is leaving their back four exposed. Distance between lines is 35m! Any through ball is a 1-on-1.',
      reaction_fire_count: 26,
      reaction_clown_count: 0,
      reaction_skull_count: 2,
      created_at: '2026-10-27T16:00:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000203',
      parent_id: 'b1000000-0000-4000-8000-000000000002',
      root_id: 'b1000000-0000-4000-8000-000000000002',
      author_handle: 'BCOM Sniper #11',
      author_name: 'BCOM Sniper',
      author_type: 'user',
      content: 'Super Eagles play direct on the wings. When they face a compact low block on Pitch C they will drop points.',
      reaction_fire_count: 18,
      reaction_clown_count: 3,
      reaction_skull_count: 1,
      created_at: '2026-10-27T16:45:00.000Z'
    },
    // Replies to post 3
    {
      id: 'b1000000-0000-4000-8000-000000000301',
      parent_id: 'b1000000-0000-4000-8000-000000000003',
      root_id: 'b1000000-0000-4000-8000-000000000003',
      author_handle: 'Celtics Captain #04',
      author_name: 'Celtics Captain',
      author_type: 'user',
      content: 'Lamoh is the only ref who explains decisions to captains calmly. The rest blow whistles like security on curfew.',
      reaction_fire_count: 34,
      reaction_clown_count: 1,
      reaction_skull_count: 0,
      created_at: '2026-10-28T17:00:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000302',
      parent_id: 'b1000000-0000-4000-8000-000000000003',
      root_id: 'b1000000-0000-4000-8000-000000000003',
      author_handle: 'Pavilion Pundit #21',
      author_name: 'Pavilion Pundit',
      author_type: 'user',
      content: 'Jark gave two penalties to BCOM against us in 15 mins! If you trip over your own boots at the box he points to the spot!',
      reaction_fire_count: 28,
      reaction_clown_count: 7,
      reaction_skull_count: 12,
      created_at: '2026-10-28T17:40:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000303',
      parent_id: 'b1000000-0000-4000-8000-000000000003',
      root_id: 'b1000000-0000-4000-8000-000000000003',
      author_handle: 'Ref Watch Egerton',
      author_name: 'Ref Watch Egerton',
      author_type: 'journalist',
      content: 'Both fouls were clear studs-up on match video. Referee committee confirmed Jark was 100% justified.',
      reaction_fire_count: 15,
      reaction_clown_count: 2,
      reaction_skull_count: 1,
      created_at: '2026-10-28T18:15:00.000Z'
    },
    // Replies to post 4
    {
      id: 'b1000000-0000-4000-8000-000000000401',
      parent_id: 'b1000000-0000-4000-8000-000000000004',
      root_id: 'b1000000-0000-4000-8000-000000000004',
      author_handle: 'Tatton Striker #14',
      author_name: 'Tatton Striker',
      author_type: 'user',
      content: 'Coach please start Kamau on the right wing, he creates twice as many chances from wide areas than through the middle.',
      reaction_fire_count: 16,
      created_at: '2026-10-29T11:45:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000402',
      parent_id: 'b1000000-0000-4000-8000-000000000004',
      root_id: 'b1000000-0000-4000-8000-000000000004',
      author_handle: 'Legends FC Coach',
      author_name: 'Coach Eric (Legends)',
      author_type: 'coach',
      author_badge: 'Legends FC Coach',
      content: 'Noted. Tactical versatility is what will win the title in the second leg.',
      reaction_fire_count: 24,
      created_at: '2026-10-29T12:30:00.000Z'
    },
    // Replies to post 5
    {
      id: 'b1000000-0000-4000-8000-000000000501',
      parent_id: 'b1000000-0000-4000-8000-000000000005',
      root_id: 'b1000000-0000-4000-8000-000000000005',
      author_handle: 'Black Panther #99',
      author_name: 'Black Panther',
      author_type: 'user',
      content: 'Leave HELB out of our football miseries please 😭 We conceded 5 against Super Eagles, we are numb to the pain.',
      reaction_fire_count: 15,
      reaction_clown_count: 11,
      reaction_skull_count: 33,
      created_at: '2026-10-30T19:20:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000502',
      parent_id: 'b1000000-0000-4000-8000-000000000005',
      root_id: 'b1000000-0000-4000-8000-000000000005',
      author_handle: 'Blue Blazers Fan #16',
      author_name: 'Blue Blazers Fan',
      author_type: 'user',
      content: 'At least you have 2 wins. Santos are 11th with only 2 wins and spent the whole pre-season hyping their signings!',
      reaction_fire_count: 27,
      reaction_clown_count: 5,
      reaction_skull_count: 12,
      created_at: '2026-10-30T20:00:00.000Z'
    },
    // Replies to post 6
    {
      id: 'b1000000-0000-4000-8000-000000000601',
      parent_id: 'b1000000-0000-4000-8000-000000000006',
      root_id: 'b1000000-0000-4000-8000-000000000006',
      author_handle: 'Varsity Striker #04',
      author_name: 'Varsity Striker',
      author_type: 'user',
      content: 'He has blistering pace on the counter. Once center backs push past halfway, nobody in this league can catch him.',
      reaction_fire_count: 29,
      created_at: '2026-10-30T21:45:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000602',
      parent_id: 'b1000000-0000-4000-8000-000000000006',
      root_id: 'b1000000-0000-4000-8000-000000000006',
      author_handle: 'Wazito Hardcore #08',
      author_name: 'Wazito Hardcore',
      author_type: 'user',
      content: 'Wait until he plays Wazito on Pitch A. Our captain will give him 90 minutes of strict man-marking.',
      reaction_fire_count: 21,
      created_at: '2026-10-30T22:30:00.000Z'
    },
    // Replies to post 7
    {
      id: 'b1000000-0000-4000-8000-000000000701',
      parent_id: 'b1000000-0000-4000-8000-000000000007',
      root_id: 'b1000000-0000-4000-8000-000000000007',
      author_handle: 'Law Campus Rep #01',
      author_name: 'Law Campus Rep',
      author_type: 'user',
      content: 'We are not filing an injunction, but that 84th min penalty against Ajax was an egregious injustice! We demand VAR!',
      reaction_fire_count: 16,
      created_at: '2026-10-31T16:00:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000702',
      parent_id: 'b1000000-0000-4000-8000-000000000007',
      root_id: 'b1000000-0000-4000-8000-000000000007',
      author_handle: 'Talanta Supporter #20',
      author_name: 'Talanta Supporter',
      author_type: 'user',
      content: 'Lawyers should stick to moot courts! Talanta are getting promoted to EPL next season, book the date!',
      reaction_fire_count: 28,
      created_at: '2026-10-31T16:50:00.000Z'
    },
    // Replies to post 8
    {
      id: 'b1000000-0000-4000-8000-000000000801',
      parent_id: 'b1000000-0000-4000-8000-000000000008',
      root_id: 'b1000000-0000-4000-8000-000000000008',
      author_handle: 'BCOM Sniper #11',
      author_name: 'BCOM Sniper',
      author_type: 'user',
      content: 'BCOM 3-2 Legends! The rain started in the 70th min, Pitch A was electric, and we scored the winner in the 93rd min!',
      reaction_fire_count: 32,
      created_at: '2026-11-01T09:00:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000802',
      parent_id: 'b1000000-0000-4000-8000-000000000008',
      root_id: 'b1000000-0000-4000-8000-000000000008',
      author_handle: 'SuperEagles Diehard #09',
      author_name: 'SuperEagles Diehard',
      author_type: 'user',
      content: 'Super Eagles 4-1 Wazito. Pure football perfection. 4 different scorers and our keeper saved a penalty.',
      reaction_fire_count: 26,
      created_at: '2026-11-01T09:30:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000803',
      parent_id: 'b1000000-0000-4000-8000-000000000008',
      root_id: 'b1000000-0000-4000-8000-000000000008',
      author_handle: 'Santos Side Rep #27',
      author_name: 'Santos Side Rep',
      author_type: 'user',
      content: 'Santos 2-1 Mighty Blacks. The only weekend this semester where our hostel was in a celebratory mood.',
      reaction_fire_count: 18,
      created_at: '2026-11-01T09:50:00.000Z'
    },
    // Replies to post 9
    {
      id: 'b1000000-0000-4000-8000-000000000901',
      parent_id: 'b1000000-0000-4000-8000-000000000009',
      root_id: 'b1000000-0000-4000-8000-000000000009',
      author_handle: 'Campus Scout #15',
      author_name: 'Campus Scout',
      author_type: 'user',
      content: 'Humility from the league leaders. That is why they are 7 points clear at the top.',
      reaction_fire_count: 19,
      created_at: '2026-11-01T10:45:00.000Z'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000902',
      parent_id: 'b1000000-0000-4000-8000-000000000009',
      root_id: 'b1000000-0000-4000-8000-000000000009',
      author_handle: 'Tatton Ultras #42',
      author_name: 'Tatton Ultras',
      author_type: 'user',
      content: 'Bring on MD13! We are ready to fill the sidelines at Pitch A!',
      reaction_fire_count: 23,
      created_at: '2026-11-01T11:20:00.000Z'
    }
  ];

  for (const r of replies) {
    await client.query(`
      INSERT INTO public.banter_posts (
        id, root_id, parent_id, author_handle, author_name, author_type, author_badge,
        content, media_type, reaction_fire_count, reaction_clown_count, reaction_skull_count,
        comment_count, replies_count, repost_count, raw_views, impressions, is_trending,
        status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'NONE', $9, $10, $11, 0, 0, 0, 10, 520, false, 'active', $12
      )
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        author_handle = EXCLUDED.author_handle,
        author_name = EXCLUDED.author_name,
        author_type = EXCLUDED.author_type,
        status = 'active';
    `, [
      r.id, r.root_id, r.parent_id, r.author_handle, r.author_name, r.author_type, r.author_badge || null,
      r.content, r.reaction_fire_count || 0, r.reaction_clown_count || 0, r.reaction_skull_count || 0, r.created_at
    ]);
  }
  console.log(`Inserted ${replies.length} replies.`);

  // 5. Update comment_count and replies_count on parents based on actual children
  await client.query(`
    UPDATE public.banter_posts p
    SET replies_count = c.cnt,
        comment_count = c.cnt
    FROM (
      SELECT parent_id, COUNT(*) as cnt
      FROM public.banter_posts
      WHERE parent_id IS NOT NULL
      GROUP BY parent_id
    ) c
    WHERE p.id = c.parent_id;
  `);
  console.log('Synchronized reply counts on parent posts.');

  await client.end();
  console.log('Banter database seeding completed successfully!');
}

run().catch((err) => {
  console.error('Error seeding banter database:', err);
  process.exit(1);
});
