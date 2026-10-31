import React, { useEffect, useState, useRef } from 'react';

const VIGNETTE_ZONE = '11954979';
const VIGNETTE_SCRIPT_URL = 'https://n6wxm.com/vignette.min.js';
const DWELL_TIME_MS = 2500;       // 2.5 seconds auto-dismissal after new page load
const MAX_FALLBACK_MS = 5200;     // 5.2 seconds hard safety timeout
const VIGNETTE_INTERVAL_MS = 90 * 1000; // 1.5 minutes (90 seconds) interval
const LAST_VIGNETTE_TIME_KEY = 'esn_last_vignette_time';

// Paced Vignette Pacing: Exactly one every 1.5 minutes (90,000 ms)
export const isPacedVignetteTarget = (lastFiredTime: number, now: number): boolean => {
  return now - lastFiredTime >= VIGNETTE_INTERVAL_MS;
};

export const TransitionVignetteManager: React.FC = () => {
  // Syncing Live Matchday Feed banner and interval disabled per user request
  return null;
};

export default TransitionVignetteManager;
