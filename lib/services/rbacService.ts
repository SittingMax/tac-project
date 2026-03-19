/**
 * RBAC Service
 * Handles role-based access control operations with Supabase
 *
 * NOTE: This service requires migrations 010_rbac_enhancement.sql to be run.
 * The TypeScript types will show errors until database types are regenerated.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Database } from '@/lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Permission {
  code: string;
  name: string;
  description: string | null;
  module: string;
}

export interface UserPermission {
  permission_code: string;
  module: string;
}

// Extend the existing Database type with RBAC tables and functions
// We use a comprehensive intersection to ensure strict compatibility with SupabaseClient
// Define Types for RBAC functions to be added
type RBACFunctions = Pick<
  Database['public']['Functions'],
  'get_user_permissions' | 'has_permission' | 'can_access_module'
>;

// Define RBAC Tables
type RBACTables = Pick<Database['public']['Tables'], 'permissions' | 'role_permissions'>;

// Create the augmented Database type
type RBACDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables' | 'Functions'> & {
    Tables: Database['public']['Tables'] & RBACTables;
    Functions: Omit<Database['public']['Functions'], keyof RBACFunctions> & RBACFunctions;
  };
};

// Cast supabase client to include RBAC types
// eslint-disable-next-line no-restricted-syntax -- Type casting for RBAC database schema
const db = supabase as unknown as SupabaseClient<RBACDatabase>;

/**
 * Fetch all available permissions
 */
export async function fetchAllPermissions(): Promise<Permission[]> {
  try {
    const { data, error } = await db
      .from('permissions')
      .select('code, name, description, module')
      .order('module', { ascending: true });

    if (error) {
      logger.error('RBAC', 'Failed to fetch permissions', { error });
      return [];
    }

    return (data as Permission[]) || [];
  } catch {
    logger.warn('RBAC', 'Permissions table may not exist yet');
    return [];
  }
}

/**
 * Fetch permissions for a specific role
 */
export async function fetchRolePermissions(role: string): Promise<string[]> {
  try {
    const { data, error } = await db
      .from('role_permissions')
      .select('permission_code')
      .eq('role', role);

    if (error) {
      logger.error('RBAC', 'Failed to fetch role permissions', { error });
      return [];
    }

    return data?.map((rp: { permission_code: string }) => rp.permission_code) || [];
  } catch {
    logger.warn('RBAC', 'Role permissions table may not exist yet');
    return [];
  }
}

/**
 * Fetch current user's permissions from database
 */
export async function fetchUserPermissions(): Promise<UserPermission[]> {
  try {
    const { data, error } = await db.rpc('get_user_permissions');

    if (error) {
      logger.error('RBAC', 'Failed to fetch user permissions', { error });
      return [];
    }

    return (data as UserPermission[]) || [];
  } catch {
    logger.warn('RBAC', 'get_user_permissions function may not exist yet');
    return [];
  }
}

/**
 * Check if current user has a specific permission (server-side)
 */
export async function checkPermission(permission: string): Promise<boolean> {
  try {
    const { data, error } = await db.rpc('has_permission', {
      required_permission: permission,
    });

    if (error) {
      logger.error('RBAC', 'Permission check failed', { error });
      return false;
    }

    return data === true;
  } catch {
    return false;
  }
}

/**
 * Check if current user can access a module (server-side)
 */
export async function checkModuleAccess(module: string): Promise<boolean> {
  try {
    const { data, error } = await db.rpc('can_access_module', {
      module_name: module,
    });

    if (error) {
      logger.error('RBAC', 'Module access check failed', { error });
      return false;
    }

    return data === true;
  } catch {
    return false;
  }
}

/**
 * Grant permission to a role (admin only)
 */
export async function grantPermission(
  role: string,
  permissionCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db.from('role_permissions').insert({
      role,
      permission_code: permissionCode,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: true }; // Already exists
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/**
 * Revoke permission from a role (admin only)
 */
export async function revokePermission(
  role: string,
  permissionCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('role_permissions')
      .delete()
      .eq('role', role)
      .eq('permission_code', permissionCode);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/**
 * Permission code constants for type-safe usage
 */
export const PERMISSION_CODES = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ANALYTICS: 'dashboard.analytics',

  // Shipments
  SHIPMENTS_VIEW: 'shipments.view',
  SHIPMENTS_CREATE: 'shipments.create',
  SHIPMENTS_UPDATE: 'shipments.update',
  SHIPMENTS_DELETE: 'shipments.delete',
  SHIPMENTS_STATUS: 'shipments.status',

  // Manifests
  MANIFESTS_VIEW: 'manifests.view',
  MANIFESTS_CREATE: 'manifests.create',
  MANIFESTS_UPDATE: 'manifests.update',
  MANIFESTS_CLOSE: 'manifests.close',
  MANIFESTS_DELETE: 'manifests.delete',

  // Scanning
  SCANNING_VIEW: 'scanning.view',
  SCANNING_SCAN: 'scanning.scan',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_UPDATE: 'inventory.update',

  // Finance
  FINANCE_VIEW: 'finance.view',
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_UPDATE: 'invoices.update',
  INVOICES_DELETE: 'invoices.delete',
  INVOICES_ISSUE: 'invoices.issue',

  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',

  // Exceptions
  EXCEPTIONS_VIEW: 'exceptions.view',
  EXCEPTIONS_CREATE: 'exceptions.create',
  EXCEPTIONS_RESOLVE: 'exceptions.resolve',

  // Tracking
  TRACKING_VIEW: 'tracking.view',
  TRACKING_UPDATE: 'tracking.update',

  // Staff
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_UPDATE: 'staff.update',
  STAFF_DELETE: 'staff.delete',

  // Audit
  AUDIT_VIEW: 'audit.view',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
} as const;

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];
