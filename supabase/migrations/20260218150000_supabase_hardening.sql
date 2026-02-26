ALTER VIEW public.public_shipment_tracking SET (security_invoker = true);

ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage booking rate limits" ON public.booking_rate_limits;
CREATE POLICY "Service role can manage booking rate limits"
ON public.booking_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

ALTER FUNCTION public.check_booking_rate_limit(text, integer, integer) SET search_path = public, extensions;
ALTER FUNCTION public.enforce_booking_rate_limit() SET search_path = public, extensions;
ALTER FUNCTION public.cleanup_old_booking_rate_limits() SET search_path = public, extensions;

DROP POLICY IF EXISTS "Staff can manage tracking events" ON public.tracking_events;
CREATE POLICY "Staff can manage tracking events"
ON public.tracking_events
FOR ALL
TO authenticated
USING (
  org_id IN (
    SELECT staff.org_id
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Staff can view contact messages" ON public.contact_messages;
CREATE POLICY "Staff can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (
  (SELECT staff.role FROM staff WHERE staff.auth_user_id = (select auth.uid()))
  = ANY (ARRAY['SUPER_ADMIN','ADMIN'])
)
WITH CHECK (
  (SELECT staff.role FROM staff WHERE staff.auth_user_id = (select auth.uid()))
  = ANY (ARRAY['SUPER_ADMIN','ADMIN'])
);

DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (
  (SELECT staff.role FROM staff WHERE staff.auth_user_id = (select auth.uid()))
  = ANY (ARRAY['SUPER_ADMIN','ADMIN'])
);
