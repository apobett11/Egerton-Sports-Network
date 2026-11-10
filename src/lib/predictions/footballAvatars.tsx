import React from 'react';
import { X, Shield } from 'lucide-react';
import type { BanterPost } from '../../types/predictions';
import { supabase } from './banterSupabase';
import { peekTeamLogo, DEFAULT_TEAM_LOGO } from '../teamLogoCache';

/**
 * 20 Curated, high-quality, aesthetic football/soccer images (free, uncopyrighted from Unsplash)
 * strictly focused on football, pitches, turfs, balls, player kicks, match action, and stadium aesthetics.
 * All sized to square 400x400.
 */
export const FOOTBALL_AVATARS: string[] = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&h=400&q=80', // Stadium under lights
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=400&h=400&q=80', // Player action kick
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=400&h=400&q=80', // Stadium seats & pitch
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=400&h=400&q=80', // Ball in dynamic motion
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=400&h=400&q=80', // Pitch grass closeup
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=400&h=400&q=80', // Leather ball on pitch
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&h=400&q=80', // Ball in the net
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=400&h=400&q=80', // Cleats on turf
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=400&h=400&q=80', // Football match play
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=400&h=400&q=80', // Football training turf
  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=400&h=400&q=80', // Center circle match ball
  'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=400&h=400&q=80', // Corner flag on green pitch
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=400&h=400&q=80', // Vintage football stitching
  'https://images.unsplash.com/photo-1516731415730-0c607149933a?auto=format&fit=crop&w=400&h=400&q=80', // Night match floodlights
  'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=400&h=400&q=80', // Match ball on green turf
  'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=400&h=400&q=80', // Stadium atmosphere glow
  'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=400&h=400&q=80', // Pitch grass in golden hour
  'https://images.unsplash.com/photo-1524015368236-bbf6f72545b6?auto=format&fit=crop&w=400&h=400&q=80', // Footballs aligned for drill
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&h=400&q=80', // Net and goalpost angle
  'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=400&h=400&q=80', // Aerial view tactical pitch
];

/**
 * In-memory dynamic map populated directly from the Supabase `teams` table (logo_url column and bucket files)
 */
export const DYNAMIC_TEAM_LOGOS = new Map<string, string>();
let dynamicLogosInitialized = false;

export async function fetchLiveTeamLogos(): Promise<void> {
  if (dynamicLogosInitialized) return;
  try {
    const { data } = await supabase
      .from('teams')
      .select('id, name, short_name, logo_url')
      .not('logo_url', 'is', null);

    if (data && Array.isArray(data)) {
      for (const row of data) {
        if (!row.logo_url) continue;
        const logoUrl = String(row.logo_url);
        if (row.id) {
          DYNAMIC_TEAM_LOGOS.set(String(row.id).toLowerCase(), logoUrl);
        }
        if (row.name) {
          const norm = String(row.name).trim().toLowerCase();
          DYNAMIC_TEAM_LOGOS.set(norm, logoUrl);
          DYNAMIC_TEAM_LOGOS.set(norm.replace(/\s+fc$/, '').trim(), logoUrl);
        }
        if (row.short_name) {
          DYNAMIC_TEAM_LOGOS.set(String(row.short_name).trim().toLowerCase(), logoUrl);
        }
      }
      dynamicLogosInitialized = true;
    }
  } catch {
    // Keep using static mappings on any network failure
  }
}

// Background prefetch for instant reactivity
if (typeof window !== 'undefined') {
  void fetchLiveTeamLogos();
}

/**
 * Dedicated club crests / logos for teams.
 * Directly sourced from Supabase team-logos bucket and registered database logo_url.
 */
