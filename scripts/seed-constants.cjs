const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// 1. Read Supabase credentials from .env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Master Relational IDs
const CLASS_IDS = {
  'I': '6b1fd8b2-89a9-4c1f-851d-0e224012dc7c', // Individual
  'T': '464b5b33-2494-46eb-bb36-3e3f66a46dd3', // Team
  'C': '87eb35ca-505d-4f8c-ae6f-955c05cee90b', // Coaching
  'O': '95ba1939-67d8-4867-a0b4-702a5f0fb28c', // Officiation
};

const CATEGORY_IDS = {
  'fitness-and-training': 'b893569d-16ec-44f1-9500-fdc4dd05dba6',
  'pitch-training': 'e1087da1-d9a9-489d-94bf-8ca49a28a0b7',
  'kit': '5ba081b1-9d76-45c9-8feb-62f8a31e7b00',
  'goalkeepers': '4be0b071-be3b-42ee-a29c-81379cc11c0b',
  'boots-and-balls': '759de649-2d75-4968-acb7-c7965822c3a8',
  'officiating': '79ddc254-e8c7-4fc4-bf70-e04a9acf5d08',
};

// Verified High-Resolution Real Photos
const IMAGES = {
  // Real Jerseys by Color
  jersey_red: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=600&q=80',
  jersey_blue: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=600&q=80',
  jersey_green: 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=600&q=80',
  jersey_yellow: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=600&q=80',
  jersey_black: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
  jersey_white: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  jersey_cyan: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
  jersey_amber: 'https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=600&q=80',
  apparel_dark: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
  apparel_sports: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  apparel_tee: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80',
  apparel_active: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=600&q=80',

  // Shorts & Socks
  shorts_sports: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=80',
  socks_white: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
  socks_athletic: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=600&q=80',
  gear_sports: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=600&q=80',

  // Real Soccer Balls
  ball_match_pitch: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
  ball_grass_closeup: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&w=600&q=80',
  ball_stadium_action: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=600&q=80',
  ball_classic_retro: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=600&q=80',
  ball_turf_goal: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80',
  ball_in_net: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=600&q=80',
  ball_training_pack: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80',
  ball_pitch_line: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=600&q=80',
  ball_official_match: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80',

  // Real Football Boots / Cleats
  boots_nike_red: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80',
  boots_red_speed: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  boots_neon_volt: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80',
  boots_sports_pro: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
  boots_cleats_black: 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=600&q=80',
  boots_colorful_speed: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80',
  boots_turf_pro: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80',
  boots_athletic_puma: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',

  // Real Dumbbells & Gym Fitness
  dumbbells_hex_rack: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
  dumbbells_metal_weights: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
  dumbbells_floor_single: 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&w=600&q=80',
  kettlebell_gym_black: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
  gym_workout_weights: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80',
  fitness_heavy_rack: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
  fitness_training_gear: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  barbell_conditioning: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=600&q=80',
  dumbbells_row_pairs: 'https://images.unsplash.com/photo-1521804906057-1df8fdb718b7?auto=format&fit=crop&w=600&q=80',
  conditioning_vest_gear: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',

  // Real Goalkeeper Gloves & Gear
  gloves_pitch_grass: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=600&q=80',
  gloves_keeper_catch: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=600&q=80',
  gloves_save_action: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=600&q=80',
  keeper_goal_net: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80',

  // Real Officiating & Referee Cards / Whistles
  referee_pitch_cards: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=600&q=80',
  referee_whistle_match: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=600&q=80',
  referee_match_action: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80',
  referee_field_official: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=600&q=80',
  pitch_corner_flag: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=600&q=80',
  pitch_sideline_mark: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=600&q=80',

  // Real Pitch Training / Cones / Drills
  training_cones_pitch: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=600&q=80',
  pitch_goal_training: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=600&q=80',
  pitch_tactical_turf: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
};

// Color palettes with explicit matching photo links
const COLOR_PALETTES = {
  red: { name: 'Crimson Red', hex: '#dc2626', image: IMAGES.jersey_red },
  blue: { name: 'Cobalt Blue', hex: '#2563eb', image: IMAGES.jersey_blue },
  green: { name: 'Emerald Green', hex: '#059669', image: IMAGES.jersey_green },
  yellow: { name: 'Solar Yellow', hex: '#d97706', image: IMAGES.jersey_yellow },
  black: { name: 'Pitch Black', hex: '#0f172a', image: IMAGES.jersey_black },
  white: { name: 'Pure White', hex: '#f8fafc', image: IMAGES.jersey_white },
  cyan: { name: 'Electric Cyan', hex: '#06b6d4', image: IMAGES.jersey_cyan },
  amber: { name: 'Amber Gold', hex: '#b45309', image: IMAGES.jersey_amber },
};

module.exports = {
  supabase,
  CLASS_IDS,
  CATEGORY_IDS,
  IMAGES,
  COLOR_PALETTES,
};
