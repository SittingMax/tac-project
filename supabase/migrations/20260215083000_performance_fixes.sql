-- Index foreign keys
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Optimize Bookings Policies
-- 1. Restrict "Users ..." to authenticated
-- 2. Use (select auth.uid()) cache

DO $$ 
BEGIN
    -- Users can insert their own bookings
    DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
    CREATE POLICY "Users can insert their own bookings"
        ON public.bookings FOR INSERT
        TO authenticated
        WITH CHECK ((select auth.uid()) = user_id);

    -- Users can view their own bookings
    DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
    CREATE POLICY "Users can view their own bookings"
        ON public.bookings FOR SELECT
        TO authenticated
        USING ((select auth.uid()) = user_id);

    -- Staff can view all bookings
    DROP POLICY IF EXISTS "Staff can view all bookings" ON public.bookings;
    CREATE POLICY "Staff can view all bookings"
        ON public.bookings FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.staff
                WHERE public.staff.auth_user_id = (select auth.uid())
                AND public.staff.role IN ('ADMIN', 'MANAGER', 'OPS', 'OPS_STAFF', 'SUPER_ADMIN')
            )
        );
END $$;
