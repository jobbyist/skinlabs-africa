-- Seeds 3 fully public ("is_premium = false") comparison articles for organic search
-- and top-of-funnel conversion. Unlike the daily-scraped briefings, these are
-- original SkinLabs editorial pieces, so source_name/source_url point back at SkinLabs
-- itself rather than a third-party original.

INSERT INTO public.news_articles (
  slug, title, excerpt, body_markdown, key_takeaways, sa_context_tag,
  source_name, source_url, publish_date, reading_time, word_count,
  seo_title, seo_description, json_ld, is_premium, status
) VALUES

-- ================= 1: Skin Functional vs The Ordinary =================
(
  'skin-functional-vs-the-ordinary-sa',
  'Skin Functional vs The Ordinary in SA: Which Actives Actually Win on Local Shelves',
  'Two budget-actives brands, one South African shelf. We compare Skin Functional and The Ordinary on concentration, stability in local heat, pricing and where each genuinely pulls ahead.',
  $body1$## The pitch, and why it matters here

Skin Functional (South African-formulated, sold through Clicks, Dis-Chem and Takealot) and The Ordinary (DECIEM, imported and stocked via Superbalist, Takealot and select Dis-Chem stores) both compete on the same promise: clinical-strength actives at a fraction of prestige pricing, no packaging theatre. For SA shoppers choosing between them, the real questions are concentration accuracy, how each formula holds up in local heat and UV, and whether the price gap is worth it once shipping and stock reliability are factored in.

## Head-to-head on the actives that matter most

| | Skin Functional | The Ordinary |
|---|---|---|
| Niacinamide | 10% + Zinc PCA 1%, opaque pump bottle | 10% + Zinc 1%, clear dropper bottle |
| Vitamin C | Ethylated ascorbic acid 15%, more stable in heat | L-Ascorbic Acid 8% or 23% suspension, oxidises faster once opened |
| Retinoid | Encapsulated retinol 1%, gradual-release | Granactive Retinoid 2% in squalane, faster onset, more irritation risk |
| Hyaluronic Acid | Multi-weight HA + B5 | Multi-weight HA 2% + B5 (near-identical) |
| Average price (ZAR) | R150–R220 | R180–R320 (import pricing varies by retailer) |

Niacinamide is close to a toss-up — both deliver a well-supported 10% concentration, and the difference comes down to packaging. Skin Functional's opaque pump keeps the formula stable for longer; The Ordinary's clear glass dropper looks the part but leaves actives exposed to light every time it's opened, which matters more in a country with SA's UV index than in a temperate climate.

Vitamin C is where the gap is clearest for local conditions. The Ordinary's L-Ascorbic Acid line is potent on paper, but plain L-ascorbic acid oxidises quickly once exposed to heat and air — a real risk in un-air-conditioned bathrooms during a Durban summer or a Karoo heatwave. Skin Functional's ethylated ascorbic acid is a more heat-stable derivative; it's gentler and slightly less potent gram-for-gram, but it's more likely to still be doing something by week six of a 100ml bottle rather than turning brown in the cupboard.

Retinoids invert the pattern: The Ordinary's Granactive Retinoid formulations work faster and are the better pick for someone who has already built retinoid tolerance, while Skin Functional's encapsulated, slower-release retinol suits first-time users or reactive skin — which, combined with SA's high year-round UV exposure demanding strict AM sunscreen discipline either way, tips it toward the gentler option for most beginners.

## Verdict

Neither brand "wins" outright. For niacinamide and hyaluronic acid, buy whichever is in stock and cheaper that week — the formulas are close enough not to matter. For vitamin C, Skin Functional's stability edge is worth the modest price premium in most SA climates. For a first retinoid, start with Skin Functional's encapsulated version; reach for The Ordinary's Granactive Retinoid once your skin has already proven it tolerates actives well. In both cases, the packaging and stability differences matter more day-to-day than the ingredient list alone suggests — read the concentration, but also ask how the bottle will hold up in your bathroom.$body1$,
  ARRAY[
    'Niacinamide and hyaluronic acid formulas are near-identical between the two brands — buy on price and availability.',
    'Skin Functional''s ethylated vitamin C is more heat-stable for SA conditions than The Ordinary''s plain L-ascorbic acid.',
    'The Ordinary''s Granactive Retinoid acts faster but suits already-tolerant skin; Skin Functional''s encapsulated retinol is the gentler first step.',
    'Opaque, airless packaging (Skin Functional) protects light-sensitive actives better than The Ordinary''s clear dropper bottles.'
  ],
  'Budget Actives',
  'SkinLabs Editorial Team',
  'https://skinlabs.co.za/about',
  '2026-08-20',
  '6 min read',
  620,
  'Skin Functional vs The Ordinary in SA — Compared',
  'We compare Skin Functional and The Ordinary on niacinamide, vitamin C and retinol concentration, stability in SA heat, and Rand pricing.',
  '{"@context":"https://schema.org","@type":"Article","headline":"Skin Functional vs The Ordinary in SA: Which Actives Actually Win on Local Shelves","description":"A South African comparison of Skin Functional and The Ordinary on active-ingredient concentration, heat stability and price.","datePublished":"2026-08-20","author":{"@type":"Organization","name":"SkinLabs","url":"https://skinlabs.co.za"},"publisher":{"@type":"Organization","name":"SkinLabs","logo":{"@type":"ImageObject","url":"https://skinlabs.co.za/pwa-512.png"}},"mainEntityOfPage":{"@type":"WebPage","@id":"https://skinlabs.co.za/newsroom/skin-functional-vs-the-ordinary-sa"}}'::jsonb,
  false,
  'published'
),

