-- ============================================================================
-- Migration 006: Manifest Enterprise Upgrade
-- Enterprise-grade manifest system with:
-- - Manifest number generation (like invoice numbering)
-- - Unique constraints for idempotency
-- - Performance indexes
-- - Scan audit logging
-- - Containerization support (ULD/Bag/Cage/Pallet)
-- - Extended status workflow
-- ============================================================================

-- ============================================================================
-- PART 1: Manifest Counters (Server-side Manifest Number Generation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.manifest_counters (
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  year integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, year)
);

ALTER TABLE public.manifest_counters ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.manifest_counters FROM PUBLIC;
REVOKE ALL ON TABLE public.manifest_counters FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.manifest_counters TO service_role;

DROP POLICY IF EXISTS "Service role manages manifest counters" ON public.manifest_counters;
CREATE POLICY "Service role manages manifest counters"
  ON public.manifest_counters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function: Generate manifest number (MAN-YYYY-0001)
CREATE OR REPLACE FUNCTION public.generate_manifest_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year integer := EXTRACT(YEAR FROM now())::integer;
  v_next integer;
BEGIN
  INSERT INTO public.manifest_counters (org_id, year, last_number)
  VALUES (p_org_id, v_year, 1)
  ON CONFLICT (org_id, year)
  DO UPDATE SET last_number = manifest_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'MAN-' || v_year::text || '-' || LPAD(v_next::text, 5, '0');
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_manifest_number(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_manifest_number(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_manifest_number(uuid) TO authenticated;

-- Trigger: set manifest_no before insert (if not provided)
CREATE OR REPLACE FUNCTION public.set_manifest_no()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.manifest_no IS NULL OR NEW.manifest_no = '' THEN
    NEW.manifest_no := public.generate_manifest_number(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_manifest_no() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_manifest_no() TO service_role;

DROP TRIGGER IF EXISTS set_manifest_no ON public.manifests;
CREATE TRIGGER set_manifest_no
  BEFORE INSERT ON public.manifests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_manifest_no();

-- ============================================================================
-- PART 2: Unique Constraints & Indexes for Idempotency
-- ============================================================================

-- Unique constraint: One shipment can only be in a manifest once
-- CRITICAL for idempotency - prevents duplicate scans from creating duplicates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'manifest_items_manifest_shipment_unique'
  ) THEN
    ALTER TABLE public.manifest_items
    ADD CONSTRAINT manifest_items_manifest_shipment_unique 
    UNIQUE (manifest_id, shipment_id);
  END IF;
END $$;

-- Unique constraint: Manifest numbers must be unique per org
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'manifests_org_manifest_no_unique'
  ) THEN
    ALTER TABLE public.manifests
    ADD CONSTRAINT manifests_org_manifest_no_unique 
    UNIQUE (org_id, manifest_no);
  END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_manifest_items_manifest_id 
  ON public.manifest_items(manifest_id);

CREATE INDEX IF NOT EXISTS idx_manifest_items_shipment_id 
  ON public.manifest_items(shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipments_awb_number 
  ON public.shipments(awb_number);

CREATE INDEX IF NOT EXISTS idx_shipments_awb_number_org 
  ON public.shipments(org_id, awb_number);

CREATE INDEX IF NOT EXISTS idx_manifests_created_at 
  ON public.manifests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifests_status 
  ON public.manifests(status);

CREATE INDEX IF NOT EXISTS idx_manifests_org_status 
  ON public.manifests(org_id, status);

-- ============================================================================
-- PART 3: Manifest Scan Audit Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.manifest_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  manifest_id uuid NOT NULL REFERENCES public.manifests(id) ON DELETE CASCADE,
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  raw_scan_token text NOT NULL,
  normalized_token text,
  scan_result text NOT NULL CHECK (scan_result IN ('SUCCESS', 'DUPLICATE', 'NOT_FOUND', 'INVALID', 'WRONG_DESTINATION', 'WRONG_STATUS', 'ALREADY_MANIFESTED')),
  scanned_by_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  scan_source text DEFAULT 'MANUAL' CHECK (scan_source IN ('CAMERA', 'MANUAL', 'BARCODE_SCANNER')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.manifest_scan_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_manifest_scan_logs_manifest_id 
  ON public.manifest_scan_logs(manifest_id);

CREATE INDEX IF NOT EXISTS idx_manifest_scan_logs_created_at 
  ON public.manifest_scan_logs(created_at DESC);

-- RLS for scan logs
DROP POLICY IF EXISTS "Users can view manifest scan logs" ON public.manifest_scan_logs;
CREATE POLICY "Users can view manifest scan logs"
  ON public.manifest_scan_logs FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Authorized users can insert scan logs" ON public.manifest_scan_logs;
CREATE POLICY "Authorized users can insert scan logs"
  ON public.manifest_scan_logs FOR INSERT
  TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- ============================================================================
-- PART 4: Containerization Tables (ULD/Bag/Cage/Pallet)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.manifest_containers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  manifest_id uuid NOT NULL REFERENCES public.manifests(id) ON DELETE CASCADE,
  container_type text NOT NULL CHECK (container_type IN ('ULD', 'BAG', 'CAGE', 'PALLET', 'OTHER')),
  container_number text NOT NULL,
  seal_number text,
  tare_weight numeric(10,2),
  gross_weight numeric(10,2),
  max_weight numeric(10,2),
  dimensions jsonb,
  notes text,
  created_by_staff_id uuid REFERENCES public.staff(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.manifest_containers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_manifest_containers_manifest_id 
  ON public.manifest_containers(manifest_id);

-- Unique container number per manifest
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'manifest_containers_manifest_container_unique'
  ) THEN
    ALTER TABLE public.manifest_containers
    ADD CONSTRAINT manifest_containers_manifest_container_unique 
    UNIQUE (manifest_id, container_number);
  END IF;
END $$;

-- Container items junction table
CREATE TABLE IF NOT EXISTS public.manifest_container_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  container_id uuid NOT NULL REFERENCES public.manifest_containers(id) ON DELETE CASCADE,
  manifest_item_id uuid NOT NULL REFERENCES public.manifest_items(id) ON DELETE CASCADE,
  loaded_at timestamptz DEFAULT now(),
  loaded_by_staff_id uuid REFERENCES public.staff(id)
);

ALTER TABLE public.manifest_container_items ENABLE ROW LEVEL SECURITY;

-- Unique: One manifest item can only be in one container
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'manifest_container_items_item_unique'
  ) THEN
    ALTER TABLE public.manifest_container_items
    ADD CONSTRAINT manifest_container_items_item_unique 
    UNIQUE (manifest_item_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_manifest_container_items_container_id 
  ON public.manifest_container_items(container_id);

-- RLS for containers
DROP POLICY IF EXISTS "Users can view manifest containers" ON public.manifest_containers;
CREATE POLICY "Users can view manifest containers"
  ON public.manifest_containers FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Authorized users can manage containers" ON public.manifest_containers;
CREATE POLICY "Authorized users can manage containers"
  ON public.manifest_containers FOR ALL
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF']))
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF']));

DROP POLICY IF EXISTS "Users can view container items" ON public.manifest_container_items;
CREATE POLICY "Users can view container items"
  ON public.manifest_container_items FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Authorized users can manage container items" ON public.manifest_container_items;
CREATE POLICY "Authorized users can manage container items"
  ON public.manifest_container_items FOR ALL
  TO authenticated
  USING (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF']))
  WITH CHECK (org_id = get_user_org_id() AND has_role(ARRAY['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF']));

-- ============================================================================
-- PART 5: Atomic Scan-to-Manifest RPC Function (Idempotent)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.manifest_add_shipment_by_scan(
  p_org_id uuid,
  p_manifest_id uuid,
  p_scan_token text,
  p_staff_id uuid DEFAULT NULL,
  p_scan_source text DEFAULT 'MANUAL',
  p_validate_destination boolean DEFAULT true,
  p_validate_status boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_normalized text;
  v_shipment record;
  v_manifest record;
  v_existing_item record;
  v_new_item_id uuid;
  v_result jsonb;
BEGIN
  -- Normalize scan token (remove spaces, hyphens, convert to uppercase)
  v_normalized := UPPER(REGEXP_REPLACE(p_scan_token, '[\s\-]', '', 'g'));
  
  -- Get manifest info
  SELECT * INTO v_manifest
  FROM public.manifests
  WHERE id = p_manifest_id AND org_id = p_org_id;
  
  IF v_manifest IS NULL THEN
    -- Log failed scan
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source, error_message)
    VALUES 
      (p_org_id, p_manifest_id, p_scan_token, v_normalized, 'INVALID', p_staff_id, p_scan_source, 'Manifest not found');
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'MANIFEST_NOT_FOUND',
      'message', 'Manifest not found or access denied'
    );
  END IF;
  
  -- Check manifest is in editable state
  IF v_manifest.status NOT IN ('OPEN', 'DRAFT', 'BUILDING') THEN
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source, error_message)
    VALUES 
      (p_org_id, p_manifest_id, p_scan_token, v_normalized, 'INVALID', p_staff_id, p_scan_source, 'Manifest is closed');
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'MANIFEST_CLOSED',
      'message', 'Cannot add items to a closed manifest'
    );
  END IF;
  
  -- Find shipment by AWB number, shipment ID, or normalized token
  SELECT * INTO v_shipment
  FROM public.shipments
  WHERE org_id = p_org_id
    AND deleted_at IS NULL
    AND (
      UPPER(REGEXP_REPLACE(awb_number, '[\s\-]', '', 'g')) = v_normalized
      OR id::text = p_scan_token
    )
  LIMIT 1;
  
  IF v_shipment IS NULL THEN
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source, error_message)
    VALUES 
      (p_org_id, p_manifest_id, p_scan_token, v_normalized, 'NOT_FOUND', p_staff_id, p_scan_source, 'Shipment not found');
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SHIPMENT_NOT_FOUND',
      'message', 'No shipment found matching: ' || p_scan_token
    );
  END IF;
  
  -- Check if already in THIS manifest (idempotency - return success for duplicate)
  SELECT * INTO v_existing_item
  FROM public.manifest_items
  WHERE manifest_id = p_manifest_id AND shipment_id = v_shipment.id;
  
  IF v_existing_item IS NOT NULL THEN
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, shipment_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source)
    VALUES 
      (p_org_id, p_manifest_id, v_shipment.id, p_scan_token, v_normalized, 'DUPLICATE', p_staff_id, p_scan_source);
    
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'message', 'Shipment already in manifest',
      'shipment_id', v_shipment.id,
      'awb_number', v_shipment.awb_number,
      'manifest_item_id', v_existing_item.id
    );
  END IF;
  
  -- Check if in another OPEN manifest
  IF EXISTS (
    SELECT 1 FROM public.manifest_items mi
    JOIN public.manifests m ON m.id = mi.manifest_id
    WHERE mi.shipment_id = v_shipment.id
      AND m.status IN ('OPEN', 'DRAFT', 'BUILDING')
      AND m.id != p_manifest_id
  ) THEN
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, shipment_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source, error_message)
    VALUES 
      (p_org_id, p_manifest_id, v_shipment.id, p_scan_token, v_normalized, 'ALREADY_MANIFESTED', p_staff_id, p_scan_source, 'Shipment is in another open manifest');
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_IN_MANIFEST',
      'message', 'Shipment is already in another open manifest',
      'shipment_id', v_shipment.id,
      'awb_number', v_shipment.awb_number
    );
  END IF;
  
  -- Validate destination matches (if enabled)
  IF p_validate_destination AND v_shipment.destination_hub_id != v_manifest.to_hub_id THEN
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, shipment_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source, error_message)
    VALUES 
      (p_org_id, p_manifest_id, v_shipment.id, p_scan_token, v_normalized, 'WRONG_DESTINATION', p_staff_id, p_scan_source, 'Destination mismatch');
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DESTINATION_MISMATCH',
      'message', 'Shipment routes to ' || COALESCE((SELECT code FROM public.hubs WHERE id = v_shipment.destination_hub_id), 'UNKNOWN') || ' but manifest goes to ' || COALESCE((SELECT code FROM public.hubs WHERE id = v_manifest.to_hub_id), 'UNKNOWN'),
      'shipment_id', v_shipment.id,
      'awb_number', v_shipment.awb_number
    );
  END IF;
  
  -- Validate status (if enabled) - shipment should be RECEIVED or READY
  IF p_validate_status AND v_shipment.status NOT IN ('RECEIVED', 'CREATED', 'PICKED_UP', 'RECEIVED_AT_ORIGIN_HUB') THEN
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, shipment_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source, error_message)
    VALUES 
      (p_org_id, p_manifest_id, v_shipment.id, p_scan_token, v_normalized, 'WRONG_STATUS', p_staff_id, p_scan_source, 'Invalid shipment status: ' || v_shipment.status);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_STATUS',
      'message', 'Shipment status is not eligible for manifesting: ' || v_shipment.status,
      'shipment_id', v_shipment.id,
      'awb_number', v_shipment.awb_number,
      'current_status', v_shipment.status
    );
  END IF;
  
  -- Insert manifest item (atomic, will fail on duplicate due to unique constraint)
  BEGIN
    INSERT INTO public.manifest_items (org_id, manifest_id, shipment_id, scanned_by_staff_id, scanned_at)
    VALUES (p_org_id, p_manifest_id, v_shipment.id, p_staff_id, now())
    RETURNING id INTO v_new_item_id;
  EXCEPTION WHEN unique_violation THEN
    -- Race condition: another concurrent insert succeeded
    SELECT id INTO v_new_item_id
    FROM public.manifest_items
    WHERE manifest_id = p_manifest_id AND shipment_id = v_shipment.id;
    
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, shipment_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source)
    VALUES 
      (p_org_id, p_manifest_id, v_shipment.id, p_scan_token, v_normalized, 'DUPLICATE', p_staff_id, p_scan_source);
    
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'message', 'Shipment already in manifest (concurrent)',
      'shipment_id', v_shipment.id,
      'awb_number', v_shipment.awb_number,
      'manifest_item_id', v_new_item_id
    );
  END;
  
  -- Log successful scan
  INSERT INTO public.manifest_scan_logs 
    (org_id, manifest_id, shipment_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source)
  VALUES 
    (p_org_id, p_manifest_id, v_shipment.id, p_scan_token, v_normalized, 'SUCCESS', p_staff_id, p_scan_source);
  
  -- Return success with shipment details
  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'message', 'Shipment added to manifest',
    'shipment_id', v_shipment.id,
    'awb_number', v_shipment.awb_number,
    'consignee_name', v_shipment.receiver_name,
    'consignor_name', v_shipment.sender_name,
    'total_packages', v_shipment.total_packages,
    'total_weight', v_shipment.total_weight,
    'manifest_item_id', v_new_item_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.manifest_add_shipment_by_scan(uuid, uuid, text, uuid, text, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manifest_add_shipment_by_scan(uuid, uuid, text, uuid, text, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manifest_add_shipment_by_scan(uuid, uuid, text, uuid, text, boolean, boolean) TO service_role;

-- ============================================================================
-- PART 6: Remove Manifest Item RPC (with audit)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.manifest_remove_item(
  p_org_id uuid,
  p_manifest_id uuid,
  p_shipment_id uuid,
  p_staff_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_manifest record;
  v_item record;
BEGIN
  -- Get manifest info
  SELECT * INTO v_manifest
  FROM public.manifests
  WHERE id = p_manifest_id AND org_id = p_org_id;
  
  IF v_manifest IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'MANIFEST_NOT_FOUND',
      'message', 'Manifest not found or access denied'
    );
  END IF;
  
  -- Check manifest is in editable state
  IF v_manifest.status NOT IN ('OPEN', 'DRAFT', 'BUILDING') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'MANIFEST_CLOSED',
      'message', 'Cannot remove items from a closed manifest'
    );
  END IF;
  
  -- Find and delete item
  DELETE FROM public.manifest_items
  WHERE manifest_id = p_manifest_id AND shipment_id = p_shipment_id
  RETURNING * INTO v_item;
  
  IF v_item IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ITEM_NOT_FOUND',
      'message', 'Shipment not found in manifest'
    );
  END IF;
  
  -- Log removal in audit
  INSERT INTO public.audit_logs (org_id, actor_staff_id, action, entity_type, entity_id, before, after)
  VALUES (
    p_org_id,
    p_staff_id,
    'MANIFEST_ITEM_REMOVED',
    'manifest_items',
    v_item.id,
    jsonb_build_object('manifest_id', p_manifest_id, 'shipment_id', p_shipment_id),
    NULL
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Shipment removed from manifest',
    'shipment_id', p_shipment_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.manifest_remove_item(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manifest_remove_item(uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manifest_remove_item(uuid, uuid, uuid, uuid) TO service_role;

-- ============================================================================
-- PART 7: Add extended fields to manifests table if not exists
-- ============================================================================

DO $$ 
BEGIN
  -- Add flight_date column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'flight_date') THEN
    ALTER TABLE public.manifests ADD COLUMN flight_date date;
  END IF;
  
  -- Add flight_number column if not exists (separate from vehicle_meta)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'flight_number') THEN
    ALTER TABLE public.manifests ADD COLUMN flight_number text;
  END IF;
  
  -- Add airline_code column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'airline_code') THEN
    ALTER TABLE public.manifests ADD COLUMN airline_code text;
  END IF;
  
  -- Add etd column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'etd') THEN
    ALTER TABLE public.manifests ADD COLUMN etd timestamptz;
  END IF;
  
  -- Add eta column if not exists  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'eta') THEN
    ALTER TABLE public.manifests ADD COLUMN eta timestamptz;
  END IF;
  
  -- Add dispatch_at column for TRUCK
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'dispatch_at') THEN
    ALTER TABLE public.manifests ADD COLUMN dispatch_at timestamptz;
  END IF;
  
  -- Add notes column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'notes') THEN
    ALTER TABLE public.manifests ADD COLUMN notes text;
  END IF;

  -- Add reconciled_at column for RECONCILED status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'reconciled_at') THEN
    ALTER TABLE public.manifests ADD COLUMN reconciled_at timestamptz;
  END IF;
  
  -- Add reconciled_by_staff_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'manifests' AND column_name = 'reconciled_by_staff_id') THEN
    ALTER TABLE public.manifests ADD COLUMN reconciled_by_staff_id uuid REFERENCES public.staff(id);
  END IF;
