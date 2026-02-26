-- ============================================================================
-- TAC Portal - E2E Test User Setup
-- Migration 011: Creates test user for E2E testing in CI
-- ============================================================================
-- NOTE: This migration creates a test staff record that can be used with
-- Supabase Auth test accounts. The actual auth user must be created via
-- Supabase Auth API or Dashboard.
-- ============================================================================

-- Create E2E test organization if not exists
INSERT INTO orgs (id, name, slug, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'E2E Test Organization',
    'e2e-test-org',
    '{
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "invoice_prefix": "TEST",
        "features": {
            "scanning": true,
            "manifests": true,
            "invoices": true,
            "exceptions": true
        }
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    settings = EXCLUDED.settings;

-- Create test hub
INSERT INTO hubs (id, org_id, code, name, type, address, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'TEST-HUB',
    'E2E Test Hub',
    'ORIGIN',
    '{"city": "Test City", "state": "Test State", "line1": "123 Test Street"}'::jsonb,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = true;

-- ============================================================================
-- TEST USERS - Different roles for comprehensive E2E testing
-- ============================================================================

-- Admin test user (e2e-admin@test.local)
-- Auth user must be created separately in Supabase Auth
INSERT INTO staff (
    id,
    org_id,
    hub_id,
    email,
    full_name,
    role,
    is_active,
    auth_user_id
)
VALUES (
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'e2e-admin@test.local',
    'E2E Admin User',
    'ADMIN',
    true,
    NULL -- Will be set when auth user is created
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = true;

-- OPS test user (e2e-ops@test.local)
INSERT INTO staff (
    id,
    org_id,
    hub_id,
    email,
    full_name,
    role,
    is_active,
    auth_user_id
)
VALUES (
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'e2e-ops@test.local',
    'E2E OPS User',
    'OPS',
    true,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = true;

-- Warehouse test user (e2e-warehouse@test.local)
INSERT INTO staff (
    id,
    org_id,
    hub_id,
    email,
    full_name,
    role,
    is_active,
    auth_user_id
)
VALUES (
    '00000000-0000-0000-0000-000000000012'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'e2e-warehouse@test.local',
    'E2E Warehouse User',
    'WAREHOUSE_IMPHAL',
    true,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = true;

-- Finance test user (e2e-finance@test.local)
INSERT INTO staff (
    id,
    org_id,
    hub_id,
    email,
    full_name,
    role,
    is_active,
    auth_user_id
)
VALUES (
    '00000000-0000-0000-0000-000000000013'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'e2e-finance@test.local',
    'E2E Finance User',
    'INVOICE',
    true,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = true;

-- ============================================================================
-- FUNCTION: Link E2E test user to auth account
-- Call this after creating auth user: SELECT link_e2e_test_user('email', 'auth_user_id')
-- ============================================================================

CREATE OR REPLACE FUNCTION link_e2e_test_user(
    user_email text,
    user_auth_id uuid
)
RETURNS boolean AS $$
BEGIN
    UPDATE staff
    SET auth_user_id = user_auth_id
    WHERE email = user_email
    AND email LIKE 'e2e-%@test.local';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION link_e2e_test_user(text, uuid) FROM PUBLIC;
