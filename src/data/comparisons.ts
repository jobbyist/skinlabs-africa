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
  seoTitle: string;
  seoDescription: string;
}

export const comparisonArticles: ComparisonArticle[] = [
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
