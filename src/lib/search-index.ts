/** Static pages surfaced in site-wide search, independent of any data file. */
export interface SearchablePage {
  title: string;
  description: string;
  href: string;
  keywords?: string;
}

export const searchablePages: SearchablePage[] = [
  { title: "Home", description: "SkinLabs — AI skincare routines and SA skin science", href: "/" },
  { title: "The Daily Skinny", description: "Daily skin science briefings for SA skin and climate", href: "/newsroom", keywords: "newsroom briefings news" },
  { title: "Product Reviews", description: "Independent SA skincare product reviews and scores", href: "/reviews", keywords: "reviews scores ratings" },
  { title: "The Skin Deep Podcast", description: "Weekly SA skincare conversations and ingredient science", href: "/podcast", keywords: "podcast episodes audio" },
  { title: "AI Formulator", description: "Build a custom AI skincare routine", href: "/ai-formulator", keywords: "ai routine formulator analysis" },
  { title: "Consultations", description: "Book a virtual consultation with an SA practitioner", href: "/consultations", keywords: "derm dermatologist booking" },
  { title: "Membership Plans", description: "Glow Explorer, Glow Insider and Glow VIP pricing", href: "/pricing", keywords: "pricing membership plans trial" },
  { title: "Devices", description: "Skincare devices and tools", href: "/devices" },
  { title: "Serums", description: "Serums shop", href: "/serums" },
  { title: "Custom Formulas", description: "Request a custom skincare formula", href: "/custom-formulas" },
  { title: "Bundled Kits", description: "Bundled skincare kits and gift sets", href: "/bundled-kits", keywords: "gift sets" },
  { title: "For Business", description: "SkinLabs for salons, clinics and retailers", href: "/business" },
  { title: "About Us", description: "SkinLabs' story, science and sustainability", href: "/about" },
  { title: "FAQ", description: "Frequently asked questions", href: "/faq" },
  { title: "Contact", description: "Get in touch with SkinLabs", href: "/contact" },
  { title: "Edible Pouches", description: "Edible skincare pouches pre-order", href: "/edible-pouches" },
];

/** Normalises text for matching: lowercase, strip diacritics/punctuation noise. */
const normalise = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ");

/**
 * Smart-enough predictive scorer: every query token must appear somewhere in the
 * haystack (as a substring), so results narrow as the visitor types more of the
 * word. Prefix and whole-word matches score higher than mid-word matches, and
 * matches on the primary title outrank matches only found in the description.
 */
export const matchScore = (query: string, title: string, secondary = ""): number => {
  const q = normalise(query).trim();
  if (!q) return 0;
  const tokens = q.split(/\s+/).filter(Boolean);
  const titleN = normalise(title);
  const secondaryN = normalise(secondary);
  const haystack = `${titleN} ${secondaryN}`;

  let score = 0;
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
    if (titleN.startsWith(token)) score += 5;
    else if (new RegExp(`\\b${token}`).test(titleN)) score += 3;
    else if (titleN.includes(token)) score += 2;
    else score += 1;
  }
  return score;
};
