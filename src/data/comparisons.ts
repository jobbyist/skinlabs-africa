/**
 * Shelf Showdown: SkinLabs' comparison-article franchise, published under /reviews
 * per the Brand Voice and Editorial Publishing Standards. Each entry is an original,
 * editorially independent head-to-head — never a ranked "winner," always a "better
 * for X" breakdown so the reader can match the product to their own skin.
 */

export interface ComparisonLink {
  label: string;
  url: string;
}

export interface ComparedProduct {
  name: string;
  brand: string;
  priceZar: number;
  /** Slug into productReviews, when SkinLabs has a full standalone review for this product. */
  reviewSlug?: string;
  officialProductUrl?: string;
  officialBrandUrl: string;
  retailer?: ComparisonLink;
}

export interface ComparisonVerdict {
  label: string;
  text: string;
}

export interface ComparisonFaq {
  question: string;
  answer: string;
}

export interface ComparisonArticle {
  slug: string;
  title: string;
  dek: string;
  saContext: string;
  publishDate: string;
  modifiedDate: string;
  readingTime: string;
  featured?: boolean;
  thumbnail: {
    url: string;
    alt: string;
    creditName: string;
    creditUrl: string;
  };
  productsCompared: ComparedProduct[];
  /** Markdown body — headings, paragraphs, tables. Rendered with react-markdown + remark-gfm. */
  bodyMarkdown: string;
  verdicts: ComparisonVerdict[];
  keyTakeaways: string[];
  /** Optional on-page FAQ block, rendered as h2/h3 and emitted as FAQPage JSON-LD for AI/Google answer surfaces. */
  faqs?: ComparisonFaq[];
  seoTitle: string;
  seoDescription: string;
}

