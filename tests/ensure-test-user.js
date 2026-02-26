
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const email = 'admin@taccargo.com';
    const password = 'admin123';

    // eslint-disable-next-line no-console
    console.log(`Checking user ${email}...`);

    // 1. Check/Create Auth User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        process.exit(1);
    }

    let user = users.find(u => u.email === email);

    if (!user) {
        // eslint-disable-next-line no-console
        console.log('User not found. Creating...');
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'Test Admin User' }
        });

        if (createError) {
            console.error('Error creating user:', createError);
            process.exit(1);
        }
        user = data.user;
        // eslint-disable-next-line no-console
        console.log('User created:', user.id);
    } else {
        // eslint-disable-next-line no-console
        console.log('User already exists:', user.id);
        // Optional: Update password to ensure it matches
        await supabase.auth.admin.updateUserById(user.id, { password });
        // eslint-disable-next-line no-console
        console.log('Password synced.');
    }

    // 2. Check/Create Staff Record
    // eslint-disable-next-line no-console
    console.log('Checking staff record...');
    const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', email)
        .single();

    if (staffError && staffError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking staff:', staffError);
        process.exit(1);
    }

    if (!staff) {
        // eslint-disable-next-line no-console
        console.log('Staff record not found. Creating...');

        // Look up the org and hub by known codes so we use real UUIDs
        const { data: org } = await supabase.from('orgs').select('id').limit(1).single();
        const { data: hub } = await supabase.from('hubs').select('id').eq('code', 'IMF').single();

        const staffPayload = {
            email,
            auth_user_id: user.id,
            full_name: 'Test Admin User',
            role: 'ADMIN',
            is_active: true,
            phone: '9999999999',
        };
        if (org?.id) staffPayload.org_id = org.id;
        if (hub?.id) staffPayload.hub_id = hub.id;

        const { error: insertError } = await supabase.from('staff').insert(staffPayload);

        if (insertError) {
            console.error('Error inserting staff:', insertError);
        } else {
            // eslint-disable-next-line no-console
            console.log('Staff record created.');
        }
    } else {
        // eslint-disable-next-line no-console
        console.log('Staff record exists.');
        // Ensure auth_user_id is linked
        if (staff.auth_user_id !== user.id) {
            // eslint-disable-next-line no-console
            console.log('Linking auth_user_id...');
            await supabase.from('staff').update({ auth_user_id: user.id }).eq('id', staff.id);
        }
    }

    // eslint-disable-next-line no-console
    console.log('Done.');
}

main();
