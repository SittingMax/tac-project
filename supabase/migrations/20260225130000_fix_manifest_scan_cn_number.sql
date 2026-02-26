-- Fix manifest_add_shipment_by_scan: replace awb_number with cn_number
-- The shipments table column was renamed from awb_number to cn_number
-- but the RPC function was never updated.

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
  v_uppercased text;
  v_shipment record;
  v_manifest record;
  v_existing_item record;
  v_new_item_id uuid;
BEGIN
  -- Normalize scan token (remove spaces, hyphens, convert to uppercase)
  v_normalized := UPPER(REGEXP_REPLACE(p_scan_token, '[\s\-]', '', 'g'));
  -- Also keep an uppercased version with hyphens intact for exact matching
  v_uppercased := UPPER(TRIM(p_scan_token));
  
  -- Get manifest info
  SELECT * INTO v_manifest
  FROM public.manifests
  WHERE id = p_manifest_id AND org_id = p_org_id;
  
  IF v_manifest IS NULL THEN
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
  
  -- Find shipment by cn_number (exact match first, then normalized, then UUID)
  SELECT * INTO v_shipment
  FROM public.shipments
  WHERE org_id = p_org_id
    AND deleted_at IS NULL
    AND (
      cn_number = v_uppercased
      OR UPPER(REGEXP_REPLACE(cn_number, '[\s\-]', '', 'g')) = v_normalized
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
  
  -- Check if already in THIS manifest (idempotency)
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
      'cn_number', v_shipment.cn_number,
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
      'cn_number', v_shipment.cn_number
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
      'cn_number', v_shipment.cn_number
    );
  END IF;
  
  -- Validate status (if enabled)
  IF p_validate_status AND v_shipment.status NOT IN ('RECEIVED', 'CREATED', 'PICKED_UP', 'RECEIVED_AT_ORIGIN_HUB', 'RECEIVED_AT_ORIGIN') THEN
    INSERT INTO public.manifest_scan_logs 
      (org_id, manifest_id, shipment_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source, error_message)
    VALUES 
      (p_org_id, p_manifest_id, v_shipment.id, p_scan_token, v_normalized, 'WRONG_STATUS', p_staff_id, p_scan_source, 'Invalid shipment status: ' || v_shipment.status);
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_STATUS',
      'message', 'Shipment status is not eligible for manifesting: ' || v_shipment.status,
      'shipment_id', v_shipment.id,
      'cn_number', v_shipment.cn_number,
      'current_status', v_shipment.status
    );
  END IF;
  
  -- Insert manifest item
  BEGIN
    INSERT INTO public.manifest_items (org_id, manifest_id, shipment_id, scanned_by_staff_id, scanned_at)
    VALUES (p_org_id, p_manifest_id, v_shipment.id, p_staff_id, now())
    RETURNING id INTO v_new_item_id;
  EXCEPTION WHEN unique_violation THEN
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
      'cn_number', v_shipment.cn_number,
      'manifest_item_id', v_new_item_id
    );
  END;
  
  -- Log successful scan
  INSERT INTO public.manifest_scan_logs 
    (org_id, manifest_id, shipment_id, raw_scan_token, normalized_token, scan_result, scanned_by_staff_id, scan_source)
  VALUES 
    (p_org_id, p_manifest_id, v_shipment.id, p_scan_token, v_normalized, 'SUCCESS', p_staff_id, p_scan_source);
  
  -- Update totals
  PERFORM public.manifest_update_totals(p_manifest_id);

  -- Return success with shipment details
  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'message', 'Shipment added to manifest',
    'shipment_id', v_shipment.id,
    'cn_number', v_shipment.cn_number,
    'consignee_name', v_shipment.consignee_name,
    'consignor_name', v_shipment.consignor_name,
    'total_packages', v_shipment.package_count,
    'total_weight', v_shipment.total_weight,
    'manifest_item_id', v_new_item_id
  );
END;
$function$;
