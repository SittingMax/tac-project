CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- 1. Try to find org from staff record
  SELECT s.org_id INTO org_id
  FROM staff s
  WHERE s.auth_user_id = auth.uid()
  LIMIT 1;

  -- 2. If found, return it
  IF org_id IS NOT NULL THEN
    RETURN org_id;
  END IF;

  -- 3. Fallback: Return the Default Demo Org ID if no staff record exists
  -- This ensures new users can still interact with the demo data
  RETURN '00000000-0000-0000-0000-000000000001'::uuid;
END;
$$;
