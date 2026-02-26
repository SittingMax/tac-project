#!/usr/bin/env node
/**
 * Verify RBAC Migration
 * Checks that permissions tables and functions exist
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function query(sql) {
    const response = await fetch(
        `https://api.supabase.com/v1/projects/xkkhxhgkyavxcfgeojww/database/query`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        }
    );
    return response.json();
}

async function main() {
    console.log('🔍 Verifying RBAC Migration...\n');

    // Check permissions table
    console.log('1. Checking permissions table...');
    const permsResult = await query('SELECT COUNT(*) as count FROM permissions');
    console.log(`   ✅ Permissions table exists with ${permsResult[0]?.count || 0} records`);

    // Check role_permissions table
    console.log('\n2. Checking role_permissions table...');
    const rolePermsResult = await query('SELECT role, COUNT(*) as count FROM role_permissions GROUP BY role ORDER BY role');
    console.log('   ✅ Role permissions by role:');
    rolePermsResult.forEach(r => console.log(`      - ${r.role}: ${r.count} permissions`));

    // Check E2E test org
    console.log('\n3. Checking E2E test organization...');
    const orgResult = await query("SELECT name FROM orgs WHERE id = '00000000-0000-0000-0000-000000000001'::uuid");
    if (orgResult.length > 0) {
        console.log(`   ✅ E2E Test Org exists: "${orgResult[0].name}"`);
    } else {
        console.log('   ❌ E2E Test Org not found');
    }

    // Check E2E test hub
    console.log('\n4. Checking E2E test hub...');
    const hubResult = await query("SELECT name, code FROM hubs WHERE id = '00000000-0000-0000-0000-000000000002'::uuid");
    if (hubResult.length > 0) {
        console.log(`   ✅ E2E Test Hub exists: "${hubResult[0].name}" (${hubResult[0].code})`);
    } else {
        console.log('   ❌ E2E Test Hub not found');
    }

    // Check E2E test staff
    console.log('\n5. Checking E2E test staff...');
    const staffResult = await query("SELECT email, role FROM staff WHERE email LIKE 'e2e-%@test.local'");
    if (staffResult.length > 0) {
        console.log(`   ✅ E2E Test Staff (${staffResult.length} users):`);
        staffResult.forEach(s => console.log(`      - ${s.email} (${s.role})`));
    } else {
        console.log('   ❌ E2E Test Staff not found');
    }

    // Check functions exist
    console.log('\n6. Checking RBAC functions...');
    const funcsResult = await query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('has_permission', 'has_any_permission', 'can_access_module', 'get_user_permissions')
  `);
    const funcNames = funcsResult.map(f => f.routine_name);
    const expectedFuncs = ['has_permission', 'has_any_permission', 'can_access_module', 'get_user_permissions'];
    expectedFuncs.forEach(fn => {
        if (funcNames.includes(fn)) {
            console.log(`   ✅ ${fn}() exists`);
        } else {
            console.log(`   ❌ ${fn}() missing`);
        }
    });

    console.log('\n' + '═'.repeat(50));
    console.log('✅ RBAC Migration Verification Complete!');
}

main().catch(console.error);
