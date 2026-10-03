/**
 * Platform announcements, newest first. Shared by /announcements and the
 * "ICYMI" monthly web stories (src/lib/webStories/curated.ts), so the story
 * text is always the published announcement text, never rewritten.
 */
export type AnnouncementIcon = "megaphone" | "sparkles" | "award" | "sun" | "mic" | "shopping-bag" | "calendar" | "beaker" | "gift";

export interface Announcement {
  /** ISO date (SAST). */
  date: string;
  tag: string;
  icon: AnnouncementIcon;
  title: string;
  description: string;
}

export const announcements: Announcement[] = [
  {
    date: "2026-09-28",
    tag: "New",
    icon: "mic",
    title: "The Skin Deep Podcast: Season 1 is complete, Season 2 starts January 2027",
    description:
      "Episode 10, \"Are You Buying Skincare Or Buying The Marketing?\", closes Season 1 — all ten episodes are streaming now on the podcast hub, each with show notes and chapter markers. New episodes will be uploaded when the official Season 2 episode calendar commences in January 2027.",
  },
  {
    date: "2026-09-22",
    tag: "New",
    icon: "gift",
    title: "All paid plans free to try until 1 November 2026",
    description:
      "For a limited time, Glow Lite and Glow Insider are free to try — sign up for either plan's free trial with no card required, and it runs all the way through 1 November 2026 instead of the usual 7 days. Every member benefit applies during this period except ad-free browsing, which stays a Glow VIP perk once standard billing resumes. Advanced AI Analysis Passes (for your Advanced AI Dermatology Report from SKYNN AI) remain a small once-off payment for every account, member or not — that's unchanged. Standard subscription-based billing returns for everyone on 1 November 2026 as we continue rolling out the rest of the platform — see the Pricing page for full details.",
  },
  {
    date: "2026-09-13",
    tag: "New",
    icon: "beaker",
    title: "Ingredients Directory with Combination Checker now live",
    description:
      "We've launched a comprehensive Ingredients directory featuring our new Ingredient Combination checker — a database-driven compatibility checker backed by real, cited sources. The combination checker is available for free to all members for a limited time. Browse ingredient profiles freely, or sign in to use the Combination checker and see which ingredients work together, which need spacing, and which should never be mixed.",
  },
  {
    date: "2026-09-08",
    tag: "Platform",
    icon: "sparkles",
    title: "Starter Analysis 2.0: your Skin Story, ranked priorities and refinement",
    description:
      "Skin Analysis (SKYNN AI)'s free Starter Analysis is significantly more personalised, without asking more questions. It now includes a plain-language \"Skin Story\" built from your answers, a transparent ranked list of your top skin priorities with the reasoning behind each one, a lightweight check on anything that's recently changed with your skin, and an interactive \"how close is this?\" refinement step that adjusts your result on the spot. Analysis completeness — how much information SKYNN AI had to work with — stays clearly separate from any claim of accuracy. Your exact SkinLabs-reviewed product matches and the interactive Routine Builder remain part of Glow Insider and VIP membership.",
  },
  {
    date: "2026-09-07",
    tag: "Platform",
    icon: "sparkles",
    title: "SKYNN AI (beta) is here",
    description:
      "The AI Formulator is now SKYNN AI (beta), at a new home: /skynn-ai. It adds an optional Monk Skin Tone (MST) step for fairness testing across skin tones, product picks grounded in SkinLabs' own reviewed catalogue, and a transparent \"analysis completeness\" indicator instead of a vague confidence score.",
  },
  {
    date: "2026-08-28",
    tag: "Coming Soon",
    icon: "shopping-bag",
    title: "Openhaus Marketplace is on its way",
    description:
      "We're building a multivendor marketplace for South African skincare brands. Join the waiting list on the Marketplace page for early-bird samples, giveaways and launch discounts.",
  },
  {
    date: "2026-08-20",
    tag: "Platform",
    icon: "calendar",
    title: "Consultations rebranded to Consult",
    description:
      "Virtual derm consultations now live under a shorter \"Consult\" label in the header — same HPCSA-registered practitioners, same booking flow, just easier to find on mobile.",
  },
  {
    date: "2026-08-12",
    tag: "New",
    icon: "sun",
    title: "Seasonal Guides launched",
    description:
      "Skincare advice built around the season you're actually living in, with regional notes for Gauteng, KZN, the Western Cape and the Eastern Cape.",
  },
  {
    date: "2026-08-01",
    tag: "New",
    icon: "award",
    title: "Spotlight by SkinLabs launched",
    description:
      "A monthly, review-led ranking of South African skincare brands, computed live from our own published product scores — never a paid placement.",
  },
  {
    date: "2026-06-15",
    tag: "Platform",
    icon: "sparkles",
    title: "AI Formulator upgraded",
    description:
      "Personalised routines now factor in your climate zone, budget and skin concerns together, with weekly refreshes for Glow Insider and Glow VIP members.",
  },
  {
    date: "2026-02-05",
    tag: "New",
    icon: "mic",
    title: "The Skin Deep Podcast premiered",
    description:
      "Weekly episodes on skincare myths, ingredient science and SA-specific routines, with new instalments dropping every Wednesday.",
  },
];

/** Announcements dated in a given month ("2026-09"), newest first. */
export const announcementsForMonth = (yearMonth: string): Announcement[] =>
  announcements.filter((a) => a.date.startsWith(`${yearMonth}-`));