END $$;

-- ============================================================================
-- PART 8: Update manifest totals function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.manifest_update_totals(p_manifest_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_totals record;
BEGIN
  SELECT 
    COUNT(DISTINCT mi.shipment_id) as total_shipments,
    COALESCE(SUM(s.total_packages), 0) as total_packages,
    COALESCE(SUM(s.total_weight), 0) as total_weight
  INTO v_totals
  FROM public.manifest_items mi
  JOIN public.shipments s ON s.id = mi.shipment_id
  WHERE mi.manifest_id = p_manifest_id;
  
  UPDATE public.manifests
  SET 
    total_shipments = v_totals.total_shipments,
    total_packages = v_totals.total_packages,
    total_weight = v_totals.total_weight,
    updated_at = now()
  WHERE id = p_manifest_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.manifest_update_totals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manifest_update_totals(uuid) TO service_role;

-- ============================================================================
-- PART 9: Status transition validation check constraint
-- ============================================================================

-- Note: We use application-level validation for complex status transitions
-- but add a simple check constraint for valid status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'manifests_status_check'
  ) THEN
    ALTER TABLE public.manifests
    ADD CONSTRAINT manifests_status_check 
    CHECK (status IN ('DRAFT', 'OPEN', 'BUILDING', 'CLOSED', 'DEPARTED', 'ARRIVED', 'RECONCILED'));
  END IF;
EXCEPTION 
  WHEN check_violation THEN
    -- If existing data violates, update OPEN to be valid
    UPDATE public.manifests SET status = 'OPEN' WHERE status NOT IN ('DRAFT', 'OPEN', 'BUILDING', 'CLOSED', 'DEPARTED', 'ARRIVED', 'RECONCILED');
    ALTER TABLE public.manifests
    ADD CONSTRAINT manifests_status_check 
    CHECK (status IN ('DRAFT', 'OPEN', 'BUILDING', 'CLOSED', 'DEPARTED', 'ARRIVED', 'RECONCILED'));
END $$;

-- ============================================================================
-- PART 10: Grant permissions
-- ============================================================================

GRANT SELECT ON TABLE public.manifest_scan_logs TO authenticated;
GRANT INSERT ON TABLE public.manifest_scan_logs TO authenticated;
GRANT SELECT ON TABLE public.manifest_containers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.manifest_containers TO authenticated;
GRANT SELECT ON TABLE public.manifest_container_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.manifest_container_items TO authenticated;

