
import { readFileSync } from 'fs';
import { resolve, join } from 'path';

// Credentials for Management API
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!PROJECT_REF || !ACCESS_TOKEN) {
    console.error('❌ Error: Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN environment variables');
    process.exit(1);
}

async function executeSQL(sql) {
    console.log(`Executing SQL migration via Management API (${sql.length} bytes)...`);

    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to execute SQL: ${errorText}`);
    }

    console.log('✅ Migration executed successfully');
}

async function main() {
    const migrationFile = '20260214013000_fix_org_rls.sql';
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile);

    console.log(`Reading migration file: ${migrationPath}`);

    try {
        const sql = readFileSync(migrationPath, 'utf-8');
        await executeSQL(sql);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
