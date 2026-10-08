import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { REVIEW_PLACEHOLDER_IMAGE, type CategoryImage } from "@/data/productImages";
import { getBrandBanner } from "@/lib/brand-banners";
import { SITE_URL } from "@/lib/seo-config";

export interface ReviewImage extends CategoryImage {
  reviewId: string;
  /** 'product' = a real brand/retailer image approved in Admin > Data Quality; anything else is a stock photo. */
  sourceKind?: string;
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
        .select("review_id, image_url, alt, credit_name, credit_url, source_kind" as never);
      const map: ImageMap = {};
      for (const row of (data ?? []) as unknown as { review_id: string; image_url: string; alt: string; credit_name: string; credit_url: string; source_kind?: string }[]) {
        map[row.review_id] = {
          reviewId: row.review_id,
          url: row.image_url,
          alt: row.alt,
          creditName: row.credit_name,
          creditUrl: row.credit_url,
          sourceKind: row.source_kind,
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
 * 0. Verified real product image (review_images.source_kind = 'product')
 * 1. Brand-specific banner
 * 2. Branded SkinLabs placeholder (never a stock photo)
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

  const toAbsolute = (url: string): string => {
    if (!url || url.startsWith("http")) return url;
    return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const getImage = (reviewId: string, category: string, brandName?: string): (CategoryImage & { isProduct?: boolean }) | null => {
    // A verified real product image (brand website / retailer) always wins over a brand banner or stock photo.
    const real = images[reviewId];
    if (real?.sourceKind === "product") return { ...real, url: real.url, isProduct: true };

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

    // No approved product image: the branded placeholder, never a stock (Unsplash/Pexels) photo.
    return { ...REVIEW_PLACEHOLDER_IMAGE, url: toAbsolute(REVIEW_PLACEHOLDER_IMAGE.url) };
  };

  return { images, getImage };
};
