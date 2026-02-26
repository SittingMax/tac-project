-- ============================================================================
-- TAC Cargo - Automatic Audit Log Trigger
-- Run this in Supabase SQL Editor to enable automatic audit logging
-- ============================================================================

-- Create audit log function
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_staff_id uuid;
BEGIN
  -- Get current staff ID from auth context
  SELECT id INTO v_actor_staff_id
  FROM staff
  WHERE auth_user_id = auth.uid();

  INSERT INTO audit_logs (
    id,
    org_id,
    actor_staff_id,
    action,
    entity_type,
    entity_id,
    before,
    after,
    created_at
  ) VALUES (
    gen_random_uuid(),
    COALESCE(NEW.org_id, OLD.org_id),
    v_actor_staff_id,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) 
         WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)
         ELSE NULL 
    END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) 
         ELSE NULL 
    END,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the original operation if audit logging fails
  RAISE WARNING 'Audit log failed: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Apply triggers to critical tables
-- ============================================================================

-- Shipments
DROP TRIGGER IF EXISTS audit_shipments ON shipments;
CREATE TRIGGER audit_shipments
  AFTER INSERT OR UPDATE OR DELETE ON shipments
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Manifests
DROP TRIGGER IF EXISTS audit_manifests ON manifests;
CREATE TRIGGER audit_manifests
  AFTER INSERT OR UPDATE OR DELETE ON manifests
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Invoices
DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Exceptions
DROP TRIGGER IF EXISTS audit_exceptions ON exceptions;
CREATE TRIGGER audit_exceptions
  AFTER INSERT OR UPDATE OR DELETE ON exceptions
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Customers
DROP TRIGGER IF EXISTS audit_customers ON customers;
CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Staff
DROP TRIGGER IF EXISTS audit_staff ON staff;
CREATE TRIGGER audit_staff
  AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- ============================================================================
-- Verify triggers are created
-- ============================================================================
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname LIKE 'audit_%'
ORDER BY tgrelid::regclass::text;

-- ============================================================================
-- Usage Notes:
-- 
-- 1. Run this script in Supabase SQL Editor
-- 2. All INSERT, UPDATE, DELETE operations on the specified tables
--    will automatically create audit log entries
-- 3. The audit_logs table must exist (see docs/schema.sql)
-- 4. actor_staff_id is automatically determined from auth.uid()
-- ============================================================================
