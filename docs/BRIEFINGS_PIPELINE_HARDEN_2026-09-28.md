# Briefings pipeline harden (2026-09-28)

## Code changes (briefings-sync)

- `DAILY_BRIEFINGS_CAP = 1` (was 3) — one published briefing per day at 06:00 SAST
- Strict QA before publish:
  - Hierarchical markdown headings (`##` / `###` only; no body-level `#` h1)
  - SEO meta bounds (`seo_title` ≤ 60, `seo_description` ≤ 155)
  - Prose depth (≥4 paragraph blocks)
  - Required `## What to do this week` closing section
  - Existing compliance + word-count gates retained
- Cover image uniqueness across the full published catalogue via `photoIdentity()`
  (Unsplash `photo-*` id and Pexels numeric id) — never reuse a cover already on a published briefing
- `?backfill=N` (1–10) for manual multi-day fills under the same QA gates

## UI

- Briefings search toolbar shows `N of total briefings` (e.g. `5 of 83 briefings`)

## Live DB cleanup (applied 2026-09-28)

- Newer rows sharing a cover image → `status = 'duplicate'` (earliest kept)
- Published row with no `##` headings → `status = 'qa_failed'`
