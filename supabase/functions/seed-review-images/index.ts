/**
 * Assigns a unique, credited cover photo to every product review.
 *
 * The review catalogue lives in the front-end bundle, so the caller posts the
 * list of { id, category } pairs (see scripts/backfill-review-images.ts). For
 * each category we page through search results -- Pexels first (higher
 * default resolution, 200 req/hour free tier), Unsplash as fallback -- until
 * we have enough distinct photos to give every review in that category its
 * own image, then upsert the result into public.review_images.
 *
 * Auth: admin JWT, or the x-cron-secret shared with the newsroom job.
 *
 * Required secret (cannot be set from this codebase -- a human must add it
 * via `supabase secrets set PEXELS_API_KEY=...`, same documented-gap pattern
 * as MARKETPLACE_CRON_SECRET/GEMINI_API_KEY elsewhere in this project):
 *   PEXELS_API_KEY   Pexels API key (https://www.pexels.com/api/).
 * UNSPLASH_ACCESS_KEY (already required by this function before this change)
 * is kept as the fallback when Pexels has no key configured or returns
 * nothing for a given query.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const UNSPLASH_PARAMS = "auto=format&fit=crop&w=1200&q=80";
const UTM = "?utm_source=SkinLabs&utm_medium=referral";

const CATEGORY_QUERIES: Record<string, string[]> = {
  Serum: [
    "skincare serum bottle",
    "facial serum dropper",
    "glass dropper bottle cosmetics",
    "skincare products flatlay",
    "beauty serum packaging",
  ],
  Moisturiser: [
    "face cream jar",
    "moisturiser skincare jar",
    "cosmetic cream texture",
    "skincare cream packaging",
  ],
  Cleanser: [
    "facial cleanser bottle",
    "face wash tube",
    "cleansing foam skincare",
  ],
  Body: [
    "body lotion bottle",
    "body oil skincare",
    "bath and body products",
  ],
  Sunscreen: [
    "sunscreen tube",
    "sunscreen lotion beach",
    "spf skincare product",
  ],
  Exfoliant: ["exfoliating scrub jar", "face scrub skincare"],
  Mist: ["facial mist spray", "toner spray bottle"],
  "Eye Cream": ["eye cream tube", "small skincare tube cosmetics"],
};

const FALLBACK_QUERIES = ["skincare product", "cosmetics bottle", "beauty products"];

/** Strips whitespace/newlines a secret may have picked up from how it was set
 *  (e.g. `supabase secrets set` splitting a pasted multi-line value) --
 *  fetch's Headers implementation throws "Invalid header value" on a raw
 *  newline, which is never legitimately part of an API key. */
const sanitizeKey = (key: string): string => key.replace(/\s+/g, "");

interface Photo {
  /** Prefixed with its source ("pexels:123"/"unsplash:abc") so IDs from the
   *  two providers can never collide in the review_images.photo_id column. */
  id: string;
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
}

