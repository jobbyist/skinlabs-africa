/** Episode cover art lives in /public/podcast/ */
const cover = {
  ep1: "/podcast/ep1-weird-skincare.jpg",
  ep2: "/podcast/ep2-skincare-fails.jpg",
  // Swapped per editorial request: ep4's cover art now runs on ep3, and vice versa.
  ep3: "/podcast/ep4-ingredient-drama.png",
  ep4: "/podcast/ep3-glass-skin.png",
  ep5: "/podcast/ep5-spf-is-not-optional.png",
  ep6: "/podcast/ep6-dark-spots-hyperpigmentation.png",
  ep7: "/podcast/ep7-retinoid-rabbit-hole.png",
  ep8: "/podcast/ep8-skin-barrier.png",
  ep9: "/podcast/ep9-melanin-rich-skin.png",
  ep10: "/podcast/ep10-skincare-or-marketing.png",
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
  topics: string[];
  publishedAt: string;
  showNotes: string[];
  timestamps: { time: string; seconds: number; label: string }[];
  transcript: string[];
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
      "Beef tallow is mainly a strong occlusive moisturiser — it forms a barrier on the skin to stop water evaporating, but it isn't a treatment.",
      "It's a highly comedogenic ingredient. For oily, combination or acne-prone skin, dermatologists warn it's likely to mean more breakouts and irritation, not less.",
      "It's also sold with no regulatory oversight as a skincare product, so there's no standard for purity — one dermatologist warned you could be rubbing bacterial contamination onto your face.",
      "The trend is fuelled by the naturalistic fallacy — the assumption that natural automatically means safe — amplified by social media anecdotes rather than evidence.",
      "For real barrier repair and anti-ageing benefit, ingredients like hyaluronic acid and retinoids already have the research behind them that tallow doesn't.",
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
      "Mario Badescu faced a class-action lawsuit after secretly putting prescription-strength corticosteroids into creams like its healing cream — users reported severe steroid withdrawal and skin thinning.",
      "Independent testing found some Korean sunscreens labelled SPF50+ were actually closer to SPF19 — manufacturers were reportedly prioritising a lighter feel over accurate protection.",
      "Recent lab findings show benzoyl peroxide can break down into benzene, a known carcinogen, especially when a product is left somewhere hot like a car or bathroom.",
      "If your barrier is compromised: stop every active, go back to a gentle cleanser and a bland moisturiser, and patch test anything new for seven to ten days before it touches your face.",
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
      "Glass skin comes from K-beauty and has gone global — searches for it are up more than 250%, with the market chasing that look projected in the tens of billions of dollars.",
      "Dermatologists point out that a lot of what you see online comes down to genetics, lighting and filters rather than a routine — and chasing it too hard can mean over-exfoliating and damaging your barrier.",
      "The counter-trend rests on three ideas: protect your skin's barrier first, keep your routine simple instead of stacking ten products, and treat real texture and pores as normal, not flaws to fix.",
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
      "Layer thinnest to thickest and lowest pH to highest — a low-pH vitamin C applied after a higher-pH niacinamide can end up cancelling the vitamin C out.",
      "Vitamin C, vitamin E and ferulic acid are a real trio: ferulic acid helps stabilise vitamin C, and together they can boost its defence against environmental damage.",
      "Retinol paired with an AHA or BHA acid on the same night is one of the fastest ways to over-exfoliate and damage your barrier — alternate them on different nights instead.",
      "If your barrier is compromised, stop every active — no retinol, no acids, no vitamin C — and rebuild with a gentle cleanser, a bland moisturiser and SPF. It can take weeks to fully recover.",
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
    audioFile: "",
    description:
      "We need to talk about sunscreen — not just beach days. This episode breaks down SPF, UVA vs UVB, reapplication, darker skin tones and why South Africa’s sun deserves more respect. Because “I don’t burn” isn’t the same as “I’m protected.”",
    audioScript: "",
    duration: "Coming soon",
    topics: ["Sun Protection", "Ingredient Science"],
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
  {
    id: 6,
    slug: "ep-6-dark-spots-hyperpigmentation",
    title: "Episode 6: Dark Spots, Hyperpigmentation & The Long Game",
    image: cover.ep6,
    thumbnail: cover.ep6,
    audioFile: "",
    description:
      "Dark marks don’t disappear because you bought a brighter serum. We unpack hyperpigmentation, post-inflammatory marks, melasma and the ingredients that can actually help — especially for deeper skin tones. No miracle creams. Just the facts.",
    audioScript: "",
    duration: "Coming soon",
    topics: ["Hyperpigmentation", "Ingredient Science"],
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
  {
    id: 7,
    slug: "ep-7-retinoid-rabbit-hole",
    title: "Episode 7: Retinol, Retinal & The Retinoid Rabbit Hole",
    image: cover.ep7,
    thumbnail: cover.ep7,
    audioFile: "",
    description:
      "Retinol. Retinal. Tretinoin. Same family, very different conversation. We break down what retinoids actually do, who should consider them, and how to start without destroying your barrier. Your routine doesn’t need to become a chemistry experiment.",
    audioScript: "",
    duration: "Coming soon",
    topics: ["Retinoids 101", "Barrier Repair"],
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
  {
    id: 8,
    slug: "ep-8-skin-barrier",
    title: "Episode 8: Your Skin Barrier Is Begging You To Stop",
    image: cover.ep8,
    thumbnail: cover.ep8,
    audioFile: "",
    description:
      "If your face is burning, peeling or reacting to everything, maybe it’s time to put the acids down. What damages the barrier, what helps repair it, and how to know when your routine has become too much.",
    audioScript: "",
    duration: "Coming soon",
    topics: ["Barrier Repair", "Routine Building"],
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
  {
    id: 9,
    slug: "ep-9-melanin-rich-skin",
    title: "Episode 9: Black Skin, Brown Skin & The Skincare Advice We Keep Getting Wrong",
    image: cover.ep9,
    thumbnail: cover.ep9,
    audioFile: "",
    description:
      "A lot of skincare advice wasn’t written with every skin tone in mind. This episode explores melanin-rich skin — pigmentation, acne marks, sunscreen, irritation and the myths that keep getting recycled. Darker skin isn’t a problem to solve. It needs advice that actually makes sense.",
    audioScript: "",
    duration: "Coming soon",
    topics: ["Melanin-Rich Skin", "Ingredient Science"],
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
