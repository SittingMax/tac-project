/**
 * fix-non-icon-props.mjs
 * Removes incorrectly injected size={N} strokeWidth={1.5} props from
 * non-icon components: Skeleton, Button (duplicate size), etc.
 *
 * Patterns to fix:
 * 1. <Skeleton size={N} strokeWidth={1.5} ... />  → restore to className="h-N w-N ..."
 * 2. <Button ... size="icon" size={N} strokeWidth={1.5} ...>  → remove the duplicate
 * 3. <Icon ... strokeWidth={1.5} strokeWidth={2} ...>  → remove the extra strokeWidth
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const FILES = [
  'components/crud/CrudRowActions.tsx',
  'components/landing-new/footer.tsx',
  'components/theme-toggle.tsx',
  'components/ui/skeleton.tsx',
  'components/ui/skeletons.tsx',
  'pages/DevUIKit.tsx',
  'pages/Scanning.tsx',
  'components/settings/tables/HubTable.tsx',
  'components/settings/tables/UsersTable.tsx',
  'components/layout/UserProfile.tsx',
  'components/domain/TrackingTimeline.tsx',
];

let totalFixed = 0;

for (const rel of FILES) {
  const path = resolve(rel);
  const src = await readFile(path, 'utf8');
  let updated = src;
  let fixes = 0;

  // Fix 1: <Skeleton size={N} strokeWidth={1.5} .../> 
  // → <Skeleton className="w-N h-N" .../> (restore the original className)
  // These are actual Skeleton components, not icons
  const skeletonRE = /<(Skeleton)\s+size=\{(\d+)\}\s+strokeWidth=\{1\.5\}(\s+className="([^"]*)")?\s*\/>/g;
  updated = updated.replace(skeletonRE, (match, tag, sizeVal, _classAttr, existingClass) => {
    fixes++;
    const px = parseInt(sizeVal);
    // Convert px back to h-X w-X pattern
    const twSize = px / 4; // 16→4, 32→8, 40→10
    const baseClass = `h-${twSize} w-${twSize}`;
    const cls = existingClass ? `${baseClass} ${existingClass}`.trim() : baseClass;
    return `<${tag} className="${cls}" />`;
  });

  // Fix 2: Button with duplicate size — <Button ... size="xxx" size={N} strokeWidth={1.5} ...>
  // Remove the wrongly added size={N} strokeWidth={1.5}
  updated = updated.replace(/(<Button\b[^>]*?)\s+size=\{\d+\}\s+strokeWidth=\{1\.5\}/g, (match, before) => {
    fixes++;
    return before;
  });

  // Fix 3: Duplicate strokeWidth — strokeWidth={1.5} strokeWidth={2} → strokeWidth={1.5}
  updated = updated.replace(/strokeWidth=\{1\.5\}\s+strokeWidth=\{\d+\.?\d*\}/g, () => {
    fixes++;
    return 'strokeWidth={1.5}';
  });

  // Fix 4: Any remaining size={N} strokeWidth={1.5} on lower-case/non-icon components
  // like <div>, <span>, <svg> — though the original script only targeted PascalCase
  // Target specifically known non-icon PascalCases that got hit
  const NON_ICONS = ['Skeleton', 'Button', 'ResizablePanel'];
  for (const comp of NON_ICONS) {
    const re = new RegExp(`(<${comp}\\b[^>]*?)\\s+size=\\{\\d+\\}\\s+strokeWidth=\\{1\\.5\\}`, 'g');
    updated = updated.replace(re, (_, before) => { fixes++; return before; });
  }

  if (fixes > 0 && updated !== src) {
    await writeFile(path, updated, 'utf8');
    console.log(`  [${fixes}x] ${rel}`);
    totalFixed += fixes;
  } else {
    console.log(`  OK: ${rel}`);
  }
}

console.log(`\n✅ Non-icon prop fix complete: ${totalFixed} fixes`);
