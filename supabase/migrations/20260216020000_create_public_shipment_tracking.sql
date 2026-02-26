-- Create public shipment tracking view for anonymous tracking
-- SECURITY: Only exposes non-PII data for public tracking
-- Excludes: receiver_name, receiver_phone, receiver_address, sender_name, sender_phone,
--           declared_value, insurance_value, freight_amount, payment_mode, notes

CREATE OR REPLACE VIEW public.public_shipment_tracking AS
SELECT
    s.id,
    s.awb_number,
    s.status,
    s.mode,
    s.service_level,
    s.package_count,
    s.total_weight,
    s.origin_hub_id,
    s.destination_hub_id,
    s.created_at,
    s.updated_at
    -- Explicitly EXCLUDE all PII fields:
    -- receiver_name, receiver_phone, receiver_address
    -- sender_name, sender_phone, sender_address
    -- declared_value, insurance_value, freight_amount
    -- payment_mode, cod_amount, special_instructions, notes
FROM public.shipments s
WHERE s.deleted_at IS NULL
  AND s.status NOT IN ('CANCELLED', 'DRAFT');

-- Grant public access (anon + authenticated)
GRANT SELECT ON public.public_shipment_tracking TO anon;
GRANT SELECT ON public.public_shipment_tracking TO authenticated;

-- Create index for fast AWB lookups on public tracking
CREATE INDEX IF NOT EXISTS idx_public_tracking_awb 
ON public.shipments(awb_number) 
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON VIEW public.public_shipment_tracking IS 
'Public view for anonymous shipment tracking. Only exposes non-PII data.';