export const TEAM_LOGOS: Record<string, string> = {
  // EPL Teams (Database & Supabase Storage Bucket team-logos/logos/*)
  '10000000-0000-4000-8000-000000000003': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000003.webp',
  'santos': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000003.webp',
  'santos fc': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000003.webp',
  'san': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000003.webp',

  '10000000-0000-4000-8000-000000000001': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000001_1789846156143.webp',
  'super eagles': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000001_1789846156143.webp',
  'super eagles fc': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000001_1789846156143.webp',
  'spe': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-000000000001_1789846156143.webp',

  '10000000-0000-4000-8000-00000000000a': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-00000000000a_1790461291409.webp',
  'wazito': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-00000000000a_1790461291409.webp',
  'wazito fc': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-00000000000a_1790461291409.webp',
  'waz': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/10000000-0000-4000-8000-00000000000a_1790461291409.webp',

  '10000000-0000-4000-8000-000000000004': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'bcom': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'bcom fc': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'bcm': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',

  '10000000-0000-4000-8000-000000000005': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80',
  'blue blazers': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80',
  'blu': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80',

  '10000000-0000-4000-8000-000000000006': 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=100&auto=format&fit=crop&q=80',
  'mighty blacks': 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=100&auto=format&fit=crop&q=80',
  'mbl': 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=100&auto=format&fit=crop&q=80',

  '10000000-0000-4000-8000-00000000000b': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'celtics': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'celtics fc': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'cel': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',

  '10000000-0000-4000-8000-000000000002': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'five stars': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'five stars fc': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'fsf': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',

  '10000000-0000-4000-8000-000000000008': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=100&auto=format&fit=crop&q=80',
  'giants': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=100&auto=format&fit=crop&q=80',
  'giants fc': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=100&auto=format&fit=crop&q=80',
  'gnt': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=100&auto=format&fit=crop&q=80',

  '10000000-0000-4000-8000-000000000007': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
  'legends': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
  'legends fc': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
  'lgd': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',

  '10000000-0000-4000-8000-000000000009': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'med': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'med fc': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',

  '10000000-0000-4000-8000-00000000000c': 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=80',
  'rising stars': 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=80',
  'rst': 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=80',

  'engineering': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'engineering fc': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'engineering strikers': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'agriculture fc': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=100&auto=format&fit=crop&q=80',
  'njoro spurs': 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=100&auto=format&fit=crop&q=80',
  'science lions': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'tatton united': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'vet med warriors': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',

  // Championship Teams (Database & Supabase Storage Bucket team-logos/logos/*)
  '20000000-0000-4000-8000-000000000002': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000002.webp',
  'ajax': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000002.webp',
  'ajax fc': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000002.webp',
  'ajx': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000002.webp',

  '20000000-0000-4000-8000-000000000009': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000009.webp',
  'rangers': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000009.webp',
  'rangers fc': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000009.webp',
  'rng': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000009.webp',

  '20000000-0000-4000-8000-000000000004': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000004.png',
  'emsa': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000004.png',
  'emsa fc': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000004.png',
  'ems': 'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/team-logos/logos/20000000-0000-4000-8000-000000000004.png',

  '20000000-0000-4000-8000-000000000001': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'aged': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'aged fc': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'agd': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',

  '20000000-0000-4000-8000-000000000005': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'tatton': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'tatton fc': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'tat': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',

  '20000000-0000-4000-8000-000000000006': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'talanta': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'talanta fc': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'tln': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',

  '20000000-0000-4000-8000-000000000008': 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=100&auto=format&fit=crop&q=80',
  'young stars': 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=100&auto=format&fit=crop&q=80',
  'yst': 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=100&auto=format&fit=crop&q=80',

  '20000000-0000-4000-8000-00000000000a': 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=80',
  'law': 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=80',
  'law fc': 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=80',

  '20000000-0000-4000-8000-000000000007': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'young legends': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'ylg': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',

  '20000000-0000-4000-8000-000000000003': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'fass elites': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'fas': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',

  'education stars': 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=100&auto=format&fit=crop&q=80',
  'health sciences fc': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',
  'nakuru town campus fc': 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=80',
  'veterinary academy fc': 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=100&auto=format&fit=crop&q=80',

  // Other League Teams
  '40000000-0000-4000-8000-000000000001': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'egerton': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'egerton fc': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
  'ege': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',

  '40000000-0000-4000-8000-000000000002': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'sunking': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'sunking fc': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
  'skg': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
};

