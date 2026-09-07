/**
 * Unsplash API integration for The Daily Skinny cover and in-body imagery.
 * Enforces unique image selection per article with proper attribution.
 * Falls back gracefully when API key is unavailable to prevent sync failures.
 */

export interface UnsplashImage {
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
}

const UTM = "?utm_source=SkinLabs&utm_medium=referral";

interface UnsplashResult {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  urls?: { regular?: string; full?: string };
  user?: { name?: string; links?: { html?: string } };
}

export async function searchUnsplash(query: string, exclude: Set<string> = new Set()): Promise<UnsplashImage | null> {
  const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!key) return null;

  // Rate limit protection: small delay between requests
  if (exclude.size > 0) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "8");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
  });
  if (!res.ok) {
    console.error(`Unsplash search failed [${res.status}]: ${(await res.text()).slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  const results: UnsplashResult[] = Array.isArray(data?.results) ? data.results : [];
  
  // Find first result that hasn't been used
  const available = results.filter((r) => r?.id && !exclude.has(r.id));
  if (available.length === 0) {
    console.warn(`No unique Unsplash images found for query: "${query}"`);
    return null;
  }
  
  const pick = available[0];
  if (pick?.id) exclude.add(pick.id);

  return {
    url: `${pick.urls?.regular ?? pick.urls?.full}`,
    alt: pick.alt_description || pick.description || query,
    creditName: pick.user?.name ?? "Unsplash",
    creditUrl: `${pick.user?.links?.html ?? "https://unsplash.com"}${UTM}`,
  };
}
