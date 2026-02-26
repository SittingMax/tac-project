-- Atomic manifest depart RPC
-- Ensures manifest status update, shipment updates, and tracking events are committed together

CREATE OR REPLACE FUNCTION public.depart_manifest_atomic(
  p_manifest_id uuid,
  p_staff_id uuid,
  p_org_id uuid
)
RETURNS TABLE (
  manifest_id uuid,
  manifest_no text,
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
  IF p_staff_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM staff 
    WHERE id = p_staff_id 
      AND auth_user_id = v_auth_user_id
      AND org_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Staff validation failed';
  END IF;

  -- Lock and validate manifest
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

  IF v_manifest.status <> 'CLOSED' THEN
    RAISE EXCEPTION
      'Cannot depart manifest with status "%". Only CLOSED manifests can depart.',
      v_manifest.status;
  END IF;

  -- Update manifest status to DEPARTED
  UPDATE public.manifests
  SET
    status = 'DEPARTED',
    departed_at = v_now,
    departed_by_staff_id = p_staff_id,
    updated_at = v_now
  WHERE id = p_manifest_id;

  -- Update all shipments in manifest to IN_TRANSIT
  UPDATE public.shipments
  SET
    status = 'IN_TRANSIT',
    updated_at = v_now
  WHERE id IN (
    SELECT mi.shipment_id
    FROM public.manifest_items mi
    WHERE mi.manifest_id = p_manifest_id
  );

  GET DIAGNOSTICS v_shipments_updated = ROW_COUNT;

  -- Create tracking events for all shipments
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
    'DEPARTED',
    v_now,
    v_manifest.from_hub_id,
    p_staff_id,
    'SYSTEM',
    jsonb_build_object(
      'manifest_id', p_manifest_id,
      'manifest_no', v_manifest.manifest_no,
      'action', 'MANIFEST_DEPARTED'
    ),
    'Manifest ' || v_manifest.manifest_no || ' departed from origin'
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
    v_shipments_updated,
    v_tracking_events_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.depart_manifest_atomic(uuid, uuid, uuid) TO authenticated;

-- Atomic manifest arrive RPC
-- Ensures manifest status update, shipment updates, and tracking events are committed together

CREATE OR REPLACE FUNCTION public.arrive_manifest_atomic(
  p_manifest_id uuid,
  p_staff_id uuid,
  p_org_id uuid
)
RETURNS TABLE (
  manifest_id uuid,
  manifest_no text,
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
  IF p_staff_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM staff 
    WHERE id = p_staff_id 
      AND auth_user_id = v_auth_user_id
      AND org_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Staff validation failed';
  END IF;

  -- Lock and validate manifest
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

  IF v_manifest.status <> 'DEPARTED' THEN
    RAISE EXCEPTION
      'Cannot arrive manifest with status "%". Only DEPARTED manifests can arrive.',
      v_manifest.status;
  END IF;

  -- Update manifest status to ARRIVED
  UPDATE public.manifests
  SET
    status = 'ARRIVED',
    arrived_at = v_now,
    arrived_by_staff_id = p_staff_id,
    updated_at = v_now
  WHERE id = p_manifest_id;

  -- Update all shipments in manifest to RECEIVED_AT_DEST
  UPDATE public.shipments
  SET
    status = 'RECEIVED_AT_DEST',
    updated_at = v_now
  WHERE id IN (
    SELECT mi.shipment_id
    FROM public.manifest_items mi
    WHERE mi.manifest_id = p_manifest_id
  );

  GET DIAGNOSTICS v_shipments_updated = ROW_COUNT;

  -- Create tracking events for all shipments
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
    'ARRIVED',
    v_now,
    v_manifest.to_hub_id,
    p_staff_id,
    'SYSTEM',
    jsonb_build_object(
      'manifest_id', p_manifest_id,
      'manifest_no', v_manifest.manifest_no,
      'action', 'MANIFEST_ARRIVED'
    ),
    'Manifest ' || v_manifest.manifest_no || ' arrived at destination'
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
    v_shipments_updated,
    v_tracking_events_created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arrive_manifest_atomic(uuid, uuid, uuid) TO authenticated;
