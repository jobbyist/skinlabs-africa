import { SITE_URL } from "@/lib/seo-config";

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
 *
 * NOTE: these previously pointed at ".jpg" paths that never existed on disk
 * — the real files in public/brandbanners/ were always uppercase ".PNG".
 * That's a case-sensitive-filesystem 404 in production (Vercel/Linux), not
 * just a dev-machine quirk, and getAbsoluteBrandBanner() feeds these URLs
 * into JSON-LD/OG image tags too, so it was a real broken-image link in
 * structured data. Fixed alongside converting the source files to WebP
 * (photographic/logo PNGs re-encoded ~88% smaller with no visible quality
 * loss — see scripts/compress-images.ts's header comment for why public/
 * assets need this done as real files, not a runtime transform).
 */
export const brandBannerMap: Record<string, string> = {
  "down to earth": "/brandbanners/downtoearth.webp",
  "lelive": "/brandbanners/lelive.webp",
  "haus of aura": "/brandbanners/hausofaura.webp",
  "ftn": "/brandbanners/ftn.webp",
  "nky beauty": "/brandbanners/nkybeauty.webp",
  "skin functional": "/brandbanners/skinfunctional.webp",
  "simply bee": "/brandbanners/simplybee.webp",
  "esse": "/brandbanners/esse.webp",
  "cor": "/brandbanners/cor.webp",
  "cor skincare": "/brandbanners/cor.webp",
  "standard beauty": "/brandbanners/standard.webp",
  "gene": "/brandbanners/gene.webp",
  "hey gorgeous": "/brandbanners/heygorgeous.webp",
  "the ordinary": "/brandbanners/ordinary.webp",
  "optiphi": "/brandbanners/optiphi.webp",
  "skin creamery": "/brandbanners/skincreamery.webp",
  "nimue": "/brandbanners/nimue.webp",
  "timeless": "/brandbanners/timeless.webp",
  "cerave": "/brandbanners/cerave.webp",
  "portia m": "/brandbanners/portia.webp",
  "skoon": "/brandbanners/skoon.webp",
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

/** Absolute brand-banner URL for schema / img src (never relative). */
export const getAbsoluteBrandBanner = (brandName: string): string | null => {
  const path = getBrandBanner(brandName);
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
