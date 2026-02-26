# E2E Testing Guide - TAC Cargo Portal

## Overview

This directory contains end-to-end (E2E) tests for the TAC Cargo Portal using Playwright.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Playwright** installed (`npm install`)
3. **Development server** running on `http://localhost:3000`
4. **Test user** in Supabase database

## Test User Setup

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User**
4. Create user with:
   - Email: `admin@taccargo.com`
   - Password: `admin123`
5. Navigate to **Table Editor** → **staff**
6. Create corresponding staff record:
   ```
   email: admin@taccargo.com
   full_name: Test Admin
   role: ADMIN
   hub_code: IMF
   is_active: true
   ```

### Option 2: Using SQL (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Create test user in auth.users
-- Note: You may need to use Supabase dashboard to create the auth user
-- as direct auth.users manipulation requires service role

-- After creating the auth user via dashboard, create staff record:
INSERT INTO staff (
  email, 
  full_name, 
  role, 
  hub_code, 
  is_active,
  created_at
)
VALUES (
  'admin@taccargo.com',
  'Test Admin',
  'ADMIN',
  'IMF',
  true,
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

### Option 3: Using Environment Variables

Create a `.env.test` file:

```env
TEST_USER_EMAIL=your-existing-user@example.com
TEST_USER_PASSWORD=your-password
BASE_URL=http://localhost:3000
```

Then update test files to use these variables.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in debug mode
```bash
npm run test:debug
```

### View last test report
```bash
npm run test:report
```

## Test Structure

```
tests/
├── e2e/
│   ├── auth.setup.ts           # Authentication setup (runs first)
│   ├── shipment-workflow.spec.ts  # Shipment CRUD tests
│   └── manifest-workflow.spec.ts  # Manifest and scanning tests
└── README.md                   # This file
```

## Test Suites

### 1. Authentication Setup (`auth.setup.ts`)
- Logs in once and saves authentication state
- All other tests reuse this authenticated session
- Runs before all other tests

### 2. Shipment Workflow (`shipment-workflow.spec.ts`)
- Create new shipment
- Search and view shipment details
- Track shipment status
- Public tracking without authentication

### 3. Manifest Workflow (`manifest-workflow.spec.ts`)
- Create new manifest
- View manifest details
- Close manifest
- Scanning page functionality
- Scan mode switching
- Manual AWB entry

## Configuration

Test configuration is in `playwright.config.ts`:

- **Base URL:** `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browsers:** Chromium, Firefox, Mobile Chrome
- **Retries:** 2 retries in CI, 0 locally
- **Timeout:** 10 seconds per action
- **Screenshots:** On failure only
- **Videos:** On first retry
- **Traces:** On first retry

## Troubleshooting

### Tests fail with "TimeoutError: page.waitForURL"
- **Cause:** Test user doesn't exist or credentials are wrong
- **Fix:** Create test user following setup instructions above

### Tests fail with "ReferenceError: __dirname is not defined"
- **Cause:** ES module compatibility issue
- **Fix:** Already fixed in codebase (uses `fileURLToPath` polyfill)

### Dev server doesn't start automatically
- **Cause:** Port 3000 already in use
- **Fix:** Stop other processes on port 3000 or change port in config

### Authentication state not persisting
- **Cause:** `.auth/user.json` file not being created
- **Fix:** Ensure auth.setup.ts runs successfully first

## Best Practices

1. **Keep tests independent** - Each test should work in isolation
2. **Use data-testid** - Add test IDs to critical elements
3. **Avoid hardcoded waits** - Use Playwright's auto-waiting
4. **Clean up test data** - Remove test data after tests (future improvement)
5. **Use Page Object Model** - Consider refactoring to POM pattern

## CI/CD Integration

For GitHub Actions or similar:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test
  env:
    BASE_URL: http://localhost:3000
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Future Improvements

- [ ] Add visual regression testing
- [ ] Add accessibility testing (axe-core)
- [ ] Add performance testing (Lighthouse)
- [ ] Implement Page Object Model pattern
- [ ] Add test data seeding/cleanup
- [ ] Add API testing for backend endpoints
- [ ] Add mobile-specific tests
- [ ] Add cross-browser compatibility tests

## Support

For issues or questions:
1. Check the test report: `npx playwright show-report`
2. Review screenshots in `test-results/`
3. Check the main project README
4. Contact the development team
