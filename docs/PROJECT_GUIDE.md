# TAC Cargo Enterprise Portal — Project Guide

> Last updated: March 2026  
> Stack: React 19, TypeScript 5.9, Vite 6, Tailwind CSS v4, Supabase

---

## 1. Executive Summary

TAC Cargo Enterprise Portal is a role-based logistics operations platform for managing cargo movement from booking intake through shipment creation, scanning, manifesting, tracking, invoicing, exception handling, delivery progression, and staff administration.

The system is designed for a logistics company that needs:

- End-to-end shipment visibility
- Fast warehouse scanning workflows
- Hub-to-hub manifest control
- Finance and document generation
- Public tracking and booking intake
- Multi-user, multi-role operational control
- Organization-scoped data security

At a business level, the portal serves as the company’s shared operational workspace. It gives customer-facing teams, operations teams, warehouse teams, finance teams, and management a single system of record for the shipment lifecycle.

The current implementation is centered on TAC Cargo’s operational network and explicitly models workflows around the Imphal and New Delhi hub corridor, while the architecture itself is organization-scoped and designed to support broader operational growth.

---

## 2. What the Project Does

The portal supports five major business layers:

- Public self-service
- Internal operations execution
- Warehouse scan-first handling
- Finance and document workflows
- Administrative governance

In practical terms, the system allows a logistics company to:

- Capture booking requests from the public web experience
- Maintain a customer directory for repeat shippers and billed accounts
- Create shipments with generated CN numbers
- Move shipments through a controlled status lifecycle
- Group shipments into transport manifests
- Receive, load, verify, and deliver shipments using scanning workflows
- Detect and resolve damaged, delayed, misrouted, or problematic consignments
- Generate invoices and label documents
- Give customers a secure public tracking experience without exposing staff-only data
- Manage staff access by role and hub assignment

---

## 3. Why a Logistics Company Would Use This System

### 3.1 Operational Pain Points This Solves

Traditional cargo operators often manage shipments across spreadsheets, phone calls, messaging apps, handwritten scan sheets, and separate billing tools. That creates predictable problems:

- Lost shipment visibility between departments
- Delays in updating statuses
- Duplicate or inconsistent manifest records
- Weak accountability in warehouse handling
- Billing disconnected from operational truth
- Too much sensitive shipment data visible in public tracking
- Difficulty coordinating multiple staff roles across hubs

TAC Cargo Enterprise Portal addresses those problems by making shipment movement, financial documentation, and operational exceptions part of one connected workflow.

### 3.2 Core Business Value

For a logistics company, this system improves:

- **Operational speed**  
  Warehouse and operations staff can scan instead of manually re-entering codes.

- **Operational accuracy**  
  Manifest loading, arrival verification, and exception capture are structured instead of informal.

- **Billing discipline**  
  Invoices are linked to real customers and optionally to real shipments.

- **Customer trust**  
  Customers get public tracking without seeing protected internal information.

- **Managerial visibility**  
  Dashboard, analytics, and status views consolidate network activity.

- **Access control**  
  Finance users do not get warehouse tools, and warehouse users do not get finance access.

---

## 4. Primary User Personas

### 4.1 Public Customer / Shipper

Uses the public site to:

- Track a shipment by CN number
- Submit a booking request
- Reach TAC for support or sales

### 4.2 Operations Staff

Uses the internal portal to:

- Create shipments
- Search and monitor consignments
- Build manifests
- Review exceptions
- Coordinate handoffs between hubs

### 4.3 Warehouse Staff

Uses scanning-heavy workflows to:

- Receive inbound shipments
- Load shipments into manifests
- Verify manifest arrivals
- Mark delivery-stage operational movements

### 4.4 Finance Staff

Uses the finance area to:

- Create invoices
- Review billing records
- Mark invoices paid or cancelled
- Download invoices and labels
- Compose customer share actions

### 4.5 Manager / Admin / Super Admin

Uses the system to:

