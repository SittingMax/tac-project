-- Migration: Restore Critical Indexes
-- Purpose: Re-add indexes dropped by advisor that are critical for application joins and filtering
-- Date: 2026-02-14

-- 1. Shipments Foreign Keys
-- Used for "My Shipments" and joining customer data
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);

-- Used for dashboard analytics and filtering by route
CREATE INDEX IF NOT EXISTS idx_shipments_origin_hub_id ON shipments(origin_hub_id);
CREATE INDEX IF NOT EXISTS idx_shipments_destination_hub_id ON shipments(destination_hub_id);

-- 2. Manifests Foreign Keys
-- Used for fetching manifests by route
CREATE INDEX IF NOT EXISTS idx_manifests_from_hub_id ON manifests(from_hub_id);
CREATE INDEX IF NOT EXISTS idx_manifests_to_hub_id ON manifests(to_hub_id);

-- 3. Invoices
-- Used for fetching invoices by customer
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);

-- 4. Tracking Events
-- Restore AWB index for public tracking page lookups if it was dropped
CREATE INDEX IF NOT EXISTS idx_tracking_events_awb_number ON tracking_events(awb_number);
