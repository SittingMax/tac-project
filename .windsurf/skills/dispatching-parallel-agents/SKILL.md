---
name: dispatching-parallel-agents
description: Runs independent tasks concurrently to accelerate delivery without conflicts.
---

# Identify independent tracks
- Disjoint files/modules or service boundaries
- No shared migrations or global types, or sequence them explicitly

# Coordination
- Define clear contracts and types first
- Agree on query keys and store shapes
- Frequent checkpoints; integrate early

# Verification
- Each track passes typecheck/lint/tests
- Final integration pass, then e2e

# Exit criteria
- Parallel work integrated without regressions.
