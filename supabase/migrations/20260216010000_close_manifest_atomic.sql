-- Atomic manifest close RPC
-- Ensures manifest status update, shipment updates, and tracking events are committed together.
-- SECURITY: Verifies staff ownership before allowing operation

CREATE OR REPLACE FUNCTION public.close_manifest_atomic(
  p_manifest_id uuid,
  p_staff_id uuid,
  p_org_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  manifest_id uuid,
  manifest_no text,
  total_shipments integer,
  total_packages integer,
  total_weight numeric,
  shipments_updated integer,
  tracking_events_created integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manifest manifests%ROWTYPE;
  v_now timestamptz := now();
  v_total_shipments integer := 0;
  v_total_packages integer := 0;
  v_total_weight numeric := 0;
  v_shipments_updated integer := 0;
  v_tracking_events_created integer := 0;
  v_auth_user_id uuid;
BEGIN
  -- SECURITY: Verify the authenticated user owns the staff record
  v_auth_user_id := auth.uid();
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No authenticated user';
  END IF;
  
  -- Verify staff record belongs to the authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM staff 
    WHERE id = p_staff_id 
      AND auth_user_id = v_auth_user_id
      AND org_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Staff validation failed';
  END IF;

  SELECT *
  INTO v_manifest
  FROM public.manifests
  WHERE id = p_manifest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manifest not found';
  END IF;

  IF v_manifest.org_id <> p_org_id THEN
    RAISE EXCEPTION 'Unauthorized: Org mismatch';
  END IF;

  IF v_manifest.status <> 'OPEN' THEN
    RAISE EXCEPTION
      'Cannot close manifest with status "%". Only OPEN manifests can be closed.',
      v_manifest.status;
  END IF;

  WITH manifest_shipments AS (
    SELECT
      s.id,
      s.awb_number,
      COALESCE(s.package_count, 0) AS package_count,
      COALESCE(s.total_weight, 0) AS total_weight
    FROM public.manifest_items mi
    JOIN public.shipments s ON s.id = mi.shipment_id
    WHERE mi.manifest_id = p_manifest_id
  )
  SELECT
    COUNT(*),
    COALESCE(SUM(package_count), 0),
    COALESCE(SUM(total_weight), 0)
  INTO
    v_total_shipments,
    v_total_packages,
    v_total_weight
  FROM manifest_shipments;

  UPDATE public.manifests
  SET
    status = 'CLOSED',
    total_shipments = v_total_shipments,
    total_packages = v_total_packages,
    total_weight = v_total_weight,
    closed_at = v_now,
    closed_by_staff_id = p_staff_id,
    notes = COALESCE(p_notes, notes),
    updated_at = v_now
  WHERE id = p_manifest_id;

  UPDATE public.shipments
  SET
    status = 'IN_TRANSIT',
    manifest_id = p_manifest_id,
    updated_at = v_now
  WHERE id IN (
    SELECT mi.shipment_id
    FROM public.manifest_items mi
    WHERE mi.manifest_id = p_manifest_id
  );

  GET DIAGNOSTICS v_shipments_updated = ROW_COUNT;

  INSERT INTO public.tracking_events (
    org_id,
    shipment_id,
    awb_number,
    event_code,
    event_time,
    hub_id,
    actor_staff_id,
    source,
    meta,
    description
  )
  SELECT
    v_manifest.org_id,
    s.id,
    s.awb_number,
    'IN_TRANSIT',
    v_now,
    v_manifest.from_hub_id,
    p_staff_id,
    'SYSTEM',
    jsonb_build_object(
      'manifest_id', p_manifest_id,
      'manifest_no', v_manifest.manifest_no,
      'action', 'MANIFEST_CLOSED'
    ),
    'Manifest ' || v_manifest.manifest_no || ' closed'
  FROM public.shipments s
  WHERE s.id IN (
    SELECT mi.shipment_id
    FROM public.manifest_items mi
    WHERE mi.manifest_id = p_manifest_id
  );

  GET DIAGNOSTICS v_tracking_events_created = ROW_COUNT;

  RETURN QUERY
  SELECT
    p_manifest_id,
    v_manifest.manifest_no,
    v_total_shipments,
    v_total_packages,
    v_total_weight,
    v_shipments_updated,
    v_tracking_events_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_manifest_atomic(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_manifest_atomic(uuid, uuid, uuid, text) TO service_role;
