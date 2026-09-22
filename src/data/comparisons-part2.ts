/**
 * Shelf Showdown articles part 2
 *
 * Restored from git history (commit 151cc51, the last commit where
 * src/data/comparisons.ts held real content before it was accidentally
 * emptied in a later SEO-copy commit) -- real, previously-published
 * SkinLabs comparison articles, not fabricated.
 */
import type { ComparisonArticle } from "./comparisons-types";

export const comparisonArticlesPart2: ComparisonArticle[] = [
  {
    slug: "skin-functional-vs-skinphd-vitamin-c",
    title: "Skin Functional vs SkinPhD: Budget vs Clinic-Tier Vitamin C, Compared",
    dek: "A R270 pharmacy vitamin C serum against a R660 clinic-brand one. We compare Skin Functional's Ascorbic + Ferulic Acid serum with SkinPhD's Vitamin C Serum on concentration, stability and whether the clinic price actually buys more brightening.",
    saContext: "Budget vs Clinic-Tier",
    publishDate: "2026-08-27",
    modifiedDate: "2026-08-27",
    readingTime: "5 min read",
    featured: true,
    thumbnail: {
      url: "https://images.unsplash.com/photo-1640625696922-1fd63c0b97c9?auto=format&fit=crop&w=1600&q=80",
      alt: "A vitamin C serum dropper bottle resting on fresh oranges, representing a vitamin C skincare comparison",
      creditName: "Simran Sood",
      creditUrl: "https://unsplash.com/@simran01_fashionphotography",
    },
    productsCompared: [
      {
        name: "10% Ascorbic + 3% Ferulic Acid",
        brand: "Skin Functional",
        priceZar: 270,
        reviewSlug: "sf-ascorbic-ferulic",
        officialBrandUrl: "https://skinfunctional.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "Vitamin C Serum",
        brand: "SkinPhD",
        priceZar: 660,
        reviewSlug: "skinphd-vitamin-c-serum",
        officialBrandUrl: "https://skinphd.co.za",
        retailer: { label: "Shop at Dis-Chem", url: "https://www.dischem.co.za/" },
      },
    ],
    bodyMarkdown: `## Same job, different aisle

Vitamin C serums exist to do one job well: brighten, even out tone and back up your sunscreen with some antioxidant defence. [Skin Functional's 10% Ascorbic + 3% Ferulic Acid](/reviews/sf-ascorbic-ferulic) does it from the Clicks shelf for around R270. [SkinPhD's Vitamin C Serum](/reviews/skinphd-vitamin-c-serum) does it from a clinic-brand position at roughly R660. Before you pay more than double, it's worth asking what that buys you.

## Reading the concentration

Skin Functional discloses its formula clearly: 10% L-ascorbic acid paired with 3% ferulic acid, a combination with real research behind it — ferulic acid helps stabilise ascorbic acid and appears to boost its antioxidant effect. This is close to the textbook "gold standard" ratio popularised by more expensive prestige serums, at a pharmacy price.

SkinPhD's Vitamin C Serum doesn't publish an exact concentration on the SkinLabs-reviewed packaging, positioning itself instead on cosmeceutical-grade sourcing and clinic distribution. That's not automatically worse — professional-tier brands sometimes use more stable derivative forms of vitamin C that don't need a headline percentage to work — but it does mean you're trusting the brand's formulation claims a little further, rather than checking the number yourself.

## Stability, and the part nobody puts on the label

Plain L-ascorbic acid oxidises fast once a bottle is opened, especially in a hot, un-air-conditioned bathroom during a Joburg or Durban summer — it turns golden, then brown, then largely useless. Ferulic acid slows that down, but it doesn't stop it. Whichever bottle you buy, keep it away from direct light and heat, and don't expect a serum that's turned deep amber to still be doing much.

## Verdict

Read that again: paying triple doesn't guarantee triple the brightening. For most people managing everyday dullness or early post-inflammatory marks, Skin Functional's disclosed 10/3 ratio is a genuinely well-formulated, budget-friendly starting point. SkinPhD's serum makes more sense if you're already working with a skin therapist on a broader clinic routine and want everything sourced from one cosmeceutical range — but on ingredient transparency alone, the R270 bottle has the stronger paper trail.`,
    verdicts: [
      { label: "Better value for everyday brightening", text: "Skin Functional — a disclosed 10% ascorbic + 3% ferulic ratio at a third of the price." },
      { label: "Better if pigmentation is your main concern", text: "Either works AM under SPF; pair with alpha arbutin or niacinamide for stubborn marks." },
      { label: "Better if you're already on a clinic routine", text: "SkinPhD, for consistency with a therapist-guided cosmeceutical range." },
      { label: "Better for sensitive or reactive skin", text: "Start with whichever is fresher stock — oxidised vitamin C is more likely to sting than either formula at full strength." },
    ],
    keyTakeaways: [
      "Skin Functional's 10% ascorbic + 3% ferulic acid formula discloses a research-backed ratio at roughly a third of SkinPhD's price.",
      "SkinPhD's Vitamin C Serum doesn't publish an exact concentration, trading transparency for cosmeceutical-grade clinic positioning.",
      "Both formulas oxidise with heat and light exposure — SA's climate makes storage as important as the active itself.",
      "Neither replaces daily SPF; vitamin C is an antioxidant backup, not sun protection.",
    ],
    seoTitle: "Skin Functional vs SkinPhD Vitamin C Serum — SA Shelf Showdown",
    seoDescription:
      "Skin Functional's 10% Ascorbic + Ferulic Acid serum vs SkinPhD's Vitamin C Serum: concentration, heat stability and Rand value, compared for SA skin.",
  },
  {
    slug: "cerave-vs-cetaphil-sa-climate",
    title: "CeraVe vs Cetaphil in SA's Climate: Barrier Repair Compared",
    dek: "CeraVe's ceramide-and-MVE technology against Cetaphil's lighter, niacinamide-boosted approach — which barrier-repair moisturiser actually suits Highveld winters and coastal humidity?",
    saContext: "Barrier Repair",
    publishDate: "2026-08-30",
    modifiedDate: "2026-08-30",
    readingTime: "6 min read",
    thumbnail: {
      url: "https://images.unsplash.com/photo-1622910076411-b126ff7e469b?auto=format&fit=crop&w=1600&q=80",
      alt: "A jar of thick barrier-repair moisturising cream on a neutral surface, representing a CeraVe vs Cetaphil comparison",
      creditName: "Daniela Chavez",
      creditUrl: "https://unsplash.com/@dani8808",
    },
    productsCompared: [
      {
        name: "Moisturising Cream (454g)",
        brand: "CeraVe",
        priceZar: 429,
        officialBrandUrl: "https://www.cerave.co.za",
        retailer: { label: "Shop at Dis-Chem", url: "https://www.dischem.co.za/" },
      },
      {
        name: "Moisturising Cream (550g)",
        brand: "Cetaphil",
        priceZar: 345,
        officialBrandUrl: "https://www.cetaphil.co.za",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
    ],
    bodyMarkdown: `## Two dermatologist-recommended tubs, two different jobs

CeraVe and Cetaphil are the two names dermatologists reach for most often when a patient needs a genuinely gentle, fragrance-free moisturiser — for eczema, for compromised barriers, or for the kind of dry, tight skin that a Highveld winter or an aircon-heavy office reliably produces. Both are affordable by clinic-brand standards and both are fragrance-free, but they're not interchangeable. The formulas solve for slightly different problems.

## What's actually in the tub

CeraVe's Moisturising Cream is built around three ceramides (1, 3 and 6-II) — lipids that occur naturally in skin and are lost faster than they're replaced when the barrier is compromised — delivered via patented MVE (MultiVesicular Emulsion) technology, which is designed to release moisturising ingredients over roughly 24 hours rather than all at once. It's a genuinely occlusive, petrolatum-forward formula: thick, slow to absorb, and built to sit on the skin and slow water loss.

Cetaphil's Moisturising Cream takes a lighter route. Instead of leaning on a heavy ceramide-and-occlusive base, it's formulated with niacinamide and panthenol for barrier comfort, plus glycerin for humectant hydration. It absorbs faster and feels less "gloved" on the skin — a real advantage in humid or warmer conditions where a thick cream can feel suffocating within minutes.

## Where SA's climate actually decides this

This is less a "better or worse" question than a "which climate are you fighting" one. Highveld winters — Johannesburg, Pretoria, Bloemfontein — combine low humidity, indoor heating and wind in a way that strips moisture aggressively; CeraVe's heavier, slower-release occlusive formula is built for exactly that fight, and it's the one dermatologists reach for first with eczema or genuinely compromised skin. Durban and coastal Gqeberha summers are the opposite problem — high ambient humidity means a heavy cream can feel greasy and slow to absorb; Cetaphil's lighter, niacinamide-forward formula sits more comfortably there, and doubles as a daytime option under makeup or sunscreen where CeraVe's cream can feel too rich.

## Price and value

At around R429 for 454g, CeraVe works out to roughly 94c per gram. Cetaphil's 550g tub at around R345 is closer to 63c per gram — a genuinely lower cost per use, even before accounting for the larger jar size. Neither is expensive by clinic-brand standards, and both last a long time since a little goes far on the body as well as the face.

## Our take

If your skin is genuinely compromised — eczema-prone, post-procedure, or fighting a dry Highveld winter — CeraVe's ceramide-and-MVE formula is the more clinically substantiated pick, and it's the one worth the modest price premium. If you're managing everyday dryness in a warmer or more humid part of the country, or you want something light enough to layer under SPF without pilling, Cetaphil's faster-absorbing formula is the more comfortable daily driver. Plenty of SkinLabs readers keep both: Cetaphil for daytime, CeraVe for the coldest winter nights.`,
    verdicts: [
      { label: "Better for genuinely compromised or eczema-prone skin", text: "CeraVe Moisturising Cream — ceramides and MVE technology are built for a slow, sustained barrier-repair release." },
      { label: "Better for humid coastal climates or daytime wear", text: "Cetaphil Moisturising Cream — a lighter, faster-absorbing formula that doesn't feel heavy under SPF or makeup." },
      { label: "Better value per gram", text: "Cetaphil, at roughly 63c/g against CeraVe's 94c/g at typical SA retail pricing." },
      { label: "Better for the coldest Highveld winter nights", text: "CeraVe — its occlusive, petrolatum-forward base is the stronger overnight barrier seal." },
    ],
    keyTakeaways: [
      "CeraVe's Moisturising Cream uses three ceramides plus patented MVE technology for a slow-release, highly occlusive barrier repair formula.",
      "Cetaphil's Moisturising Cream leans on niacinamide, panthenol and glycerin for a lighter, faster-absorbing everyday formula.",
      "SA's climate genuinely matters here: CeraVe suits dry Highveld winters; Cetaphil suits humid coastal summers and daytime layering.",
      "Both are fragrance-free and dermatologist-recommended, but Cetaphil offers a meaningfully lower cost per gram at typical SA pricing.",
    ],
    faqs: [
      { question: "Is CeraVe or Cetaphil better for eczema?", answer: "CeraVe's ceramide-and-MVE formula has the stronger clinical positioning for compromised or eczema-prone skin, since ceramides directly replace lipids the barrier is losing. Cetaphil is still a reasonable gentle option, but it's formulated to feel lighter rather than maximally occlusive." },
      { question: "Which one is better for South Africa's coastal humidity?", answer: "Cetaphil's lighter, faster-absorbing formula tends to feel more comfortable in humid conditions like a Durban or Gqeberha summer, where CeraVe's heavier occlusive base can feel slow to sink in." },
      { question: "Can I use CeraVe in summer and Cetaphil in winter, or does it need to be the other way round?", answer: "It's usually the opposite: Cetaphil's lighter formula suits summer and humid climates, while CeraVe's richer, more occlusive cream is better suited to the drier, colder conditions of a Highveld winter." },
      { question: "Are both suitable for sensitive skin and babies?", answer: "Both brands are widely recommended by dermatologists for sensitive skin and are fragrance-free, but always patch-test a new product and check the specific product line, since both brands sell multiple formulas beyond the moisturising creams compared here." },
    ],
    seoTitle: "CeraVe vs Cetaphil Moisturising Cream — SA Shelf Showdown",
    seoDescription:
      "CeraVe Moisturising Cream vs Cetaphil Moisturising Cream: ceramides, MVE technology and niacinamide compared for South Africa's dry Highveld winters and humid coasts.",
  },
  {
    slug: "fundamentals-vs-the-ordinary-niacinamide",
    title: "Fundamentals vs The Ordinary: Niacinamide Serums, Compared",
    dek: "SA's no-frills 6% niacinamide against DECIEM's 10% + zinc benchmark — concentration, texture and Rand value for local skin.",
    saContext: "Niacinamide",
    publishDate: "2026-08-30",
    modifiedDate: "2026-08-30",
    readingTime: "5 min read",
    thumbnail: {
      url: "https://images.unsplash.com/photo-1710410815589-dd83514104d0?auto=format&fit=crop&w=1600&q=80",
      alt: "A glass skincare serum bottle with a black cap and silver dropper, representing a niacinamide serum comparison",
      creditName: "Muhammad Sulyman",
      creditUrl: "https://unsplash.com/@msulyman",
    },
    productsCompared: [
      {
        name: "6% Niacinamide Serum",
        brand: "Fundamentals",
        priceZar: 129,
        reviewSlug: "fundamentals-niacinamide-6",
        officialBrandUrl: "https://fundamentalsskincare.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "Niacinamide 10% + Zinc 1%",
        brand: "The Ordinary",
        priceZar: 169,
        reviewSlug: "ordinary-niacinamide-zinc",
        officialBrandUrl: "https://theordinary.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
    ],
    bodyMarkdown: `## The benchmark, and the local challenger daring to undercut it

The Ordinary's [Niacinamide 10% + Zinc 1%](/reviews/ordinary-niacinamide-zinc) is arguably the single most recognisable niacinamide serum on the planet — the product that introduced a generation of skincare buyers to the idea that a R169 bottle could hold its own against far pricier brightening and oil-control actives. [Fundamentals' 6% Niacinamide Serum](/reviews/fundamentals-niacinamide-6) is the local answer: a South African brand betting that a gentler concentration, done cleanly, beats chasing the same double-digit number everyone else quotes.

## Concentration isn't the whole story

Niacinamide research generally supports meaningful benefit from 2% up to around 5%, with returns flattening — and irritation risk rising for reactive skin — above that. The Ordinary's 10% is formulated for shoppers who specifically want a stronger, more assertive oil-control and pore-refining effect, backed by 1% zinc PCA for extra sebum regulation. Fundamentals' 6% sits closer to the well-evidenced sweet spot: enough concentration to genuinely work on tone, texture and oil control, without the pilling or tingling that a minority of users report from The Ordinary's higher-strength, isoceteth-forward vehicle.

## Texture and how each one wears in SA conditions

The Ordinary's serum has a slightly tacky, viscous finish that can pill under sunscreen or makeup for some skin types — more noticeable in humid coastal conditions where products sit on the skin longer before absorbing. Fundamentals' formula, built around niacinamide alongside hyaluronic acid crosspolymer and panthenol, tends to sink in faster and layer more comfortably, which matters in a Durban or Gqeberha summer when every extra minute of tackiness before SPF feels like a lot.

## Who actually needs the stronger 10%

If you're managing genuinely oily, acne-prone or large-pore skin and have used niacinamide before without irritation, The Ordinary's 10% + zinc combination gives you more assertive oil control for a similar price bracket. If you're newer to actives, have reactive or combination skin, or you've found higher-strength niacinamide serums pill or sting in the past, Fundamentals' 6% is the gentler, still-effective starting point — and at R129, it's the cheaper bottle too.

## Our take

This isn't really a quality gap — both are honestly formulated, single-active niacinamide serums doing exactly what the label says. It's a concentration and tolerance decision. Sensitive or first-time actives users should start with Fundamentals; established niacinamide users chasing stronger oil control can reasonably reach for The Ordinary. Either way, niacinamide plays well under sunscreen and pairs safely with most other actives, including retinoids and vitamin C.`,
    verdicts: [
      { label: "Better for sensitive or first-time niacinamide users", text: "Fundamentals 6% Niacinamide — a gentler, well-evidenced concentration with less pilling risk." },
      { label: "Better for stronger oil control on established actives users", text: "The Ordinary Niacinamide 10% + Zinc — a more assertive concentration with added zinc PCA." },
      { label: "Better value", text: "Fundamentals, at R129 versus The Ordinary's R169 for a comparable single-active serum." },
      { label: "Better texture for humid coastal climates", text: "Fundamentals — its lighter finish tends to layer more comfortably under sunscreen in humidity." },
    ],
    keyTakeaways: [
      "Fundamentals' 6% niacinamide sits within the well-evidenced 2–5% sweet spot for tolerance; The Ordinary's 10% + zinc is formulated for more assertive oil control.",
      "The Ordinary's vehicle can pill or feel tacky for some users, particularly in humid conditions; Fundamentals' formula tends to absorb faster.",
      "Fundamentals is the cheaper bottle at R129 versus The Ordinary's R169, undercutting the category benchmark on price as well as concentration.",
      "Neither replaces sunscreen — niacinamide is a supporting active for tone and oil control, not sun protection.",
    ],
    faqs: [
      { question: "Is 10% niacinamide better than 6%?", answer: "Not automatically. Research generally supports meaningful benefit from 2–5% niacinamide, with returns flattening above that. A higher concentration like 10% can give more assertive oil control for established actives users, but it also raises irritation risk for reactive or first-time users." },
      { question: "Why does The Ordinary's niacinamide serum pill under other products?", answer: "Some users report a tacky, viscous finish from the vehicle in The Ordinary's formula, which can cause pilling when layered under sunscreen or makeup, especially in humid conditions. Applying a thin layer and waiting for full absorption before the next step usually helps." },
      { question: "Can I switch from Fundamentals to The Ordinary once my skin builds tolerance?", answer: "Yes — a common approach is starting with a gentler concentration like Fundamentals' 6% for a few weeks, then moving up to The Ordinary's 10% + zinc formula if your skin has tolerated niacinamide well and you want stronger oil control." },
      { question: "Which is better value for South African buyers?", answer: "Fundamentals is the cheaper bottle at R129 against The Ordinary's R169, and both are widely stocked at mainstream SA retailers like Clicks, making Fundamentals the stronger pick on pure Rand value." },
    ],
    seoTitle: "Fundamentals vs The Ordinary Niacinamide Serum — SA Shelf Showdown",
    seoDescription:
      "Fundamentals 6% Niacinamide vs The Ordinary Niacinamide 10% + Zinc: concentration, texture and Rand value, compared for South African skin.",
  },
  {
    slug: "skin-functional-vs-standard-beauty-niacinamide",
    title: "Skin Functional vs Standard Beauty: Niacinamide Stacks, Compared",
    dek: "A multi-active niacinamide complex against a straightforward 10% serum — which pharmacy-aisle option actually earns its shelf space?",
    saContext: "Budget Actives",
    publishDate: "2026-08-30",
    modifiedDate: "2026-08-30",
    readingTime: "5 min read",
    thumbnail: {
      url: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=1600&q=80",
      alt: "A white dropper bottle of skincare serum on a plain white surface, representing a niacinamide serum comparison",
      creditName: "Content Pixie",
      creditUrl: "https://unsplash.com/@contentpixie",
    },
    productsCompared: [
      {
        name: "10% Niacinamide + NAG + Succinic + Zinc",
        brand: "Skin Functional",
        priceZar: 175,
        reviewSlug: "sf-niacinamide-nag-succinic",
        officialBrandUrl: "https://skinfunctional.com",
        retailer: { label: "Shop at Dis-Chem", url: "https://www.dischem.co.za/" },
      },
      {
        name: "10% Niacinamide Serum",
        brand: "Standard Beauty",
        priceZar: 165,
        reviewSlug: "sb-niacinamide-10",
        officialBrandUrl: "https://standardbeauty.co.za",
        retailer: { label: "Shop at Dis-Chem", url: "https://www.dischem.co.za/" },
      },
    ],
    bodyMarkdown: `## Same headline number, very different ingredient decks

Both of these serums lead with 10% niacinamide, and both sit within a R10 gap of each other at the till. On paper that makes this an easy pick-either call. It isn't, because [Skin Functional's version](/reviews/sf-niacinamide-nag-succinic) isn't just niacinamide — it stacks acetyl glucosamine (NAG), succinic acid and zinc PCA around the headline active, while [Standard Beauty's serum](/reviews/sb-niacinamide-10) keeps things deliberately single-minded.

## What the extra actives in Skin Functional's stack actually do

Acetyl glucosamine has published research suggesting it works synergistically with niacinamide on tone and texture — it's the same combination Olay built an entire pigmentation-focused product line around. Succinic acid brings mild antimicrobial, sebum-regulating properties that pair naturally with an oil-control formula, and zinc PCA adds a second layer of sebum management on top of what niacinamide itself does. Combined, this reads as a genuinely acne- and pore-focused formula, not just a brightening serum that happens to include niacinamide.

## The case for Standard Beauty's simpler formula

There's real value in a single-active approach: fewer ingredients means fewer variables if your skin reacts, and it's easier to know exactly what's doing the work. Standard Beauty's straightforward 10% niacinamide serum is a clean, well-evidenced formula without the added complexity — a sensible pick if you're layering niacinamide alongside several other actives already and don't want more ingredients competing for attention in your routine.

## Which one actually suits acne-prone or oily skin better

If breakouts, visible pores and persistent oiliness are your main complaint, Skin Functional's stack is the more purpose-built formula — the NAG-succinic-zinc combination is doing real, complementary work alongside the niacinamide rather than sitting there as filler. Standard Beauty's serum still helps with oil control and tone through niacinamide alone, but it's a broader-purpose formula rather than a targeted acne-and-pore serum.

## Price and value

At R175 versus R165, the price gap is small enough that it shouldn't be the deciding factor either way. Both are stocked at Dis-Chem and both undercut international niacinamide serums on price while matching or exceeding them on concentration and formulation transparency.

## Our take

Reach for Skin Functional if oiliness, visible pores or occasional breakouts are the actual problem you're solving — the added actives are doing real work, not padding the ingredient list. Reach for Standard Beauty if you want a clean, single-active niacinamide serum to slot into an already-full routine without adding more variables. Either is a legitimately good R150–R200 niacinamide serum, and neither requires you to import anything to get it.`,
    verdicts: [
      { label: "Better for acne-prone or oily, pore-visible skin", text: "Skin Functional — the NAG, succinic acid and zinc stack adds genuinely complementary oil-control actives." },
      { label: "Better for a simple, single-active routine", text: "Standard Beauty — a clean 10% niacinamide serum without added variables." },
      { label: "Better value for the ingredient list", text: "Skin Functional, at only R10 more for three additional evidence-backed actives." },
      { label: "Better for sensitive skin wary of multi-active formulas", text: "Standard Beauty — fewer ingredients to react to if your skin is easily irritated." },
    ],
    keyTakeaways: [
      "Both serums lead with 10% niacinamide, but Skin Functional adds NAG, succinic acid and zinc PCA for a more targeted acne-and-pore formula.",
      "Standard Beauty keeps its formula to niacinamide alone, which suits layering into an already busy routine or sensitive skin.",
      "The price gap between the two (R175 vs R165) is small enough that formula fit should decide, not cost.",
      "Both are well-evidenced, pharmacy-accessible alternatives to pricier imported niacinamide serums.",
    ],
    faqs: [
      { question: "Is a multi-active niacinamide serum better than a single-active one?", answer: "Not automatically — it depends on your skin concern. Skin Functional's added NAG, succinic acid and zinc genuinely complement niacinamide for oil control and acne, but Standard Beauty's simpler formula is a sound choice if you want fewer variables or are already using several other actives." },
      { question: "Can I use either of these with a vitamin C serum or retinoid?", answer: "Yes. Niacinamide is broadly compatible with vitamin C and retinoids and is commonly layered alongside both — apply from thinnest to thickest texture and introduce new actives one at a time to monitor for irritation." },
      { question: "Which is better for oily, acne-prone skin specifically?", answer: "Skin Functional's stack is the more purpose-built option for oiliness, visible pores and occasional breakouts, since succinic acid and zinc PCA add extra sebum-regulating action alongside the niacinamide." },
      { question: "Are these serums suitable for daily use?", answer: "Yes, both are formulated for twice-daily use under sunscreen in the morning and a moisturiser at night. As with any new active, patch-test first and introduce gradually if you have sensitive or reactive skin." },
    ],
    seoTitle: "Skin Functional vs Standard Beauty Niacinamide — SA Shelf Showdown",
    seoDescription:
      "Skin Functional's NAG-succinic-zinc niacinamide stack vs Standard Beauty's 10% niacinamide serum: formulation, oil control and Rand value, compared.",
  },
  {
    slug: "bio-oil-vs-portia-m-tissue-oil",
    title: "Bio-Oil vs Portia M: SA Tissue Oils for Scars & Dry Skin, Compared",
    dek: "The household-name scar oil against Portia M's marula tissue oil — mineral oil bases, fragrance and real body-skin performance.",
    saContext: "Body Oils",
    publishDate: "2026-08-30",
    modifiedDate: "2026-08-30",
    readingTime: "5 min read",
    thumbnail: {
      url: "https://images.unsplash.com/photo-1637523783035-bcda83e8bff7?auto=format&fit=crop&w=1600&q=80",
      alt: "A glass body oil bottle with dropper on a neutral background, representing a tissue oil comparison",
      creditName: "Alia Hasan",
      creditUrl: "https://unsplash.com/@aliahasan",
    },
    productsCompared: [
      {
        name: "Skincare Oil (Original) 60ml",
        brand: "Bio-Oil",
        priceZar: 155,
        reviewSlug: "biooil-original-60ml",
        officialBrandUrl: "https://www.bio-oil.com",
        retailer: { label: "Shop at Dis-Chem", url: "https://www.dischem.co.za/" },
      },
      {
        name: "Marula Skin (Tissue) Oil",
        brand: "Portia M",
        priceZar: 162,
        reviewSlug: "portiam-marula-tissue-oil",
        officialBrandUrl: "https://portiamss.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
    ],
    bodyMarkdown: `## Two familiar bottles, one shared secret

[Bio-Oil](/reviews/biooil-original-60ml) and [Portia M's Marula Tissue Oil](/reviews/portiam-marula-tissue-oil) sit in the same category of South African medicine-cabinet staples — the bottle you reach for on stretch marks, scars and generally dry, rough body skin. What most buyers don't realise is that both are built on the same foundation: paraffinum liquidum, better known as mineral oil, with a signature botanical extra layered on top.

## Reading past the marketing

Bio-Oil's formula centres on retinyl palmitate (a vitamin A derivative) and calendula oil alongside its mineral oil base, and it's the more clinically documented of the two — a brand-commissioned proDERM Institute randomised controlled trial reported 66% of subjects showing significant scar improvement after two weeks, rising to 92% at eight weeks. That's brand-funded research rather than independent peer review, but it's more formal evidence than most body oils on the shelf offer.

Portia M's Marula Tissue Oil is worth an honesty flag: despite the marula-forward branding, this is a mineral oil base with marula seed oil added, not a pure marula oil product. That's not a dealbreaker — mineral oil is an effective, well-tolerated occlusive for dry, non-acne-prone skin — but it does mean you're paying primarily for a very well-established base ingredient with a smaller proportion of the marketed hero extract.

## Fragrance, and who should be cautious

Both products are fragranced, which matters if you're using either near the face or on genuinely acne-prone or reactive skin — fragrance is a common irritant, and mineral-oil-based formulas can feel heavy or occlusive enough to contribute to breakouts on already oily skin. For body use on dry, non-reactive skin, neither is a concern; for facial or highly sensitive use, both deserve caution.

## Price and value

At R155 for 60ml, Bio-Oil costs roughly R2.58/ml. Portia M's 162 rand price for its bottle works out only marginally different per ml depending on pack size at your retailer — close enough that value comes down to whether you want Bio-Oil's more documented clinical positioning or Portia M's locally accessible, marula-branded alternative at a comparable price.

## Our take

If scar and stretch-mark improvement with some published (if brand-funded) evidence behind it matters most to you, Bio-Oil is the better-supported choice. If you're simply after an effective, affordable body oil for everyday dryness and don't mind that "marula" is more of a co-star than the lead ingredient, Portia M performs a very similar job at a similar price. Either way: patch-test on fragrance-sensitive or acne-prone skin first, and keep both off the face if you're breakout-prone.`,
    verdicts: [
      { label: "Better documented for scars and stretch marks", text: "Bio-Oil — a brand-funded proDERM Institute RCT reports meaningful improvement from two weeks onward." },
      { label: "Better if you want a locally accessible marula-branded option", text: "Portia M Marula Tissue Oil — comparable performance at a similar price, widely stocked at Clicks and Dis-Chem." },
      { label: "Better for acne-prone or facial use", text: "Neither — both are fragranced mineral-oil formulas better suited to body skin than the face." },
      { label: "Better value per ml", text: "Roughly comparable — the small price gap between the two isn't decisive either way." },
    ],
    keyTakeaways: [
      "Both Bio-Oil and Portia M's Marula Tissue Oil use a mineral oil (paraffinum liquidum) base, despite different marketing angles.",
      "Bio-Oil has more formal (if brand-funded) clinical trial data behind its scar and stretch-mark claims than Portia M.",
      "Portia M's 'marula' branding is accurate but the marula seed oil is a smaller addition to a mineral-oil base, not the primary ingredient.",
      "Both are fragranced and best confined to body use on dry, non-acne-prone skin rather than the face.",
    ],
    faqs: [
      { question: "Is Bio-Oil actually better than Portia M for scars?", answer: "Bio-Oil has more formal supporting data — a brand-commissioned proDERM Institute trial reported 66% of subjects showing significant scar improvement at two weeks, rising to 92% at eight weeks. Portia M's Marula Tissue Oil is a similar mineral-oil-based formula without equivalent published trial data, though anecdotally many users find it comparably effective." },
      { question: "Is Portia M's Marula Tissue Oil actually made mostly of marula oil?", answer: "No — it's a mineral oil (paraffinum liquidum) base with marula seed oil added, not a pure marula oil product. This is worth knowing if you were specifically shopping for a marula-oil-led formula rather than a mineral-oil one." },
      { question: "Can I use either of these on my face?", answer: "Both are fragranced and mineral-oil-based, which can feel heavy or contribute to breakouts on oily or acne-prone facial skin. They're best kept to body use unless your face is dry and non-reactive, and even then, patch-test first." },
      { question: "Which is the better value option for everyday dry body skin?", answer: "At broadly similar prices per ml, the choice comes down to preference rather than value — Bio-Oil for its more documented scar-focused positioning, Portia M for its accessible, marula-branded everyday alternative." },
    ],
    seoTitle: "Bio-Oil vs Portia M Tissue Oil — SA Shelf Showdown",
    seoDescription:
      "Bio-Oil vs Portia M Marula Tissue Oil: mineral oil bases, fragrance, scar evidence and Rand value, compared for South African body skin.",
  },
];
