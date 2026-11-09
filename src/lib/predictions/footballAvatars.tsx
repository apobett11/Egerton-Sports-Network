import React from 'react';
import { X, Shield } from 'lucide-react';
import type { BanterPost } from '../../types/predictions';

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
 * Dedicated club crests / logos for teams.
 * Kept strictly distinct from user football rotation photos.
 */
export const TEAM_LOGOS: Record<string, string> = {
  // EPL Teams
  'santos': 'https://api.dicebear.com/7.x/identicon/svg?seed=SantosFC&backgroundColor=059669',
  'santos fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=SantosFC&backgroundColor=059669',
  'bcom': 'https://api.dicebear.com/7.x/identicon/svg?seed=BCOMFC&backgroundColor=dc2626',
  'bcom fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=BCOMFC&backgroundColor=dc2626',
  'blue blazers': 'https://api.dicebear.com/7.x/identicon/svg?seed=BlueBlazers&backgroundColor=2563eb',
  'mighty blacks': 'https://api.dicebear.com/7.x/identicon/svg?seed=MightyBlacks&backgroundColor=18181b',
  'celtics': 'https://api.dicebear.com/7.x/identicon/svg?seed=CelticsFC&backgroundColor=16a34a',
  'celtics fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=CelticsFC&backgroundColor=16a34a',
  'five stars': 'https://api.dicebear.com/7.x/identicon/svg?seed=FiveStars&backgroundColor=ca8a04',
  'five stars fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=FiveStars&backgroundColor=ca8a04',
  'giants': 'https://api.dicebear.com/7.x/identicon/svg?seed=GiantsFC&backgroundColor=7c3aed',
  'giants fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=GiantsFC&backgroundColor=7c3aed',
  'legends': 'https://api.dicebear.com/7.x/identicon/svg?seed=LegendsFC&backgroundColor=b91c1c',
  'legends fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=LegendsFC&backgroundColor=b91c1c',
  'med': 'https://api.dicebear.com/7.x/identicon/svg?seed=MedFC&backgroundColor=0d9488',
  'med fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=MedFC&backgroundColor=0d9488',
  'rising stars': 'https://api.dicebear.com/7.x/identicon/svg?seed=RisingStars&backgroundColor=f59e0b',
  'super eagles': 'https://api.dicebear.com/7.x/identicon/svg?seed=SuperEagles&backgroundColor=047857',
  'wazito': 'https://api.dicebear.com/7.x/identicon/svg?seed=WazitoFC&backgroundColor=4f46e5',
  'wazito fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=WazitoFC&backgroundColor=4f46e5',
  'engineering': 'https://api.dicebear.com/7.x/identicon/svg?seed=EngineeringFC&backgroundColor=0284c7',
  'engineering fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=EngineeringFC&backgroundColor=0284c7',
  'engineering strikers': 'https://api.dicebear.com/7.x/identicon/svg?seed=EngineeringFC&backgroundColor=0284c7',
  'agriculture fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=AgricultureFC&backgroundColor=15803d',
  'njoro spurs': 'https://api.dicebear.com/7.x/identicon/svg?seed=NjoroSpurs&backgroundColor=e11d48',
  'science lions': 'https://api.dicebear.com/7.x/identicon/svg?seed=ScienceLions&backgroundColor=0369a1',
  'tatton united': 'https://api.dicebear.com/7.x/identicon/svg?seed=TattonUnited&backgroundColor=4338ca',
  'vet med warriors': 'https://api.dicebear.com/7.x/identicon/svg?seed=VetMedWarriors&backgroundColor=0f766e',

  // Championship Teams
  'aged fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=AgedFC&backgroundColor=b45309',
  'ajax fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=AjaxFC&backgroundColor=be123c',
  'tatton fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=TattonFC&backgroundColor=6d28d9',
  'talanta fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=TalantaFC&backgroundColor=0e7490',
  'rangers fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=RangersFC&backgroundColor=1d4ed8',
  'law fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=LawFC&backgroundColor=374151',
  'fass elites': 'https://api.dicebear.com/7.x/identicon/svg?seed=FassElites&backgroundColor=9d174d',
  'emsa fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=EmsaFC&backgroundColor=047857',
  'young legends': 'https://api.dicebear.com/7.x/identicon/svg?seed=YoungLegends&backgroundColor=c2410c',
  'young stars': 'https://api.dicebear.com/7.x/identicon/svg?seed=YoungStars&backgroundColor=ca8a04',
  'education stars': 'https://api.dicebear.com/7.x/identicon/svg?seed=EducationStars&backgroundColor=ca8a04',
  'health sciences fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=HealthSciences&backgroundColor=059669',
  'nakuru town campus fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=NakuruCampus&backgroundColor=2563eb',
  'veterinary academy fc': 'https://api.dicebear.com/7.x/identicon/svg?seed=VeterinaryAcademy&backgroundColor=0d9488',
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

/** Get dedicated team logo, ensuring no team is missing one */
export function getTeamLogo(teamNameOrId?: string | null): string {
  if (!teamNameOrId) {
    return 'https://api.dicebear.com/7.x/identicon/svg?seed=CampusFC&backgroundColor=1e293b';
  }
  const key = teamNameOrId.trim().toLowerCase();
  if (TEAM_LOGOS[key]) return TEAM_LOGOS[key];

  // Try substring match
  for (const [tKey, url] of Object.entries(TEAM_LOGOS)) {
    if (key.includes(tKey) || tKey.includes(key)) {
      return url;
    }
  }
  // Dedicated team crest fallback (never from the 20 user photos)
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(key)}&backgroundColor=0f172a`;
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
    avatarUrl = getTeamLogo(team || name);
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
