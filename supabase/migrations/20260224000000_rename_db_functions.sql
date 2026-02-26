-- New function generate_cn_number matching the original logic but generating CN number format
CREATE OR REPLACE FUNCTION public.generate_cn_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  v_year text;
  v_sequence int;
  v_cn text;
BEGIN
  v_year := to_char(now(), 'YYYY');
  
  -- Get next sequence number for this org/year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(cn_number FROM 8 FOR 4) AS integer) -- Adjust substring extraction according to format 'CN-YYYY-XXXX'
  ), 0) + 1
  INTO v_sequence
  FROM public.shipments
  WHERE org_id = p_org_id
    AND cn_number LIKE 'CN-' || v_year || '-%';
  
  v_cn := 'CN-' || v_year || '-' || LPAD(v_sequence::text, 4, '0');
  
  RETURN v_cn;
END;
$function$;

-- Update get_public_shipment_by_cn matching the original logic
CREATE OR REPLACE FUNCTION public.get_public_shipment_by_cn(cn_code text)
RETURNS TABLE(id uuid, cn_number text, status text, mode text, origin_hub_code text, origin_hub_name text, destination_hub_code text, destination_hub_name text, events jsonb)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.cn_number,
    s.status,
    s.mode,
    h_origin.code as origin_hub_code,
    h_origin.name as origin_hub_name,
    h_dest.code as destination_hub_code,
    h_dest.name as destination_hub_name,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'status', te.event_code, 
          'created_at', te.created_at
          -- REMOVED: 'description', te.notes - PII risk, staff may enter sensitive info
        ) ORDER BY te.created_at DESC)
        FROM tracking_events te
        WHERE te.shipment_id = s.id
      ),
      '[]'::jsonb
    ) as events
  FROM shipments s
  LEFT JOIN hubs h_origin ON s.origin_hub_id = h_origin.id
  LEFT JOIN hubs h_dest ON s.destination_hub_id = h_dest.id
  WHERE s.cn_number = cn_code
    AND s.deleted_at IS NULL
    AND s.status NOT IN ('CANCELLED', 'DRAFT');
END;
$function$;

-- Drop the old AWB functions
DROP FUNCTION IF EXISTS public.generate_awb_number(uuid);
DROP FUNCTION IF EXISTS public.generate_awb_number();
DROP FUNCTION IF EXISTS public.get_public_shipment_by_awb(text);
