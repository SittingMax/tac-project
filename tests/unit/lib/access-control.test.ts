import { describe, expect, it } from 'vitest';
import {
  canAccessModule,
  getDefaultRouteForRole,
  getRolePermissions,
  hasPermission,
  hasRoleAccess,
  hasRoleHierarchyAccess,
  isFinanceRole,
  isOpsRole,
  isWarehouseRole,
} from '@/lib/access-control';
import { UserRole } from '@/types/domain';

describe('access-control', () => {
  describe('role grouping helpers', () => {
    it('detects warehouse roles', () => {
      expect(isWarehouseRole(UserRole.WAREHOUSE_IMPHAL)).toBe(true);
      expect(isWarehouseRole(UserRole.WAREHOUSE_DELHI)).toBe(true);
      expect(isWarehouseRole(UserRole.WAREHOUSE_STAFF)).toBe(true);
      expect(isWarehouseRole(UserRole.OPS_STAFF)).toBe(false);
      expect(isWarehouseRole(null)).toBe(false);
    });

    it('detects ops and finance roles', () => {
      expect(isOpsRole(UserRole.OPS)).toBe(true);
      expect(isOpsRole(UserRole.OPS_STAFF)).toBe(true);
      expect(isOpsRole(UserRole.ADMIN)).toBe(false);

      expect(isFinanceRole(UserRole.INVOICE)).toBe(true);
      expect(isFinanceRole(UserRole.FINANCE_STAFF)).toBe(true);
      expect(isFinanceRole(UserRole.OPS)).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('returns permissions for a role and null for missing role', () => {
      expect(getRolePermissions(UserRole.ADMIN)?.canManageUsers).toBe(true);
      expect(getRolePermissions(UserRole.SUPPORT)?.modules).toContain('tracking');
      expect(getRolePermissions(null)).toBeNull();
    });
  });

  describe('hasRoleAccess', () => {
    it('grants elevated roles broad access', () => {
      expect(hasRoleAccess(UserRole.ADMIN, [UserRole.OPS_STAFF])).toBe(true);
      expect(hasRoleAccess(UserRole.MANAGER, [UserRole.FINANCE_STAFF])).toBe(true);
    });

    it('matches grouped role families', () => {
      expect(hasRoleAccess(UserRole.OPS, [UserRole.OPS_STAFF])).toBe(true);
      expect(hasRoleAccess(UserRole.INVOICE, [UserRole.FINANCE_STAFF])).toBe(true);
      expect(hasRoleAccess(UserRole.WAREHOUSE_DELHI, [UserRole.WAREHOUSE_STAFF])).toBe(true);
    });

    it('denies missing or unrelated roles', () => {
      expect(hasRoleAccess(null, [UserRole.ADMIN])).toBe(false);
      expect(hasRoleAccess(UserRole.SUPPORT, [UserRole.FINANCE_STAFF])).toBe(false);
    });
  });

  describe('canAccessModule', () => {
    it('allows modules defined for the role', () => {
      expect(canAccessModule(UserRole.OPS, 'manifests')).toBe(true);
      expect(canAccessModule(UserRole.FINANCE_STAFF, 'finance')).toBe(true);
      expect(canAccessModule(UserRole.WAREHOUSE_STAFF, 'scanning')).toBe(true);
    });

    it('denies modules outside the role scope', () => {
      expect(canAccessModule(UserRole.SUPPORT, 'finance')).toBe(false);
      expect(canAccessModule(null, 'shipments')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('returns true for enabled boolean permissions', () => {
      expect(hasPermission(UserRole.ADMIN, 'canManageUsers')).toBe(true);
      expect(hasPermission(UserRole.OPS, 'canEditManifests')).toBe(true);
    });

    it('returns false for missing or disabled permissions', () => {
      expect(hasPermission(UserRole.SUPPORT, 'canViewFinance')).toBe(false);
      expect(hasPermission(null, 'canManageUsers')).toBe(false);
      expect(hasPermission(UserRole.OPS_STAFF, 'notARealPermission')).toBe(false);
    });
  });

  describe('hasRoleHierarchyAccess', () => {
    it('compares role hierarchy levels', () => {
      expect(hasRoleHierarchyAccess(UserRole.ADMIN, UserRole.MANAGER)).toBe(true);
      expect(hasRoleHierarchyAccess(UserRole.MANAGER, UserRole.ADMIN)).toBe(false);
      expect(hasRoleHierarchyAccess(UserRole.OPS, UserRole.OPS_STAFF)).toBe(true);
      expect(hasRoleHierarchyAccess(null, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('getDefaultRouteForRole', () => {
    it('returns default routes by role family', () => {
      expect(getDefaultRouteForRole(UserRole.FINANCE_STAFF)).toBe('/finance');
      expect(getDefaultRouteForRole(UserRole.OPS)).toBe('/shipments');
      expect(getDefaultRouteForRole(UserRole.WAREHOUSE_STAFF)).toBe('/scanning');
      expect(getDefaultRouteForRole(UserRole.ADMIN)).toBe('/dashboard');
      expect(getDefaultRouteForRole(null)).toBe('/dashboard');
    });
  });
});
