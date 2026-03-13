---
name: writing-plans
description: Breaks approved design into small, verifiable tasks with exact file paths, complete code, and checks.
---

# Plan structure per task (2–5 items total)
- Summary: outcome and acceptance criteria
- Files/paths: exact '@/…' imports, components/pages/hooks/types
- Test: unit test path under tests/unit mirroring source
- Steps: precise edits with complete code blocks
- Verification: commands to run and what to expect
- Risk/rollback: minimal revert steps

# TAC checks per task
- npm run typecheck
- npm run lint && npm run format:check
- npm run test:unit (targeted) and affected Playwright spec if UI flow changes

# Exit criteria
- Tasks are clear enough for a junior dev to execute without guessing.
