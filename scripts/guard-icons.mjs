import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const ALLOWED_IN = ['components/ui-core', 'components/ui'];

const isAllowed = (rel) => ALLOWED_IN.some(a => rel.startsWith(a));

async function* walk(dir, skip = new Set(['node_modules', 'dist', '.git'])) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { 
      if (!skip.has(e.name)) yield* walk(full, skip); 
    }
    else if (/\.[jt]sx?$/.test(e.name)) yield full;
  }
}

async function main() {
  let violations = 0;
  
  for await (const file of walk(path.join(REPO_ROOT, 'components'))) {
    const rel = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
    if (isAllowed(rel)) continue;
    
    // Quick skip if not JS/TS
    if (!rel.endsWith('.ts') && !rel.endsWith('.tsx')) continue;
    
    const content = await fs.readFile(file, 'utf8');
    if (content.match(/from\s+['"]lucide-react['"]/)) {
      console.error(`[icon-direct-import] ${rel} — use <AppIcon> from @/components/ui-core instead`);
      violations++;
    }
  }

  for await (const file of walk(path.join(REPO_ROOT, 'pages'))) {
    const rel = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
    if (!rel.endsWith('.ts') && !rel.endsWith('.tsx')) continue;

    const content = await fs.readFile(file, 'utf8');
    if (content.match(/from\s+['"]lucide-react['"]/)) {
      console.error(`[icon-direct-import] ${rel} — use <AppIcon> from @/components/ui-core instead`);
      violations++;
    }
  }

  if (violations > 0) { 
    console.error(`\n❌ ${violations} icon guard violation(s).`); 
    // WARN ONLY: Do not fail exit code until pages are refactored
    console.log('Currently in warn-only mode.');
    process.exit(0); 
  }
  
  console.log('✅ Icon guard passed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