- Monitor operational KPIs
- Review manifests, shipments, finance, and exceptions
- Manage staff accounts and assignments
- Create new users through the edge-function-backed user flow

---

## 5. Current Role Model

The domain role model contains both current staff roles and a set of legacy/compatibility roles.

### 5.1 Defined Roles

- `SUPER_ADMIN`
- `ADMIN`
- `MANAGER`
- `OPS`
- `OPS_STAFF`
- `INVOICE`
- `FINANCE_STAFF`
- `SUPPORT`
- `WAREHOUSE_IMPHAL`
- `WAREHOUSE_DELHI`
- `WAREHOUSE_STAFF`

### 5.2 Role Intent

- **Elevated roles**  
  `SUPER_ADMIN`, `ADMIN`, and `MANAGER` are treated as elevated roles.

- **Operations roles**  
  `OPS` and `OPS_STAFF` cover shipment, manifest, tracking, and exception workflows.

- **Finance roles**  
  `INVOICE` and `FINANCE_STAFF` cover finance and customer billing workflows.

- **Warehouse roles**  
  `WAREHOUSE_IMPHAL`, `WAREHOUSE_DELHI`, and `WAREHOUSE_STAFF` cover scanning and inventory-oriented work.

### 5.3 Default Navigation Bias

The shared access layer gives role-sensitive default routing:

- Finance roles bias to `/finance`
- Operations roles bias to `/shipments`
- Warehouse roles bias to `/scanning`
- Others default to `/dashboard`

---

## 6. Route and Module Map

### 6.1 Public Routes

- `/`  
  Landing page

- `/track`
- `/track/:awb`  
  Public tracking and booking surface

- `/terms`
- `/privacy`  
  Legal pages

### 6.2 Protected Internal Routes

- `/dashboard`  
  Shared operational dashboard

- `/bookings`  
  Booking intake review for authorized staff

- `/analytics`  
  Management and finance-oriented analytics

- `/search`  
  Cross-entity internal search

- `/shipments`
- `/shipments/:id`  
  Shipment list and shipment detail workflows

- `/tracking`  
  Internal tracking workspace

- `/manifests`  
  Manifest list and manifest builder workflows

- `/scanning`  
  Scan-first warehouse/ops operations

- `/arrival-audit`  
  Arrival verification and related audit flow

- `/inventory`  
  Warehouse inventory-oriented view

- `/exceptions`  
  Exception reporting and resolution

- `/finance`  
  Invoice management and related document workflows

- `/customers`  
  Customer directory and billing profile management

- `/management`  
  Staff and hub access management

- `/admin/messages`  
  Admin-only message inbox

- `/settings`
- `/shift-report`
- `/notifications`  
  Shared operational support surfaces

- `/print/label/:awb`  
  Protected print route because of shipment PII exposure

---

## 7. Architecture Overview

## 7.1 Frontend Architecture

The application is a React SPA with route-level lazy loading and a layered structure:

- `pages/`  
  Route-level containers

- `components/`  
  Reusable UI primitives plus domain-specific components

- `hooks/`  
  Data hooks and business workflow hooks

- `store/`  
  Zustand stores for client state and offline queueing

- `lib/`  
  Cross-cutting utilities, services, query keys, Supabase access, validation, errors

- `context/`  
  Scanning and scan ownership coordination

### 7.1.1 App Composition

`App.tsx` builds the runtime tree in this order:

- `QueryClientProvider`
- `ScanningProvider`
- `ScanContextProvider`
- `BrowserRouter`
- `GlobalScanListener`
- `ScrollToTop`
- `Suspense`
- `ErrorBoundary`
- `PageTransition`
- `Routes`
- `Toaster`

This is important because it shows the project is intentionally designed so:

- Query caching is global
- Scanner input is globally available
- Scan ownership can be delegated to special pages like scanning or manifest builder
- Errors are isolated with boundaries
- Page shells and transitions are shared

## 7.2 Routing Architecture

Routes are declared centrally in `routes/index.tsx` and include:

