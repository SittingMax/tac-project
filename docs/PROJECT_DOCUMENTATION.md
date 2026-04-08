# TAC Cargo Enterprise Portal — Comprehensive Project Documentation

> **Version**: 1.0.0 | **Last Updated**: March 2026 | **Stack**: React 19 · TypeScript 5.9 · Vite 6 · Tailwind CSS v4 · Supabase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Project Architecture](#3-project-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Application Bootstrap & Entry Points](#5-application-bootstrap--entry-points)
6. [Routing & Navigation](#6-routing--navigation)
7. [Domain Model & Type System](#7-domain-model--type-system)
8. [State Management](#8-state-management)
9. [Data Fetching Layer](#9-data-fetching-layer)
10. [Service Layer](#10-service-layer)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Scanning & Barcode System](#12-scanning--barcode-system)
13. [UI Component Library](#13-ui-component-library)
14. [Pages & Features](#14-pages--features)
15. [Custom Hooks](#15-custom-hooks)
16. [PDF Generation](#16-pdf-generation)
17. [Supabase Backend](#17-supabase-backend)
18. [Error Handling & Observability](#18-error-handling--observability)
19. [Design System & Theming](#19-design-system--theming)
20. [Feature Flags](#20-feature-flags)
21. [Build, Bundling & PWA](#21-build-bundling--pwa)
22. [Testing Strategy](#22-testing-strategy)
23. [CI/CD & Code Quality](#23-cicd--code-quality)
24. [Security Posture](#24-security-posture)
25. [Configuration & Environment](#25-configuration--environment)
26. [Pros & Cons Analysis](#26-pros--cons-analysis)

---

## 1. Executive Summary

TAC Cargo Enterprise Portal is a **full-featured logistics management platform** for air and ground freight operations. Built as a Single Page Application (SPA), it manages the entire shipment lifecycle — from booking through delivery — with integrated manifest management, barcode/QR scanning, invoicing, exception handling, real-time tracking, customer management, analytics, and warehouse operations.

**Target Users**: Operations staff, warehouse workers, finance teams, managers, and administrators across multiple hub locations (Imphal, New Delhi).

**Key Differentiators**:
- Offline-first scanning with auto-sync for warehouse environments with weak connectivity
- Hardware barcode scanner detection via keystroke timing analysis
- Multi-tenant architecture with organization-scoped Row Level Security (RLS)
- Branded type system preventing accidental mixing of AWB, UUID, and other identifiers
- 11-role RBAC with hub-specific restrictions and module-level access control

---

## 2. Technology Stack

### Core Framework
| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.1 |
| Language | TypeScript | 5.9.3 |
| Bundler | Vite | 6.2 |
| CSS Framework | Tailwind CSS | 4.1 |
| Backend (BaaS) | Supabase | 2.91 |

### State & Data
| Purpose | Library |
|---------|---------|
| Client state | Zustand 5.0 (`persist` middleware) |
| Server state | TanStack Query v5 |
| Forms | react-hook-form 7.71 + Zod 3.25 |
| Routing | react-router-dom 6.30 |

### UI & Design
| Purpose | Library |
|---------|---------|
| Component primitives | Radix UI (12+ primitives) |
| Component system | shadcn/ui (new-york style) |
| Icons | Lucide React |
| Animations | Motion (framer-motion successor) + GSAP 3.14 |
| Charts | Recharts 2.15 |
| Rich text | TipTap 3.x (14 extensions) |
| Toasts | Sonner 2.0 |
| Tables | TanStack Table 8.21 |
| Carousel | Embla Carousel 8.6 |
| Drawer | Vaul 1.1 |
| Command palette | cmdk 1.1 |

### Scanning & Documents
| Purpose | Library |
|---------|---------|
| Barcode generation | JsBarcode 3.12, bwip-js 4.8 |
| QR codes | qrcode 1.5, qrcode.react 4.2 |
| Camera scanning | @zxing/browser + @zxing/library |
| PDF generation | jsPDF 4.2 + jspdf-autotable 5.0 |
| PDF manipulation | pdf-lib 1.17 |
| Printing | react-to-print 3.3 |
| Sanitization | DOMPurify 3.3 |
| Search | Fuse.js 7.1 |

### DevOps & Quality
| Purpose | Library |
|---------|---------|
| Error monitoring | Sentry (@sentry/react 10.42) |
| E2E testing | Playwright 1.58 |
| Unit testing | Vitest 4.1 + Testing Library |
| Component dev | Storybook 10.2 |
| Linting | ESLint 9 (flat config) |
| Formatting | Prettier 3.8 |
| CSS linting | Stylelint 16 |
| Git hooks | Husky 9 + lint-staged 16 |
| Dependency updates | Dependabot |
| Security scanning | CodeQL |
| Bundle analysis | rollup-plugin-visualizer |

---

## 3. Project Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Pages   │ │Components│ │  Hooks   │ │  Context   │ │
│  │ (28 lazy │ │(64 UI +  │ │(34 custom│ │(Scanning   │ │
│  │  loaded) │ │ domain)  │ │  hooks)  │ │ Provider)  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       │             │            │              │        │
│  ┌────▼─────────────▼────────────▼──────────────▼──────┐│
│  │              State Layer                             ││
│  │  Zustand (6 stores)  +  TanStack Query (cache)      ││
│  └────────────────────┬────────────────────────────────┘│
│                       │                                  │
│  ┌────────────────────▼────────────────────────────────┐│
│  │            Service Layer (14 services)               ││
│  │  shipment · manifest · invoice · customer · audit    ││
│  │  booking · exception · org · rbac · staff · tracking ││
│  │  settings · shiftReport                              ││
│  └────────────────────┬────────────────────────────────┘│
│                       │                                  │
│  ┌────────────────────▼────────────────────────────────┐│
│  │         Supabase Client (typed with Database)        ││
│  │         lib/supabase.ts → createClient<Database>     ││
│  └────────────────────┬────────────────────────────────┘│
└───────────────────────┼──────────────────────────────────┘
                        │ HTTPS / WSS
┌───────────────────────▼──────────────────────────────────┐
│              Supabase Platform                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │PostgreSQL│ │   Auth   │ │ Realtime │ │Edge Funcs  │  │
│  │ (50 mig.)│ │  (JWT)   │ │  (WSS)   │ │(3 funcs)   │  │
│  │  + RLS   │ │          │ │          │ │            │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Directory Structure

```
tac-portal/
├── App.tsx                 # Root component — provider tree
├── index.tsx               # Entry point — env validation, Sentry init
├── index.html              # HTML shell with CSP, SEO, theme script
├── globals.css             # Design system — tokens, themes, animations (998 lines)
├── types.ts                # Root type definitions (458 lines)
├── components/             # 29 subdirectories + 64 UI primitives
│   ├── ui/                 # shadcn/ui + custom (64 components)
│   ├── auth/               # Login, ProtectedRoute
│   ├── layout/             # DashboardLayout, Sidebar, Header
│   ├── shipments/          # ShipmentCard, ShipmentForm, ShipmentDetail
│   ├── manifests/          # ManifestBuilder, ManifestTable
│   ├── scanning/           # GlobalScanListener, ScannerDebug
│   ├── finance/            # InvoiceWizard, InvoicePreview
│   ├── dashboard/          # KPICards, ActivityFeed, Charts
│   ├── customers/          # CustomerForm, CustomerTable
│   ├── barcodes/           # UniversalBarcode wrapper
│   ├── landing-new/        # Public landing page sections
│   └── ...                 # 18 more domain directories
├── pages/                  # 28 page components + admin/
├── hooks/                  # 34 custom hooks
├── store/                  # 6 Zustand stores
├── lib/                    # Core utilities & services
│   ├── services/           # 14 domain services
│   ├── schemas/            # 5 Zod validation schemas
│   ├── pdf/                # 3 PDF generators
│   ├── data-access/        # Data access layer
│   ├── notifications/      # Notification system
│   ├── validation/         # Validation utilities
│   ├── gsap/               # GSAP animation configs
│   ├── errors.ts           # Error hierarchy (347 lines)
│   ├── queryKeys.ts        # Query key factory
│   ├── scanParser.ts       # Barcode/QR parser
│   ├── database.types.ts   # Auto-generated DB types (62K)
│   └── ...
├── types/                  # Domain type system (branded types, enums, RBAC)
├── config/                 # Feature flags, constants
├── context/                # React contexts (scanning)
├── routes/                 # Route definitions with RBAC
├── supabase/
│   ├── migrations/         # 50 SQL migration files
│   └── functions/          # 3 edge functions
├── tests/
│   ├── e2e/                # 17 Playwright spec files
│   └── unit/               # Vitest unit tests
├── .github/
│   └── workflows/          # 4 CI workflows
├── .storybook/             # Storybook configuration
└── docs/                   # Documentation
```

---

## 5. Application Bootstrap & Entry Points

### `index.html`
- Content Security Policy (CSP) restricting scripts, styles, fonts, images, and connections
- SEO meta tags, Open Graph, Twitter Card
- PWA manifest headers (`mobile-web-app-capable`)
- Google Fonts preloading (Inter, Geist Mono) with `media="print"` trick
- Inline theme detection script preventing flash-of-wrong-theme (reads from `localStorage`)

### `index.tsx`
1. **Environment validation** via Zod schemas (`validateEnv()`) — fails fast in production
2. **Sentry initialization** (`initSentry()`) — no-ops if DSN not configured
3. **Chunk error recovery** — listens for `vite:preloadError` and reloads the page
4. **React 19 StrictMode** rendering into `#root`

### `App.tsx` — Provider Tree
```
QueryClientProvider          — TanStack Query cache
  └─ ScanningProvider        — Hardware scanner detection
       └─ ScanContextProvider — Scan state sharing
            └─ BrowserRouter  — React Router v6
                 ├─ GlobalScanListener   — Listens for background scans
                 ├─ ScrollToTop          — Reset scroll on navigation
                 ├─ Suspense (PageSkeleton fallback)
                 │   └─ ErrorBoundary (global)
                 │       └─ PageTransition (motion animations)
                 │           └─ Routes (lazy-loaded pages)
                 └─ Toaster (sonner, top-right)
```

**Key Pattern**: Each page gets its own `ErrorBoundary` so a crash in one page doesn't take down the entire application. Pages are wrapped with `ProtectedRoute` (RBAC) and `DashboardLayout` (sidebar/header) as configured in the route definitions.

---

## 6. Routing & Navigation

**25 routes** defined in `routes/index.tsx` with lazy loading via `React.lazy()`.

### Public Routes (no auth)
| Path | Page | Purpose |
|------|------|---------|
| `/` | Landing | Marketing/public landing page |
| `/track` `/track/:awb` | PublicTracking | Public shipment tracking |
| `/terms` | TermsOfService | Legal — terms |
| `/privacy` | PrivacyPolicy | Legal — privacy |

### Protected Routes (auth + RBAC)
| Path | Page | Allowed Roles |
|------|------|--------------|
| `/dashboard` | Dashboard | All authenticated |
| `/shipments` | Shipments | All authenticated |
| `/shipments/:id` | ShipmentDetails | All authenticated |
| `/tracking` | Tracking | All authenticated |
| `/bookings` | Bookings | ADMIN, MANAGER, OPS_STAFF |
| `/manifests` | Manifests | ADMIN, MANAGER, OPS_STAFF |
| `/scanning` | Scanning | ADMIN, MANAGER, WAREHOUSE_STAFF |
| `/arrival-audit` | ArrivalAudit | ADMIN, MANAGER, WAREHOUSE_STAFF |
| `/inventory` | Inventory | ADMIN, MANAGER, WAREHOUSE_STAFF |
| `/exceptions` | Exceptions | ADMIN, MANAGER, OPS_STAFF, WAREHOUSE_STAFF |
| `/finance` | Finance | ADMIN, MANAGER, FINANCE_STAFF |
| `/analytics` | Analytics | ADMIN, MANAGER, FINANCE_STAFF |
| `/customers` | Customers | ADMIN, MANAGER, FINANCE_STAFF, OPS_STAFF |
| `/management` | Management | ADMIN, MANAGER |
| `/admin/messages` | Messages | ADMIN only |
| `/settings` | Settings | All authenticated |
| `/shift-report` | ShiftReport | All authenticated |
| `/notifications` | Notifications | All authenticated |
| `/print/label/:awb` | PrintLabel | Protected (PII) |
| `/search` | SearchResults | All authenticated |
| `/dev/ui-kit` | DevUIKit | DEV mode + ADMIN only |

---

## 7. Domain Model & Type System

### Branded Types
The project uses TypeScript branded types to prevent accidental mixing of similar string types:
```typescript
type AWB = Brand<string, 'CN Number'>;       // e.g., TAC123456789
type UUID = Brand<string, 'UUID'>;
type ManifestNumber = Brand<string, 'ManifestNumber'>;
type InvoiceNumber = Brand<string, 'InvoiceNumber'>;
```

### Core Entity Lifecycle Enums
- **ShipmentStatus**: `CREATED → PICKUP_SCHEDULED → PICKED_UP → RECEIVED_AT_ORIGIN → IN_TRANSIT → RECEIVED_AT_DEST → OUT_FOR_DELIVERY → DELIVERED` (with CANCELLED, RTO, EXCEPTION branches)
- **ManifestStatus**: `DRAFT → BUILDING → OPEN → CLOSED → DEPARTED → ARRIVED → RECONCILED`
- **InvoiceStatus**: `DRAFT → ISSUED → PAID` (with CANCELLED, OVERDUE)
- **ExceptionType**: DAMAGED, LOST, DELAYED, MISMATCH, PAYMENT_HOLD, MISROUTED, etc.
- **ExceptionSeverity**: LOW, MEDIUM, HIGH, CRITICAL

### Status Transition Rules
Encoded as `Record<Status, Status[]>` maps with validation functions (`isValidShipmentTransition`, `isValidManifestTransition`), enforcing valid state machine transitions at the type level.

### Key Domain Interfaces
- **Shipment**: AWB, consignor/consignee, origin/destination hub, weight (dead/volumetric/chargeable), mode, service level, payment mode, status
- **Manifest**: Reference, type, origin/destination hub, vehicle metadata (driver, flight number), shipment IDs, weights
- **Invoice**: Invoice number, customer, shipment, financials (rate/kg, base freight, docket charge, fuel surcharge, taxes with CGST/SGST/IGST, discount, advance paid, balance)
- **Customer**: Type (individual/business), tier (standard/priority/enterprise), preferences, GSTIN
- **Package**: Weight dimensions, bin location, current hub
- **TrackingEvent**: Event code, hub, actor, source, timestamp, metadata
- **Booking**: Consignor/consignee details, volume matrix, images, WhatsApp number

---

## 8. State Management

### Zustand Stores (6 stores, all with `persist` middleware)

| Store | File | Purpose |
|-------|------|---------|
| `useStore` | `store/index.ts` | App-wide UI state: theme, sidebar, navigation, user |
| `useAuthStore` | `store/authStore.ts` | Authentication: session, staff user, sign-in/out, RBAC |
| `useNoteStore` | `store/noteStore.ts` | Rich text notes/comments on entities |
| `useScanQueueStore` | `store/scanQueueStore.ts` | Offline-first scan queue with auto-sync |
| `useAuditStore` | `store/auditStore.ts` | Audit log browsing state |
| `useManagementStore` | `store/managementStore.ts` | Staff/hub management state |

### Auth Store Deep Dive
- **Singleton initialization** pattern to prevent concurrent init in React StrictMode
- **AbortController** for cancellation during unmount/navigation
- **15-second timeout** with fallback for network issues
- **Staff record fetch** via `staff` table joined with `hubs` for hub code resolution
- **Active account check** — deactivated accounts are signed out immediately
- **Organization context** — sets `orgService.setCurrentOrg()` for multi-tenant queries
- **GDPR-compliant sign-out** — clears all sensitive localStorage keys (invoice drafts, shipment data, print data)
- **Auth state listener** — `onAuthStateChange` handles SIGNED_OUT, SIGNED_IN, TOKEN_REFRESHED events

---

## 9. Data Fetching Layer

### TanStack Query v5
- **Query Client** configured in `lib/query-client.ts`
- **Query Key Factory** in `lib/queryKeys.ts` — hierarchical keys for: shipments, manifests, tracking, invoices, customers, exceptions, audit logs, staff, dashboard
- **Pattern**: `queryKeys.shipments.detail(id)` → `['shipments', 'detail', id]`
- **Invalidation**: Scoped invalidation via `queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })`

### Custom Data Hooks (34 hooks)
Key hooks include:
- `useShipments` — CRUD + filtering for shipments
- `useManifests`, `useManifestBuilder`, `useCloseManifest` — Manifest lifecycle
- `useInvoices`, `useInvoiceActions`, `useMultiStepInvoice` — Invoice wizard
- `useCustomers` — Customer CRUD with tier management
- `useExceptions` — Exception reporting and resolution
- `useAnalytics`, `useDashboardKPIs` — Analytics/dashboard data
- `useArrivalAudit` — Manifest arrival auditing
- `useRealtime` — Supabase realtime subscriptions
- `useTrackingEvents` — Shipment tracking history
- `useScanningLogic` — Scan processing business logic
- `useManifestScan` — Manifest-specific scanning
- `useRBAC` — Role-based access control checks
- `useIdleTimeout` — Auto-logout after inactivity
- `useGlobalSearch` — Cross-entity search
- `useBookings` — Public booking management
- `useAnomalyDetector` — Operational anomaly detection

---

## 10. Service Layer

**14 domain services** in `lib/services/` encapsulate all Supabase database operations:

| Service | Key Operations |
|---------|---------------|
| `shipmentService` | Create, update status, search by AWB, list with filters |
| `manifestService` | Build, close (atomic), depart, arrive, reconcile, scan items |
| `invoiceService` | Generate, issue, mark paid, PDF generation |
| `customerService` | CRUD, tier management, preferences |
| `exceptionService` | Report, investigate, resolve, severity management |
| `auditService` | Log actions, query by entity/actor |
| `bookingService` | Public booking submission |
| `trackingService` | Create events, query history by AWB |
| `staffService` | CRUD, activate/deactivate, hub assignment |
| `rbacService` | Permission checks, role validation |
| `orgService` | Organization context management (multi-tenant) |
| `settingsService` | User preferences, app settings |
| `shiftReportService` | Generate shift activity reports |

**Manifest Close** is implemented as an atomic PostgreSQL function (`close_manifest_atomic`) to prevent race conditions during concurrent operations.

---

## 11. Authentication & Authorization

### Authentication Flow
1. User submits email/password → Supabase Auth `signInWithPassword`
2. Auth success → fetch linked `staff` record (with hub join)
3. Verify staff is active → set organization context
4. Persist minimal auth state to localStorage (`tac-auth` key)
5. Setup `onAuthStateChange` listener for token refresh and sign-out

### 11-Role RBAC System

| Role | Hierarchy Level | Module Access |
|------|----------------|---------------|
| SUPER_ADMIN | 1000 | All (wildcard) |
| ADMIN | 100 | All (wildcard) |
| MANAGER | 90 | All (wildcard) |
| OPS | 80 | Shipments, manifests, tracking, customers, exceptions |
| INVOICE | 70 | Finance, customers, shipments |
| WAREHOUSE_IMPHAL | 60 | Scanning, inventory, shipments, exceptions (Imphal hub only) |
| WAREHOUSE_DELHI | 60 | Scanning, inventory, shipments, exceptions (Delhi hub only) |
| WAREHOUSE_STAFF | 50 | Scanning, inventory, shipments |
| OPS_STAFF | 40 | Shipments, manifests, tracking, exceptions |
| FINANCE_STAFF | 30 | Finance, customers, shipments |
| SUPPORT | 20 | Shipments, tracking, customers (read-only) |

**Enforcement points**: Route-level (`ProtectedRoute`), component-level (`useHasRole`, `useCanAccessModule`), and database-level (RLS policies).

---

## 12. Scanning & Barcode System

### Hardware Scanner Detection (`ScanningProvider`)
The scanning system detects hardware barcode scanners by analyzing **keystroke timing patterns**:
- **Scanner speed threshold**: <150ms average inter-key delay
- **Minimum scan length**: 3 characters
- **Buffer stale timeout**: 1000ms — buffer resets if no key arrives
- **Auto-submit delay**: 100ms — for scanners that don't send Enter
- **75th percentile detection**: Outlier-resistant — scanner if P75 < threshold OR 70%+ fast keystrokes
- **Duplicate debounce**: 500ms deduplication window
- **Input field protection**: Scanner characters are `preventDefault()`-ed from leaking into focused inputs

### Scan Parser (`lib/scanParser.ts`)
Supports multiple input formats:
1. **Raw AWB**: `TAC123456789`, `CN-2026-0001`
2. **JSON shipment**: `{"v":1,"awb":"TAC123456789"}`
3. **JSON manifest**: `{"v":1,"type":"manifest","id":"uuid","manifestNo":"MNF-2024-000001"}`
4. **JSON package**: `{"v":1,"type":"package","packageId":"PKG-001"}`
5. **Manifest numbers**: `MNF-2024-000001`, `TAC-MNF-2024-000001`

### Offline-First Scan Queue (`scanQueueStore`)
- Scans are immediately stored in localStorage (persisted Zustand store)
- Auto-sync attempts every 30 seconds if online
- Listens for `online` event to trigger immediate sync
- Shows offline mode toast when connection is lost
- Failed scans are individually tracked with error messages
- Synced scans can be cleared to free storage

---

## 13. UI Component Library

### 64 shadcn/ui-based Components
The project uses **shadcn/ui (new-york style)** with Radix UI primitives. Key components:

**Layout & Navigation**: Sidebar (21KB), Sheet, Drawer, Tabs, VerticalTabs, Breadcrumb, Pagination
**Forms**: Input, InputGroup, Field, Select, Checkbox, RadioGroup, Calendar, DateTimePicker, Textarea, Switch, Slider, Toggle, ToggleGroup
**Feedback**: AlertDialog, Dialog, Popover, Tooltip, HoverCard, Progress, Spinner, Skeleton (multiple variants)
**Data Display**: Table, Badge, Card, Avatar, Separator, ScrollArea, Accordion, Collapsible
**Rich Content**: RichTextEditor (23KB — TipTap with 14 extensions), QRCode, Chart (10KB — Recharts wrapper)
**Effects**: SpotlightCard, TiltCard, FluidExpandingGrid, BackgroundGrid, LoadingCarousel, AnimatedCounter, AnimatedThemeToggler, PageTransition
**Utilities**: ErrorBoundary, EmptyState, Command (cmdk palette), ContextMenu, Resizable, Kbd

### CI Guard: No direct JsBarcode imports — must use the `UniversalBarcode` wrapper component.

---

## 14. Pages & Features

### 28 Page Components

| Page | Size | Description |
|------|------|-------------|
| **Dashboard** | 14.5KB | KPI cards, recent activity, operational overview |
| **AnalyticsDashboard** | 32.8KB | Charts, trends, performance metrics |
| **Shipments** | 14.6KB | Shipment list, filters, CRUD operations |
| **ShipmentDetailsPage** | 2KB | Individual shipment deep-dive |
| **Manifests** | 11.7KB | Manifest list, builder, lifecycle management |
| **Scanning** | 22.7KB | Barcode/QR scanning interface |
| **ArrivalAudit** | 10.2KB | Manifest arrival reconciliation |
| **Finance** | 15.7KB | Invoice management, payment tracking |
| **Customers** | 16KB | Customer CRM with tiers |
| **Exceptions** | 16.7KB | Exception reporting and resolution |
| **Inventory** | 11.8KB | Warehouse inventory management |
| **Tracking** | 8.5KB | Internal tracking dashboard |
| **PublicTracking** | 16.4KB | Public-facing AWB tracking |
| **CustomerTrackingPage** | 19.7KB | Customer-specific tracking view |
| **WarehouseDashboard** | 17.2KB | Warehouse operations overview |
| **Bookings** | 4.6KB | Booking management |
| **Management** | 14.9KB | Staff/hub administration |
| **Settings** | 5.1KB | User preferences |
| **Notifications** | 13.5KB | Notification center |
| **ShiftReport** | 14.6KB | Shift activity reports |
| **PrintLabel** | 13.9KB | Shipping label generation/printing |
| **SearchResults** | 8KB | Global search results |
| **DevUIKit** | 17.2KB | Development-only component showcase |
| **LandingPage** | 1KB | Public marketing page |
| **TermsOfService** | 14.8KB | Legal terms |
| **PrivacyPolicy** | 8.6KB | Privacy policy |
| **NotFound** | 1.2KB | 404 page |
| **Analytics** | 10.6KB | Analytics overview |

---

## 15. Custom Hooks

### 34 Custom Hooks

**Data Hooks**: `useShipments`, `useManifests`, `useInvoices`, `useCustomers`, `useExceptions`, `useBookings`, `useAuditLogs`, `useTrackingEvents`, `useStaff`, `useHubs`, `useAnalytics`, `useDashboardKPIs`, `useShiftReport`, `useSidebarBadges`

**Business Logic Hooks**: `useScanningLogic` (11.8KB), `useManifestScan` (9.3KB), `useManifestBuilder` (8.9KB), `useCloseManifest` (6.9KB), `useInvoiceActions` (13.2KB), `useMultiStepInvoice` (8.8KB), `useArrivalAudit` (7.6KB), `useAnomalyDetector` (3.5KB)

**UI/Utility Hooks**: `useRealtime`, `useRBAC`, `useIdleTimeout`, `useDebounce`, `useMediaQuery`, `use-mobile`, `use-outside-click`, `use-auto-resize-textarea`, `use-keyboard-shortcuts`, `useGlobalSearch`

---

## 16. PDF Generation

Three specialized generators in `lib/pdf/`:

1. **Invoice Generator** (15KB) — GST-compliant invoices with line items, tax breakdown (CGST/SGST/IGST), bank details, and company branding
2. **Label Generator** (28KB) — Shipping labels with barcodes, QR codes, consignor/consignee details, and routing information
3. **PDF Utilities** (4KB) — Shared helpers for formatting, fonts, and layout

Built on jsPDF + jspdf-autotable for table rendering, with pdf-lib for post-processing.

---

## 17. Supabase Backend

### Database (50 Migrations)
Key migrations cover:
- **Core schema**: Shipments, manifests, invoices, customers, packages, tracking events, staff, hubs, organizations
- **RLS policies** (5 migrations): Organization-scoped access, role-based restrictions
- **Hub access constraints**: Hub-specific data isolation
- **Invoice numbering**: Auto-incrementing invoice numbers
- **Manifest enterprise upgrade** (27KB): Complex manifest lifecycle operations
- **RBAC enhancement** (12KB): Role hierarchy and permissions
- **Atomic operations**: `close_manifest_atomic`, `manifest_depart_arrive_atomic`
- **Public tracking**: Unauthenticated shipment tracking function
- **Booking rate limiting**: Prevent booking spam
- **Global search**: Cross-entity search functions
- **Performance indexes**: Optimized query performance
- **Security hardening**: Function search path security, RLS consolidation

### Edge Functions (3)
| Function | Purpose |
|----------|---------|
| `close-manifest` | Atomic manifest closure with shipment status updates |
| `create-user` | Staff user creation with auth account provisioning |
| `tac-bot` | AI assistant integration (OpenRouter API) |

### Realtime
Supabase Realtime (WebSocket) enabled for `bookings` and `contact_messages` tables, with subscription helpers in `lib/supabase.ts` and the `useRealtime` hook.

---

## 18. Error Handling & Observability

### Error Hierarchy
```
AppError (base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
└── NetworkError (0)
```

### Supabase Error Mapping
`mapSupabaseError()` converts PostgreSQL error codes to domain errors:
- `23505` (unique violation) → `ConflictError`
- `23503` (FK violation) → `ValidationError`
- `23502` (not null) → `ValidationError`
- `42501` (privilege) → `AuthorizationError`
- JWT errors → `AuthenticationError`
- RLS errors → `AuthorizationError`
- Network errors → `NetworkError`

### Retry Logic
- Retry on `NetworkError` and 5xx server errors
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped)

### Logger (`lib/logger.ts`)
- Singleton `Logger` class with circular buffer (500 entries max)
- Log levels: debug, info, warn, error
- DEV-only debug/info output; always outputs warn/error
- Pluggable error reporter (wired to Sentry in production)
- `captureError()` method for full stack trace forwarding

### Sentry Integration (`lib/sentry.ts`)
- 100% error sampling, 10% transaction sampling in production
- Session replay on errors (100% replay rate on crash)
- Zod error enrichment, console.error capture as breadcrumbs
- Filtered noise: ResizeObserver, chunk loading, AbortError, network errors
- No PII sent by default (`sendDefaultPii: false`)
- Masked text and blocked media in replays

---

## 19. Design System & Theming

### Color System (OKLCH-based)
The project uses **OKLCH color space** for perceptually uniform colors:
- **Light theme**: Warm, balanced with indigo-violet accent (`oklch(55% 0.18 270)`)
- **Dark theme**: Rich, designed surfaces (not inverted light) with brighter accent (`oklch(72% 0.16 275)`)
- **Status tokens**: Success, warning, error, info, live, active — with adjusted lightness for each theme
- **Chart colors**: 5-color palette with balanced chroma

### Design Tokens
- **Typography**: Inter (sans-serif), Geist Mono (monospace) with OpenType features (`cv02`, `cv03`, `cv04`, `cv11`)
- **Radii**: 6 levels from `0.375rem` to `2rem`
- **Shadows**: 9 levels using oklch-based shadow colors for consistency
- **Blur**: 6 levels for glassmorphism effects

### Premium Effects
- **Glassmorphism**: `.glass-panel`, `.glass-card` presets
- **Spotlight cards**: Mouse-tracking radial gradient overlays
- **Grain texture**: SVG noise overlay with `mix-blend-mode: overlay`
- **Status badges**: 8 semantic badge styles with color-mix
- **20+ keyframe animations**: orbit, breathe, ripple, shimmer, scan-sweep, data-flow, etc.

### Accessibility
- `prefers-reduced-motion` — disables all animations
- `prefers-contrast: high` — increased border and ring contrast
- Enhanced `:focus-visible` indicators
- Skip-to-content link
- Print styles with `.no-print` class

---

## 20. Feature Flags

Centralized in `config/features.ts`:

**Module Flags** (all enabled): shipments, tracking, manifests, scanning, inventory, exceptions, finance, customers, management, analytics

**Feature Flags**:
| Feature | Status | Notes |
|---------|--------|-------|
| offlineScanning | ✅ Enabled | Offline-first scan queue |
| realtimeTracking | ✅ Enabled | Supabase Realtime |
| emailInvoices | ❌ Disabled | Pending Resend integration |
| auditLogs | ✅ Enabled | Full audit trail |
| batchLabelPrinting | ✅ Enabled | Multi-label printing |
| manifestQRCodes | ✅ Enabled | QR codes on manifests |

---

## 21. Build, Bundling & PWA

### Vite Configuration
- **Target**: ES2022 for modern browsers
- **CSS code splitting** for better caching
- **Hidden source maps** for Sentry (not served to clients)
- **Manual chunks** — 13 vendor chunk groups:
  - `vendor-react`, `vendor-radix`, `vendor-icons`, `vendor-data`
  - `vendor-sentry`, `vendor-editor`, `vendor-pdf`, `vendor-scanner`
  - `vendor-gsap`, `vendor-charts`, `vendor-supabase`, `vendor-motion`
  - `vendor-utils`, `vendor-core`
- **Chunk warning limit**: 1200KB (accommodating jspdf/pdf-lib)
- **Bundle visualizer**: `stats.html` with gzip/brotli sizes

### PWA (vite-plugin-pwa)
- **Auto-update** registration type
- SVG icons for 192x192 and 512x512
- Theme color: `#0f172a`
- Manifest: "TAC Cargo — Enterprise Logistics Management Platform"

---

## 22. Testing Strategy

### Unit Tests (Vitest + jsdom)
- Located in `tests/unit/` mirroring source structure
- Subdirectories: `components/`, `hooks/`, `lib/`, `store/`
- Mock Supabase with `vi.mock('@/lib/supabase')`
- Pattern: `describe > describe > it`
- Environment variables injected via `cross-env`

### E2E Tests (Playwright — 17 spec files)
| Test File | Focus Area |
|-----------|-----------|
| `barcode-scanning-workflow.spec.ts` | Scanning end-to-end (11KB) |
| `manifest-scanning-enterprise.spec.ts` | Enterprise manifest scanning (22KB) |
| `enterprise-stress.spec.ts` | Load/stress testing (12KB) |
| `shipment-workflow.spec.ts` | Shipment lifecycle |
| `manifest-workflow.spec.ts` | Manifest lifecycle |
| `scanner-context.spec.ts` | Scanner context detection (10KB) |
| `scanner-stress.spec.ts` | Scanner under stress |
| `scanning-idempotency.spec.ts` | Duplicate scan handling |
| `terminal-scanner-visual.spec.ts` | Terminal scanner UI (7.6KB) |
| `visual-regression.spec.ts` | Visual regression testing (6.7KB) |
| `production-readiness.spec.ts` | Production checklist (9.6KB) |
| `public-booking.spec.ts` | Public booking flow |
| `legal-pages.spec.ts` | Terms/privacy rendering |
| `book-shipment-redirect.spec.ts` | Booking redirect |
| `uncovered-modules-workflow.spec.ts` | Coverage gap testing |

---

## 23. CI/CD & Code Quality

### GitHub Actions Workflows (4)
1. **code-quality.yml** (13KB) — Typecheck, lint, format, unit tests, build, bundle size check, guard scripts
2. **codeql.yml** — CodeQL security analysis
3. **css-lint.yml** — Stylelint CSS validation
4. **dependabot-auto-merge.yml** — Auto-merge Dependabot patch/minor updates

### CI-Enforced Guards
1. **No mock data** in production code (`guard:no-mock-data` script)
2. **No hardcoded slate/gray** Tailwind classes in `components/` or `pages/`
3. **No direct JsBarcode imports** — must use `UniversalBarcode` wrapper
4. **No `dangerouslySetInnerHTML`** without DOMPurify sanitization
5. **No Supabase service role key** in client code
6. **Typecheck, lint, and format** must all pass

### Git Hooks (Husky + lint-staged)
- **Pre-commit**: `eslint --fix --max-warnings 0` + `prettier --write` on `.ts/.tsx`; `prettier --write` on `.json/.css/.md`

---

## 24. Security Posture

- **Content Security Policy** (CSP) in `index.html` — restricts script, style, font, image, and connection sources
- **Row Level Security** (RLS) on all Supabase tables — organization-scoped
- **JWT-based authentication** via Supabase Auth
- **RBAC** at route, component, and database levels
- **DOMPurify** for HTML sanitization (CI guard prevents raw `dangerouslySetInnerHTML`)
- **Zod validation** on all form inputs and environment variables
- **GDPR-compliant sign-out** — clears all sensitive localStorage data
- **No PII in error reports** — Sentry configured with `sendDefaultPii: false`
- **CodeQL** security scanning in CI
- **Dependabot** for dependency vulnerability monitoring
- **Secure function search paths** in PostgreSQL (migration 20260226)
- **Booking rate limiting** at database level
- **Serialization security** — `serialize-javascript@^7.0.4` override for known vulnerability

---

## 25. Configuration & Environment

### Required Variables
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (publishable) key |

### Optional Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | (disabled) |
| `VITE_APP_VERSION` | App version for Sentry releases | `1.0.0` |
| `VITE_ENABLE_SENTRY_DEV` | Enable Sentry in development | `false` |
| `VITE_OPENROUTER_API_KEY` | AI assistant API key | (disabled) |

All validated at startup via Zod in `lib/env.ts`. Missing required vars throw in production, warn in development.

---

## 26. Pros & Cons Analysis

### Strengths

| Area | Detail |
|------|--------|
| **Type Safety** | Branded types, strict TypeScript, Zod validation everywhere |
| **Architecture** | Clean separation: pages → hooks → services → Supabase |
| **Offline-First** | Scan queue with auto-sync — critical for warehouse reliability |
| **Scanner Detection** | Sophisticated keystroke timing analysis with configurable thresholds |
| **RBAC** | 11 roles with module-level, hub-specific access control |
| **Error Handling** | Full hierarchy with Supabase error mapping, retry logic, and Sentry |
| **Design System** | OKLCH-based theming, glassmorphism, 20+ animations, accessibility |
| **Testing** | 17 E2E specs + unit tests + visual regression + stress testing |
| **CI Guards** | 6 automated guards preventing common anti-patterns |
| **Bundle Optimization** | 13 vendor chunks, hidden source maps, PWA support |
| **Security** | CSP, RLS, RBAC, DOMPurify, CodeQL, rate limiting, GDPR compliance |
| **Observability** | Structured logger, Sentry with replays, circular buffer |
| **PDF Generation** | GST-compliant invoices and shipping labels |
| **Real-time** | Supabase Realtime for live updates |

### Weaknesses

| Area | Detail |
|------|--------|
| **Bundle Size** | Large dependency set (pdf, scanning, editor, charts) — even with code-splitting |
| **Dual Type System** | Two parallel type definitions (`types.ts` root + `types/domain.ts`) with some overlap |
| **No SSR** | SPA-only — SEO depends on meta tags, no server-side rendering |
| **Two-Hub Limitation** | Only Imphal and New Delhi hubs hardcoded — adding hubs requires code changes |
| **Email Feature** | Invoice emailing disabled pending Resend integration |
| **Database Types** | 62KB auto-generated `database.types.ts` — large file, may slow IDE |
| **Legacy Format Support** | Some older barcode formats (WEE, MAN-) are explicitly rejected rather than migrated |
| **Test Coverage** | E2E tests are thorough but unit test coverage structure could be deeper |
| **Stale Files** | Several debug/error log files committed to repository |
| **No i18n** | English-only — no internationalization framework |

---

> **Document generated from source analysis of the TAC Cargo Enterprise Portal codebase.**
