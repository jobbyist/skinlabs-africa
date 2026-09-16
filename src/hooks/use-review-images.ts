import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage, type CategoryImage } from "@/data/productImages";
import { getBrandBanner } from "@/lib/brand-banners";
import { SITE_URL } from "@/lib/seo-config";
import { fetchCoverImage } from "@/lib/pexels";

export interface ReviewImage extends CategoryImage {
  reviewId: string;
}

type ImageMap = Record<string, ReviewImage>;

/** Cached across mounts — the photo set changes only when the seeder runs. */
let cache: ImageMap | null = null;
let inflight: Promise<ImageMap> | null = null;
/** Live Pexels/Unsplash resolutions for reviews missing DB + category pool images */
const liveCache = new Map<string, CategoryImage>();

const load = async (): Promise<ImageMap> => {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      const { data } = await supabase
        .from("review_images")
        .select("review_id, image_url, alt, credit_name, credit_url");
      const map: ImageMap = {};
      for (const row of data ?? []) {
        map[row.review_id] = {
          reviewId: row.review_id,
          url: row.image_url,
          alt: row.alt,
          creditName: row.credit_name,
          creditUrl: row.credit_url,
        };
      }
      cache = map;
      return map;
    })();
  }
  return inflight;
};

/**
 * Per-review images with brand banner priority:
 * 1. Brand-specific banner
 * 2. review_images DB row
 * 3. Category pool (static)
 * 4. Live Pexels (default) → Unsplash fallback via fetchCoverImage
 */
export const useReviewImages = () => {
  const [images, setImages] = useState<ImageMap>(() => cache ?? {});
  const [, setLiveTick] = useState(0);

  useEffect(() => {
    let active = true;
    void load().then((map) => {
      if (active) setImages(map);
    });
    return () => {
      active = false;
    };
  }, []);

  const toAbsolute = (url: string): string => {
    if (!url || url.startsWith("http")) return url;
    return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const ensureLiveImage = useCallback((reviewId: string, category: string, brand?: string) => {
    if (liveCache.has(reviewId)) return;
    const query = `${brand || ""} ${category} skincare product bottle`.trim();
    void fetchCoverImage(query).then((img) => {
      if (!img?.url) return;
      liveCache.set(reviewId, {
        url: img.url,
        alt: img.alt || `${category} product photography`,
        creditName: img.creditName || "Pexels",
        creditUrl: img.creditUrl || "https://www.pexels.com",
      });
      setLiveTick((t) => t + 1);
    });
  }, []);

  const getImage = (reviewId: string, category: string, brandName?: string): CategoryImage | null => {
    if (brandName) {
      const bannerPath = getBrandBanner(brandName);
      if (bannerPath) {
        return {
          url: toAbsolute(bannerPath),
          alt: `${brandName} brand banner`,
          creditName: brandName,
          creditUrl: "#",
        };
      }
    }

    const fromDb = images[reviewId];
    if (fromDb) return { ...fromDb, url: toAbsolute(fromDb.url) };

    const fromPool = getProductImage(category, reviewId);
    if (fromPool) return { ...fromPool, url: toAbsolute(fromPool.url) };

    const live = liveCache.get(reviewId);
    if (live) return live;

    ensureLiveImage(reviewId, category, brandName);
    return null;
  };

  return { images, getImage };
};
