-- ============================================================================
-- Migration 005: Invoice RLS updates + Audit Log Fix
-- Align finance role access with INVOICE alias and fix audit log trigger payloads.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Finance role alignment (INVOICE + FINANCE_STAFF)
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Finance users can create invoices" ON public.invoices;
CREATE POLICY "Finance users can create invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = get_user_org_id()
    AND has_role(ARRAY['ADMIN', 'MANAGER', 'FINANCE_STAFF', 'INVOICE'])
  );

DROP POLICY IF EXISTS "Finance users can update invoices" ON public.invoices;
CREATE POLICY "Finance users can update invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (
    org_id = get_user_org_id()
    AND has_role(ARRAY['ADMIN', 'MANAGER', 'FINANCE_STAFF', 'INVOICE'])
  );

DROP POLICY IF EXISTS "Authorized users can create customers" ON public.customers;
CREATE POLICY "Authorized users can create customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = get_user_org_id()
    AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS_STAFF', 'FINANCE_STAFF', 'INVOICE'])
  );

DROP POLICY IF EXISTS "Authorized users can update customers" ON public.customers;
CREATE POLICY "Authorized users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (
    org_id = get_user_org_id()
    AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS_STAFF', 'FINANCE_STAFF', 'INVOICE'])
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'invoice_items'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Finance users can manage invoice items" ON public.invoice_items';
    EXECUTE 'CREATE POLICY "Finance users can manage invoice items"'
      || ' ON public.invoice_items FOR ALL'
      || ' TO authenticated'
      || ' USING ('
      || '   EXISTS ('
      || '     SELECT 1 FROM invoices i'
      || '     WHERE i.id = invoice_items.invoice_id'
      || '     AND i.org_id = get_user_org_id()'
      || '   )'
      || '   AND has_role(ARRAY[''ADMIN'', ''MANAGER'', ''FINANCE_STAFF'', ''INVOICE''])'
      || ' )';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- Audit log trigger fix (correct column names + non-blocking errors)
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_staff_id uuid;
BEGIN
  SELECT id INTO v_actor_staff_id
  FROM staff
  WHERE auth_user_id = auth.uid();

  INSERT INTO audit_logs (
    org_id,
    actor_staff_id,
    action,
    entity_type,
    entity_id,
    before,
    after
  )
  VALUES (
    COALESCE(NEW.org_id, OLD.org_id),
    v_actor_staff_id,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Audit log failed: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS audit_shipments ON public.shipments;
CREATE TRIGGER audit_shipments
  AFTER INSERT OR UPDATE OR DELETE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

DROP TRIGGER IF EXISTS audit_manifests ON public.manifests;
CREATE TRIGGER audit_manifests
  AFTER INSERT OR UPDATE OR DELETE ON public.manifests
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

DROP TRIGGER IF EXISTS audit_exceptions ON public.exceptions;
CREATE TRIGGER audit_exceptions
  AFTER INSERT OR UPDATE OR DELETE ON public.exceptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();
