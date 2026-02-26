# TAC Portal — Comprehensive Code Review Prompt

> Use this prompt with an AI coding assistant or as a manual review checklist to audit the **entire** TAC Portal codebase. The review covers every user-facing flow (Landing → Login → Dashboard → every sub-page), the full backend integration, state management, design system, performance, accessibility, and security.

---

## INSTRUCTIONS FOR THE REVIEWER

You are performing a deep, exhaustive code review of the **TAC Portal** project — a logistics/courier management SPA built with **React 19 + TypeScript**, **Vite**, **Supabase** (auth, database, edge functions, realtime), **Zustand** state management, **React Query**, **shadcn/ui** component library (Radix-based), **Framer Motion / GSAP** animations, and **Recharts** charting.

Review every file mentioned below. For each area, identify:
1. **Bugs** — logic errors, race conditions, null/undefined risks, unhandled promise rejections.
2. **Security vulnerabilities** — XSS, injection, exposed secrets, improper RLS, missing auth guards.
3. **Performance issues** — unnecessary re-renders, missing memoization, bundle bloat, N+1 queries.
4. **UX/Accessibility gaps** — missing ARIA labels, keyboard navigation, focus management, color contrast.
5. **Code quality** — dead code, duplicated logic, inconsistent patterns, naming conventions.
6. **Type safety** — `any` usage, missing types, unsafe casts, schema-code drift.
7. **Architectural concerns** — circular dependencies, layer violations, unclear separation of concerns.

Provide findings as a prioritized list: **Critical → High → Medium → Low**, with file paths, line references, and suggested fixes.

---

## 1. PROJECT ENTRY POINTS & ROUTING

### Files to review:
- `index.html` — Meta tags, SEO, CSP headers, font/script loading order, favicon
- `index.tsx` — React root mount, StrictMode usage, provider wrapping order
- `App.tsx` (700 lines) — **THE MAIN FILE**: routing, lazy loading, Login component, ProtectedRoute, DashboardLayout

### Specific checks:
- [ ] Verify every `<Route>` has a corresponding lazy-loaded page and proper error boundaries
- [ ] Audit `ProtectedRoute` — does it correctly enforce auth AND RBAC (`allowedRoles`) for every protected route?
- [ ] Is the `Login` component (lines 87–324 in App.tsx) correctly separated or should it be extracted to its own file?
- [ ] Check the `DashboardLayout` wrapper (lines 392–412) — does it properly handle sidebar state, responsive behavior?
- [ ] Is the 404 (`NotFound`) route properly configured as a catch-all?
- [ ] Verify `Suspense` fallback is user-friendly and consistently applied
- [ ] Check for route-level code splitting effectiveness — are chunks reasonably sized?
- [ ] Audit `Navigate` redirects — are there redirect loops possible?
- [ ] Verify `PublicTracking` route is genuinely public and doesn't require auth

---

## 2. LANDING PAGE (Public)

### Files to review:
- `pages/LandingPage.tsx` — Page shell/composition
- `components/landing-new/navbar.tsx` — Navigation bar, mobile menu, CTA links
- `components/landing-new/hero-section.tsx` — Hero content, CTA buttons
- `components/landing-new/hero-overlays.tsx` — Visual overlays on hero
- `components/landing-new/dyson-sphere.tsx` — 3D/animated visual element
- `components/landing-new/modern-globe.tsx` — Interactive globe visualization
- `components/landing-new/system-ticker.tsx` — Live system ticker/stats
- `components/landing-new/system-capabilities.tsx` — Feature showcase section
- `components/landing-new/tracking-section.tsx` — Public tracking input section
- `components/landing-new/tracking-dialog.tsx` — Tracking modal/dialog
- `components/landing-new/tracking-result-card.tsx` — Tracking results display
- `components/landing-new/stats-cta.tsx` — Statistics & CTA section
- `components/landing-new/global-fleet.tsx` — Fleet/network visualization
- `components/landing-new/trusted-by.tsx` — Social proof / partner logos
- `components/landing-new/contact-section.tsx` — Contact form
- `components/landing-new/footer.tsx` — Footer with links
- `components/landing-new/tac-bot.tsx` — AI chatbot widget
- `components/landing-new/about.tsx` — About section

