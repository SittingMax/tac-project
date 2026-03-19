/**
 * fix-icon-double-quote.mjs
 * Corrective script: removes extra trailing `"` introduced by the icon-classname
 * script when it handled remaining className content.
 *
 * The bug produced patterns like:
 *   size={16} strokeWidth={1.5} className="mr-2"" />
 * when original was:
 *   className="w-4 h-4 mr-2"
 *
 * This script removes the spurious extra `"` before ` />` or ` />\n`.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const ROOTS = ['pages', 'components'];
const EXTS = new Set(['.tsx', '.ts']);

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && EXTS.has(extname(entry.name))) yield full;
  }
}

// Match: the double-quote pattern before /> or ) or >
// e.g.  className="mr-2"" />   →  className="mr-2" />
//       className="text-foo""  →  className="text-foo"
const DOUBLE_QUOTE_RE = /""\s*(\/?>|\))/g;

let totalFiles = 0;
let totalFixes = 0;

for (const root of ROOTS) {
  for await (const filePath of walk(root)) {
    const original = await readFile(filePath, 'utf8');

    if (!original.includes('""')) continue;

    let fixCount = 0;
    const updated = original.replace(DOUBLE_QUOTE_RE, (_, closing) => {
      fixCount++;
      return `" ${closing}`;
    });

    if (fixCount > 0 && updated !== original) {
      await writeFile(filePath, updated, 'utf8');
      totalFiles++;
      totalFixes += fixCount;
      console.log(`  [${fixCount}x] ${filePath}`);
    }
  }
}

console.log(`\n✅ Double-quote fix complete`);
console.log(`   Files: ${totalFiles} | Replacements: ${totalFixes}`);