-- ================= 2: CeraVe vs Cetaphil =================
(
  'cerave-vs-cetaphil-sa-climate',
  'CeraVe vs Cetaphil in SA''s Climate: Barrier Repair Compared',
  'CeraVe''s ceramide-and-MVE technology against Cetaphil''s lighter humectant approach — which barrier-repair line actually suits Highveld winters and coastal humidity better?',
  $body2$## Two pharmacy staples, two different jobs

CeraVe and Cetaphil are the two most recommended barrier-repair brands on SA pharmacy shelves — both sit in every Clicks and Dis-Chem, both are dermatologist-endorsed, and both get recommended almost interchangeably by well-meaning friends. They are not, however, solving the same problem in the same way, and which one is right depends heavily on where in South Africa you live and what season it is.

## What's actually in the jar

CeraVe's core formulas (Moisturising Cream, PM Facial Moisturiser, Healing Ointment) are built around three essential ceramides (1, 3, NP) delivered via patented MVE (MultiVesicular Emulsion) technology, which releases the ceramides and humectants gradually over roughly 24 hours. This is a genuine formulation advantage: it's the reason CeraVe Moisturising Cream keeps working through a dry Highveld night better than most competitors at a similar price point.

Cetaphil's classic range (the pink-bottle Gentle Skin Cleanser and original Moisturising Cream) is a simpler humectant-and-emollient formula — glycerin, mineral oil derivatives, panthenol — with no ceramide-delivery technology behind it. The newer Cetaphil PRO / Redness Control and Healthy Radiance lines have added niacinamide and some ceramide content, closing the gap, but the flagship classic formulas most SA shoppers actually buy are still comparatively basic.

## Climate fit

| Condition | Better pick | Why |
|---|---|---|
| Gauteng/Free State winter (low humidity, indoor heating) | CeraVe | MVE's slow-release ceramides outlast a full dry night better than a humectant-only formula |
| KwaZulu-Natal/Cape coastal humidity | Cetaphil (classic) | Lighter, less occlusive — CeraVe's richer creams can feel heavy and encourage congestion in humid heat |
| Active eczema or post-procedure barrier repair | CeraVe (Healing Ointment) | Ceramide-specific repair backed by the most published dermatology data of any drugstore barrier brand |
| Daily gentle cleansing, hard municipal water | Either — Cetaphil's original cleanser remains one of the least stripping options at any price |

The honest caveat: CeraVe's price premium over Cetaphil (typically R30–R60 more per equivalent size at Dis-Chem) is buying you the MVE delivery system specifically. If you're using either brand purely as a gentle, unremarkable daily moisturiser rather than for active barrier repair, that premium buys less real-world difference — Cetaphil's classic cream does the basic job perfectly well and is usually the cheaper litre-for-litre option.

## Verdict

For a genuine barrier flare — post-retinoid irritation, eczema, or the dry-season cracking common across the Highveld in July and August — CeraVe's ceramide technology is worth the extra Rand. For everyday, low-drama moisturising in humid coastal conditions, or for a budget-conscious daily routine with no specific barrier complaint, Cetaphil's simpler formula is not a downgrade, just a different tool.$body2$,
  ARRAY[
    'CeraVe''s MVE technology delivers ceramides over ~24 hours, making it the stronger pick for active barrier repair.',
    'Cetaphil''s classic range is lighter and less occlusive — often the better fit in humid coastal conditions.',
    'CeraVe''s price premium buys the ceramide-delivery system specifically, not general moisturising performance.',
    'For eczema flares or post-retinoid irritation, CeraVe Healing Ointment has the strongest evidence base of the two.'
  ],
  'Barrier Repair',
  'SkinLabs Editorial Team',
  'https://skinlabs.co.za/about',
  '2026-08-23',
  '5 min read',
  540,
  'CeraVe vs Cetaphil in SA''s Climate — Compared',
  'CeraVe''s ceramide and MVE technology versus Cetaphil''s lighter formulas, compared for Highveld winters and coastal humidity.',
  '{"@context":"https://schema.org","@type":"Article","headline":"CeraVe vs Cetaphil in SA''s Climate: Barrier Repair Compared","description":"A South African comparison of CeraVe and Cetaphil barrier-repair formulas across Highveld dryness and coastal humidity.","datePublished":"2026-08-23","author":{"@type":"Organization","name":"SkinLabs","url":"https://skinlabs.co.za"},"publisher":{"@type":"Organization","name":"SkinLabs","logo":{"@type":"ImageObject","url":"https://skinlabs.co.za/pwa-512.png"}},"mainEntityOfPage":{"@type":"WebPage","@id":"https://skinlabs.co.za/newsroom/cerave-vs-cetaphil-sa-climate"}}'::jsonb,
  false,
  'published'
),

