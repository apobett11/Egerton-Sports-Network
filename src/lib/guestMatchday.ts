import { useSyncExternalStore } from 'react';
import { localDateKey, readPlaydayIndex, resolveGuestMatchdayDate } from './matchdayHelper';

const STORAGE_KEY = 'esn_selected_date';
const DATA_GENERATION = 'v6';
const GENERATION_KEY = 'esn_guest_data_generation';

function dropSkewedSessionDate(): void {
  try {
    if (sessionStorage.getItem(GENERATION_KEY) === DATA_GENERATION) return;
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem(GENERATION_KEY, DATA_GENERATION);
  } catch {
    // A blocked session store still misses the retired fixture cache.
  }
}

dropSkewedSessionDate();

function readInitial(): Date {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = new Date(saved);
      if (!isNaN(parsed.getTime())) {
        const key = localDateKey(parsed);
        const index = readPlaydayIndex();
        if (index.length === 0) {
          const day = parsed.getDay();
          if (day === 0 || day === 6) return parsed;
        } else if (index.some((mark) => mark.date === key)) {
          return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
        }
      }
    }
  } catch {
    // Session storage can be blocked. Fall through to the fixture calendar.
  }
  return resolveGuestMatchdayDate();
}

let current = readInitial();
const listeners = new Set<() => void>();

export function getGuestMatchday(): Date {
  return current;
}

/** One shared matchday for the guest shell. Does not re-render the rest of the page. */
export function setGuestMatchday(date: Date): void {
  if (localDateKey(current) === localDateKey(date)) return;
  current = date;
  try {
    sessionStorage.setItem(STORAGE_KEY, date.toISOString());
  } catch {
    // The in-memory day still moves.
  }
  listeners.forEach((fn) => {
    try { fn(); } catch { /* a listener must not block the chevron */ }
  });
}

export function subscribeGuestMatchday(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGuestMatchday(): Date {
  return useSyncExternalStore(subscribeGuestMatchday, getGuestMatchday, getGuestMatchday);
}
