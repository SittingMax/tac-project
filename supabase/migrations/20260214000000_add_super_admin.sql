-- Create SUPER_ADMIN role and update policies

-- 1. Update Staff Role Check Constraint
ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE public.staff ADD CONSTRAINT staff_role_check 
  CHECK (role IN (
    'ADMIN', 'MANAGER', 
    'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI', 
    'OPS', 'INVOICE', 'SUPPORT', 
    'WAREHOUSE_STAFF', 'OPS_STAFF', 'FINANCE_STAFF',
    'SUPER_ADMIN'
  ));

-- 2. Enable DELETE for SUPER_ADMIN on key tables

-- Shipments
DROP POLICY IF EXISTS "Super Admin can delete shipments" ON public.shipments;
CREATE POLICY "Super Admin can delete shipments" ON public.shipments
  FOR DELETE
  USING (
    (SELECT role FROM public.staff WHERE auth_user_id = auth.uid()) = 'SUPER_ADMIN'
  );

-- Invoices
DROP POLICY IF EXISTS "Super Admin can delete invoices" ON public.invoices;
CREATE POLICY "Super Admin can delete invoices" ON public.invoices
  FOR DELETE
  USING (
    (SELECT role FROM public.staff WHERE auth_user_id = auth.uid()) = 'SUPER_ADMIN'
  );

-- Manifests
DROP POLICY IF EXISTS "Super Admin can delete manifests" ON public.manifests;
CREATE POLICY "Super Admin can delete manifests" ON public.manifests
  FOR DELETE
  USING (
    (SELECT role FROM public.staff WHERE auth_user_id = auth.uid()) = 'SUPER_ADMIN'
  );

-- Customers
DROP POLICY IF EXISTS "Super Admin can delete customers" ON public.customers;
CREATE POLICY "Super Admin can delete customers" ON public.customers
  FOR DELETE
  USING (
    (SELECT role FROM public.staff WHERE auth_user_id = auth.uid()) = 'SUPER_ADMIN'
  );


