/**
 * React hook for fetching cover/thumbnail images with caching.
 * Unsplash is the sole image API; on failure it falls back to the local
 * SkinLabs placeholder. Automatically handles loading states and attribution.
 */
import { useState, useEffect } from "react";
import { fetchCoverImage, type ImageData } from "@/lib/unsplash";

type UseCoverImageResult = {
  image: ImageData | null;
  loading: boolean;
  error: boolean;
};

/**
 * Hook to fetch and cache cover images for briefings and content.
 * Prefer this over the legacy useUnsplashImage name for new code.
 */
export const useCoverImage = (
  query: string,
  fallbackUrl?: string
): UseCoverImageResult => {
  const [image, setImage] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetchCoverImage(query, fallbackUrl)
      .then((result) => {
        if (mounted) {
          setImage(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [query, fallbackUrl]);

  return { image, loading, error };
};

// Keep the old name as an alias for existing call sites
export const useUnsplashImage = useCoverImage;
