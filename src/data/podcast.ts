/** Episode cover art lives in /public/podcast/ */
const cover = {
  ep1: "/podcast/ep1-weird-skincare.jpg",
  ep2: "/podcast/ep2-skincare-fails.jpg",
  // Swapped per editorial request: ep4's cover art now runs on ep3, and vice versa.
  // (ep3-ep10 re-encoded PNG -> WebP: same filenames, ~93% smaller, no visible
  // quality loss — see scripts/compress-images.ts's header comment.)
  ep3: "/podcast/ep4-ingredient-drama.webp",
  ep4: "/podcast/ep3-glass-skin.webp",
  ep5: "/podcast/ep5-spf-is-not-optional.webp",
  ep6: "/podcast/ep6-dark-spots-hyperpigmentation.webp",
  ep7: "/podcast/ep7-retinoid-rabbit-hole.webp",
  ep8: "/podcast/ep8-skin-barrier.webp",
  ep9: "/podcast/ep9-melanin-rich-skin.webp",
  ep10: "/podcast/ep10-skincare-or-marketing.webp",
  soon: "/podcast/ep-coming-soon.jpg",
} as const;

export interface PodcastEpisode {
  id: number;
  slug: string;
  title: string;
  image: string;
  thumbnail: string;
  audioFile: string;
  description: string;
  audioScript: string;
  duration: string;
  /** Exact audio length in seconds (ffprobe-verified), used for itunes:duration in the RSS feed. */
  durationSeconds?: number;
  topics: string[];
  publishedAt: string;
  showNotes: string[];
  timestamps: { time: string; seconds: number; label: string }[];
  /**
   * Short, human-edited pull-quotes (not a raw ASR dump — see CLAUDE.md),
   * each anchored to its approximate position in the audio so the episode
   * page can highlight/scroll to the current line during playback.
   */
  transcript: { text: string; seconds: number }[];
  productsMentioned: { name: string; brand: string }[];
  /** Baseline engagement seeds (deterministic). Live counters build on these for auth users. */
  seedPlays: number;
  seedLikes: number;
  seedShares: number;
  /** When true, episode is listed as Coming Soon (no audio yet). Only shown on /podcast. */
  comingSoon?: boolean;
}

/**
 * Fixed per-episode engagement baselines (not computed at runtime, so they
 * stay stable across reloads/deploys). Every published episode starts at a
 * minimum of 3286 plays, with likes/shares randomised proportionally.
 */
const engagementSeed: Record<number, { plays: number; likes: number; shares: number }> = {
  1: { plays: 3677, likes: 440, shares: 218 },
  2: { plays: 4239, likes: 573, shares: 291 },
  3: { plays: 4810, likes: 481, shares: 184 },
  4: { plays: 4778, likes: 486, shares: 171 },
  5: { plays: 3835, likes: 480, shares: 164 },
  6: { plays: 3518, likes: 385, shares: 129 },
  7: { plays: 4945, likes: 540, shares: 179 },
  8: { plays: 4341, likes: 554, shares: 178 },
  9: { plays: 4565, likes: 455, shares: 247 },
};

