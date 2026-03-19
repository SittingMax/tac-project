/**
 * RBAC Hook
 * Role-based access control for UI layer
 */

import { useMemo } from 'react';
import {
  canAccessModule,
  getRolePermissions,
  hasPermission,
  isWarehouseRole,
} from '@/lib/access-control';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export interface RBACContext {
  role: UserRole | null;
  canViewFinance: boolean;
  canEditManifests: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canResolveExceptions: boolean;
  canAccessModule: (module: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isWarehouse: boolean;
}

export function useRBAC(): RBACContext {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const role = user?.role ?? null;

    if (!role) {
      return {
        role: null,
        canViewFinance: false,
        canEditManifests: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canResolveExceptions: false,
        canAccessModule: () => false,
        hasPermission: () => false,
        isAdmin: false,
        isManager: false,
        isWarehouse: false,
      };
    }

    const perms = getRolePermissions(role);

    return {
      role,
      canViewFinance: perms?.canViewFinance ?? false,
      canEditManifests: perms?.canEditManifests ?? false,
      canManageUsers: perms?.canManageUsers ?? false,
      canViewAuditLogs: perms?.canViewAuditLogs ?? false,
      canResolveExceptions: perms?.canResolveExceptions ?? false,
      canAccessModule: (module: string) => canAccessModule(role, module),
      hasPermission: (permission: string) => hasPermission(role, permission),
      isAdmin: role === 'ADMIN',
      isManager: role === 'MANAGER',
      isWarehouse: isWarehouseRole(role),
    };
  }, [user?.role]);
}

/**
 * Hook to check if current user can access a specific module
 */
export function useCanAccessModule(module: string): boolean {
  const { canAccessModule } = useRBAC();
  return canAccessModule(module);
}

/**
 * Hook to check if current user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
}

/**
 * Usage:
 *
 * // In a component
 * const { canViewFinance, canAccessModule, isAdmin } = useRBAC();
 *
 * if (!canAccessModule('finance')) {
 *   return <AccessDenied />;
 * }
 *
 * // Conditional rendering
 * {canViewFinance && <FinanceSection />}
 *
 * // In sidebar
 * const showFinanceLink = useCanAccessModule('finance');
 */
