/**
 * Sentry Error Monitoring
 *
 * Initializes Sentry for production error tracking.
 * Call `initSentry()` once at app startup, before rendering.
 *
 * Requires VITE_SENTRY_DSN env var to be set.
 * In development, Sentry is disabled unless VITE_ENABLE_SENTRY_DEV=true.
 */
import * as Sentry from '@sentry/react';
import { logger } from './logger';

const DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const IS_DEV = import.meta.env.DEV;
const ENABLE_IN_DEV = import.meta.env.VITE_ENABLE_SENTRY_DEV === 'true';

/**
 * Initialize Sentry and connect it to the application logger.
 * Safe to call even without a DSN — it will silently skip initialization.
 */
export function initSentry(): void {
  // Skip if no DSN configured
  if (!DSN) {
    if (IS_DEV) {
      logger.debug('Sentry', 'No VITE_SENTRY_DSN configured, skipping initialization');
    }
    return;
  }

  // Skip in development unless explicitly enabled
  if (IS_DEV && !ENABLE_IN_DEV) {
    logger.debug('Sentry', 'Disabled in development (set VITE_ENABLE_SENTRY_DEV=true to enable)');
    return;
  }

  Sentry.init({
    dsn: DSN,
    release: `tac-portal@${APP_VERSION}`,
    environment: IS_DEV ? 'development' : 'production',

    // Sample 100% of errors, 10% of transactions in production
    sampleRate: 1.0,
    tracesSampleRate: IS_DEV ? 1.0 : 0.1,

    // Session replay for debugging (1% normal, 100% on error)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: IS_DEV ? 0 : 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      // Enrich Zod validation errors with schema details
      Sentry.zodErrorsIntegration(),
      // Capture console.error as breadcrumbs (not events)
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],

    // Don't send PII by default
    sendDefaultPii: false,

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Browser extensions
      /^ResizeObserver loop/,
      /^Non-Error promise rejection/,
      // Network errors (handled by retry logic)
      /^TypeError: Failed to fetch/,
      /^TypeError: NetworkError/,
      /^TypeError: Load failed/,
      // Auth redirects
      /^AbortError/,
      // Chunk loading (handled by vite:preloadError)
      /Loading chunk .* failed/,
      /dynamically imported module/,
    ],

    // Filter out noisy transactions
    beforeSendTransaction(event) {
      // Drop health-check pings
      if (event.transaction?.includes('/health')) return null;
      return event;
    },
  });

  // Wire Sentry into our structured logger
  logger.setErrorReporter((error, context) => {
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: context });
    } else {
      Sentry.captureMessage(String(error), { extra: context });
    }
  });

  logger.info('Sentry', 'Error monitoring initialized', {
    release: `tac-portal@${APP_VERSION}`,
    environment: IS_DEV ? 'development' : 'production',
  });
}
