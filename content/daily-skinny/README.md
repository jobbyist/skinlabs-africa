# Daily Skinny briefings — 6 September 2026

Five original columns for The Daily Skinny, written in SkinLabs brand voice against the master blueprint (search-intent title, one-sentence answer, TL;DR, expert explanation, key facts, SA context, practical steps, FAQ, disclaimer).

Bodies are 2,000+ words each. Thumbnails are Unsplash URLs (same pattern as `src/data/editorials.ts` / Lovable Unsplash usage).

| Slug | Title | Tag | Words | Cover |
| --- | --- | --- | --- | --- |
| tinted-spf-skin-of-colour-south-africa | Tinted SPF Is How Melanin-Rich Skin Actually Gets Protected in SA | Sun Protection | 2155 | unsplash photo-1556228453-efd6c1ff04f6 |
| highveld-winter-hard-water-barrier | Highveld Winter Isn't a Serum Problem. It's Hard Water and Dry Air. | Barrier Repair | 2009 | unsplash photo-1570172619644-dfd03ed5d881 |
| traction-alopecia-sa-khumalo-data | Tight Styles Plus Time: What SA Research Says About Traction Alopecia | Hair Loss | 2024 | unsplash photo-1522335789203-aabd1fc54bc9 |
| azelaic-acid-melasma-pih-south-africa | Azelaic Acid Is the Brightening Active That Makes Sense Under SA Sun | Hyperpigmentation | 2004 | unsplash photo-1620916297397-a8b05e6567d4 |
| retinal-vs-retinol-hot-bathrooms-sa | Your Retinol Might Be Cooked. Here's Why Retinal Fits SA Bathrooms. | Retinoids | 2032 | unsplash photo-1613803745799-ba6c10aace85 |

Index: `src/data/dailySkinnyBriefings.ts`

SQL seed (apply after pulling bodies): `supabase/migrations/20260906080000_seed_five_daily_skinny_briefings.sql`

Live read path remains `news_articles` / `news_articles_public` as used by `use-news-articles.ts`. NewsArticle schema.org JSON-LD is included on insert (`buildJsonLd` shape from `supabase/functions/newsroom-sync/index.ts`).

Primary sources aggregated via Firecrawl:
- https://derminstitute.co.za/sun-protection-in-south-africa/ (Tod et al. 2024 IJD review via Dlova & co)
- Hard-water / eczema literature (King's / Sheffield / UK Biobank)
- Khumalo et al. traction alopecia prevalence (JAAD / BJD)
- Facial hyperpigmentation in skin of colour (azelaic vs hydroquinone trials)
- Established retinoid conversion science (DermNet)
