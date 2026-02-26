import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = process.cwd();

const TARGET_ROOTS = [
  'components/dashboard',
  'pages/Analytics.tsx',
  'pages/Dashboard.tsx',
  'pages/dashboard',
];

const EXCLUDE_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', '.archive']);

const FILE_EXTENSIONS = new Set(['.ts', '.tsx']);

const RULES = [
  {
    id: 'no-math-random',
    description: 'Math.random() is forbidden in dashboard/analytics paths',
    test: (line) => /\bMath\.random\s*\(/.test(line),
  },
  {
    id: 'no-numeric-or-fallback',
    description: 'Numeric fallback via || / ?? is forbidden in dashboard KPI/chart paths (e.g. || 10, ?? 100)',
    test: (line) => /(\|\||\?\?)\s*([1-9]\d*(?:\.\d+)?)/.test(line),
  },
  {
    id: 'no-fake-trend-copy',
    description: 'Hardcoded trend copy is forbidden (e.g. “Trending up by …”)',
    test: (line) => /Trending up by|Delivery rate up by|SLA Adherence/i.test(line),
  },
];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      files.push(...(await walk(path.join(dir, entry.name))));
      continue;
    }

    const ext = path.extname(entry.name);
    if (!FILE_EXTENSIONS.has(ext)) continue;

    files.push(path.join(dir, entry.name));
  }

  return files;
}

function toRelative(p) {
  return path.relative(REPO_ROOT, p).replace(/\\/g, '/');
}

async function collectTargetFiles() {
  const files = [];

  for (const rel of TARGET_ROOTS) {
    const abs = path.join(REPO_ROOT, rel);
    if (!(await exists(abs))) continue;

    const stat = await fs.stat(abs);
    if (stat.isDirectory()) {
      files.push(...(await walk(abs)));
    } else {
      const ext = path.extname(abs);
      if (FILE_EXTENSIONS.has(ext)) files.push(abs);
    }
  }

  // Deduplicate
  return Array.from(new Set(files));
}

async function main() {
  const targets = await collectTargetFiles();

  const violations = [];

  for (const file of targets) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const rule of RULES) {
        if (rule.test(line)) {
          violations.push({
            file: toRelative(file),
            line: i + 1,
            rule: rule.id,
            description: rule.description,
            snippet: line.trim().slice(0, 200),
          });
        }
      }
    }
  }

  if (violations.length > 0) {
     
    console.error('\n❌ No-mock-data guard failed. Violations:\n');

    for (const v of violations) {
       
      console.error(`- [${v.rule}] ${v.file}:${v.line} — ${v.description}`);
       
      console.error(`  ${v.snippet}`);
    }

     
    console.error('\nFix the violations above. If you believe this is a false positive, adjust the guard scope/patterns.');
    process.exit(1);
  }

   
  console.log(`✅ No-mock-data guard passed (${targets.length} files checked).`);
}

await main();
