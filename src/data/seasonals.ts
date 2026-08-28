/**
 * Seasonals by SkinLabs: "Skincare for the season you're actually living in."
 * Spring launches as the fully-built flagship (SA heads into spring in September);
 * Summer/Autumn/Winter are lighter, genuinely distinct evergreen hubs. Every
 * product pick references a real, already-published SkinLabs review — never an
 * invented product, score or claim.
 */

export type Season = "spring" | "summer" | "autumn" | "winter";

export interface SeasonalProductPick {
  reviewId: string;
  role: string;
  whyWePickedIt: string;
}

export interface SeasonalPriorityCard {
  title: string;
  description: string;
}

export interface RegionalModule {
  region: "Gauteng" | "KwaZulu-Natal" | "Western Cape" | "Eastern Cape";
  climateContext: string;
  routineNote: string;
}

export interface SeasonalGuideLink {
  label: string;
  description: string;
  href: string;
}

export interface SeasonalWorthKnowing {
  label: "Worth Knowing" | "The Short Version" | "SkinLabs Take" | "Before You Buy";
  text: string;
}

export interface SeasonHub {
  season: Season;
  months: string;
  eyebrow: string;
  h1: string;
  tagline: string;
  vibe: string;
  heroIntro: string;
  quickAnswer: { heading: string; points: string[]; note: string };
  priorityCards: SeasonalPriorityCard[];
  productEdit: { heading: string; picks: SeasonalProductPick[] };
  routine: { am: string[]; pm: string[]; note: string };
  regionalModules: RegionalModule[];
  guidesAndReviews: SeasonalGuideLink[];
  worthKnowing: SeasonalWorthKnowing;
  editorialStandards: string;
  seoTitle: string;
  seoDescription: string;
  publishDate: string;
  modifiedDate: string;
  heroImage: { url: string; alt: string; creditName: string; creditUrl: string };
}

