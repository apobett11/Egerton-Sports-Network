import { useState, useEffect, useMemo } from 'react';

export type UrgencyLevel = 'NORMAL' | 'ELEVATED' | 'CORTISOL_SPIKE' | 'LOCKED';

export interface UrgencyTimerResult {
  timeRemainingMs: number;
  hours: string;
  minutes: string;
  seconds: string;
  milliseconds: string;
  formattedCountdown: string;
  isUnder15Mins: boolean;
  isCortisolSpike: boolean;
  isLocked: boolean;
  urgencyLevel: UrgencyLevel;
  progressPercent: number; // 0 to 100 representing urgency depletion
}

/**
 * Project Stark: useUrgencyTimer
 * Manages the time-gated "Predict the XI" squad builder UI.
 * Calculates exact milliseconds until kickoff and triggers a visual cortisol-spike warning
 * (e.g., flashing red alert) when under 15 minutes.
 */
export function useUrgencyTimer(targetKickoffTime: Date | string | number): UrgencyTimerResult {
  const targetMs = useMemo(() => {
    return new Date(targetKickoffTime).getTime();
  }, [targetKickoffTime]);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    // High-frequency tick (every 50ms) for ultra-accurate millisecond countdown
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const timeRemainingMs = Math.max(0, targetMs - nowMs);
  const isLocked = timeRemainingMs <= 0;

  const totalSeconds = Math.floor(timeRemainingMs / 1000);
  const hoursNum = Math.floor(totalSeconds / 3600);
  const minutesNum = Math.floor((totalSeconds % 3600) / 60);
  const secondsNum = totalSeconds % 60;
  const msNum = Math.floor((timeRemainingMs % 1000) / 10); // 2-digit ms

  const hours = String(hoursNum).padStart(2, '0');
  const minutes = String(minutesNum).padStart(2, '0');
  const seconds = String(secondsNum).padStart(2, '0');
  const milliseconds = String(msNum).padStart(2, '0');

  const formattedCountdown = isLocked
    ? '00:00:00.00'
    : `${hours}:${minutes}:${seconds}.${milliseconds}`;

  const FIFTEEN_MINS_MS = 15 * 60 * 1000;
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const isUnder15Mins = timeRemainingMs > 0 && timeRemainingMs <= FIFTEEN_MINS_MS;
  const isCortisolSpike = isUnder15Mins;

  let urgencyLevel: UrgencyLevel = 'NORMAL';
  if (isLocked) {
    urgencyLevel = 'LOCKED';
  } else if (isUnder15Mins) {
    urgencyLevel = 'CORTISOL_SPIKE';
  } else if (timeRemainingMs <= ONE_HOUR_MS) {
    urgencyLevel = 'ELEVATED';
  }

  // Progress percentage (100% when > 1hr remaining, drops down to 0% at kickoff)
  const progressPercent = Math.min(
    100,
    Math.max(0, (timeRemainingMs / (24 * 60 * 60 * 1000)) * 100)
  );

  return {
    timeRemainingMs,
    hours,
    minutes,
    seconds,
    milliseconds,
    formattedCountdown,
    isUnder15Mins,
    isCortisolSpike,
    isLocked,
    urgencyLevel,
    progressPercent,
  };
}

export default useUrgencyTimer;
