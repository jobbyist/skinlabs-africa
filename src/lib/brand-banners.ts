/**
 * Brand banner image mappings for product reviews
 * Maps brand names to their respective banner images stored in /public/brandbanners/
 */

export interface BrandBanner {
  brand: string;
  imagePath: string;
  alt: string;
}

/**
 * Brand name to banner image mapping
 * Normalized brand names for case-insensitive matching
 */
export const brandBannerMap: Record<string, string> = {
  "down to earth": "/brandbanners/downtoearth.jpg",
  "lelive": "/brandbanners/lelive.jpg",
  "haus of aura": "/brandbanners/hausofaura.jpg",
  "ftn": "/brandbanners/ftn.jpg",
  "nky beauty": "/brandbanners/nkybeauty.jpg",
  "skin functional": "/brandbanners/skinfunctional.jpg",
  "simply bee": "/brandbanners/simplybee.jpg",
  "esse": "/brandbanners/esse.jpg",
  "cor": "/brandbanners/cor.jpg",
  "cor skincare": "/brandbanners/cor.jpg",
  "standard beauty": "/brandbanners/standard.jpg",
  "gene": "/brandbanners/gene.jpg",
  "hey gorgeous": "/brandbanners/heygorgeous.jpg",
  "the ordinary": "/brandbanners/ordinary.jpg",
  "optiphi": "/brandbanners/optiphi.jpg",
  "skin creamery": "/brandbanners/skincreamery.jpg",
  "nimue": "/brandbanners/nimue.jpg",
  "timeless": "/brandbanners/timeless.jpg",
  "cerave": "/brandbanners/cerave.jpg",
  "portia m": "/brandbanners/portia.jpg",
  "skoon": "/brandbanners/skoon.jpg",
};

/**
 * Get the brand banner image path for a given brand name
 * Returns null if no banner exists for the brand
 */
export const getBrandBanner = (brandName: string): string | null => {
  const normalizedBrand = brandName.toLowerCase().trim();
  return brandBannerMap[normalizedBrand] || null;
};

/**
 * Check if a brand has a banner image
 */
export const hasBrandBanner = (brandName: string): boolean => {
  return getBrandBanner(brandName) !== null;
};
