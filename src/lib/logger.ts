import { classifyError, sanitizeErrorMessage } from './apiErrorHandler';
import { config } from './config';

export type LogLevel = 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  correlationId?: string;
  timestamp: string;
}

class ObservabilityLogger {
  private logBuffer: LogEntry[] = [];
  private maxBuffer = 150;
  private currentCorrelationId: string = this.generateId();

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public getCorrelationId(): string {
    return this.currentCorrelationId;
  }

  public setCorrelationId(id?: string): void {
    this.currentCorrelationId = id || this.generateId();
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;
    const sanitized = { ...context };
    const secretKeys = ['password', 'token', 'secret', 'auth', 'access_token', 'refresh_token', 'credit_card', 'apikey', 'key'];
    
    for (const key of Object.keys(sanitized)) {
      if (secretKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  private pushLog(entry: LogEntry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBuffer) {
      this.logBuffer.shift();
    }
  }

  info(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level: 'info',
      message,
      context: this.sanitizeContext(context),
      correlationId: this.currentCorrelationId,
      timestamp: new Date().toISOString(),
    };
    this.pushLog(entry);
    if (config.isDevelopment) {
      console.log(`[INFO] [${entry.correlationId}] ${entry.timestamp} - ${message}`, entry.context || '');
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level: 'warn',
      message,
      context: this.sanitizeContext(context),
      correlationId: this.currentCorrelationId,
      timestamp: new Date().toISOString(),
    };
    this.pushLog(entry);
    if (config.isDevelopment) {
      console.warn(`[WARN] [${entry.correlationId}] ${entry.timestamp} - ${message}`, entry.context || '');
    }
  }

  error(message: string, error?: unknown, context?: Record<string, any>): string {
    const classified = classifyError(error);
    const sanitizedMsg = sanitizeErrorMessage(message || classified.userMessage);

    const entry: LogEntry = {
      level: 'error',
      message: sanitizedMsg,
      context: {
        category: classified.category,
        statusCode: classified.statusCode,
        ...this.sanitizeContext(context),
      },
      correlationId: this.currentCorrelationId,
      timestamp: new Date().toISOString(),
    };

    this.pushLog(entry);
    if (config.isDevelopment) {
      console.error(`[ERROR] [${entry.correlationId}] ${entry.timestamp} - ${sanitizedMsg}`, classified);
    }

    return sanitizedMsg;
  }

  fatal(message: string, error?: unknown, context?: Record<string, any>): string {
    const classified = classifyError(error);
    const sanitizedMsg = sanitizeErrorMessage(message || classified.userMessage);

    const entry: LogEntry = {
      level: 'fatal',
      message: sanitizedMsg,
      context: {
        category: classified.category,
        statusCode: classified.statusCode,
        ...this.sanitizeContext(context),
      },
      correlationId: this.currentCorrelationId,
      timestamp: new Date().toISOString(),
    };

    this.pushLog(entry);
    if (config.isDevelopment) {
      console.error(`[FATAL ERROR] [${entry.correlationId}] ${entry.timestamp} - ${sanitizedMsg}`, classified);
    }

    return sanitizedMsg;
  }

  getRecentLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearLogs(): void {
    this.logBuffer = [];
  }
}

export const logger = new ObservabilityLogger();
