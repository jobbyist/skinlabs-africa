/**
 * tiktok-events — server side of the TikTok Pixel (Events API 2.0, web).
 *
 * The browser pixel (src/lib/tiktok/pixel.ts) and this function report the SAME
 * conversion with the SAME event_id, so TikTok de-duplicates them while the
 * server copy survives ad blockers and Safari's cookie limits.
 *
 * Privacy:
 * - The client only calls this after the visitor accepted "Advertising /
 *   Targeting" cookies, and says so (`consent: true`); anything else is refused.
 * - Only whitelisted standard events are forwarded (_shared/tiktok/eventsApi.ts).
 * - Email / account id are never accepted from the client. If the caller sends a
 *   valid user JWT, the email comes from the verified token and is SHA-256 hashed
 *   here. Page URLs are reduced to origin + path (no query strings).
 *
 * Secrets (Supabase Edge Function secrets — a human sets them):
 *   TIKTOK_EVENTS_ACCESS_TOKEN  Events API access token (Events Manager → Settings)
 *   TIKTOK_PIXEL_CODE           optional override, defaults to the live pixel
 *   TIKTOK_TEST_EVENT_CODE      optional; while set, events show up under
 *                               "Test events" in Events Manager (remove after testing)
 * Without the access token the function answers 503 `not_configured` and the
 * browser pixel keeps working on its own.
 */
import { buildTrackBody, validateIncomingEvent } from "../_shared/tiktok/eventsApi.ts";
import { resolveAuthedUser } from "../_shared/payments/authedUser.ts";

const DEFAULT_PIXEL_CODE = "DB0DGNBC77U1FE0MB8Q0";
const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const accessToken = Deno.env.get("TIKTOK_EVENTS_ACCESS_TOKEN");
  if (!accessToken) return json({ error: "not_configured" }, 503);

  const text = await req.text();
  if (text.length > 8_000) return json({ error: "payload_too_large" }, 413);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const parsed = validateIncomingEvent(raw);
  if (!parsed.ok) return json({ error: parsed.reason }, 400);

  // Optional: a signed-in caller's email comes from the verified JWT, never the body.
  let email: string | undefined;
  let userId: string | undefined;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (supabaseUrl && req.headers.get("Authorization")?.startsWith("Bearer ")) {
    try {
      const user = await resolveAuthedUser(req, supabaseUrl);
      if (user) {
        email = user.email || undefined;
        userId = user.userId;
      }
    } catch {
      /* anonymous is fine */
    }
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || undefined;
  const body = await buildTrackBody({
    pixelCode: Deno.env.get("TIKTOK_PIXEL_CODE") || DEFAULT_PIXEL_CODE,
    event: parsed.event,
    context: { ip, userAgent: req.headers.get("user-agent") ?? undefined, email, userId },
    testEventCode: Deno.env.get("TIKTOK_TEST_EVENT_CODE") || undefined,
  });

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": accessToken },
      body: JSON.stringify(body),
    });
    const result = (await res.json().catch(() => ({}))) as { code?: number; message?: string };
    if (!res.ok || (typeof result.code === "number" && result.code !== 0)) {
      // The token is never logged; TikTok's own message is safe to.
      console.error("tiktok-events upstream error", { status: res.status, code: result.code, message: result.message });
      return json({ error: "upstream_error", code: result.code ?? res.status }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error("tiktok-events fetch failed", (err as Error).message);
    return json({ error: "upstream_unreachable" }, 502);
  }
});