- path
- lazy page component
- whether authentication is required
- whether the dashboard layout is used
- allowed roles

This makes access control declarative at the routing layer.

## 7.3 State Architecture

The system uses a split state model:

- **Zustand**  
  For client-owned state and persisted app behavior

- **TanStack Query**  
  For server state, caching, invalidation, and async fetch/mutation orchestration

### 7.3.1 Zustand Stores

Current store layer includes:

- `store/index.ts`  
  Shared UI-level state

- `store/authStore.ts`  
  Session, staff profile, auth initialization, sign-in/out, sensitive storage clearing

- `store/scanQueueStore.ts`  
  Offline-first scan queue with retry and sync lifecycle

- `store/auditStore.ts`  
  Audit-related local state

- `store/managementStore.ts`  
  Management-related local state

- `store/noteStore.ts`  
  Notes/comment workflow support

## 7.4 Data Layer

The system talks directly to Supabase using a typed client in `lib/supabase.ts`.

Patterns used in the codebase:

- table queries with joined relations
- RPC calls for operational functions
- org-scoped filtering with `org_id`
- React Query invalidation after mutations

Examples visible in the current code:

- `generate_cn_number`
- `generate_invoice_number`
- `search_shipments`
- manifest scan and manifest lifecycle RPC-backed flows in `manifestService`

## 7.5 Service Layer

The service layer concentrates higher-order domain logic in `lib/services/`.

One of the most important examples is `manifestService`, which handles:

- manifest creation
- transport-specific metadata
- scan-based shipment addition
- duplicate handling
- status transitions
- validation of shipment eligibility and destination

This is significant because manifest handling is not just CRUD. It is a controlled operational workflow with invariants.

## 7.6 UI Architecture

The authenticated shell is unified around shared layout primitives and reusable tables:

- `PageContainer`
- `PageHeader`
- `SectionCard`
- `StatCard`
- `CrudTable`
- `SizedDialog`

This gives the portal a consistent enterprise layout across pages while still allowing domain-specific workflows inside each module.

## 7.7 Backend Architecture

Supabase provides:

- PostgreSQL database
- Auth
- Storage
- Edge Functions
- Realtime

The current codebase also uses:

- secure public views for public tracking
- row-level organization scoping
- edge functions such as `create-user`

---

## 8. Security and Multi-Tenancy

Security is a major architectural concern in this project.

### 8.1 Organization Scoping

The internal app consistently uses the authenticated staff user’s `orgId` to scope:

- shipments
- manifests
- invoices
- customers
- exceptions
- staff

This prevents one organization’s users from reading another organization’s data.

### 8.2 Route-Level Access

`ProtectedRoute` enforces authenticated access and allowed roles at the route layer.

### 8.3 Capability-Level Access

`lib/access-control.ts` adds:

- role grouping
- module access checks
- role hierarchy checks
- role-sensitive default routing

### 8.4 Public Data Protection

The public tracking page intentionally uses database views:

- `public_shipment_tracking`
- `public_tracking_events`

Those views avoid exposing protected internal staff data and sensitive PII that should stay inside the staff portal.

### 8.5 Sensitive Client Storage Handling

`authStore` explicitly clears sensitive local storage on sign-out, including auth and draft-related operational keys.

---

## 9. Core Domain Model

The portal revolves around a few central business entities.

### 9.1 Shipment

A shipment is the operational heart of the system.

Key characteristics:

- generated CN number
- customer linkage
- origin hub and destination hub
- transport mode
- service level
- package count and weight
- consignee and consignor details
- delivery lifecycle state

### 9.2 Manifest

A manifest represents a grouped transport movement across hubs.

It includes:

- manifest reference number
- route
- transport type
- vehicle or flight metadata
- aggregated shipment/package/weight totals
- lifecycle status

### 9.3 Invoice

An invoice represents the finance-side billing document for a customer and optionally for a shipment.

It includes:

- invoice number
- customer linkage
- optional shipment linkage
- subtotal, tax, discount, total
- issue date, due date, paid state
- line items

