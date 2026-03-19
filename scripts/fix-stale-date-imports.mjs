/**
 * fix-stale-date-imports.mjs
 * Removes stale `import { format } from 'date-fns'` lines in files that
 * no longer call format() anywhere.
 */
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const FILES = [
  'components/manifests/ManifestBuilder/steps/StepManifestSetup.tsx',
  'components/manifests/ManifestBuilder/ManifestBuilderWizard.tsx',
  'components/manifests/ManifestBuilder/ManifestScanLog.tsx',
  'components/domain/ShipmentCard.tsx',
  'components/domain/ShippingLabel.tsx',
  'components/domain/delivery-confirmation.tsx',
];

for (const rel of FILES) {
  const path = resolve(rel);
  let src;
  try {
    src = await readFile(path, 'utf8');
  } catch {
    console.warn(`  SKIP (not found): ${rel}`);
    continue;
  }

  // Count actual format( call sites (not in import lines)
  const lines = src.split('\n');
  const callLines = lines.filter(
    (l) => !l.includes('import') && l.includes('format(')
  );

  if (callLines.length > 0) {
    console.log(`  KEEP (still has ${callLines.length} format() calls): ${rel}`);
    continue;
  }

  // Remove the import line
  const updated = src.replace(
    /import\s*\{[^}]*\bformat\b[^}]*\}\s*from\s*['"]date-fns['"];\n?/g,
    (match) => {
      // If there are other imports from date-fns in the same line, just remove format
      const withoutFormat = match.replace(/\bformat\b,?\s*/g, '').replace(/,\s*\}/, ' }');
      // If the whole import becomes empty {}, remove the import
      if (/import\s*\{\s*\}\s*from/.test(withoutFormat)) return '';
      if (/import\s*\{\s*,/.test(withoutFormat)) return withoutFormat.replace(/,\s+/, '');
      return withoutFormat;
    }
  );

  await writeFile(path, updated, 'utf8');
  console.log(`  CLEANED: ${rel}`);
}

console.log('\n✅ Stale import cleanup complete');
