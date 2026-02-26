-- ============================================
-- Test User Setup for E2E Tests
-- ============================================
-- This script creates a test user for running Playwright E2E tests
-- Run this in your Supabase SQL Editor

-- Note: Creating auth.users directly requires service_role privileges
-- It's recommended to create the auth user via Supabase Dashboard first,
-- then run this script to create the corresponding staff record.

-- ============================================
-- Step 1: Create Auth User (via Dashboard)
-- ============================================
-- Go to: Authentication > Users > Add User
-- Email: admin@taccargo.com
-- Password: admin123
-- Auto Confirm User: Yes

-- ============================================
-- Step 2: Create Staff Record (run this SQL)
-- ============================================

-- Insert test admin user into staff table
INSERT INTO staff (
  email, 
  full_name, 
  role, 
  hub_code, 
  is_active,
  phone,
  created_at,
  updated_at
)
VALUES (
  'admin@taccargo.com',
  'Test Admin User',
  'ADMIN',
  'IMF',
  true,
  '9999999999',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  is_active = true,
  role = 'ADMIN',
  updated_at = NOW();

-- Verify the user was created
SELECT 
  id,
  email,
  full_name,
  role,
  hub_code,
  is_active
FROM staff
WHERE email = 'admin@taccargo.com';

-- ============================================
-- Optional: Create Additional Test Users
-- ============================================

-- Warehouse Staff (Imphal)
INSERT INTO staff (
  email, 
  full_name, 
  role, 
  hub_code, 
  is_active,
  phone,
  created_at,
  updated_at
)
VALUES (
  'warehouse.imphal@taccargo.com',
  'Test Warehouse Imphal',
  'WAREHOUSE_IMPHAL',
  'IMF',
  true,
  '9999999998',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Warehouse Staff (Delhi)
INSERT INTO staff (
  email, 
  full_name, 
  role, 
  hub_code, 
  is_active,
  phone,
  created_at,
  updated_at
)
VALUES (
  'warehouse.delhi@taccargo.com',
  'Test Warehouse Delhi',
  'WAREHOUSE_DELHI',
  'DEL',
  true,
  '9999999997',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Operations Staff
INSERT INTO staff (
  email, 
  full_name, 
  role, 
  hub_code, 
  is_active,
  phone,
  created_at,
  updated_at
)
VALUES (
  'ops@taccargo.com',
  'Test Operations Staff',
  'OPS',
  'IMF',
  true,
  '9999999996',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Finance Staff
INSERT INTO staff (
  email, 
  full_name, 
  role, 
  hub_code, 
  is_active,
  phone,
  created_at,
  updated_at
)
VALUES (
  'finance@taccargo.com',
  'Test Finance Staff',
  'INVOICE',
  'IMF',
  true,
  '9999999995',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Verification Query
-- ============================================

SELECT 
  email,
  full_name,
  role,
  hub_code,
  is_active,
  created_at
FROM staff
WHERE email LIKE '%@taccargo.com'
ORDER BY created_at DESC;

-- ============================================
-- Cleanup (if needed)
-- ============================================
-- Uncomment to remove test users

-- DELETE FROM staff WHERE email = 'admin@taccargo.com';
-- DELETE FROM staff WHERE email LIKE 'warehouse.%@taccargo.com';
-- DELETE FROM staff WHERE email = 'ops@taccargo.com';
-- DELETE FROM staff WHERE email = 'finance@taccargo.com';
