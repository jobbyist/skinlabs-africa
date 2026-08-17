import episode1 from "@/assets/ep1skinlabs.PNG";
import episode2 from "@/assets/ep2skinlabs.PNG";
import episode3 from "@/assets/ep3skinlabs.PNG";
import episode4 from "@/assets/ep4skinlabs.jpg";

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
}

export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: 1,
    slug: "ep-1-weird-skincare",
    title: "Episode 1: Weird Skincare",
    image: episode1,
    thumbnail: "/ep1skinlabs.PNG",
    audioFile: "/ep1skinlabs.mp3",
    description:
      "We unpack the strangest skincare rituals trending online, from snail mucin hype to edible serums, and explain which ingredients are actually backed by research.",
    audioScript:
      "Welcome to episode one of The Skin Deep Podcast. Today we explore the weirdest skincare rituals trending online, from snail mucin to edible serums. We break down which ingredients are backed by dermatology research, how to spot gimmicks, and when a quirky routine can still support the skin barrier.",
    duration: "18 min",
    topics: ["Ingredient Science", "Trends"],
    publishedAt: "2026-07-22",
    showNotes: [
      "Why snail mucin works for some barriers and not others",
      "Edible skincare: what the SA regulatory landscape allows",
      "Three viral rituals to skip entirely",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro & why weird sells" },
      { time: "04:20", seconds: 260, label: "Snail mucin under the microscope" },
      { time: "09:45", seconds: 585, label: "Edible serums and SA regulation" },
      { time: "14:10", seconds: 850, label: "What to actually keep in your routine" },
    ],
    transcript: [
      "Welcome to The Skin Deep Podcast. Today we're separating the weird from the workable in skincare.",
      "Snail mucin has real humectant and glycoprotein content, but the marketing outpaces the evidence for anti-ageing claims.",
      "In South Africa, ingestible beauty products sit under food supplement rules, which changes what brands may legally claim.",
      "Our takeaway: novelty is fine, but your core routine should stay cleanser, moisturiser, and SPF.",
    ],
    productsMentioned: [
      { name: "Basic Sensitive Fluid Moisturizer", brand: "Skoon Skin" },
      { name: "All the Shade Marula Tinted SPF 30", brand: "Lelive" },
    ],
  },
  {
    id: 2,
    slug: "ep-2-skincare-fails",
    title: "Episode 2: Skincare Fails",
    image: episode2,
    thumbnail: "/ep2skinlabs.PNG",
    audioFile: "/ep2skinlabs.mp3",
    description:
      "Dermatologists and estheticians share common skincare mistakes, how to recover from over-exfoliation, and the simple routines that rebuild resilient skin.",
    audioScript:
      "Episode two dives into the skincare fails we see most often: over-exfoliation, ingredient clashes, and rushing new actives. Hear the reset routines that calm inflammation and restore hydration.",
    duration: "22 min",
    topics: ["Barrier Repair", "Routine Building"],
    publishedAt: "2026-07-29",
    showNotes: [
      "The five-day barrier reset protocol",
      "Signs you have over-exfoliated (and what to stop immediately)",
      "How Highveld winter air accelerates trans-epidermal water loss",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro" },
      { time: "03:30", seconds: 210, label: "Over-exfoliation warning signs" },
      { time: "11:00", seconds: 660, label: "The five-day reset" },
      { time: "17:40", seconds: 1060, label: "Rebuilding with ceramides" },
    ],
    transcript: [
      "Most skincare failures are not bad products, they are too many products at once.",
      "If your skin stings when you apply water-based serum, your barrier is compromised.",
      "The reset: gentle cleanser, ceramide moisturiser, mineral SPF. Nothing else for five days.",
    ],
    productsMentioned: [
      { name: "Barrier Repair Cream", brand: "Dermastore Select" },
      { name: "SA Smoothing Cleanser", brand: "CeraVe SA" },
    ],
  },
  {
    id: 3,
    slug: "ep-3-glass-skin",
    title: "Episode 3: Glass Skin",
    image: episode3,
    thumbnail: "/ep3skinlabs.PNG",
    audioFile: "/ep3skinlabs.mp3",
    description:
      "A deep dive into the glow-from-within trend, including hydration layering, peptide support, and the daily habits that make luminosity last.",
    audioScript:
      "In episode three we decode the glass skin trend: hydration layering, gentle exfoliation, peptides, and habits that build lasting luminosity.",
    duration: "20 min",
    topics: ["Hydration", "Trends"],
    publishedAt: "2026-08-05",
    showNotes: [
      "Layering order for humid KZN coastal climates",
      "Peptides vs. growth factors: what the evidence says",
      "Why glass skin is mostly barrier health",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro" },
      { time: "05:15", seconds: 315, label: "Hydration layering" },
      { time: "12:00", seconds: 720, label: "Peptides explained" },
    ],
    transcript: [
      "Glass skin is a lighting trend as much as a skincare one, but hydration genuinely changes light reflection.",
      "Humectants need an occlusive on top, especially in dry Gauteng winters.",
    ],
    productsMentioned: [{ name: "10% Niacinamide + 1% Zinc Serum", brand: "Standard Beauty" }],
  },
  {
    id: 4,
    slug: "ep-4-ingredient-drama",
    title: "Episode 4: Ingredient Drama",
    image: episode4,
    thumbnail: "/ep4skinlabs.PNG",
    audioFile: "/ep4skinlabs.mp3",
    description:
      "We separate facts from fear around buzzy ingredients like retinoids, acids, and preservatives, and explain how to read labels with confidence.",
    audioScript:
      "Episode four is all about ingredient drama. We separate facts from fear around retinoids, acids, and preservatives, and explain how to read labels with confidence.",
    duration: "19 min",
    topics: ["Retinoids 101", "Ingredient Science"],
    publishedAt: "2026-08-12",
    showNotes: [
      "Retinol + AHA: when the conflict is real",
      "Preservatives are not the enemy",
      "Label literacy in 3 steps",
    ],
    timestamps: [
      { time: "00:00", seconds: 0, label: "Intro" },
      { time: "06:00", seconds: 360, label: "Retinoid myths" },
      { time: "13:20", seconds: 800, label: "Acid pairing rules" },
    ],
    transcript: [
      "Retinoids remain the most evidence-backed topical for photoageing and post-inflammatory hyperpigmentation.",
      "Pairing retinol with AHAs on the same night is where most irritation starts.",
    ],
    productsMentioned: [{ name: "SuperHero Hydrating Cleanser", brand: "Swiitch Beauty" }],
  },
];

export const podcastTopics = Array.from(
  new Set(podcastEpisodes.flatMap((episode) => episode.topics)),
);

/** Next Wednesday release date (episodes drop weekly on Wednesdays). */
export const getNextEpisodeDate = () => {
  const now = new Date();
  const next = new Date(now);
  const daysUntilWednesday = (3 - now.getUTCDay() + 7) % 7 || 7;
  next.setUTCDate(now.getUTCDate() + daysUntilWednesday);
  next.setUTCHours(6, 0, 0, 0);
  return next;
};
