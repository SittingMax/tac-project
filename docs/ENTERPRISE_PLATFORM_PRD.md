# TAC Cargo - Product Requirements Document (PRD)
## Amazon-Level Enterprise Logistics SaaS Platform

**Version:** 1.0  
**Date:** January 2026  
**Document Owner:** Technical Architecture Team  
**Classification:** Strategic Product Initiative

---

## Executive Summary

TAC Cargo is a next-generation, Amazon Logistics-grade enterprise SaaS platform designed to revolutionize freight logistics operations between Imphal and New Delhi. Built with React 19, Tailwind CSS 4, and Supabase, this platform represents the convergence of cutting-edge web technologies, award-winning design principles, and enterprise-grade architectural patterns.

**Mission:** Deliver a scanning-first, operations-centric logistics platform with world-class UI/UX that rivals Amazon Logistics, FedEx Manager, and DHL MyDHL+ in functionality while surpassing them in modern design and developer experience.

**Target Users:** Enterprise logistics operators, warehouse staff, operations managers, billing departments, and executive stakeholders requiring real-time visibility into shipment operations.

---

## 1. Strategic Vision & Market Position

### 1.1 Product North Star

TAC Cargo will be recognized as:
- **The most modern** logistics SaaS platform in the Indian freight corridor
- **The fastest** to implement for mid-market logistics providers
- **The most intuitive** for warehouse operators with minimal training
- **The most reliable** for audit compliance and regulatory requirements

### 1.2 Competitive Positioning

**We compete with:**
- Legacy TMS platforms (SAP TM, Oracle Transportation Management)
- Regional logistics software (Delhivery Platform, Ecom Express)
- Custom-built in-house solutions

**We differentiate through:**
1. **Modern Stack Excellence** - React 19 + Tailwind CSS 4 (competitors use React 16/17 + Bootstrap/Material UI)
2. **Scanning-First Operations** - Every action starts with a scan (competitors rely on manual entry)
3. **Award-Winning UI** - Shadcn UI + custom design system (competitors have dated interfaces)
4. **Real-time Everything** - Supabase realtime subscriptions (competitors use polling)
5. **Zero Legacy Debt** - Built from scratch with 2025 best practices

---

## 2. Technical Foundation & Architecture

### 2.1 Technology Stack (Justified Choices)

#### Frontend Stack
| Technology | Version | Justification | Alternatives Rejected |
|------------|---------|---------------|----------------------|
| **React** | 19.0+ | Server Components, automatic batching, concurrent rendering, useActionState for forms | Vue 3 (smaller ecosystem), Angular (too heavy) |
| **Tailwind CSS** | 4.0+ | 5x faster builds, Lightning CSS integration, OKLCH colors, cascade layers | Styled Components (runtime cost), CSS Modules (less DX) |
| **TypeScript** | 5.3+ | Enterprise-grade type safety, better IDE support, fewer runtime errors | JavaScript (no type safety) |
| **Shadcn UI** | Latest | React 19 compatible, copy-paste philosophy, full customization | Material UI (too opinionated), Ant Design (Chinese-centric) |
| **TanStack Table** | 8.21+ | Headless architecture, virtualization, full control, React 19 ready | AG Grid (expensive enterprise license), MUI Data Grid (limited free tier) |
| **TanStack Query** | 5.0+ | Server state management, automatic caching, optimistic updates | SWR (limited features), Apollo (GraphQL only) |
| **Zustand** | 4.5+ | Lightweight UI state, no boilerplate, React 19 compatible | Redux Toolkit (too much boilerplate), Jotai (atoms pattern overhead) |
| **React Hook Form** | 7.51+ | Performant forms, Zod integration, minimal re-renders | Formik (deprecated patterns), TanStack Form (less mature) |
| **Zod** | 3.22+ | Runtime validation, type inference, composable schemas | Yup (no TS inference), Joi (Node.js centric) |
| **Tiptap** | 2.3+ | Rich text for notes/descriptions, extensible, ProseMirror-based | Lexical (less mature ecosystem), Quill (limited features) |

#### Scanning & Document Libraries
| Technology | Purpose | Justification |
|------------|---------|---------------|
| **@zxing/browser** | Barcode/QR scanning | Industry standard, works on all devices, supports Code128 + QR |
| **react-qr-barcode-scanner** | React wrapper for ZXing | Maintained, TypeScript support, camera controls |
| **JsBarcode** | Barcode generation | Lightweight, supports Code128, canvas/SVG output |
| **qrcode.react** | QR code generation | React-native, customizable, supports structured payloads |

#### Backend & Infrastructure
| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Supabase** | Database + Auth + Storage + Realtime | PostgreSQL-based, RLS for security, Edge Functions for serverside logic |
| **PostgreSQL** | RDBMS | ACID compliance, JSON support, triggers, mature ecosystem |
| **Supabase Auth** | Authentication | JWT-based, role-based access, SSO ready |
| **Supabase Storage** | File storage | S3-compatible, PDF/label storage, CDN integration |
| **Supabase Realtime** | Live updates | WebSocket-based, dashboard updates, inventory sync |
| **Supabase Edge Functions** | Serverless compute | Deno runtime, PDF generation, webhooks, audit logging |

