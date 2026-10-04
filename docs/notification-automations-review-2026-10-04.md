# Notification automations: review against product intent (2026-10-04)

Scope: read the live `run_notification_scheduler()` and `run_notification_automation()` (project `gnkpzijxuciiaamakgzm`), check each
seeded automation against what the product says and does, and propose fixes as **unapplied** migrations.
**Nothing was changed live.** Evidence below came from read-only queries and from rolled-back probes (a `DO` block that always
raises, or `pg_temp` copies of the changed functions, which vanish with the session).

Live state at the time: 15 members, 1 notification-preferences row, 1 active push device, 12 automations (11 enabled;
`inbox_mirror_push` is off). With one opted-in member there is no real opt-in data to extrapolate from, so section 4 uses stated
planning assumptions.

Proposals: `supabase/proposed/` (not under `supabase/migrations/`, so no tooling picks them up).

## 1. How scheduling works (verified from the live definitions)

* `notification-scheduler` cron `*/15 * * * *` runs `run_notification_scheduler()`; last 8 runs all `succeeded`.
* For each enabled `schedule`/`lifecycle` automation that is not `per_member_time`: it runs once per SAST day, on the first tick
  at or after `send_time`, and only inside `send_time .. send_time + 2 h`; weekly checks `isodow = weekday`, monthly `day = month_day`.
  `last_run_at` is stamped on success, so a failure retries on the next tick inside the window. A day whose whole window is missed is
  skipped (no catch-up).