-- ================= 3: La Roche-Posay vs Estée Lauder =================
(
  'la-roche-posay-vs-estee-lauder-retinol-sa',
  'La Roche-Posay vs Estée Lauder in SA Pharmacies: Premium vs Pharmacy Retinol',
  'A pharmacy-brand retinol serum against a department-store icon — we compare disclosed actives, price-per-use and real evidence behind La Roche-Posay and Estée Lauder''s anti-ageing lines.',
  $body3$## Two very different price tiers, one shared claim

La Roche-Posay Retinol B3 Serum sits in every Clicks and Dis-Chem pharmacy aisle at a mid-range price point. Estée Lauder's Advanced Night Repair and Perfectionist CP+R lines sit behind department-store counters at Edgars and Red Square at three to four times the price. Both brands lean hard on "clinically proven" anti-ageing language. The question worth asking before paying the premium: what, specifically, is in the bottle, and is it doing more?

## What's disclosed vs what's implied

La Roche-Posay's Retinol B3 Serum discloses its headline actives clearly: pure retinol (concentration undisclosed publicly, but formulated for daily tolerance) plus niacinamide (vitamin B3) and Madecassoside for anti-irritant support. It is registered and marketed with a defined retinoid, which is the single most useful piece of information on the label for judging real efficacy.

Estée Lauder's Advanced Night Repair is built around its proprietary "Chronolux Power Signal" complex — largely fermentation-derived ingredients, hyaluronic acid and antioxidants — and notably does **not** contain retinol at all; its anti-ageing claims rest on barrier support and antioxidant activity rather than a retinoid. Perfectionist CP+R, the line that does contain a retinoid-adjacent complex, discloses even less about concentration than La Roche-Posay does. This distinction matters: if what you actually want is retinoid-driven collagen stimulation and cell turnover — the best-evidenced anti-ageing mechanism in dermatology — Advanced Night Repair is not the product delivering it, regardless of its price or packaging.

## Price-per-use reality

| | La Roche-Posay Retinol B3 | Estée Lauder Advanced Night Repair |
|---|---|---|
| Typical SA price | R550–R650 (30ml) | R1,800–R2,200 (30ml) |
| Headline active | Disclosed retinol + niacinamide | Proprietary ferment complex, no retinol |
| Best evidence for | Retinoid-driven cell turnover, fine lines | Barrier support, hydration, antioxidant defence |
| Cost per ml | ~R20 | ~R65 |

At roughly three times the cost per millilitre, Estée Lauder's serum is not competing with La Roche-Posay's on mechanism — it's a different category of product wearing similar marketing language. That's not necessarily bad value if what you're buying is the broader antioxidant-and-hydration formula and the counter experience that comes with it, but it is not a "stronger retinol," because there isn't one in the bottle.

## Verdict

If a defined, disclosed retinoid is what you're shopping for, La Roche-Posay's Retinol B3 Serum delivers it at roughly a third of the price and with clearer labelling — start here, and pair it with daily SPF given SA's UV index. Estée Lauder's Advanced Night Repair is a well-formulated hydration-and-antioxidant serum that can sit alongside a separate retinoid, not replace one; buy it for what it is, not for the anti-ageing claim on the counter card.$body3$,
  ARRAY[
    'Estée Lauder Advanced Night Repair contains no retinol — its claims rest on antioxidants and barrier support, not a retinoid.',
    'La Roche-Posay Retinol B3 Serum discloses a defined retinol concentration at roughly a third of Estée Lauder''s cost per ml.',
    'If retinoid-driven cell turnover is the goal, the pharmacy option is the mechanistically stronger choice, not just the cheaper one.',
    'Pair either with daily SPF — SA''s UV index makes sun protection non-negotiable alongside any retinoid or brightening routine.'
  ],
  'Premium vs Pharmacy',
  'SkinLabs Editorial Team',
  'https://skinlabs.co.za/about',
  '2026-08-26',
  '6 min read',
  580,
  'La Roche-Posay vs Estée Lauder Retinol — SA Compared',
  'La Roche-Posay Retinol B3 Serum versus Estée Lauder Advanced Night Repair: disclosed actives, price-per-use and real evidence, compared for SA shoppers.',
  '{"@context":"https://schema.org","@type":"Article","headline":"La Roche-Posay vs Estée Lauder in SA Pharmacies: Premium vs Pharmacy Retinol","description":"A South African comparison of La Roche-Posay Retinol B3 Serum and Estée Lauder Advanced Night Repair on disclosed actives and price-per-use.","datePublished":"2026-08-26","author":{"@type":"Organization","name":"SkinLabs","url":"https://skinlabs.co.za"},"publisher":{"@type":"Organization","name":"SkinLabs","logo":{"@type":"ImageObject","url":"https://skinlabs.co.za/pwa-512.png"}},"mainEntityOfPage":{"@type":"WebPage","@id":"https://skinlabs.co.za/newsroom/la-roche-posay-vs-estee-lauder-retinol-sa"}}'::jsonb,
  false,
  'published'
)

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body_markdown = EXCLUDED.body_markdown,
  key_takeaways = EXCLUDED.key_takeaways,
  sa_context_tag = EXCLUDED.sa_context_tag,
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  publish_date = EXCLUDED.publish_date,
  reading_time = EXCLUDED.reading_time,
  word_count = EXCLUDED.word_count,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  json_ld = EXCLUDED.json_ld,
  is_premium = EXCLUDED.is_premium,
  status = EXCLUDED.status,
  updated_at = now();
