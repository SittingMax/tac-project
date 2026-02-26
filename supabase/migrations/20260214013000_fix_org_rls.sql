
-- Enable SUPER_ADMIN to do everything on orgs table
DROP POLICY IF EXISTS "Super Admin can manage orgs" ON public.orgs;
CREATE POLICY "Super Admin can manage orgs" ON public.orgs
  FOR ALL
  USING (
    (SELECT role FROM public.staff WHERE auth_user_id = auth.uid()) = 'SUPER_ADMIN'
  );

-- Allow ALL authenticated users to SELECT orgs (to find default org)
DROP POLICY IF EXISTS "Authenticated users can view orgs" ON public.orgs;
CREATE POLICY "Authenticated users can view orgs" ON public.orgs
  FOR SELECT
  USING (auth.role() = 'authenticated');
