import { createFileRoute } from "@tanstack/react-router";
import { createSupabaseServerClient } from "@/lib/content/supabaseServerClient";
import { isAmpEligible, renderAmpStory } from "@/lib/webStories/amp";
import { storyFromRow, WEB_STORY_SELECT, type WebStoryRow } from "@/lib/webStories/stories";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const AMP_EVENTS = new Set(["page_view", "complete"]);

const notFound = () =>
  new Response("Story not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

/**
 * /web-stories/:slug — server-only route returning a pure AMP Web Story
 * document (no TanStack document wrapping, same approach as sitemap.xml).
 * Routed to the SSR function ahead of the filesystem phase via the
 * "/web-stories/" entry in scripts/assemble-vercel-output.ts. Only authored,
 * published, multi-page stories get a page (RLS already hides drafts and
 * expired stories). POST receives amp-analytics beacons from the same page.
 */
export const Route = createFileRoute("/web-stories/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!SLUG_PATTERN.test(params.slug)) return notFound();
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from("web_stories").select(WEB_STORY_SELECT).eq("slug", params.slug).maybeSingle();
        if (error) {
          console.error("web-stories route: fetch failed", error);
          return new Response("Temporarily unavailable", { status: 503 });
        }
        if (!data) return notFound();
        const story = storyFromRow(data as unknown as WebStoryRow);
        if (!isAmpEligible(story)) return notFound();
        return new Response(renderAmpStory(story), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
      POST: async ({ params, request }) => {
        const url = new URL(request.url);
        const event = url.searchParams.get("event") ?? "";
        const page = Number.parseInt(url.searchParams.get("page") ?? "", 10);
        if (!SLUG_PATTERN.test(params.slug) || !AMP_EVENTS.has(event)) return new Response(null, { status: 204 });
        const supabase = createSupabaseServerClient();
        const { error } = await supabase.from("web_story_events").insert({
          story_key: params.slug,
          event,
          page_index: Number.isFinite(page) && page >= 0 && page <= 50 ? page : null,
          surface: "amp",
        });
        if (error) console.warn("web-stories route: event insert failed", error.message);
        return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
      },
    },
  },
});
