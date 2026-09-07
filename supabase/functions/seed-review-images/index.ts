/**
 * Assigns a unique, credited Unsplash photo to every product review.
 *
 * The review catalogue lives in the front-end bundle, so the caller posts the
 * list of { id, category } pairs. For each category we page through Unsplash
 * search results (a handful of query variants) until we have enough distinct
 * photos to give every review in that category its own image, then upsert the
 * result into public.review_images.
 *
 * Auth: admin JWT, or the x-cron-secret shared with the newsroom job.
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

interface Photo {
  id: string;
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
}

async function search(query: string, page: number, key: string): Promise<Photo[]> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "30");
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
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
      id: r.id!,
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

    if (!authorised) {
      const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
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

    const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!key) throw new Error("UNSPLASH_ACCESS_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const reviews: { id: string; category: string }[] = Array.isArray(body?.reviews) ? body.reviews : [];
    const force = body?.force === true;
    if (reviews.length === 0) {
      return new Response(JSON.stringify({ error: "reviews[] is required" }), {
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
          apiCalls += 1;
          const photos = await search(query, page, key);
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
