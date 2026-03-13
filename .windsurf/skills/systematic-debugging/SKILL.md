---
name: systematic-debugging
description: 4-phase root-cause process with defense-in-depth and condition-based-waiting techniques.
---

# Phases
1. Reproduce: Smallest failing case; capture inputs/state.
2. Trace: Add targeted logs and assertions; binary search the path; inspect network/db.
3. Fix: Minimal, type-safe change; no incidental behavior changes.
4. Prevent: Unit regression test; add runtime guards if needed; document edge cases.

# TAC considerations
- Prefer domain errors (ValidationError, NotFoundError, etc.).
- Map Supabase errors via mapSupabaseError; avoid leaking raw messages.
- React 19 hooks invariants; Zustand selector stability; query invalidation.

# Verification
- npm run typecheck && npm run lint
- npm run test:unit and targeted e2e if user flow impacted.

# Exit criteria
- Root cause identified; fix verified; regression protected by tests.
