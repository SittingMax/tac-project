-- Add rate limiting for booking creation
-- Prevents spam by limiting bookings per whatsapp number per hour

-- Add booking rate limit tracking table
CREATE TABLE IF NOT EXISTS public.booking_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- whatsapp_number or IP
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('WHATSAPP', 'IP')),
  booking_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, identifier_type, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_booking_rate_limits_identifier 
  ON public.booking_rate_limits(identifier, identifier_type, window_start);

-- Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_booking_rate_limit(
  p_whatsapp_number TEXT,
  p_max_bookings INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  -- Skip if no whatsapp number provided
  IF p_whatsapp_number IS NULL OR p_whatsapp_number = '' THEN
    RETURN TRUE;
  END IF;

  -- Calculate window start (round down to hour)
  v_window_start := DATE_TRUNC('hour', NOW());

  -- Get current count for this identifier in current window
  SELECT booking_count INTO v_current_count
  FROM public.booking_rate_limits
  WHERE identifier = p_whatsapp_number
    AND identifier_type = 'WHATSAPP'
    AND window_start = v_window_start
    AND window_start > (NOW() - (p_window_minutes || ' minutes')::INTERVAL);

  -- If no record exists, create one
  IF v_current_count IS NULL THEN
    INSERT INTO public.booking_rate_limits (identifier, identifier_type, booking_count, window_start)
    VALUES (p_whatsapp_number, 'WHATSAPP', 1, v_window_start)
    ON CONFLICT (identifier, identifier_type, window_start) 
    DO UPDATE SET booking_count = public.booking_rate_limits.booking_count + 1;
    
    RETURN TRUE;
  END IF;

  -- Check if limit exceeded
  IF v_current_count >= p_max_bookings THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  UPDATE public.booking_rate_limits
  SET booking_count = booking_count + 1
  WHERE identifier = p_whatsapp_number
    AND identifier_type = 'WHATSAPP'
    AND window_start = v_window_start;

  RETURN TRUE;
END;
$$;

-- Trigger function to enforce rate limiting on INSERT
CREATE OR REPLACE FUNCTION public.enforce_booking_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only apply to anonymous bookings (public bookings)
  IF NEW.user_id IS NULL AND NEW.whatsapp_number IS NOT NULL THEN
    IF NOT public.check_booking_rate_limit(NEW.whatsapp_number, 5, 60) THEN
      RAISE EXCEPTION 'Rate limit exceeded. Please try again later. Maximum 5 bookings per hour allowed.'
        USING HINT = 'Wait for the rate limit window to reset',
              ERRCODE = '42P01';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_enforce_booking_rate_limit ON public.bookings;
CREATE TRIGGER trigger_enforce_booking_rate_limit
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_rate_limit();

-- Cleanup function (can be run periodically via pg_cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_old_booking_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM public.booking_rate_limits
  WHERE window_start < (NOW() - INTERVAL '24 hours');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON TABLE public.booking_rate_limits IS 'Tracks booking creation rate limits by identifier (WhatsApp number or IP)';
COMMENT ON FUNCTION public.check_booking_rate_limit IS 'Checks and enforces rate limits for booking creation. Returns TRUE if allowed, FALSE if limit exceeded.';
COMMENT ON FUNCTION public.cleanup_old_booking_rate_limits IS 'Removes old rate limit tracking records (>24h old). Run periodically to prevent table bloat.';
