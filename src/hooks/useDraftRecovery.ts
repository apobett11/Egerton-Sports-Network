import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseDraftRecoveryOptions<T> {
  key: string;
  debounceMs?: number;
  enabled?: boolean;
}

export function useDraftRecovery<T extends Record<string, any>>(
  initialValue: T,
  options: UseDraftRecoveryOptions<T>
) {
  const { key, debounceMs = 500, enabled = true } = options;
  const storageKey = `draft_${key}`;

  const [value, setValue] = useState<T>(() => {
    if (!enabled || typeof window === 'undefined') return initialValue;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialValue, ...parsed.data };
      }
    } catch (err) {
      console.warn('Failed to recover draft:', err);
    }
    return initialValue;
  });

  const [hasRecoveredDraft, setHasRecoveredDraft] = useState<boolean>(() => {
    if (!enabled || typeof window === 'undefined') return false;
    try {
      return !!localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            data: value,
            updatedAt: Date.now(),
          })
        );
      } catch (err) {
        console.warn('Failed to auto-save draft:', err);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, storageKey, debounceMs, enabled]);

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
        setHasRecoveredDraft(false);
      } catch (err) {
        console.warn('Failed to clear draft:', err);
      }
    }
  }, [storageKey]);

  const resetForm = useCallback(
    (newValue?: T) => {
      const resetState = newValue || initialValue;
      setValue(resetState);
      clearDraft();
    },
    [initialValue, clearDraft]
  );

  return {
    value,
    setValue,
    hasRecoveredDraft,
    clearDraft,
    resetForm,
  };
}
