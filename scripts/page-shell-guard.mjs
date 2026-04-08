import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = process.cwd();

const TARGET_FILES = [
  'pages/Dashboard.tsx',
  'pages/Shipments.tsx',
  'pages/Manifests.tsx',
  'pages/Finance.tsx',
  'pages/Customers.tsx',
  'pages/Inventory.tsx',
  'pages/Exceptions.tsx',
  'pages/Settings.tsx',
  'pages/Management.tsx',
  'pages/Bookings.tsx',
  'pages/Notifications.tsx',
  'pages/SearchResults.tsx',
  'pages/ShiftReport.tsx',
  'pages/WarehouseDashboard.tsx',
  'pages/AnalyticsDashboard.tsx',
  'pages/Scanning.tsx',
  'pages/ShipmentDetailsPage.tsx',
  'pages/admin/Messages.tsx',
];

const RULES = [
  {
    id: 'require-page-container',
    description: 'Authenticated page must render <PageContainer>.',
    test: (content) => /<PageContainer\b/.test(content),
  },
  {
    id: 'require-page-header',
    description: 'Authenticated page must render <PageHeader>.',
    test: (content) => /<PageHeader\b/.test(content),
  },
  {
    id: 'forbid-legacy-page-header',
    description: 'Legacy ui page-header import is forbidden on guarded pages.',
    test: (content) => !/components\/ui\/page-header/.test(content),
  },
];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const violations = [];
  let checkedCount = 0;

  for (const relativePath of TARGET_FILES) {
    const absolutePath = path.join(REPO_ROOT, relativePath);
    if (!(await exists(absolutePath))) {
      continue;
    }

    checkedCount += 1;
    const content = await fs.readFile(absolutePath, 'utf8');

    for (const rule of RULES) {
      if (!rule.test(content)) {
        violations.push({
          file: relativePath,
          rule: rule.id,
          description: rule.description,
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error('\n❌ Page-shell guard failed. Violations:\n');

    for (const violation of violations) {
      console.error(`- [${violation.rule}] ${violation.file} — ${violation.description}`);
    }

    console.error('\nAlign the page with shared ui-core shell primitives before merging.');
    process.exit(1);
  }

  console.log(`✅ Page-shell guard passed (${checkedCount} files checked).`);
}

await main();