#### Developer Experience
| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Vite** | Build tool | First-class Tailwind 4 support, fast HMR, optimized builds |
| **Vitest** | Testing | Vite-native, fast, Jest-compatible API |
| **Playwright** | E2E testing | Cross-browser, reliable, visual regression |
| **ESLint + Prettier** | Code quality | Industry standard, customizable, auto-fix |
| **Husky + lint-staged** | Git hooks | Pre-commit validation, prevents bad commits |

### 2.2 Why This Stack Beats Competitors

**vs. Material UI + Redux + Express Stack:**
- 60% smaller bundle size (Tailwind CSS 4 vs MUI)
- 3x faster state updates (Zustand vs Redux)
- 2x faster queries (TanStack Query vs manual fetch)
- No Express needed (Supabase Edge Functions)

**vs. Next.js + Prisma + Planet Scale:**
- Simpler architecture (no ORM overhead)
- Realtime out of the box (no custom WebSocket server)
- Better for SaaS multi-tenancy (Supabase RLS)
- Faster development (Supabase Studio)

**vs. Legacy React 16 + Bootstrap + MySQL:**
- Modern React features (Server Components, Suspense, Actions)
- Design system consistency (Tailwind tokens vs Bootstrap variables)
- Type-safe database (Supabase client vs raw SQL)
- Audit trails built-in (PostgreSQL triggers)

---

## 3. Design System & UI/UX Excellence

### 3.1 Design Philosophy

**Core Principles:**
1. **Density without Clutter** - Amazon-level information architecture
2. **Scanning-First** - Every action starts with a barcode/QR scan
3. **Progressive Disclosure** - Show critical info first, details on demand
4. **Keyboard-Optimized** - Power users should never touch mouse
5. **Mobile-Ready** - Warehouse staff use tablets and phones

### 3.2 Design Token System (OKLCH Colors)

```css
/* TAC Cargo Design Tokens - Tailwind CSS 4 @theme directive */
@theme {
  /* Brand Colors - OKLCH for wide gamut displays */
  --color-brand-primary: oklch(0.55 0.22 264);     /* Deep logistics blue */
  --color-brand-secondary: oklch(0.65 0.18 145);   /* Success green */
  --color-brand-accent: oklch(0.70 0.15 45);       /* Warning amber */
  --color-brand-danger: oklch(0.60 0.25 25);       /* Error red */
  
  /* Semantic Colors */
  --color-status-created: oklch(0.75 0.12 240);
  --color-status-transit: oklch(0.65 0.15 180);
  --color-status-delivered: oklch(0.70 0.20 145);
  --color-status-exception: oklch(0.60 0.25 25);
  
  /* Surface Colors - Dark Mode Native */
  --color-surface-base: oklch(0.17 0.01 264);
  --color-surface-elevated: oklch(0.20 0.01 264);
  --color-surface-overlay: oklch(0.23 0.01 264);
  
  /* Typography Scale */
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  
  --text-xs: 0.75rem;      /* 12px - Timestamps, labels */
  --text-sm: 0.875rem;     /* 14px - Body text */
  --text-base: 1rem;       /* 16px - Primary text */
  --text-lg: 1.125rem;     /* 18px - Subheadings */
  --text-xl: 1.25rem;      /* 20px - Headings */
  --text-2xl: 1.5rem;      /* 24px - Page titles */
  --text-4xl: 2.25rem;     /* 36px - Hero text */
  
  /* Spacing Scale - 4px base */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  
  /* Border Radius */
  --radius-sm: 0.375rem;  /* 6px - Buttons, inputs */
  --radius-md: 0.5rem;    /* 8px - Cards */
  --radius-lg: 0.75rem;   /* 12px - Modals */
  --radius-xl: 1rem;      /* 16px - Containers */
  
  /* Shadows - Layered UI */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

### 3.3 Icon System Strategy

**Primary Icon Library: Lucide React** (Shadcn UI default)
- Reason: Consistent with Shadcn UI ecosystem
- Style: Outline icons, 24px default, stroke-based
- Usage: 90% of interface icons

**Supplementary: Custom AWS-Style Icons**
- AWS Architecture Icons adapted for logistics
- Custom SVG icons for:
  - Hub/warehouse representations
  - Vehicle types (truck, plane)
  - Package status indicators
  - Scanning states
  
**NOT using Amazon Icons directly** (licensing + generic purpose)
Instead: Create custom icon set inspired by:
1. AWS Architecture Icons (clean, professional style)
2. Lucide React (outline style consistency)
3. Linear App icons (modern, geometric)

**Icon Component Pattern:**
```tsx
// icons/LogisticsIcons.tsx
export const PackageIcon = () => (
  <svg /* custom logistics package icon */ />
)

// Usage maintains Lucide-style API
<PackageIcon className="size-5 text-brand-primary" />
```

### 3.4 Component Library Architecture

**Base Layer - Shadcn UI (React 19 + Tailwind CSS 4)**
```bash
# Core primitives (copy-paste, fully customizable)
npx shadcn@latest add button input select dialog drawer badge
npx shadcn@latest add table card tabs command combobox
npx shadcn@latest add form dropdown-menu popover tooltip
npx shadcn@latest add sidebar sheet alert sonner
```

**Composite Layer - Custom Business Components**
```
components/
├── ui/                          # Shadcn components (auto-generated)
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── domain/                      # Business components
│   ├── ShipmentCard/
│   ├── PackageList/
│   ├── TrackingTimeline/
│   ├── ScanConsole/
│   └── ManifestBuilder/
└── layouts/
    ├── AppShell/
    ├── DashboardLayout/
    └── ScannerLayout/