### 9.4 Customer

Customers are persisted billing and contact records.

Current persisted fields clearly represented in the UI include:

- name
- type
- phone
- email
- address
- GSTIN
- credit limit

### 9.5 Exception

Exceptions capture problems that break normal movement flow.

They include:

- shipment linkage
- type
- severity
- description
- open/resolved lifecycle

### 9.6 Tracking Event

Tracking events capture operational history over time and are used for both internal and public tracking visibility.

### 9.7 Booking

A booking is an intake request submitted before or outside shipment creation.

It acts as pre-operational demand capture rather than a final shipment record.

---

## 10. Status Lifecycles

## 10.1 Shipment Lifecycle

The domain type system defines controlled shipment transitions including:

- `CREATED`
- `PICKUP_SCHEDULED`
- `PICKED_UP`
- `RECEIVED_AT_ORIGIN`
- `IN_TRANSIT`
- `RECEIVED_AT_DEST`
- `OUT_FOR_DELIVERY`
- `DELIVERED`

Alternative or problem states include:

- `CANCELLED`
- `RTO`
- `EXCEPTION`

This matters because warehouse scanning, manifest loading, delivery progression, and exception resolution all depend on valid transitions instead of unrestricted edits.

## 10.2 Manifest Lifecycle

Manifest statuses include:

- `DRAFT`
- `BUILDING`
- `OPEN`
- `CLOSED`
- `DEPARTED`
- `ARRIVED`
- `RECONCILED`

The manifest flow models real transport execution:

- creation
- load building
- closure
- departure
- arrival
- reconciliation

## 10.3 Invoice Lifecycle

Invoices move through:

- `DRAFT`
- `ISSUED`
- `PAID`
- `CANCELLED`
- `OVERDUE`

---

## 11. Major Features and Functionalities

## 11.1 Dashboard

The dashboard is the shared operational command view.

Current behavior and purpose:

- greets authenticated staff
- shows KPI-driven operational overview
- offers quick actions
- exposes live activity and operational health
- supports report export for finance-authorized roles
- uses role-aware action visibility

Its purpose is to let users begin work from a single overview rather than hunting through modules.

## 11.2 Shipments Module

The shipments area is the system of record for day-to-day consignment handling.

Features include:

- shipment list with search and filters
- create shipment flow
- shipment detail viewing
- export to CSV
- bulk status transitions based on shared valid next states
- protected delete behavior

Operationally, this is where the company turns demand into trackable cargo records.

## 11.3 Manifests Module

The manifests page supports linehaul grouping and transport movement.

Features include:

- manifest listing
- open/in-transit summary cards
- enterprise manifest builder wizard
- route and transport configuration
- depart and arrive actions
- manifest detail viewing

This module is essential for hub-to-hub control because it maps many shipments to one transport movement.

## 11.4 Scanning Module

The scanning page is a scan-first execution workspace with four modes:

- `RECEIVE`
- `LOAD_MANIFEST`
- `VERIFY_MANIFEST`
- `DELIVER`

Features include:

- camera scanner mode
- HID/manual scanner mode
- real-time scan feed
- active manifest banner
- offline queue awareness
- session statistics
- diagnostics and scanner debug

This is one of the most operationally important parts of the product.

## 11.5 Exceptions Module

The exceptions area handles anomaly management.

Features include:

- raise exception against a shipment by CN number
- severity and status filtering
- resolve open exceptions with notes
- realtime exception updates

This helps logistics teams treat damaged, delayed, or misrouted cargo as tracked workflow rather than informal escalation.

## 11.6 Finance Module

The finance area handles invoices, billing records, and shipment documents.

Features include:

- invoice table
- paid/pending/overdue summaries
- create invoice flow
- edit invoice flow
- invoice details modal
- mark paid / cancel actions
- invoice and label downloads
- WhatsApp/email compose actions when contact data exists

This ties commercial records to the real operational shipment base.

## 11.7 Customers Module

The customers area is the commercial relationship directory.

