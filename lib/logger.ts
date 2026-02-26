/**
 * Application Logger
 * DEV-only logging for debug/info, always logs warn/error
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

const isDev = import.meta.env.DEV;

class Logger {
  private logs: LogEntry[] = [];

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };
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

    // eslint-disable-next-line no-console
    console.log(`%c[${level.toUpperCase()}] ${message}`, style[level], meta || '');
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }
  warn(message: string, meta?: Record<string, unknown>) {
    this.log('warn', message, meta);
  }
  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
  }
  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta);
  }

  getLogs() {
    return this.logs;
  }
}

export const logger = new Logger();
