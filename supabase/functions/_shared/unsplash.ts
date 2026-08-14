/**
 * Unsplash image search with attribution, used for Daily Skinny cover and
 * in-body imagery. Falls back to null so a missing key never breaks a sync.
 */

export interface UnsplashImage {
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
}

const UTM = "?utm_source=SkinLabs&utm_medium=referral";

export async function searchUnsplash(query: string, exclude: Set<string> = new Set()): Promise<UnsplashImage | null> {
  const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!key) return null;

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
  const results: any[] = Array.isArray(data?.results) ? data.results : [];
  const pick = results.find((r) => r?.id && !exclude.has(r.id)) ?? results[0];
  if (!pick) return null;
  exclude.add(pick.id);

  return {
    url: `${pick.urls?.regular ?? pick.urls?.full}`,
    alt: pick.alt_description || pick.description || query,
    creditName: pick.user?.name ?? "Unsplash",
    creditUrl: `${pick.user?.links?.html ?? "https://unsplash.com"}${UTM}`,
  };
}
