# AGENTS.md — TAC Cargo Enterprise Portal

## Project Overview

React 19 + TypeScript 5.9 logistics portal (Vite 6, Tailwind CSS v4, Supabase backend).
Manages shipments, manifests, invoices, scanning/barcodes, exceptions, and finance.

## Build & Run Commands

```bash
npm run dev              # Start Vite dev server
npm run build            # Production build (vite build)
npm run typecheck        # tsc --noEmit (strict mode, no unused locals/params)
npm run lint             # ESLint (flat config, ESLint 9)
npm run lint:fix         # ESLint with auto-fix
npm run format:check     # Prettier check
npm run format           # Prettier write
```

## Testing

### Unit Tests (Vitest, jsdom)

```bash
npm run test:unit                    # Run all unit tests
npm run test:unit -- tests/unit/lib/utils.test.ts   # Run a single test file
npm run test:unit:watch              # Watch mode
npm run test:unit:coverage           # With coverage
```

Unit tests live in `tests/unit/` mirroring the source structure. Environment variables
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are injected automatically via `cross-env`.

Test pattern: `describe` > `describe` > `it`, import from `vitest`, use `@/` path aliases.
Mock Supabase with `vi.mock('@/lib/supabase')` and use `vi.fn()` for browser APIs.

### E2E Tests (Playwright)

```bash
npm run test                         # Run all Playwright tests
npx playwright test tests/e2e/shipment-workflow.spec.ts  # Single E2E test
npm run test:headed                  # Headed mode
npm run test:debug                   # Debug mode
```

## Code Style

### Formatting (Prettier)

- Semicolons: **yes**
- Quotes: **single** (JSX: double)
- Tab width: **2 spaces**
- Trailing commas: **es5**
- Print width: **100**
- Arrow parens: **always**
- End of line: **lf**

### Linting (ESLint 9 Flat Config)

- `no-console`: warn (only `console.warn` and `console.error` allowed in app code)
- `@typescript-eslint/no-explicit-any`: **warn** in components, **error** in `lib/` and `store/`
- `@typescript-eslint/no-unused-vars`: warn (prefix unused args with `_`)
- `react-hooks/rules-of-hooks`: error
- `react-hooks/exhaustive-deps`: warn
- Avoid `as unknown as` casts in `lib/` and `store/` — use proper type narrowing

### TypeScript (tsconfig.json)

- Target: ES2022, strict mode enabled
- `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`: all **true**
- Path alias: `@/*` maps to project root (`./`)
- JSX: `react-jsx` (no React import needed)

## Imports

Always use the `@/` path alias. Never use relative paths that escape the current directory.

```typescript
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useShipments } from '@/hooks/useShipments';
import { Button } from '@/components/ui/button';
import type { Shipment } from '@/types';
```

Order: external packages first, then `@/lib`, `@/store`, `@/hooks`, `@/components`, `@/types`.

## Naming Conventions

| Category        | Convention        | Example                                    |
|-----------------|-------------------|--------------------------------------------|
| Components      | PascalCase file   | `Dashboard.tsx`, `ShipmentCard.tsx`         |
| Pages           | PascalCase file   | `Shipments.tsx`, `ManifestDetail.tsx`       |
| Hooks           | camelCase, `use`  | `useShipments.ts`, `useAuthStore.ts`        |
| Lib/utils       | camelCase file    | `scanParser.ts`, `query-client.ts`          |
| Stores          | `use[X]Store`     | `useAuthStore`, `useNoteStore`              |
| Types           | PascalCase        | `Shipment`, `ManifestStatus`                |
| Union enums     | String literals   | `type ShipmentStatus = 'CREATED' \| ...`    |
| Constants       | UPPER_SNAKE_CASE  | `VALID_STATUS_TRANSITIONS`, `COMPANY_INFO`  |
| DB columns      | snake_case        | `created_at`, `cn_no`                       |
| Component props | camelCase         | `onSubmit`, `isLoading`                     |

## Architecture Patterns

### State Management — Zustand 5

Stores use `create<StateType>()(persist(...))` with the `persist` middleware.
Keep stores in `store/` directory. Name exports as `use[Domain]Store`.

### Data Fetching — TanStack Query v5

Custom hooks in `hooks/` wrap `useQuery`/`useMutation`. Query key factories live
in `lib/queryKeys.ts` (e.g., `queryKeys.shipments.detail(id)`).

### Routing — react-router-dom v6

Pages are lazy-loaded via `React.lazy()` in `routes/index.tsx`.

### Forms — react-hook-form + Zod

Schemas defined with Zod, resolved via `@hookform/resolvers/zod`.

### Feature Flags

Use `isModuleEnabled()` / `isFeatureEnabled()` from `config/features.ts`.

## Error Handling

Use the error class hierarchy from `lib/errors.ts`:

```typescript
// Throw domain errors
throw new ValidationError('CN format is invalid', { awb: inputValue });
throw new NotFoundError('Shipment', cnNumber);

// In mutations — maps Supabase errors and shows toast
try {
  await createShipment(data);
  showSuccessToast('Shipment created successfully');
} catch (error) {
  handleMutationError(error, 'Create Shipment');
}
```

Classes: `AppError`, `ValidationError`, `AuthenticationError`, `AuthorizationError`,
`NotFoundError`, `ConflictError`, `NetworkError`. Use `mapSupabaseError()` to convert
Supabase/PostgreSQL errors. Use `showErrorToast()`/`showSuccessToast()` for user feedback.

## UI & Styling

- **Component library**: shadcn/ui (new-york style) + Radix UI primitives
- **Icons**: Lucide React (`lucide-react`)
- **Animations**: Motion (framer-motion successor), GSAP
- Use semantic CSS tokens from `globals.css` (e.g., `bg-background`, `text-foreground`)
- **NEVER** use hardcoded Tailwind color classes like `text-slate-*`, `bg-gray-*` — CI rejects them
- **Barcodes**: Always use the `UniversalBarcode` wrapper component, never import JsBarcode directly

## CI Enforced Guards

These checks run in GitHub Actions and will fail the build:

1. **No mock data** in production code (`npm run guard:no-mock-data`)
2. **No hardcoded slate/gray** Tailwind classes in `components/` or `pages/`
3. **No direct JsBarcode imports** — use `UniversalBarcode` wrapper
4. **No `dangerouslySetInnerHTML`** without DOMPurify sanitization
5. **No Supabase service role key** in client code
6. **Typecheck, lint, and format** must all pass

## Environment Variables

Defined in `.env.example`, validated with Zod in `lib/env.ts`.
Access via `import.meta.env.VITE_*`. Required:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key

## Key Directories

```
components/    UI components (shadcn/ui + custom)
config/        Feature flags, constants
context/       React contexts (scanning)
hooks/         Custom React hooks (data fetching, UI)
lib/           Core utilities, Supabase client, error handling, query keys
pages/         Route page components
store/         Zustand stores
types/         TypeScript type definitions
tests/unit/    Vitest unit tests
tests/e2e/     Playwright E2E tests
supabase/      Edge functions, migrations
```
