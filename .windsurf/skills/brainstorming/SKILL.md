---
name: brainstorming
description: Activates before writing code. Refines ideas, explores alternatives, and produces a TAC Cargo Portal–aligned design doc for approval.
---

# Goals
- Clarify the problem, constraints, and success criteria before any code is written.
- Propose alternative approaches and select one with clear tradeoffs.

# Inputs to collect
- Problem statement and business goal
- Affected surfaces (components/pages/hooks/APIs)
- Data entities and schema touch points (Supabase tables, RLS, query keys)
- Performance, accessibility, and security constraints
- Feature flags to gate rollout; rollback/mitigation plan
- Acceptance criteria and test strategy

# Deliverables (Design Doc)
- Overview, Scope, and Non‑goals
- User flows and UI outline (components, shadcn/ui primitives, routes)
- Data flow and Types (strict TS types, Zod schemas where needed)
- State management and Query keys (Zustand stores; lib/queryKeys)
- Routing and lazy loading (react-router v6, React.lazy)
- Error handling and toasts (lib/errors, mapSupabaseError, show*Toast)
- Authorization and RLS considerations (Supabase policies)
- Testing plan (Vitest: unit; Playwright: e2e)
- Risks, alternatives, phased rollout, and rollback

# TAC‑specific guardrails
- TypeScript strict; use '@/'' path aliases; avoid 'as unknown as'
- UI: shadcn/ui, Tailwind CSS v4 semantic tokens only (no gray/slate classes)
- Barcodes: use UniversalBarcode wrapper; never import JsBarcode directly
- Query: TanStack Query v5 with stable keys in lib/queryKeys.ts
- Stores: Zustand with persist in store/; names use[Domain]Store
- Errors: throw domain errors from lib/errors.ts and map Supabase errors

# Exit criteria
- Present the design in short sections and obtain explicit approval before moving to planning.
