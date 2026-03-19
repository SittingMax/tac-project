import fs from 'node:fs/promises';
import path from 'node:path';

// Pages that are intentionally excluded from the PageContainer contract:
const EXCLUDE_PAGES = new Set([
  'LandingPage.tsx', 
  'PublicTracking.tsx', 
  'NotFound.tsx',
  'PrintLabel.tsx', 
  'PrivacyPolicy.tsx', 
  'TermsOfService.tsx', 
  'CustomerTrackingPage.tsx'
]);

async function main() {
  const pagesDir = path.join(process.cwd(), 'pages');
  const entries = (await fs.readdir(pagesDir, { withFileTypes: true }))
    .filter(e => e.isFile() && e.name.endsWith('.tsx') && !EXCLUDE_PAGES.has(e.name));

  let violations = 0;
  for (const entry of entries) {
    const content = await fs.readFile(path.join(pagesDir, entry.name), 'utf8');
    // Basic check for the wrapper component
    if (!content.includes('PageContainer')) {
      console.error(`[page-shell] pages/${entry.name} — missing <PageContainer> wrapper`);
      violations++;
    }
  }

  if (violations > 0) { 
    console.error(`\n❌ ${violations} page-shell violation(s).`); 
    process.exit(1); 
  }
  
  console.log(`✅ Page shell guard passed (${entries.length} pages checked).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
