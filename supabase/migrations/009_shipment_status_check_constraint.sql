-- Migration: Add CHECK constraint on shipments.status
-- Purpose: Enforce canonical shipment status values at database level
-- Idempotent: Drops prior constraint before adding
-- Safe: Backfills legacy values before adding constraint

-- ============================================================================
-- STEP 1: Drop existing constraint if it exists (idempotent)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'shipments_status_check'
        AND table_name = 'shipments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.shipments DROP CONSTRAINT shipments_status_check;
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Backfill legacy status values to canonical values
-- Maps old status names to new canonical names to prevent constraint failure
-- ============================================================================

UPDATE public.shipments SET status = 'RECEIVED_AT_ORIGIN' 
WHERE status = 'RECEIVED_AT_ORIGIN_HUB';

UPDATE public.shipments SET status = 'IN_TRANSIT' 
WHERE status IN ('LOADED_FOR_LINEHAUL', 'IN_TRANSIT_TO_DESTINATION');

UPDATE public.shipments SET status = 'RECEIVED_AT_DEST' 
WHERE status = 'RECEIVED_AT_DEST_HUB';

UPDATE public.shipments SET status = 'RTO' 
WHERE status = 'RETURNED';

UPDATE public.shipments SET status = 'EXCEPTION' 
WHERE status IN ('EXCEPTION_RAISED', 'DAMAGED');

UPDATE public.shipments SET status = 'DELIVERED' 
WHERE status = 'EXCEPTION_RESOLVED';

-- ============================================================================
-- STEP 3: Add CHECK constraint with NOT VALID first (faster, non-blocking)
-- ============================================================================

ALTER TABLE public.shipments
ADD CONSTRAINT shipments_status_check CHECK (
    status IN (
        'CREATED',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'RECEIVED_AT_ORIGIN',
        'IN_TRANSIT',
        'RECEIVED_AT_DEST',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RTO',
        'EXCEPTION'
    )
) NOT VALID;

-- ============================================================================
-- STEP 4: Validate the constraint (scans table but allows concurrent writes)
-- ============================================================================

ALTER TABLE public.shipments VALIDATE CONSTRAINT shipments_status_check;

-- ============================================================================
-- STEP 5: Add comment for documentation
-- ============================================================================

COMMENT ON CONSTRAINT shipments_status_check ON public.shipments IS 
'Enforces canonical shipment status values: CREATED, PICKUP_SCHEDULED, PICKED_UP, RECEIVED_AT_ORIGIN, IN_TRANSIT, RECEIVED_AT_DEST, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RTO, EXCEPTION';
