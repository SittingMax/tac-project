CREATE OR REPLACE FUNCTION public.get_current_org_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
BEGIN
  -- first check if it's set in the local config (for RLS)
  BEGIN
    v_org_id := current_setting('app.current_org_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := null;
  END;

  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;

  -- Fallback: get the org_id from the staff table for the current user
  -- This is useful for initial data loading or simple queries
  SELECT org_id INTO v_org_id
  FROM public.staff
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  RETURN v_org_id;
END;
$function$
;
