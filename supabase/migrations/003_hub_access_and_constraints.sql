-- ============================================================================
-- TAC Portal - Hub-Based Access Control & Database Constraints
-- Migration 003: Enterprise hardening for production
-- ============================================================================

-- ============================================================================
-- 1. HELPER FUNCTION: Get user's hub restriction
-- ============================================================================

-- Get current user's hub_id (for warehouse roles)
CREATE OR REPLACE FUNCTION get_user_hub_id()
RETURNS uuid AS $$
  SELECT hub_id FROM staff WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is a warehouse role (hub-restricted)
CREATE OR REPLACE FUNCTION is_warehouse_role()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user can access a specific hub
CREATE OR REPLACE FUNCTION can_access_hub(hub_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_hub uuid;
BEGIN
  SELECT role, staff.hub_id INTO user_role, user_hub
  FROM staff WHERE auth_user_id = auth.uid();
  
  -- Admin, Manager, OPS can access all hubs
  IF user_role IN ('ADMIN', 'MANAGER', 'OPS', 'INVOICE', 'SUPPORT') THEN
    RETURN true;
  END IF;
  
  -- Warehouse roles can only access their assigned hub
  IF user_role IN ('WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI') THEN
    RETURN user_hub = hub_id;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 2. DATABASE CONSTRAINTS
-- ============================================================================

-- AWB must be unique per organization
DROP INDEX IF EXISTS shipments_org_awb_unique;
CREATE UNIQUE INDEX shipments_org_awb_unique 
  ON shipments (org_id, awb_number) 
  WHERE deleted_at IS NULL;

-- Invoice number must be unique per organization
DROP INDEX IF EXISTS invoices_org_invoice_number_unique;
CREATE UNIQUE INDEX invoices_org_invoice_number_unique 
  ON invoices (org_id, invoice_no);

-- Manifest number must be unique per organization
DROP INDEX IF EXISTS manifests_org_manifest_no_unique;
CREATE UNIQUE INDEX manifests_org_manifest_no_unique 
  ON manifests (org_id, manifest_no);

-- Prevent duplicate shipment assignments to manifests
DROP INDEX IF EXISTS manifest_items_unique;
CREATE UNIQUE INDEX manifest_items_unique 
  ON manifest_items (manifest_id, shipment_id);

-- Customer code must be unique per organization
DROP INDEX IF EXISTS customers_org_customer_code_unique;
CREATE UNIQUE INDEX customers_org_customer_code_unique 
  ON customers (org_id, customer_code) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. HUB-BASED ACCESS CONTROL POLICIES
-- ============================================================================

-- Drop and recreate shipments SELECT policy with hub restriction
DROP POLICY IF EXISTS "Users can view shipments" ON shipments;
CREATE POLICY "Users can view shipments with hub access"
  ON shipments FOR SELECT
  TO authenticated
  USING (
    org_id = get_user_org_id()
    AND (
      -- Non-warehouse roles can see all shipments
      NOT is_warehouse_role()
      OR
      -- Warehouse roles can only see shipments at their hub
      origin_hub_id = get_user_hub_id()
      OR destination_hub_id = get_user_hub_id()
    )
  );

-- Drop and recreate shipments UPDATE policy with hub restriction  
DROP POLICY IF EXISTS "Authorized users can update shipments" ON shipments;
CREATE POLICY "Authorized users can update shipments with hub access"
  ON shipments FOR UPDATE
  TO authenticated
  USING (
    org_id = get_user_org_id()
    AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI'])
    AND (
      NOT is_warehouse_role()
      OR origin_hub_id = get_user_hub_id()
      OR destination_hub_id = get_user_hub_id()
    )
  );

-- Drop and recreate manifests SELECT policy with hub restriction
DROP POLICY IF EXISTS "Users can view manifests" ON manifests;
CREATE POLICY "Users can view manifests with hub access"
  ON manifests FOR SELECT
  TO authenticated
  USING (
    org_id = get_user_org_id()
    AND (
      NOT is_warehouse_role()
      OR from_hub_id = get_user_hub_id()
      OR to_hub_id = get_user_hub_id()
    )
  );

-- Drop and recreate manifests UPDATE policy with hub restriction
DROP POLICY IF EXISTS "Authorized users can update manifests" ON manifests;
CREATE POLICY "Authorized users can update manifests with hub access"
  ON manifests FOR UPDATE
  TO authenticated
  USING (
    org_id = get_user_org_id()
    AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI'])
    AND (
      NOT is_warehouse_role()
      OR from_hub_id = get_user_hub_id()
      OR to_hub_id = get_user_hub_id()
    )
  );

-- Tracking events with hub restriction
DROP POLICY IF EXISTS "Users can view tracking events" ON tracking_events;
CREATE POLICY "Users can view tracking events with hub access"
  ON tracking_events FOR SELECT
  TO authenticated
  USING (
    org_id = get_user_org_id()
    AND (
      NOT is_warehouse_role()
      OR hub_id = get_user_hub_id()
      OR hub_id IS NULL
    )
  );

-- ============================================================================
-- 4. FINANCE MODULE RESTRICTION
-- ============================================================================

-- Invoices: Only finance-authorized roles can see/manage
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
CREATE POLICY "Finance authorized users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    org_id = get_user_org_id()
    AND has_role(ARRAY['ADMIN', 'MANAGER', 'INVOICE', 'OPS'])
  );

-- ============================================================================
-- 5. ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Shipments: Common query patterns
CREATE INDEX IF NOT EXISTS idx_shipments_org_status 
  ON shipments (org_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_org_created 
  ON shipments (org_id, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_origin_hub 
  ON shipments (org_id, origin_hub_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_dest_hub 
  ON shipments (org_id, destination_hub_id) 
  WHERE deleted_at IS NULL;

-- Tracking events: Query by shipment and time
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment 
  ON tracking_events (shipment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tracking_events_awb 
  ON tracking_events (awb_number, created_at DESC);

-- Manifests: Common query patterns
CREATE INDEX IF NOT EXISTS idx_manifests_org_status 
  ON manifests (org_id, status);

CREATE INDEX IF NOT EXISTS idx_manifests_from_hub 
  ON manifests (org_id, from_hub_id);

-- Exceptions: Open exceptions query
CREATE INDEX IF NOT EXISTS idx_exceptions_org_status 
  ON exceptions (org_id, status);

-- Audit logs: Query by entity and time
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created 
  ON audit_logs (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
  ON audit_logs (entity_type, entity_id);

-- ============================================================================
-- 6. GRANT PERMISSIONS FOR NEW FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_hub_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_warehouse_role() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_hub(uuid) TO authenticated;