```

### 3.5 Award-Winning UI Patterns

**1. Command Palette (⌘K / Ctrl+K)**
```tsx
// Global search + actions
<Command>
  <CommandInput placeholder="Search AWB, customer, or action..." />
  <CommandList>
    <CommandGroup heading="Recent Shipments">
      {recentShipments.map(shipment => (
        <CommandItem key={shipment.id}>
          <PackageIcon />
          <span>{shipment.awb_number}</span>
        </CommandItem>
      ))}
    </CommandGroup>
    <CommandGroup heading="Quick Actions">
      <CommandItem onSelect={() => openScanConsole()}>
        <ScanIcon /> Scan Package
      </CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

**2. Scan Console - Full-Screen Focused Mode**
- Camera feed with centered scan zone
- Real-time feedback (success/error animations)
- Rapid scan mode (100+ scans/minute)
- Manual fallback input
- Recent scans history sidebar

**3. Shipment Details Drawer**
- Slide-in from right (Amazon-style)
- Tabbed sections: Overview, Packages, Timeline, Exceptions, Documents
- Inline actions (print label, create exception, add note)
- Live updates via Supabase realtime

**4. Dashboard KPI Grid**
```tsx
<div className="grid grid-cols-4 gap-6">
  <KPICard
    title="Today's Shipments"
    value={247}
    change={+12.5}
    trend="up"
    icon={<PackageIcon />}
  />
  <KPICard
    title="In Transit"
    value={1834}
    change={-3.2}
    trend="down"
    icon={<TruckIcon />}
  />
  {/* More KPIs */}
</div>
```

**5. Data Tables with TanStack Table**
- Server-side pagination (100k+ rows)
- Multi-column sorting
- Column filters with combobox
- Column pinning (AWB always visible)
- Row selection for bulk actions
- Virtualization for smooth scrolling
- Export to Excel/CSV

### 3.6 Responsive Design Strategy

**Breakpoints (Tailwind CSS 4)**
```css
sm:  640px   /* Mobile landscape, tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large desktops */
```

**Mobile-First Priorities:**
1. Scan Console works perfectly on phones
2. Dashboard shows critical KPIs only
3. Tables switch to card view
4. Actions accessible via bottom sheet

**Desktop Optimizations:**
1. Multi-column layouts
2. Persistent sidebars
3. Drawer + modal combinations
4. Keyboard shortcuts everywhere

---

## 4. Data Architecture & Database Design

### 4.1 Supabase Multi-Tenant Schema

**Design Principles:**
- Every table has `org_id UUID` for tenant isolation
- RLS (Row Level Security) enforces access control
- Soft deletes (`deleted_at TIMESTAMPTZ`)
- Audit columns (`created_at`, `updated_at`, `created_by_staff_id`)
- Optimistic concurrency with `version INT`

**Core Tables:**