export const comparisonArticles: ComparisonArticle[] = [
  {
    slug: "best-skincare-products-under-r250-south-africa",
    title: "What Should You Buy Under R250? Five South African Skincare Picks Compared",
    dek: "A consistent routine doesn't need a luxury budget. We round up five sub-R250 South African skincare picks — cleansers, serums and sunscreen — matched to the skin goal each one actually solves.",
    saContext: "Under R250 Budget",
    publishDate: "2026-08-30",
    modifiedDate: "2026-08-30",
    readingTime: "7 min read",
    featured: true,
    thumbnail: {
      url: "https://images.unsplash.com/photo-1785581778868-79100f7fe56c?auto=format&fit=crop&w=1600&q=80",
      alt: "A minimalist flat-lay of affordable skincare products arranged on a marble surface, representing a budget skincare roundup",
      creditName: "Henry Davidson",
      creditUrl: "https://unsplash.com/@henrydavisonny",
    },
    productsCompared: [
      {
        name: "Vitamin C & Brightening Actives Even Tone Foam Cleanser",
        brand: "Clicks Skincare Collection",
        priceZar: 67.99,
        officialBrandUrl: "https://clicks.co.za",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "Vitamin C Even & Bright Serum Cleanser",
        brand: "Garnier",
        priceZar: 90,
        officialBrandUrl: "https://www.garnier.co.za",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "HyaluraGlow Serum",
        brand: "Portia M",
        priceZar: 150,
        reviewSlug: "portiam-hyaluraglow-serum",
        officialBrandUrl: "https://portiamss.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "Super UV Invisible Serum Sunscreen SPF50+",
        brand: "Garnier",
        priceZar: 204,
        officialBrandUrl: "https://www.garnier.co.za",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "VitaGlow Serum",
        brand: "Portia M",
        priceZar: 150,
        reviewSlug: "portiam-vitaglow-serum",
        officialBrandUrl: "https://portiamss.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
    ],
    bodyMarkdown: `## A real routine doesn't need a luxury budget

Building a consistent skincare routine is less about spending big on one hero product and more about covering the basics well — cleanse, treat, protect — without skipping steps because the price tag got in the way. Every product below currently retails under R250 through mainstream South African retailers, making this list a practical starting point for students, first-time skincare buyers, or anyone rebuilding a routine on a tighter budget.

## 1. Clicks Vitamin C & Brightening Actives Cleanser — ~R67.99

The lowest-cost pick on this list. This foam cleanser is designed for cleansing and make-up removal, with soft exfoliating beads and antioxidant-oriented positioning. **Best for:** shoppers who want the cheapest credible brightening-cleanser option, full stop.

## 2. Garnier Vitamin C Even & Bright Serum Cleanser — ~R90

A step up in recognisability rather than price. Built on glycerin and ascorbyl glucoside, marketed around radiance and uneven-looking tone. **Best for:** shoppers who want a well-known brightening-focused cleanser without spending much more than the Clicks option.

## 3. Portia M HyaluraGlow Serum — ~R150

The only leave-on hydration step on this list, and arguably the highest-leverage R150 you can spend here. Glycerin and sodium hyaluronate target moisture retention directly — read the [full SkinLabs review](/reviews/portiam-hyaluraglow-serum) for the complete breakdown. **Best for:** dry, dehydrated or tight-feeling skin, especially through a dry Highveld winter.

## 4. Garnier Super UV Invisible Serum Sunscreen SPF50+ — ~R204

The most expensive item on the list, and arguably the most important. SPF50+ with PA++++ protection in a lightweight, non-greasy, invisible-finish format. **Best for:** daily commuters and anyone who wants high-protection sunscreen that doesn't feel like sunscreen.

## 5. Portia M VitaGlow Serum — ~R150

A broader, more active-feeling serum built on baobab fruit extract, panthenol, glycerin and willow bark extract, aimed at blemishes, oiliness and uneven-looking tone. See the [full SkinLabs review](/reviews/portiam-vitaglow-serum) for scores and ingredient detail. **Best for:** shoppers building a more targeted routine around texture and unevenness.

## Best value by skin goal

| Goal | Pick | Price |
| --- | --- | --- |
| Cheapest cleanser | Clicks Vitamin C & Brightening Actives Cleanser | ~R67.99 |
| Recognisable brand cleanser | Garnier Vitamin C Even & Bright Serum Cleanser | ~R90 |
| Hydration / dehydrated skin | Portia M HyaluraGlow Serum | ~R150 |
| Daily sun protection | Garnier Super UV Invisible Serum Sunscreen SPF50+ | ~R204 |
| Texture / uneven tone | Portia M VitaGlow Serum | ~R150 |

## How to actually sequence these under R250

If you're building from zero, a genuinely complete AM routine from this list looks like: cleanse (either cleanser), leave-on serum (HyaluraGlow for hydration or VitaGlow for texture), then Garnier's sunscreen to close it out. That's a full three-step routine for roughly R350–R400 total across two products bought once — the cleanser and serum bottles will outlast several sunscreen tubes, since SPF gets used up fastest with correct, generous daily application.

## Important buying advice

Don't choose a product only because the label says "glow," "brightening" or "serum" — those are marketing words, not ingredient guarantees. Check whether the actual formula matches your concern, whether the texture suits your climate and skin type, and whether you'll realistically use it every day without irritation. Consistency beats concentration: a R90 cleanser used daily outperforms a R900 serum left in a drawer.

## Our take

None of these five needs to be your "forever" product, but each is a legitimate, low-risk way to cover a real step in your routine without derailing a budget. Start with whichever gap in your current routine is biggest — hydration, sun protection, or texture — rather than buying all five at once.`,
    verdicts: [
      { label: "Best overall starting routine", text: "Garnier cleanser + Portia M HyaluraGlow + Garnier sunscreen — a full three-step AM routine under R400 total." },
      { label: "Best single most important buy", text: "Garnier Super UV Invisible Serum Sunscreen SPF50+ — daily SPF has the biggest long-term impact of anything on this list." },
      { label: "Best for dehydrated skin on a budget", text: "Portia M HyaluraGlow Serum — a focused, no-frills hydration step at R150." },
      { label: "Cheapest way into a brightening routine", text: "Clicks Vitamin C & Brightening Actives Cleanser — the lowest price point here at ~R67.99." },
    ],
    keyTakeaways: [
      "All five products retail under R250 through mainstream South African retailers, covering cleansing, hydration, texture and sun protection.",
      "Daily sunscreen (Garnier Super UV Invisible Serum) is arguably the single highest-impact product on this list, despite being the priciest.",
      "A full three-step AM routine — cleanser, serum, sunscreen — is achievable from this list for roughly R350–R400 total.",
      "Marketing language like 'glow' or 'brightening' isn't a substitute for checking whether a formula actually matches your skin concern.",
    ],
    faqs: [
      { question: "What's the most important product to buy first on a tight skincare budget?", answer: "Daily sunscreen. Garnier's Super UV Invisible Serum SPF50+ is the priciest item on this list at ~R204, but consistent SPF use has more long-term impact on skin tone, texture and ageing than any cleanser or serum." },
      { question: "Can I build a full routine for under R250 total?", answer: "Not quite a full three-step routine at once, since the sunscreen alone is ~R204, but any single step — a cleanser, a serum, or the sunscreen — comfortably fits under that budget on its own." },
      { question: "Are budget South African skincare products as effective as expensive imported ones?", answer: "Effectiveness depends on the specific formula and active ingredients, not the price tag alone. Several of the products here use well-evidenced ingredients — ascorbyl glucoside, sodium hyaluronate, SPF50+ filters — at a fraction of premium imported pricing." },
      { question: "How do I know which of these five products my skin actually needs?", answer: "Match the product to your biggest current complaint: tightness or dehydration points to HyaluraGlow, dullness or uneven tone points to either cleanser or VitaGlow, and unprotected daily sun exposure points to the Garnier sunscreen first." },
    ],
    seoTitle: "Best Skincare Products Under R250 in South Africa — SkinLabs Roundup",
    seoDescription:
      "Five South African skincare picks under R250 — cleansers, serums and sunscreen — compared by skin goal, price and where to buy them.",
  },
  {
    slug: "portia-m-hyaluraglow-vs-vitaglow",
    title: "Portia M HyaluraGlow vs VitaGlow: Which Serum Actually Fits Your Routine?",
    dek: "Two Portia M serums, two different jobs. We compare HyaluraGlow's hydration-first formula with VitaGlow's radiance-and-texture positioning to help you pick the right one — or know when you need both.",
    saContext: "Hydration vs Radiance",
    publishDate: "2026-08-29",
    modifiedDate: "2026-08-29",
    readingTime: "5 min read",
    thumbnail: {
      url: "https://images.unsplash.com/photo-1741896135512-084b251887f7?auto=format&fit=crop&w=1600&q=80",
      alt: "A skincare serum bottle and glass dropper resting on a pink surface, representing a hydrating serum comparison",
      creditName: "Maria Lupan",
      creditUrl: "https://unsplash.com/@luandmario",
    },
    productsCompared: [
      {
        name: "HyaluraGlow Serum",
        brand: "Portia M",
        priceZar: 150,
        reviewSlug: "portiam-hyaluraglow-serum",
        officialBrandUrl: "https://portiamss.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "VitaGlow Serum",
        brand: "Portia M",
        priceZar: 150,
        reviewSlug: "portiam-vitaglow-serum",
        officialBrandUrl: "https://portiamss.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
    ],
    bodyMarkdown: `## One brand, two different jobs

Portia M's serum range splits neatly into two priorities: hydration and radiance. [HyaluraGlow](/reviews/portiam-hyaluraglow-serum) is built around moisture retention; [VitaGlow](/reviews/portiam-vitaglow-serum) is built around the appearance of texture, tone and glow. They're not really competing products — they're solving different problems, and plenty of SkinLabs readers will eventually want both in rotation.

## HyaluraGlow: hydration, first and only

HyaluraGlow leans on **glycerin and sodium hyaluronate**, humectants that draw moisture into the skin's surface layers. It's a logical pick for skin that regularly feels tight, rough or dehydrated — a common complaint through a dry Highveld winter, or after a few too many nights with an over-stripping cleanser. Apply it to slightly damp skin and seal with a moisturiser to actually lock the water in; used alone on bone-dry skin, a humectant serum can occasionally pull moisture from deeper layers instead of the air, which is why the follow-up moisturiser step isn't optional.

## VitaGlow: a broader, more active-feeling formula

VitaGlow's ingredient list is more ambitious: **baobab fruit extract, panthenol, glycerin and willow bark extract**. It's marketed toward a wider set of concerns — acne, blemishes, dark marks, oiliness and uneven-looking tone — which makes it feel like a more "active" serum than a purely hydrating one. Willow bark extract contains salicin, a natural precursor related to salicylic acid, though at cosmetic concentrations in a serum like this it should be read as a mild supporting ingredient rather than a standalone acne treatment. Sensitive skin should introduce it gradually — every second night for the first two weeks is a sensible starting point.

## Which serum is right for dry or dehydrated skin?

HyaluraGlow, clearly. Its formula is built almost entirely around humectant hydration, and it layers well under a richer moisturiser during the colder months when Highveld and inland skin tends to feel tightest.

## Which serum is right for oily or blemish-prone skin?

VitaGlow is the better-suited option if your routine already targets blemishes, oiliness or an uneven-looking complexion. It shouldn't be treated as a guaranteed acne treatment on its own — pair it with a gentle cleanser, a lightweight moisturiser and daily sunscreen for the best odds of actually seeing a difference.

## Can you use both?

Yes — and for combination or dehydrated-but-blemish-prone skin, that's often the more sensible answer than picking one. A simple approach: HyaluraGlow in the AM under sunscreen for comfort and plumpness, VitaGlow in the PM where its broader ingredient list has more room to work overnight.

## Price and value

| | HyaluraGlow Serum | VitaGlow Serum |
| --- | --- | --- |
| Price | ~R150 (Clicks/Edgars) | ~R150 (Clicks/Edgars) |
| Core job | Hydration, moisture retention | Radiance, texture, uneven tone |
| Key ingredients | Glycerin, sodium hyaluronate | Baobab extract, panthenol, willow bark |
| Best for | Dry, tight, dehydrated skin | Oily, blemish-prone, uneven-looking skin |

Both sit at the same accessible price point, which makes the choice about skin concern rather than budget.

## Our take

Match the serum to the actual problem, not the more exciting-sounding ingredient list. If dehydration and tightness are your main complaint, HyaluraGlow is the clearer buy. If texture, blemishes and unevenness are the bigger frustration, VitaGlow does more of that work — and there's no real downside to running both if your skin needs a bit of each.`,
    verdicts: [
      { label: "Better for dry or dehydrated skin", text: "HyaluraGlow Serum — a straightforward humectant formula built specifically around moisture retention." },
      { label: "Better for oily, blemish-prone or uneven-toned skin", text: "VitaGlow Serum — a broader active list aimed at texture, tone and blemishes." },
      { label: "Better value if you can only buy one", text: "Either — both sit at the same ~R150 price, so pick by concern, not cost." },
      { label: "Better for a combination routine", text: "Both — HyaluraGlow AM for comfort under sunscreen, VitaGlow PM for its broader ingredient list." },
    ],
    keyTakeaways: [
      "HyaluraGlow is built around glycerin and sodium hyaluronate for hydration; VitaGlow is built around baobab, panthenol and willow bark for texture and tone.",
      "Both serums retail at roughly the same price, so the decision comes down to skin concern rather than budget.",
      "Willow bark extract in VitaGlow is a mild, salicin-based supporting ingredient — not a substitute for a dedicated acne treatment.",
      "Dehydrated but blemish-prone skin can reasonably run both: HyaluraGlow in the AM, VitaGlow in the PM.",
    ],
    faqs: [
      { question: "Can I use Portia M HyaluraGlow and VitaGlow together?", answer: "Yes. A common approach is HyaluraGlow in the morning under sunscreen for hydration and comfort, and VitaGlow in the evening where its broader ingredient list — including willow bark and baobab extract — has more time to work." },
      { question: "Is VitaGlow a proper acne treatment?", answer: "No. It contains willow bark extract, a mild, salicin-based ingredient, but at serum concentrations it should be treated as a supporting step, not a replacement for a dedicated acne treatment or dermatologist guidance for persistent breakouts." },
      { question: "Does HyaluraGlow work without a moisturiser on top?", answer: "It's designed to be layered under a moisturiser. Used alone, especially in a dry climate or air-conditioned room, a humectant serum can occasionally draw moisture from deeper skin layers rather than the air, so sealing it in matters." },
      { question: "Which Portia M serum is better for winter on the Highveld?", answer: "HyaluraGlow is the better fit for the dry, low-humidity conditions typical of a Highveld winter, since it's formulated specifically to address tightness and dehydration." },
    ],
    seoTitle: "Portia M HyaluraGlow vs VitaGlow Serum — SA Shelf Showdown",
    seoDescription:
      "Portia M HyaluraGlow vs VitaGlow serum: hydration, uneven tone, ingredients, skin type fit and value, compared for South African skin.",
  },
  {
    slug: "tocobo-vs-round-lab-sun-serum",
    title: "Tocobo Cica Sun Serum vs Round Lab Camellia Sun Serum: Which K-Beauty SPF Wins in SA?",
    dek: "Two popular Korean sunscreens, two different price points. We compare Tocobo Cica Calming Sun Serum SPF50+ PA++++ with Round Lab Camellia Deep Collagen Firming Sun Serum SPF50 on hydration, finish and Rand value.",
    saContext: "K-Beauty Sun Care",
    publishDate: "2026-08-29",
    modifiedDate: "2026-08-29",
    readingTime: "5 min read",
    thumbnail: {
      url: "https://images.unsplash.com/photo-1686831451322-8d8e234a51e1?auto=format&fit=crop&w=1600&q=80",
      alt: "A tube of skincare cream against a soft pink background, representing a Korean sunscreen comparison",
      creditName: "Natallia Photo",
      creditUrl: "https://unsplash.com/@natallia_jpeg",
    },
    productsCompared: [
      {
        name: "Cica Calming Sun Serum SPF50+ PA++++",
        brand: "Tocobo",
        priceZar: 485,
        officialBrandUrl: "https://tocobo.co.kr",
        retailer: { label: "Shop at Dis-Chem", url: "https://www.dischem.co.za/" },
      },
      {
        name: "Camellia Deep Collagen Firming Sun Serum SPF50",
        brand: "Round Lab",
        priceZar: 780,
        officialBrandUrl: "https://round-lab.com",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
    ],
    bodyMarkdown: `## Why K-beauty sunscreens caught on in SA

Korean sunscreens built a local following because so many combine genuinely high UV protection with cosmetically elegant, lightweight textures — a real point of difference from some older-generation Western SPF formulas that still lean thick or chalky. **Tocobo Cica Calming Sun Serum SPF50+ PA++++** and **Round Lab Camellia Deep Collagen Firming Sun Serum SPF50** are two of the more accessible entries into that category through South African retailers.

## Two different skincare-forward personalities

Tocobo builds its case around **Centella Asiatica, aloe vera and hyaluronic acid** — an ingredient list aimed squarely at calming and hydrating, positioned closer to a soothing serum than a conventional sunscreen. Round Lab's Camellia Deep Collagen formula leans into a **firming, radiance-focused finish**, marketed around daily protection plus a refreshed, dewy look rather than a purely calming one.

## Which is better for dehydrated skin?

Both lean on hydration in their marketing, but Tocobo tells a clearer ingredient-led story — Centella Asiatica and hyaluronic acid are both well-established for supporting moisture and calming visible redness. If dehydration and a reactive complexion are your main concerns, Tocobo is the more straightforward pick.

## Which is better for a glow-focused finish?

Round Lab is built to leave skin looking refreshed and naturally radiant rather than flat-matte or purely invisible. If you want your sunscreen to read as a finishing skincare step rather than just protection, Round Lab's positioning is more aligned with that goal.

## Which is better value?

The price gap here is substantial — Round Lab costs roughly 60% more than Tocobo at current South African retail pricing. That premium buys a specific finish and firming positioning, not meaningfully more UV protection; both are labelled SPF50 or above with high UVA cover.

## Price and value

| | Tocobo Cica Calming Sun Serum | Round Lab Camellia Sun Serum |
| --- | --- | --- |
| Price | ~R485 at Dis-Chem | ~R780 at Clicks |
| SPF | SPF50+ PA++++ | SPF50 |
| Positioning | Calming, hydration-led | Firming, radiance-led |
| Best for | Sensitive, dehydrated skin | Skincare-forward daily-wear finish |

## Our take

Texture and finish preference should decide this one more than the price tag — paying more doesn't automatically mean better protection. Choose Tocobo for a lower-cost, calming, hydration-focused sunscreen. Choose Round Lab if a premium, glow-forward skincare feel is worth the extra spend to you.`,
    verdicts: [
      { label: "Better value for daily SPF", text: "Tocobo Cica Calming Sun Serum — high protection with a calming, hydrating texture at roughly 60% of Round Lab's price." },
      { label: "Better for a radiant, skincare-forward finish", text: "Round Lab Camellia Sun Serum — positioned around a refreshed, dewy look rather than a purely functional finish." },
      { label: "Better for sensitive or easily reddened skin", text: "Tocobo — its Centella Asiatica and aloe vera formula is built with calming in mind." },
      { label: "Better if budget isn't the deciding factor", text: "Round Lab, for shoppers who prioritise a premium texture over price." },
    ],
    keyTakeaways: [
      "Tocobo positions itself around calming and hydration with Centella Asiatica and hyaluronic acid; Round Lab positions itself around a firming, radiant finish.",
      "Round Lab costs roughly 60% more than Tocobo at current SA retail pricing, without a meaningful jump in UV protection.",
      "Both are SPF50 or higher — the choice should come down to texture and finish preference, not protection level.",
      "Neither should be judged by 'serum' branding alone — consistent application and reapplication matter more than the label.",
    ],
    faqs: [
      { question: "Is Round Lab's sunscreen worth almost double Tocobo's price?", answer: "Not for protection alone — both offer SPF50 or higher with strong UVA cover. The extra cost buys Round Lab's firming, radiance-focused finish and positioning, which is a texture preference rather than a protection upgrade." },
      { question: "Which Korean sunscreen suits sensitive skin better?", answer: "Tocobo's Centella Asiatica and aloe vera-led formula is built with calming in mind, making it the more straightforward pick for sensitive or easily reddened skin. Patch test either before full-face use." },
      { question: "Can I use a Korean sun serum as my only moisturiser?", answer: "Both have hydrating ingredients, but neither is formulated to fully replace a dedicated moisturiser for very dry skin. Layer a lightweight moisturiser underneath if your skin needs more than either sunscreen alone provides." },
      { question: "How much sunscreen should I apply for SPF50 to actually work?", answer: "Most people apply far less than the roughly quarter-teaspoon (about 1.25ml) needed to cover the face for the labelled SPF to hold — under-application is the single biggest reason sunscreens 'underperform' regardless of brand." },
    ],
    seoTitle: "Tocobo vs Round Lab Sun Serum — SA Shelf Showdown",
    seoDescription:
      "Tocobo Cica Sun Serum vs Round Lab Camellia Sun Serum: hydration, finish, skin feel and Rand value, compared for the South African climate.",
  },
  {
    slug: "garnier-vs-tocobo-spf50-sunscreen",
    title: "Garnier Invisible Serum Sunscreen vs Tocobo Cica Sun Serum SPF50+: Which Wins Daily Wear?",
    dek: "An invisible-finish budget sunscreen against a hydrating K-beauty serum-sunscreen. We compare Garnier Super UV Invisible Serum SPF50+ with Tocobo Cica Calming Sun Serum SPF50+ PA++++ on finish, sensitivity and everyday South African use.",
    saContext: "Everyday SPF",
    publishDate: "2026-08-28",
    modifiedDate: "2026-08-28",
    readingTime: "6 min read",
    thumbnail: {
      url: "https://images.unsplash.com/photo-1708642448328-37631ca58d65?auto=format&fit=crop&w=1600&q=80",
      alt: "A tube of sunscreen resting on a knit blue sweater, representing a facial SPF comparison",
      creditName: "Isaac Wolff",
      creditUrl: "https://unsplash.com/@isaacwolff",
    },
    productsCompared: [
      {
        name: "Super UV Invisible Serum Sunscreen SPF50+",
        brand: "Garnier",
        priceZar: 204,
        officialBrandUrl: "https://www.garnier.co.za",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "Cica Calming Sun Serum SPF50+ PA++++",
        brand: "Tocobo",
        priceZar: 485,
        officialBrandUrl: "https://tocobo.co.kr",
        retailer: { label: "Shop at Dis-Chem", url: "https://www.dischem.co.za/" },
      },
    ],
    bodyMarkdown: `## Two very different roads to SPF50+

A facial sunscreen only works if you actually enjoy wearing it enough to apply generously and reapply through the day — which is why finish and feel matter almost as much as the SPF number itself. **Garnier Super UV Invisible Serum Sunscreen SPF50+** and **Tocobo Cica Calming Sun Serum SPF50+ PA++++** both promise high protection, but they get there through very different formulas.

## The core difference

Garnier is built for an invisible, fast-absorbing finish — lightweight, non-greasy, with added vitamin C and SPF50+ / PA++++ protection. Tocobo takes a more skincare-forward approach, built around **Centella Asiatica (cica)**, aloe vera and hydrating ingredients including hyaluronic acid, positioning itself closer to a moisturising serum than a conventional sunscreen.

## Which wears better under makeup?

If you're commuting, working in an office or applying make-up over your SPF, Garnier's invisible finish is the more dependable choice — it's designed to disappear rather than sit as a visible layer. Tocobo's more moisturising, serum-like texture can feel lovely on its own, but it may need a few extra minutes to settle before make-up goes on top. Your foundation and the day's humidity will affect this more than the marketing copy does.

## Which suits sensitive or reactive skin?

Tocobo markets itself as dermatologist-tested for sensitive skin, with cica and aloe vera doing double duty as soothing agents — a reasonable pick if your skin flares easily. That's not a guarantee every face will tolerate it well, so patch test regardless. Garnier can suit sensitive skin too, provided the formula doesn't sting on application; with sunscreen, personal tolerance tells you more than either brand's claims.

## Which suits oily, combination or dehydrated skin?

Garnier's lighter, less greasy finish tends to suit oily and combination skin better, especially through a Highveld summer or a humid coastal afternoon. Tocobo's added hydration makes more sense for combination skin that runs dehydrated, or for drier skin types generally — though anyone with a genuinely oily T-zone may want to go easier on moisturiser underneath it.

## Price and value

| | Garnier Super UV Invisible Serum SPF50+ | Tocobo Cica Calming Sun Serum SPF50+ |
| --- | --- | --- |
| Price | ~R204 at Clicks | ~R485 at Dis-Chem |
| Finish | Invisible, fast-absorbing | Hydrating, serum-like |
| Best suited to | Oily/combination skin, makeup wear | Dehydrated, sensitive or dry skin |
| Standout ingredient | Vitamin C | Centella Asiatica + hyaluronic acid |

Tocobo costs roughly 2.4x more than Garnier — worth knowing before you commit, though price alone shouldn't decide it.

## Our take

Neither the higher price nor the "serum" label guarantees better protection — what matters most is applying enough product and reapplying through the day. Choose Garnier for a budget-conscious, invisible-finish daily SPF. Choose Tocobo if you want a hydrating, soothing texture and don't mind paying more for that experience.`,
    verdicts: [
      { label: "Better budget daily SPF", text: "Garnier Super UV Invisible Serum — a fraction of Tocobo's price with a genuinely invisible finish." },
      { label: "Better for dehydrated or dry skin", text: "Tocobo Cica Calming Sun Serum — hyaluronic acid and cica add moisture most conventional sunscreens skip." },
      { label: "Better under makeup", text: "Garnier — its fast-absorbing, non-greasy finish leaves less residue for foundation to grip onto." },
      { label: "Better for reactive or easily flushed skin", text: "Tocobo — Centella Asiatica and aloe vera are formulated with soothing, sensitive-skin use in mind." },
    ],
    keyTakeaways: [
      "Garnier prioritises an invisible, lightweight finish; Tocobo prioritises hydration through Centella Asiatica and hyaluronic acid.",
      "Tocobo costs roughly 2.4x more than Garnier at current SA retail pricing — a meaningful gap for a daily-use product.",
      "Skin type matters more than brand here: oily/combination skin tends to prefer Garnier, dehydrated or sensitive skin tends to prefer Tocobo.",
      "Reapplication and quantity applied matter more to real-world protection than either formula's texture.",
    ],
    faqs: [
      { question: "Is Tocobo Cica Sun Serum worth the extra cost over Garnier?", answer: "It depends on your skin's hydration needs. If your skin runs dry or reactive, Tocobo's cica and hyaluronic acid formula may justify the premium. For oily or budget-conscious daily wear, Garnier performs the core job of SPF50+ protection for much less." },
      { question: "Can I wear either sunscreen under makeup?", answer: "Yes, though Garnier's invisible, fast-absorbing finish tends to sit better under foundation. Tocobo's more moisturising texture may need a short settling time before makeup application." },
      { question: "Do I still need to reapply if I'm using an SPF50+ serum sunscreen?", answer: "Yes. SPF50+ and PA++++ describe peak protection under lab conditions, not all-day protection from one application. Reapply every two hours of direct sun exposure, or after swimming or heavy sweating." },
      { question: "Which sunscreen suits South Africa's high UV index better?", answer: "Both offer SPF50+ with PA++++ or high UVA protection, which suits South Africa's generally high UV index year-round. The bigger factor is which one you'll actually apply generously and reapply — the more comfortable formula for your skin wins in practice." },
    ],
    seoTitle: "Garnier vs Tocobo SPF50+ Sunscreen — SA Shelf Showdown",
    seoDescription:
      "Garnier Super UV Invisible Serum Sunscreen vs Tocobo Cica Sun Serum SPF50+: finish, hydration, sensitive skin fit and price, compared for SA daily wear.",
  },
  {
    slug: "garnier-vitamin-c-cleanser-vs-clicks-rooibos-cleanser",
    title: "Garnier Vitamin C Cleanser vs Clicks Rooibos Cleanser: Which Suits SA Skin Better?",
    dek: "Two budget-friendly cleansers under R100 — one brightening, one exfoliating. We compare Garnier's Vitamin C Even & Bright Serum Cleanser with the Clicks Rooibos & Anti-Oxidants 3-in-1 Facial Cleanser on texture, tone and everyday fit.",
    saContext: "Budget Cleansers",
    publishDate: "2026-08-28",
    modifiedDate: "2026-08-28",
    readingTime: "5 min read",
    thumbnail: {
      url: "https://images.unsplash.com/photo-1597931752949-98c74b5b159f?auto=format&fit=crop&w=1600&q=80",
      alt: "A cleanser bottle with a pump dispenser on a plain white surface, representing a budget skincare cleanser comparison",
      creditName: "Sincerely Media",
      creditUrl: "https://unsplash.com/@sincerelymedia",
    },
    productsCompared: [
      {
        name: "Vitamin C Even & Bright Serum Cleanser",
        brand: "Garnier",
        priceZar: 90,
        officialBrandUrl: "https://www.garnier.co.za",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
      {
        name: "Rooibos & Anti-Oxidants 3-in-1 Facial Cleanser",
        brand: "Clicks Skincare Collection",
        priceZar: 67.99,
        officialBrandUrl: "https://clicks.co.za",
        retailer: { label: "Shop at Clicks", url: "https://clicks.co.za/" },
      },
    ],
    bodyMarkdown: `## Two ways to clean SA skin for under R100

South African skincare shelves are full of cleansers promising more than a basic wash-off routine. Two accessible, sub-R100 options worth putting side by side are the **Garnier Vitamin C Even & Bright Serum Cleanser** and the **Clicks Skincare Collection Rooibos & Anti-Oxidants 3-in-1 Facial Cleanser** — one built around brightening, the other around a three-in-one cleanse-and-exfoliate format.

## What's actually in the bottle

Garnier's cleanser leans on glycerin, lemon fruit extract and **ascorbyl glucoside** — a stable, water-soluble vitamin C derivative that's gentler on skin than pure L-ascorbic acid, though also less potent gram-for-gram. The Clicks Rooibos cleanser is formulated as a three-in-one product: cleanser, make-up remover and light exfoliant, using rooibos extract — a South African antioxidant staple — alongside physical exfoliating beads.

## Which is better for dullness and uneven tone?

Garnier is the more direct fit if brightening is the goal — the ascorbyl glucoside and citrus extract combination is squarely marketed at uneven-looking tone. That said, a rinse-off cleanser only sits on skin for seconds, so treat it as a supporting step rather than a substitute for a leave-on brightening serum or daily SPF, both of which do far more of the actual work. The Clicks Rooibos cleanser can help lift surface dullness through its exfoliating beads, but physical exfoliation is easy to overdo — skip it on days you're also using a chemical exfoliant or retinoid, and never scrub hard enough to feel friction burn.

## Which is better for combination skin?

The Clicks Rooibos cleanser is positioned for normal-to-combination skin, and its light exfoliation can feel satisfying on a humid Durban or Cape Town summer day when oil and sweat build up fast. Garnier suits shoppers who want a conventional, brightening-first daily cleanser without an exfoliating step baked in — useful if you're already exfoliating elsewhere in your routine and don't want to double up.

## Texture and how they feel in a South African bathroom

Both are rinse-off formats that don't require refrigeration or special storage — a practical plus for Highveld heat or coastal humidity, where more delicate leave-on actives can degrade faster. Garnier foams to a light lather; the Clicks formula has a noticeably grainier feel from its exfoliating beads, which some skin will love and others will find too abrasive for daily use.

## Price and value

| | Garnier Vitamin C Even & Bright Serum Cleanser | Clicks Rooibos & Anti-Oxidants 3-in-1 Cleanser |
| --- | --- | --- |
| Price | ~R90 (on special from R125) | ~R67.99 |
| Format | Brightening rinse-off cleanser | 3-in-1 cleanse, remove make-up, exfoliate |
| Key actives | Ascorbyl glucoside, lemon fruit extract, glycerin | Rooibos extract, exfoliating beads |
| Best for | Even-tone-focused daily cleanse | Budget-friendly cleanse with light exfoliation |

Retail pricing and promotions change often in South Africa — recheck current listings before buying.

## Our take

Neither cleanser replaces a proper leave-on routine, but both are sound, affordable entry points. Choose Garnier if brightening is your main goal and you want a straightforward daily cleanser. Choose the Clicks Rooibos cleanser if you want a budget three-in-one product and your skin tolerates gentle physical exfoliation without turning reactive.`,
    verdicts: [
      { label: "Better for a brightening-focused routine", text: "Garnier Vitamin C Even & Bright Serum Cleanser — built specifically around ascorbyl glucoside and uneven tone." },
      { label: "Better budget-friendly all-in-one", text: "Clicks Rooibos & Anti-Oxidants 3-in-1 Cleanser — cleanses, removes make-up and lightly exfoliates in one step." },
      { label: "Better for reactive or easily irritated skin", text: "Garnier — its rinse-off vitamin C formula skips the physical exfoliation that can aggravate sensitive skin." },
      { label: "Better value per rand", text: "Clicks Rooibos, at roughly R22 less and doing double duty as a light exfoliant." },
    ],
    keyTakeaways: [
      "Garnier's cleanser uses ascorbyl glucoside, a gentle vitamin C derivative, for a brightening-focused rinse-off step.",
      "The Clicks Rooibos cleanser is a 3-in-1 formula with exfoliating beads — effective, but easy to overuse alongside other exfoliants.",
      "Both sit under R100 and don't need special storage, which suits South Africa's heat and humidity swings.",
      "A cleanser is a supporting step, not a replacement for a leave-on brightening serum or daily SPF.",
    ],
    faqs: [
      { question: "Can I use the Garnier Vitamin C cleanser and Clicks Rooibos cleanser together?", answer: "There's no real benefit to alternating two cleansers in the same routine — pick one based on whether you want a straightforward brightening cleanse or a light exfoliating one, and stick with it daily." },
      { question: "Is the Clicks Rooibos cleanser too harsh for sensitive skin?", answer: "Its exfoliating beads can feel abrasive on reactive skin, especially if you're already using a chemical exfoliant or retinoid elsewhere in your routine. Patch test first and avoid scrubbing." },
      { question: "Does a vitamin C cleanser actually brighten skin?", answer: "A rinse-off cleanser has limited contact time, so it's a minor supporting step at best. For visible brightening, pair it with a leave-on vitamin C serum and daily sunscreen." },
      { question: "Which cleanser is better for humid coastal climates like Durban?", answer: "The Clicks Rooibos cleanser's light exfoliation can feel more satisfying in humidity where sweat and oil build up fast, though either cleanser works fine as a twice-daily wash in any SA climate." },
    ],
    seoTitle: "Garnier Vitamin C Cleanser vs Clicks Rooibos Cleanser — SA Shelf Showdown",
    seoDescription:
      "Garnier Vitamin C Even & Bright Serum Cleanser vs Clicks Rooibos 3-in-1 Cleanser: texture, exfoliation, tone and value compared for South African skin.",
  },
  {
    slug: "nimue-vs-optiphi-retinoid-serums",
    title: "Nimue vs Optiphi: SA's Clinic-Brand Retinoids, Compared",
    dek: "Two South African professional skincare houses, two retinoid serums, two very different price tags. We compare Nimue's Retinal Power+ against Optiphi's Active Retinol Serum on actives, evidence and what the extra Rand is actually buying.",
    saContext: "Clinic-Grade Actives",
    publishDate: "2026-08-24",
    modifiedDate: "2026-08-24",
    readingTime: "6 min read",
    featured: true,
    thumbnail: {
      url: "https://images.unsplash.com/photo-1613803745799-ba6c10aace85?auto=format&fit=crop&w=1600&q=80",
      alt: "Two amber skincare serum bottles on a plain background, representing a retinoid serum comparison",
      creditName: "Birgith Roosipuu",
      creditUrl: "https://unsplash.com/@msbirgith",
    },
    productsCompared: [
      {
        name: "Retinal Power+ Serum",
        brand: "Nimue",
        priceZar: 1326,
        reviewSlug: "nimue-retinal-power-plus",
        officialBrandUrl: "https://nimueskin.com",
        retailer: { label: "Find a Nimue stockist", url: "https://nimueskin.com" },
      },
      {
        name: "Active Retinol Serum",
        brand: "Optiphi",
        priceZar: 950,
        reviewSlug: "optiphi-active-retinol-serum",
        officialBrandUrl: "https://optiphi.com",
        retailer: { label: "Find an Optiphi stockist", url: "https://optiphi.com" },
      },
    ],
    bodyMarkdown: `## Two clinic brands, two different retinoids

Nimue and Optiphi are both South African professional skincare houses — the kind of brands you're more likely to meet through a skin therapist or aesthetic clinic than a supermarket shelf. Put their flagship anti-ageing serums side by side, though, and they're not actually using the same active. That's worth knowing before either one leaves your wallet lighter by R950 or R1,326.

## The actives, not just the price

Nimue's [Retinal Power+ Serum](/reviews/nimue-retinal-power-plus) is built around **retinaldehyde** — a retinoid one conversion step closer to retinoic acid than standard retinol, with research suggesting it acts faster and with a gentler irritation profile than an equivalent-strength retinol. Optiphi's [Active Retinol Serum](/reviews/optiphi-active-retinol-serum) pairs **retinol with peptides**, a more conventional (and more common) approach that leans on retinol's long track record plus peptides for a secondary firming effect.

Neither approach is "wrong." Retinaldehyde has some evidence for a shorter adjustment period, which matters if you've tried retinol before and bailed on it during the purge-and-peel phase. Standard retinol has decades more published research behind it and remains the benchmark most other retinoids get measured against.

## Where the price gap actually goes

At R1,326, Nimue's serum costs roughly 40% more than Optiphi's R950 bottle. Some of that is the retinaldehyde itself, which typically costs more to formulate stably than retinol. Some of it is Nimue's clinic-first distribution model, which usually comes with more hand-holding from a trained therapist on how to introduce it into your routine. Optiphi's peptide-retinol combination is the more budget-conscious route into clinic-grade actives, without meaningfully compromising on formulation quality.

## What we'd actually tell a friend

If you've tried retinol before and it wrecked your barrier, Nimue's retinaldehyde is worth the premium — it's formulated for a gentler runway in. If this is your first professional-strength retinoid and you want to keep the clinic-brand experience without the clinic-brand price, Optiphi's version does the job at a meaningfully lower cost per bottle. Either way: this is a PM-only active, and South Africa's UV index makes daily SPF non-negotiable while you're using it — research suggests, don't skip it.`,
    verdicts: [
      { label: "Better for retinoid beginners", text: "Optiphi Active Retinol Serum — a well-evidenced, lower-cost entry into clinic-grade actives." },
      { label: "Better if you've reacted badly to retinol before", text: "Nimue Retinal Power+ — retinaldehyde's evidence points to a gentler adjustment period." },
      { label: "Better value per bottle", text: "Optiphi, at roughly 30% less for a comparable clinic-tier actives serum." },
      { label: "Better if you want in-clinic guidance included", text: "Nimue, whose distribution leans on trained skin therapists talking you through the routine." },
    ],
    keyTakeaways: [
      "Nimue's Retinal Power+ uses retinaldehyde; Optiphi's Active Retinol Serum uses retinol plus peptides — different retinoids, not just different prices.",
      "Retinaldehyde has some evidence for faster action and gentler tolerance, but retinol has the deeper research base overall.",
      "Optiphi is the lower-cost way into clinic-grade retinoids; Nimue's premium buys a gentler runway and more clinic-led guidance.",
      "Both are PM-only actives — daily SPF is non-negotiable alongside either, especially given SA's UV index.",
    ],
    seoTitle: "Nimue vs Optiphi Retinoid Serums — SA Shelf Showdown",
    seoDescription:
      "Nimue Retinal Power+ vs Optiphi Active Retinol Serum: we compare retinaldehyde against retinol-plus-peptides on evidence, tolerance and Rand value.",
  },
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
];

export const getComparison = (slug: string) => comparisonArticles.find((article) => article.slug === slug);
