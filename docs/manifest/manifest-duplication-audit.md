# Manifest Duplication Audit

## Summary
Multiple manifest creation entry points exist, causing duplicated business rules and inconsistent UI. The enterprise scan-first workflow should be the single path.

## Duplicate Components
### Legacy (Selection-based)
- **CreateManifestModal** (`components/manifests/CreateManifestModal.tsx`)
  - Uses `ManifestConfigPanel`, `ManifestShipmentPanel`, `ManifestActionFooter`
  - Calls `createManifest` in `lib/supabase/manifest.ts` with selection table
- **CreateManifestPage** (`app/(protected)/manifests/create/page.tsx`)
  - Opens `CreateManifestModal` and redirects to `/manifests`

### Enterprise (Scan-first)
- **EnterpriseManifestBuilder** (`components/manifests/EnterpriseManifestBuilder.tsx`)
  - Uses `ManifestHeaderForm`, `ManifestScanPanel`, `ManifestShipmentTable`
  - Uses `useManifestBuilder` with scan idempotency and audit logging

## Entry Points
- **Manifests page** (`pages/Manifests.tsx`)
  - Buttons: `Build Manifest` (enterprise) + `Quick Create` (legacy)
- **Create Manifest route** (`app/(protected)/manifests/create/page.tsx`)
  - Legacy modal entry

## Decision
- **Keep** enterprise scan-first workflow as the single creation path.
- **Remove** legacy entry points from UI (Quick Create + CreateManifestPage legacy modal).
- **Retain** legacy components temporarily but make them unreachable from UI.

## Follow-up Tasks
- Replace `CreateManifestPage` to use enterprise builder only.
- Remove `Quick Create` CTA from Manifests page.
- Consolidate builder components into `components/manifests/ManifestBuilder/*`.