Features include:

- add customer
- edit customer
- delete customer
- type selection
- billing address and GST capture
- credit limit field

This is important because repeat billing, invoice linking, and shipment creation depend on having customer records.

## 11.8 Bookings Module

The internal bookings page lets staff review booking intake.

Features include:

- booking list
- created-today and pending counts
- new booking dialog

The underlying public booking workflow collects:

- WhatsApp contact
- consignor details
- consignee details
- addresses
- volume matrix entries
- supporting image uploads

Booking submission also creates an administrative contact message for follow-up.

## 11.9 Public Tracking

Public tracking is a customer-safe self-service surface.

Features include:

- CN-based search
- secure shipment overview without exposing internal-only details
- route visibility
- status badge
- tracking history timeline
- booking tab
- staff sign-in / contact-sales account tab

This page is intentionally not a full customer account system. It is a public self-service tracking and booking surface.

## 11.10 Management

The management module controls staff administration.

Features include:

- staff listing
- edit role and hub assignment
- activate/deactivate staff
- delete staff
- super-admin user creation via `create-user` edge function

This supports controlled operational governance.

---

## 12. Scanning Architecture in Depth

Scanning is one of the strongest differentiators of the project.

### 12.1 How Scanner Input Is Detected

`ScanningProvider` listens globally to keyboard events and distinguishes scanners from humans using timing behavior.

Important detection characteristics:

- configurable speed threshold
- stale buffer reset
- minimum scan length
- auto-submit support for scanners that do not press Enter
- duplicate suppression

### 12.2 Why Scan Ownership Exists

A global scanner can create conflicts if every page reacts to scans at once.

The project avoids that with scan context ownership:

- `GLOBAL`
- `SCANNING_PAGE`
- `MANIFEST_BUILDER`
- other local ownership states

This ensures:

- the scanning page handles warehouse workflows directly
- the manifest builder owns manifest-specific scan flow
- the rest of the app can still react to global scans when local handlers are inactive

### 12.3 Shipment Scan Preview Behavior

Outside of local scan-owned workflows, a scan can open a preview dialog.

Current behavior:

- shipment scans show shipment facts
- linked invoice information is shown if available
- navigation goes to internal shipment details, not to finance by default
- manifest scans can jump users toward the manifest workflow

### 12.4 Offline Queueing

When the device is offline:

- scans are retained locally in the persisted queue
- the UI indicates online/offline state
- retries happen automatically
- restored connectivity triggers sync attempts

This is particularly valuable in warehouse environments with unstable connectivity.

---

## 13. End-to-End User Flows

This section describes how the system is intended to be used as a complete operational product.

## 13.1 Public Customer Flow

### Step 1: Customer visits the public portal

The customer lands on the public-facing site and can:

- track an existing shipment
- submit a booking request
- contact TAC

### Step 2: Customer tracks a shipment

The customer enters a CN number on `/track` or `/track/:awb`.

The system:

- looks up the shipment through secure public views
- shows shipment status
- shows route and movement history
- avoids exposing staff-only and sensitive internal details

### Step 3: Customer submits a booking request

If the customer does not yet have a shipment, they can submit a booking request with:

- WhatsApp contact
- shipper and receiver information
- addresses
- package dimension and weight matrix
- optional supporting images

### Step 4: Booking enters internal follow-up workflow

The booking becomes visible in staff workflows and also generates an internal message for administrative follow-up.

This bridges public demand intake into internal operations.

## 13.2 Staff Authentication Flow

### Step 1: Staff signs in

Staff uses email/password authentication through Supabase Auth.

### Step 2: Staff profile is resolved

The app fetches the linked `staff` record and determines:

- role
- organization
- hub assignment
- active/inactive status

### Step 3: Organization context is established

The app sets current organization context, and later queries scope themselves to that organization.

### Step 4: Staff lands in the portal

After auth, the user enters the authenticated route space with role-aware access.

## 13.3 Booking Intake to Shipment Flow

This is one of the most common real-world logistics company workflows.

