-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    consignor_details JSONB NOT NULL,
    consignee_details JSONB NOT NULL,
    volume_matrix JSONB NOT NULL, -- Array of { length, width, height, weight, count }
    images TEXT[] DEFAULT '{}',
    whatsapp_number TEXT, -- Optional for internal, mandatory for public (enforced by app logic/schema)
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT bookings_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can view their own bookings'
    ) THEN
        CREATE POLICY "Users can view their own bookings"
            ON public.bookings FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can insert their own bookings'
    ) THEN
        CREATE POLICY "Users can insert their own bookings"
            ON public.bookings FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Public Booking Policy (Anon)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public can create bookings'
    ) THEN
        CREATE POLICY "Public can create bookings"
            ON public.bookings FOR INSERT
            TO anon
            WITH CHECK (status = 'PENDING' AND user_id IS NULL); 
            -- Ideally we'd restrict status to PENDING here, but default handles it.
    END IF;
    
    -- Staff policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Staff can view all bookings'
    ) THEN
        CREATE POLICY "Staff can view all bookings"
            ON public.bookings FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.staff
                    WHERE public.staff.auth_user_id = auth.uid()
                    AND public.staff.role IN ('ADMIN', 'MANAGER', 'OPS', 'OPS_STAFF', 'SUPER_ADMIN')
                )
            );
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.bookings TO authenticated;
GRANT INSERT ON public.bookings TO anon; -- Explicitly grant INSERT to anon
