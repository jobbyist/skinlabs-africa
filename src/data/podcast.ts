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
  /** When true, episode is listed as Coming Soon (no audio yet). Only shown on /podcast. */
  comingSoon?: boolean;
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
    publishedAt: "2025-01-29",
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
    publishedAt: "2025-02-05",
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
    publishedAt: "2025-02-12",
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
    thumbnail: "/ep4skinlabs.jpg",
    audioFile: "/ep4skinlabs.mp3",
    description:
      "We separate facts from fear around buzzy ingredients like retinoids, acids, and preservatives, and explain how to read labels with confidence.",
    audioScript:
      "Episode four is all about ingredient drama. We separate facts from fear around retinoids, acids, and preservatives, and explain how to read labels with confidence.",
    duration: "19 min",
    topics: ["Retinoids 101", "Ingredient Science"],
    publishedAt: "2025-02-19",
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
  {
    id: 5,
    slug: "ep-5-spf-is-not-optional",
    title: "Episode 5: SPF Is Not Optional",
    image: episode1,
    thumbnail: "/ep1skinlabs.PNG",
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
    comingSoon: true,
  },
  {
    id: 6,
    slug: "ep-6-dark-spots-hyperpigmentation",
    title: "Episode 6: Dark Spots, Hyperpigmentation & The Long Game",
    image: episode2,
    thumbnail: "/ep2skinlabs.PNG",
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
    comingSoon: true,
  },
  {
    id: 7,
    slug: "ep-7-retinoid-rabbit-hole",
    title: "Episode 7: Retinol, Retinal & The Retinoid Rabbit Hole",
    image: episode3,
    thumbnail: "/ep3skinlabs.PNG",
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
    comingSoon: true,
  },
  {
    id: 8,
    slug: "ep-8-skin-barrier",
    title: "Episode 8: Your Skin Barrier Is Begging You To Stop",
    image: episode4,
    thumbnail: "/ep4skinlabs.jpg",
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
    comingSoon: true,
  },
  {
    id: 9,
    slug: "ep-9-melanin-rich-skin",
    title: "Episode 9: Black Skin, Brown Skin & The Skincare Advice We Keep Getting Wrong",
    image: episode1,
    thumbnail: "/ep1skinlabs.PNG",
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
    comingSoon: true,
  },
  {
    id: 10,
    slug: "ep-10-skincare-or-marketing",
    title: "Episode 10: Are You Buying Skincare Or Buying The Marketing?",
    image: episode2,
    thumbnail: "/ep2skinlabs.PNG",
    audioFile: "",
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
    comingSoon: true,
  },
];

/** Published episodes only (no coming-soon). Use for home, players, etc. */
export const publishedPodcastEpisodes = podcastEpisodes.filter((e) => !e.comingSoon);

export const podcastTopics = Array.from(
  new Set(publishedPodcastEpisodes.flatMap((episode) => episode.topics)),
);

/** Approximate next last-Friday drop for display copy. */
export const getNextEpisodeDate = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  // Last day of current month
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const day = lastDay.getUTCDay(); // 0 Sun … 5 Fri
  const diff = (day + 2) % 7; // days to subtract to reach Friday
  lastDay.setUTCDate(lastDay.getUTCDate() - diff);
  if (lastDay.getTime() <= now.getTime()) {
    // move to next month’s last Friday
    const nextLast = new Date(Date.UTC(year, month + 2, 0));
    const d = nextLast.getUTCDay();
    const df = (d + 2) % 7;
    nextLast.setUTCDate(nextLast.getUTCDate() - df);
    nextLast.setUTCHours(6, 0, 0, 0);
    return nextLast;
  }
  lastDay.setUTCHours(6, 0, 0, 0);
  return lastDay;
};
