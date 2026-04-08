/**
 * fix-icon-classname.mjs
 * Replaces Lucide icon className sizing patterns with proper size/strokeWidth props.
 *
 * Replaces these patterns (where N = any digit):
 *   className="h-N w-N"     → size={S} strokeWidth={1.5}
 *   className="w-N h-N"     → size={S} strokeWidth={1.5}
 *   className="h-N w-N ..." → size={S} strokeWidth={1.5} className="..."
 *   className="... h-N w-N" → size={S} strokeWidth={1.5} className="..."
 *
 * Size mapping (Tailwind rem → px):
 *   w-3 h-3 → size={12}
 *   w-4 h-4 → size={16}
 *   w-5 h-5 → size={20}
 *   w-6 h-6 → size={24}
 *   w-8 h-8 → size={32}
 *
 * Safe rules:
 *   - Only touches self-closing JSX tags that look like icon components (PascalCase)
 *   - Skips <div>, <span>, <img>, <svg> and other HTML elements
 *   - Skips className strings where h-N and w-N are different values (asymmetric)
 *   - Preserves any remaining className content after removing h/w tokens
 *   - Skips .stories.tsx files to avoid touching knobs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';

const ROOTS = ['pages', 'components'];
const EXTS = new Set(['.tsx', '.ts']);

const SIZE_MAP = {
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
};

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && EXTS.has(extname(entry.name))) yield full;
  }
}

/**
 * Processes a single line, replacing icon className sizing.
 * Returns the modified line and how many replacements were made.
 */
function processLine(line) {
  let fixed = line;
  let count = 0;

  // Pattern: <ComponentName ... className="[prefix ]h-N w-N[ suffix]"[ ...] />
  // or       <ComponentName ... className="[prefix ]w-N h-N[ suffix]"[ ...] />
  // Component must be PascalCase (capital first letter)
  const RE = /<([A-Z][A-Za-z0-9]+)([^>]*?)className="([^"]*?)"/g;

  fixed = fixed.replace(RE, (match, tag, before, cls) => {
    // Parse size tokens from class string
    // Match h-N and w-N where N is a single or double digit number
    const hMatch = cls.match(/\bh-(\d+)\b/);
    const wMatch = cls.match(/\bw-(\d+)\b/);

    if (!hMatch || !wMatch) return match; // no sizing tokens found
    if (hMatch[1] !== wMatch[1]) return match; // asymmetric, skip

    const tailwindN = parseInt(hMatch[1]);
    const px = SIZE_MAP[tailwindN];
    if (!px) return match; // unknown size

    // Remove h-N and w-N from class list, keeping the rest
    let remaining = cls
      .replace(/\bh-\d+\b/g, '')
      .replace(/\bw-\d+\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    count++;

    const classAttr = remaining ? ` className="${remaining}"` : '';
    return `<${tag}${before}size={${px}} strokeWidth={1.5}${classAttr}"`;
  });

  // The regex above leaves a trailing `"` after the className value — clean it up
  // Only if we made replacements on this line
  if (count > 0) {
    // Remove dangling `"` that was the closing quote of the original className=""
    // Pattern: strokeWidth={1.5}" — the trailing quote is extra
    fixed = fixed.replace(/strokeWidth=\{1\.5\}"(\s*\/>)/g, 'strokeWidth={1.5}$1');
    fixed = fixed.replace(/strokeWidth=\{1\.5\}"(\s+[a-z])/g, 'strokeWidth={1.5}$1');
    fixed = fixed.replace(/strokeWidth=\{1\.5\}" /g, 'strokeWidth={1.5} ');
    fixed = fixed.replace(/strokeWidth=\{1\.5\}"\)/g, 'strokeWidth={1.5})');
  }

  return { line: fixed, count };
}

let totalFiles = 0;
let totalFixes = 0;
const changed = [];

for (const root of ROOTS) {
  for await (const filePath of walk(root)) {
    // Skip story files
    if (basename(filePath).includes('.stories.')) continue;

    const original = await readFile(filePath, 'utf8');
    if (!original.match(/\bh-\d+\b.*\bw-\d+\b|\bw-\d+\b.*\bh-\d+\b/)) continue;

    const lines = original.split('\n');
    let fileFixes = 0;
    const newLines = lines.map((l) => {
      const { line, count } = processLine(l);
      fileFixes += count;
      return line;
    });

    if (fileFixes === 0) continue;

    const updated = newLines.join('\n');
    if (updated !== original) {
      await writeFile(filePath, updated, 'utf8');
      changed.push({ file: filePath, fixes: fileFixes });
      totalFiles++;
      totalFixes += fileFixes;
    }
  }
}

console.log(`\n✅ Icon className fix complete`);
console.log(`   Files modified:      ${totalFiles}`);
console.log(`   Total replacements:  ${totalFixes}`);
console.log(`\nChanged files:`);
for (const { file, fixes } of changed) {
  console.log(`  [${fixes}x] ${file}`);
}
