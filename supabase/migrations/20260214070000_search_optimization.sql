-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for efficient ILIKE search on shipments
CREATE INDEX IF NOT EXISTS idx_shipments_search_trgm ON shipments USING gin (
  awb_number gin_trgm_ops,
  sender_name gin_trgm_ops,
  receiver_name gin_trgm_ops,
  sender_phone gin_trgm_ops,
  receiver_phone gin_trgm_ops
);

-- Add GIN indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_search_trgm ON customers USING gin (
  name gin_trgm_ops,
  phone gin_trgm_ops
);

-- Add GIN indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_search_trgm ON invoices USING gin (
  invoice_no gin_trgm_ops
);
