import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const SCAN_ROOTS = ['components', 'pages'];
const EXCLUDE = new Set(['node_modules', 'dist', '.git', 'ui-core/data/chart-card.tsx']);

const RULES = [
  { id: 'no-hardcoded-gray', pattern: /\b(?:bg|text|border|ring)-(gray|slate|zinc|neutral)-/, msg: 'Use semantic tokens (bg-muted, text-muted-foreground, etc.)' },
  { id: 'no-inline-style', pattern: /style=\{\{/, msg: 'Use Tailwind tokens, not inline styles' },
  { id: 'no-rounded-lg-xl', pattern: /rounded-(?:lg|xl|2xl|3xl)/, msg: 'All radii are 0px via CSS vars — remove rounded-lg/xl classes' },
];

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { 
      if (!EXCLUDE.has(entry.name)) yield* walk(full); 
    }
    else if (/\.[jt]sx?$/.test(entry.name)) yield full;
  }
}

async function main() {
  let violations = 0;
  for (const root of SCAN_ROOTS) {
    for await (const file of walk(path.join(REPO_ROOT, root))) {
      const rel = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
      const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        for (const rule of RULES) {
          if (rule.pattern.test(lines[i])) {
            console.error(`[${rule.id}] ${rel}:${i + 1} — ${rule.msg}`);
            console.error(`  ${lines[i].trim().slice(0, 120)}`);
            violations++;
          }
        }
      }
    }
  }

  if (violations > 0) { 
    console.error(`\n❌ ${violations} design-system violation(s) found.`); 
    process.exit(1); 
  }
  
  console.log('✅ Design-system guard passed.');
}

main().catch((err) => {
  console.error('Fatal error running design-system guard:', err);
  process.exit(1);
});
