import { useState, useCallback, useEffect } from 'react';
import { DeviceService } from '../services/DeviceService';

const DEVICE_STORAGE_KEY = 'esn_device_id';
const ONBOARDING_STORAGE_KEY = 'esn_onboarding_completed';
const FAVORITE_TEAM_STORAGE_KEY = 'esn_favorite_team_id';

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

export function useDeviceIdentity() {
  const [deviceId, setDeviceId] = useState<string>(() => {
    try {
      let id = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (!id) {
        id = generateUUID();
        localStorage.setItem(DEVICE_STORAGE_KEY, id);
      }
      return id;
    } catch {
      return generateUUID();
    }
  });

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
      if (favTeam === null || favTeam === 'null') return null;
      return favTeam;
    } catch {
      return null;
    }
  });

  const [deviceFavorites, setDeviceFavorites] = useState<string[]>(() => {
    try {
      const devId = localStorage.getItem(DEVICE_STORAGE_KEY) || deviceId;
      const localKey = `esn_device_favorites_${devId}`;
      const saved = localStorage.getItem(localKey) || localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isInitializing] = useState<boolean>(false);

  // Sync favorites from anonymous device record in background
  useEffect(() => {
    if (!deviceId) return;
    DeviceService.getFavoriteMatches(deviceId).then((matches) => {
      if (matches && Array.isArray(matches)) {
        setDeviceFavorites((prev) => {
          const merged = Array.from(new Set([...prev, ...matches]));
          try {
            localStorage.setItem(`esn_device_favorites_${deviceId}`, JSON.stringify(merged));
            localStorage.setItem('favorites', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });
  }, [deviceId]);

  const toggleDeviceFavorite = useCallback(async (matchId: string): Promise<boolean> => {
    if (!matchId) return false;

    const localKey = `esn_device_favorites_${deviceId}`;
    let current = deviceFavorites;
    try {
      const stored = localStorage.getItem(localKey) || localStorage.getItem('favorites');
      if (stored) {
        current = JSON.parse(stored);
      }
    } catch {}

    const isFav = current.includes(matchId);
    const isAdding = !isFav;
    const nextList = isFav
      ? current.filter((id) => id !== matchId)
      : Array.from(new Set([...current, matchId]));

    setDeviceFavorites(nextList);

    try {
      localStorage.setItem(localKey, JSON.stringify(nextList));
      localStorage.setItem('favorites', JSON.stringify(nextList));
    } catch {}

    if (deviceId) {
      DeviceService.setFavoriteMatches(deviceId, nextList);
    }

    return isAdding;
  }, [deviceId, deviceFavorites]);

  const saveLocalPreference = useCallback((teamId: string | null) => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      localStorage.setItem(FAVORITE_TEAM_STORAGE_KEY, teamId === null ? 'null' : teamId);
    } catch (e) {
      console.warn('Unable to save local onboarding preference to localStorage:', e);
    }
    setCachedCompleted(true);
    setCachedTeamId(teamId);
    if (deviceId) {
      DeviceService.completeOnboarding(deviceId, teamId);
    }
  }, [deviceId]);

  return {
    deviceId,
    setDeviceId,
    isInitializing,
    cachedCompleted,
    cachedTeamId,
    deviceFavorites,
    setDeviceFavorites,
    toggleDeviceFavorite,
    saveLocalPreference
  };
}

