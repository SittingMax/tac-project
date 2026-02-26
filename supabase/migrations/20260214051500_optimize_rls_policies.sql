-- Optimize RLS policies by wrapping auth functions in (select ...)

-- Staff
DROP POLICY IF EXISTS "Users can view own staff profile" ON public.staff;
CREATE POLICY "Users can view own staff profile" 
ON public.staff FOR SELECT TO public 
USING (auth_user_id = (select auth.uid()));

-- Shipments
DROP POLICY IF EXISTS "Super Admin can delete shipments" ON public.shipments;
CREATE POLICY "Super Admin can delete shipments"
ON public.shipments FOR DELETE TO public
USING (( SELECT staff.role FROM staff WHERE staff.auth_user_id = (select auth.uid()) LIMIT 1) = 'SUPER_ADMIN'::text);

-- Invoices
DROP POLICY IF EXISTS "Super Admin can delete invoices" ON public.invoices;
CREATE POLICY "Super Admin can delete invoices"
ON public.invoices FOR DELETE TO public
USING (( SELECT staff.role FROM staff WHERE staff.auth_user_id = (select auth.uid()) LIMIT 1) = 'SUPER_ADMIN'::text);

-- Manifests
DROP POLICY IF EXISTS "Super Admin can delete manifests" ON public.manifests;
CREATE POLICY "Super Admin can delete manifests"
ON public.manifests FOR DELETE TO public
USING (( SELECT staff.role FROM staff WHERE staff.auth_user_id = (select auth.uid()) LIMIT 1) = 'SUPER_ADMIN'::text);

-- Customers
DROP POLICY IF EXISTS "Super Admin can delete customers" ON public.customers;
CREATE POLICY "Super Admin can delete customers"
ON public.customers FOR DELETE TO public
USING (( SELECT staff.role FROM staff WHERE staff.auth_user_id = (select auth.uid()) LIMIT 1) = 'SUPER_ADMIN'::text);

-- Orgs
DROP POLICY IF EXISTS "Super Admin can manage orgs" ON public.orgs;
CREATE POLICY "Super Admin can manage orgs"
ON public.orgs FOR ALL TO public
USING (( SELECT staff.role FROM staff WHERE staff.auth_user_id = (select auth.uid()) LIMIT 1) = 'SUPER_ADMIN'::text);

DROP POLICY IF EXISTS "Authenticated users can view orgs" ON public.orgs;
CREATE POLICY "Authenticated users can view orgs"
ON public.orgs FOR SELECT TO public
USING ((select auth.role()) = 'authenticated'::text);
