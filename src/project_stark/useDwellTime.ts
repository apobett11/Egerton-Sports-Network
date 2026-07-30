import { useState, useEffect, useRef, useCallback } from 'react';

export interface DwellAnalyticsData {
  deviceId: string;
  totalDwellSeconds: Record<string, number>; // teamId -> seconds
  lastUpdated: string;
  consentGranted: boolean;
}

const DWELL_STORAGE_KEY = 'esn_dwell_analytics';
const DEVICE_ID_KEY = 'esn_device_id';
const CONSENT_KEY = 'esn_tracking_consent';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'Device_SERVER';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `Device_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function useDwellTime(initialTeamId?: string) {
  const [activeTeamId, setActiveTeamId] = useState<string | null>(initialTeamId || null);
  const [activeDwellSeconds, setActiveDwellSeconds] = useState<number>(0);
  const [dwellStats, setDwellStats] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(DWELL_STORAGE_KEY);
      if (saved) {
        const parsed: DwellAnalyticsData = JSON.parse(saved);
        return parsed.totalDwellSeconds || {};
      }
    } catch (e) {
      console.warn('Failed to parse dwell stats from localStorage', e);
    }
    return {};
  });

  const [hasConsent, setHasConsent] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent === null ? true : consent === 'true'; // Default true for pseudonymous tracking
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeTeamRef = useRef<string | null>(activeTeamId);
  activeTeamRef.current = activeTeamId;

  // Persist updated stats silently to localStorage
  const saveStats = useCallback((updatedStats: Record<string, number>) => {
    if (typeof window === 'undefined' || !hasConsent) return;
    try {
      const deviceId = getOrCreateDeviceId();
      const payload: DwellAnalyticsData = {
        deviceId,
        totalDwellSeconds: updatedStats,
        lastUpdated: new Date().toISOString(),
        consentGranted: hasConsent,
      };
      localStorage.setItem(DWELL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save dwell analytics', e);
    }
  }, [hasConsent]);

  // Start tracking a specific team
  const startTracking = useCallback((teamId: string) => {
    if (activeTeamRef.current === teamId) return;

    // Stop current timer if running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setActiveTeamId(teamId);
    setActiveDwellSeconds(0);

    timerRef.current = setInterval(() => {
      setActiveDwellSeconds((prev) => {
        const next = prev + 1;
        // Increment global dwell stats state
        setDwellStats((prevStats) => {
          const currentTotal = prevStats[teamId] || 0;
          const newStats = { ...prevStats, [teamId]: currentTotal + 1 };
          saveStats(newStats);
          return newStats;
        });
        return next;
      });
    }, 1000);
  }, [saveStats]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setActiveTeamId(null);
    setActiveDwellSeconds(0);
  }, []);

  // Cleanup on unmount or active team change
  useEffect(() => {
    if (initialTeamId) {
      startTracking(initialTeamId);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initialTeamId, startTracking]);

  // Find top curated team based on highest dwell time
  const topCuratedTeam = Object.entries(dwellStats).reduce<{ teamId: string; seconds: number } | null>(
    (acc, [teamId, seconds]) => {
      if (!acc || seconds > acc.seconds) {
        return { teamId, seconds };
      }
      return acc;
    },
    null
  )?.teamId || null;

  // "Right to be Forgotten" - Clear user data
  const resetDwellData = useCallback(() => {
    stopTracking();
    setDwellStats({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DWELL_STORAGE_KEY);
    }
  }, [stopTracking]);

  const updateConsent = useCallback((granted: boolean) => {
    setHasConsent(granted);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSENT_KEY, String(granted));
      if (!granted) {
        resetDwellData();
      }
    }
  }, [resetDwellData]);

  return {
    activeTeamId,
    activeDwellSeconds,
    dwellStats,
    topCuratedTeam,
    hasConsent,
    deviceId: getOrCreateDeviceId(),
    startTracking,
    stopTracking,
    resetDwellData,
    updateConsent,
  };
}

export default useDwellTime;
