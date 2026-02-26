DROP POLICY IF EXISTS "Public can insert contact messages" ON public.contact_messages;
CREATE POLICY "Public can insert contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (
  length(trim(name)) > 0
  AND length(trim(name)) <= 200
  AND length(trim(message)) > 0
  AND length(trim(message)) <= 2000
  AND (email IS NULL OR length(trim(email)) <= 320)
  AND (phone IS NULL OR length(trim(phone)) <= 40)
  AND coalesce(status, 'unread') = 'unread'
  AND coalesce(archived, false) = false
  AND coalesce(replied, false) = false
);

DROP POLICY IF EXISTS "Anyone can create pending bookings" ON public.bookings;
CREATE POLICY "Anyone can create pending bookings"
ON public.bookings
FOR INSERT
TO anon
WITH CHECK (
  status = 'PENDING'
  AND user_id IS NULL
);

DROP POLICY IF EXISTS "Org admins can modify their org" ON public.orgs;
DROP POLICY IF EXISTS "Super Admin can manage orgs" ON public.orgs;
DROP POLICY IF EXISTS "Authenticated users can view orgs" ON public.orgs;
CREATE POLICY "Authenticated users can view orgs"
ON public.orgs
FOR SELECT
TO public
USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Org admins can update orgs"
ON public.orgs
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT staff.org_id
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
      AND staff.role = ANY (ARRAY['ADMIN','MANAGER'])
  )
  OR (
    SELECT staff.role
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
    LIMIT 1
  ) = 'SUPER_ADMIN'
)
WITH CHECK (
  id IN (
    SELECT staff.org_id
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
      AND staff.role = ANY (ARRAY['ADMIN','MANAGER'])
  )
  OR (
    SELECT staff.role
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
    LIMIT 1
  ) = 'SUPER_ADMIN'
);

CREATE POLICY "Org admins can delete orgs"
ON public.orgs
FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT staff.org_id
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
      AND staff.role = ANY (ARRAY['ADMIN','MANAGER'])
  )
  OR (
    SELECT staff.role
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
    LIMIT 1
  ) = 'SUPER_ADMIN'
);

CREATE POLICY "Super admin can insert orgs"
ON public.orgs
FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT staff.role
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
    LIMIT 1
  ) = 'SUPER_ADMIN'
);

DROP POLICY IF EXISTS "Staff org-scoped modify" ON public.staff;
DROP POLICY IF EXISTS "Users can view own staff profile" ON public.staff;
CREATE POLICY "Staff can view staff org-scoped or own"
ON public.staff
FOR SELECT
TO authenticated
USING (
  org_id = get_current_org_id()
  OR auth_user_id = (select auth.uid())
);

CREATE POLICY "Staff can insert staff org-scoped"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_current_org_id());

CREATE POLICY "Staff can update staff org-scoped"
ON public.staff
FOR UPDATE
TO authenticated
USING (org_id = get_current_org_id())
WITH CHECK (org_id = get_current_org_id());

CREATE POLICY "Staff can delete staff org-scoped"
ON public.staff
FOR DELETE
TO authenticated
USING (org_id = get_current_org_id());

DROP POLICY IF EXISTS "Shipments org-scoped delete" ON public.shipments;
DROP POLICY IF EXISTS "Super Admin can delete shipments" ON public.shipments;
CREATE POLICY "Shipments org-scoped delete"
ON public.shipments
FOR DELETE
TO authenticated
USING (
  org_id = get_current_org_id()
  OR (
    SELECT staff.role
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
    LIMIT 1
  ) = 'SUPER_ADMIN'
);

DROP POLICY IF EXISTS "Staff can manage tracking events" ON public.tracking_events;
DROP POLICY IF EXISTS "Tracking events org-scoped insert" ON public.tracking_events;
DROP POLICY IF EXISTS "Tracking events org-scoped update" ON public.tracking_events;
DROP POLICY IF EXISTS "Tracking events org-scoped delete" ON public.tracking_events;

CREATE POLICY "Tracking events insert"
ON public.tracking_events
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = get_current_org_id()
  OR org_id IN (
    SELECT staff.org_id
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Tracking events update"
ON public.tracking_events
FOR UPDATE
TO authenticated
USING (
  org_id = get_current_org_id()
  OR org_id IN (
    SELECT staff.org_id
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
  )
)
WITH CHECK (
  org_id = get_current_org_id()
  OR org_id IN (
    SELECT staff.org_id
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Tracking events delete"
ON public.tracking_events
FOR DELETE
TO authenticated
USING (
  org_id = get_current_org_id()
  OR org_id IN (
    SELECT staff.org_id
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
  )
);
