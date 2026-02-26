import { z } from 'zod';

/**
 * Runtime validation of environment variables.
 * Validates all required env vars at app startup to fail fast.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_SENTRY_DSN: z
    .string()
    .url('VITE_SENTRY_DSN must be a valid URL')
    .optional()
    .or(z.literal('')),
  VITE_APP_VERSION: z.string().optional().default('1.0.0'),
  VITE_ENABLE_SENTRY_DEV: z.string().optional().default('false'),
  VITE_OPENROUTER_API_KEY: z.string().optional().or(z.literal('')),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed env object.
 * In development, missing vars produce warnings.
 * In production, missing required vars throw errors.
 */
export function validateEnv(): Env | null {
  const raw = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_ENABLE_SENTRY_DEV: import.meta.env.VITE_ENABLE_SENTRY_DEV,
    VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const message = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${(msgs ?? []).join(', ')}`)
      .join('\n');

    if (import.meta.env.PROD) {
      throw new Error(`[WGS Portal] Invalid environment configuration:\n${message}`);
    }

    console.warn(
      `[WGS Portal] Environment validation warnings:\n${message}\n` +
      'Some features may be unavailable in development.'
    );
    return null;
  }

  return result.data;
}
