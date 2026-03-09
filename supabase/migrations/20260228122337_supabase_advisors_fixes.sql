-- Fix SUPER_ADMIN role access in core security functions with proper SET search_path (SECURITY)
-- Add index to handling_units foreign key (PERFORMANCE)

-- Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff 
    WHERE auth_user_id = auth.uid() 
    AND (
      role = ANY(required_roles) 
      OR role = 'SUPER_ADMIN'
    )
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if user can access a specific hub
CREATE OR REPLACE FUNCTION can_access_hub(hub_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_hub uuid;
BEGIN
  SELECT role, staff.hub_id INTO user_role, user_hub
  FROM staff WHERE auth_user_id = auth.uid();
  
  -- Admin, Manager, OPS can access all hubs
  IF user_role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPS', 'INVOICE', 'SUPPORT') THEN
    RETURN true;
  END IF;
  
  -- Warehouse roles can only access their assigned hub
  IF user_role IN ('WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI') THEN
    RETURN user_hub = hub_id;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Add covering index for foreign key handling_units_created_by_staff_id_fkey
CREATE INDEX IF NOT EXISTS idx_handling_units_created_by_staff_id 
  ON handling_units(created_by_staff_id);
