# TAC Cargo - Status Workflows (v1.0)

## Purpose
Defines canonical status transitions for operational consistency.
If a transition is not listed, it must not be allowed in the UI.

---

## 1) Shipments

### Canonical Statuses
- CREATED
- PICKUP_SCHEDULED
- PICKED_UP
- RECEIVED_AT_ORIGIN
- IN_TRANSIT
- RECEIVED_AT_DEST
- OUT_FOR_DELIVERY
- DELIVERED
- CANCELLED
- RTO
- EXCEPTION

### Allowed Transitions (High Level)
```
CREATED -> PICKUP_SCHEDULED -> PICKED_UP -> RECEIVED_AT_ORIGIN -> IN_TRANSIT -> RECEIVED_AT_DEST -> OUT_FOR_DELIVERY -> DELIVERED
CREATED -> CANCELLED
* -> EXCEPTION
IN_TRANSIT -> RTO
```

Rules:
- No UI-only statuses
- Exception always records an immutable event
- Cancelled shipments must not re-enter flow

---

## 2) Manifests

### Canonical Statuses
- DRAFT
- BUILDING
- OPEN
- CLOSED
- DEPARTED
- ARRIVED

### Allowed Transitions
```
DRAFT -> BUILDING -> OPEN -> CLOSED -> DEPARTED -> ARRIVED
```

Rules:
- Closed manifests are immutable
- Departed manifests cannot return to BUILDING

---

## 3) Invoices

### Canonical Statuses
- DRAFT
- ISSUED
- PAID
- CANCELLED
- OVERDUE

### Allowed Transitions
```
DRAFT -> ISSUED -> PAID
DRAFT -> CANCELLED
ISSUED -> OVERDUE
OVERDUE -> PAID
```

Rules:
- Issued invoices are immutable
- No client-side recalculation of totals

---

## 4) Exceptions

### Canonical Statuses
- OPEN
- INVESTIGATING
- RESOLVED

### Allowed Transitions
```
OPEN -> INVESTIGATING -> RESOLVED
```

Rules:
- Every exception must be owned
- Resolution requires audit trail
