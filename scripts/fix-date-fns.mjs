/**
 * fix-date-fns.mjs
 * Migrates raw `import { format } from 'date-fns'` calls to the project's
 * canonical formatters from @/lib/formatters.
 *
 * Strategy:
 *   1. Replace the import line
 *   2. Replace `format(new Date(x), '...')` → `formatDateTime(x)` where the
 *      format string looks like a datetime (contains H or h)
 *   3. Replace `format(new Date(x), '...')` → `formatDate(x)` otherwise
 *
 * Files to skip (intentional date-fns usage):
 *   - date-time-picker.tsx (internal date picker implementation)
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

/**
 * Returns 'formatDateTime' if the date-fns format string contains time parts,
 * 'formatDate' otherwise.
 */
function chooseFn(fmtStr) {
  // date-fns tokens: H (24h), h (12h), m (minutes), s (seconds), a (am/pm), p (locale time)
  return /[Hhap]/.test(fmtStr) ? 'formatDateTime' : 'formatDate';
}

const FILES = [
  'pages/CustomerTrackingPage.tsx',
  'pages/ShiftReport.tsx',
  'components/domain/delivery-confirmation.tsx',
  'components/domain/ExceptionDetails.tsx',
  'components/domain/TrackingTimeline.tsx',
  'components/shipments/ShipmentDetails.tsx',    // ShipmentCard.tsx
  'components/manifests/ManifestBuilder/steps/StepManifestSetup.tsx',
  'components/manifests/ManifestBuilder/steps/StepReviewFinalize.tsx',
  'components/manifests/ManifestBuilder/ManifestBuilderWizard.tsx',
  'components/manifests/ManifestScanLog.tsx',
  'components/manifests/ManifestDetails.tsx',
  'components/manifests/ManifestList.tsx',
  'components/domain/shipment-timeline.tsx',
];

// Matches: format(new Date(expr), 'fmtStr')  or  format(new Date(expr), "fmtStr")
const FORMAT_RE = /format\(new Date\(([^)]+)\),\s*['"]([^'"]+)['"]\)/g;

// Matches: format(someVar, 'fmtStr')  — direct variable, no new Date wrap
const FORMAT_VAR_RE = /format\(([^,)]+),\s*['"]([^'"]+)['"]\)/g;

let totalFiles = 0;
let totalFixes = 0;

for (const rel of FILES) {
  const path = resolve(rel);
  let src;
  try {
    src = await readFile(path, 'utf8');
  } catch {
    console.warn(`  SKIP (not found): ${rel}`);
    continue;
  }

  if (!src.includes("from 'date-fns'") && !src.includes('from "date-fns"')) {
    console.log(`  SKIP (no date-fns): ${rel}`);
    continue;
  }

  let updated = src;
  let fixes = 0;

  // Step 1 — Replace format(new Date(x), 'fmt') patterns
  updated = updated.replace(FORMAT_RE, (_, expr, fmt) => {
    const fn = chooseFn(fmt);
    fixes++;
    return `${fn}(${expr})`;
  });

  // Step 2 — Replace format(someVar, 'fmt') where var looks like a date string
  updated = updated.replace(FORMAT_VAR_RE, (match, expr, fmt) => {
    // Skip if already processed (would be formatDate/formatDateTime)
    if (expr.includes('formatDate') || expr.includes('formatDateTime')) return match;
    // Skip pure date picker internal usage (next/prev month etc.)
    if (fmt === 'yyyy' || fmt === 'MMMM' || fmt === 'LLLL' || fmt === 'cccccc' || fmt === 'yyyy-MM-dd') return match;
    const fn = chooseFn(fmt);
    fixes++;
    return `${fn}(${expr})`;
  });

  if (fixes === 0) {
    console.log(`  OK (no format calls): ${rel}`);
    continue;
  }

  // Step 3 — Update import line
  // Detect which functions we now use
  const usesDateTime = updated.includes('formatDateTime');
  const usesDate = updated.includes('formatDate(') || updated.includes('formatDateShort');

  const importedFns = [
    usesDateTime && 'formatDateTime',
    usesDate && 'formatDate',
  ].filter(Boolean).join(', ');

  // Replace the date-fns import line
  updated = updated
    .replace(/import\s*\{[^}]*format[^}]*\}\s*from\s*['"]date-fns['"];?\n?/g, '')
    .replace(
      /(^|\n)(import .+?;\n)/,
      `$1$2import { ${importedFns} } from '@/lib/formatters';\n`
    );

  // If formatters import already exists, merge (avoid duplicate)
  const formatterImportRE = /import\s*\{([^}]+)\}\s*from\s*'@\/lib\/formatters';/g;
  const formatterMatches = [...updated.matchAll(formatterImportRE)];
  if (formatterMatches.length > 1) {
    // Deduplicate: collect all imported names, keep one import
    const allNames = new Set();
    for (const m of formatterMatches) {
      for (const n of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
        allNames.add(n);
      }
    }
    const merged = `import { ${[...allNames].join(', ')} } from '@/lib/formatters';`;
    let first = true;
    updated = updated.replace(formatterImportRE, () => {
      if (first) { first = false; return merged; }
      return '';
    });
  }

  await writeFile(path, updated, 'utf8');
  totalFiles++;
  totalFixes += fixes;
  console.log(`  [${fixes}x] ${rel}`);
}

console.log(`\n✅ date-fns migration complete`);
console.log(`   Files modified: ${totalFiles}`);
console.log(`   Total format() calls replaced: ${totalFixes}`);
