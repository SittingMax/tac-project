/**
 * RBAC Hook
 * Role-based access control for UI layer
 */

import { useMemo } from 'react';
import { useStore } from '@/store';
import { UserRole, ROLE_PERMISSIONS, hasPermission, canAccessModule } from '@/types/domain';

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
  const { user } = useStore();

  return useMemo(() => {
    const role = user?.role as UserRole | null;

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

    const perms = ROLE_PERMISSIONS[role];

    return {
      role,
      canViewFinance: perms?.canViewFinance ?? false,
      canEditManifests: perms?.canEditManifests ?? false,
      canManageUsers: perms?.canManageUsers ?? false,
      canViewAuditLogs: perms?.canViewAuditLogs ?? false,
      canResolveExceptions: perms?.canResolveExceptions ?? false,
      canAccessModule: (module: string) => canAccessModule(role, module),
      hasPermission: (permission: string) =>
        hasPermission(role, permission as keyof (typeof ROLE_PERMISSIONS)[UserRole.ADMIN]),
      isAdmin: role === UserRole.ADMIN,
      isManager: role === UserRole.MANAGER,
      isWarehouse: role === UserRole.WAREHOUSE_IMPHAL || role === UserRole.WAREHOUSE_DELHI,
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
