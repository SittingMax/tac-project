# TAC Cargo - Enterprise User Flow Specification (v1.0)

## Purpose
This document defines what each page is allowed to do, show, and mutate.
If something is not explicitly allowed here, it must not exist in the UI.

This prevents:
- Feature creep
- UI-driven logic
- Fake or derived data
- Inconsistent behavior between pages

## Global Principles (Non-Negotiable)
- Shipments are the system of record.
- Manifests move shipments, they do not define them.
- Scanning reflects reality, it never creates it.
- Invoices close completed work, they do not infer it.
- Dashboard shows state, Analytics explains history.
- No page both explains and mutates the same data.

---

## 1. Overview - Dashboard
**Purpose**: Situational awareness. Answer: "What is happening right now?"

**Allowed**
- Read-only KPIs
- Quick navigation actions
- Current-state summaries

**Forbidden**
- Historical analysis
- Data mutation
- Fake trends or growth indicators
- Auto-calculated deltas without explicit SQL backing

**Required Links**
- Total Shipments -> Shipments
- In Transit -> Manifests / Tracking
- Exceptions -> Exceptions

If a metric cannot drill down, remove it.

---

## 2. Overview - Analytics
**Purpose**: Performance analysis over time. Answer: "How did we perform?"

**Required**
- Explicit date range selection
- Empty state until range is selected
- Charts backed by verifiable queries

**Forbidden**
- Operational actions
- Auto-loaded charts
- Duplicate Dashboard KPIs

**Data Sources**
- Shipments (counts, status)
- Manifests (throughput)
- Invoices (revenue)

If a chart cannot be explained with SQL, delete it.

---

## 3. Operations - Shipments (CORE)
**Purpose**: System of record. Answer: "What exists?"

**Allowed Actions**
- Create shipment
- View shipment details
- Validated status transitions
- Print shipping label
- Generate invoice (only if eligible)

**Forbidden**
- Routing logic
- Batch assignment
- Manifest manipulation
- Derived or inferred status

**Status Rules**
Shipments may only exist in canonical states:
```
created -> picked_up -> in_transit -> out_for_delivery -> delivered
  -> exception
  -> cancelled
```

No UI-only states.

---

## 4. Operations - Tracking
**Purpose**: Latest known truth. Answer: "Where is this shipment now?"

**Rules**
- Read-only
- No actions
- No edits
- No derived projections

Tracking must exactly match shipment + manifest + scan events.

---

## 5. Operations - Manifests
**Purpose**: Batching and movement. Answer: "How shipments are moved between hubs."

**Allowed**
- Create manifest
- Assign eligible shipments
- Scan shipments into manifest
- Change manifest lifecycle: `building -> in_transit -> closed`

**Eligibility Rules**
A shipment may be added only if:
- Status 
 { picked_up, in_transit }
- Not already assigned to an open manifest

**Forbidden**
- Creating shipments
- Editing shipment metadata
- Editing closed manifests

---

## 6. Operations - Scanning
**Purpose**: Execution layer. Answer: "Confirm what physically happened."

**Rules**
- Idempotent (duplicate scans do nothing)
- Server is always the source of truth
- UI must tolerate rapid input

**Forbidden**
- Creating shipments
- Guessing state
- Client-side reconciliation

If scanning is unreliable, the system is unreliable.

---

## 7. Operations - Inventory
**Purpose**: Physical location tracking. Answer: "Where is it right now?"

**Requirements**
- Must reconcile with: Manifests, Scans, Tracking
- If reconciliation is not guaranteed, page must be disabled until complete

---

## 8. Operations - Exceptions
**Purpose**: Operational attention management.

**Required**
- Explicit severity
- Clear ownership
- Actionable resolution steps

**Forbidden**
- Generic warnings
- Silent auto-resolution
- Non-traceable alerts

---

## 9. Business - Invoices
**Purpose**: Financial closure.

**Rules**
- Invoices must originate from shipment(s)
- Totals must match stored record
- PDF download must match issued invoice exactly
- No recalculation on client

**Forbidden**
- Editing issued invoices
- Client-side math overrides
- Detached invoices

---

## 10. Business - Customers
**Purpose**: Relationship management.

**Allowed**
- View shipment history
- View invoices
- Edit contact details

**Forbidden**
- Operational shortcuts
- Creating shipments from analytics context

---

## 11. Business - Management
**Purpose**: Control & governance.

**Allowed**
- RBAC
- Roles
- Permissions

**Forbidden**
- Business data edits
- Operational overrides

---

## 12. System - Settings
**Purpose**: System behavior configuration.

**Rules**
- No metrics
- No business data
- No shortcuts

---

## Golden Path (Release Gate)
This flow must always work before release:
```
Create Shipment
-> Print Label
-> Create Manifest
-> Scan Shipment
-> Set In Transit
-> Deliver
-> Generate Invoice
-> Download Invoice PDF
```

If any step fails, block release.