export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: 1,
    slug: "ep-1-weird-skincare",
    title: "Episode 1: Weird Skincare",
    image: cover.ep1,
    thumbnail: cover.ep1,
    audioFile: "/ep1skinlabs.mp3",
    description:
      "Beef tallow has exploded on TikTok as a \"clean\" skincare miracle. We break down what it actually is, why dermatologists warn it's highly comedogenic for most skin types, and which proven ingredients do the job it claims to.",
    audioScript:
      "Beef tallow is blowing up online as a natural skincare miracle. We unpack what it actually is — mainly a strong occlusive moisturiser — who it might genuinely help, why it's a high comedogenic-risk ingredient for oily, combination and acne-prone skin, and why the trend is spreading regardless of the evidence.",
    duration: "5 min",
    durationSeconds: 293,
    topics: ["Ingredient Science", "Trends"],
    publishedAt: "2026-08-21",
    showNotes: [
      "What beef tallow actually is: a strong occlusive moisturiser, not a treatment",
      "Why dermatologists flag it as highly comedogenic for oily, combination and acne-prone skin",
      "It's sold with zero regulatory oversight — plus the proven alternatives (hyaluronic acid, retinoids) that already do this job",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — the beef tallow trend" },
      { time: "01:03", seconds: 63, label: "What beef tallow actually is" },
      { time: "01:55", seconds: 115, label: "The comedogenic risk and contamination concerns" },
      { time: "03:27", seconds: 207, label: "Why the trend keeps spreading anyway" },
      { time: "04:15", seconds: 255, label: "What actually works instead" },
    ],
    transcript: [
      { text: "Beef tallow is mainly a strong occlusive moisturiser — it forms a barrier on the skin to stop water evaporating, but it isn't a treatment.", seconds: 63 },
      { text: "It's a highly comedogenic ingredient. For oily, combination or acne-prone skin, dermatologists warn it's likely to mean more breakouts and irritation, not less.", seconds: 115 },
      { text: "It's also sold with no regulatory oversight as a skincare product, so there's no standard for purity — one dermatologist warned you could be rubbing bacterial contamination onto your face.", seconds: 115 },
      { text: "The trend is fuelled by the naturalistic fallacy — the assumption that natural automatically means safe — amplified by social media anecdotes rather than evidence.", seconds: 207 },
      { text: "For real barrier repair and anti-ageing benefit, ingredients like hyaluronic acid and retinoids already have the research behind them that tallow doesn't.", seconds: 255 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[1].plays,
    seedLikes: engagementSeed[1].likes,
    seedShares: engagementSeed[1].shares,
  },
  {
    id: 2,
    slug: "ep-2-skincare-fails",
    title: "Episode 2: Skincare Fails",
    image: cover.ep2,
    thumbnail: cover.ep2,
    audioFile: "/ep2skinlabs.mp3",
    description:
      "A hall of fame of skincare industry fails: undisclosed steroids, a fake-review scandal, a sunscreen SPF cover-up and a benzoyl peroxide recall. Then the everyday user errors — over-exfoliation and bad ingredient combos — and how to recover.",
    audioScript:
      "The skincare fails hall of fame: Mario Badescu's undisclosed steroid creams, Sunday Riley's fake-review scandal, a Korean sunscreen SPF cover-up, and benzoyl peroxide's benzene risk. Then the user errors — over-exfoliation and clashing actives — and how to read a label, patch test properly, and recover a compromised barrier.",
    duration: "8 min",
    durationSeconds: 487,
    topics: ["Ingredient Science", "Barrier Repair"],
    publishedAt: "2026-08-28",
    showNotes: [
      "Mario Badescu's undisclosed prescription-strength steroid creams and Sunday Riley's fake-review scandal",
      "The Korean sunscreen \"SPF cover-up\" and why benzoyl peroxide can break down into the carcinogen benzene",
      "The over-exfoliation epidemic, ingredient combos to avoid, and how to read an INCI list and patch test properly",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — the skincare fails hall of fame" },
      { time: "01:00", seconds: 60, label: "Mario Badescu's undisclosed steroid creams" },
      { time: "01:56", seconds: 116, label: "Sunday Riley's fake-review scandal" },
      { time: "02:34", seconds: 154, label: "The Korean sunscreen SPF cover-up" },
      { time: "03:13", seconds: 193, label: "Benzoyl peroxide and the benzene risk" },
      { time: "04:03", seconds: 243, label: "The over-exfoliation epidemic" },
      { time: "04:51", seconds: 291, label: "Ingredients that clash when layered" },
      { time: "06:15", seconds: 375, label: "Becoming a label detective" },
      { time: "07:05", seconds: 425, label: "Patch testing, always" },
    ],
    transcript: [
      { text: "Mario Badescu faced a class-action lawsuit after secretly putting prescription-strength corticosteroids into creams like its healing cream — users reported severe steroid withdrawal and skin thinning.", seconds: 60 },
      { text: "Independent testing found some Korean sunscreens labelled SPF50+ were actually closer to SPF19 — manufacturers were reportedly prioritising a lighter feel over accurate protection.", seconds: 154 },
      { text: "Recent lab findings show benzoyl peroxide can break down into benzene, a known carcinogen, especially when a product is left somewhere hot like a car or bathroom.", seconds: 193 },
      { text: "If your barrier is compromised: stop every active, go back to a gentle cleanser and a bland moisturiser, and patch test anything new for seven to ten days before it touches your face.", seconds: 425 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[2].plays,
    seedLikes: engagementSeed[2].likes,
    seedShares: engagementSeed[2].shares,
  },
  {
    id: 3,
    slug: "ep-3-glass-skin",
    title: "Episode 3: Glass Skin",
    image: cover.ep3,
    thumbnail: cover.ep3,
    audioFile: "/ep3skinlabs.mp3",
    description:
      "Glass skin has gone from K-beauty niche to a global, multi-billion-dollar look. We unpack what dermatologists actually say about chasing it, and the barrier-first counter-trend pushing back against the filtered ideal.",
    audioScript:
      "Glass skin went from K-beauty trend to a global multi-billion-dollar market. We look at what dermatologists say about the real risk of over-exfoliating to chase that look, and the barrier-first, minimalist counter-trend built on protecting your skin instead of polishing it.",
    duration: "5 min",
    durationSeconds: 297,
    topics: ["Hydration", "Trends"],
    publishedAt: "2026-09-04",
    showNotes: [
      "Glass skin's cultural roots in K-beauty and its multi-billion-dollar market growth",
      "Why dermatologists warn that chasing the \"filtered\" look online can drive over-exfoliation and barrier damage",
      "The barrier-first counter-trend: protect the barrier, simplify your routine, and accept real texture as normal",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — glass skin's global rise" },
      { time: "02:18", seconds: 138, label: "What dermatologists actually say" },
      { time: "03:11", seconds: 191, label: "The barrier-first counter-trend" },
      { time: "04:15", seconds: 255, label: "Building your own approach" },
    ],
    transcript: [
      { text: "Glass skin comes from K-beauty and has gone global — searches for it are up more than 250%, with the market chasing that look projected in the tens of billions of dollars.", seconds: 0 },
      { text: "Dermatologists point out that a lot of what you see online comes down to genetics, lighting and filters rather than a routine — and chasing it too hard can mean over-exfoliating and damaging your barrier.", seconds: 138 },
      { text: "The counter-trend rests on three ideas: protect your skin's barrier first, keep your routine simple instead of stacking ten products, and treat real texture and pores as normal, not flaws to fix.", seconds: 191 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[3].plays,
    seedLikes: engagementSeed[3].likes,
    seedShares: engagementSeed[3].shares,
  },
  {
    id: 4,
    slug: "ep-4-ingredient-drama",
    title: "Episode 4: Ingredient Drama",
    image: cover.ep4,
    thumbnail: cover.ep4,
    audioFile: "/ep4skinlabs.mp3",
    description:
      "The essential skincare chemistry class: the layering rules that actually matter, real power-couple ingredients, the dangerous duos to never mix, and the damage-control routine if you've overdone it.",
    audioScript:
      "The rules for layering skincare: thinnest to thickest, lowest pH to highest, water before oil. Real power couples like vitamin C, E and ferulic acid, and retinol's soothing sidekicks. The dangerous duos to keep apart, like retinol with AHAs or BHAs. And the damage-control routine if your barrier is compromised.",
    duration: "7 min",
    durationSeconds: 438,
    topics: ["Retinoids 101", "Ingredient Science"],
    publishedAt: "2026-09-11",
    showNotes: [
      "The three layering rules: thinnest-to-thickest, lowest-to-highest pH, and water-based before oil-based",
      "Real power couples — vitamin C, E and ferulic acid; retinol with niacinamide and hyaluronic acid — plus the \"sandwich technique\" for sensitive skin",
      "Dangerous duos to never mix (retinol with AHA/BHA acids, benzoyl peroxide with retinol or vitamin C) and the damage-control routine if you've overdone it",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — why layering order matters" },
      { time: "00:58", seconds: 58, label: "The golden rules: thin-to-thick, low-to-high pH, water before oil" },
      { time: "02:35", seconds: 155, label: "Power couples and the sandwich technique" },
      { time: "04:06", seconds: 246, label: "Dangerous duos to never mix" },
      { time: "05:27", seconds: 327, label: "Damage control if you've overdone it" },
      { time: "06:26", seconds: 386, label: "Three rules to remember" },
    ],
    transcript: [
      { text: "Layer thinnest to thickest and lowest pH to highest — a low-pH vitamin C applied after a higher-pH niacinamide can end up cancelling the vitamin C out.", seconds: 58 },
      { text: "Vitamin C, vitamin E and ferulic acid are a real trio: ferulic acid helps stabilise vitamin C, and together they can boost its defence against environmental damage.", seconds: 155 },
      { text: "Retinol paired with an AHA or BHA acid on the same night is one of the fastest ways to over-exfoliate and damage your barrier — alternate them on different nights instead.", seconds: 246 },
      { text: "If your barrier is compromised, stop every active — no retinol, no acids, no vitamin C — and rebuild with a gentle cleanser, a bland moisturiser and SPF. It can take weeks to fully recover.", seconds: 327 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[4].plays,
    seedLikes: engagementSeed[4].likes,
    seedShares: engagementSeed[4].shares,
  },
  {
    id: 5,
    slug: "ep-5-spf-is-not-optional",
    title: "Episode 5: SPF Is Not Optional",
    image: cover.ep5,
    thumbnail: cover.ep5,
    audioFile: "/ep5skinlabs.mp3",
    description:
      "Sunscreen is the one non-negotiable in this deep dive on SPF, UVA vs UVB, reapplication, why melanin-rich skin still needs daily protection, and how it all connects to hyperpigmentation and the retinoid rabbit hole. Because “I don’t burn” isn’t the same as “I’m protected.”",
    audioScript:
      "Sun protection is the bedrock topic of this deep dive: the physics of UVA versus UVB, why chemical sunscreen needs reapplying, and why melanin-rich skin still needs daily SPF. It connects into hyperpigmentation and the retinoid rabbit hole, and closes on why a routine has to be built for the climate you actually live in.",
    duration: "18 min",
    durationSeconds: 1109,
    topics: ["Sun Protection", "Ingredient Science"],
    publishedAt: "2026-09-18",
    showNotes: [
      "Why \"I don't burn\" isn't the same as \"I'm protected\" — the physics of UVA (deep, silent, ageing) vs UVB (surface, burns)",
      "Chemical sunscreen molecules degrade as they absorb UV — why reapplication after about two hours isn't optional",
      "How unprotected UVA exposure feeds post-inflammatory hyperpigmentation and undermines barrier-damaging retinoid use",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — the 12-step routine and \"skin intelligence\"" },
      { time: "04:57", seconds: 298, label: "Sun protection: the bedrock topic" },
      { time: "06:44", seconds: 405, label: "UVA vs UVB: the \"silent agers\"" },
      { time: "08:11", seconds: 492, label: "Why sunscreen needs reapplying" },
      { time: "10:26", seconds: 626, label: "Melanin-rich skin and hyperpigmentation" },
      { time: "12:29", seconds: 749, label: "The retinoid rabbit hole and barrier damage" },
      { time: "17:24", seconds: 1044, label: "Building a routine for your actual climate" },
    ],
    transcript: [
      { text: "\"I don't burn\" isn't the same as \"I'm protected\" — melanin defends against UVB, the rays that cause visible sunburn, but UVA penetrates straight to the dermis without any warning sign.", seconds: 298 },
      { text: "UVA rays generate free radicals that activate enzymes called matrix metalloproteinases, which break down collagen and elastin — that's the slow, invisible ageing UVA causes regardless of skin tone.", seconds: 405 },
      { text: "Chemical sunscreens absorb UV energy and convert it to heat, but that process uses the molecules up — after about two hours of sun exposure, the \"sponge\" is full and needs reapplying.", seconds: 492 },
      { text: "Unprotected UV exposure keeps triggering melanocytes to produce pigment, which is why treating a dark mark without daily sunscreen means fighting a losing battle.", seconds: 626 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[5].plays,
    seedLikes: engagementSeed[5].likes,
    seedShares: engagementSeed[5].shares,
  },
  {
    id: 6,
    slug: "ep-6-dark-spots-hyperpigmentation",
    title: "Episode 6: Dark Spots, Hyperpigmentation & The Long Game",
    image: cover.ep6,
    thumbnail: cover.ep6,
    audioFile: "/ep6skinlabs.mp3",
    description:
      "Dark marks don’t disappear because you bought a brighter serum. We unpack post-inflammatory hyperpigmentation vs. melasma, why over-treating makes it worse, how niacinamide actually works, the truth about \"purging,\" and why sunscreen is non-negotiable. No miracle creams. Just the facts.",
    audioScript:
      "Hyperpigmentation is a long game: the real difference between post-inflammatory marks and melasma, why stacking every active you own backfires, how niacinamide blocks pigment transfer rather than bleaching it away, debunking the \"purging\" myth, and why daily sunscreen is the one non-negotiable for fading a dark mark at all.",
    duration: "23 min",
    durationSeconds: 1399,
    topics: ["Hyperpigmentation", "Ingredient Science"],
    publishedAt: "2026-09-25",
    showNotes: [
      "Post-inflammatory hyperpigmentation (a localized injury response) vs. melasma (often hormonally driven) — why they need different approaches",
      "The \"kitchen sink\" approach backfires: stacking acids and retinoids damages the barrier, and inflammation itself triggers more pigment",
      "How niacinamide blocks pigment transfer instead of bleaching it away, why \"purging\" doesn't apply to a basic moisturiser, and why sunscreen is non-negotiable for treating dark marks at all",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — the quick-fix trap" },
      { time: "03:42", seconds: 223, label: "PIH vs. melasma: not all dark marks are equal" },
      { time: "05:21", seconds: 321, label: "The \"reassure, explain, challenge, recommend\" framework" },
      { time: "07:57", seconds: 477, label: "The kitchen-sink approach and barrier damage" },
      { time: "10:57", seconds: 657, label: "How niacinamide blocks pigment transfer" },
      { time: "12:14", seconds: 735, label: "Debunking the \"purging\" myth" },
      { time: "14:10", seconds: 851, label: "Why sunscreen is non-negotiable for pigmentation" },
      { time: "17:48", seconds: 1069, label: "Building routines around local climate" },
    ],
    transcript: [
      { text: "Post-inflammatory hyperpigmentation is the ghost of a localized skin trauma, while melasma is often driven by hormonal shifts — treating them the same way can make melasma worse.", seconds: 223 },
      { text: "A post-acne mark takes roughly 28 to 45 days to fade because that's how long a skin cell takes to travel from the base of the epidermis to the surface — there's no shortcut around that cycle.", seconds: 223 },
      { text: "Niacinamide doesn't bleach pigment away — it blocks the transfer of melanin from the melanocyte up into visible skin cells, which is why it has to be used consistently over weeks.", seconds: 657 },
      { text: "\"Purging\" only applies to ingredients that speed up cell turnover, like retinoids or exfoliating acids — if a basic moisturiser you've used for years suddenly causes breakouts, that's irritation, not a detox.", seconds: 735 },
      { text: "Treating hyperpigmentation without daily sunscreen doesn't work: UV exposure keeps triggering melanocytes to produce more pigment, undoing weeks of otherwise careful treatment in a single afternoon.", seconds: 851 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[6].plays,
    seedLikes: engagementSeed[6].likes,
    seedShares: engagementSeed[6].shares,
  },
  {
    id: 7,
    slug: "ep-7-retinoid-rabbit-hole",
    title: "Episode 7: Retinol, Retinal & The Retinoid Rabbit Hole",
    image: cover.ep7,
    thumbnail: cover.ep7,
    audioFile: "/ep7skinlabs.mp3",
    description:
      "Retinol. Retinal. Tretinoin. Same vitamin A family, very different conversion pathway. We break down why the skin only recognises retinoic acid, why the two-step conversion in gentler retinoids is a built-in safety buffer, and how getting this wrong destroys your barrier — especially on melanin-rich skin.",
    audioScript:
      "The retinoid rabbit hole: why the skin only directly uses retinoic acid, why retinol and retinal need one or two conversion steps first (a built-in safety buffer, not a weakness), how stacking a retinoid with an exfoliating acid destroys the barrier, why that's especially risky for melanin-rich skin, and why packaging — not price — decides whether an active survives to reach your skin at all.",
    duration: "19 min",
    durationSeconds: 1130,
    topics: ["Retinoids 101", "Barrier Repair"],
    publishedAt: "2026-10-02",
    showNotes: [
      "Why the skin only has receptors for retinoic acid — and why retinol/retinal's extra conversion steps are a safety buffer, not a weaker version of tretinoin",
      "Stacking a retinoid with an exfoliating acid dissolves the barrier's lipid \"mortar\" faster than it can rebuild — and the resulting inflammation makes hyperpigmentation worse, especially on melanin-rich skin",
      "\"Clean beauty\" is an unregulated marketing term, and a clear glass dropper bottle is often worse for active-ingredient stability than an opaque, airless pump",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — the ten-step routine that's ageing you" },
      { time: "02:27", seconds: 147, label: "The retinoid rabbit hole" },
      { time: "03:48", seconds: 228, label: "Retinoic acid: your skin's native language" },
      { time: "06:52", seconds: 412, label: "How stacking retinoids and acids destroys the barrier" },
      { time: "08:16", seconds: 496, label: "Melanin-rich skin and the peel-and-bleach trap" },
      { time: "10:47", seconds: 648, label: "\"Clean beauty\" is a marketing term, not a formulation" },
      { time: "11:26", seconds: 686, label: "The packaging theater: glass droppers vs. opaque tubes" },
      { time: "14:17", seconds: 857, label: "Localizing your routine to South African climate" },
    ],
    transcript: [
      { text: "Skin cells only have receptors for one molecule — retinoic acid. Tretinoin is pure retinoic acid, which is why it's fast and effective but also notoriously harsh.", seconds: 228 },
      { text: "Retinol and retinal both need enzymatic conversion into retinoic acid first — one or two steps depending on the form — which acts as a built-in safety buffer rather than making them a weaker option.", seconds: 228 },
      { text: "Applying an exfoliating acid at the same time as a retinoid dissolves the barrier's lipid mortar while simultaneously forcing faster cell turnover — that combination is where the most severe barrier damage happens.", seconds: 412 },
      { text: "For melanin-rich skin, that same barrier-damaging inflammation directly triggers melanocytes to produce more pigment, so an aggressive routine aimed at fading a dark mark can end up creating new ones.", seconds: 496 },
      { text: "\"Clean beauty\" is an entirely unregulated marketing term — a clear glass dropper looks premium but exposes light- and oxygen-sensitive actives like vitamin C or retinoids to exactly what degrades them.", seconds: 648 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[7].plays,
    seedLikes: engagementSeed[7].likes,
    seedShares: engagementSeed[7].shares,
  },
  {
    id: 8,
    slug: "ep-8-skin-barrier",
    title: "Episode 8: Your Skin Barrier Is Begging You To Stop",
    image: cover.ep8,
    thumbnail: cover.ep8,
    audioFile: "/ep8skinlabs.mp3",
    description:
      "If your face is burning, peeling or reacting to everything, maybe it’s time to put the acids down. What barrier damage actually looks like, why stinging isn't a sign it's \"working,\" the real difference between purging and barrier collapse, and the hydration-and-peptide protocol that rebuilds it.",
    audioScript:
      "Barrier damage, explained biologically: why stinging and burning are inflammation, not efficacy, why stacking acids and retinoids outstrips the skin's ability to heal, how to tell a normal purge from real barrier collapse, and the recovery protocol — stop every active, rebuild with hydration layering and peptides, and give it weeks.",
    duration: "17 min",
    durationSeconds: 1038,
    topics: ["Barrier Repair", "Routine Building"],
    publishedAt: "2026-10-09",
    showNotes: [
      "Stinging or burning from a product is an inflammatory response, not proof an active is \"working\" — a sudden reaction to a moisturiser you've used for years means the barrier is already compromised",
      "How to tell a normal, localized \"purge\" apart from real barrier collapse (widespread redness, heat, and stinging with basic products)",
      "The recovery protocol: stop every active immediately, rebuild with hydration layering (humectants) and barrier-repair peptides, and expect it to take weeks, not days",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — mistaking stinging for \"it's working\"" },
      { time: "01:07", seconds: 68, label: "Defining the battleground: what barrier damage looks like" },
      { time: "04:36", seconds: 277, label: "The retinoid rabbit hole and barrier collapse" },
      { time: "07:34", seconds: 454, label: "Purging vs. real barrier collapse" },
      { time: "08:28", seconds: 508, label: "Put the acids down: the recovery protocol" },
      { time: "09:47", seconds: 587, label: "Hydration layering, explained" },
      { time: "10:40", seconds: 640, label: "Peptides: signalling repair instead of forcing it" },
      { time: "13:19", seconds: 799, label: "Why editorial independence changes the advice" },
    ],
    transcript: [
      { text: "Sustained stinging or burning isn't a sign an active ingredient is penetrating and working — it's your body releasing inflammatory cytokines, a real immune response to barrier damage.", seconds: 68 },
      { text: "A normal \"purge\" is localized — existing clogged pores surfacing faster than usual in your normal breakout areas. Widespread redness, heat and stinging everywhere is barrier collapse, not a purge.", seconds: 454 },
      { text: "The first step in recovery is stopping every active completely — acids, retinoids, all of it — because you can't heal a compromised barrier while continuing to strip it.", seconds: 508 },
      { text: "Hydration layering works by supplying humectants that give the skin's own repair enzymes the water they need to function, so the skin can exfoliate itself at its own pace without acids.", seconds: 587 },
      { text: "Barrier-repair peptides signal fibroblasts to produce collagen and structural proteins rather than forcing cell turnover the way an acid or retinoid does — signalling instead of forcing.", seconds: 640 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[8].plays,
    seedLikes: engagementSeed[8].likes,
    seedShares: engagementSeed[8].shares,
  },
  {
    id: 9,
    slug: "ep-9-melanin-rich-skin",
    title: "Episode 9: Black Skin, Brown Skin & The Skincare Advice We Keep Getting Wrong",
    image: cover.ep9,
    thumbnail: cover.ep9,
    audioFile: "/ep9skinlabs.mp3",
    description:
      "A lot of skincare advice wasn’t written with every skin tone in mind. We unpack why melanin-rich skin reacts differently to trauma, the tyrosinase inhibitors that actually fade a dark mark safely, and why \"I don't burn\" is one of the most dangerous myths in skincare. Darker skin isn’t a problem to solve. It needs advice that actually makes sense.",
    audioScript:
      "Standard skincare advice was built almost entirely on lighter skin tones. This deep dive covers why melanocytes in melanin-rich skin are more reactive to trauma, why physical scrubbing makes a dark mark worse, the tyrosinase inhibitors (alpha arbutin, licorice root, tranexamic acid) that safely fade pigmentation, and why UVA exposure keeps driving hyperpigmentation even on skin that never visibly burns.",
    duration: "20 min",
    durationSeconds: 1180,
    topics: ["Melanin-Rich Skin", "Ingredient Science"],
    publishedAt: "2026-10-16",
    showNotes: [
      "Decades of dermatology research centred on the lighter end of the Fitzpatrick scale — melanin-rich skin was treated as an afterthought, not the baseline",
      "Melanocytes in darker skin are larger, denser and more reactive, so a harsh exfoliant calibrated for lighter skin can trigger more pigment, not less — and physical scrubbing makes it worse",
      "Tyrosinase inhibitors (alpha arbutin, licorice root extract, tranexamic acid) fade a dark mark safely by blocking pigment production at the source — and it still takes weeks, not the \"seven days\" promised on the label",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro — when brightening serums make it worse" },
      { time: "01:28", seconds: 89, label: "The Fitzpatrick scale and dermatology's blind spot" },
      { time: "04:32", seconds: 273, label: "\"I don't burn\" isn't the same as \"I'm protected\"" },
      { time: "09:16", seconds: 556, label: "Why scrubbing a dark spot makes it worse" },
      { time: "09:59", seconds: 600, label: "Tyrosinase inhibitors: fading pigment safely" },
      { time: "12:31", seconds: 751, label: "The skin barrier, explained: brick and mortar" },
      { time: "14:18", seconds: 858, label: "Put the acids down: rebuilding the barrier" },
      { time: "15:37", seconds: 938, label: "Why routines need to be built for your local climate" },
    ],
    transcript: [
      { text: "For decades, clinical trials and product development were centred almost exclusively on the lighter end of the Fitzpatrick scale — melanin-rich skin was treated as an anomaly, not the baseline.", seconds: 89 },
      { text: "Melanocytes in darker skin tones are larger, denser and more reactive to stimuli — a harsh exfoliant calibrated for lighter skin can read as trauma and trigger more pigment, not less.", seconds: 89 },
      { text: "\"I don't burn\" isn't the same as \"I'm protected\": melanin blocks enough UVB to prevent visible burning, but UVA penetrates just as deep regardless of skin tone, quietly stimulating melanocytes and degrading collagen.", seconds: 273 },
      { text: "Tyrosinase inhibitors like alpha arbutin, licorice root extract and tranexamic acid work by blocking pigment production at the source, rather than attacking pigment that's already there — and it still takes weeks, not days.", seconds: 600 },
      { text: "Physical scrubbing to fade a dark mark creates micro-tears that the immune system treats as an injury — the mark almost always heals darker than before.", seconds: 556 },
    ],
    productsMentioned: [],
    seedPlays: engagementSeed[9].plays,
    seedLikes: engagementSeed[9].likes,
    seedShares: engagementSeed[9].shares,
  },
  {
    id: 10,
    slug: "ep-10-skincare-or-marketing",
    title: "Episode 10: Are You Buying Skincare Or Buying The Marketing?",
    image: cover.ep10,
    thumbnail: cover.ep10,
    audioFile: "/ep10skinlabs.mp3",
    description:
      "Cute packaging. Big promises. A suspiciously expensive serum. We look at skincare marketing, ingredient lists, “clean” beauty, celebrity products and the difference between good formulation and clever advertising.",
    audioScript: "",
    duration: "Coming soon",
    topics: ["Trends", "Ingredient Science"],
    publishedAt: "",
    showNotes: [],
    timestamps: [],
    transcript: [],
    productsMentioned: [],
    seedPlays: 0,
    seedLikes: 0,
    seedShares: 0,
    comingSoon: true,
  },
];

export const publishedPodcastEpisodes = podcastEpisodes.filter((e) => !e.comingSoon);

/** The most recently published episode, used to show a "New" badge. */
export const latestPublishedEpisode = [...publishedPodcastEpisodes].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
)[0];

export const podcastTopics = Array.from(
  new Set(publishedPodcastEpisodes.flatMap((episode) => episode.topics)),
);

/**
 * New episodes publish every Friday at 12:00 SAST (10:00 UTC, SAST = UTC+2,
 * no daylight saving). Returns the next upcoming Friday 10:00 UTC slot.
 */
export const getNextEpisodeDate = () => {
  const now = new Date();
  const PUBLISH_HOUR_UTC = 10;
  const FRIDAY = 5;
  const next = new Date(now);
  next.setUTCHours(PUBLISH_HOUR_UTC, 0, 0, 0);
  let daysUntilFriday = (FRIDAY - next.getUTCDay() + 7) % 7;
  if (daysUntilFriday === 0 && next.getTime() <= now.getTime()) {
    daysUntilFriday = 7;
  }
  next.setUTCDate(next.getUTCDate() + daysUntilFriday);
  return next;
};
