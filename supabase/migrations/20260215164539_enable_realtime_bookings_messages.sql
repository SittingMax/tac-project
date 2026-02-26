-- Enable Realtime for bookings and contact_messages
-- This allows the GlobalNotificationListener to receive INSERT events.

begin;

  -- Add tables to the publication
  alter publication supabase_realtime add table rankings; -- Example, usually it's 'add table public.bookings'
  
  -- Check if they are already added, if not add them
  -- We can safely run this command, postgres will handle it or we can drop and re-add if needed, 
  -- but generally 'add table' is idempotent if not present for some versions, or throws error if present.
  -- Better approach: 
  
  alter publication supabase_realtime add table public.bookings;
  alter publication supabase_realtime add table public.contact_messages;

commit;
