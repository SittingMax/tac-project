/**
 * Global Error Handling System
 * Centralized error types and user-friendly error messages
 */

import { toast } from 'sonner';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, meta);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, identifier });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', 409, meta);
    this.name = 'ConflictError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

// ============================================================================
// SUPABASE ERROR MAPPING
// ============================================================================

interface PostgresError {
  code?: string;
  message?: string;
  details?: string;
  statusCode?: number;
}

export const mapSupabaseError = (error: PostgresError): AppError => {
  // PostgreSQL error codes
  const pgErrorCodes: Record<string, (error: PostgresError) => AppError> = {
    '23505': (err) =>
      new ConflictError('A record with this identifier already exists', {
        constraint: err.details,
      }),
    '23503': (err) =>
      new ValidationError('Referenced record does not exist', {
        constraint: err.details,
      }),
    '23502': (err) =>
      new ValidationError('Required field is missing', {
        column: err.details,
      }),
    '42501': () => new AuthorizationError('Insufficient database permissions'),
    PGRST116: () => new NotFoundError('Record', 'unknown'),
  };

  // Check for PostgreSQL error code
  if (error.code && pgErrorCodes[error.code]) {
    return pgErrorCodes[error.code](error);
  }

  // Check for Supabase-specific errors
  if (error.message?.includes('JWT')) {
    return new AuthenticationError('Session expired. Please login again.');
  }

  if (error.message?.includes('Row Level Security')) {
    return new AuthorizationError('You do not have permission to access this resource');
  }

  if (error.message?.includes('duplicate key')) {
    return new ConflictError('A record with this identifier already exists');
  }

  if (error.message?.includes('violates foreign key')) {
    return new ValidationError('Referenced record does not exist');
  }

  // Network errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return new NetworkError('Unable to connect to server. Please check your internet connection.');
  }

  // Default to generic AppError
  return new AppError(
    error.message || 'An unexpected error occurred',
    error.code || 'UNKNOWN_ERROR',
    error.statusCode
  );
};

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  AUTH_ERROR: 'Please login to continue',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action',

  // Validation
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_CN: 'Invalid CN format. Expected format: WGS12345678',
  INVALID_STATUS_TRANSITION: 'Cannot change status from current state',

  // Not Found
  NOT_FOUND: 'The requested resource was not found',
  SHIPMENT_NOT_FOUND: 'Shipment not found. Please check the CN Number.',
  MANIFEST_NOT_FOUND: 'Manifest not found',
  INVOICE_NOT_FOUND: 'Invoice not found',

  // Conflicts
  CONFLICT_ERROR: 'This operation conflicts with existing data',
  DUPLICATE_CN: 'A shipment with this AWB already exists',
  MANIFEST_CLOSED: 'Cannot modify a closed manifest',
  SHIPMENT_ALREADY_MANIFESTED: 'This shipment is already on a manifest',

  // Network
  NETWORK_ERROR: 'Connection error. Please check your internet and try again.',
  OFFLINE: 'You are currently offline. Changes will sync when connection is restored.',

  // Business Logic
  ROUTE_MISMATCH: 'Shipment route does not match manifest route',
  WEIGHT_LIMIT_EXCEEDED: 'Total weight exceeds manifest capacity',
  INVALID_HUB: 'Invalid hub selection',

  // Default
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

export const getErrorMessage = (error: Error | AppError | string): string => {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] || error.message;
  }

  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};

// ============================================================================
// TOAST HELPERS
// ============================================================================

export const showErrorToast = (error: Error | AppError | string, title?: string) => {
  const message = getErrorMessage(error);
  toast.error(title || 'Error', {
    description: message,
    duration: 5000,
  });
};

export const showSuccessToast = (message: string, title?: string) => {
  toast.success(title || 'Success', {
    description: message,
    duration: 3000,
  });
};

export const showWarningToast = (message: string, title?: string) => {
  toast.warning(title || 'Warning', {
    description: message,
    duration: 4000,
  });
};

export const showInfoToast = (message: string, title?: string) => {
  toast.info(title || 'Info', {
    description: message,
    duration: 3000,
  });
};

// ============================================================================
// ERROR HANDLER FOR MUTATIONS
// ============================================================================

export const handleMutationError = (error: unknown, context?: string) => {
  console.error(`[Mutation Error${context ? ` - ${context}` : ''}]:`, error);

  const appError =
    error instanceof Error
      ? mapSupabaseError(error)
      : new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');

  showErrorToast(appError);

  return appError;
};

// ============================================================================
// RETRY LOGIC
// ============================================================================

export const shouldRetry = (error: AppError): boolean => {
  // Retry on network errors
  if (error instanceof NetworkError) return true;

  // Retry on 5xx server errors
  if (error.statusCode && error.statusCode >= 500) return true;

  // Don't retry on client errors (4xx)
  return false;
};

export const getRetryDelay = (attemptNumber: number): number => {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attemptNumber), 16000);
};

// ============================================================================
// JSON ERROR RESPONSE HELPER (for API consistency)
// ============================================================================

/**
 * Convert any error to a JSON-serializable format.
 * This ensures all error responses are valid JSON for API consumers (including TestSprite).
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode?: number;
    details?: Record<string, unknown>;
  };
}

export const toErrorResponse = (error: Error | AppError | unknown): ErrorResponse => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.meta,
      },
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message,
      },
    };
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: String(error) || 'An unexpected error occurred',
    },
  };
};

/**
 * Safely parse JSON and return structured error if parsing fails.
 * Prevents "Extra data" JSON parse errors in API tests.
 */
export const safeJsonParse = <T = unknown>(
  text: string
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const data = JSON.parse(text);
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`,
    };
  }
};

/**
 * Usage Examples:
 *
 * // In a mutation
 * try {
 *   await createShipment(data);
 *   showSuccessToast('Shipment created successfully');
 * } catch (error) {
 *   handleMutationError(error, 'Create Shipment');
 * }
 *
 * // In a component
 * if (error) {
 *   const appError = mapSupabaseError(error);
 *   showErrorToast(appError);
 * }
 *
 * // Custom error
 * throw new ValidationError('CN format is invalid', { awb: inputValue });
 *
 * // For API responses (ensures valid JSON)
 * return toErrorResponse(error);
 */
