/**
 * Client-side Unsplash integration for SkinLabs Africa
 * Fetches beauty and skincare imagery with photographer credits
 */

export type ImageData = {
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
};

type PhotoResult = {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  urls?: { regular?: string; full?: string };
  user?: { name?: string; links?: { html?: string } };
};

type SearchResult = {
  total: number;
  results: PhotoResult[];
};

// Cache images to minimize API requests
const cache = new Map<string, ImageData>();

/**
 * Add UTM parameters for attribution tracking
 */
const addTrackingParams = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  try {
    const parsed = new URL(imageUrl);
    parsed.searchParams.append("utm_source", "skinlabs");
    parsed.searchParams.append("utm_medium", "referral");
    return parsed.toString();
  } catch {
    return imageUrl;
  }
};

/**
 * Fetch skincare-related images from Unsplash with attribution
 * Falls back to provided URL if API unavailable
 */
export const fetchUnsplashImage = async (
  searchQuery: string,
  defaultUrl?: string
): Promise<ImageData | null> => {
  const normalized = searchQuery.toLowerCase().trim();
  
  // Return cached result if available
  if (cache.has(normalized)) {
    return cache.get(normalized)!;
  }

  const apiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  
  // Return fallback if no key configured
  if (!apiKey) {
    if (defaultUrl) {
      return { url: defaultUrl, alt: searchQuery, creditName: "SkinLabs", creditUrl: "https://unsplash.com" };
    }
    return null;
  }

  try {
    const endpoint = new URL("https://api.unsplash.com/search/photos");
    endpoint.searchParams.append("query", searchQuery);
    endpoint.searchParams.append("per_page", "1");
    endpoint.searchParams.append("orientation", "landscape");
    endpoint.searchParams.append("content_filter", "high");

    const res = await fetch(endpoint.toString(), {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!res.ok) {
      console.warn(`Unsplash request failed: ${res.status}`);
      if (defaultUrl) return { url: defaultUrl, alt: searchQuery, creditName: "SkinLabs", creditUrl: "https://unsplash.com" };
      return null;
    }

    const json: SearchResult = await res.json();
    const firstPhoto = json.results[0];
    if (!firstPhoto) {
      if (defaultUrl) return { url: defaultUrl, alt: searchQuery, creditName: "SkinLabs", creditUrl: "https://unsplash.com" };
      return null;
    }

    const imageData: ImageData = {
      url: addTrackingParams(firstPhoto.urls?.regular || firstPhoto.urls?.full || defaultUrl || ""),
      alt: `${firstPhoto.alt_description || firstPhoto.description || searchQuery} - Photo by ${firstPhoto.user?.name || "Photographer"} on Unsplash`,
      creditName: firstPhoto.user?.name || "Unsplash Contributor",
      creditUrl: addTrackingParams(firstPhoto.user?.links?.html || "https://unsplash.com"),
    };

    cache.set(normalized, imageData);
    return imageData;
  } catch (err) {
    console.error("Unsplash fetch error:", err);
    if (defaultUrl) return { url: defaultUrl, alt: searchQuery, creditName: "SkinLabs", creditUrl: "https://unsplash.com" };
    return null;
  }
};
