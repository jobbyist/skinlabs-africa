# SkinLabs® October 2026 Skin Story Giveaway — `/giveaways/october-2026`

TikTok paid-traffic landing page. Primary conversion: **start/complete the free skin assessment**
(`/skynn-ai`, the existing Basic AI Skin Analysis). The giveaway is the incentive.

## Campaign facts (all in `src/lib/giveaway/campaign.ts`)

- Entries close **15 Oct 2026 23:59:59 SAST** (`GIVEAWAY_CLOSES_AT`; mirrored by `giveaway_closes_at()` in the migration, a test checks both; the time of day is an assumption, the owner gave the date only). Winners announced **16 Oct 2026**, prizes awarded **31 Oct 2026** (owner, 2026-10-04).
- Eligibility (owner, 2026-10-04): **18 or older, and a legal resident or citizen of South Africa**; the entry form has a required confirmation tick, the T&Cs state it.
- **Lifetime Glow Insider** is activated on the winner's account after the current extended free trial period ends on **1 November 2026** (owner).
- 2 winners, each: R500 Takealot voucher + Lifetime Glow Insider. Winners announced on the website and TikTok (as the video says).
- Entry = free assessment saved to an account + Skin Story on a TikTok Story tagging @skinlabsza + entry confirmation (TikTok username).
- CTA copy is approved verbatim (`GIVEAWAY_COPY`), a test pins it.

## Pieces

| Piece | Where |
|---|---|
| Page (lazy SPA route, slim chrome, no ads) | `src/pages/GiveawayOctober2026.tsx`, `src/components/giveaway/*` |
| T&Cs (accordion; built from config) | `src/lib/giveaway/terms.ts`, `GiveawayTerms.tsx` |
| Tracking | `src/lib/giveaway/analytics.ts` |
| Web story (rail, full-screen viewer, AMP `/web-stories/skin-story-giveaway-october-2026`) | `giveawayOctober2026Story()` in `src/lib/webStories/curated.ts`; listed only while the giveaway is open |
| Inline video card (poster first, video mounts when ≥50 % visible, muted/playsInline/loop) | `GiveawayStoryPlayer.tsx` |
| Entry confirmation | `GiveawayEntryPanel.tsx` + `supabase/migrations/20261006100000_giveaway_entries.sql` |
| After-assessment nudge back to the page | `GiveawayResultsNudge.tsx` (SKYNN AI results; only for visitors who came through the giveaway) |
| Media | `public/stories-media/giveaway/` (video 0.87 MB, down from 7.7 MB), `public/og-giveaway-october-2026.jpg` |
| Tests | `src/lib/__tests__/giveaway.test.ts`, `e2e/giveaway.e2e.ts` (44 + 8 runs), `supabase/tests/giveaway_entries.sql` (13 assertions) |

## Funnel + events

`TikTok ad → giveaway_page_view → giveaway_cta_click → giveaway_assessment_started → giveaway_assessment_completed → giveaway_story_cta_click (Share Your Skin Story / web story CTAs) → giveaway_entry_submitted`
(`giveaway_terms_viewed` on the side). All go through `trackConversionEvent`, so Vercel Analytics + `analytics_events` get them with the visit's `utm_*` + `attr_sid`.
Payload whitelist (`sanitizeGiveawayPayload`): `campaign`, `landing_page`, `campaign_deadline`, `cta_location`, `cta`. Nothing else can pass, no skin/health data. `source`/`medium` are the visit's own UTM labels (not hard-coded: organic visitors are not "tiktok").

`giveaway_assessment_started/completed` are reported from the existing SKYNN AI flow at its existing `analysis_started` / `analysis_generated` moments, only when this browser session came through the giveaway, and once per session each.

### To TikTok (consent-gated, existing pixel + `tiktok-events` function, shared `event_id`)

