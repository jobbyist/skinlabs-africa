/**
 * React hook for fetching Unsplash images with caching
 * Automatically handles loading states and fallbacks
 */
import { useState, useEffect } from "react";
import { fetchUnsplashImage, type ImageData } from "@/lib/unsplash";

type UseUnsplashImageResult = {
  image: ImageData | null;
  loading: boolean;
  error: boolean;
};

/**
 * Hook to fetch and cache Unsplash images for briefings and content
 */
export const useUnsplashImage = (
  query: string,
  fallbackUrl?: string
): UseUnsplashImageResult => {
  const [image, setImage] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetchUnsplashImage(query, fallbackUrl)
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

    return () => { mounted = false; };
  }, [query, fallbackUrl]);

  return { image, loading, error };
};
