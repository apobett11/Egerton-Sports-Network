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
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffFactor: 2,
  timeoutMs: 10000, // 10s default timeout
};

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
  const initialDelay = options.initialDelayMs ?? DEFAULT_RETRY_OPTIONS.initialDelayMs;
  const maxDelay = options.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs;
  const factor = options.backoffFactor ?? DEFAULT_RETRY_OPTIONS.backoffFactor;
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

      if (attempt > maxRetries || !canRetry) {
        throw classified;
      }

      // Calculate exponential backoff delay with jitter
      const exponentialDelay = initialDelay * Math.pow(factor, attempt - 1);
      const jitter = Math.random() * 200;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
