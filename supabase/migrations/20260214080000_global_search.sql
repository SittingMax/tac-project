-- Create a composite type for search results
CREATE TYPE public.search_result AS (
  id uuid,
  entity_type text,
  title text,
  subtitle text,
  link text,
  metadata jsonb
);

-- Create the global search function
CREATE OR REPLACE FUNCTION public.search_global(
  p_query text,
  p_org_id uuid,
  p_limit int DEFAULT 20
)
RETURNS SETOF public.search_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_term text := '%' || p_query || '%';
BEGIN
  RETURN QUERY
    -- Search Shipments
    SELECT
      s.id,
      'shipment'::text as entity_type,
      s.awb_number as title,
      COALESCE(s.special_instructions, 'No Instructions') as subtitle,
      '/shipments/' || s.id as link,
      jsonb_build_object(
        'status', s.status,
        'customer', c.name,
        'origin', oh.code,
        'destination', dh.code
      ) as metadata
    FROM shipments s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN hubs oh ON s.origin_hub_id = oh.id
    LEFT JOIN hubs dh ON s.destination_hub_id = dh.id
    WHERE s.org_id = p_org_id
      AND (
        s.awb_number ILIKE query_term OR 
        s.receiver_name ILIKE query_term OR 
        s.sender_phone ILIKE query_term OR 
        s.receiver_phone ILIKE query_term
      )

    UNION ALL

    -- Search Customers
    SELECT
      c.id,
      'customer'::text as entity_type,
      c.name as title,
      COALESCE(c.phone, '') || ' • ' || COALESCE(c.email, '') as subtitle,
      '/customers?search=' || c.name as link,
      jsonb_build_object(
        'phone', c.phone,
        'email', c.email,
        'code', c.customer_code
      ) as metadata
    FROM customers c
    WHERE c.org_id = p_org_id
      AND (
        c.name ILIKE '%' || p_query || '%'
        OR c.phone ILIKE '%' || p_query || '%'
        OR c.email ILIKE '%' || p_query || '%'
        OR c.customer_code ILIKE '%' || p_query || '%'
      )

    UNION ALL

    -- Search Invoices
    SELECT
      i.id,
      'invoice'::text as entity_type,
      i.invoice_no as title,
      'Total: ' || i.total::text || ' • ' || i.status as subtitle,
      '/invoices?search=' || i.invoice_no as link,
      jsonb_build_object(
        'status', i.status,
        'total', i.total,
        'issue_date', i.issue_date
      ) as metadata
    FROM invoices i
    WHERE i.org_id = p_org_id
      AND (
        i.invoice_no ILIKE '%' || p_query || '%'
      )

    UNION ALL

    -- Search Manifests
    SELECT
      m.id,
      'manifest'::text as entity_type,
      m.manifest_no as title,
      COALESCE(m.status, 'Unknown') || ' • ' || COALESCE(fh.code, '') || ' -> ' || COALESCE(th.code, '') as subtitle,
      '/manifests?search=' || m.manifest_no as link,
      jsonb_build_object(
        'status', m.status,
        'driver', m.driver_name,
        'vehicle', m.vehicle_number
      ) as metadata
    FROM manifests m
    LEFT JOIN hubs fh ON m.from_hub_id = fh.id
    LEFT JOIN hubs th ON m.to_hub_id = th.id
    WHERE m.org_id = p_org_id
      AND (
        m.manifest_no ILIKE '%' || p_query || '%'
        OR m.driver_name ILIKE '%' || p_query || '%'
        OR m.vehicle_number ILIKE '%' || p_query || '%'
      )

    UNION ALL

    -- Search Staff
    SELECT
      st.id,
      'staff'::text as entity_type,
      st.full_name as title,
      st.role || ' • ' || st.email as subtitle,
      '/management?tab=staff&search=' || st.full_name as link,
      jsonb_build_object(
        'role', st.role,
        'email', st.email,
        'phone', st.phone
      ) as metadata
    FROM staff st
    WHERE st.org_id = p_org_id
      AND (
        st.full_name ILIKE '%' || p_query || '%'
        OR st.email ILIKE '%' || p_query || '%'
        OR st.phone ILIKE '%' || p_query || '%'
      )

    UNION ALL

    -- Search Hubs
    SELECT
      h.id,
      'hub'::text as entity_type,
      h.name as title,
      h.code || ' • ' || h.type as subtitle,
      '/management?tab=hubs&search=' || h.name as link,
      jsonb_build_object(
        'code', h.code,
        'type', h.type,
        'location', h.address->>'city'
      ) as metadata
    FROM hubs h
    WHERE (h.org_id = p_org_id OR h.org_id IS NULL) -- Hubs can be global or org-specific
      AND (
        h.name ILIKE '%' || p_query || '%'
        OR h.code ILIKE '%' || p_query || '%'
      )
    
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_global(text, uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_global(text, uuid, int) TO service_role;
