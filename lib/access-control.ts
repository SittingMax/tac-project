import { ROLE_HIERARCHY, ROLE_PERMISSIONS, UserRole } from '@/types/domain';

const ELEVATED_ROLES: readonly UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
];
const WAREHOUSE_ROLES = [
  UserRole.WAREHOUSE_IMPHAL,
  UserRole.WAREHOUSE_DELHI,
  UserRole.WAREHOUSE_STAFF,
] as const satisfies readonly UserRole[];
const OPS_ROLES = [UserRole.OPS, UserRole.OPS_STAFF] as const satisfies readonly UserRole[];
const FINANCE_ROLES = [
  UserRole.INVOICE,
  UserRole.FINANCE_STAFF,
] as const satisfies readonly UserRole[];

type RolePermissions = (typeof ROLE_PERMISSIONS)[UserRole];
type AccessRole = UserRole | string;

function matchesAnyRole(role: AccessRole, roles: readonly string[]): boolean {
  return roles.some((candidate) => candidate === role);
}

export function isElevatedRole(role: AccessRole | null | undefined): boolean {
  return Boolean(role && matchesAnyRole(role, ELEVATED_ROLES));
}

export function isWarehouseRole(role: AccessRole | null | undefined): boolean {
  return Boolean(role && matchesAnyRole(role, WAREHOUSE_ROLES));
}

export function isOpsRole(role: AccessRole | null | undefined): boolean {
  return Boolean(role && matchesAnyRole(role, OPS_ROLES));
}

export function isFinanceRole(role: AccessRole | null | undefined): boolean {
  return Boolean(role && matchesAnyRole(role, FINANCE_ROLES));
}

export function getRolePermissions(role: AccessRole | null | undefined): RolePermissions | null {
  if (!role) {
    return null;
  }

  return (ROLE_PERMISSIONS as Record<string, RolePermissions | undefined>)[role] ?? null;
}

export function hasRoleAccess(
  role: AccessRole | null | undefined,
  allowedRoles?: readonly string[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!role) return false;
  if (isElevatedRole(role)) return true;
  if (allowedRoles.includes(role)) return true;
  if (allowedRoles.includes(UserRole.FINANCE_STAFF) && isFinanceRole(role)) return true;
  if (allowedRoles.includes(UserRole.OPS_STAFF) && isOpsRole(role)) return true;
  if (allowedRoles.includes(UserRole.WAREHOUSE_STAFF) && isWarehouseRole(role)) return true;
  return false;
}

export function canAccessModule(role: AccessRole | null | undefined, module: string): boolean {
  const rolePerms = getRolePermissions(role);
  if (!rolePerms) return false;

  return rolePerms.modules.includes('*') || rolePerms.modules.includes(module);
}

export function hasPermission(role: AccessRole | null | undefined, permission: string): boolean {
  const rolePerms = getRolePermissions(role);
  if (!rolePerms) return false;
  if (rolePerms.modules.includes('*')) return true;

  return (rolePerms as Record<string, unknown>)[permission] === true;
}

export function hasRoleHierarchyAccess(
  role: AccessRole | null | undefined,
  requiredRole: AccessRole | null | undefined
): boolean {
  if (!role || !requiredRole) return false;

  const hierarchy = ROLE_HIERARCHY as Record<string, number | undefined>;
  const roleLevel = hierarchy[role];
  const requiredLevel = hierarchy[requiredRole];

  if (roleLevel === undefined || requiredLevel === undefined) {
    return false;
  }

  return roleLevel >= requiredLevel;
}

export function getDefaultRouteForRole(role: AccessRole | null | undefined): string {
  if (!role) return '/dashboard';
  if (isFinanceRole(role)) return '/finance';
  if (isOpsRole(role)) return '/shipments';
  if (isWarehouseRole(role)) return '/scanning';
  return '/dashboard';
}
