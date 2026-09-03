/**
 * Real product photography, assigned per review category. These are genuine stock
 * photos of the product category (a serum bottle, a moisturiser jar, a sunscreen
 * tube) rather than a claim that any specific photo depicts one exact SKU — the
 * same honest approach already used for Shelf Showdown thumbnails in comparisons.ts.
 * All images are free-to-use under the Unsplash License (unsplash.com/license).
 */
export interface CategoryImage {
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
}

const UNSPLASH_PARAMS = "auto=format&fit=crop&w=1200&q=80";

export const categoryImages: Record<string, CategoryImage[]> = {
  Serum: [
    {
      url: `https://images.unsplash.com/photo-1773700596401-61bc77e0b436?${UNSPLASH_PARAMS}`,
      alt: "Amber glass serum bottle with dropper",
      creditName: "Ela De Pure",
      creditUrl: "https://unsplash.com/@eladepure",
    },
    {
      url: `https://images.unsplash.com/photo-1741896135490-4062a3b21abf?${UNSPLASH_PARAMS}`,
      alt: "Skincare serums and dropper bottles",
      creditName: "Maria Lupan",
      creditUrl: "https://unsplash.com/@luandmario",
    },
  ],
  Moisturiser: [
    {
      url: `https://images.unsplash.com/photo-1715702130909-a5b2942a411b?${UNSPLASH_PARAMS}`,
      alt: "Jar of face moisturiser cream",
      creditName: "Cosmin Ursea",
      creditUrl: "https://unsplash.com/@cosminursea",
    },
  ],
  Cleanser: [
    {
      url: `https://images.unsplash.com/photo-1739131285874-8d545cffef95?${UNSPLASH_PARAMS}`,
      alt: "Gel facial cleanser tube",
      creditName: "Ela De Pure",
      creditUrl: "https://unsplash.com/@eladepure",
    },
  ],
  Sunscreen: [
    {
      url: `https://images.unsplash.com/photo-1698912069385-30a7acc9fa4f?${UNSPLASH_PARAMS}`,
      alt: "Sunscreen tube",
      creditName: "Lal Mahammad",
      creditUrl: "https://unsplash.com/@lmahammad",
    },
    {
      url: `https://images.unsplash.com/photo-1672749489615-2eb286c851e5?${UNSPLASH_PARAMS}`,
      alt: "Skincare and sunscreen products arranged for photography",
      creditName: "Mina Rad",
      creditUrl: "https://unsplash.com/@miinrad",
    },
  ],
  Body: [
    {
      url: `https://images.unsplash.com/photo-1632841176116-68bdbd539917?${UNSPLASH_PARAMS}`,
      alt: "Bottle of body lotion",
      creditName: "Amr Taha",
      creditUrl: "https://unsplash.com/@amr_taha",
    },
    {
      url: `https://images.unsplash.com/photo-1641964946828-bbd121e05a70?${UNSPLASH_PARAMS}`,
      alt: "Bottle of body lotion beside a jar of cream",
      creditName: "Karly Jones",
      creditUrl: "https://unsplash.com/@earthtokarly",
    },
  ],
  "Eye Cream": [
    {
      url: `https://images.unsplash.com/photo-1700104495010-2e961cd6141f?${UNSPLASH_PARAMS}`,
      alt: "Eye cream tube with packaging box",
      creditName: "Mockup Free",
      creditUrl: "https://unsplash.com/@mockupfreenet",
    },
  ],
  Exfoliant: [
    {
      url: `https://images.unsplash.com/photo-1564594218151-a67498fb2922?${UNSPLASH_PARAMS}`,
      alt: "Exfoliating scrub jar and face wash bottle",
      creditName: "Vya Naturals",
      creditUrl: "https://unsplash.com/@vyanaturals",
    },
  ],
  Mist: [
    {
      url: `https://images.unsplash.com/photo-1599847987657-881f11b92a75?${UNSPLASH_PARAMS}`,
      alt: "Facial mist being sprayed",
      creditName: "Kalos Skincare",
      creditUrl: "https://unsplash.com/@kalosskin",
    },
  ],
};

/** Stable, non-random pick: the same product id always resolves to the same photo. */
const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getProductImage = (category: string, productId: string): CategoryImage | null => {
  const pool = categoryImages[category];
  if (!pool || pool.length === 0) return null;
  return pool[hashString(productId) % pool.length];
};
