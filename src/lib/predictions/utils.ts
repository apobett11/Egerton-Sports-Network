export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatKickoffTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[d.getDay()];
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) {
      const m = Math.floor(diffSec / 60);
      return `${m}m ago`;
    }
    if (diffSec < 86400) {
      const h = Math.floor(diffSec / 3600);
      return `${h}h ago`;
    }
    const days = Math.floor(diffSec / 86400);
    if (days < 30) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } catch {
    return 'Recently';
  }
}

/**
 * Format team tag:
 * - Single name team (e.g. "Legends FC", "Wazito", "Santos FC") -> keep as is (e.g. "Legends FC", "Wazito")
 * - Double / multi-named team (e.g. "Super Eagles FC", "Health Sciences FC", "Nakuru Town Campus FC") -> names only, no FC!
 * - Never appends redundant "team" or "Team" word.
 */
export function formatTeamTag(rawName: string): string {
  if (!rawName) return '';
  let clean = rawName.trim();
  // Strip redundant "team" suffix if someone typed "Legends FC team" or "Wazito team"
  clean = clean.replace(/\s+teams?$/i, '').trim();

  // Strip FC / SC / Club at end to count root words
  const withoutFc = clean.replace(/\s+(FC|SC|Club)$/i, '').trim();
  const words = withoutFc.split(/\s+/).filter(Boolean);

  // For double or multi-named teams, place the names only (no FC)
  if (words.length >= 2) {
    return words.join(' ');
  }

  // Single named team (e.g. "Wazito" or "Legends FC" or "Santos FC")
  return clean;
}

/**
 * Formats a match tag between two teams according to the above configuration
 * e.g. "Santos FC vs BCOM FC" -> "@Santos FC vs @BCOM FC"
 * e.g. "Super Eagles FC vs Wazito FC" -> "@Super Eagles vs @Wazito FC"
 */
export function formatMatchTag(rawMatch: string): string {
  if (!rawMatch) return '';
  const clean = rawMatch.replace(/^@/, '').trim();
  const separator = clean.includes(' vs ') ? ' vs ' : clean.includes(' v ') ? ' v ' : ' - ';
  if (clean.includes(separator)) {
    const [teamA, teamB] = clean.split(separator);
    const tagA = formatTeamTag(teamA);
    const tagB = formatTeamTag(teamB);
    return `@${tagA} vs @${tagB}`;
  }
  return `@${formatTeamTag(clean)}`;
}

/**
 * Deterministic clean message identifier for browser links, top bar, and sharing.
 * Never exposes database UUIDs or internal UIDs.
 */
export function getCleanMessageRef(postOrId: { id?: string; createdAt?: string } | string): string {
  const rawId = typeof postOrId === 'string' ? postOrId : (postOrId?.id || '');
  if (!rawId) return 'msg-1';

  // Seeded / clean posts like "post-seed-01" -> "msg-1"
  const seedMatch = rawId.match(/^(?:post-)?seed-0*(\d+)/i);
  if (seedMatch) {
    return `msg-${seedMatch[1]}`;
  }
  const cleanMatch = rawId.match(/^msg-(\d+)/i);
  if (cleanMatch) {
    return `msg-${cleanMatch[1]}`;
  }

  // If already a short clean ref, keep it
  if (!rawId.includes('-') && rawId.length <= 8) {
    return `msg-${rawId}`;
  }

  // For UUIDs, generate a deterministic, friendly message number (e.g. msg-1042)
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash * 31 + rawId.charCodeAt(i)) & 0xffffffff;
  }
  const msgNum = (Math.abs(hash) % 9000) + 1000;
  return `msg-${msgNum}`;
}

export interface CountdownResult {
  isLocked: boolean;
  formatted: string;
  hours: number;
  minutes: number;
  seconds: number;
}

export function calculateCountdown(scheduledTimeStr: string): CountdownResult {
  const target = new Date(scheduledTimeStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return {
      isLocked: true,
      formatted: '00:00:00 (LOCKED)',
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    isLocked: false,
    formatted,
    hours,
    minutes,
    seconds
  };
}

// Local cache stays off. The slip and the club live on the device row in the database.
const PERSIST_SESSION = false;

export function getStoredItem<T>(_key: string, defaultValue: T): T {
  if (!PERSIST_SESSION) return defaultValue;
  try {
    const val = localStorage.getItem(_key);
    if (!val) return defaultValue;
    return JSON.parse(val);
  } catch {
    return defaultValue;
  }
}

export function setStoredItem<T>(key: string, value: T): void {
  if (!PERSIST_SESSION) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode
  }
}

export function clearStoredSession(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('egerscore_')) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // private mode
  }
}

/**
 * Format team display name:
 * - Single name teams alongside FC:
 *   e.g. "Legends FC" -> "Legends FC", "Santos FC" -> "Santos FC", "Law FC" -> "Law FC", "BCOM FC" -> "BCOM FC"
 * - Double name teams: initial of first name, full second name, alongside FC:
 *   e.g. "Super Eagles" -> "S. Eagles FC", "Mighty Blacks" -> "M. Blacks FC",
 *        "Blue Blazers" -> "B. Blazers FC", "Spartans United" -> "S. United FC", "FASS Elites" -> "F. Elites FC"
 */
export function formatTeamName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (lower === 'draw' || lower === 'home' || lower === 'away') {
    return trimmed;
  }

  // Remove existing trailing "FC" or "F.C." (case-insensitive) to normalize
  const withoutFC = trimmed.replace(/\s+F\.?C\.?$/i, '').trim();
  const words = withoutFC.split(/\s+/).filter(Boolean);

  if (words.length === 0) return trimmed;

  const cap = (s: string) => {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  if (words.length === 1) {
    // Single name team alongside FC
    return `${cap(words[0])} FC`;
  }

  // Double / Multi-word team:
  // Initial of first name, full second name (and rest), alongside FC
  const firstLetter = words[0].charAt(0).toUpperCase();
  const rest = words.slice(1).map(cap).join(' ');

  return `${firstLetter}. ${rest} FC`;
}

