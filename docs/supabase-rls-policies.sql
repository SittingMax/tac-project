-- ============================================================================
-- TAC Cargo - Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor to enable organization-scoped access
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Organizations - Users can view their own org, service role can insert
-- ============================================================================
DROP POLICY IF EXISTS "Orgs viewable by same org" ON orgs;
CREATE POLICY "Orgs viewable by same org"
  ON orgs FOR SELECT
  TO authenticated
  USING (id = get_current_org_id());

DROP POLICY IF EXISTS "Orgs insertable by service role" ON orgs;
CREATE POLICY "Orgs insertable by service role"
  ON orgs FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Orgs updatable by admins" ON orgs;
CREATE POLICY "Orgs updatable by admins"
  ON orgs FOR UPDATE
  TO authenticated
  USING (
    id = get_current_org_id() AND
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role = 'ADMIN'
    )
  );
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function to get current user's org_id
-- ============================================================================
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM staff WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- Hubs - All authenticated users can view
-- ============================================================================
DROP POLICY IF EXISTS "Hubs viewable by all authenticated" ON hubs;
CREATE POLICY "Hubs viewable by all authenticated"
  ON hubs FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Staff - Users can view staff in their org
-- ============================================================================
DROP POLICY IF EXISTS "Staff viewable by same org" ON staff;
CREATE POLICY "Staff viewable by same org"
  ON staff FOR SELECT
  TO authenticated
  USING (org_id = get_current_org_id());

DROP POLICY IF EXISTS "Staff modifiable by admins" ON staff;
CREATE POLICY "Staff modifiable by admins"
  ON staff FOR ALL
  TO authenticated
  USING (
    org_id = get_current_org_id() AND
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role IN ('ADMIN', 'MANAGER')
    )
  );

-- ============================================================================
-- Customers - Org-scoped access
-- ============================================================================
DROP POLICY IF EXISTS "Customers org-scoped" ON customers;
CREATE POLICY "Customers org-scoped"
  ON customers FOR ALL
  TO authenticated
  USING (org_id = get_current_org_id())
  WITH CHECK (org_id = get_current_org_id());

-- ============================================================================
-- Shipments - Org-scoped access
-- ============================================================================
DROP POLICY IF EXISTS "Shipments org-scoped" ON shipments;
CREATE POLICY "Shipments org-scoped"
  ON shipments FOR ALL
  TO authenticated
  USING (org_id = get_current_org_id())
  WITH CHECK (org_id = get_current_org_id());

-- ============================================================================
-- Packages - Org-scoped access
-- ============================================================================
DROP POLICY IF EXISTS "Packages org-scoped" ON packages;
CREATE POLICY "Packages org-scoped"
  ON packages FOR ALL
  TO authenticated
  USING (org_id = get_current_org_id())
  WITH CHECK (org_id = get_current_org_id());

-- ============================================================================
-- Manifests - Org-scoped access
-- ============================================================================
DROP POLICY IF EXISTS "Manifests org-scoped" ON manifests;
CREATE POLICY "Manifests org-scoped"
  ON manifests FOR ALL
  TO authenticated
  USING (org_id = get_current_org_id())
  WITH CHECK (org_id = get_current_org_id());

-- ============================================================================
-- Manifest Items - Org-scoped access
-- ============================================================================
DROP POLICY IF EXISTS "Manifest items org-scoped" ON manifest_items;
CREATE POLICY "Manifest items org-scoped"
  ON manifest_items FOR ALL
  TO authenticated
  USING (org_id = get_current_org_id())
  WITH CHECK (org_id = get_current_org_id());

-- ============================================================================
-- Tracking Events - Org-scoped access
-- ============================================================================
DROP POLICY IF EXISTS "Tracking events org-scoped" ON tracking_events;
CREATE POLICY "Tracking events org-scoped"
  ON tracking_events FOR ALL
  TO authenticated
  USING (org_id = get_current_org_id())
  WITH CHECK (org_id = get_current_org_id());

-- ============================================================================
-- Invoices - Org-scoped with role restrictions
-- ============================================================================
DROP POLICY IF EXISTS "Invoices viewable by org" ON invoices;
CREATE POLICY "Invoices viewable by org"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    org_id = get_current_org_id() AND
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role IN ('ADMIN', 'MANAGER', 'INVOICE', 'OPS')
    )
  );

DROP POLICY IF EXISTS "Invoices modifiable by finance" ON invoices;
CREATE POLICY "Invoices modifiable by finance"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = get_current_org_id() AND
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role IN ('ADMIN', 'MANAGER', 'INVOICE')
    )
  );

DROP POLICY IF EXISTS "Invoices updatable by finance" ON invoices;
CREATE POLICY "Invoices updatable by finance"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    org_id = get_current_org_id() AND
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role IN ('ADMIN', 'MANAGER', 'INVOICE')
    )
  );

-- ============================================================================
-- Exceptions - Org-scoped access
-- ============================================================================
DROP POLICY IF EXISTS "Exceptions org-scoped" ON exceptions;
CREATE POLICY "Exceptions org-scoped"
  ON exceptions FOR ALL
  TO authenticated
  USING (org_id = get_current_org_id())
  WITH CHECK (org_id = get_current_org_id());

-- ============================================================================
-- Audit Logs - Viewable by admins/managers only
-- ============================================================================
DROP POLICY IF EXISTS "Audit logs viewable by admins" ON audit_logs;
CREATE POLICY "Audit logs viewable by admins"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    org_id = get_current_org_id() AND
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role IN ('ADMIN', 'MANAGER')
    )
  );

DROP POLICY IF EXISTS "Audit logs insertable by system" ON audit_logs;
CREATE POLICY "Audit logs insertable by system"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_current_org_id());

-- ============================================================================
-- Verify RLS is enabled
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'orgs', 'hubs', 'staff', 'customers', 'shipments', 
  'packages', 'manifests', 'manifest_items', 'tracking_events',
  'invoices', 'exceptions', 'audit_logs'
)
ORDER BY tablename;

-- ============================================================================
-- Usage Notes:
-- 
-- 1. Run this script AFTER running docs/schema.sql
-- 2. All data access is automatically scoped to the user's organization
-- 3. Invoices have additional role restrictions
-- 4. Audit logs are admin/manager only for viewing
-- 5. The get_current_org_id() function determines org from auth.uid()
-- ============================================================================
