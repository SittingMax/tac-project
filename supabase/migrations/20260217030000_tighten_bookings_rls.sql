-- Tighten bookings RLS: split anon vs authenticated insert policies
-- Previous policy "Anyone can create pending bookings" used TO public WITH CHECK (status = 'PENDING')
-- which allows authenticated users to spoof user_id of other users.

DROP POLICY IF EXISTS "Anyone can create pending bookings" ON public.bookings;

-- Anon: must be PENDING and user_id must be NULL (no spoofing)
CREATE POLICY "Anon can create pending bookings"
ON public.bookings FOR INSERT
TO anon
WITH CHECK (status = 'PENDING' AND user_id IS NULL);

-- Authenticated: must be PENDING and user_id must match the caller
CREATE POLICY "Authenticated can create own pending bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (status = 'PENDING' AND (user_id IS NULL OR user_id = auth.uid()));
