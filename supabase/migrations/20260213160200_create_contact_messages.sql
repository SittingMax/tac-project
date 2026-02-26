-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read'
    archived BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow ANYONE (including anon) to insert messages (needed for Contact Form)
CREATE POLICY "Allow public insert to contact_messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Allow only authenticated users (e.g. admins/staff) to SELECT (view) messages
-- Note: In a real app, you might restrict this to specific roles. For now, any auth user.
CREATE POLICY "Allow authenticated users to select contact_messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow only authenticated users to UPDATE messages (e.g. mark read)
CREATE POLICY "Allow authenticated users to update contact_messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow only authenticated users to DELETE messages
CREATE POLICY "Allow authenticated users to delete contact_messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (true);
