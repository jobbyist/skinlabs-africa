import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage, type CategoryImage } from "@/data/productImages";

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

/** Per-review Unsplash photos from the database, with the category pool as fallback. */
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

  const getImage = (reviewId: string, category: string): CategoryImage | null =>
    images[reviewId] ?? getProductImage(category, reviewId);

  return { images, getImage };
};
