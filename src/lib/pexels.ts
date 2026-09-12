/**
 * Client-side Pexels integration for SkinLabs Africa
 * Primary source for briefing/cover thumbnail images with proper attribution.
 * Falls back to Unsplash when Pexels is unavailable or rate-limited.
 *
 * Rate limits (default free tier): 200 requests/hour, 20 000/month.
 * We cache aggressively in-memory to stay well under these limits.
 */

import { fetchUnsplashImage } from "./unsplash";
import type { ImageData } from "./unsplash";

export type { ImageData };

type PexelsPhoto = {
  id: number;
  alt?: string | null;
  src?: { large?: string; original?: string; medium?: string };
  photographer?: string;
  photographer_url?: string;
  url?: string;
};

type PexelsSearchResult = {
  total_results: number;
  photos: PexelsPhoto[];
};

// In-memory cache to minimise API calls and respect rate limits
const cache = new Map<string, ImageData>();

const addTrackingParams = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  try {
    const parsed = new URL(imageUrl);
    return parsed.toString();
  } catch {
    return imageUrl;
  }
};

/**
 * Fetch a landscape image from Pexels for the given query.
 * Returns null on failure so callers can fall back to Unsplash.
 */
export const fetchPexelsImage = async (
  searchQuery: string,
  defaultUrl?: string
): Promise<ImageData | null> => {
  const normalized = searchQuery.toLowerCase().trim();

  if (cache.has(normalized)) {
    return cache.get(normalized)!;
  }

  const apiKey = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

  if (!apiKey) {
    return null;
  }

  try {
    const endpoint = new URL("https://api.pexels.com/v1/search");
    endpoint.searchParams.append("query", searchQuery);
    endpoint.searchParams.append("per_page", "1");
    endpoint.searchParams.append("orientation", "landscape");

    const res = await fetch(endpoint.toString(), {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!res.ok) {
      console.warn(`Pexels request failed: ${res.status}`);
      return null;
    }

    const json = (await res.json()) as PexelsSearchResult;
    const first = json.photos?.[0];
    if (!first) {
      return null;
    }

    const imageData: ImageData = {
      url: addTrackingParams(
        first.src?.large || first.src?.original || first.src?.medium || defaultUrl || ""
      ),
      alt: `${first.alt || searchQuery} - Photo by ${first.photographer || "Photographer"} on Pexels`,
      creditName: first.photographer || "Pexels Contributor",
      creditUrl: first.photographer_url || first.url || "https://www.pexels.com",
    };

    cache.set(normalized, imageData);
    return imageData;
  } catch (err) {
    console.error("Pexels fetch error:", err);
    return null;
  }
};

/**
 * Primary entry point for cover/thumbnail images.
 * Tries Pexels first (default), then Unsplash, then the supplied defaultUrl.
 */
export const fetchCoverImage = async (
  searchQuery: string,
  defaultUrl?: string
): Promise<ImageData | null> => {
  const fromPexels = await fetchPexelsImage(searchQuery, defaultUrl);
  if (fromPexels) return fromPexels;

  return fetchUnsplashImage(searchQuery, defaultUrl);
};
