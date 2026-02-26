# Supabase Hardening Update (2026-02-18)

## Summary
This update hardens the Supabase backend with stricter RLS, safer function search paths, reduced permissive policy overlap, and index hygiene. It aligns with enterprise-grade security and performance guidance from Supabase advisors.

## Applied Changes
- **Security invoker** enforced for `public.public_shipment_tracking` view.
- **RLS enabled** for `public.booking_rate_limits` with service-role-only access.
- **Function search_path** fixed for booking rate limit functions.
- **RLS policy consolidation** across orgs/staff/shipments/tracking events/customers/invoices/manifests.
- **Public contact inserts** now validated with length and status guards.
- **Public booking insert** limited to anon + `PENDING` with `user_id IS NULL`.
- **Index cleanup** and **FK covering index restoration** for performance stability.

## Migrations Added
- `20260218150000_supabase_hardening.sql`
- `20260218150500_supabase_rls_consolidation.sql`
- `20260218151000_supabase_policy_cleanup.sql`
- `20260218151500_supabase_fk_indexes.sql`

## Manual Follow-Up
- Enable **Leaked Password Protection** in Supabase Dashboard → Auth → Password Security.
  - Ref: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Notes
- These changes are forward-only. If rollback is needed, use compensating migrations.