* `routine_reminder` (`per_member_time`) runs every tick and matches members whose time fell in the last 15 minutes, so it relies on every
  tick firing (a skipped tick loses that quarter-hour's reminders).
* Every send goes through `enqueue_notification()` (idempotent on the key) and is then re-checked in `claim_notification_dispatches()` in this order:
  kill switch, age (> 24 h = `expired`), category preference (`preference_off`), quiet hours (default 21:00-07:00 SAST: re-scheduled, not
  dropped), the row's guard, the daily cap (`daily_cap`: dropped, not re-scheduled), devices.
* The daily cap counts today's `sent/partial/processing` dispatches whose template has `bypass_caps = false`. Default cap 2.

## 2. What each seeded automation does

First tick = the first 15-minute tick at or after the send time, in SAST. "Category checked" is the template category that
`notification_category_allowed()` evaluates (and its default).

| Automation | Audience | Trigger (SAST) | Idempotency key | Guard re-checked at send | Category checked (default) |
|---|---|---|---|---|---|
| `daily_briefing` | Members with `briefing` on | Daily, send 07:30, first tick 07:30. Only if a briefing with `publish_date = today` is published (newest one) | `daily_briefing:<user>:<date>` | `same_day` (date = today) | `briefing` (off) |
| `free_analysis_refreshed` | Profiles with status `''`/free/explorer and `last_free_analysis_at` set whose unlock date (`last_free_analysis_at + free_analysis_window_days`) is today | Daily, send 09:00, first tick 09:00; the push is scheduled at the unlock instant if that is later than the run | `free_analysis_refreshed:<user>:<unlock_at>` | `not_paid` (status not glow_lite/insider/vip) | `service` (**on**) |
| `journal_reminder` | Members with a `skin_photo_journal_settings` row and `journal_reminder` on, whose last photo (else the settings row's `created_at`) is older than the frequency step, with no journal reminder in the last step minus 1 day | Daily, send 18:00, first tick 18:00 | `journal_reminder:<user>:<date>` | `same_day` | `journal_reminder` (off) |
| `skin_weather_alert` | Members with `skin_weather` on and a `profiles.weather_city_key` whose cached weather is < 4 h old and crosses a threshold (UV >= 6, humidity < 30, or humidity > 80 with high >= 28) | Daily, send 07:05, **first tick 07:15** | `skin_weather_alert:<user>:<date>` | `same_day` | `skin_weather` (off) |
| `streak_at_risk` | Members with `routine_reminder` on who checked in yesterday **and** the day before, and not yet today | Daily, send 19:00, first tick 19:00 | `streak_at_risk:<user>:<date>` | `no_checkin_today` | `routine_reminder` (off) |
| `trial_lifecycle` | Rows of `trial_lifecycle_email_plan(today)`: the same function the emails use | Daily, send 08:00, first tick 08:00 | `push:<email idempotency key>` = `push:<template>:<user>:<trial_ends_at>` (once per template per trial) | `trial_active` (still `trial` with the same `trial_ends_at`) for week-left / precharge / last-chance / activation nudge; `not_paid` for win-back | week-left, precharge, last-chance: `account_update` (on); activation nudge and win-back: `promotional` (off) |
| `weekly_recap` | Members with `routine_reminder` on and at least one check-in in the last 7 days | Weekly, Sunday 18:30, first tick 18:30 | `weekly_recap:<user>:<date>` | `same_day` | `routine_reminder` (off) |

Also seeded (not in the requested seven): `routine_reminder` (per member time, guard `no_checkin_today`, category `routine_reminder`) and the event
automations `membership_activated`, `report_ready_advanced`, `trial_ended` (all `bypass_caps`, priority 10).

## 3. Findings

Severity: **bug** = behaves differently from what the product says; **gap** = parity or coverage; **decision** = needs a product call.
Fixes marked "migration" are in `supabase/proposed/20261006120000_notification_automation_fixes.sql`.

### 3.1 `free_analysis_refreshed`

* **Window is right (7, not 30).** The function reads `coalesce(pricing_settings.free_analysis_window_days, 7)` for the `control` variant;
  the live value is 7 (`allowance 1`, `window 7`). Probe (rolled back, admin profile as a free member): last free analysis 30 days ago ->
  0 dispatches; 7 days ago (unlock at 12:00 SAST that day) -> 1 dispatch with `scheduled_at` = the unlock instant (`10:00Z`).
  The unlock instant uses the same `last_free_analysis_at + window` arithmetic as the in-app "Next free analysis on ..." date.
* **Wording matches the in-app rule because it states no number**: "Your free skin analysis is ready to use. A fresh check-in shows how
  your skin has changed since last time." The app says "one free Basic AI Skin Analysis every 7 days". Two small differences: the product name
  is "Basic AI Skin Analysis", and "free" is wrong for anyone on a paid plan (see next bullet). Migration: title -> "Your Basic AI Skin Analysis is ready".
* **F1 (bug, migration): Glow Lite members are never notified.** The in-app limit applies to `formulator_tier` explorer **and glow_lite**
  (`FORMULATOR_LIMITS`, `get_formulator_allowance`), but the audience is status free/explorer and the guard `not_paid` excludes glow_lite.
  Probe: a Glow Lite member 7 days after their analysis: `formulator_tier = glow_lite` (limited in-app), 0 dispatches from the live function,
  1 from the proposed one. Insider/VIP (unlimited) and Insider trials stay excluded. Migration: audience and guard use `formulator_tier()`
  (`limited_tier` guard).
* **F2 (decision): it sits in the `service` category, which is on by default and always writes an inbox row.** Everyone with a device gets this
  growth nudge unless they switch off "Important service notices", which in Settings reads "Outages, policy changes and other things you need to know".
  Two options: move the template to `routine_reminder` (opt-in; "reminders"), or keep it in `service` and say so in the Settings copy. Not changed.

### 3.2 `skin_weather_alert`

* **A refresh does run before the alert.** `skin-weather-prewarm` (cron `50 4 * * *` = 06:50 SAST) calls `prewarm_skin_weather_for_alerts()`,
  which POSTs to the `skin-weather` function for every distinct `weather_city_key` of members with `skin_weather` on (only while the
  automation is enabled). The function refreshes when its cache is older than 60 minutes and serves the cached row otherwise. The alert runs at the
  07:15 tick, 25 minutes later, and requires `fetched_at > now - 4 h`.
* **The 4-hour freshness check is the safety net.** Live cache at audit time: cape-town 20 min old, mbombela 21 min, johannesburg 37 min,
  **pretoria 16 h 55 min** (filled once by a visitor yesterday). Without the prewarm, a Pretoria member would be skipped; if a prewarm call fails
  (the function then serves a stale row and does not advance `fetched_at`), the member simply gets no alert rather than an alert on old data.
* **Not yet evidenced end to end.** The prewarm job was created after today's 04:50 UTC run; `cron.job_run_details` has no row for job 35 yet. First
  real run: 5 Oct 04:50 UTC. Today's cached values (UV 8.9 / 11.5 / 8.9 / 11) would all trigger "Very high UV today". Today there is 0 opted-in members, so nothing
  would be sent either way.
* **F3 (gap, no migration): nothing records a failed prewarm.** `net.http_post` is fire-and-forget; a silent provider failure (OpenWeather 401 has happened before)
  shows up only as "no alerts". Suggest a follow-up that logs `net._http_response` status per city.
* Thresholds differ slightly from the dashboard card (`tips.ts`: humid above 70, and tips from the moderate UV band up). The push is a deliberate subset (UV >= 6, humid > 80 and >= 28 C),
  so it never fires on a day the card would not mention. Only `profiles.weather_city_key` is used (no fallback to the free-text city or Johannesburg).

### 3.3 `trial_lifecycle`

* **Same dates as the email lifecycle, by construction.** It iterates `trial_lifecycle_email_plan(today SAST)`, the function the email cron uses, so the T-7 / T-3 /
  day-2 / +5 windows are identical. Probe (rolled back, admin profile as a promo trialist, `trial_ends_at = 2026-10-31T22:00:00Z`):
  run at 25 Oct 08:00 SAST -> `trial_week_left` "A week left on your Glow Insider trial / Your trial ends Sun 1 Nov." ; run at 29 Oct 08:00 SAST ->
  `trial_last_chance` "3 days left on your Glow Insider trial / ... add a payment method before Sun 1 Nov." (no card). The end date renders as **1 Nov**
  (SAST), not 31 Oct; billing on 1 Nov matches the precharge copy "Your membership starts Sun 1 Nov ... your saved card is charged".
* **No push to members who already converted.** Same probe: the queued dispatch's guard `{type: trial_active, trial_ends_at: ...}` returns true while the
  member is on the trial and **false after the status becomes `insider`** (`notification_guard_ok`). Win-back uses `not_paid`.
* **F4a (gap, migration): the email send-time guards re-check more than the push guard does.** `_shared/email/guards.ts` re-reads card state for precharge (needs a live
  subscription) and last chance (needs none) and re-checks activation for the nudge; the push guard checks status and `trial_ends_at` only. The window between
  queue and send is normally minutes (quiet hours can stretch it), so this is a small exposure, but the copy differs ("your saved card is charged" vs "add a payment method"). Migration: optional `has_card` / `not_activated` checks in `trial_active`.
  Probe: `has_card:false` passes for a no-card trialist, `has_card:true` fails.
* **F4b (bug, migration): `not_paid` omits `active` and `premium`**, two statuses `PAID_SUBSCRIPTION_STATUSES` treats as paid. It only affects the win-back guard today (selection already limits to free statuses), but it is the guard the engine reuses elsewhere.
* **Design notes (no change proposed).** `trial_last_chance` and `trial_precharge_reminder` are `account_update` with `bypass_caps`: they ignore the daily cap and quiet hours (the run is at 08:00, so quiet hours never matter in practice). Precharge is a charge notice and belongs there; last chance is a conversion nudge and could arguably respect the cap: product call. Activation nudge and win-back need **two** opt-ins (email marketing consent from the plan function, plus `promotional` on).
* **F4c (note): the daily email cron is now scheduled.** `trial-lifecycle-emails-daily` (`5 4 * * *`, job 31) exists and is active. `CLAUDE.md` still says it is not scheduled; first run was 4 Oct 04:05 UTC. Someone (or an earlier session) scheduled it; update the note if that was intended. There are no promo-trial cohorts yet, so it queues nothing today.
* Both lifecycle runs are single-day matches: if the 08:00-10:00 window is missed (scheduler down), that day's push is not sent later. The email cron has the same property.

### 3.4 `journal_reminder`

* **F5a (bug, migration): `skin_photo_journal_settings.reminder_enabled` is ignored.** The automation selects every settings row with `journal_reminder` on.
  Probe: `frequency = monthly`, `reminder_enabled = false`, last photo 3 Oct, today 20 Nov -> the live function enqueued 1; the proposed one enqueues 0 (and 1 when `reminder_enabled = true`).
  (No UI writes `reminder_enabled` today, `PhotoJournalTab` only saves the frequency, so the member-facing off switch is the `journal_reminder` preference; the column should still be honoured.)
* **F5b (cleanup, migration): frequency.** The column is `CHECK (frequency IN ('weekly','monthly'))` (default `monthly`). The automation maps `weekly -> 7`, `monthly -> 30` and also carries dead
  `fortnightly`/`biweekly -> 14` branches. The dashboard steps monthly by a **calendar month** (`addInterval` -> `setMonth(+1)`). Migration: weekly 7 days, monthly `interval '1 month'`, dead branches removed.
* **F5c (decision): the reminder repeats while overdue.** It re-sends roughly every step (dedupe window = step - 1 day) for as long as no photo is added, with no cap on unanswered reminders. For a monthly member that is monthly; for weekly it is a weekly nag forever. Consider stopping after 3 unanswered reminders. Not changed.

### 3.5 Other automations

* **F6 (bug, migration): `weekly_recap` says "1 routine check-ins this week".** The template uses `{{n}} routine check-ins`. Migration adds a `{{checkins}}` variable ("1 routine check-in" / "N routine check-ins") and updates the template body only while it is still the seeded text. Probe renders "1 routine check-in this week. ..." .
* **F7 (decision): the default cap of 2 decides which automation a member sees.** A member with routine reminders, weather and briefing all on is pushed at 07:00 (routine, if their time is the default), 07:15 (weather), 07:30 (briefing): the cap of 2 is spent by the first two, the briefing is `skipped: daily_cap` (final, not re-scheduled). In the evening the same member's streak nudge (19:00) and weekly recap (Sunday 18:30) are skipped once the cap is spent. Priority numbers (30 routine/weather, 40 streak, 50 briefing, 60 recap) only order rows inside one claim batch, and these are enqueued at different ticks, so they do not help. Evening-routine members also get "Keep your routine going" at 19:00 and "Time for your evening routine" at 19:30: two nudges 30 minutes apart for the same thing. Options: raise the default cap to 3, stagger (briefing before weather), suppress the streak nudge when the reminder is due within the hour, or let the cap prefer higher-value categories. Needs a product call.
* **F8 (bug, migration): announcing a podcast episode twice sends it twice.** `admin_announce_podcast_episode()` creates a new campaign per call with nothing keyed on the episode. Probe: the proposed version sends the first call and refuses the second with "This episode has already been announced" (cancelled campaigns do not count). File: `20261006121000_announce_podcast_episode_once.sql`.
* **F9 (note): `routine_reminder` depends on every 15-minute tick** (see section 1). pg_cron has been on time; if a tick is ever skipped that quarter-hour's reminders are lost. A 30-minute match window with the idempotency key would remove the dependency; not proposed yet.
* `daily_briefing` waits for a published briefing with today's `publish_date` (the pipeline publishes about 06:00 SAST), so a day with no briefing sends nothing. The push title is the briefing title truncated to 80 characters by `enqueue_notification`. A premium briefing would open a gated page for a non-member; not checked here.

## 4. Expected daily volume at 100 members, and the daily cap

Planning assumptions (labelled; replace with real numbers when there are some): 100 members; **30 have an active push device** (live today: 1 of 15);
among those, opt-ins of 50% routine reminders, 40% briefing, 25% skin weather, 15% journal; the three default-on categories are on for everyone. 20 of the 30 are limited-tier members.

| Automation | Basis | Typical pushes / day | Counts toward the cap? | Interaction with the default cap of 2 |
|---|---|---|---|---|
| `routine_reminder` (extra) | 15 opted in x ~80% have steps x ~60% not yet checked in | ~7 | Yes | Usually first of the day (07:00), so it is never the one dropped |
| `skin_weather_alert` | 8 opted in, UV >= 6 on almost every spring/summer day (4 of 4 cached cities today) | ~7 | Yes | 07:15: second in line; with routine on it is the last slot of the day for this member |
| `daily_briefing` | 12 opted in, every day a briefing publishes | ~12 | Yes | 07:30: dropped for anyone who already got routine + weather |
| `free_analysis_refreshed` | ~20 limited-tier x ~35% analysed / 7-day cycle | ~1 | Yes | 09:00 or at the unlock instant; competes with the morning pushes |
| `journal_reminder` | 5 opted in; monthly default, so ~1/30 each plus overdue repeats | ~0.5 | Yes | 18:00: rarely competes |
| `streak_at_risk` | 15 opted in x ~20% on a 2-day streak, not yet checked in | ~3 | Yes | 19:00: dropped if the cap was already spent |
| `weekly_recap` | Sunday only: 15 x ~60% with a check-in | 9 on Sundays (~1.3 averaged) | Yes | 18:30 Sunday: competes with the Sunday morning pushes |
| `trial_lifecycle` | Depends on the promo cohort: if 40 of 100 are on promo trials ending 1 Nov, 30% pushable = 12 | **Spikes: ~12 on 25 Oct (week left), ~12 on 29 Oct (precharge or last chance)**; otherwise ~0-1 (nudge/win-back need two opt-ins) | Week left: yes. Precharge and last chance: **no** (bypass) | Cap-exempt rows still arrive when the member's cap is spent; they also do not count toward it |
| `membership_activated`, `report_ready_advanced`, `trial_ended` (events) | Per event | trial_ended: ~12 on 1 Nov | No (bypass, priority 10) | Never dropped by the cap |

A typical day is about **30 pushes** for 30 pushable members, about one per pushable member per day, but concentrated on the opted-in minority: a member who turned on routine, weather,
briefing and streak would be asked for four and receives two (cap 2). The two trial spikes (25 and 29 Oct) are the largest single-day events in the next four weeks.

## 5. Missing automations (proposals only, nothing built)

### 5.1 Monthly skin review (1st of the month)

* Trigger: `schedule`, monthly, `month_day = 1`, send at 10:00 SAST (after the morning pushes have used the cap; or exempt it from the cap and keep it rare).
* Audience: members with a saved Basic AI Skin Analysis, a saved routine or a journal entry. Skip anyone who got a journal reminder in the last 7 days or analysed in the last 14.
* Category: reuse `journal_reminder` (relabel "Progress check-ins") rather than add an eleventh category, which would touch `notification_categories()`, the preferences columns and grants, both Settings UIs and the admin UI.
* Copy must be generic and must not promise a generated "review" (no such feature exists): "Time for your monthly skin check-in. Tap to look back at your routine and progress." -> `/dashboard?tab=skin`.
* Idempotency: `monthly_skin_review:<user>:<YYYY-MM>`. Guard `same_day`. Volume at 100 members: ~6 pushes, once a month.

### 5.2 Price-drop alerts for Insider / VIP

* **`retailer_price_runs` is not a price source.** It is a run log (`summary` holds counts, outcomes and Firecrawl credit use). Price changes live in `product_prices` (append-only history, `source_type = 'retailer_listing'`) and the `sa_retail_prices` view (current price, `price_since`, `checked_at`).
* Today there is almost nothing to alert on: 244 price rows, **3** from retailer listings, 9 matched listings.
* Missing pieces, in order: (1) a follow list (`product_price_follows(user_id, product_slug)` plus UI); no product "saved/follow" concept exists today, the `price_alert` template example text assumes one; (2) an entitlement key in the Insider/VIP ladders (none exists); (3) an automation that compares each followed product's latest `retailer_listing` price with the previous one, only for listings that are `matched` and checked in the last 14 days (the standing price rule), and only for drops above a threshold; (4) a send-time guard `still_cheaper` (current price <= the alerted price); (5) category `price_alert` (off by default; already in the model).
* Lock-screen copy stays generic ("A product you follow is cheaper"): a named product on a locked screen discloses what someone is shopping for.
* Idempotency: `price_drop:<user>:<retailer_product>:<product_prices.id>`.

### 5.3 "Podcast new episode" announce action

* Episodes live in `src/data/podcast.ts`, not the database, so SQL cannot detect a new one; keep it an admin action.
* Already in place: template `podcast_episode_announce` and `admin_announce_podcast_episode(slug, title, audience, confirm)`. **Missing: UI.** The admin dashboard is client code that already bundles `publishedPodcastEpisodes`, so a picker in Admin -> Notifications -> Compose ("Announce an episode": choose an episode, see the audience preview, typed confirmation above 50) needs no database change.
* Pair it with the dedupe migration (F8). Volume at 100 members: ~9 pushes (30 pushable x ~30% opted in) on an episode day.

## 6. Decisions needed

1. F2: move `free_analysis_refreshed` out of the always-on `service` category, or keep it and reword the Settings label?
2. F7: how should the default cap of 2 prioritise the day? (raise to 3, stagger, or drop the streak nudge when a reminder is due within the hour)
3. F5c: stop journal reminders after N unanswered?
4. F4: should `trial_last_chance` respect the cap (it is a conversion nudge, not a charge notice)?
5. Which of 5.1-5.3 to build (5.3 is the cheapest and removes a manual SQL step).
6. Approve applying `supabase/proposed/*` (F1, F4a, F4b, F5a, F5b, F6, F8). After applying, run the `.probe.sql`.

## 7. How this was checked

* Read-only: the live definitions of `run_notification_automation`, `run_notification_scheduler`, `notification_guard_ok`, `fan_out_notification_campaign`, `prewarm_skin_weather_for_alerts`, `trial_lifecycle_email_plan`; `notification_automations` and `notification_templates` rows; `cron.job` and `cron.job_run_details`; `skin_weather_cache`; `pricing_settings`; constraints on `skin_photo_journal_settings`; `retailer_price_runs`, `product_prices` and `sa_retail_prices` shape and counts.
* Rolled-back probes against the live schema (each ends in `RAISE EXCEPTION`, so nothing persists): trial lifecycle at 25 Oct and 29 Oct with a promo trial, then a conversion; free-analysis window at 7 and 30 days and a Glow Lite member; journal with `reminder_enabled = false`; recap wording.
* The proposed functions were created as `pg_temp` copies (session-local, gone afterwards) and run through the same scenarios; a second run executed **every** branch of the full proposed `run_notification_automation` next to the live one at two timestamps (all 0 / 0 because production has almost no data, so that run proves the SQL compiles and executes, not behavioural parity beyond the changed branches).
* The proposed `admin_announce_podcast_episode` was run as a `pg_temp` copy as the admin: first call enqueues, second call is refused.
