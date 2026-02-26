import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  passwordResetSchema,
  hasPermission,
  canAccess,
  type UserRoleType,
} from '@/lib/schemas/auth.schema';

describe('Auth Schema Validation', () => {
  describe('loginSchema', () => {
    it('validates correct login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
      fullName: 'John Doe',
    };

    it('validates correct registration', () => {
      const result = registerSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('rejects weak password - too short', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'Sh0rt!',
        confirmPassword: 'Sh0rt!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without uppercase', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'lowercase1!',
        confirmPassword: 'lowercase1!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without lowercase', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'UPPERCASE1!',
        confirmPassword: 'UPPERCASE1!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without number', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'NoNumbers!',
        confirmPassword: 'NoNumbers!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without special character', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        password: 'NoSpecial1',
        confirmPassword: 'NoSpecial1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        confirmPassword: 'DifferentPass1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword');
      }
    });

    it('rejects short full name', () => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        fullName: 'J',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetSchema', () => {
    it('validates correct password reset', () => {
      const result = passwordResetSchema.safeParse({
        token: 'valid-reset-token-123',
        password: 'NewSecure1!',
        confirmPassword: 'NewSecure1!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty token', () => {
      const result = passwordResetSchema.safeParse({
        token: '',
        password: 'NewSecure1!',
        confirmPassword: 'NewSecure1!',
      });
      expect(result.success).toBe(false);
    });

    it('applies same password rules as registration', () => {
      const result = passwordResetSchema.safeParse({
        token: 'valid-token',
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Role-based Access Control', () => {
    describe('hasPermission', () => {
      it('ADMIN has highest permission', () => {
        expect(hasPermission('ADMIN', 'ADMIN')).toBe(true);
        expect(hasPermission('ADMIN', 'MANAGER')).toBe(true);
        expect(hasPermission('ADMIN', 'CUSTOMER_SERVICE')).toBe(true);
      });

      it('MANAGER has permission over lower roles', () => {
        expect(hasPermission('MANAGER', 'MANAGER')).toBe(true);
        expect(hasPermission('MANAGER', 'OPS_STAFF')).toBe(true);
        expect(hasPermission('MANAGER', 'ADMIN')).toBe(false);
      });

      it('Lower roles cannot access higher permissions', () => {
        expect(hasPermission('CUSTOMER_SERVICE', 'ADMIN')).toBe(false);
        expect(hasPermission('CUSTOMER_SERVICE', 'MANAGER')).toBe(false);
        expect(hasPermission('OPS_STAFF', 'FINANCE_STAFF')).toBe(false);
      });

      it('Same role has permission to itself', () => {
        const roles: UserRoleType[] = [
          'ADMIN',
          'MANAGER',
          'OPS_STAFF',
          'WAREHOUSE_STAFF',
          'FINANCE_STAFF',
          'CUSTOMER_SERVICE',
        ];
        roles.forEach((role) => {
          expect(hasPermission(role, role)).toBe(true);
        });
      });
    });

    describe('canAccess', () => {
      it('ADMIN can access any feature', () => {
        expect(canAccess('ADMIN', ['OPS_STAFF'])).toBe(true);
        expect(canAccess('ADMIN', ['FINANCE_STAFF'])).toBe(true);
        expect(canAccess('ADMIN', [])).toBe(true);
      });

      it('User can access if in allowed roles', () => {
        expect(canAccess('OPS_STAFF', ['OPS_STAFF', 'MANAGER'])).toBe(true);
        expect(canAccess('FINANCE_STAFF', ['FINANCE_STAFF'])).toBe(true);
      });

      it('User cannot access if not in allowed roles', () => {
        expect(canAccess('CUSTOMER_SERVICE', ['OPS_STAFF', 'MANAGER'])).toBe(false);
        expect(canAccess('WAREHOUSE_STAFF', ['FINANCE_STAFF'])).toBe(false);
      });
    });
  });
});
