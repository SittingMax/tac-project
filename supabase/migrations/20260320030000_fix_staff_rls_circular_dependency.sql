-- Migration: Fix circular RLS dependency on staff table
-- 
-- Problem: The "Users can view staff in org" policy uses get_user_org_id(),
-- which itself queries the staff table to get the org_id. This creates a 
-- circular dependency:
--   1. User logs in with Supabase Auth (JWT created)
--   2. authStore.ts tries to read staff WHERE auth_user_id = user.id
--   3. The SELECT policy runs: org_id = get_user_org_id()
--   4. get_user_org_id() tries to query: SELECT org_id FROM staff WHERE auth_user_id = auth.uid()
--   5. That inner query is ALSO blocked by RLS -> returns null
--   6. So the outer policy resolves to: org_id = null -> no rows returned
--   7. authStore.ts sees no staff record -> logs "No staff record found" -> login fails
--
-- Fix: Add a non-circular policy that lets users always read their OWN staff row
-- by matching auth_user_id = auth.uid() directly (no helper function needed).

DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
CREATE POLICY "Staff can view own record"
  ON public.staff FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());
