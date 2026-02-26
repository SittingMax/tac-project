-- Move pg_trgm to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Add indexes for unindexed foreign keys to improve performance
CREATE INDEX IF NOT EXISTS idx_staff_hub_id ON public.staff(hub_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON public.shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_packages_org_id ON public.packages(org_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_shipment_id ON public.exceptions(shipment_id);
CREATE INDEX IF NOT EXISTS idx_manifest_scan_logs_org_id ON public.manifest_scan_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_manifest_scan_logs_manifest_id ON public.manifest_scan_logs(manifest_id);
CREATE INDEX IF NOT EXISTS idx_manifest_scan_logs_shipment_id ON public.manifest_scan_logs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_manifest_containers_org_id ON public.manifest_containers(org_id);
CREATE INDEX IF NOT EXISTS idx_manifest_container_items_org_id ON public.manifest_container_items(org_id);
CREATE INDEX IF NOT EXISTS idx_manifest_container_items_container_id ON public.manifest_container_items(container_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_code ON public.role_permissions(permission_code);

-- Ensure shipment-docs bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-docs', 'shipment-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects if not already enabled (it usually is)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public uploads to shipment-docs (for booking form)
-- We drop existing policy if it exists to ensure freshness or avoid conflict if name differs
DROP POLICY IF EXISTS "Public can upload shipment docs" ON storage.objects;
CREATE POLICY "Public can upload shipment docs"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'shipment-docs');

-- Allow public read of shipment docs (optional, but good for verification/display if needed)
DROP POLICY IF EXISTS "Public can read shipment docs" ON storage.objects;
CREATE POLICY "Public can read shipment docs"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'shipment-docs');
