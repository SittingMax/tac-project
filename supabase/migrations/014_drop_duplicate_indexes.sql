-- ============================================================================
-- TAC Portal - Drop Duplicate Indexes
-- Fixes duplicate indexes flagged by Supabase Performance Advisor
-- ============================================================================

-- shipments: idx_shipments_awb and idx_shipments_awb_number are identical
-- Keep idx_shipments_awb_number (clearer name)
DROP INDEX IF EXISTS idx_shipments_awb;

-- tracking_events: idx_tracking_events_awb and idx_tracking_events_awb_number are identical
-- Keep idx_tracking_events_awb_number (clearer name)
DROP INDEX IF EXISTS idx_tracking_events_awb;
