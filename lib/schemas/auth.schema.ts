import { z } from 'zod';

/**
 * Authentication validation schemas
 * Based on tac-code-reviewer security requirements
 */

// Password requirements for enterprise security
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registration schema with strong password requirements
export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .regex(
        PASSWORD_REGEX,
        'Password must contain at least one uppercase, one lowercase, one number, and one special character'
      ),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

// Password reset schema
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .regex(
        PASSWORD_REGEX,
        'Password must contain at least one uppercase, one lowercase, one number, and one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

// User role enum
export const UserRole = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'OPS_STAFF',
  'WAREHOUSE_STAFF',
  'FINANCE_STAFF',
  'CUSTOMER_SERVICE',
]);

export type UserRoleType = z.infer<typeof UserRole>;

// Staff profile update schema
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Role-based access control helper
export const ROLE_HIERARCHY: Record<UserRoleType, number> = {
  SUPER_ADMIN: 1000,
  ADMIN: 100,
  MANAGER: 80,
  FINANCE_STAFF: 60,
  OPS_STAFF: 50,
  WAREHOUSE_STAFF: 40,
  CUSTOMER_SERVICE: 30,
};

/**
 * Check if a user role has sufficient permission level
 */
export function hasPermission(userRole: UserRoleType, requiredRole: UserRoleType): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can access a specific feature
 */
export function canAccess(userRole: UserRoleType, allowedRoles: UserRoleType[]): boolean {
  return allowedRoles.includes(userRole) || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
}
