# TAC Portal - Setup Guide

This guide covers the remaining configuration steps to fully deploy the TAC Portal.

---

## 1. Supabase RLS Policies

### Deploy via Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/002_rls_policies.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

### What This Does

- Enables Row Level Security on all 12 tables
- Creates helper functions: `get_user_org_id()`, `get_user_role()`, `has_role()`
- Sets up organization-scoped access policies
- Configures role-based permissions (ADMIN, MANAGER, OPS_STAFF, etc.)
- Creates audit log triggers for critical tables

---

## 2. Resend Email Configuration

### Step 1: Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Create an account or sign in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the key (starts with `re_`)

### Step 2: Add to Supabase Secrets

```bash
# Using Supabase CLI
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

Or via Supabase Dashboard:
1. Go to **Settings** → **Edge Functions**
2. Click **Manage Secrets**
3. Add: `RESEND_API_KEY` = `re_your_api_key_here`

### Step 3: Deploy Edge Function

```bash
# Deploy the send-email function
supabase functions deploy send-email
```

### Step 4: Enable in Application

Update your `.env.local`:

```env
VITE_RESEND_CONFIGURED=true
```

### Step 5: Configure Domain (Production)

For production emails:
1. Go to Resend Dashboard → **Domains**
2. Add your domain (e.g., `taccargo.com`)
3. Add the required DNS records
4. Update the `from` address in `supabase/functions/send-email/index.ts`

---

## 3. Running E2E Tests

### Prerequisites

- Application running on `http://localhost:3000`
- Valid test user credentials in the database

### Run All Tests

```bash
npm test
```

### Run with UI

```bash
npm run test:ui
```

### Run in Headed Mode (See Browser)

```bash
npm run test:headed
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/shipment-workflow.spec.ts
```

### View Test Report

```bash
npm run test:report
```

### Debug Tests

```bash
npm run test:debug
```

---

## 4. Environment Variables Reference

Copy `.env.example` to `.env.local` and configure:

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (Error Tracking)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project

# Email (Optional - set to true when Resend is configured)
VITE_RESEND_CONFIGURED=false
```

---

## 5. Development Workflow

### Start Development Server

```bash
npm run dev
```

### Type Check

```bash
npm run typecheck
```

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

---

## 6. Available Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/track` | Public | Public shipment tracking |
| `/login` | Public | Authentication |
| `/dashboard` | Authenticated | Main dashboard |
| `/shipments` | Authenticated | Shipment management |
| `/manifests` | OPS_STAFF+ | Manifest management |
| `/scanning` | WAREHOUSE+ | Barcode scanning |
| `/finance` | FINANCE_STAFF+ | Invoice management |
| `/management` | MANAGER+ | Staff & settings |
| `/dev/ui-kit` | ADMIN | Component documentation |

---

## 7. Test Credentials

For development/testing:

| Email | Password | Role |
|-------|----------|------|
| admin@taccargo.com | admin123 | ADMIN |

---

## 8. Troubleshooting

### Tests Failing on Auth

1. Ensure the dev server is running
2. Check test credentials match database
3. Delete `.auth/user.json` and retry

### Email Not Sending

1. Verify `VITE_RESEND_CONFIGURED=true` in `.env.local`
2. Check Resend API key in Supabase secrets
3. Verify edge function is deployed
4. Check Supabase function logs

### RLS Blocking Requests

1. Verify user is logged in
2. Check user has `org_id` in staff table
3. Verify role permissions in `types/domain.ts`

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env.local`
- [ ] Configure Supabase URL and anon key
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Deploy RLS policies to Supabase
- [ ] (Optional) Configure Resend for emails
- [ ] Run `npm test` to verify setup
