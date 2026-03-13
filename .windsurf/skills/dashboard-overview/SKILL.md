---
name: dashboard-overview
description: Curate the Dashboard Overview with triage links for Operations, Business, and System, aligned with TAC conventions.
---

# Objectives
- Provide a fast triage surface for Ops/Finance/System with role-aware visibility.
- Show live problem counts (bookings, manifests, exceptions) and deep links.
- Keep performance high via lightweight queries and suspense boundaries.

# Implementation Checklist
- Component: `@/components/dashboard/DomainOverview` renders groups and items.
- Data: Use `useSidebarBadges()` for counts and role scoping via `useStore().user.role`.
- Imports: Always via `@/*` aliases; no relative paths escaping dir.
- Styling: Tailwind v4 semantic tokens only; avoid gray/slate classes.
- Access: Mirror `ProtectedRoute` role logic for parity.
- Error UX: Wrap with `ErrorBoundary` + `InlineError` in `pages/Dashboard.tsx`.

# Verification
- npm run typecheck
- npm run lint && npm run format:check
- npm run test:unit (add/adjust tests if needed)
- Navigate to /dashboard and validate badges and links per role.

# Notes
- Extend counts easily by adding keys to `useSidebarBadges` and wiring badgeKey in items.
- Avoid heavy queries on mount; keep overview snappy.
