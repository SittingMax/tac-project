-- Migration: Add Performance Indexes
-- Purpose: Optimize AWB number lookups and tracking queries
-- Date: 2026-01-24
-- Priority: Low (performance optimization)

-- Add index on shipments.awb_number for faster lookups
-- This is used frequently in scanning operations and shipment searches
CREATE INDEX IF NOT EXISTS idx_shipments_awb_number 
ON shipments(awb_number);

-- Add index on tracking_events.awb_number for faster tracking queries
-- This is used when displaying shipment tracking timelines
CREATE INDEX IF NOT EXISTS idx_tracking_events_awb_number 
ON tracking_events(awb_number);

-- Add composite index on tracking_events for efficient timeline queries
-- This optimizes queries that filter by AWB and sort by timestamp
CREATE INDEX IF NOT EXISTS idx_tracking_events_awb_timestamp 
ON tracking_events(awb_number, created_at DESC);

-- Add index on manifest_items.shipment_id for faster manifest queries
-- This is used when checking if a shipment is in a manifest
CREATE INDEX IF NOT EXISTS idx_manifest_items_shipment_id 
ON manifest_items(shipment_id);

-- Add composite index on exceptions for faster exception queries
-- This optimizes queries that filter by shipment and status
CREATE INDEX IF NOT EXISTS idx_exceptions_shipment_status 
ON exceptions(shipment_id, status);

-- Verify indexes were created
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND indexname IN (
    'idx_shipments_awb_number',
    'idx_tracking_events_awb_number',
    'idx_tracking_events_awb_timestamp',
    'idx_manifest_items_shipment_id',
    'idx_exceptions_shipment_status'
  );
  
  IF idx_count = 5 THEN
    RAISE NOTICE 'All 5 performance indexes created successfully';
  ELSE
    RAISE WARNING 'Expected 5 indexes, found %', idx_count;
  END IF;
END $$;
