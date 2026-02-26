import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL environment variable');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSuperAdmin() {
  console.log('Checking for admin@tapancargo.com...');

  const { data: staff, error } = await supabase
    .from('staff')
    .select('*')
    .eq('email', 'admin@tapancargo.com')
    .single();

  if (error) {
    console.error('Error fetching staff:', error);
  } else {
    console.log('Staff record found:');
    // eslint-disable-next-line no-console
    console.table(staff);

    if (staff.role !== 'SUPER_ADMIN') {
      console.warn('⚠️ User exists but ROLE is NOT SUPER_ADMIN');
    } else {
      console.log('✅ User has SUPER_ADMIN role');
    }
  }
}

checkSuperAdmin();
