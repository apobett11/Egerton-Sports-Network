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
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
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