```sql
-- Organizations (SaaS tenants)
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hubs (Fixed: IMPHAL, NEW_DELHI)
CREATE TABLE hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (code IN ('IMPHAL', 'NEW_DELHI')),
  name TEXT NOT NULL,
  address JSONB NOT NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN DEFAULT true
);

-- Staff (Users with roles)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'ADMIN', 'MANAGER', 'WAREHOUSE_IMPHAL', 
    'WAREHOUSE_DELHI', 'OPS', 'INVOICE', 'SUPPORT'
  )),
  hub_id UUID REFERENCES hubs(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  customer_code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gstin TEXT,
  type TEXT CHECK (type IN ('individual', 'business')),
  address JSONB NOT NULL,
  billing_address JSONB,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(org_id, customer_code)
);

-- Shipments (Core logistics entity)
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  awb_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  origin_hub_id UUID REFERENCES hubs(id) NOT NULL DEFAULT (SELECT id FROM hubs WHERE code = 'IMPHAL'),
  destination_hub_id UUID REFERENCES hubs(id) NOT NULL DEFAULT (SELECT id FROM hubs WHERE code = 'NEW_DELHI'),
  mode TEXT CHECK (mode IN ('AIR', 'TRUCK')) NOT NULL,
  service_level TEXT CHECK (service_level IN ('STANDARD', 'EXPRESS')) NOT NULL,
  status TEXT CHECK (status IN (
    'CREATED', 'RECEIVED', 'LOADED_FOR_LINEHAUL', 
    'IN_TRANSIT', 'RECEIVED_AT_DEST', 'OUT_FOR_DELIVERY',
    'DELIVERED', 'EXCEPTION', 'CANCELLED'
  )) NOT NULL DEFAULT 'CREATED',
  package_count INT NOT NULL DEFAULT 1,
  total_weight DECIMAL(8,2) NOT NULL,
  declared_value DECIMAL(12,2),
  invoice_id UUID REFERENCES invoices(id),
  manifest_id UUID REFERENCES manifests(id),
  consignee_name TEXT NOT NULL,
  consignee_phone TEXT NOT NULL,
  consignee_address JSONB NOT NULL,
  special_instructions TEXT,
  totals JSONB DEFAULT '{}'::jsonb,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(org_id, awb_number)
);

-- Packages (Scannable units)
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  shipment_id UUID REFERENCES shipments(id) NOT NULL,
  package_no INT NOT NULL,
  package_id TEXT UNIQUE NOT NULL,
  weight DECIMAL(8,2) NOT NULL,
  dimensions JSONB,
  status TEXT NOT NULL DEFAULT 'CREATED',
  current_hub_id UUID REFERENCES hubs(id),
  bin_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(org_id, package_id)
);

-- Manifests (Dispatch batches)
CREATE TABLE manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  manifest_no TEXT NOT NULL,
  type TEXT CHECK (type IN ('AIR', 'TRUCK')) NOT NULL,
  from_hub_id UUID REFERENCES hubs(id) NOT NULL,
  to_hub_id UUID REFERENCES hubs(id) NOT NULL,
  status TEXT CHECK (status IN (
    'OPEN', 'CLOSED', 'DEPARTED', 'ARRIVED'
  )) NOT NULL DEFAULT 'OPEN',
  vehicle_meta JSONB,
  total_shipments INT DEFAULT 0,
  total_packages INT DEFAULT 0,
  total_weight DECIMAL(10,2) DEFAULT 0,
  created_by_staff_id UUID REFERENCES staff(id) NOT NULL,
  closed_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(org_id, manifest_no)
);

-- Manifest Items (Many-to-many relationship)
CREATE TABLE manifest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  manifest_id UUID REFERENCES manifests(id) NOT NULL,
  shipment_id UUID REFERENCES shipments(id) NOT NULL,
  scanned_by_staff_id UUID REFERENCES staff(id) NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(manifest_id, shipment_id)
);

-- Tracking Events (Immutable audit trail)
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  shipment_id UUID REFERENCES shipments(id) NOT NULL,
  awb_number TEXT NOT NULL,
  event_code TEXT NOT NULL,
  event_time TIMESTAMPTZ DEFAULT now(),
  hub_id UUID REFERENCES hubs(id),
  actor_staff_id UUID REFERENCES staff(id),
  source TEXT CHECK (source IN ('SCAN', 'MANUAL', 'SYSTEM', 'API')) NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast event lookups
CREATE INDEX idx_tracking_events_shipment ON tracking_events(shipment_id, event_time DESC);
CREATE INDEX idx_tracking_events_awb ON tracking_events(awb_number, event_time DESC);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  invoice_no TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  shipment_id UUID REFERENCES shipments(id),
  status TEXT CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED')) NOT NULL DEFAULT 'DRAFT',
  issue_date DATE,
  due_date DATE,
  line_items JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax JSONB,
  total DECIMAL(12,2) NOT NULL,
  payment_terms TEXT,
  notes TEXT,
  pdf_file_path TEXT,
  label_file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(org_id, invoice_no)
);

-- Exceptions (Problem tracking)
CREATE TABLE exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  shipment_id UUID REFERENCES shipments(id) NOT NULL,
  type TEXT CHECK (type IN (
    'DAMAGED', 'LOST', 'DELAYED', 'MISMATCH', 
    'PAYMENT_HOLD', 'MISROUTE', 'ADDRESS_ISSUE'
  )) NOT NULL,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) NOT NULL,
  status TEXT CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')) NOT NULL DEFAULT 'OPEN',
  description TEXT NOT NULL,
  resolution TEXT,
  assigned_to_staff_id UUID REFERENCES staff(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs (Compliance trail)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) NOT NULL,
  actor_staff_id UUID REFERENCES staff(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  before JSONB,
  after JSONB,
  request_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_staff_id, created_at DESC);
```

### 4.2 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Staff can only access their org's data
CREATE POLICY staff_org_isolation ON shipments
  FOR ALL
  TO authenticated
  USING (org_id = (SELECT org_id FROM staff WHERE auth_user_id = auth.uid()));

-- WAREHOUSE_IMPHAL can only see Imphal hub data
CREATE POLICY warehouse_imphal_filter ON packages
  FOR SELECT
  TO authenticated
  USING (
    current_hub_id = (SELECT id FROM hubs WHERE code = 'IMPHAL')
    AND org_id = (SELECT org_id FROM staff WHERE auth_user_id = auth.uid())
    AND (SELECT role FROM staff WHERE auth_user_id = auth.uid()) = 'WAREHOUSE_IMPHAL'
  );

-- ADMIN/MANAGER can access everything in their org
CREATE POLICY admin_full_access ON shipments
  FOR ALL
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM staff WHERE auth_user_id = auth.uid())
    AND (SELECT role FROM staff WHERE auth_user_id = auth.uid()) IN ('ADMIN', 'MANAGER')
  );
```

### 4.3 Database Functions & Triggers

```sql
-- Auto-generate AWB number
CREATE OR REPLACE FUNCTION generate_awb_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_sequence INT;
  v_awb TEXT;
