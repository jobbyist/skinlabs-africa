# SKINLABS — Implementation Plan (Multi-Session)

This document tracks the rollout of the AI Formulator, Auth hardening, Dashboard,
Express Checkout, Custom Formulas, and new B2B/Bundled-Kits pages across 3 sessions.

---

## ✅ SESSION 1 (this session) — Phases 1, 2 and 4

### Phase 1 — AI Formulator (Gemini-powered, PDF output) ✅
- `supabase/functions/skincare-ai/dermatologist-knowledge.ts` — condensed
  dermatology reference (Fitzpatrick, actives, conditions, SA context) extracted
  from the uploaded dermatologist PDF and embedded as system-prompt grounding.
- `supabase/functions/skincare-ai/index.ts` — switched to
  `google/gemini-3-flash-preview` (free via Lovable AI Gateway), now accepts the
  base64 selfie as multimodal `image_url` input, returns a strict 7-section
  markdown report, and persists each report to `skincare_recommendations`.
- `src/lib/generateSkincarePdf.ts` — branded jsPDF generator (cover banner,
  client card, section headers, bullets, numbered steps, disclaimer/footer).
- `src/components/AIFormulator.tsx` — sends the real base64 image (only when
  POPIA photo consent is checked), auto-downloads the PDF on success, and
  exposes manual "Download PDF" buttons on both the results and confirmation
  screens.
- `src/pages/AIFormulator.tsx` — replaced the static landing with the fully
  functional `<AIFormulator />` component, plus SEO/OG/JSON-LD.
- `src/components/Hero.tsx` and `src/pages/Products.tsx` — "Try AI Formulator"
  CTAs now route to `/ai-formulator`.

### Phase 2 — Authentication hardening ✅
- `src/hooks/use-auth.ts` — added passwordless `signInWithMagicLink`
  (Supabase OTP) and MFA helpers (`enrollMFA`, `challengeAndVerifyMFA`,
  `listMFAFactors`, `unenrollMFA`).
- `src/components/AuthDialog.tsx` — three-tab UX: **Magic link** (default),
  **Sign in**, **Sign up**; Google OAuth remains prominent at the top; min
  password length raised to 8 with leaked-password guidance.
- `src/components/MFASettingsCard.tsx` — new dashboard card that prompts users
  to enrol TOTP MFA (QR + manual secret + 6-digit verify), lists active factors
  and supports removal.
- `src/pages/UserDashboard.tsx` — surfaces `MFASettingsCard` at the top of the
  dashboard so subscribers are prompted to add MFA on every visit until enabled.

### Phase 4 — Homepage Express Checkout & content cleanup ✅
- `src/pages/Index.tsx` — `<EdibleSkincare />` section removed from the
  homepage (import & render commented out, easy to re-enable).
- The existing `<FeaturedCheckout />` (rendered inside `<Products />`) is the
  homepage Express Checkout. It pulls live Shopify product data (the Premium
  Skincare Collection: Body Oil Serum, Body Bar Bundle, Foaming Body Scrub,
  Facial Moisturizer) with variants/quantities and posts to the Shopify cart
  on checkout. No further code change required for Phase 4.

---

## 🔜 SESSION 2 — Phases 3 and 5

### Phase 3 — User Dashboard Enhancement
- Extend `profiles` schema with `phone`, `date_of_birth`, `gender`,
  `race_ethnicity`, `skin_color` (Fitzpatrick), `allergies` (text[]),
  `skin_conditions` (text[]), `preferred_routine_time` (am/pm/both).
  Add Supabase migration + RLS (owner-only read/write).
- New "Profile" tab on `/dashboard` with editable form (react-hook-form + zod).
- "Skin Journey" tab: timeline of past AI reports (re-download PDF, compare
  two reports side-by-side, record a weekly skin check-in with mood/notes/photo).
- "Routine" tab: pin the latest AI routine as the active AM/PM checklist with
  daily completion tracking (new `routine_checkins` table).
- "Saved products" tab: bookmark Shopify products from the AI report.
- Subscription management: cancel/resume PayFast subscription via edge function.

### Phase 5 — Custom Formulas Page Overhaul
- Rename product types: "Bespoke Serums" → "Serums", "Custom Moisturizers" →
  "Moisturizers", "Custom Cleanser" → "Cleansers"; add new "Scrubs".
- Rewrite copy to position SkinLabs as a custom-formulation lab.
- Build `<CustomFormulaRequestModal />` — a 4-step wizard
  (skin goals → key ingredients/allergens → texture/scent preferences →
  contact + delivery) that writes to a new `custom_formula_requests` table and
  emails the back office.
- Wire all "Customize" buttons (Moisturizer, Serum, Cleanser, Scrub) to open
  the modal preloaded with the chosen product type.
- "Start Skin Analysis" CTA → `/ai-formulator`.

---

## 🔜 SESSION 3 — Phase 6 + cross-phase testing & troubleshooting

### Phase 6 — New pages & routing
- `/business` — turnkey B2B service page ("SkinLabs® for Business") covering
  medical/cosmetic formulation, packaging design, manufacturing, R&D and
  dermatologist-backed clinical trials, sourcing, e-commerce distribution,
  fulfilment/inventory, digital marketing/social. Lead-capture form writing to
  a new `business_enquiries` table.
- Rename `/gift-sets` → `/bundled-kits` (301 redirect). Re-copy the page to
  position the kits as curated multi-product solutions, not gifts. Rename
  navigation entries and update sitemap/OG metadata.

### Cross-phase testing & troubleshooting
- AI Formulator: end-to-end quiz → photo → email → Gemini → PDF; verify image
  is analysed and Fitzpatrick reasoning appears in section 1.
- Auth: magic-link delivery & redirect; Google OAuth; MFA enrol/verify/remove;
  password length enforcement; recovery flow.
- Dashboard: profile edit persistence, RLS isolation between accounts,
  PDF re-download from history, routine check-in tracking.
- Express Checkout: cart persistence, variant/quantity changes, Shopify
  redirect with correct items/quantities, mobile layout at 360/375/390 px.
- Custom formula modal: validation, submission, admin email.
- `/business` and `/bundled-kits`: SEO tags, redirect from `/gift-sets`,
  lead capture.
- Regression sweep: PWA install prompt, currency selector, scroll-to-top,
  cookie banner, header auth state, OpenHaus SSO.
