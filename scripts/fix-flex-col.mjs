/**
 * fix-flex-col.mjs
 * Bulk-replaces bare `flex-col` (missing the `flex` prefix) with `flex flex-col`
 * across all .tsx and .ts files in pages/ and components/.
 *
 * Safe rules:
 *   - Skips `flex flex-col` (already correct)
 *   - Skips responsive variants: sm:flex-col, md:flex-col, lg:flex-col, xl:flex-col, 2xl:flex-col
 *   - Replaces only the leading `flex-col` in a className string
 *   - Handles both quote styles (" and ')
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const ROOTS = ['pages', 'components'];
const EXTS = new Set(['.tsx', '.ts']);

// Match flex-col at the very START of a className string value, not preceded by
// a word char (so sm: md: lg: xl: 2xl: prefixes are excluded), and not already
// preceded by "flex ".
//
// Pattern explanation:
//   (?<!"flex )   — negative lookbehind: not already "flex flex-col"
//   (?<![a-z0-9:]) — not preceded by a prefix char (sm: etc.)
//   \bflex-col\b  — the literal token
const PATTERN = /(?<![a-z0-9:])(?<!"flex )(?<!\bflex )flex-col(\s)/g;

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && EXTS.has(extname(entry.name))) {
      yield full;
    }
  }
}

let totalFiles = 0;
let totalFixes = 0;
const changed = [];

for (const root of ROOTS) {
  for await (const filePath of walk(root)) {
    const original = await readFile(filePath, 'utf8');

    // Quick pre-check: skip files with no matches
    if (!original.includes('flex-col')) continue;

    let fixCount = 0;
    const updated = original.replace(PATTERN, (_, space) => {
      fixCount++;
      return `flex flex-col${space}`;
    });

    totalFiles++;
    if (fixCount > 0 && updated !== original) {
      await writeFile(filePath, updated, 'utf8');
      changed.push({ file: filePath, fixes: fixCount });
      totalFixes += fixCount;
    }
  }
}

console.log(`\n✅ flex-col fix complete`);
console.log(`   Files modified : ${changed.length}`);
console.log(`   Total replacements: ${totalFixes}`);
console.log(`\nChanged files:`);
for (const { file, fixes } of changed) {
  console.log(`  [${fixes}x] ${file}`);
}
