# Implementation summary: final UI/UX tweaks (8 Oct 2026)

| # | Request | What changed | Where |
|---|---------|--------------|-------|
| 1 | "Free until 1 Nov" → "Get the app" | Signed-in members who haven't installed the PWA (and whose browser can install it) see a gradient "Get the app" button (mobile chip + desktop pill) that opens the existing branded install dialog. The promo chip/bar is hidden for them; everyone else is unchanged. | `hooks/use-get-app-cta.ts`, `components/PromoAnnouncementBar.tsx`, `components/Header.tsx` |
| 2 | Rotate 3 featured comparisons | A random 3 published Shelf Showdowns on every homepage load. First paint stays stable (no CLS/prerender change), then swaps once. | `lib/homepageSelection.ts`, `components/Editorials.tsx` |
| 3 | Latest 3 reviews + category images | New lazy "Latest product reviews" section above Comparisons (newest 3 by publish date, topped up from the catalogue). Review cards (grid + new section) use one Unsplash photo per category instead of per-product images. | `components/LatestReviews.tsx`, `lib/latestReviews.ts`, `data/productImages.ts`, `components/ReviewsGrid.tsx`, `pages/Index.tsx` |
| 4 | Animated border on Glow Insider card | `gradient-border-anim` on the Insider plan card (respects reduced motion). | `pages/Pricing.tsx` |
| 5 | Marketplace badge | "NEW" → "Coming Soon". | `components/Header.tsx` |
| 6 | Usernames | All members have a username (10 blank profiles backfilled). Server-side validation trigger; `check_usernames()` RPC; Settings → Profile `UsernameCard` with live validation, duplicate detection and suggestions; sign-in by email **or** username via the `username-login` edge function. | migration `20261008100000_member_usernames.sql`, `supabase/functions/username-login`, `components/dashboard/UsernameCard.tsx`, `lib/username.ts`, `hooks/use-auth.ts`, `components/AuthDialog.tsx` |

## Applied live (project gnkpzijxuciiaamakgzm)
- Migration `member_usernames` applied. Verified: 0 blank usernames, 0 case-insensitive duplicates, validation trigger present; `check_usernames` returned reserved / invalid / available / yours correctly when called as an authenticated member (rolled-back transaction).
- Edge function `username-login` v1 deployed (verify_jwt off, by design: it is the sign-in endpoint). Unknown user, wrong password and malformed input all return the same 400 "Invalid login credentials".

## Verification
- `bun test`: all pass (new: homepage selection, username rules). `tsc -p tsconfig.app.json`: clean. ESLint: no new findings (one pre-existing `prefer-const` in `previewAuthStorage.ts`).
- Playwright `e2e/final-tweaks.e2e.ts` (desktop + mobile): ordering and count of reviews/comparisons, rotation, Insider border, Marketplace badge, Get the app, live username validation.

## Known limits / follow-ups
- A successful username sign-in was **not** exercised live (no test credentials; a real account was deliberately not used). Failure paths were.
- Username sign-ins reach GoTrue from the edge function's IP, so GoTrue's per-IP sign-in rate limit is shared by username logins. Watch for 429s; email sign-in is unaffected.
- No free-licence Unsplash photo found for Accessories (gua sha result is Unsplash+): it uses the generic flat-lay until one is chosen.
- Re-pin `username-login` to a commit on `main` after merge.
