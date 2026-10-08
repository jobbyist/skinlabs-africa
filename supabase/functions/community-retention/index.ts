// Community Forum retention (daily, pg_cron `community-retention-daily`).
//   * member posts older than 30 days (and posts deleted/removed over 7 days ago) are removed together with their picture;
//     pinned posts and seed-persona posts are kept
//   * member comments older than 30 days are removed
//   * uploaded pictures no post references (abandoned composes) are removed after a day
// Picture files must go through the Storage API (deleting storage.objects rows in SQL leaves the file behind), so this
// is an edge function rather than a SQL job. Auth: the `x-cron-secret` header is verified IN THE DATABASE against the
// Vault secret (community_retention_secret_matches), so no Edge secret has to be set. Self-contained on purpose
// (no ../ imports) so it can be deployed with a plain file upload.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const BUCKET = "community-media";
const BATCH = 200;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "not_configured" }, 503);
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: ok } = await admin.rpc("community_retention_secret_matches", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (ok !== true) return json({ error: "unauthorized" }, 401);

  const result = { posts: 0, comments: 0, pictures_removed: 0, orphans_removed: 0, skipped_posts: 0, errors: [] as string[] };

  const { data: due, error: dueErr } = await admin.rpc("community_retention_candidates", { p_limit: BATCH });
  if (dueErr) return json({ error: "candidates_failed", detail: dueErr.message }, 500);
  const rows = (due ?? []) as { id: string; image_path: string | null }[];

  // Remove the pictures first; a post whose picture could not be removed is left for tomorrow so no file is orphaned.
  const withImages = rows.filter((r) => r.image_path);
  const failedPaths = new Set<string>();
  if (withImages.length) {
    const paths = withImages.map((r) => r.image_path as string);
    const { error } = await admin.storage.from(BUCKET).remove(paths);
    if (error) {
      result.errors.push(`picture removal: ${error.message}`);
      paths.forEach((p) => failedPaths.add(p));
    } else {
      result.pictures_removed = paths.length;
    }
  }
  const purgeIds = rows.filter((r) => !r.image_path || !failedPaths.has(r.image_path)).map((r) => r.id);
  result.skipped_posts = rows.length - purgeIds.length;

  const { data: purged, error: purgeErr } = await admin.rpc("community_retention_purge", { p_post_ids: purgeIds });
  if (purgeErr) result.errors.push(`purge: ${purgeErr.message}`);
  else {
    result.posts = (purged as { posts?: number })?.posts ?? 0;
    result.comments = (purged as { comments?: number })?.comments ?? 0;
  }

  const { data: orphans } = await admin.rpc("community_retention_orphans", { p_limit: BATCH });
  const orphanPaths = ((orphans ?? []) as { name: string }[]).map((o) => o.name);
  if (orphanPaths.length) {
    const { error } = await admin.storage.from(BUCKET).remove(orphanPaths);
    if (error) result.errors.push(`orphans: ${error.message}`);
    else result.orphans_removed = orphanPaths.length;
  }

  console.log(JSON.stringify({ event: "community_retention", ...result }));
  return json({ ok: result.errors.length === 0, ...result });
});