/** Official Press / Journalist fixed badge */
export const OFFICIAL_JOURNALIST_LOGO = 'https://api.dicebear.com/7.x/shapes/svg?seed=JournalistDesk&backgroundColor=0284c7';

/** Championship team names lookup */
export const CHAMPIONSHIP_TEAM_NAMES = new Set([
  'aged fc',
  'ajax fc',
  'tatton fc',
  'talanta fc',
  'rangers fc',
  'law fc',
  'fass elites',
  'emsa fc',
  'young legends',
  'young stars',
  'education stars',
  'health sciences fc',
  'nakuru town campus fc',
  'veterinary academy fc'
]);

/** Deterministically pick one of the 20 football photos by string hash */
export function getFootballAvatar(seed: string): string {
  if (!seed) return FOOTBALL_AVATARS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FOOTBALL_AVATARS.length;
  return FOOTBALL_AVATARS[index];
}

/** Clean coach strings to extract target club name */
function cleanCoachCandidate(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\[coach\]|\(coach\)|coach|head coach|official|team|#\d+/gi, '')
    .replace(/[\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Get dedicated team logo, ensuring coaches receive real uploaded/bucket images */
export function getTeamLogo(teamNameOrId?: string | null): string {
  if (!teamNameOrId) {
    return DEFAULT_TEAM_LOGO;
  }

  const raw = teamNameOrId.trim();
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image')) {
    return raw;
  }

  const cleaned = cleanCoachCandidate(raw);
  const key = raw.toLowerCase();

  // 1. Direct dynamic DB cache match (by ID, full name, short name, or cleaned candidate)
  if (DYNAMIC_TEAM_LOGOS.has(key)) return DYNAMIC_TEAM_LOGOS.get(key)!;
  if (DYNAMIC_TEAM_LOGOS.has(cleaned)) return DYNAMIC_TEAM_LOGOS.get(cleaned)!;

  // 2. Client IndexedDB / localStorage logo cache
  const cached = peekTeamLogo(raw) || peekTeamLogo(cleaned);
  if (cached) return cached;

  // 3. Static TEAM_LOGOS map (has uploaded bucket URLs & DB logo URLs)
  if (TEAM_LOGOS[cleaned]) return TEAM_LOGOS[cleaned];
  if (TEAM_LOGOS[key]) return TEAM_LOGOS[key];
  const cleanedNoFc = cleaned.replace(/\s+fc$/, '').trim();
  if (TEAM_LOGOS[cleanedNoFc]) return TEAM_LOGOS[cleanedNoFc];

  // 4. Substring matching against known teams in DYNAMIC_TEAM_LOGOS & TEAM_LOGOS
  for (const [tKey, url] of DYNAMIC_TEAM_LOGOS.entries()) {
    if (tKey.length >= 3 && (cleaned.includes(tKey) || tKey.includes(cleaned) || key.includes(tKey))) {
      return url;
    }
  }

  for (const [tKey, url] of Object.entries(TEAM_LOGOS)) {
    if (tKey.length >= 3 && (cleaned.includes(tKey) || tKey.includes(cleaned) || key.includes(tKey))) {
      return url;
    }
  }

  return DEFAULT_TEAM_LOGO;
}

export interface AuthorIdentityMeta {
  avatarUrl: string;
  isCoach: boolean;
  isJournalist: boolean;
  coachLeague: 'epl' | 'championship' | null;
  displayName: string;
  authorHandle: string;
  roleBadgeText: string;
}

export function getAuthorIdentityMeta(
  post: Partial<BanterPost> & {
    author_type?: string;
    author_handle?: string;
    author_name?: string;
    author_badge?: string;
    author_avatar?: string;
    tagged_team_name?: string;
    tagged_team_id?: string;
  }
): AuthorIdentityMeta {
  const authorType = (post.authorType || post.author_type || '').toLowerCase();
  const authorBadge = (post.authorBadge || post.author_badge || '').toLowerCase();
  const handle = (post.authorHandle || post.author_handle || 'fanatic').toLowerCase();
  const name = post.authorName || post.author_name || post.authorHandle || post.author_handle || 'Fanatic';
  const team = post.taggedTeamName || post.tagged_team_name || '';

  const isJournalist = authorType === 'journalist' || authorBadge.includes('journalist') || handle.includes('desk') || authorBadge.includes('reporter');
  const isCoach = authorType === 'coach' || authorBadge.includes('coach') || handle.includes('coach');

  let coachLeague: 'epl' | 'championship' | null = null;
  if (isCoach) {
    const leagueId = post.leagueId || '';
    const normTeam = team.toLowerCase();
    if (
      leagueId === '22222222-2222-2222-2222-222222222222' ||
      leagueId.includes('champ') ||
      CHAMPIONSHIP_TEAM_NAMES.has(normTeam) ||
      authorBadge.includes('championship') ||
      name.toLowerCase().includes('championship')
    ) {
      coachLeague = 'championship';
    } else {
      coachLeague = 'epl';
    }
  }

  let avatarUrl = '';
  let roleBadgeText = 'Fan Session';

  if (isJournalist) {
    avatarUrl = OFFICIAL_JOURNALIST_LOGO;
    roleBadgeText = 'Official Journalist';
  } else if (isCoach) {
    // Check if an explicit non-placeholder avatar was already provided
    const directAvatar = (post.authorAvatar || post.author_avatar || '').trim();
    if (directAvatar && !directAvatar.includes('dicebear') && directAvatar.startsWith('http')) {
      avatarUrl = directAvatar;
    } else {
      const candidate =
        post.taggedTeamId ||
        (post as any).tagged_team_id ||
        team ||
        post.taggedTeamName ||
        (post as any).tagged_team_name ||
        post.authorBadge ||
        post.author_badge ||
        name ||
        handle;
      avatarUrl = getTeamLogo(candidate);
    }
    roleBadgeText = coachLeague === 'championship' ? `${team || 'Club'} Coach (Championship)` : `${team || 'Club'} Coach (EPL)`;
  } else {
    // 20 randomized football images for users (deterministic by handle/id)
    const seed = post.authorDeviceId || post.userId || post.authorHandle || post.author_handle || post.id || name;
    avatarUrl = getFootballAvatar(seed);
  }

  return {
    avatarUrl,
    isCoach,
    isJournalist,
    coachLeague,
    displayName: name,
    authorHandle: post.authorHandle || post.author_handle || 'fanatic',
    roleBadgeText,
  };
}

/** Instagram-style Blue Verification Tick */
export const InstagramBlueTick: React.FC<{ className?: string }> = ({ className = 'h-4 w-4 shrink-0 inline-block align-middle' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Official Journalist Verified">
    <path
      d="M12 1.5l2.25 2.5 3.35-.45 1.45 3.05 3.1 1.35-.4 3.35 2.05 2.7-2.05 2.7.4 3.35-3.1 1.35-1.45 3.05-3.35-.45L12 22.5l-2.25-2.5-3.35.45-1.45-3.05-3.1-1.35.4-3.35L.2 12l2.05-2.7-.4-3.35 3.1-1.35L6.4 1.55l3.35.45L12 1.5z"
      fill="#0095f6"
    />
    <path
      d="M9.5 16.2l-3.7-3.7 1.4-1.4 2.3 2.3 6.9-6.9 1.4 1.4-8.3 8.3z"
      fill="#ffffff"
    />
  </svg>
);

/** Vibrant Orange Tick for EPL Coaches */
export const OrangeCoachTick: React.FC<{ className?: string }> = ({ className = 'h-4 w-4 shrink-0 inline-block align-middle' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="EPL Coach Verified">
    <path
      d="M12 1.5l2.25 2.5 3.35-.45 1.45 3.05 3.1 1.35-.4 3.35 2.05 2.7-2.05 2.7.4 3.35-3.1 1.35-1.45 3.05-3.35-.45L12 22.5l-2.25-2.5-3.35.45-1.45-3.05-3.1-1.35.4-3.35L.2 12l2.05-2.7-.4-3.35 3.1-1.35L6.4 1.55l3.35.45L12 1.5z"
      fill="#ea580c"
    />
    <path
      d="M9.5 16.2l-3.7-3.7 1.4-1.4 2.3 2.3 6.9-6.9 1.4 1.4-8.3 8.3z"
      fill="#ffffff"
    />
  </svg>
);

/** Slightly less orange (warm amber-gold) Tick for Championship Coaches */
export const ChampionshipAmberCoachTick: React.FC<{ className?: string }> = ({ className = 'h-4 w-4 shrink-0 inline-block align-middle' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Championship Coach Verified">
    <path
      d="M12 1.5l2.25 2.5 3.35-.45 1.45 3.05 3.1 1.35-.4 3.35 2.05 2.7-2.05 2.7.4 3.35-3.1 1.35-1.45 3.05-3.35-.45L12 22.5l-2.25-2.5-3.35.45-1.45-3.05-3.1-1.35.4-3.35L.2 12l2.05-2.7-.4-3.35 3.1-1.35L6.4 1.55l3.35.45L12 1.5z"
      fill="#d97706"
    />
    <path
      d="M9.5 16.2l-3.7-3.7 1.4-1.4 2.3 2.3 6.9-6.9 1.4 1.4-8.3 8.3z"
      fill="#ffffff"
    />
  </svg>
);

/**
 * Large Avatar Viewer Modal
 * When clicking on an author logo/avatar or name, shows large image, session name,
 * and the exact privacy notice required by user.
 */
export const AvatarViewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  sessionName: string;
  handle: string;
  isCoach?: boolean;
  isJournalist?: boolean;
  coachLeague?: 'epl' | 'championship' | null;
}> = ({
  isOpen,
  onClose,
  imageUrl,
  sessionName,
  handle,
  isCoach,
  isJournalist,
  coachLeague,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-4 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Large Image View */}
        <div className="mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-zinc-700/80 shadow-xl bg-zinc-900 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={sessionName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Session Name & Verification Status */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h3 className="text-lg font-black text-white tracking-tight">
              {sessionName}
            </h3>
            {isJournalist ? (
              <InstagramBlueTick className="h-4 w-4" />
            ) : isCoach ? (
              coachLeague === 'championship' ? (
                <ChampionshipAmberCoachTick className="h-4 w-4" />
              ) : (
                <OrangeCoachTick className="h-4 w-4" />
              )
            ) : null}
          </div>
          <p className="text-xs font-mono text-zinc-500">
            @{handle.replace(/^@/, '')}
          </p>

          {isJournalist && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-sky-400 border border-sky-500/30">
              Official Journalist
            </span>
          )}
          {isCoach && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                coachLeague === 'championship'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              }`}
            >
              <Shield className="h-3 w-3" />
              <span>{coachLeague === 'championship' ? 'Championship Coach' : 'EPL Coach'}</span>
            </span>
          )}
        </div>

        {/* User Privacy & Randomization Notice */}
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-3.5 text-xs text-zinc-300 leading-relaxed text-left">
          <p className="font-medium text-zinc-300">
            "the images and the logos are random for the users. only the journalists and the coaches have fixed accounts. no information of the users are saved."
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
