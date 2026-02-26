# TAC Cargo - Production Readiness & Sign-off

## 1) Purpose
This document certifies that the TAC Cargo dashboard is:
- Functionally correct
- Operationally reliable
- Visually enterprise-grade
- Free of mock or fabricated data
- Safe to operate in production

If any item below is "NO", the system must not be deployed.

---

## 2) Functional Readiness (Hard Gate)

### 2.1 Core Golden Path (MANDATORY)
```
Create Shipment
-> Print Label
-> Create Manifest
-> Scan Shipment
-> Manifest In Transit
-> Mark Delivered
-> Generate Invoice
-> Download Invoice PDF
```

Verification:
- Manual verification complete
- Playwright `golden-path.spec.ts` passes
- No mocks, fallbacks, or fabricated values used

If this fails, block release.

### 2.2 Shipments (System of Record)
- No mock data anywhere
- Explicit EmptyState when DB is empty
- ErrorState on backend failure
- AWB generated via RPC only
- No derived or inferred statuses
- Status transitions validated

### 2.3 Manifests
- Only eligible shipments can be added
- Duplicate scans are idempotent
- Closed manifests are immutable
- UI disables invalid actions

### 2.4 Scanning
- Handles rapid duplicate input
- Server is single source of truth
- Clear success/error feedback
- No client-side reconciliation

### 2.5 Invoices & Finance
- Invoices originate from real shipments
- No editable totals post-generation
- PDF download matches stored invoice
- No client-side recalculation

---

## 3) Data Integrity & Safety
- No Math.random() or fake KPIs
- No hardcoded fallbacks (e.g. || 1, || [])
- All metrics traceable to DB queries
- RLS enforced and verified
- Backend failures surface explicitly

---

## 4) UI / UX Enterprise Standards

### 4.1 Design System
- Semantic color tokens only
- No hex/rgb/Tailwind default colors
- Status colors strictly semantic
- Dark/light mode verified

### 4.2 Typography
- Inter used for UI
- JetBrains Mono used for AWB / IDs
- No oversized headings
- Tables readable at 100% zoom

### 4.3 Density & Clarity
- Dashboard free of duplicate data
- Analytics gated by date range
- Tables use reduced, scannable columns
- No decorative gradients or heavy shadows

---

## 5) Testing & Verification

### Automated
- npm run typecheck
- npm run lint
- npm run test:unit
- npm run test (Golden Path required)

### Manual
- Shipments empty / error / success states
- Manifest lifecycle
- Scanning resilience
- Invoice PDF integrity

---

## 6) Performance & Stability
- Dashboard renders < 2s locally
- No console errors in normal flow
- No memory leaks during navigation
- Multi-tab usage does not corrupt state

---

## 7) Security & Governance
- RBAC enforced
- No admin shortcuts in operational pages
- Settings isolated from business data
- Sensitive data cleared on logout

---

## 8) Deployment Readiness
- Environment variables documented
- Supabase RPCs verified in prod
- Rollback plan documented
- Monitoring enabled (logs/errors)

---

## 9) Risk Acknowledgement

### Known Risks (Accepted)
- Shipment creation fails if AWB RPC unavailable (correct behavior)

### Explicitly Rejected Risks
- Fabricated data
- Silent fallbacks
- UI-derived truth

---

## 10) Stakeholder Sign-off

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Product Owner |  |  |  |
| Engineering Lead |  |  |  |
| Operations Lead |  |  |  |
| QA / Compliance |  |  |  |

---

## 11) Definition of Production Ready
The system is production ready when:
- All checklist items are YES
- Golden Path passes
- No mock data exists
- Visual system is consistent
- Stakeholders have signed off
