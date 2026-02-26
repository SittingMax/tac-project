// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify Authentication & Authorization
    // We use the Authorization header to identify the requester
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with Service Role for Admin actions
    // We need service role to manage users and staff table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if requester is SUPER_ADMIN and get their Org ID
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from('staff')
      .select('role, org_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || requesterProfile?.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ error: 'Forbidden: Super Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse Request Body
    const { email, password, role, fullName, hubCode } = await req.json();

    if (!email || !password || !role || !fullName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create User via Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (createError) throw createError;
    if (!newUser.user) throw new Error('User creation returned no user');

    // 4. Create Staff Profile
    try {
      const { error: insertError } = await supabaseAdmin.from('staff').insert({
        auth_user_id: newUser.user.id,
        email: email,
        full_name: fullName,
        role: role,
        org_id: requesterProfile.org_id, // Inherit Org from Creator
        hub_id: hubCode ? await getHubId(supabaseAdmin, hubCode) : null,
        is_active: true,
      });

      if (insertError) throw insertError;
    } catch (profileCreationError) {
      // ROLLBACK: Delete the created Auth User if profile creation fails
      console.error('Profile creation failed, rolling back Auth User:', profileCreationError);

      // Attempt to delete the just-created user to avoid orphan record
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);

      if (deleteError) {
        console.error('CRITICAL: Failed to rollback user creation:', deleteError);
        // We still throw the original error, but log the critical failure
      }

      throw new Error(
        `Failed to create staff profile: ${profileCreationError.message}. User creation rolled back.`
      );
    }

    return new Response(
      JSON.stringify({ user: newUser.user, message: 'User created successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// Helper to resolve Hub Code to ID
async function getHubId(client: any, code: string) {
  const { data } = await client.from('hubs').select('id').eq('code', code).single();
  return data?.id || null;
}
