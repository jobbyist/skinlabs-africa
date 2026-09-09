import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage, type CategoryImage } from "@/data/productImages";
import { getBrandBanner } from "@/lib/brand-banners";

export interface ReviewImage extends CategoryImage {
  reviewId: string;
}

type ImageMap = Record<string, ReviewImage>;

/** Cached across mounts — the photo set changes only when the seeder runs. */
let cache: ImageMap | null = null;
let inflight: Promise<ImageMap> | null = null;

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
 * 1. Brand-specific banner image (if available)
 * 2. If found, it uses /public/brandbanners/{brandname}.jpg or /public/brandbanners/{brandname}.PNG
 * 3. Category pool as fallback
 */
export const useReviewImages = () => {
  const [images, setImages] = useState<ImageMap>(() => cache ?? {});

  useEffect(() => {
    let active = true;
    void load().then((map) => {
      if (active) setImages(map);
    });
    return () => {
      active = false;
    };
  }, []);

  const getImage = (reviewId: string, category: string, brandName?: string): CategoryImage | null => {
    // Priority 1: Check for brand banner
    if (brandName) {
      const bannerPath = getBrandBanner(brandName);
      if (bannerPath) {
        return {
          url: bannerPath,
          alt: `${brandName} brand banner`,
          creditName: brandName,
          creditUrl: "#",
        };
      }
    }
    
    // Priority 2 & 3: Database images or category pool
    return images[reviewId] ?? getProductImage(category, reviewId);
  };

  return { images, getImage };
};