| SkinLabs event | TikTok |
|---|---|
| (page) | PageView (`ttq.page()` on load + SPA nav) and ViewContent (`contentForPath`: `giveaway-october-2026`) |
| `giveaway_cta_click`, `giveaway_story_cta_click` | **ClickButton** (new in the whitelist, client + edge) |
| `giveaway_assessment_completed` | **SubmitForm** (the finished free analysis; no content of it is sent) |
| started / terms / page_view / entry | first-party only (no honest TikTok event; no double counting) |

Never InitiateCheckout: nothing is bought. Page URLs sent to our edge function are origin + path only (a fix made here: `sendEvent` used to read `location.href` after an async step, so a CTA click that navigated filed the event under the next page, and it carried the query string). `ttclid` travels in its own field; UTMs never go to TikTok.

## Entry mechanism (self-report, human-checked)

TikTok Stories can't be verified by API, so the UI never says "verified". `enter_giveaway(campaign, handle, confirmed, terms_version)` (SECURITY DEFINER) requires: signed in, a delivered saved analysis, before the closing instant, a valid TikTok username, the confirmation tick; one row per member per campaign (re-submitting only corrects the username of a `submitted` entry). Members can read only their own row's non-sensitive columns. Statuses: `submitted` → `verified | rejected | winner` (admin).

Review in the SQL editor (service role):

```sql
select e.created_at, e.tiktok_handle, u.email, e.status
from public.giveaway_entries e join auth.users u on u.id = e.user_id
where e.campaign = 'skinlabs_october_2026_giveaway' order by e.created_at;
-- after checking the Story on TikTok:
update public.giveaway_entries set status = 'verified' where id = '<entry id>';
```
(`admin_giveaway_entries()` does the same for a signed-in admin session.) There is no admin UI yet.

## Still needs business / legal confirmation (T&Cs degrade to true-regardless wording until supplied)

`GIVEAWAY_LEGAL` in `campaign.ts`; `giveawayOpenQuestions()` lists what is still `null`:
promoter legal name + registration + address · how the two winners are selected (random draw or judged) · how long a winner has to respond ·
whether SkinLabs® may repost Stories (copy promises it will NOT without asking) · what "lifetime" means (account vs plan lifetime; activation timing is now supplied) ·
Takealot voucher expiry/delivery · legal sign-off, including the assumed 23:59 SAST closing time on 15 Oct.
Interpretation to confirm: "over the age of 18" is written as "18 years old or older".
Also: there is still no tool that grants Lifetime Glow Insider to a winner (the founding-member entitlement looks closest, confirm first) and the activation must be done on/after 1 Nov 2026.

## Naming note

The approved copy calls the free assessment a "free AI dermatology analysis"; in product terms it is the **Basic AI Skin Analysis**
(rule-based, not dermatologist-reviewed; the **Advanced AI Dermatology Analysis** is the separate Analysis Pass product). The page
says what the free analysis is ("general skincare guidance, not medical advice or a diagnosis") next to the approved headline wording.
The supplied video says "Share your free **Basic dermatology report**": it can't be edited in code and "report" is a retired term
for pending submissions: consider a re-cut.

## Deployment

1. Merge the PR (Vercel builds; the route is prerendered for OG tags and in the sitemap).
2. Migration `20261006100000_giveaway_entries` is applied live (probe passed, rolled back); the closing time was then moved to 15 Oct with `giveaway_closes_15_october` (a `CREATE OR REPLACE` of `giveaway_closes_at()`; the repo file already carries the final value).
3. `tiktok-events` redeployed from a commit on `main` containing `ClickButton` (`_shared/tiktok/eventsApi.ts`) — see CLAUDE.md for the deployed version.
4. Tag ad links: `https://skinlabs.co.za/giveaways/october-2026?utm_source=tiktok&utm_medium=paid_social&utm_campaign=skinlabs_october_2026_giveaway&utm_content=<ad>`.
5. Verify in TikTok Events Manager → Test events (`TIKTOK_TEST_EVENT_CODE`).
