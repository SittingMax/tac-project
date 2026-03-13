/**
 * Application Logger
 * Centralized logging with Sentry integration hook.
 * DEV-only logging for debug/info, always logs warn/error.
 * All production console.error/warn calls should route through this.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  meta?: Record<string, unknown>;
}

type ErrorReporter = (error: Error | string, context?: Record<string, unknown>) => void;

const isDev = import.meta.env.DEV;
const MAX_LOG_BUFFER = 500;

class Logger {
  private logs: LogEntry[] = [];
  private errorReporter: ErrorReporter | null = null;

  /**
   * Attach an external error reporter (e.g., Sentry).
   * Call this once at app startup when Sentry is initialized.
   *
   * @example
   * import * as Sentry from '@sentry/react';
   * logger.setErrorReporter((error, ctx) => {
   *   if (error instanceof Error) Sentry.captureException(error, { extra: ctx });
   *   else Sentry.captureMessage(error, { extra: ctx });
   * });
   */
  setErrorReporter(reporter: ErrorReporter): void {
    this.errorReporter = reporter;
  }

  private log(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      meta,
    };

    // Circular buffer to prevent memory leaks
    if (this.logs.length >= MAX_LOG_BUFFER) {
      this.logs.shift();
    }
    this.logs.push(entry);

    // Only log debug/info in DEV mode to avoid console spam in production
    if ((level === 'debug' || level === 'info') && !isDev) {
      return;
    }

    const style = {
      info: 'color: #22d3ee',
      warn: 'color: #facc15',
      error: 'color: #ef4444',
      debug: 'color: #94a3b8',
    };

    const prefix = context ? `[${context}] ` : '';

    // eslint-disable-next-line no-console
    console.log(`%c[${level.toUpperCase()}] ${prefix}${message}`, style[level], meta || '');

    // Forward errors and warnings to external reporter in production
    if ((level === 'error' || level === 'warn') && this.errorReporter && !isDev) {
      this.errorReporter(`${prefix}${message}`, { level, ...meta });
    }
  }

  info(context: string, message: string, meta?: Record<string, unknown>) {
    this.log('info', context, message, meta);
  }

  warn(context: string, message: string, meta?: Record<string, unknown>) {
    this.log('warn', context, message, meta);
  }

  error(context: string, message: string, meta?: Record<string, unknown>) {
    this.log('error', context, message, meta);
  }

  debug(context: string, message: string, meta?: Record<string, unknown>) {
    this.log('debug', context, message, meta);
  }

  /**
   * Capture an Error object with full stack trace.
   * Forwards to Sentry if configured.
   */
  captureError(context: string, error: unknown, meta?: Record<string, unknown>) {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log('error', context, err.message, { ...meta, stack: err.stack });

    if (this.errorReporter && !isDev) {
      this.errorReporter(err, { context, ...meta });
    }
  }

  getLogs(): readonly LogEntry[] {
    return this.logs;
  }

  /**
   * Get recent logs for crash reports / debugging
   */
  getRecentLogs(count = 50): readonly LogEntry[] {
    return this.logs.slice(-count);
  }
}

export const logger = new Logger();
