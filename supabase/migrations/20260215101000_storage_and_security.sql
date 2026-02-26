-- Create shipment-docs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-docs', 'shipment-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects (storage.objects table) if not already enabled
-- Note: storage.objects usually has RLS enabled by default.

-- Policy: Public can view (download) shipment docs matching their own uploads? 
-- Actually, getPublicUrl works if the bucket is public.
-- But we need policy for INSERT.

-- Policy: Public (anon) can upload files to shipment-docs
DROP POLICY IF EXISTS "Public can upload shipment docs" ON storage.objects;
CREATE POLICY "Public can upload shipment docs" ON storage.objects
    FOR INSERT
    TO anon
    WITH CHECK (
        bucket_id = 'shipment-docs'
        AND (storage.foldername(name))[1] = 'public-bookings'
    );

-- Policy: Public/Anon can SELECT their own files? Or just rely on public URL?
-- If bucket is public, they can GET by URL.
-- But storage.objects SELECT policy might be needed if they want to list?
-- BookingForm doesn't list. It just uploads and gets public URL.
-- So INSERT is the main one.

-- Policy: Staff can do everything with shipment-docs
DROP POLICY IF EXISTS "Staff can manage shipment docs" ON storage.objects;
CREATE POLICY "Staff can manage shipment docs" ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'shipment-docs' AND (
        EXISTS (
            SELECT 1 FROM public.staff 
            WHERE auth_user_id = auth.uid()
        )
    ));

-- Harden contact_messages RLS
-- Existing: "Authenticated users can view contact messages" USING (true)
-- Change to: Only staff/admins can view.

DROP POLICY IF EXISTS "Authenticated users can view contact messages" ON public.contact_messages;
CREATE POLICY "Staff can view contact messages" ON public.contact_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.staff 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Also fix "Admins can delete/update" to use specific role checks more efficiently if possible, 
-- but the subquery is standard pattern.
-- The advisor warning was about "Auth RLS Init Plan". 
-- (select auth.uid()) is stable. 
-- Using a security definer function for checking role is better for performance but more complex to setup now.
-- We will stick to the standard pattern but restricted to Staff.
