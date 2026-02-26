-- ============================================================================
-- TAC Portal - Enhanced RBAC System
-- Migration 010: Role-Based Access Control Enhancement
-- ============================================================================

-- ============================================================================
-- 1. PERMISSIONS TABLE - Fine-grained permission definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    module text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Insert core permissions
INSERT INTO permissions (code, name, description, module) VALUES
    -- Dashboard
    ('dashboard.view', 'View Dashboard', 'Access to view dashboard', 'dashboard'),
    ('dashboard.analytics', 'View Analytics', 'Access to analytics data', 'dashboard'),
    
    -- Shipments
    ('shipments.view', 'View Shipments', 'View shipment records', 'shipments'),
    ('shipments.create', 'Create Shipments', 'Create new shipments', 'shipments'),
    ('shipments.update', 'Update Shipments', 'Modify shipment details', 'shipments'),
    ('shipments.delete', 'Delete Shipments', 'Delete shipment records', 'shipments'),
    ('shipments.status', 'Update Status', 'Change shipment status', 'shipments'),
    
    -- Manifests
    ('manifests.view', 'View Manifests', 'View manifest records', 'manifests'),
    ('manifests.create', 'Create Manifests', 'Create new manifests', 'manifests'),
    ('manifests.update', 'Update Manifests', 'Modify manifest details', 'manifests'),
    ('manifests.close', 'Close Manifests', 'Close and dispatch manifests', 'manifests'),
    ('manifests.delete', 'Delete Manifests', 'Delete manifest records', 'manifests'),
    
    -- Scanning
    ('scanning.view', 'View Scanning', 'Access scanning module', 'scanning'),
    ('scanning.scan', 'Perform Scans', 'Scan packages and update status', 'scanning'),
    
    -- Inventory
    ('inventory.view', 'View Inventory', 'View inventory records', 'inventory'),
    ('inventory.update', 'Update Inventory', 'Modify inventory records', 'inventory'),
    
    -- Finance
    ('finance.view', 'View Finance', 'Access finance module', 'finance'),
    ('invoices.view', 'View Invoices', 'View invoice records', 'finance'),
    ('invoices.create', 'Create Invoices', 'Create new invoices', 'finance'),
    ('invoices.update', 'Update Invoices', 'Modify invoice details', 'finance'),
    ('invoices.delete', 'Delete Invoices', 'Delete invoice records', 'finance'),
    ('invoices.issue', 'Issue Invoices', 'Issue invoices to customers', 'finance'),
    
    -- Customers
    ('customers.view', 'View Customers', 'View customer records', 'customers'),
    ('customers.create', 'Create Customers', 'Create new customers', 'customers'),
    ('customers.update', 'Update Customers', 'Modify customer details', 'customers'),
    ('customers.delete', 'Delete Customers', 'Delete customer records', 'customers'),
    
    -- Exceptions
    ('exceptions.view', 'View Exceptions', 'View exception records', 'exceptions'),
    ('exceptions.create', 'Create Exceptions', 'Create new exceptions', 'exceptions'),
    ('exceptions.resolve', 'Resolve Exceptions', 'Resolve exception records', 'exceptions'),
    
    -- Tracking
    ('tracking.view', 'View Tracking', 'View tracking information', 'tracking'),
    ('tracking.update', 'Update Tracking', 'Add tracking events', 'tracking'),
    
    -- Management
    ('staff.view', 'View Staff', 'View staff records', 'management'),
    ('staff.create', 'Create Staff', 'Create new staff members', 'management'),
    ('staff.update', 'Update Staff', 'Modify staff details', 'management'),
    ('staff.delete', 'Delete Staff', 'Deactivate staff accounts', 'management'),
    
    -- Audit
    ('audit.view', 'View Audit Logs', 'Access audit log records', 'audit'),
    
    -- Settings
    ('settings.view', 'View Settings', 'View system settings', 'settings'),
    ('settings.update', 'Update Settings', 'Modify system settings', 'settings')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. ROLE_PERMISSIONS TABLE - Maps roles to permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL,
    permission_code text NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(role, permission_code)
);

-- Admin gets all permissions
INSERT INTO role_permissions (role, permission_code)
SELECT 'ADMIN', code FROM permissions
ON CONFLICT DO NOTHING;

-- Manager gets all permissions except settings.update
INSERT INTO role_permissions (role, permission_code)
SELECT 'MANAGER', code FROM permissions WHERE code != 'settings.update'
ON CONFLICT DO NOTHING;