### Specific checks:
- [ ] **Tracking flow**: Does public tracking work without authentication? Verify Supabase RLS allows public read on tracking data
- [ ] **Navbar**: Smooth scroll links work correctly? Logo scrolls to top? Mobile hamburger menu opens/closes properly?
- [ ] **Globe/Dyson Sphere**: Are WebGL/Canvas elements properly cleaned up on unmount? Memory leak risk?
- [ ] **Contact form**: Input validation, spam protection, email sending integration
- [ ] **TacBot**: What API does it call? Is the API key exposed client-side? Rate limiting?
- [ ] **Performance**: Are heavy 3D assets lazy-loaded? Do animations cause jank on mobile? `IntersectionObserver` usage?
- [ ] **SEO**: Proper heading hierarchy (single H1), meta descriptions, Open Graph tags
- [ ] **Responsive design**: Does every section look correct on mobile (320px), tablet (768px), desktop (1440px)?
- [ ] **Theme switching**: Do all sections work in BOTH light and dark mode? Check contrast ratios
- [ ] **Accessibility**: Can the entire landing page be navigated via keyboard? Screen reader friendly?

---

## 3. AUTHENTICATION & LOGIN

### Files to review:
- `App.tsx` → `Login` component (lines 87–324)
- `components/auth/LoginPage.tsx` (18.9 KB) — Full login page component
- `store/authStore.ts` (16.7 KB) — Auth state management (Zustand)
- `lib/supabase.ts` — Supabase client initialization
- `lib/env.ts` — Environment variable handling
- `hooks/useRBAC.ts` — Role-Based Access Control hook
- `hooks/useIdleTimeout.ts` — Session idle timeout

### Specific checks:
- [ ] **Which Login component is actually used?** There's one in `App.tsx` (lines 87–324) AND one in `components/auth/LoginPage.tsx`. Is one dead code?
- [ ] **Auth flow**: Login → session creation → redirect to dashboard. Any gaps?
- [ ] **Password handling**: Is the password field properly masked? No logging of credentials?
- [ ] **Error messages**: Are auth errors user-friendly without leaking info (e.g., "user not found" vs generic error)?
- [ ] **Session persistence**: How is the session stored? `localStorage` vs cookies? Token refresh logic?
- [ ] **Auth state sync**: Does `authStore.ts` properly handle Supabase `onAuthStateChange` listeners? Cleanup on unmount?
- [ ] **RBAC enforcement**: Does `useRBAC.ts` correctly derive permissions from the user's role? Where are roles stored (Supabase `user_metadata`, `app_metadata`, or custom table)?
- [ ] **Idle timeout**: Does `useIdleTimeout.ts` properly sign the user out? Does it warn before logout?
- [ ] **`supabase.ts`**: Is the Supabase URL and anon key safely loaded from env? No hardcoded secrets?
- [ ] **Rate limiting**: Is there protection against brute-force login attempts?
- [ ] **OAuth / SSO**: Any social login support? If so, verify callback URLs

---

## 4. DASHBOARD (Main Overview)

### Files to review:
- `pages/Dashboard.tsx` — Dashboard page shell
- `components/dashboard/KPIGrid.tsx` — Key Performance Indicator cards
- `components/dashboard/Charts.tsx` — Chart wrapper
- `components/dashboard/charts/` — Individual chart components (3 files)
- `components/dashboard/QuickActions.tsx` — Action buttons/shortcuts
- `components/dashboard/RecentActivity.tsx` — Recent activity feed

### Specific checks:
- [ ] **Data freshness**: How is dashboard data fetched? React Query with proper `staleTime`/`refetchInterval`?
- [ ] **KPI accuracy**: Do KPIs match the underlying data? Any aggregation bugs?
- [ ] **Charts**: Are Recharts components responsive? Do they handle empty data gracefully?
- [ ] **Quick Actions**: Do all quick action buttons navigate to the correct pages?
- [ ] **Recent Activity**: Is it paginated? What happens with thousands of entries?
- [ ] **Loading states**: Proper skeletons/spinners while data loads?
- [ ] **Error states**: What happens if API calls fail? Graceful degradation?
- [ ] **Real-time updates**: Is `useRealtime.ts` used here? Does the dashboard auto-refresh?

---

## 5. SHIPMENTS MODULE

### Files to review:
- `pages/Shipments.tsx` — Shipments list page
- `components/shipments/CreateShipmentForm.tsx` — New shipment form
- `components/shipments/ShipmentDetails.tsx` — Shipment detail view
- `components/shipments/shipments.columns.tsx` — DataTable column definitions
- `components/domain/ShipmentCard.tsx` — Shipment card component
- `components/domain/StatusBadge.tsx` — Status indicator
- `components/domain/ShippingLabel.tsx` — Shipping label component
- `hooks/useShipments.ts` (8.5 KB) — Shipment data hook
- `lib/services/shipmentService.ts` (8.8 KB) — Shipment API service
- `lib/schemas/shipment.schema.ts` — Zod validation schema

