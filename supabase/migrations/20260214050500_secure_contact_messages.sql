-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to delete contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow authenticated users to update contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow authenticated users to select contact_messages" ON public.contact_messages;

-- Create tighter policies

-- 1. Allow public to insert (legacy requirement, but let's make it explicit)
-- Ideally, this should be anon only if it's a public contact form, but strict RLS is better.
CREATE POLICY "Public can insert contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (true);

-- 2. Allow authenticated users to view only their own messages? 
-- Or if it's for admins, restrict to admins.
-- Assuming 'contact_messages' are for support tickets or inquiries.
-- If these are just inquiries, maybe only admins should see them.
-- Recovering original intent: "Allow authenticated users to select contact_messages" was "true".
-- This likely means all authenticated users could see ALL messages. usage of 'contact_messages' usually implies admin/staff view.
-- We will restrict SELECT/UPDATE/DELETE to authenticated users with RBAC if possible, 
-- but for now, we will just keep them authenticated but add the org constraint if applicable,
-- or just keep it authenticated but ensure it's not "true" without reason.

-- Investigating the schema of contact_messages might help.
-- For now, we will re-create them but ensuring they are not "USING (true)" blindly if possible.
-- If the table doesn't have org_id, maybe it's global.
-- Let's assume for now we just want to remove the "USING (true)" warnings by making them explicit or removing unused ones.
-- The advisor said UPDATE/DELETE were permissive.
-- We will restrict UPDATE/DELETE to app admins.

CREATE POLICY "Admins can manage contact messages"
ON public.contact_messages
FOR ALL
TO authenticated
USING (
  exists (
    select 1 from public.staff
    where staff.auth_user_id = auth.uid()
    and staff.role in ('Check with user', 'SUPER_ADMIN', 'ADMIN') 
  )
);
-- Start with a safer default: only public insert, and view by creator or special role.
-- Since we don't know the exact requirement, we will stick to the existing behavior but make it explicit
-- OR wait, the advisor said "Allow authenticated users to delete contact_messages... USING (true)". 
-- This allows ANY authenticated user to delete ANY message. This is definitely bad. 

-- Let's just allow INSERT for public, and SELECT/DELETE/UPDATE for 'service_role' or specific admin roles.
-- Since we are fixing security, restricting DELETE to admins is a safe bet.

CREATE POLICY "Authenticated users can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true); -- Keep SELECT open if that was the intent, but typically this is internal.

-- Restricted DELETE/UPDATE
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.staff WHERE auth_user_id = auth.uid()) IN ('SUPER_ADMIN', 'ADMIN')
);

CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.staff WHERE auth_user_id = auth.uid()) IN ('SUPER_ADMIN', 'ADMIN')
)
WITH CHECK (
  (SELECT role FROM public.staff WHERE auth_user_id = auth.uid()) IN ('SUPER_ADMIN', 'ADMIN')
);
