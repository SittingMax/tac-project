-- Create a function to search shipments dynamically
CREATE OR REPLACE FUNCTION search_shipments(
  p_search_text text,
  p_org_id uuid,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS SETOF shipments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.*
  FROM shipments s
  LEFT JOIN customers c ON s.customer_id = c.id
  LEFT JOIN invoices i ON s.id = i.shipment_id
  WHERE s.org_id = p_org_id
    AND s.deleted_at IS NULL
    AND (
      p_status IS NULL OR s.status = p_status
    )
    AND (
      p_search_text IS NULL OR p_search_text = '' OR
      s.awb_number ILIKE '%' || p_search_text || '%' OR
      s.sender_name ILIKE '%' || p_search_text || '%' OR
      s.receiver_name ILIKE '%' || p_search_text || '%' OR
      s.sender_phone ILIKE '%' || p_search_text || '%' OR
      s.receiver_phone ILIKE '%' || p_search_text || '%' OR
      c.name ILIKE '%' || p_search_text || '%' OR
      c.phone ILIKE '%' || p_search_text || '%' OR
      i.invoice_no ILIKE '%' || p_search_text || '%'
    )
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
