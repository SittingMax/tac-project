-- ============================================================================
-- TAC Portal - Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor after schema deployment
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM staff WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM staff WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE auth_user_id = auth.uid() 
    AND role = ANY(required_roles)
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- ORGANIZATIONS (orgs)
-- ============================================================================

-- Users can only see their own organization
CREATE POLICY "Users can view their org"
  ON orgs FOR SELECT
  TO authenticated
  USING (id = get_user_org_id());

-- Only admins can update org settings
CREATE POLICY "Admins can update org"
  ON orgs FOR UPDATE
  TO authenticated
  USING (id = get_user_org_id() AND has_role(ARRAY['ADMIN']));

-- ============================================================================
-- HUBS
-- ============================================================================

-- All authenticated users can view hubs
CREATE POLICY "Users can view hubs"
  ON hubs FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- Only admins can manage hubs
CREATE POLICY "Admins can manage hubs"
  ON hubs FOR ALL
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN']));

-- ============================================================================
-- STAFF
-- ============================================================================

-- Staff can view colleagues in their org
CREATE POLICY "Users can view staff in org"
  ON staff FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- Only admins and managers can create staff
CREATE POLICY "Admins/Managers can create staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER']));

-- Only admins and managers can update staff
CREATE POLICY "Admins/Managers can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER']));

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

-- Users can view customers in their org
CREATE POLICY "Users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- Authorized roles can create customers
CREATE POLICY "Authorized users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'INVOICE']));

-- Authorized roles can update customers
CREATE POLICY "Authorized users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'INVOICE']));

-- ============================================================================
-- SHIPMENTS
-- ============================================================================

-- Users can view shipments in their org
CREATE POLICY "Users can view shipments"
  ON shipments FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- Authorized roles can create shipments
CREATE POLICY "Authorized users can create shipments"
  ON shipments FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI']));

-- Authorized roles can update shipments
CREATE POLICY "Authorized users can update shipments"
  ON shipments FOR UPDATE
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI']));

-- ============================================================================
-- TRACKING EVENTS
-- ============================================================================

-- Users can view tracking events in their org
CREATE POLICY "Users can view tracking events"
  ON tracking_events FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- Authorized roles can create tracking events
CREATE POLICY "Authorized users can create tracking events"
  ON tracking_events FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI']));

-- ============================================================================
-- MANIFESTS
-- ============================================================================

-- Users can view manifests in their org
CREATE POLICY "Users can view manifests"
  ON manifests FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- Authorized roles can create manifests
CREATE POLICY "Authorized users can create manifests"
  ON manifests FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS']));

-- Authorized roles can update manifests
CREATE POLICY "Authorized users can update manifests"
  ON manifests FOR UPDATE
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI']));

-- ============================================================================
-- MANIFEST ITEMS
-- ============================================================================

-- Users can view manifest items (via manifest's org_id)
CREATE POLICY "Users can view manifest items"
  ON manifest_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM manifests m 
      WHERE m.id = manifest_items.manifest_id 
      AND m.org_id = get_user_org_id()
    )
  );

-- Authorized roles can manage manifest items
CREATE POLICY "Authorized users can manage manifest items"
  ON manifest_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM manifests m 
      WHERE m.id = manifest_items.manifest_id 
      AND m.org_id = get_user_org_id()
    )
    AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI'])
  );

-- ============================================================================
-- INVOICES
-- ============================================================================

-- Users can view invoices in their org
CREATE POLICY "Users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- Only finance roles can create invoices
CREATE POLICY "Finance users can create invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'INVOICE']));

-- Only finance roles can update invoices
CREATE POLICY "Finance users can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'INVOICE']));

-- NOTE: invoice_items table was removed in later schema iterations.
-- Line items are stored as JSONB in invoices.line_items instead.

-- ============================================================================
-- EXCEPTIONS
-- ============================================================================

-- Users can view exceptions in their org
CREATE POLICY "Users can view exceptions"
  ON exceptions FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

-- Authorized roles can create exceptions
CREATE POLICY "Authorized users can create exceptions"
  ON exceptions FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI']));

-- Authorized roles can update exceptions
CREATE POLICY "Authorized users can update exceptions"
  ON exceptions FOR UPDATE
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS']));

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

-- Only admins and managers can view audit logs
CREATE POLICY "Admins/Managers can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER']));



-- ============================================================================
-- PUBLIC TRACKING (Anonymous Access)
-- ============================================================================

-- NOTE: Anonymous tracking access is now handled via application-level
-- API endpoints with proper filtering. Direct anonymous table access
-- has been removed for security. See tracking-service.ts for the
-- public tracking implementation.

-- ============================================================================
-- AUDIT LOG TRIGGER
-- ============================================================================

-- Create audit log function
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    org_id,
    actor_staff_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    created_at
  ) VALUES (
    COALESCE(NEW.org_id, OLD.org_id),
    (SELECT id FROM staff WHERE auth_user_id = auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_shipments ON shipments;
CREATE TRIGGER audit_shipments
  AFTER INSERT OR UPDATE OR DELETE ON shipments
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

DROP TRIGGER IF EXISTS audit_manifests ON manifests;
CREATE TRIGGER audit_manifests
  AFTER INSERT OR UPDATE OR DELETE ON manifests
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

DROP TRIGGER IF EXISTS audit_exceptions ON exceptions;
CREATE TRIGGER audit_exceptions
  AFTER INSERT OR UPDATE OR DELETE ON exceptions
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on helper functions
GRANT EXECUTE ON FUNCTION get_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(text[]) TO authenticated;
