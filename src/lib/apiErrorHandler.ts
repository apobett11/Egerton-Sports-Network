export type ErrorCategory =
  | 'UNAUTHORIZED' // 401
  | 'FORBIDDEN' // 403
  | 'NOT_FOUND' // 404
  | 'CONFLICT' // 409
  | 'VALIDATION' // 422
  | 'RATE_LIMITED' // 429
  | 'SERVER_ERROR' // 500/502/503
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'UNEXPECTED';

export interface AppError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  statusCode?: number;
  dbCode?: string;
  originalError?: unknown;
  timestamp: number;
}

export function classifyError(error: unknown): AppError {
  const timestamp = Date.now();

  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    return {
      category: 'OFFLINE',
      message: 'Network connection unavailable',
      userMessage: 'You appear to be offline. Please check your network connection and try again.',
      timestamp,
      originalError: error,
    };
  }

  if (error && typeof error === 'object') {
    const errObj = error as Record<string, any>;

    // Handle AbortError / Timeout
    if (errObj.name === 'AbortError' || errObj.message?.toLowerCase().includes('timeout')) {
      return {
        category: 'TIMEOUT',
        message: errObj.message || 'Request timed out',
        userMessage: 'The request took too long to complete. Please try again.',
        timestamp,
        originalError: error,
      };
    }

    const status = errObj.status || errObj.statusCode;
    const dbCode = errObj.code; // Postgres SQL state code (e.g. 23505, 42501)
    const rawMsg = errObj.message || errObj.error_description || String(error);

    // Postgres SQL state code mappings
    if (dbCode === '42501' || status === 403 || rawMsg.toLowerCase().includes('permission denied') || rawMsg.toLowerCase().includes('violates row-level security policy')) {
      return {
        category: 'FORBIDDEN',
        message: rawMsg,
        userMessage: 'You do not have permission to perform this action.',
        statusCode: 403,
        dbCode,
        timestamp,
        originalError: error,
      };
    }

    if (dbCode === '23505' || status === 409 || rawMsg.toLowerCase().includes('already exists') || rawMsg.toLowerCase().includes('duplicate key')) {
      return {
        category: 'CONFLICT',
        message: rawMsg,
        userMessage: 'This record already exists or conflicts with existing data.',
        statusCode: 409,
        dbCode,
        timestamp,
        originalError: error,
      };
    }

    if (dbCode === '23503' || status === 422 || rawMsg.toLowerCase().includes('foreign key constraint')) {
      return {
        category: 'VALIDATION',
        message: rawMsg,
        userMessage: 'Invalid reference or missing required related record.',
        statusCode: 422,
        dbCode,
        timestamp,
        originalError: error,
      };
    }

    if (status === 401 || rawMsg.toLowerCase().includes('unauthorized') || rawMsg.toLowerCase().includes('jwt expired')) {
      return {
        category: 'UNAUTHORIZED',
        message: rawMsg,
        userMessage: 'Your session has expired. Please sign in again.',
        statusCode: 401,
        dbCode,
        timestamp,
        originalError: error,
      };
    }

    if (status === 404 || rawMsg.toLowerCase().includes('not found')) {
      return {
        category: 'NOT_FOUND',
        message: rawMsg,
        userMessage: 'The requested resource could not be found.',
        statusCode: 404,
        dbCode,
        timestamp,
        originalError: error,
      };
    }

    if (status === 429 || rawMsg.toLowerCase().includes('too many requests') || rawMsg.toLowerCase().includes('rate limit')) {
      return {
        category: 'RATE_LIMITED',
        message: rawMsg,
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        statusCode: 429,
        dbCode,
        timestamp,
        originalError: error,
      };
    }

    if (typeof status === 'number' && status >= 500) {
      return {
        category: 'SERVER_ERROR',
        message: rawMsg,
        userMessage: 'A server error occurred. Please try again shortly.',
        statusCode: status,
        dbCode,
        timestamp,
        originalError: error,
      };
    }

    // Default object error
    return {
      category: 'UNEXPECTED',
      message: rawMsg,
      userMessage: sanitizeErrorMessage(rawMsg),
      statusCode: typeof status === 'number' ? status : undefined,
      dbCode,
      timestamp,
      originalError: error,
    };
  }

  const stringMsg = String(error || 'An unexpected error occurred');
  return {
    category: 'UNEXPECTED',
    message: stringMsg,
    userMessage: sanitizeErrorMessage(stringMsg),
    timestamp,
    originalError: error,
  };
}

/**
 * Ensures internal tech details (like database schemas or stack traces) are sanitized before displaying to users.
 */
export function sanitizeErrorMessage(rawMsg: string): string {
  if (!rawMsg) return 'An unexpected error occurred. Please try again.';
  if (rawMsg.includes('PGRST') || rawMsg.includes('postgres') || rawMsg.includes('relation') || rawMsg.includes('column')) {
    return 'Database query error. Please verify input data or contact administrator.';
  }
  if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
    return 'Unable to connect to service. Please check your internet connection.';
  }
  return rawMsg;
}
