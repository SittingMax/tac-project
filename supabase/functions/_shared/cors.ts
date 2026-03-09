// CORS configuration for Supabase Edge Functions
// In production, restrict to your actual domain(s)
const ALLOWED_ORIGINS = [
  'https://tac-cargo.vercel.app',
  'https://tac-cargo.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

// Backwards-compatible export for existing edge functions
// TODO: Migrate all edge functions to use getCorsHeaders(req) instead
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
