import { useState, useCallback } from 'react';

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

  const [isInitializing] = useState<boolean>(false);

  const saveLocalPreference = useCallback((teamId: string | null) => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      localStorage.setItem(FAVORITE_TEAM_STORAGE_KEY, teamId === null ? 'null' : teamId);
    } catch (e) {
      console.warn('Unable to save local onboarding preference to localStorage:', e);
    }
    setCachedCompleted(true);
    setCachedTeamId(teamId);
  }, []);

  return {
    deviceId,
    setDeviceId,
    isInitializing,
    cachedCompleted,
    cachedTeamId,
    saveLocalPreference
  };
}
