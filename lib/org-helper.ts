import { supabase } from './supabase';

// Direct supabase usage - types from database.types.ts

/**
 * Ensures a default organization exists for the demo/development environment.
 *
 * Strategy:
 * 1. Try to fetch the first existing organization.
 * 2. If none exists, create a new one with a valid UUID.
 * 3. Return the organization ID.
 *
 * WARNING: This is demo/dev code and should NOT be used in production.
 */
export async function getOrCreateDefaultOrg(): Promise<string> {
  // Gate: Only allow in development
  if (import.meta.env.PROD) {
    throw new Error(
      'getOrCreateDefaultOrg() is a development utility and cannot be used in production. ' +
      'Organizations should be created through proper onboarding flows.'
    );
  }

  try {
    // 1. Try to find any existing org
    const { data: existingOrg, error: existingOrgError } = await supabase
      .from('orgs')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existingOrgError) throw existingOrgError;

    if (existingOrg) {
      return existingOrg.id;
    }

    // 2. If no org exists, create one
    // Note: in a real app, this would be handled by auth/onboarding
    const demoOrgId = '00000000-0000-0000-0000-000000000001';

    // Check if our specific demo org exists
    const { data: demoOrg, error: demoOrgError } = await supabase
      .from('orgs')
      .select('id')
      .eq('id', demoOrgId)
      .maybeSingle();

    if (demoOrgError) throw demoOrgError;

    if (demoOrg) {
      return demoOrg.id;
    }

    // Attempt to insert
    const { data: newOrg, error } = await supabase
      .from('orgs')
      .insert({
        id: demoOrgId,
        name: 'TAC Cargo Demo',
        slug: 'tac-cargo-demo',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create default org:', error);
      throw error;
    }

    return newOrg.id;
  } catch (error) {
    console.error('Error in getOrCreateDefaultOrg:', error);
    // If everything fails, try to query one last time
    const { data: fallbackOrgs, error: fallbackError } = await supabase
      .from('orgs')
      .select('id')
      .limit(1);
    if (fallbackError) throw fallbackError;
    if (fallbackOrgs && fallbackOrgs.length > 0) {
      return fallbackOrgs[0].id;
    }
    throw new Error(
      'Could not find or create a default organization. Please check database permissions.'
    );
  }
}