BEGIN
  -- Get next sequence number for this org
  SELECT COALESCE(MAX(CAST(SUBSTRING(awb_number FROM 8) AS INT)), 0) + 1
  INTO v_sequence
  FROM shipments
  WHERE org_id = p_org_id;
  
  -- Format: TAC2026001, TAC2026002, ...
  v_awb := 'TAC' || TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(v_sequence::TEXT, 6, '0');
  
  RETURN v_awb;
END;
$$ LANGUAGE plpgsql;

-- Audit log trigger
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    org_id,
    actor_staff_id,
    action,
    entity_type,
    entity_id,
    before,
    after
  ) VALUES (
    COALESCE(NEW.org_id, OLD.org_id),
    (SELECT id FROM staff WHERE auth_user_id = auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to all tables
CREATE TRIGGER audit_shipments AFTER INSERT OR UPDATE OR DELETE ON shipments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();
-- ... (repeat for all tables)
```

---

## 5. Core Features & Modules

### 5.1 Module Breakdown

#### M1: Foundation (Weeks 1-2)
**Deliverables:**
- Design system implementation
- App shell with sidebar navigation
- Authentication flows
- RLS policies setup
- Basic API integration

**Components:**
- `AppShell` - Main layout container
- `Sidebar` - Navigation with collapsible sections
- `Header` - Global search, quick actions, user menu
- `Button`, `Input`, `Select` - Shadcn UI primitives
- `ThemeProvider` - Dark/light mode

#### M2: Shipments (Weeks 3-4)
**Deliverables:**
- Shipment creation wizard
- Shipment list with filters
- Shipment details drawer
- AWB generation

**Key Features:**
- Multi-step form with validation
- Real-time AWB preview
- Customer search/create
- Package count and weights
- Service level selection

#### M3: Scanning Engine (Weeks 5-6)
**Deliverables:**
- Camera-based scanning
- Manual input fallback
- Rapid scan mode
- Scan history

**Technical Implementation:**
```tsx
// ScanConsole.tsx
import { useZxing } from 'react-zxing'
import { useMutation } from '@tanstack/react-query'

export function ScanConsole() {
  const [scannedCodes, setScannedCodes] = useState<string[]>([])
  
  const { ref: videoRef } = useZxing({
    onDecodeResult(result) {
      const code = result.getText()
      if (!scannedCodes.includes(code)) {
        setScannedCodes(prev => [code, ...prev])
        processScannedCode(code)
      }
    },
    constraints: {
      video: { facingMode: 'environment' },
      audio: false
    }
  })
  
  const processScanMutation = useMutation({
    mutationFn: async (code: string) => {
      // Process scan: create tracking event, update package status
      const { data } = await supabase
        .from('tracking_events')
        .insert({
          awb_number: code,
          event_code: 'SCANNED',
          source: 'SCAN'
        })
      return data
    },
    onSuccess: () => {
      toast.success('Package scanned successfully')
      playSuccessSound()
    }
  })
  
  return (
    <div className="fixed inset-0 bg-surface-base z-50">
      {/* Camera feed */}
      <video ref={videoRef} className="w-full h-full object-cover" />
      
      {/* Scan zone overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border-4 border-brand-primary rounded-lg" />
      </div>
      
      {/* Scan history sidebar */}
      <aside className="absolute right-0 top-0 h-full w-80 bg-surface-elevated">
        <h3 className="text-lg font-semibold p-4">Recent Scans</h3>
        <ul>
          {scannedCodes.map(code => (
            <li key={code} className="p-4 border-b">
              <span className="font-mono">{code}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
```

**Features:**
- Auto-focus scanning with visual feedback
- Beep sound on successful scan
- Duplicate detection
- Batch scanning mode (100+ scans)
- Offline queue (sync when online)

#### M4: Manifests (Weeks 7-8)
**Deliverables:**
- Manifest builder
- Shipment assignment via scan
- Manifest lifecycle (OPEN → CLOSED → DEPARTED → ARRIVED)
- Bulk tracking event generation

**Key Features:**
- Drag-and-drop shipments into manifest
- Real-time manifest totals
- Vehicle details (flight/truck number)
- Departure/arrival time tracking

#### M5: Inventory Management (Weeks 9-10)
**Deliverables:**
- Hub inventory view (Imphal + Delhi)
- Bin location assignment
- Aging analysis
- Inbound/outbound flows

**Table Implementation:**
```tsx
// InventoryTable.tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

const columns = [
  {
    accessorKey: 'package_id',
    header: 'Package ID',
    cell: ({ row }) => (
      <div className="font-mono">{row.original.package_id}</div>
    )
  },
  {
    accessorKey: 'awb_number',
    header: 'AWB',
    enablePinning: true // Always visible
  },
  {
    accessorKey: 'bin_location',
    header: 'Bin',
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.bin_location || 'Unassigned'}</Badge>
    )
  },
  {
    accessorKey: 'days_in_hub',
    header: 'Aging',
    cell: ({ row }) => {
      const days = row.original.days_in_hub
      const variant = days > 3 ? 'destructive' : days > 1 ? 'warning' : 'default'
      return <Badge variant={variant}>{days}d</Badge>
    }
  }
]

export function InventoryTable() {
  const table = useReactTable({
    data: inventory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enablePinning: true,
    initialState: {
      columnPinning: { left: ['awb_number'] }
    }
  })
  
  return <DataTable table={table} />
}
```

#### M6: Tracking & Customer Portal (Weeks 11-12)
**Deliverables:**
- Internal tracking timeline
- Public tracking page (`/track/:awb`)
- Customer notifications (email + SMS)
- Realtime status updates

**Tracking Timeline Component:**
```tsx
// TrackingTimeline.tsx
export function TrackingTimeline({ awbNumber }: { awbNumber: string }) {
  const { data: events } = useQuery({
    queryKey: ['tracking-events', awbNumber],
    queryFn: () => fetchTrackingEvents(awbNumber)
  })
  
  // Realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel(`tracking:${awbNumber}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tracking_events',
        filter: `awb_number=eq.${awbNumber}`
      }, (payload) => {
        queryClient.invalidateQueries(['tracking-events', awbNumber])
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [awbNumber])
  
  return (
    <div className="space-y-4">
      {events?.map(event => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-brand-primary" />
            <div className="w-0.5 h-full bg-border" />
          </div>
          <div>
            <p className="font-semibold">{event.event_code}</p>
            <p className="text-sm text-muted">{event.hub?.name}</p>
            <p className="text-xs text-muted">{formatDate(event.event_time)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### M7: Invoice & Billing (Weeks 13-14)
**Deliverables:**
- Invoice creation wizard
- GST calculation
- PDF generation (server-side)
- Thermal label generation (4x6)
- Reprint functionality

**Invoice PDF Generation (Supabase Edge Function):**
```typescript
// supabase/functions/generate-invoice-pdf/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { renderToString } from 'https://esm.sh/react-dom@18/server'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

serve(async (req) => {
  const { invoiceId } = await req.json()
  
  // Fetch invoice data
  const supabase = createClient(...)
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, customer(*), shipment(*)')
    .eq('id', invoiceId)
    .single()
  
  // Generate PDF using React component
  const html = renderToString(<InvoiceTemplate invoice={invoice} />)
  const pdf = await generatePDF(html)
  
  // Upload to Supabase Storage
  const fileName = `invoices/${invoice.invoice_no}.pdf`
  await supabase.storage
    .from('documents')
    .upload(fileName, pdf, { upsert: true })
  
  // Update invoice record
  await supabase
    .from('invoices')
    .update({ pdf_file_path: fileName })
    .eq('id', invoiceId)
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Thermal Label Generation:**
```tsx
// components/domain/ShippingLabel.tsx
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode.react'

export function ShippingLabel({ shipment }: { shipment: Shipment }) {
  const barcodeRef = useRef<SVGSVGElement>(null)
  
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, shipment.awb_number, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true
      })
    }
  }, [shipment.awb_number])
  
  return (
    <div className="w-[4in] h-[6in] bg-white p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">TAC CARGO</h1>
        <p className="text-sm">Express Logistics</p>
      </div>
      
      {/* AWB Barcode */}
      <div className="flex justify-center">
        <svg ref={barcodeRef} />
      </div>
      
      {/* Route */}
      <div className="text-center text-xl font-bold">
        {shipment.origin_hub.code} → {shipment.destination_hub.code}
      </div>
      
      {/* Package Count */}
      <div className="text-center text-lg">
        Package {shipment.packages[0].package_no} of {shipment.package_count}
      </div>
      
      {/* QR Code */}
      <div className="flex justify-center">
        <QRCode
          value={JSON.stringify({
            awb: shipment.awb_number,
            pkg: shipment.packages[0].package_id,
            from: shipment.origin_hub.code,
            to: shipment.destination_hub.code
          })}
          size={128}
        />
      </div>
      
      {/* Consignee */}
      <div className="border-t pt-2">
        <p className="font-semibold">{shipment.consignee_name}</p>
        <p className="text-sm">{shipment.consignee_phone}</p>
      </div>
    </div>
  )
}
```

#### M8: Exceptions & Alerts (Weeks 15-16)
**Deliverables:**
- Exception creation workflow
- Exception assignment to staff
- Resolution tracking
- SLA breach detection
- Real-time alerts

**Exception Types:**
- DAMAGED - Package physically damaged
- LOST - Package cannot be located
- DELAYED - Shipment missed SLA
- MISMATCH - Package count/weight doesn't match
- PAYMENT_HOLD - Payment issue
- MISROUTE - Wrong destination
- ADDRESS_ISSUE - Consignee details incorrect

#### M9: Analytics Dashboard (Weeks 17-18)
**Deliverables:**
- Operational KPI dashboard
- Hub performance metrics
- Revenue analytics
- Exception rate trends
- Manifest efficiency

**Dashboard Visualizations:**
```tsx
// components/domain/OperationalDashboard.tsx
import { LineChart, BarChart, PieChart } from 'recharts'

export function OperationalDashboard() {
  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: fetchDashboardKPIs
  })
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <KPICard
          title="Today's Shipments"
          value={kpis?.todayShipments || 0}
          change={kpis?.shipmentsChange || 0}
          icon={<PackageIcon />}
        />
        <KPICard
          title="In Transit"
          value={kpis?.inTransit || 0}
          change={kpis?.transitChange || 0}
          icon={<TruckIcon />}
        />
        <KPICard
          title="Exceptions"
          value={kpis?.exceptions || 0}
          trend="down"
          icon={<AlertTriangleIcon />}
        />
        <KPICard
          title="On-Time %"
          value={`${kpis?.onTimePercentage || 0}%`}
          trend="up"
          icon={<ClockIcon />}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipment Volume (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={kpis?.shipmentsTrend} width={500} height={300}>
              <Line dataKey="count" stroke="var(--color-brand-primary)" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Hub Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart width={500} height={300}>
              <Pie data={kpis?.hubDistribution} dataKey="value" nameKey="hub" />
              <Tooltip />
            </PieChart>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

#### M10: Settings & Administration (Weeks 19-20)
**Deliverables:**
- Staff management
- Role assignment
- Hub configuration
- Invoice branding
- SLA thresholds
- Audit log viewer

---

## 6. Quality Assurance & Performance

### 6.1 Performance Targets

**Lighthouse Scores (Minimum):**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

**Runtime Performance:**
- Time to Interactive (TTI): < 3s on 4G
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

**Bundle Targets:**
- Initial JS bundle: < 200KB gzipped
- CSS bundle: < 50KB gzipped
- Route chunks: < 100KB each
- Image optimization: WebP + lazy loading

### 6.2 Testing Strategy

**Unit Tests (Vitest):**
- All utility functions
- Form validation logic
- State management
- API integration layer

**Component Tests (Vitest + Testing Library):**
- All domain components
- User interactions
- Edge cases

**E2E Tests (Playwright):**
```typescript
// tests/e2e/shipment-creation.spec.ts
test('create shipment end-to-end', async ({ page }) => {
  await page.goto('/shipments/create')
  
  // Select customer
  await page.click('[data-testid="customer-select"]')
  await page.fill('[data-testid="customer-search"]', 'Acme Corp')
  await page.click('[data-testid="customer-option-1"]')
  
  // Enter package details
  await page.fill('[data-testid="package-count"]', '3')
  await page.fill('[data-testid="total-weight"]', '15.5')
  
  // Select service level
  await page.click('[data-testid="service-express"]')
  
  // Submit
  await page.click('[data-testid="create-shipment"]')
  
  // Verify success
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  await expect(page.locator('[data-testid="awb-number"]')).toContainText('TAC2026')
})
```

### 6.3 Security Checklist

- [ ] RLS policies on all tables
- [ ] Input validation on all forms (Zod)
- [ ] XSS prevention (React escapes by default)
- [ ] CSRF protection (Supabase handles this)
- [ ] Rate limiting on API calls
- [ ] Audit logging on all mutations
- [ ] Role-based UI hiding
- [ ] Secure file uploads (file type validation)
- [ ] No sensitive data in logs
- [ ] Environment variables for secrets

---

## 7. Deployment & DevOps

### 7.1 Infrastructure

**Hosting:**
- Frontend: Vercel (edge network, automatic HTTPS)
- Backend: Supabase Cloud (managed Postgres + Edge Functions)
- CDN: Cloudflare (asset delivery, DDoS protection)

**Environments:**
1. **Development** - Local Supabase + Vite dev server
2. **Staging** - Supabase staging project + Vercel preview
3. **Production** - Supabase production + Vercel production

### 7.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Build
        run: npm run build
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 7.3 Monitoring & Observability

**Frontend Monitoring:**
- Sentry for error tracking
- Vercel Analytics for performance
- Posthog for product analytics

**Backend Monitoring:**
- Supabase Dashboard (database metrics)
- Edge Function logs
- RLS policy violations

**Alerts:**
- Error rate > 1% → Slack notification
- API response time > 2s → PagerDuty alert
- Database CPU > 80% → Email notification

---

## 8. Success Metrics (KPIs)

### 8.1 Product Metrics

**Adoption:**
- 100+ shipments/day within 3 months
- 5+ concurrent users during peak hours
- 90%+ staff onboarding completion

**Performance:**
- Scan-to-confirmation time: < 2 seconds
- Manifest creation time: < 5 minutes (for 50 shipments)
- Invoice generation time: < 10 seconds

**Quality:**
- Exception rate: < 2%
- On-time delivery rate: > 95%
- User satisfaction score: > 4.5/5

### 8.2 Technical Metrics

**Reliability:**
- 99.9% uptime (monthly)
- Zero data loss incidents
- < 1 critical bug per month

**Developer Experience:**
- New feature deployment: < 2 days
- Bug fix deployment: < 4 hours
- Zero security vulnerabilities (OWASP Top 10)

---

## 9. Risk Mitigation

### 9.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| React 19 breaking changes | Medium | High | Thorough testing, gradual migration, fallback plan |
| Tailwind CSS 4 compatibility | Low | Medium | Use alpha with caution, monitor changelog |
| Supabase RLS complexity | Medium | High | Comprehensive RLS testing, security audit |
| Scanning camera failures | High | Critical | Fallback to manual input, multi-device testing |
| PDF generation performance | Medium | Medium | Edge Functions with queue, lazy generation |

### 9.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| User resistance to scanning | Medium | High | Training videos, in-person onboarding |
| Competitor launches similar product | Low | Medium | Rapid feature development, lock-in via integrations |
| Regulatory compliance changes | Low | High | Modular compliance layer, legal review |

---

## 10. Development Roadmap

### Phase 1: MVP (Weeks 1-12)
**Goal:** Core logistics operations functional

**Deliverables:**
- Authentication & authorization
- Shipment creation & tracking
- Scanning console
- Manifest management
- Basic inventory

**Success Criteria:**
- 10 test shipments created
- 100 scans performed
- 5 manifests created

### Phase 2: Enterprise Features (Weeks 13-20)
**Goal:** Invoice, analytics, and exceptions

**Deliverables:**
- Invoice generation (PDF + label)
- Exception management
- Analytics dashboard
- Staff management
- Audit log viewer

**Success Criteria:**
- 50+ invoices generated
- Exception resolution time < 24h
- Dashboard loads in < 2s

### Phase 3: Polish & Optimization (Weeks 21-24)
**Goal:** Award-winning UI/UX, performance optimization

**Deliverables:**
- Command palette (⌘K)
- Keyboard shortcuts
- Mobile optimization
- Performance tuning
- Design system documentation

**Success Criteria:**
- Lighthouse score > 90 on all metrics
- User satisfaction > 4.5/5
- Feature parity with Amazon Logistics UI

### Phase 4: Scale & Advanced Features (Weeks 25-30)
**Goal:** Multi-hub expansion, integrations

**Deliverables:**
- API for third-party integrations
- WhatsApp/SMS notifications
- Customer portal
- Advanced analytics (predictive delays)
- Multi-org support (true SaaS)

**Success Criteria:**
- 500+ shipments/day
- 3+ integration partners
- 95%+ system uptime

---

## 11. Design System Documentation

### 11.1 Component Catalog

**Atoms (Shadcn UI primitives):**
- Button, Input, Select, Checkbox, Radio, Switch, Label
- Badge, Avatar, Separator, Skeleton
- Tooltip, Popover, Dialog, Drawer, Sheet

**Molecules (Composite components):**
- FormField (Label + Input + Error)
- SearchCombobox (Input + Popover + List)
- KPICard (Icon + Value + Trend + Change)
- StatusBadge (Badge with predefined variants)

**Organisms (Domain components):**
- ShipmentCard, PackageList, TrackingTimeline
- ScanConsole, ManifestBuilder, InvoiceViewer
- DataTable, CommandPalette, NotificationCenter

**Templates:**
- DashboardLayout, ScannerLayout, DetailDrawerLayout
- WizardLayout, FormLayout, TableLayout

### 11.2 Typography System

```css
/* Font Families */
--font-sans: "Inter Variable", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;

/* Type Scale (1.250 ratio - Major Third) */
--text-xs:   0.64rem;   /* 10.24px */
--text-sm:   0.8rem;    /* 12.8px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.25rem;   /* 20px */
--text-xl:   1.563rem;  /* 25px */
--text-2xl:  1.953rem;  /* 31.25px */
--text-3xl:  2.441rem;  /* 39.06px */
--text-4xl:  3.052rem;  /* 48.83px */

/* Line Heights */
--leading-tight:  1.25;
--leading-normal: 1.5;
--leading-loose:  1.75;

/* Font Weights */
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

### 11.3 Spacing System

```css
/* 4px base unit (1rem = 16px) */
--space-0:  0;
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## 12. Dependencies & Package.json

```json
{
  "name": "tac-cargo",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-react": "^0.5.0",
    
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-table": "^8.11.0",
    "zustand": "^4.5.0",
    
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-drawer": "^0.5.4",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    
    "lucide-react": "^0.300.0",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^2.2.0",
    
    "@zxing/browser": "^0.1.4",
    "react-qr-barcode-scanner": "^1.0.6",
    "jsbarcode": "^3.11.6",
    "qrcode.react": "^3.1.0",
    
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "sonner": "^1.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vitejs/plugin-react": "^4.2.1",
    
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    
    "@playwright/test": "^1.41.0",
    
    "tailwindcss": "^4.0.0-alpha.4",
    "@tailwindcss/vite": "^4.0.0-alpha.4",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.16",
    
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.11",
    
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
```

---

## 13. Conclusion & Next Steps

TAC Cargo represents a paradigm shift in logistics SaaS design. By combining React 19's cutting-edge features, Tailwind CSS 4's performance, and Supabase's enterprise-grade backend, we're building a platform that rivals Amazon Logistics in functionality while delivering a superior developer and user experience.

**Immediate Next Steps:**

1. **Week 1:** Design system prototype + Supabase schema implementation
2. **Week 2:** Authentication flows + RLS policy testing
3. **Week 3:** First module delivery (Shipment creation)
4. **Week 4:** Scanning console prototype + user testing

**Success Criteria for Award-Winning Status:**

✅ Sub-2s average page load time  
✅ 99.9% uptime in first 6 months  
✅ Zero critical security vulnerabilities  
✅ 90+ Lighthouse performance score  
✅ User satisfaction > 4.5/5  
✅ Featured in design community showcases  

**Long-Term Vision:**

TAC Cargo will become the **reference implementation** for modern logistics SaaS, showcasing best practices in React 19, Tailwind CSS 4, and enterprise architecture. Our open-source design system will be adopted by logistics companies across India and beyond.

---

**Document Version:** 1.0  
**Last Updated:** January 17, 2026  
**Next Review:** February 17, 2026