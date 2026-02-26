-- Migration: Rename consignee/consignor columns to receiver/sender
-- Purpose: Standardize terminology across the application
-- Backward compatible: Creates aliases for old column names during transition

-- ============================================================================
-- STEP 1: Add new receiver columns (if not exists pattern for idempotency)
-- ============================================================================

-- Add receiver_name column (rename from consignee_name)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'consignee_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'receiver_name'
    ) THEN
        ALTER TABLE public.shipments RENAME COLUMN consignee_name TO receiver_name;
    END IF;
END $$;

-- Add receiver_phone column (rename from consignee_phone)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'consignee_phone'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'receiver_phone'
    ) THEN
        ALTER TABLE public.shipments RENAME COLUMN consignee_phone TO receiver_phone;
    END IF;
END $$;

-- Add receiver_address column (rename from consignee_address)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'consignee_address'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'receiver_address'
    ) THEN
        ALTER TABLE public.shipments RENAME COLUMN consignee_address TO receiver_address;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Add sender columns (new columns for shipper info)
-- ============================================================================

-- Add sender_name column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE public.shipments ADD COLUMN sender_name TEXT;
    END IF;
END $$;

-- Add sender_phone column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'sender_phone'
    ) THEN
        ALTER TABLE public.shipments ADD COLUMN sender_phone TEXT;
    END IF;
END $$;

-- Add sender_address column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shipments' 
        AND column_name = 'sender_address'
    ) THEN
        ALTER TABLE public.shipments ADD COLUMN sender_address JSONB;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Update any indexes that reference old column names
-- ============================================================================

-- Drop old index if exists and create new one for receiver_name
DROP INDEX IF EXISTS idx_shipments_consignee_name;
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_name ON public.shipments(receiver_name);

-- ============================================================================
-- STEP 4: Add comment for documentation
-- ============================================================================

COMMENT ON COLUMN public.shipments.receiver_name IS 'Name of the shipment receiver (formerly consignee_name)';
COMMENT ON COLUMN public.shipments.receiver_phone IS 'Phone number of the shipment receiver (formerly consignee_phone)';
COMMENT ON COLUMN public.shipments.receiver_address IS 'Address of the shipment receiver as JSONB (formerly consignee_address)';
COMMENT ON COLUMN public.shipments.sender_name IS 'Name of the shipment sender/shipper';
COMMENT ON COLUMN public.shipments.sender_phone IS 'Phone number of the shipment sender/shipper';
COMMENT ON COLUMN public.shipments.sender_address IS 'Address of the shipment sender/shipper as JSONB';
