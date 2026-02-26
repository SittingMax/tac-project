# TAC Cargo Documentation Index

> Unified documentation for the TAC Cargo Enterprise Portal

## Quick Links

| Document | Description |
|----------|-------------|
| [README](./README.md) | Main documentation - overview, features, tech stack |
| [Setup Guide](./SETUP_GUIDE.md) | Development environment setup |
| [Development Guide](./DEVELOPMENT_GUIDE.md) | Coding standards, patterns, workflows |
| [API Reference](./API_REFERENCE.md) | Supabase API endpoints and schemas |

## Architecture & Design

| Document | Description |
|----------|-------------|
| [Enterprise PRD](./ENTERPRISE_PLATFORM_PRD.md) | Product Requirements Document |
| [Design Tokens](./design-tokens.md) | Color palette, typography, spacing |
| [Status Workflows](./status-workflows.md) | Shipment/manifest status transitions |
| [User Flows](./user-flows.md) | Core user journey diagrams |

## Database

| Document | Description |
|----------|-------------|
| [Schema](./schema.sql) | Complete database schema |
| [RLS Policies](./supabase-rls-policies.sql) | Row Level Security policies |
| [Audit Triggers](./supabase-audit-trigger.sql) | Audit logging setup |

## Operations & Security

| Document | Description |
|----------|-------------|
| [Production Readiness](./production-readiness.md) | Deployment checklist |
| [Sentry Implementation](./SENTRY_IMPLEMENTATION.md) | Error tracking setup |
| [Dependency Security](./DEPENDENCY_SECURITY_POLICY.md) | Security policy for dependencies |

## Windsurf Context

Additional context for AI-assisted development is in `.windsurf/`:
- `context/` - Domain knowledge, DB conventions, UI standards
- `skills/` - Module-specific skills (invoices, manifests, scanning, etc.)
- `workflows/` - Automated workflows (release, QA, bug triage)
- `rules/` - Critical rules for invoices, scanning, manifests

## Test Suite

Tests are in the `tests/` folder:
- `tests/e2e/` - Playwright end-to-end tests
- `tests/unit/` - Vitest unit tests

Run tests:
```bash
npm run test        # E2E tests
npm run test:unit   # Unit tests
```