async function searchPexels(query: string, page: number, key: string): Promise<Photo[]> {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "30");
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url.toString(), { headers: { Authorization: sanitizeKey(key) } });
  if (!res.ok) {
    console.error(`Pexels ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return [];
  }
  const data = await res.json();
  interface Row {
    id?: number;
    alt?: string | null;
    photographer?: string;
    photographer_url?: string;
    src?: { large2x?: string; large?: string; original?: string };
  }
  const rows: Row[] = Array.isArray(data?.photos) ? data.photos : [];
  return rows
    .filter((r) => r?.id != null && (r.src?.large2x || r.src?.large || r.src?.original))
    .map((r) => ({
      id: `pexels:${r.id}`,
      url: r.src!.large2x || r.src!.large || r.src!.original!,
      alt: (r.alt || query).slice(0, 200),
      creditName: r.photographer ?? "Pexels Contributor",
      creditUrl: `${r.photographer_url ?? "https://www.pexels.com"}${UTM}`,
    }));
}

async function searchUnsplash(query: string, page: number, key: string): Promise<Photo[]> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "30");
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${sanitizeKey(key)}`, "Accept-Version": "v1" },
  });
  if (!res.ok) {
    console.error(`Unsplash ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return [];
  }
  const data = await res.json();
  interface Row {
    id?: string;
    alt_description?: string | null;
    description?: string | null;
    urls?: { raw?: string; regular?: string };
    user?: { name?: string; links?: { html?: string } };
  }
  const rows: Row[] = Array.isArray(data?.results) ? data.results : [];
  return rows
    .filter((r) => r?.id && (r.urls?.raw || r.urls?.regular))
    .map((r) => ({
      id: `unsplash:${r.id}`,
      url: r.urls!.raw ? `${r.urls!.raw}&${UNSPLASH_PARAMS}` : r.urls!.regular!,
      alt: (r.alt_description || r.description || query).slice(0, 200),
      creditName: r.user?.name ?? "Unsplash",
      creditUrl: `${r.user?.links?.html ?? "https://unsplash.com"}${UTM}`,
    }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const cronSecret = Deno.env.get("NEWS_CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    let authorised = Boolean(cronSecret && provided && provided === cronSecret);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!authorised && token && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      authorised = true;
    }

    if (!authorised) {
      if (token) {
        const { data: userData } = await admin.auth.getUser(token);
        if (userData?.user) {
          const { data: isAdmin } = await admin.rpc("has_role", {
            _user_id: userData.user.id,
            _role: "admin",
          });
          authorised = Boolean(isAdmin);
        }
      }
    }
    if (!authorised) {
      return new Response(JSON.stringify({ error: "Not authorised" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pexelsKey = Deno.env.get("PEXELS_API_KEY");
    const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!pexelsKey && !unsplashKey) {
      throw new Error("Neither PEXELS_API_KEY nor UNSPLASH_ACCESS_KEY is configured");
    }

    const body = await req.json().catch(() => ({}));
    // Accept either reviews: [{ id, category }] or the compact grouped: { category: [id, ...] }.
    const grouped = body?.grouped && typeof body.grouped === "object" ? body.grouped as Record<string, string[]> : null;
    const reviews: { id: string; category: string }[] = Array.isArray(body?.reviews)
      ? body.reviews
      : grouped
        ? Object.entries(grouped).flatMap(([category, ids]) =>
            (Array.isArray(ids) ? ids : []).map((id) => ({ id, category })))
        : [];
    const force = body?.force === true;
    if (reviews.length === 0) {
      return new Response(JSON.stringify({ error: "reviews[] or grouped{} is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingRows } = await admin.from("review_images").select("review_id, photo_id");
    const existing = new Map((existingRows ?? []).map((r: { review_id: string; photo_id: string | null }) => [r.review_id, r.photo_id]));
    const usedPhotoIds = new Set<string>(
      force ? [] : (existingRows ?? []).map((r: { photo_id: string | null }) => r.photo_id).filter(Boolean) as string[],
    );

    const pending = reviews.filter((r) => force || !existing.has(r.id));
    const byCategory = new Map<string, string[]>();
    for (const r of pending) {
      const list = byCategory.get(r.category) ?? [];
      list.push(r.id);
      byCategory.set(r.category, list);
    }

    const rows: Record<string, unknown>[] = [];
    let apiCalls = 0;

    for (const [category, ids] of byCategory) {
      const queries = [...(CATEGORY_QUERIES[category] ?? []), ...FALLBACK_QUERIES];
      const pool: Photo[] = [];

      outer: for (const query of queries) {
        for (let page = 1; page <= 3; page++) {
          if (pool.length >= ids.length) break outer;

          let photos: Photo[] = [];
          if (pexelsKey) {
            apiCalls += 1;
            photos = await searchPexels(query, page, pexelsKey);
          }
          if (photos.length === 0 && unsplashKey) {
            apiCalls += 1;
            await new Promise((r) => setTimeout(r, 150));
            photos = await searchUnsplash(query, page, unsplashKey);
          }

          for (const p of photos) {
            if (usedPhotoIds.has(p.id)) continue;
            usedPhotoIds.add(p.id);
            pool.push(p);
          }
          if (photos.length === 0) break;
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      ids.forEach((id, idx) => {
        const photo = pool[idx];
        if (!photo) return;
        rows.push({
          review_id: id,
          image_url: photo.url,
          alt: photo.alt,
          credit_name: photo.creditName,
          credit_url: photo.creditUrl,
          photo_id: photo.id,
        });
      });
    }

    if (rows.length > 0) {
      const { error } = await admin.from("review_images").upsert(rows, { onConflict: "review_id" });
      if (error) throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ ok: true, assigned: rows.length, pending: pending.length, apiCalls }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("seed-review-images failed:", err);
    return new Response(JSON.stringify({ error: String(err).slice(0, 400) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
