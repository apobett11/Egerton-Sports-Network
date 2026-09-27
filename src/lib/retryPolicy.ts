import { classifyError, type AppError } from './apiErrorHandler';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
  shouldRetry?: (error: AppError, attempt: number) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxRetries: 2,
  initialDelayMs: 1000,
  maxDelayMs: 3000,
  backoffFactor: 3,
  timeoutMs: 10000,
};

const RETRY_DELAYS_MS = [1000, 3000];

export function isRetryableError(error: AppError): boolean {
  // Never retry validation, authorization, forbidden, conflict, or not found errors
  if (['VALIDATION', 'UNAUTHORIZED', 'FORBIDDEN', 'CONFLICT', 'NOT_FOUND'].includes(error.category)) {
    return false;
  }
  // Always retry transient errors: OFFLINE (when network recovers), TIMEOUT, SERVER_ERROR, RATE_LIMITED
  return true;
}

export async function executeWithRetry<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_RETRY_OPTIONS.maxRetries;
  const maxDelay = options.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs;
  const timeoutMs = options.timeoutMs ?? DEFAULT_RETRY_OPTIONS.timeoutMs;
  const customShouldRetry = options.shouldRetry;

  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      const classified = classifyError(err);

      const canRetry = customShouldRetry 
        ? customShouldRetry(classified, attempt) 
        : isRetryableError(classified);

      if (
        classified.message.includes('circuit_open') ||
        classified.message.includes('Temporarily paused')
      ) {
        throw classified;
      }

      if (attempt > maxRetries || !canRetry) {
        throw classified;
      }

      const scheduled = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
      const jitter = Math.floor(Math.random() * 150);
      const delay = Math.min(scheduled + jitter, maxDelay);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