### Specific checks:
- [ ] **CRUD operations**: Create, Read, Update, Delete all work correctly?
- [ ] **Form validation**: Does `CreateShipmentForm` use Zod schema validation? All required fields enforced?
- [ ] **Status transitions**: Are shipment status changes validated (e.g., can't go from "delivered" back to "pending")?
- [ ] **Label generation**: Does the label print flow work? `PrintLabel.tsx` (12.2 KB) — PDF generation via `lib/pdf-generator.ts` (27.1 KB)?
- [ ] **Label preview**: `components/domain/LabelPreviewDialog.tsx` — Does it render correctly?
- [ ] **Export**: CSV/data export functionality working?
- [ ] **Pagination & filtering**: Does the data table handle large datasets?
- [ ] **Column definitions**: Are `shipments.columns.tsx` definitions type-safe and complete?
- [ ] **Receiver/Sender fields**: Migration `008_shipment_receiver_sender_rename.sql` renamed fields — is the frontend fully updated?

---

## 6. MANIFESTS MODULE

### Files to review:
- `pages/Manifests.tsx` — Manifest list page
- `components/manifests/ManifestList.tsx` — Manifest listing
- `components/manifests/ManifestDetails.tsx` — Manifest detail view
- `components/manifests/ManifestPrintView.tsx` — Print view
- `components/manifests/ManifestBuilder/` — 12 files for manifest builder wizard
- `hooks/useManifests.ts` (12.9 KB) — Manifest data hook
- `hooks/useManifestBuilder.ts` (8.9 KB) — Builder logic hook
- `hooks/useManifestScan.ts` (10.7 KB) — Scan-to-manifest hook
- `hooks/useCloseManifest.ts` (7.0 KB) — Manifest closing logic
- `lib/services/manifestService.ts` (29.9 KB) — **LARGEST SERVICE FILE** — Manifest API
- `supabase/functions/close-manifest/` — Edge function for closing manifests

### Specific checks:
- [ ] **Builder wizard**: Is the multi-step manifest builder flow correct? Can you go back/forward without data loss?
- [ ] **Scan integration**: Does barcode/QR scanning add shipments to manifest correctly?
- [ ] **Close manifest flow**: Does the edge function `close-manifest` properly finalize? What happens if it fails mid-operation?
- [ ] **`manifestService.ts` (30KB)**: This is very large — should it be split? Any duplicated logic?
- [ ] **Print view**: Does `ManifestPrintView.tsx` render correctly for printing? CSS `@media print`?
- [ ] **Hub codes**: Migration `012_enforce_imf_hub_codes.sql` — are hub codes validated in the frontend?
- [ ] **Enterprise features**: Migration `006_manifest_enterprise_upgrade.sql` (27KB) — are all new fields used in the UI?

---

## 7. SCANNING MODULE

### Files to review:
- `pages/Scanning.tsx` (17.7 KB) — Scanning page (large file)
- `components/scanning/` — Scanning components
- `lib/scanParser.ts` — Barcode/QR scan parsing logic
- `store/scanQueueStore.ts` (8.5 KB) — Scan queue state management

### Specific checks:
- [ ] **Camera/scanner integration**: How is the scanner hardware accessed? WebRTC? External library?
- [ ] **Parse accuracy**: Does `scanParser.ts` handle all barcode formats correctly? Edge cases (partial scans, invalid codes)?
- [ ] **Queue management**: Does `scanQueueStore.ts` handle offline queuing? What happens if network drops mid-batch?
- [ ] **Scan-to-action flow**: After scanning, what actions are available? Status update, add to manifest, etc.?
- [ ] **Audio/visual feedback**: Does the scanner provide success/error feedback?
- [ ] **Performance**: Can it handle rapid successive scans without lag?

---

## 8. FINANCE / INVOICING MODULE

### Files to review:
- `pages/Finance.tsx` (23.0 KB) — Finance overview page
- `components/finance/MultiStepCreateInvoice.tsx` (62.4 KB) — **LARGEST COMPONENT** — Multi-step invoice creator
- `components/finance/InvoiceDetails.tsx` — Invoice detail view
- `components/finance/invoices.columns.tsx` — Invoice table columns
- `components/finance/CreateInvoiceForm.tsx` — Simple invoice form
- `hooks/useInvoices.ts` (6.5 KB) — Invoice data hook
- `lib/services/invoiceService.ts` (5.8 KB) — Invoice API service

### Specific checks:
- [ ] **`MultiStepCreateInvoice.tsx` (62KB)**: This file is **extremely large** — does it need to be broken up? Is form state managed correctly across steps?
- [ ] **Invoice numbering**: Migration `004_invoice_numbering.sql` — sequential numbering? Race conditions in concurrent creation?
- [ ] **Invoice RLS**: Migration `005_invoice_rls_and_audit.sql` — are invoices properly scoped to organizations?
- [ ] **Financial calculations**: Subtotals, taxes, totals — any floating-point precision issues? Use of `Decimal.js` or similar?
- [ ] **Audit trail**: Are invoice changes logged? Who created/modified/deleted?
- [ ] **PDF export**: Can invoices be exported as PDF?
- [ ] **Currency handling**: Is there multi-currency support? Formatting?

---

## 9. CUSTOMERS MODULE

### Files to review:
- `pages/Customers.tsx` (12.1 KB) — Customer management page
- `components/domain/CustomerDetails.tsx` — Customer detail view
- `hooks/useCustomers.ts` (6.2 KB) — Customer data hook
- `lib/services/customerService.ts` — Customer API service
- `lib/schemas/customers.schema.ts` — Customer validation schema

### Specific checks:
- [ ] **CRUD**: Full create/read/update/delete for customers?
- [ ] **Customer-shipment relationship**: Can you view a customer's shipment history?
- [ ] **Search & filter**: Is customer search performant? Debounced input?
- [ ] **Data validation**: Schema enforcement on creation/update?
- [ ] **Duplicate detection**: Is there protection against creating duplicate customers?

---

## 10. TRACKING MODULE

### Files to review:
- `pages/Tracking.tsx` — Internal tracking page
- `pages/PublicTracking.tsx` (12.2 KB) — Public-facing tracking page
- `components/domain/TrackingTimeline.tsx` — Timeline visualization
- `hooks/useTrackingEvents.ts` — Tracking events hook
- `lib/tracking-service.ts` — Tracking API (separate from `lib/services/trackingService.ts`)
- `lib/services/trackingService.ts` — Another tracking service file

### Specific checks:
- [ ] **Duplicate services**: There are TWO tracking service files (`lib/tracking-service.ts` AND `lib/services/trackingService.ts`). Are both needed? Which is canonical?
- [ ] **Public vs internal tracking**: What's the difference? Same data, different views?
- [ ] **RLS for public tracking**: Can unauthenticated users ONLY see tracking events for their specific tracking number?
- [ ] **Timeline rendering**: Does the timeline handle edge cases (single event, 100+ events, events on same timestamp)?
- [ ] **Real-time tracking**: Are tracking updates pushed via Supabase Realtime?

---

## 11. EXCEPTIONS / ANOMALIES MODULE

### Files to review:
- `pages/Exceptions.tsx` (11.6 KB) — Exceptions management page
- `components/domain/ExceptionDetails.tsx` — Exception detail view
- `hooks/useExceptions.ts` (5.2 KB) — Exceptions hook
- `lib/services/exceptionService.ts` (6.2 KB) — Exception API service

### Specific checks:
- [ ] **Exception types**: What kinds of exceptions are tracked? Missing shipments, damage, delays?
- [ ] **Resolution workflow**: Is there a workflow for resolving exceptions?
- [ ] **Linking**: Are exceptions properly linked to shipments/manifests?
- [ ] **Notifications**: Are users notified when an exception is created?

---

## 12. ANALYTICS MODULE

### Files to review:
- `pages/Analytics.tsx` (9.3 KB) — Analytics/reporting page

### Specific checks:
- [ ] **Data source**: Where does analytics data come from? Raw queries? Aggregated tables? Materialized views?
- [ ] **Date range filtering**: Can users select date ranges? Are queries optimized for large ranges?
- [ ] **Chart types**: Are the right chart types used for the data being presented?
- [ ] **Export**: Can analytics be exported?

---

## 13. REMAINING PAGES

### Files to review:
- `pages/Management.tsx` (9.5 KB) — User/team management
- `pages/Notifications.tsx` (13.8 KB) — Notification center
- `pages/Settings.tsx` (11.5 KB) — Application settings
- `pages/ShiftReport.tsx` (14.5 KB) — Shift reporting
- `pages/Inventory.tsx` (7.5 KB) — Inventory management
- `pages/NotFound.tsx` — 404 page
- `pages/DevUIKit.tsx` (13.7 KB) — Developer UI component showcase
- `pages/SentryTest.tsx` (10.7 KB) — Sentry error testing page

### Specific checks:
- [ ] **Management**: Staff CRUD, role assignment, hub assignment. Does it use `useStaff.ts`, `rbacService.ts`, `staffService.ts`?
- [ ] **Notifications**: Are notifications fetched via polling or realtime? Read/unread state? Notification bell (`NotificationBell.tsx`)?
- [ ] **Settings**: Org settings, user preferences. What can be configured?
- [ ] **ShiftReport**: Report generation, data accuracy, print/export. Uses `useShiftReport.ts`, `shiftReportService.ts`
- [ ] **Inventory**: Is it fully implemented or a stub?
- [ ] **DevUIKit & SentryTest**: These should NOT be accessible in production. Are they behind feature flags or removed from production builds?

---

## 14. LAYOUT & NAVIGATION

### Files to review:
- `components/layout/Sidebar.tsx` (7.0 KB) — Main sidebar navigation
- `components/layout/Header.tsx` — Top header bar
- `components/layout/UserProfile.tsx` (7.2 KB) — User profile section
- `components/domain/CommandPalette.tsx` (6.9 KB) — Cmd+K command palette
- `components/domain/NotificationBell.tsx` (9.4 KB) — Notification indicator
- `components/domain/ProfileDialog.tsx` (10.1 KB) — Profile settings dialog
- `components/domain/NotesPanel.tsx` (12.8 KB) — Notes side panel

### Specific checks:
- [ ] **Sidebar**: Active route highlighting, collapse/expand, RBAC-based menu item visibility
- [ ] **Header**: Breadcrumbs, search, user avatar, logout
- [ ] **Command palette**: Does Cmd+K open? All navigation options listed? Keyboard accessible?
- [ ] **Responsive**: Does the sidebar collapse to a drawer on mobile? Header adapts?
- [ ] **Profile dialog**: Can users update their profile? Password change? Avatar upload?
- [ ] **Notes panel**: Is note data persisted? Per-shipment or global?

---

## 15. UI COMPONENT LIBRARY (56 components)

### Files to review:
- `components/ui/` — All 56 components
- `components/ui/index.ts` — Barrel exports
- `globals.css` (23.3 KB) — Global styles, design tokens, CSS variables

### Critical components to deep-review:
- [ ] `data-table.tsx` (7.7 KB) — Used across multiple pages. Sorting, filtering, pagination correct?
- [ ] `rich-text-editor.tsx` (22.3 KB) — Large component. XSS sanitization on HTML content?
- [ ] `date-time-picker.tsx` (9.7 KB) — Timezone handling? Locale support?
- [ ] `vertical-tabs.tsx` (9.6 KB) — Keyboard navigation? ARIA roles?
- [ ] `error-boundary.tsx` (4.0 KB) — Does it catch all errors? Reporting to Sentry?
- [ ] `skeleton.tsx` (4.6 KB) — Consistent loading states?
- [ ] `CyberComponents.tsx` — **DEPRECATED** (590 bytes stub). Is anything still importing it?
- [ ] `Modal.tsx` vs `dialog.tsx` — Are there duplicate modal implementations?
- [ ] `tracker-card.tsx` vs `tracking-result-card.tsx` — Duplication?

### Design system consistency:
- [ ] Are all components using CSS variables from `globals.css`?
- [ ] Is the theming (light/dark) applied consistently via `theme-provider.tsx`?
- [ ] Are Radix primitives used correctly (no raw HTML where Radix provides accessible alternatives)?
- [ ] Do form components integrate with `react-hook-form` consistently?

---

## 16. ANIMATIONS & MOTION

### Files to review:
- `components/motion/CountUp.tsx` — Animated counter
- `components/motion/FadeUp.tsx` — Fade-in animation
- `components/motion/ParallaxLayer.tsx` — Parallax scrolling
- `components/motion/ScrollProgress.tsx` — Scroll progress indicator
- `components/motion/StaggerChildren.tsx` — Staggered reveal
- `components/motion/TextReveal.tsx` — Text reveal animation
- `components/ui/light-rays.tsx` — Decorative light rays
- `components/ui/page-transition.tsx` — Page transition wrapper
- `lib/animation-tokens.ts` — Animation constants
- `lib/motion.ts` — Motion utilities
- `lib/gsap/` — GSAP integration

### Specific checks:
- [ ] **`prefers-reduced-motion`**: Are animations disabled for users with motion sensitivity?
- [ ] **Performance**: Are animations GPU-accelerated (`transform`, `opacity` only)? No layout thrashing?
- [ ] **Cleanup**: Are GSAP/Framer Motion listeners and timelines properly cleaned up on unmount?
- [ ] **Bundle impact**: Is GSAP tree-shaken? Only needed plugins imported?

---

## 17. STATE MANAGEMENT (Zustand Stores)

### Files to review:
- `store/authStore.ts` (16.7 KB) — Authentication state
- `store/scanQueueStore.ts` (8.5 KB) — Scan queue state
- `store/managementStore.ts` (4.5 KB) — Management state
- `store/noteStore.ts` (5.0 KB) — Notes state
- `store/auditStore.ts` (1.9 KB) — Audit log state
- `store/index.ts` — Store barrel exports

### Specific checks:
- [ ] **Store design**: Are stores properly scoped? No god-store anti-pattern?
- [ ] **Selectors**: Are components using granular selectors to avoid unnecessary re-renders?
- [ ] **Persistence**: Which stores persist to localStorage? Is sensitive data (tokens) stored safely?
- [ ] **Devtools**: Is Zustand devtools middleware enabled for debugging?
- [ ] **Hydration**: Do stores handle rehydration on page reload correctly?
- [ ] **Store-query overlap**: Is there redundancy between Zustand stores and React Query cache?

---

## 18. CUSTOM HOOKS (18 hooks)

### Files to review:
- All files in `hooks/` directory
- All files in `lib/hooks/` directory (6 additional hooks)

### Specific checks:
- [ ] **Dependency arrays**: Are `useEffect`/`useMemo`/`useCallback` dependency arrays correct? Missing deps = stale closures?
- [ ] **Cleanup**: Do hooks with subscriptions/listeners clean up on unmount?
- [ ] **Error handling**: Do hooks surface errors to the UI? Silent failures?
- [ ] **Loading states**: Do hooks expose `isLoading`, `isError`, `data` consistently?
- [ ] **Hook composition**: Are hooks composing other hooks in a clean, non-circular way?
- [ ] **`useRealtime.ts`**: Does the Supabase realtime subscription handle reconnection? Channel cleanup?
- [ ] **`useManifestScan.ts` (10.7 KB)**: Complex hook — is it testable? Should it be split?

---

## 19. BACKEND SERVICES & DATA LAYER

### Files to review:
- `lib/services/` — All 13 service files
- `lib/data-access/` — Data access layer (2 files)
- `lib/api.ts` — API client configuration
- `lib/supabase.ts` — Supabase client
- `lib/queryKeys.ts` — React Query key registry
- `lib/query-client.ts` — React Query client config
- `lib/schemas/` — Zod validation schemas (4 files)
- `lib/validation/` — Additional validation
- `lib/constants.ts` — App constants
- `lib/org-helper.ts` — Organization utilities
- `lib/utils.ts` — General utilities

### Specific checks:
- [ ] **Supabase client**: Is there only ONE client instance? No duplicate initializations?
- [ ] **Query keys**: Are all queries using keys from `queryKeys.ts`? Consistent invalidation?
- [ ] **Service patterns**: Do all services follow the same pattern? Error handling consistent?
- [ ] **Type safety**: Do services use generated types from `database.types.ts`? Is that file up to date with the DB schema?
- [ ] **Error mapping**: Does `lib/errors.ts` (10.5 KB) properly categorize and surface Supabase/Postgres errors?
- [ ] **Email service**: `lib/email.ts` (8.1 KB) — How are emails sent? Edge function? SMTP? Any PII in logs?
- [ ] **PDF generator**: `lib/pdf-generator.ts` (27.1 KB) — Large file. Memory usage for generating labels at scale?

---

## 20. SUPABASE BACKEND

### Migrations to review (in order):
1. `002_rls_policies.sql` (12.5 KB) — Core RLS policies
2. `003_hub_access_and_constraints.sql` (8.1 KB) — Hub-level access control
3. `004_invoice_numbering.sql` (2.6 KB) — Invoice sequences
4. `005_invoice_rls_and_audit.sql` (4.5 KB) — Invoice security
5. `006_manifest_enterprise_upgrade.sql` (27.1 KB) — Enterprise manifest features
6. `007_manifest_grants.sql` (1.2 KB) — Manifest permissions
7. `008_shipment_receiver_sender_rename.sql` (4.8 KB) — Column renames
8. `009_shipment_status_check_constraint.sql` (3.1 KB) — Status validation
9. `010_rbac_enhancement.sql` (11.9 KB) — RBAC system upgrade
10. `011_e2e_test_user.sql` (4.8 KB) — Test user setup
11. `012_enforce_imf_hub_codes.sql` (1.1 KB) — Hub code enforcement
12. `013_add_performance_indexes.sql` (1.9 KB) — Performance indexes
13. `014_drop_duplicate_indexes.sql` (0.6 KB) — Cleanup

### Edge Functions:
- `supabase/functions/close-manifest/` — Manifest closing logic
- `supabase/functions/send-email/` — Email sending

### Specific checks:
- [ ] **RLS completeness**: Does EVERY table have RLS enabled? Any tables with `RLS DISABLED`?
- [ ] **RLS correctness**: Do policies correctly scope data to `auth.uid()` and `org_id`? Any policy that allows reading other orgs' data?
- [ ] **Missing migration 001**: Where is migration `001`? Is the initial schema stored elsewhere?
- [ ] **Migration ordering**: Can all migrations be applied fresh in sequence without errors?
- [ ] **Indexes**: Are the right columns indexed? Any missing indexes on frequently queried columns?
- [ ] **Check constraints**: Are domain constraints (status enums, required fields) enforced at DB level?
- [ ] **Edge function auth**: Do edge functions verify the JWT? Any unauthenticated endpoints?
- [ ] **Edge function error handling**: Do they return proper HTTP status codes?
- [ ] **Realtime**: Which tables have realtime enabled? Is it scoped correctly?

---

## 21. CROSS-CUTTING CONCERNS

### Error Handling & Monitoring:
- `lib/sentry.ts` (9.8 KB) — Sentry integration
- `lib/errors.ts` (10.5 KB) — Error handling utilities
- `lib/logger.ts` — Logging utility
- `lib/feedback.ts` — User feedback system
- `components/ui/error-boundary.tsx` — React error boundary
- `components/error/` — Error display components
- `pages/SentryTest.tsx` — Sentry testing page

### Specific checks:
- [ ] **Sentry config**: Is Sentry properly configured with environment, release, and source maps?
- [ ] **Error boundaries**: Is there a top-level error boundary wrapping the entire app? Per-route boundaries?
- [ ] **Unhandled rejections**: Is there a global handler for unhandled promise rejections?
- [ ] **User feedback**: Can users report issues? Does it capture context (route, user, etc.)?
- [ ] **PII scrubbing**: Is Sentry configured to NOT send PII (emails, names, tokens)?
- [ ] **SentryTest page**: Is this page accessible in production? It should NOT be.

### Notification System:
- `lib/notifications/` — 4 notification files
- `hooks/useRealtime.ts` — Realtime subscriptions
- `components/domain/NotificationBell.tsx` — UI indicator

### Specific checks:
- [ ] **Delivery**: How are notifications delivered? Database insert → Realtime subscription → bell update?
- [ ] **Read/unread state**: Properly tracked?
- [ ] **Notification types**: What events trigger notifications? Are they all implemented?

---

## 22. BUILD, TOOLING & DEVOPS

### Files to review:
- `vite.config.ts` — Build configuration
- `tsconfig.json` — TypeScript configuration
- `eslint.config.js` (2.7 KB) — Linting rules
- `vitest.config.ts` — Test configuration
- `playwright.config.ts` — E2E test configuration
- `vercel.json` — Deployment configuration
- `package.json` — Dependencies and scripts
- `.env.example` — Environment variable template
- `scripts/` — 9 script files (migrations, utilities)
- `.github/` — GitHub workflows, CI/CD (8 files)

### Specific checks:
- [ ] **Bundle analysis**: What's the total bundle size? Are there unexpectedly large chunks?
- [ ] **Tree shaking**: Are imports structured for optimal tree shaking?
- [ ] **Path aliases**: Are `@/` aliases configured consistently in Vite AND TypeScript?
- [ ] **Environment variables**: Are all required env vars documented in `.env.example`? Any missing?
- [ ] **Vercel config**: Are rewrites/routes configured correctly for SPA routing?
- [ ] **CI/CD**: What runs on PR? Lint, type-check, tests, build?
- [ ] **Dependencies**: Any outdated, deprecated, or vulnerable dependencies?
- [ ] **Dev vs Prod**: Is dev-only code (DevUIKit, SentryTest) excluded from production?

---

## 23. TESTING

### Files to review:
- `tests/` — 26 test files
- `hooks/__tests__/` — Hook tests
- `vitest.config.ts` — Unit test config
- `playwright.config.ts` — E2E test config

### Specific checks:
- [ ] **Coverage**: What is the current test coverage? Which critical paths are untested?
- [ ] **Service tests**: Are the 13 services tested?
- [ ] **Hook tests**: Are the 18 hooks tested? Are they using `renderHook` from testing-library?
- [ ] **E2E tests**: Do Playwright tests cover the critical user flows (login → create shipment → create manifest → close manifest)?
- [ ] **Mocking**: Is Supabase properly mocked in tests? No real API calls in unit tests?
- [ ] **Test data**: Are test fixtures well-maintained? No hardcoded UUIDs that could break?

---

## 24. SECURITY AUDIT

### Specific checks across the entire codebase:
- [ ] **XSS**: Is any user input rendered as raw HTML? Check `dangerouslySetInnerHTML`, rich text editor output
- [ ] **CSRF**: Are state-changing operations protected?
- [ ] **Secret exposure**: `grep -r "sk_" "secret" "password" "api_key"` — any hardcoded secrets?
- [ ] **Content Security Policy**: Is CSP configured in `index.html` or `vercel.json`?
- [ ] **CORS**: Are Supabase API calls properly configured for CORS?
- [ ] **Input sanitization**: Are all form inputs sanitized before sending to Supabase?
- [ ] **File uploads**: Are there any file upload features? Max size limits? Type validation?
- [ ] **URL parameters**: Are URL params parsed safely? No open redirect vulnerabilities?
- [ ] **Dependency vulnerabilities**: Run `npm audit` — any critical/high vulnerabilities?

---

## 25. PERFORMANCE AUDIT

### Specific checks:
- [ ] **Largest Contentful Paint (LCP)**: What is the LCP on landing page? Optimize hero image/globe loading
- [ ] **First Input Delay (FID)**: Any blocking JS on page load?
- [ ] **Cumulative Layout Shift (CLS)**: Do elements jump around during load? Proper skeleton sizing?
- [ ] **React re-renders**: Use React DevTools Profiler — which components re-render excessively?
- [ ] **Memoization**: Are expensive computations wrapped in `useMemo`? Callbacks in `useCallback`?
- [ ] **Image optimization**: Are images properly sized, compressed, using `loading="lazy"`?
- [ ] **Code splitting**: Beyond route-level, are there component-level code splits for heavy components (globe, charts, rich text editor)?
- [ ] **React Query optimization**: Are queries using proper `staleTime`, `gcTime`, `select` for projections?
- [ ] **Database query performance**: Are there N+1 queries? Unnecessary `SELECT *`?

---

## SUMMARY STATISTICS

| Category | Count | Key Concern |
|---|---|---|
| Pages | 20 | Some very large (Finance 23KB, Scanning 17.7KB) |
| Components | 90+ | `MultiStepCreateInvoice.tsx` is 62KB |
| UI Primitives | 56 | Possible deprecated/duplicate components |
| Services | 13 | `manifestService.ts` is 30KB |
| Hooks | 18+ | Complex hooks need splitting |
| Stores | 6 | Auth store is 16.7KB |
| Migrations | 13 | Missing migration 001 |
| Edge Functions | 2 | close-manifest, send-email |
| Global CSS | 23KB | Large design token file |
| App.tsx | 700 lines | Contains Login + routing + layout |

---

## FINAL DELIVERABLE

After completing this review, produce a report with:
1. **Executive summary** — 3-5 sentence overview of codebase health
2. **Critical issues** — Must fix before next release (security, data loss risks)
3. **High priority** — Should fix soon (bugs, major UX issues)
4. **Medium priority** — Improve when possible (code quality, performance)
5. **Low priority** — Nice to have (style consistency, minor refactors)
6. **Architecture recommendations** — Long-term structural improvements
7. **Positive findings** — What the codebase does well

For each finding, include: **File path → Line(s) → Issue description → Suggested fix → Severity**
