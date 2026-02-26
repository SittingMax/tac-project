/**
 * Centralized API error handling and retry wrapper.
 * Wraps Supabase/API calls with retry logic and consistent error handling.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RetryOptions {
  /** Max number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms between retries (default: 1000) */
  baseDelay?: number;
  /** Whether to use exponential backoff (default: true) */
  exponentialBackoff?: boolean;
  /** HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  exponentialBackoff: true,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Wraps an async function with retry logic and exponential backoff.
 *
 * @example
 * ```ts
 * const data = await withRetry(() => supabase.from('shipments').select('*'));
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) break;

      // Check if error is retryable
      const status = (error as { status?: number })?.status;
      if (status && !opts.retryableStatuses.includes(status)) {
        break; // Non-retryable status — fail immediately
      }

      // Calculate delay with optional exponential backoff
      const delay = opts.exponentialBackoff
        ? opts.baseDelay * Math.pow(2, attempt)
        : opts.baseDelay;

      // Add jitter (±25%) to prevent thundering herd
      const jitter = delay * (0.75 + Math.random() * 0.5);

      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }

  throw lastError;
}

/**
 * Handles Supabase query results, converting errors to ApiError.
 *
 * @example
 * ```ts
 * const { data } = await handleSupabaseResult(
 *   supabase.from('shipments').select('*')
 * );
 * ```
 */
export async function handleSupabaseResult<T>(
  query: PromiseLike<{
    data: T | null;
    error: { message: string; code?: string; details?: string } | null;
  }>
): Promise<{ data: T }> {
  const { data, error } = await query;

  if (error) {
    throw new ApiError(error.message, error.code, undefined, error.details);
  }

  return { data: data as T };
}
