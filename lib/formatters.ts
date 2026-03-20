/**
 * formatters.ts
 *
 * Centralized formatting utilities using Intl APIs as per Vercel Web Interface Guidelines.
 * Avoids hardcoded date formats and provides robust i18n support.
 */

// Default locale - can be extended to use navigator.languages or user settings
const DEFAULT_LOCALE = 'en-IN';

/**
 * Format a date to a standard string representation (e.g., DD/MM/YYYY)
 */
export const formatDate = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

/**
 * Format a date to a short string representation (e.g., MMM DD)
 */
export const formatDateShort = (date: Date | string | number, locale: string = 'en-US'): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(d);
};

/**
 * Format a date with the weekday (e.g., Monday)
 */
export const formatWeekday = (date: Date | string | number, locale: string = 'en-US'): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
  }).format(d);
};

/**
 * Format a date to a full string representation including time (e.g., DD/MM/YYYY, HH:MM AM/PM)
 */
export const formatDateTime = (
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};