### Step 1: Booking request is received

The operations team reviews the booking from the bookings area.

### Step 2: Customer relationship is identified

If needed, staff creates or updates the customer record in the customers module.

### Step 3: Shipment is created

Staff creates a shipment from the shipments module.

During creation:

- the organization context is required
- a CN number is generated through an RPC
- consignee data is captured
- customer linkage is enforced

### Step 4: Shipment enters the lifecycle

The new shipment begins in `CREATED` and becomes the authoritative object used by tracking, scanning, manifests, finance, and exception handling.

## 13.4 Warehouse Receive Flow

This flow represents inbound operational handling at a hub.

### Step 1: User opens `/scanning`

The page takes scanner ownership and switches into scan-first mode.

### Step 2: User selects `RECEIVE`

The staff member scans shipment CNs.

### Step 3: System resolves the shipment

`useScanningLogic` finds the shipment and decides the next valid state:

- if shipment is `CREATED`, it can move to `RECEIVED_AT_ORIGIN`
- if already in movement, it can move to `RECEIVED_AT_DEST`

### Step 4: Scan result appears in the live feed

The operator immediately sees:

- success
- duplicate or already-processed condition
- failure

This gives a fast warehouse confirmation loop.

## 13.5 Manifest Build and Load Flow

This is the central hub-to-hub movement flow.

### Step 1: Operations opens the manifests module

The user creates a new manifest from the manifests page.

### Step 2: Manifest header is configured

The builder collects:

- origin hub
- destination hub
- transport type
- AIR details or TRUCK details

### Step 3: Builder enters scanning/load phase

The operator begins scanning shipment CNs into the manifest.

### Step 4: Validation happens during scan

Manifest logic validates:

- shipment exists
- shipment is eligible
- shipment is not duplicated
- destination fits the manifest route if validation is enabled

### Step 5: Totals update live

The UI updates shipment, package, and weight totals while the manifest builds.

### Step 6: Manifest is closed

Once physical loading is complete, the manifest is closed and transitions toward departure.

### Step 7: Manifest departs and later arrives

The manifests page supports movement actions like:

- `DEPARTED`
- `ARRIVED`

This models real transport execution, not just administrative grouping.

## 13.6 Arrival Verification Flow

This flow reduces misroutes and missing-shipment problems.

### Step 1: User selects `VERIFY_MANIFEST`

The scanning workflow expects a manifest to be activated first.

### Step 2: Manifest is scanned and activated

The system confirms the manifest is in a valid state for verification.

### Step 3: Shipments are scanned against the active manifest

For each shipment:

- if it belongs to the manifest, it can move to `RECEIVED_AT_DEST`
- if it does not belong to the manifest, the system raises a high-severity exception

This is a strong operational control that helps detect misroutes at the dock.

## 13.7 Delivery Flow

### Step 1: User selects `DELIVER`

The operator is now performing a final movement update.

### Step 2: Shipment is scanned

The app updates the shipment to `DELIVERED`.

### Step 3: Tracking visibility updates

Internal users and public tracking can now reflect that final state.

## 13.8 Exception Handling Flow

### Step 1: Problem is detected

A shipment may be damaged, delayed, short, misrouted, or otherwise problematic.

### Step 2: Staff raises an exception

The exception is linked to a real shipment by CN lookup.

### Step 3: Team triages and investigates

Users can filter by status and severity to focus on urgent work.

### Step 4: Resolution is recorded

A resolution note is captured, and the exception lifecycle advances.

This gives the company a formal anomaly process instead of relying on chat-only escalation.

## 13.9 Finance and Document Flow

### Step 1: Finance user opens `/finance`

The user sees invoice summaries and the invoice table.

### Step 2: New invoice is created

Invoice creation requires organization context and generates the invoice number from the backend.

### Step 3: Invoice is linked

The invoice can be linked to:

- a customer
- optionally a shipment

### Step 4: Documents are produced

The module supports:

- invoice download
- label download or print flow
- detail viewing

