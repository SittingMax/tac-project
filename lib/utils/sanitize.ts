/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 * Based on tac-code-reviewer security requirements
 *
 * SECURITY NOTE: Pure Node-safe implementation without DOM dependencies.
 * Uses single-character replacement to avoid CodeQL js/incomplete-multi-character-sanitization.
 * All functions are deterministic and safe for unit testing.
 */

/**
 * Escape HTML special characters to prevent XSS
 * Single-pass replacement - safe and deterministic
 */
export function escapeHtml(str: string): string {
  if (!str) return '';

  // Single-character replacements only - no multi-character patterns
  // Order matters: & must be first to avoid double-escaping
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strip HTML tags from string - pure Node-safe implementation
 * Returns plain text content only - no HTML allowed
 *
 * SECURITY: Uses iterative tag removal + unconditional bracket stripping.
 * This approach is safe because:
 * 1. Iteratively removes tag patterns until stable (handles nested attacks)
 * 2. Final step removes ALL remaining angle brackets unconditionally
 * 3. Bounded iterations prevent infinite loops
 * 4. Pure function - no DOM/window dependency
 *
 * CodeQL Note: The regex pattern on line ~59 is flagged as "incomplete multi-character
 * sanitization" but this is a FALSE POSITIVE because:
 * - The final cleanup (line ~67) removes ALL < and > unconditionally
 * - Even if the iterative approach misses something, no angle brackets survive
 */
export function stripHtml(str: string): string {
  if (!str) return '';

  let result = str;

  // Iteratively remove tag-like patterns until stable
  // Limit iterations to prevent infinite loops on malformed input
  const MAX_ITERATIONS = 10;
  let iterations = 0;
  let previous = '';

  while (result !== previous && iterations < MAX_ITERATIONS) {
    previous = result;
    // lgtm[js/incomplete-multi-character-sanitization] - False positive: final cleanup removes all brackets
    // nosemgrep: javascript.lang.security.audit.incomplete-sanitization
    result = result.replace(/<[^>]*>/g, '');
    iterations++;
  }

  // CRITICAL: Final safety - remove any remaining angle brackets entirely
  // This ensures no < or > survive even in malformed/nested cases like <scr<script>ipt>
  result = result.replace(/</g, '').replace(/>/g, '');

  return result;
}

/**
 * Sanitize string for safe display
 * Removes potentially dangerous content
 */
export function sanitizeString(str: string | null | undefined): string {
  if (!str) return '';

  // Remove null bytes
  let sanitized = str.replace(/\0/g, '');

  // Strip HTML tags
  sanitized = stripHtml(sanitized);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize object keys and string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  return sanitized;
}

/**
 * Sanitize phone number - keep only digits and + for country code
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Sanitize URL - validate and return or throw
 */
export function sanitizeUrl(url: string): string {
  const sanitized = sanitizeString(url);
  try {
    const parsed = new URL(sanitized);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    return parsed.href;
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Truncate string to max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Remove SQL injection patterns (for logging/display only - use parameterized queries for DB)
 */
export function removeSqlPatterns(str: string): string {
  // Remove common SQL injection patterns
  const sqlPatterns = [
    /(\s|^)(OR|AND)\s+\d+=\d+/gi,
    /--/g,
    /;.*$/g,
    /\/\*[\s\S]*?\*\//g,
    /'\s*(OR|AND)\s*'/gi,
    /UNION\s+(ALL\s+)?SELECT/gi,
    /DROP\s+TABLE/gi,
    /INSERT\s+INTO/gi,
    /DELETE\s+FROM/gi,
  ];

  let sanitized = str;
  for (const pattern of sqlPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized;
}
