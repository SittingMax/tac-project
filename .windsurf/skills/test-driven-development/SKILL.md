---
name: test-driven-development
description: Enforces true RED-GREEN-REFACTOR using Vitest and Playwright for the TAC portal.
---

# Unit TDD loop (Vitest)
1. RED: Add failing test under tests/unit mirroring the source path.
   - Run: npm run test:unit:watch and observe failure.
2. GREEN: Implement the minimal code in '@/'.
   - Run: npm run test:unit and observe pass.
3. REFACTOR: Improve names, extract helpers, strengthen types; keep tests green.

# E2E when flows change (Playwright)
- Add/adjust spec under tests/e2e/ for critical paths.
- Run: npx playwright test (or npm run test) and verify pass.

# TAC guardrails
- Mock Supabase via vi.mock('@/lib/supabase') in unit tests.
- Use Zod + RHF for forms; test schema errors and success paths.
- Keep queries behind lib/queryKeys; test cache keys deterministically.

# Exit criteria
- Code only added after failing test exists; both unit and e2e (if applicable) pass.