### Step 5: Customer sharing actions are prepared

Where contact data exists, the user can compose WhatsApp or email share actions.

### Step 6: Finance tracks payment state

The invoice can move through issued, paid, cancelled, or overdue states.

## 13.10 Internal Search and Navigation Flow

The app includes a shared search and result model so staff can find:

- shipments
- manifests
- other entities

Shipment-oriented navigation is intentionally routed toward internal shipment workflows rather than forcing staff into the public tracking or finance experience.

## 13.11 Staff Management Flow

### Step 1: Manager or admin opens `/management`

The user sees staff records in a management table.

### Step 2: Access is edited

The manager can update:

- name
- email
- role
- hub assignment

### Step 3: Status can be toggled

Staff can be activated or deactivated.

### Step 4: Super admin can create a new user

The system invokes the `create-user` edge function so the auth account and staff-level access can be provisioned together.

---

## 14. Realistic Full Company Workflow

This is the broadest end-to-end flow the system is built to support.

### Phase 1: Lead and demand capture

- Customer books through the public experience
- Staff receives booking intake
- Customer is created or matched

### Phase 2: Shipment creation

- Shipment is created
- CN number is generated
- Shipment becomes visible internally and trackable through its lifecycle

### Phase 3: Origin handling

- Shipment is received at origin through warehouse scanning
- Operational team confirms readiness for onward transport

### Phase 4: Manifesting

- Eligible shipments are grouped into a manifest
- Route and transport metadata are assigned
- Loading is verified through scan-based addition

### Phase 5: Linehaul movement

- Manifest is closed
- Manifest departs
- Shipment statuses reflect transit progression

### Phase 6: Destination handling

- Destination team verifies manifest arrival
- Missing or wrong shipments raise exceptions
- Correct shipments are received at destination

### Phase 7: Last-mile or completion

- Delivery-stage scanning progresses the shipment
- Final delivery is recorded

### Phase 8: Commercial closure

- Invoice is issued
- Documents are downloaded or shared
- Payment state is managed

### Phase 9: Oversight and governance

- Managers monitor dashboards and analytics
- Admins manage staff and access
- Exceptions and operational records maintain accountability

---

## 15. Architectural Strengths

- **Strong operational workflow modeling**  
  Shipments, manifests, scanning, and exceptions are modeled as real workflows rather than flat CRUD.

- **Good separation of concerns**  
  Pages, hooks, services, stores, and contexts each have clear responsibilities.

- **Role-aware product behavior**  
  Access is enforced at routing, utility, and data-scope levels.

- **Multi-tenant discipline**  
  Organization-scoped querying is embedded into major data hooks.

- **Warehouse-ready scanning**  
  Hardware scanner support and offline queueing address real physical-operation constraints.

- **Public and private boundary**  
  Public tracking is intentionally separated from staff-only operational detail.

---

## 16. Product Boundaries and Current Reality

To document the project honestly, a few boundaries are important:

- The public account tab is not a full customer portal; it primarily routes to staff login or contact sales.
- Customer records currently reflect persisted fields like name, type, GSTIN, address, and credit limit; unsupported fake customer attributes should not be assumed.
- Finance is a billing and shipment-document workflow, not a dispatch-control module.
- Internal shipment scans should resolve to shipment workflows first, not be treated as finance-only lookups.
- The live implementation is strongly centered on the current TAC operating corridor and internal team roles.

---

## 17. Conclusion

TAC Cargo Enterprise Portal is a full operational platform for a logistics company that needs one system to connect:

- customer intake
- shipment creation
- warehouse execution
- manifest transport control
- tracking visibility
- exception management
- finance documentation
- role-based staff administration

Its strongest design qualities are the scan-first operational model, controlled lifecycle transitions, shared enterprise UI shell, and organization-aware access model.

For a logistics business, the practical outcome is simple: fewer disconnected processes, faster warehouse execution, better shipment visibility, tighter billing alignment, and more reliable coordination between public demand intake and internal cargo operations.
