
-- Allow users to read their own staff record (Critical for RBAC checks)
DROP POLICY IF EXISTS "Users can view own staff profile" ON public.staff;
CREATE POLICY "Users can view own staff profile" ON public.staff
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Ensure SUPER ADMIN has bypass RLS on STAFF table for SELECT as well (to prevent recursion issues)
-- Actually, the above policy handles the self-lookup needed for the other policies.

-- Redundant safety: Ensure Super Admin can do ANYTHING on key tables
-- (The previous regular policies relied on the lookup, which we just fixed)
