-- ============================================================================
-- 007_manifest_grants.sql
-- Grant required privileges for authenticated role to avoid 403/42501 errors.
-- NOTE: RLS policies still apply; these grants only allow PostgREST to access.
-- ============================================================================

-- Tables: basic access (RLS still enforced)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.manifests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.manifest_items TO authenticated;
GRANT SELECT ON TABLE public.hubs TO authenticated;
GRANT SELECT ON TABLE public.staff TO authenticated;

-- Helper functions used in RLS policies
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text[]) TO authenticated;

-- Hub access helper functions (added in 003_hub_access_and_constraints.sql)
GRANT EXECUTE ON FUNCTION public.get_user_hub_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_warehouse_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_hub(uuid) TO authenticated;