export const seasonHubs: Record<Season, SeasonHub> = {
  spring: {
    season: "spring",
    months: "September – November",
    eyebrow: "SKINLABS SEASONALS",
    h1: "The Spring Reset",
    tagline: "Your skin's waking up. Don't overdo it.",
    vibe: "Your skin's waking up. Don't overdo it.",
    heroIntro:
      "Spring is a transition, not a reason to replace your entire bathroom shelf. As South Africa moves out of winter's dryness into warmer, brighter, more humid months, your skin's needs shift gradually — not overnight. Start with the basics, adjust as you go, prioritise sunscreen, and add anything targeted only where it solves a real problem.",
    quickAnswer: {
      heading: "What should change in your routine this spring?",
      points: [
        "Keep cleansing gentle — don't reach for a stronger cleanser just because the season changed.",
        "Continue moisturising — lighten the texture only if your skin actually starts feeling oilier.",
        "Increase consistency with SPF as outdoor exposure and UV intensity rise.",
        "Adjust texture, not routine, if oil production picks up.",
        "Add targeted actives slowly, one at a time, not all at once.",
      ],
      note: "Individual skin needs vary — this is a starting point, not a prescription.",
    },
    priorityCards: [
      { title: "SPF and increased outdoor exposure", description: "More daylight means more UV exposure. South Africa's UV index runs high year-round, and spring is when most people actually start spending time in it." },
      { title: "Post-winter dryness and barrier support", description: "Highveld winters strip the barrier hard. If your skin still feels tight or flaky, that's barrier repair work, not a reason to add exfoliants." },
      { title: "Oiliness and spring breakouts", description: "Rising humidity can mean more oil and more congestion for some skin types. Adjust texture — lighter gel-creams, an oil-control cleanser — before adding new actives." },
      { title: "Pigmentation prevention", description: "Post-inflammatory marks and sun-triggered pigmentation are common concerns as outdoor exposure rises. Prevention (daily SPF, gentle brightening actives) beats correction." },
      { title: "Lightweight hydration", description: "As it warms up, a rich winter cream can start to feel heavy. A lighter humectant-forward moisturiser usually does the job just as well." },
    ],
    productEdit: {
      heading: "The Spring Edit — 5 products we're looking at right now",
      picks: [
        { reviewId: "sf-spf50-hybrid", role: "Best everyday SPF", whyWePickedIt: "A well-balanced hybrid SPF50 — broad-spectrum daily protection remains the single highest-value step in SA's intense UV environment." },
        { reviewId: "lelive-all-the-shade-spf30", role: "Best sunscreen for oily or acne-prone skin", whyWePickedIt: "100% mineral zinc oxide with a sheer tint and genuinely no white cast across SA skin tones — a mineral option that won't clog congested skin." },
        { reviewId: "sb-moisture-bomb", role: "Best lightweight moisturiser", whyWePickedIt: "A humectant-forward daily gel-cream that layers easily under SPF and works across most SA climate zones." },
        { reviewId: "bioderma-sensibio-h2o", role: "Best gentle cleanser for a routine reset", whyWePickedIt: "The gold-standard gentle micellar cleanser for sensitive skin — a genuine reset if winter left your barrier reactive." },
        { reviewId: "sb-renew-dew-ceramide-butter", role: "Best product for lingering post-winter dryness", whyWePickedIt: "A rich occlusive ceramide balm that's superb for dry Highveld winters — keep it in rotation until your skin actually stops asking for it." },
      ],
    },
    routine: {
      am: ["Gentle cleanse or rinse", "Lightweight moisturiser, if needed", "Broad-spectrum sunscreen"],
      pm: ["Cleanse", "Moisturise", "One targeted treatment only if your skin actually needs it"],
      note: "Introduce any change gradually, one active at a time, and stop anything that causes persistent irritation. If you're reintroducing a retinoid after winter, start at 2–3 nights a week, not daily.",
    },
    regionalModules: [
      { region: "Gauteng", climateContext: "Highveld winters are brutally dry, and spring often arrives as sudden temperature swings and early-season storms rather than a gentle warm-up.", routineNote: "Keep barrier support (ceramides, an occlusive at night) going well into September — don't drop it the moment the calendar changes." },
      { region: "KwaZulu-Natal", climateContext: "Humidity climbs fast on the coast, and heat brings more sweat and oil production earlier than inland regions.", routineNote: "Switch to a lighter gel-cream and an oil-control cleanser sooner than the rest of the country — your 'spring' starts earlier." },
      { region: "Western Cape", climateContext: "Cape spring brings wind alongside warmth, which is genuinely drying on exposed skin even as temperatures rise.", routineNote: "Don't mistake windburn for oiliness — keep a barrier-supporting moisturiser in rotation even if the air feels warmer." },
      { region: "Eastern Cape", climateContext: "Coastal exposure and wind combine with more variable temperatures than KZN or the Cape.", routineNote: "A flexible routine — light moisturiser by day, a touch richer at night — handles the swings better than a single fixed product." },
    ],
    guidesAndReviews: [
      { label: "Winter barrier damage across the Highveld", description: "Why dermatologists reported a spike in barrier flares this winter, and what actually helps.", href: "/newsroom/winter-barrier-highveld" },
      { label: "New SPF labelling guidance", description: "What tighter sunscreen labelling rules mean for the SPF number on your bottle.", href: "/newsroom/sunscreen-labelling-sa" },
      { label: "Niacinamide for hyperpigmentation", description: "The evidence behind pairing niacinamide with tranexamic acid for post-inflammatory marks.", href: "/newsroom/niacinamide-hyperpigmentation-trial" },
      { label: "Retinaldehyde vs retinol", description: "The tolerable retinoid step-up, and why it matters if you're reintroducing actives this spring.", href: "/newsroom/retinal-vs-retinol" },
      { label: "Shelf Showdown: Nimue vs Optiphi retinoids", description: "Comparing two SA clinic-brand retinoids if you're shopping for a spring actives upgrade.", href: "/reviews/versus/nimue-vs-optiphi-retinoid-serums" },
      { label: "Shelf Showdown: Skin Functional vs SkinPhD vitamin C", description: "Budget vs clinic-tier vitamin C serums, compared for pigmentation prevention.", href: "/reviews/versus/skin-functional-vs-skinphd-vitamin-c" },
      { label: "Spotlight by SkinLabs", description: "See which South African skincare brands are behind this season's picks, ranked by real review scores.", href: "/spotlight" },
    ],
    worthKnowing: {
      label: "Worth Knowing",
      text: "Spring is not a legally binding instruction to buy six new serums. Change what needs changing. Keep what still works. Wear the sunscreen.",
    },
    editorialStandards:
      "Every Spring Edit pick links to a full SkinLabs review, selected using our editorial criteria, ingredient and formulation analysis and available evidence — not brand submissions or paid placement. If SkinLabs ever receives a product, commission or other benefit connected to a pick, we disclose it clearly here and in the linked review.",
    seoTitle: "Spring Skincare Routine South Africa | SkinLabs Seasonals",
    seoDescription: "Reset your skincare routine for spring in South Africa. Practical SPF, hydration, breakout and post-winter skin advice from SkinLabs, with real reviewed product picks.",
    publishDate: "2026-08-28",
    modifiedDate: "2026-08-28",
    heroImage: {
      url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1600&q=75",
      alt: "Skincare products and a jade roller laid out on a striped towel, evoking a fresh spring routine",
      creditName: "michela ampolo",
      creditUrl: "https://unsplash.com/@mikelina5",
    },
  },

  summer: {
    season: "summer",
    months: "December – February",
    eyebrow: "SKINLABS SEASONALS",
    h1: "Summer Skincare, South African Heat Included",
    tagline: "Your skin has entered summer mode.",
    vibe: "Your skin has entered summer mode.",
    heroIntro:
      "Heat, humidity, sweat and hours more outdoor exposure — SA summer asks more of your skin than any other season, mostly around oil control and sun protection. The routine doesn't need to get more complicated, just lighter and more consistent on SPF.",
    quickAnswer: {
      heading: "What should change in your routine this summer?",
      points: [
        "Switch to a lighter, gel-based moisturiser if your usual cream starts to feel heavy.",
        "Reapply sunscreen — SA's summer UV index is genuinely intense, not just 'sunny weather'.",
        "Add an oil-control cleanser if congestion or shine increases.",
        "Keep actives simple; heat and sweat can make some formulas feel more irritating than usual.",
      ],
      note: "Coastal and inland skin needs diverge more in summer than in any other season — check the regional notes below.",
    },
    priorityCards: [
      { title: "Heat and humidity", description: "More sweat, more oil, more congestion risk — especially along the coast." },
      { title: "Sun exposure", description: "Longer days outdoors mean more cumulative UV, even on overcast days." },
      { title: "Oil control", description: "A lighter moisturiser and an oil-balancing cleanser usually solve more than a new 'treatment' product." },
      { title: "Body care", description: "Don't forget SPF and hydration below the neck — body skin gets just as much sun as your face." },
    ],
    productEdit: {
      heading: "The Summer Edit",
      picks: [
        { reviewId: "sf-salicylic-cleansing-gel", role: "Best oil-control cleanser", whyWePickedIt: "A dependable BHA gel cleanser for oily, breakout-prone skin — especially useful in humid KZN heat." },
        { reviewId: "skincreamery-everyday-cream", role: "Best lightweight, all-climate moisturiser", whyWePickedIt: "A light, all-purpose face and body moisturiser — versatile across most SA climates, including summer humidity." },
        { reviewId: "vitaderm-sun-defence-spf", role: "Best daily SPF for high heat", whyWePickedIt: "A dependable daily SPF from a clinical SA brand — essential protection across all regions, not just the coast." },
        { reviewId: "nimue-skinbiotic-mist", role: "Best midday refresh", whyWePickedIt: "A probiotic soothing mist that's a pleasant refresh in KZN or Cape humidity, without doing much heavy lifting — exactly what a midday reset needs to be." },
      ],
    },
    routine: {
      am: ["Oil-balancing cleanse", "Lightweight gel moisturiser", "Broad-spectrum SPF, reapplied midday if you're outdoors"],
      pm: ["Double cleanse if you've worn sunscreen all day", "Lightweight hydration", "Skip heavy occlusives unless your skin is genuinely dry"],
      note: "If breakouts increase, resist the urge to over-exfoliate — a gentle BHA cleanser plus consistent SPF usually does more than a new acid serum.",
    },
    regionalModules: [],
    guidesAndReviews: [
      { label: "New SPF labelling guidance", description: "What tighter sunscreen labelling rules mean for the SPF number on your bottle.", href: "/newsroom/sunscreen-labelling-sa" },
      { label: "The Spring Reset", description: "Where summer's routine picks up from — see the season before.", href: "/seasonals/spring" },
      { label: "Spotlight by SkinLabs", description: "See which brands are behind this season's picks, ranked by real review scores.", href: "/spotlight" },
    ],
    worthKnowing: {
      label: "The Short Version",
      text: "You probably don't need another serum this summer. You need a lighter moisturiser and sunscreen you'll actually reapply.",
    },
    editorialStandards:
      "Every Summer Edit pick links to a full SkinLabs review, selected using our editorial criteria and available evidence — not brand submissions or paid placement.",
    seoTitle: "Summer Skincare Routine South Africa | SkinLabs Seasonals",
    seoDescription: "Practical summer skincare advice for South African heat and humidity — oil control, SPF and lightweight hydration, with real reviewed product picks.",
    publishDate: "2026-08-28",
    modifiedDate: "2026-08-28",
    heroImage: {
      url: "https://images.unsplash.com/photo-1623676714504-edd78728155e?auto=format&fit=crop&w=1600&q=75",
      alt: "A hand holding a bottle of sunscreen, evoking a summer SPF routine",
      creditName: "Onela Ymeri",
      creditUrl: "https://unsplash.com/@onnela_",
    },
  },

  autumn: {
    season: "autumn",
    months: "March – May",
    eyebrow: "SKINLABS SEASONALS",
    h1: "The Autumn Reset",
    tagline: "Summer's over. Your routine might need a reset.",
    vibe: "Summer's over. Your routine might need a reset.",
    heroIntro:
      "Autumn is the quiet transition season — temperatures start dropping, humidity eases, and whatever summer left behind (sun-triggered marks, a slightly worn barrier from months of sweat and SPF) becomes worth addressing before winter makes it harder.",
    quickAnswer: {
      heading: "What should change in your routine this autumn?",
      points: [
        "Start layering hydration back in as the air dries out.",
        "Address post-summer pigmentation now, before winter dryness makes actives harder to tolerate.",
        "Ease off aggressive exfoliation if your barrier feels at all compromised.",
        "Begin reintroducing richer textures gradually, not all at once.",
      ],
      note: "Autumn is about correction and preparation — fixing what summer left behind, and getting ready for winter.",
    },
    priorityCards: [
      { title: "Post-summer pigmentation", description: "Sun-triggered marks from months of outdoor exposure are common now — gentle, consistent brightening actives help more than a strong single treatment." },
      { title: "Barrier recovery", description: "Months of sweat, SPF and possibly over-exfoliating in summer heat can leave the barrier due for support." },
      { title: "Exfoliation adjustments", description: "If your skin feels at all reactive, this is the season to dial back acids, not add more." },
      { title: "Hydration", description: "As humidity drops, layering a hydrating serum under your moisturiser starts to matter again." },
    ],
    productEdit: {
      heading: "The Autumn Edit",
      picks: [
        { reviewId: "sb-alpha-arbutin-2", role: "Best pigmentation corrector", whyWePickedIt: "A sensible tyrosinase inhibitor for the post-inflammatory hyperpigmentation common in melanin-rich SA skin — pair with daily SPF for best results." },
        { reviewId: "sb-exfoliating-mushroom-serum", role: "Best gentle exfoliant for the transition", whyWePickedIt: "A gentle enzyme-type exfoliant-hydrator built around tremella mushroom — mild efficacy, but a comfortable option for reactive skin." },
        { reviewId: "sb-ha-reneseed-peptides", role: "Best layering hydration serum", whyWePickedIt: "Multi-weight HA plus peptides makes a genuinely good hydrator — pair with an occlusive as the Highveld starts drying out." },
        { reviewId: "sf-liposome-ceramide-barrier", role: "Best barrier-recovery starter", whyWePickedIt: "Liposomal ceramide NP delivers strong barrier support — excellent on the dry Highveld and windy Cape for reactive or over-exfoliated skin." },
      ],
    },
    routine: {
      am: ["Gentle cleanse", "Hydrating serum", "Moisturiser", "Broad-spectrum SPF — still non-negotiable"],
      pm: ["Cleanse", "Barrier-supporting treatment or ceramide serum", "Richer moisturiser as the air dries out"],
      note: "If you're addressing post-summer pigmentation, introduce one brightening active at a time and give it several weeks before judging results.",
    },
    regionalModules: [],
    guidesAndReviews: [
      { label: "Niacinamide for hyperpigmentation", description: "The evidence behind pairing niacinamide with tranexamic acid for post-inflammatory marks.", href: "/newsroom/niacinamide-hyperpigmentation-trial" },
      { label: "Shelf Showdown: Skin Functional vs SkinPhD vitamin C", description: "Budget vs clinic-tier vitamin C serums, compared for pigmentation prevention.", href: "/reviews/versus/skin-functional-vs-skinphd-vitamin-c" },
      { label: "The Winter Reset", description: "Where autumn's barrier prep pays off — see the season ahead.", href: "/seasonals/winter" },
      { label: "Spotlight by SkinLabs", description: "See which brands are behind this season's picks, ranked by real review scores.", href: "/spotlight" },
    ],
    worthKnowing: {
      label: "SkinLabs Take",
      text: "More actives aren't automatically better. Your skin barrier has limits — autumn is for repair, not for stacking five new treatments at once.",
    },
    editorialStandards:
      "Every Autumn Edit pick links to a full SkinLabs review, selected using our editorial criteria and available evidence — not brand submissions or paid placement.",
    seoTitle: "Autumn Skincare Routine South Africa | SkinLabs Seasonals",
    seoDescription: "Reset your skincare routine for autumn in South Africa — post-summer pigmentation, barrier recovery and hydration advice, with real reviewed product picks.",
    publishDate: "2026-08-28",
    modifiedDate: "2026-08-28",
    heroImage: {
      url: "https://images.unsplash.com/photo-1766239303199-b45e6bcdc901?auto=format&fit=crop&w=1600&q=75",
      alt: "An autumn-themed flat lay of skincare cosmetics and magazines",
      creditName: "Stacy",
      creditUrl: "https://unsplash.com/@stacysuxx",
    },
  },

  winter: {
    season: "winter",
    months: "June – August",
    eyebrow: "SKINLABS SEASONALS",
    h1: "The Winter Barrier Reset",
    tagline: "Cold outside. Barrier first.",
    vibe: "Cold outside. Barrier first.",
    heroIntro:
      "South African winter isn't an excuse to retire the sunscreen — CANSA specifically recommends year-round sun protection, since UV exposure remains a real concern even in colder months. Otherwise, winter is squarely about barrier support: cold air, indoor heating and hot showers all strip moisture faster than most people expect, especially on the Highveld.",
    quickAnswer: {
      heading: "What should change in your routine this winter?",
      points: [
        "Switch to a richer, more occlusive moisturiser as the air dries out.",
        "Shorten hot showers and switch to a non-foaming, low-surfactant cleanser.",
        "Pause aggressive acids and retinoids if your skin turns reactive — reintroduce slowly once it settles.",
        "Keep wearing SPF — winter UV is lower, not absent.",
      ],
      note: "Highveld winters are far drier than coastal ones — check the regional notes if you're inland.",
    },
    priorityCards: [
      { title: "Dryness and cold", description: "Low humidity plus indoor heating strips the skin barrier faster than most people realise, especially inland." },
      { title: "Barrier support", description: "Ceramide-rich, occlusive moisturisers do more for winter skin than any active ingredient." },
      { title: "Gentle cleansing", description: "Hot showers and foaming cleansers compound dryness — go shorter, cooler and gentler." },
      { title: "SPF still matters", description: "CANSA's year-round protection guidance applies in winter too — UV exposure doesn't stop because it's cold." },
    ],
    productEdit: {
      heading: "The Winter Edit",
      picks: [
        { reviewId: "lamelle-serra-restore-cream", role: "Best barrier-repair moisturiser", whyWePickedIt: "An excellent, evidence-driven lamellar barrier cream built around patented Ceramide-P — premium priced, but the formulation quality justifies it for compromised skin." },
        { reviewId: "sb-renew-dew-ceramide-butter", role: "Best rich ceramide balm", whyWePickedIt: "A rich occlusive ceramide balm that's superb for dry Highveld winters." },
        { reviewId: "sb-mild-face-wash", role: "Best gentle cold-weather cleanser", whyWePickedIt: "A gentle, low-surfactant cleanser that won't strip compromised or reactive skin — an easy daily staple." },
        { reviewId: "skinphd-spf-day-cream", role: "Best 2-in-1 winter SPF moisturiser", whyWePickedIt: "A daily SPF moisturiser combining hydration and broad-spectrum protection in one step — efficient for cold, dry mornings." },
      ],
    },
    routine: {
      am: ["Gentle, non-foaming cleanse", "Barrier-supporting moisturiser", "SPF — yes, still"],
      pm: ["Cleanse with lukewarm water", "Ceramide-rich occlusive on damp skin", "Pause actives entirely if skin feels reactive or tight"],
      note: "If your usual routine suddenly stings, that's barrier disruption, not a new allergy — simplify for a week or two before troubleshooting further.",
    },
    regionalModules: [
      { region: "Gauteng", climateContext: "Very low relative humidity combined with hot showers and hard water strips the lipid barrier fast — this is where winter hits hardest.", routineNote: "Shorter, cooler showers, a non-foaming cleanser and a ceramide occlusive on damp skin make the biggest difference." },
      { region: "KwaZulu-Natal", climateContext: "Coastal humidity softens winter's edge considerably compared to inland regions.", routineNote: "A standard moisturiser upgrade is usually enough — you likely don't need the heaviest barrier creams on this list." },
      { region: "Western Cape", climateContext: "Winter rainfall and wind bring their own drying effect, even without Gauteng's extreme low humidity.", routineNote: "Watch for windburn on the face — a barrier-supporting moisturiser matters here even on wet days." },
      { region: "Eastern Cape", climateContext: "Coastal exposure and wind combine with genuinely cold snaps inland.", routineNote: "Layer richness by how far inland you are — coastal areas need less than the interior." },
    ],
    guidesAndReviews: [
      { label: "Winter barrier damage across the Highveld", description: "Why dermatologists reported a spike in barrier flares this winter, and what actually helps.", href: "/newsroom/winter-barrier-highveld" },
      { label: "The Spring Reset", description: "Where winter's barrier work pays off — see the season ahead.", href: "/seasonals/spring" },
      { label: "Spotlight by SkinLabs", description: "See which brands are behind this season's picks, ranked by real review scores.", href: "/spotlight" },
    ],
    worthKnowing: {
      label: "Worth Knowing",
      text: "SPF isn't just a summer product. UV exposure happens throughout the year — CANSA recommends year-round protection for exactly this reason.",
    },
    editorialStandards:
      "Every Winter Edit pick links to a full SkinLabs review, selected using our editorial criteria and available evidence — not brand submissions or paid placement.",
    seoTitle: "Winter Skincare Routine South Africa | SkinLabs Seasonals",
    seoDescription: "Barrier-first winter skincare advice for South African cold and dryness — richer moisturisers, gentle cleansing and why SPF still matters, with real product picks.",
    publishDate: "2026-08-28",
    modifiedDate: "2026-08-28",
    heroImage: {
      url: "https://images.unsplash.com/photo-1648203276014-20f97ba1f817?auto=format&fit=crop&w=1600&q=75",
      alt: "A woman applying a rich cream moisturiser, evoking a winter barrier-repair routine",
      creditName: "Kaeme",
      creditUrl: "https://unsplash.com/@hellokaeme",
    },
  },
};

export const getSeasonHub = (season: string): SeasonHub | undefined =>
  season in seasonHubs ? seasonHubs[season as Season] : undefined;

export const allSeasons: Season[] = ["spring", "summer", "autumn", "winter"];
