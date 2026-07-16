# SKINLABS — Implementation Plan (Multi-Session)

## ✅ SESSION 1 — Phases 1, 2, 4
AI Formulator with Gemini + PDF, magic-link + MFA auth, homepage cleanup.

## ✅ SESSION 2 — Phases 3 & 5

### Phase 3 — User Dashboard Enhancement ✅
- Migration extended `profiles` with `phone`, `date_of_birth`, `gender`,
  `race_ethnicity`, `skin_color` (Fitzpatrick), `allergies` (text[]),
  `skin_conditions` (text[]), `preferred_routine_time`, `notes`.
- New `skin_journey_entries` table (RLS: owner-only).
- `UserDashboard` rebuilt with tabs: Overview, Profile, Skin Journey, AI
  Reports, Security (MFA moved into its own tab).
- `ProfileTab` component: editable form for all new profile fields.
- `SkinJourneyTab` component: weekly check-ins (mood, 1–10 rating, notes)
  with timeline + delete.

### Phase 5 — Custom Formulas Overhaul ✅
- Product types renamed: Serums, Moisturizers, Cleansers; new **Scrubs**
  type added. Copy rewritten as a formulation lab.
- New `CustomFormulaRequestModal` — 4-step wizard (skin goals → key
  ingredients/allergens → texture/scent → contact + delivery) writing to the
  new `custom_formula_requests` table.
- All "Customize" buttons open the modal pre-loaded with the chosen product.
- "Start Skin Analysis" CTA routes to `/ai-formulator`.

## ✅ SESSION 3 — Phase 6 (partial) + Hero CTA

### Phase 6 — New pages & routing ✅
- `/business` — SkinLabs® for Business page with 7 service cards and a
  lead-capture form writing to `business_enquiries` (RLS: admin-only read).
- `/gift-sets` → `/bundled-kits` (301-style client redirect via
  `<Navigate replace />`). New `BundledKits` page positions kits as curated
  multi-product systems, not gifts.
- Footer nav updated: Gift Sets → Bundled Kits; new "For Business" link.
- Old `src/pages/GiftSets.tsx` removed.

### Hero CTA ✅
- "Explore Products" hero button now scrolls to the homepage Express
  Checkout section via `/#products`.

## 🔜 SESSION 3 (remaining) — Cross-phase QA & Shopify link
- Shopify: connect new store, add Premium Skincare Collection products,
  link to `FeaturedCheckout`. Blocked until Shopify auth is completed.
- Full regression sweep: AI Formulator end-to-end, auth (magic link +
  MFA), dashboard tabs (profile persistence, journey entries, RLS
  isolation), custom formula modal submissions, business enquiry
  submissions, /bundled-kits redirect, PWA install, currency selector,
  scroll-to-top, cookie banner, header auth state, OpenHaus SSO.
