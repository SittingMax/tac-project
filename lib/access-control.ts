import type { UserRole } from '@/types';

const ELEVATED_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
const WAREHOUSE_ROLES = [
  'WAREHOUSE_IMPHAL',
  'WAREHOUSE_DELHI',
  'WAREHOUSE_STAFF',
] as const satisfies readonly UserRole[];
const OPS_ROLES = ['OPS', 'OPS_STAFF'] as const satisfies readonly UserRole[];
const FINANCE_ROLES = ['INVOICE', 'FINANCE_STAFF'] as const satisfies readonly UserRole[];

function matchesAnyRole(role: UserRole, roles: readonly UserRole[]): boolean {
  return roles.some((candidate) => candidate === role);
}

export function hasRoleAccess(
  role: UserRole | null | undefined,
  allowedRoles?: UserRole[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!role) return false;
  if (matchesAnyRole(role, ELEVATED_ROLES)) return true;
  if (allowedRoles.includes(role)) return true;
  if (allowedRoles.includes('FINANCE_STAFF') && matchesAnyRole(role, FINANCE_ROLES)) return true;
  if (allowedRoles.includes('OPS_STAFF') && matchesAnyRole(role, OPS_ROLES)) return true;
  if (allowedRoles.includes('WAREHOUSE_STAFF') && matchesAnyRole(role, WAREHOUSE_ROLES))
    return true;
  return false;
}

export function getDefaultRouteForRole(role: UserRole | null | undefined): string {
  if (!role) return '/dashboard';
  if (matchesAnyRole(role, FINANCE_ROLES)) return '/finance';
  if (matchesAnyRole(role, OPS_ROLES)) return '/shipments';
  if (matchesAnyRole(role, WAREHOUSE_ROLES)) return '/scanning';
  return '/dashboard';
}
