import { useState, useCallback, useEffect } from 'react';
import { DeviceService } from '../services/DeviceService';
import { generateUUID, resolveDeviceIdentity } from '../lib/deviceCopies';

const ONBOARDING_STORAGE_KEY = 'esn_onboarding_completed';
const FAVORITE_TEAM_STORAGE_KEY = 'esn_favorite_team_id';

export { generateUUID };

export function useDeviceIdentity() {
  const [deviceId, setDeviceIdState] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [cachedCompleted, setCachedCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [cachedTeamId, setCachedTeamId] = useState<string | null>(() => {
    try {
      const favTeam = localStorage.getItem(FAVORITE_TEAM_STORAGE_KEY);
      if (favTeam === null || favTeam === 'null' || favTeam === '') return null;
      return favTeam;
    } catch {
      return null;
    }
  });

  const [deviceFavorites, setDeviceFavorites] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    resolveDeviceIdentity().then((resolved) => {
      if (cancelled) return;
      setDeviceIdState(resolved.deviceId);
      setIsInitializing(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onLocked = (event: Event) => {
      const detail = (event as CustomEvent<{ teamId: string | null; label?: string | null }>).detail;
      if (!detail) return;
      setCachedCompleted(true);
      if (detail.teamId) setCachedTeamId(detail.teamId);
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        if (detail.teamId) localStorage.setItem(FAVORITE_TEAM_STORAGE_KEY, detail.teamId);
      } catch {
        // The server row is the lock. This copy is only a hint for the next paint.
      }
    };
    window.addEventListener('esn-favorite-team-locked', onLocked);
    return () => window.removeEventListener('esn-favorite-team-locked', onLocked);
  }, []);

  useEffect(() => {
    if (!deviceId || isInitializing) return;
    let cancelled = false;
    DeviceService.getFavoriteMatches(deviceId).then((matches) => {
      if (cancelled || !Array.isArray(matches)) return;
      setDeviceFavorites(matches);
      try {
        localStorage.setItem(`esn_device_favorites_${deviceId}`, JSON.stringify(matches));
      } catch {
        // Server list already won.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [deviceId, isInitializing]);

  const toggleDeviceFavorite = useCallback(async (matchId: string): Promise<boolean> => {
    if (!matchId || !deviceId) return false;
    const isAdding = !deviceFavorites.includes(matchId);
    const nextList = isAdding
      ? Array.from(new Set([...deviceFavorites, matchId]))
      : deviceFavorites.filter((id) => id !== matchId);
    setDeviceFavorites(nextList);
    const saved = await DeviceService.setFavoriteMatches(deviceId, nextList);
    setDeviceFavorites(saved);
    return saved.includes(matchId);
  }, [deviceId, deviceFavorites]);

  const saveLocalPreference = useCallback((teamId: string | null) => {
    if (cachedTeamId && teamId && teamId !== cachedTeamId) return;
    if (cachedTeamId && !teamId) return;
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      localStorage.setItem(FAVORITE_TEAM_STORAGE_KEY, teamId === null ? 'null' : teamId);
    } catch (e) {
      console.warn('Unable to save local onboarding preference to localStorage:', e);
    }
    setCachedCompleted(true);
    setCachedTeamId(teamId);
    if (deviceId && teamId) {
      DeviceService.completeOnboarding(deviceId, teamId);
    }
  }, [deviceId, cachedTeamId]);

  return {
    deviceId,
    isInitializing,
    cachedCompleted,
    cachedTeamId,
    deviceFavorites,
    setDeviceFavorites,
    toggleDeviceFavorite,
    saveLocalPreference
  };
}
