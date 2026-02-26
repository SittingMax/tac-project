-- Fix Bookings RLS to allow authenticated users (e.g. admins testing landing page) to create bookings
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;

-- Allow anyone (anon + authenticated) to create bookings as long as status is PENDING
CREATE POLICY "Anyone can create pending bookings"
ON public.bookings FOR INSERT
TO public
WITH CHECK (status = 'PENDING');

-- Create RPC for Public Tracking (Bypassing RLS safely)
-- SECURITY: Only exposes non-PII data for public tracking
CREATE OR REPLACE FUNCTION get_public_shipment_by_awb(awb_code text)
RETURNS TABLE (
  id uuid,
  awb_number text,
  status text,
  mode text,
  origin_hub_code text,
  origin_hub_name text,
  destination_hub_code text,
  destination_hub_name text,
  events jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.awb_number,
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
  WHERE s.awb_number = awb_code
    AND s.deleted_at IS NULL
    AND s.status NOT IN ('CANCELLED', 'DRAFT');  -- Exclude sensitive statuses
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_shipment_by_awb(text) TO anon, authenticated;
