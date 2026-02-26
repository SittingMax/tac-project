DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can view all bookings" ON public.bookings;
CREATE POLICY "Bookings select"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
  OR EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.auth_user_id = (select auth.uid())
      AND staff.role = ANY (ARRAY['ADMIN','MANAGER','OPS','OPS_STAFF','SUPER_ADMIN'])
  )
);

DROP POLICY IF EXISTS "Anon can read tracking_events for tracking" ON public.tracking_events;
DROP POLICY IF EXISTS "Public can view tracking events by AWB" ON public.tracking_events;
CREATE POLICY "Public can view tracking events by AWB"
ON public.tracking_events
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Customers org-scoped" ON public.customers;
DROP POLICY IF EXISTS "Super Admin can delete customers" ON public.customers;
CREATE POLICY "Customers org-scoped select"
ON public.customers
FOR SELECT
TO authenticated
USING (org_id = get_current_org_id());
CREATE POLICY "Customers org-scoped insert"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_current_org_id());
CREATE POLICY "Customers org-scoped update"
ON public.customers
FOR UPDATE
TO authenticated
USING (org_id = get_current_org_id())
WITH CHECK (org_id = get_current_org_id());
CREATE POLICY "Customers delete"
ON public.customers
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

DROP POLICY IF EXISTS "Invoices org-scoped" ON public.invoices;
DROP POLICY IF EXISTS "Super Admin can delete invoices" ON public.invoices;
CREATE POLICY "Invoices org-scoped select"
ON public.invoices
FOR SELECT
TO authenticated
USING (org_id = get_current_org_id());
CREATE POLICY "Invoices org-scoped insert"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_current_org_id());
CREATE POLICY "Invoices org-scoped update"
ON public.invoices
FOR UPDATE
TO authenticated
USING (org_id = get_current_org_id())
WITH CHECK (org_id = get_current_org_id());
CREATE POLICY "Invoices delete"
ON public.invoices
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

DROP POLICY IF EXISTS "Manifests org-scoped insert" ON public.manifests;
DROP POLICY IF EXISTS "Manifests org-scoped delete" ON public.manifests;
DROP POLICY IF EXISTS "Users can view manifests with hub access" ON public.manifests;
DROP POLICY IF EXISTS "Authorized users can update manifests with hub access" ON public.manifests;
DROP POLICY IF EXISTS "Super Admin can delete manifests" ON public.manifests;

CREATE POLICY "Manifests org-scoped select"
ON public.manifests
FOR SELECT
TO authenticated
USING (
  org_id = get_user_org_id()
  AND (
    NOT is_warehouse_role()
    OR from_hub_id = get_user_hub_id()
    OR to_hub_id = get_user_hub_id()
  )
);
CREATE POLICY "Manifests org-scoped insert"
ON public.manifests
FOR INSERT
TO authenticated
WITH CHECK (org_id = get_current_org_id());
CREATE POLICY "Manifests org-scoped update"
ON public.manifests
FOR UPDATE
TO authenticated
USING (
  org_id = get_user_org_id()
  AND has_role(ARRAY['ADMIN','MANAGER','OPS','WAREHOUSE_IMPHAL','WAREHOUSE_DELHI'])
  AND (
    NOT is_warehouse_role()
    OR from_hub_id = get_user_hub_id()
    OR to_hub_id = get_user_hub_id()
  )
)
WITH CHECK (
  org_id = get_current_org_id()
);
CREATE POLICY "Manifests delete"
ON public.manifests
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

DROP INDEX IF EXISTS public.idx_staff_hub_id;
DROP INDEX IF EXISTS public.idx_shipments_customer_id;
DROP INDEX IF EXISTS public.idx_packages_org_id;
DROP INDEX IF EXISTS public.idx_manifest_scan_logs_org_id;
DROP INDEX IF EXISTS public.idx_manifest_scan_logs_shipment_id;
DROP INDEX IF EXISTS public.idx_manifest_container_items_org_id;
DROP INDEX IF EXISTS public.idx_manifest_containers_org_id;
DROP INDEX IF EXISTS public.idx_manifest_container_items_container_id;
DROP INDEX IF EXISTS public.idx_role_permissions_permission_code;
DROP INDEX IF EXISTS public.idx_tracking_events_event_time;
DROP INDEX IF EXISTS public.idx_shipments_search_trgm;
DROP INDEX IF EXISTS public.idx_customers_search_trgm;
DROP INDEX IF EXISTS public.idx_invoices_search_trgm;
DROP INDEX IF EXISTS public.idx_invoices_shipment_id;
DROP INDEX IF EXISTS public.idx_public_tracking_awb;
DROP INDEX IF EXISTS public.idx_booking_rate_limits_identifier;
DROP INDEX IF EXISTS public.idx_bookings_user_id;
