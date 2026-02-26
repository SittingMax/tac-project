-- Migration: Enforce IMF Hub Code
-- Purpose: Replace IXA with IMF hub code (domain enforcement)
-- Date: 2026-01-23
-- Note: The hub ID stays the same, only the code changes

-- Step 1: Update the hub code from IXA to IMF
-- This is safe because the hub ID remains constant, so all foreign keys continue to work
UPDATE hubs 
SET code = 'IMF', name = 'Imphal Hub'
WHERE code = 'IXA';

-- Step 2: Add CHECK constraint on hubs table to enforce valid codes
-- This approach is Postgres-compatible (no subqueries in CHECK)
ALTER TABLE hubs
ADD CONSTRAINT hubs_code_valid
CHECK (code IN ('DEL', 'GAU', 'CCU', 'IMF', 'TEST-HUB'));

-- Step 3: Verify the change
DO $$
DECLARE
  ixa_count INTEGER;
  imf_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ixa_count FROM hubs WHERE code = 'IXA';
  SELECT COUNT(*) INTO imf_count FROM hubs WHERE code = 'IMF';
  
  IF ixa_count > 0 THEN
    RAISE EXCEPTION 'IXA hub code still exists in hubs table';
  END IF;
  
  IF imf_count = 0 THEN
    RAISE EXCEPTION 'IMF hub code was not created';
  END IF;
  
  RAISE NOTICE 'Hub code successfully changed from IXA to IMF';
END $$;
