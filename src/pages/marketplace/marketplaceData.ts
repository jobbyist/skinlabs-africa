/** Static OpenHaus marketplace config — brand cover art and the homepage's
 *  category/concern taxonomy subsets. Real product data lives in Supabase
 *  (see src/hooks/use-marketplace-products.ts) — this file has no product
 *  rows anymore.
 */

import skoonCover from "@/assets/marketplace/brands/skoon-cover.png";
import standardBeautyCover from "@/assets/marketplace/brands/standard-beauty-cover.png";
import esseCover from "@/assets/marketplace/brands/esse-cover.png";
import leliveCover from "@/assets/marketplace/brands/lelive-cover.png";

export interface MarketplaceBrand {
  id: string;
  name: string;
  slug: string;
  origin: string;
  logoText: string;
  logoStyle: string;
  /** Real brand cover artwork — when present, rendered instead of the text logoText fallback. */
  coverImage?: string;
}

export const featuredBrands: MarketplaceBrand[] = [
  {
    id: "skoon",
    name: "Skoon",
    slug: "skoon",
    origin: "South African",
    logoText: "SKOON.",
    logoStyle: "font-black tracking-widest text-white bg-black",
    coverImage: skoonCover,
  },
  {
    id: "standard-beauty",
    name: "Standard Beauty",
    slug: "standard-beauty",
    origin: "South African",
    logoText: "standard.",
    logoStyle: "font-light tracking-wide text-white bg-black",
    coverImage: standardBeautyCover,
  },
  {
    id: "esse",
    name: "Esse",
    slug: "esse",
    origin: "South African",
    logoText: "esse",
    logoStyle: "font-thin tracking-widest italic text-white bg-black",
    coverImage: esseCover,
  },
  {
    id: "lelive",
    name: "Lelive",
    slug: "lelive",
    origin: "South African",
    logoText: "lelive.",
    logoStyle: "font-light tracking-widest text-white bg-black",
    coverImage: leliveCover,
  },
];

export const concerns = [
  {
    id: "acne-breakouts",
    label: "Acne & Breakouts",
    slug: "acne-breakouts",
    colorClass: "bg-[#e8f4e8]",
  },
  {
    id: "hyperpigmentation",
    label: "Hyperpigmentation",
    slug: "hyperpigmentation",
    colorClass: "bg-[#fdebd0]",
  },
  {
    id: "dry-dehydrated",
    label: "Dry & Dehydrated",
    slug: "dry-dehydrated",
    colorClass: "bg-[#e8eef8]",
  },
  {
    id: "sensitive-skin",
    label: "Sensitive Skin",
    slug: "sensitive-skin",
    colorClass: "bg-[#f3e8f8]",
  },
];

export const categories = [
  { id: "face", label: "Face", icon: "👤" },
  { id: "body", label: "Body", icon: "🧴" },
  { id: "hair-scalp", label: "Hair & Scalp", icon: "💆" },
  { id: "sun-care", label: "Sun Care", icon: "☀️" },
  { id: "treatments", label: "Treatments", icon: "💧" },
  { id: "tools", label: "Tools", icon: "🖌️" },
];
