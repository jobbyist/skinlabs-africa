# Academy change log — Phase "Discovery, architecture & plan" (2026-10-07)

Scope: audit + design only.

## Added
- docs/academy/ACADEMY_ARCHITECTURE.md
- docs/academy/ACADEMY_DATABASE_SPEC.md
- docs/academy/ACADEMY_ROUTES.md
- docs/academy/ACADEMY_ROLES_AND_PERMISSIONS.md
- docs/academy/ACADEMY_IMPLEMENTATION_PLAN.md

## Not changed
No application code, migrations, edge functions, storage buckets or live DB state.

## Inspected
App.tsx routes, entitlements, membership, payments (_shared/payments, PayFast flag), PWA/service-worker contract,
podcast audio (static files in public/, not storage), dashboard IA, admin tabs, SEO/SSR routing, email/notification
categories, brandPdf; live Supabase read-only (app_role enum, existing tables, buckets, constraints).

## Verification
Docs-only. typecheck/lint/test/build not run: node_modules is absent in the sandbox; baseline capture is Phase 0.

## Open items
See "Decisions register" (D1–D12) and Architecture §17.
