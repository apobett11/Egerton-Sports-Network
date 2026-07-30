import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseSubmitLockOptions {
  debounceMs?: number;
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}

export function useSubmitLock<T = void, Args extends any[] = any[]>(
  submitFn: (...args: Args) => Promise<T>,
  options: UseSubmitLockOptions = {}
) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isPendingRef = useRef<boolean>(false);
  const lastSubmitTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const executeSubmit = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      const now = Date.now();
      const minInterval = options.debounceMs ?? 600;

      // Prevent execution if already submitting or if double clicked within debounce threshold
      if (isPendingRef.current || isSubmitting || now - lastSubmitTimeRef.current < minInterval) {
        console.warn('Double submission blocked by useSubmitLock guard');
        return undefined;
      }

      isPendingRef.current = true;
      lastSubmitTimeRef.current = now;
      if (isMountedRef.current) {
        setIsSubmitting(true);
      }

      try {
        const result = await submitFn(...args);
        options.onSuccess?.();
        return result;
      } catch (err) {
        options.onError?.(err);
        throw err;
      } finally {
        isPendingRef.current = false;
        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [submitFn, isSubmitting, options]
  );

  return {
    executeSubmit,
    isSubmitting,
    disabled: isSubmitting,
  };
}
