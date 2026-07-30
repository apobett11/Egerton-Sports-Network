import { useState, useCallback, useRef, useEffect } from 'react';
import { classifyError, type AppError } from '../lib/apiErrorHandler';
import { executeWithRetry, type RetryOptions } from '../lib/retryPolicy';

export interface AsyncRequestState<T> {
  data: T | null;
  isLoading: boolean;
  isRetrying: boolean;
  error: AppError | null;
}

export interface UseAsyncRequestOptions<T> extends RetryOptions {
  timeoutMs?: number;
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  enableAutoRetry?: boolean;
}

export function useAsyncRequest<T, Args extends any[] = any[]>(
  requestFn: (signal: AbortSignal, ...args: Args) => Promise<T>,
  options: UseAsyncRequestOptions<T> = {}
) {
  const [state, setState] = useState<AsyncRequestState<T>>({
    data: options.initialData ?? null,
    isLoading: false,
    isRetrying: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const lastArgsRef = useRef<Args | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, isLoading: false, isRetrying: false }));
    }
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      lastArgsRef.current = args;

      // Abort any active prior request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Configure timeout timer if specified
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      if (options.timeoutMs && options.timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          controller.abort();
        }, options.timeoutMs);
      }

      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      }

      try {
        const result = options.enableAutoRetry !== false
          ? await executeWithRetry(
              (signal) => requestFn(signal || controller.signal, ...args),
              options
            )
          : await requestFn(controller.signal, ...args);

        if (timeoutId) clearTimeout(timeoutId);

        if (isMountedRef.current) {
          setState({
            data: result,
            isLoading: false,
            isRetrying: false,
            error: null,
          });
          options.onSuccess?.(result);
        }
        return result;
      } catch (rawError) {
        if (timeoutId) clearTimeout(timeoutId);
        const classified = classifyError(rawError);

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isRetrying: false,
            error: classified,
          }));
          options.onError?.(classified);
        }
        return null;
      }
    },
    [requestFn, options]
  );

  const retry = useCallback(async (): Promise<T | null> => {
    if (!lastArgsRef.current) return null;
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, isRetrying: true }));
    }
    return execute(...lastArgsRef.current);
  }, [execute]);

  return {
    ...state,
    execute,
    retry,
    cancel,
  };
}
