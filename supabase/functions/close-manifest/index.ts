// @ts-nocheck - Deno Edge Function
/**
 * Close Manifest Edge Function
 * Uses atomic RPC to close a manifest and update related shipments/events in one transaction.
 *
 * Security:
 * - Validates JWT from Authorization header
 * - Verifies staff profile exists for the user
 * - Enforces role-based access for manifest close
 * - Ensures staff belongs to the same organization as the manifest via RPC checks
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface CloseManifestRequest {
  manifest_id: string;
  notes?: string;
}

interface CloseManifestResponse {
  success: boolean;
  manifest?: {
    id: string;
    manifest_no: string;
    status: string;
    total_shipments: number;
    total_packages: number;
    total_weight: number;
  };
  shipments_updated: number;
  tracking_events_created: number;
  error?: string;
}

type CloseManifestRpcRow = {
  manifest_id: string;
  manifest_no: string;
  total_shipments: number;
  total_packages: number;
  total_weight: number;
  shipments_updated: number;
  tracking_events_created: number;
};

const ALLOWED_CLOSE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPS', 'OPS_STAFF']);

function mapRpcErrorToStatus(message: string): number {
  if (message.includes('Manifest not found')) return 404;
  if (message.includes('Unauthorized: Org mismatch')) return 403;
  if (message.includes('Cannot close manifest')) return 400;
  return 500;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header missing' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, org_id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (staffError || !staff) {
      return new Response(JSON.stringify({ success: false, error: 'Staff profile not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_CLOSE_ROLES.has(staff.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Forbidden: role '${staff.role}' cannot close manifests`,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { manifest_id, notes }: CloseManifestRequest = await req.json();

    if (!manifest_id) {
      return new Response(JSON.stringify({ success: false, error: 'manifest_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('close_manifest_atomic', {
      p_manifest_id: manifest_id,
      p_staff_id: staff.id,
      p_org_id: staff.org_id,
      p_notes: notes ?? null,
    });

    if (rpcError) {
      const message = rpcError.message || 'Failed to close manifest';
      return new Response(
        JSON.stringify({
          success: false,
          error: message,
        }),
        {
          status: mapRpcErrorToStatus(message),
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const row = (Array.isArray(rpcResult) ? rpcResult[0] : rpcResult) as CloseManifestRpcRow | null;

    if (!row) {
      return new Response(
        JSON.stringify({ success: false, error: 'No result returned from close manifest RPC' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const response: CloseManifestResponse = {
      success: true,
      manifest: {
        id: row.manifest_id,
        manifest_no: row.manifest_no,
        status: 'CLOSED',
        total_shipments: row.total_shipments,
        total_packages: row.total_packages,
        total_weight: row.total_weight,
      },
      shipments_updated: row.shipments_updated,
      tracking_events_created: row.tracking_events_created,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Close manifest error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
