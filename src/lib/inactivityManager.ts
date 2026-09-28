// ============================================================================
// INACTIVITY & VISIBILITY MANAGER
// Monitors user engagement (mouse, keyboard, touch, tab visibility).
// Disconnects / suspends idle background operations to protect quota.
// ============================================================================

import { useState, useEffect } from 'react';

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

let lastActivityTime = Date.now();
let isListening = false;
const listeners = new Set<(isActive: boolean) => void>();

function updateActivity() {
  lastActivityTime = Date.now();
  notifyListeners(true);
}

function notifyListeners(isActive: boolean) {
  listeners.forEach((callback) => {
    try {
      callback(isActive);
    } catch {}
  });
}

function initActivityListeners() {
  if (isListening || typeof window === 'undefined') return;
  isListening = true;

  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach((event) => {
    window.addEventListener(event, updateActivity, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      notifyListeners(false);
    } else {
      updateActivity();
    }
  });

  // Background check for idle timeout
  setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) {
      notifyListeners(false);
      return;
    }
    const idleTime = Date.now() - lastActivityTime;
    if (idleTime > INACTIVITY_TIMEOUT_MS) {
      notifyListeners(false);
    }
  }, 15000);
}

export function isSessionActive(): boolean {
  if (typeof document !== 'undefined' && document.hidden) {
    return false;
  }
  return Date.now() - lastActivityTime <= INACTIVITY_TIMEOUT_MS;
}

export function subscribeToActivity(callback: (isActive: boolean) => void): () => void {
  initActivityListeners();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useInactivityStatus(timeoutMs = INACTIVITY_TIMEOUT_MS): boolean {
  const [isActive, setIsActive] = useState(() => isSessionActive());

  useEffect(() => {
    initActivityListeners();

    const handler = (active: boolean) => {
      setIsActive(active);
    };

    const unsubscribe = subscribeToActivity(handler);
    return () => {
      unsubscribe();
    };
  }, [timeoutMs]);

  return isActive;
}
