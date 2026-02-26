ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

GRANT INSERT ON public.bookings TO anon;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public can create bookings'
    ) THEN
        CREATE POLICY "Public can create bookings"
            ON public.bookings FOR INSERT
            TO anon
            WITH CHECK (true);
    END IF;
END $$;