-- OPS role permissions
INSERT INTO role_permissions (role, permission_code) VALUES
    ('OPS', 'dashboard.view'),
    ('OPS', 'shipments.view'),
    ('OPS', 'shipments.create'),
    ('OPS', 'shipments.update'),
    ('OPS', 'shipments.status'),
    ('OPS', 'manifests.view'),
    ('OPS', 'manifests.create'),
    ('OPS', 'manifests.update'),
    ('OPS', 'manifests.close'),
    ('OPS', 'scanning.view'),
    ('OPS', 'scanning.scan'),
    ('OPS', 'tracking.view'),
    ('OPS', 'tracking.update'),
    ('OPS', 'customers.view'),
    ('OPS', 'exceptions.view'),
    ('OPS', 'exceptions.create'),
    ('OPS', 'exceptions.resolve')
ON CONFLICT DO NOTHING;

-- Warehouse roles (IMPHAL/DELHI) permissions
INSERT INTO role_permissions (role, permission_code)
SELECT role, perm FROM (
    VALUES ('WAREHOUSE_IMPHAL'), ('WAREHOUSE_DELHI')
) AS roles(role)
CROSS JOIN (
    VALUES 
        ('dashboard.view'),
        ('shipments.view'),
        ('shipments.status'),
        ('scanning.view'),
        ('scanning.scan'),
        ('inventory.view'),
        ('inventory.update'),
        ('tracking.view'),
        ('exceptions.view'),
        ('exceptions.create')
) AS perms(perm)
ON CONFLICT DO NOTHING;

-- Invoice role permissions
INSERT INTO role_permissions (role, permission_code) VALUES
    ('INVOICE', 'dashboard.view'),
    ('INVOICE', 'finance.view'),
    ('INVOICE', 'invoices.view'),
    ('INVOICE', 'invoices.create'),
    ('INVOICE', 'invoices.update'),
    ('INVOICE', 'invoices.issue'),
    ('INVOICE', 'customers.view'),
    ('INVOICE', 'customers.create'),
    ('INVOICE', 'customers.update'),
    ('INVOICE', 'shipments.view')
ON CONFLICT DO NOTHING;

-- Support role permissions (read-only)
INSERT INTO role_permissions (role, permission_code) VALUES
    ('SUPPORT', 'dashboard.view'),
    ('SUPPORT', 'shipments.view'),
    ('SUPPORT', 'tracking.view'),
    ('SUPPORT', 'customers.view'),
    ('SUPPORT', 'exceptions.view')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. ENHANCED RBAC FUNCTIONS
-- ============================================================================

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(required_permission text)
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM staff WHERE auth_user_id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if permission exists for user's role
    RETURN EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role = user_role
        AND permission_code = required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has any of the specified permissions
CREATE OR REPLACE FUNCTION has_any_permission(required_permissions text[])
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM staff WHERE auth_user_id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role = user_role
        AND permission_code = ANY(required_permissions)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can access a module
CREATE OR REPLACE FUNCTION can_access_module(module_name text)
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM staff WHERE auth_user_id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Admin and Manager can access all modules
    IF user_role IN ('ADMIN', 'MANAGER') THEN
        RETURN true;
    END IF;
    
    -- Check if user has any permission in the module
    RETURN EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN permissions p ON p.code = rp.permission_code
        WHERE rp.role = user_role
        AND p.module = module_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get all permissions for current user
CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS TABLE(permission_code text, module text) AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM staff WHERE auth_user_id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT rp.permission_code, p.module
    FROM role_permissions rp
    JOIN permissions p ON p.code = rp.permission_code
    WHERE rp.role = user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 4. RLS POLICIES FOR PERMISSIONS TABLES
-- ============================================================================

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions (needed for UI)
CREATE POLICY "Authenticated users can view permissions"
    ON permissions FOR SELECT
    TO authenticated
    USING (true);

-- Everyone can read role_permissions (needed for UI)
CREATE POLICY "Authenticated users can view role_permissions"
    ON role_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can modify permissions
CREATE POLICY "Admins can manage permissions"
    ON permissions FOR ALL
    TO authenticated
    USING (has_role(ARRAY['ADMIN']));

CREATE POLICY "Admins can manage role_permissions"
    ON role_permissions FOR ALL
    TO authenticated
    USING (has_role(ARRAY['ADMIN']));

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON permissions TO authenticated;
GRANT SELECT ON role_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION has_any_permission(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_module(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions() TO authenticated;
