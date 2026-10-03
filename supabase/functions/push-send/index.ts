/**
 * push-send — delivers Web Push notifications (VAPID) to members' registered devices.
 *
 * Callers
 *   { action: "test" }                    any signed-in member: a test notification to THEIR OWN devices only.
 *   { category, title, body, url, user_ids? }
 *                                         service role (cron / other functions) or an admin JWT.
 *                                         Sends to members whose notification_preferences allow `category`
 *                                         (promotional needs an explicit stored opt-in; see _shared/push/dispatch.ts).
 *
 * Secrets (Supabase Edge Function secrets — a human sets them, never committed):
 *   VAPID_PUBLIC_KEY    same value as the app's VITE_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY   PRIVATE — never in client code or the repo
 *   VAPID_SUBJECT       "mailto:support@skinlabs.co.za" (or an https URL)
 * Without them the function answers 503 `not_configured`.
 *
 * Subscriptions the push service reports gone (404/410) are deleted; other failures count up and the
 * subscription is deactivated after MAX_CONSECUTIVE_FAILURES. The private key is only read here.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import webpush from "npm:web-push@3.6.7";
import { resolveAuthedUser } from "../_shared/payments/authedUser.ts";
import {
  categoryAllowed,
  isGoneStatus,
  MAX_CONSECUTIVE_FAILURES,
  parseSendRequest,
  type PreferenceRow,
  type SendRequest,
} from "../_shared/push/dispatch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BATCH = 1000;

interface SubRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@skinlabs.co.za";
  if (!supabaseUrl || !serviceKey) return json({ error: "server_misconfigured" }, 500);
  if (!publicKey || !privateKey) return json({ error: "not_configured" }, 503);

  const text = await req.text();
  if (text.length > 8_000) return json({ error: "payload_too_large" }, 413);
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const isService = bearer === serviceKey;

  let targetUserIds: string[] | undefined;
  let request: SendRequest;

  if (raw.action === "test") {
    // A member testing their own devices.
    const user = await resolveAuthedUser(req, supabaseUrl);
    if (!user) return json({ error: "unauthorized" }, 401);
    targetUserIds = [user.userId];
    request = {
      category: "service",
      title: "SkinLabs® notifications are on",
      body: "This is a test notification from your account settings.",
      url: "/dashboard?tab=app",
      tag: "skinlabs-test",
    };
    // Rate limit: at most one test per 15 s per member.
    const { data: recent } = await db
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", user.userId)
      .gt("last_used_at", new Date(Date.now() - 15_000).toISOString())
      .limit(1);
    if (recent && recent.length > 0) return json({ error: "too_many_requests" }, 429);
  } else {
    if (!isService) {
      const user = await resolveAuthedUser(req, supabaseUrl);
      if (!user) return json({ error: "unauthorized" }, 401);
      const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.userId, _role: "admin" });
      if (!isAdmin) return json({ error: "forbidden" }, 403);
    }
    const parsed = parseSendRequest(raw);
    if (!parsed.ok) return json({ error: parsed.reason }, 400);
    request = parsed.request;
    targetUserIds = parsed.request.userIds;
  }
  const payload = { title: request.title, body: request.body, url: request.url, tag: request.tag, category: request.category };

  // 1. Active subscriptions (optionally restricted to specific members).
  let subsQuery = db.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth, failure_count").eq("is_active", true).limit(BATCH);
  if (targetUserIds) subsQuery = subsQuery.in("user_id", targetUserIds);
  const { data: subs, error: subsError } = await subsQuery;
  if (subsError) return json({ error: "lookup_failed" }, 500);
  const rows = (subs ?? []) as SubRow[];
  if (rows.length === 0) return json({ sent: 0, failed: 0, skipped: 0 });

  // 2. Preferences: only members who allow this category (test sends are to the member's own devices).
  let allowed = rows;
  if (raw.action !== "test") {
    const { data: prefs } = await db
      .from("notification_preferences")
      .select("user_id, podcast_episode, briefing, routine_reminder, account_update, promotional, service")
      .in("user_id", [...new Set(rows.map((r) => r.user_id))]);
    const byUser = new Map((prefs ?? []).map((p: PreferenceRow) => [p.user_id, p]));
    allowed = rows.filter((r) => categoryAllowed(byUser.get(r.user_id), request.category));
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const message = JSON.stringify({ ...payload });

  let sent = 0;
  let failed = 0;
  for (const sub of allowed) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, message, {
        TTL: 60 * 60 * 24,
        urgency: payload.category === "promotional" ? "low" : "normal",
      });
      sent++;
      await db.from("push_subscriptions").update({ last_used_at: new Date().toISOString(), failure_count: 0 }).eq("id", sub.id);
    } catch (error) {
      failed++;
      const status = (error as { statusCode?: number }).statusCode;
      if (isGoneStatus(status)) {
        await db.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        const failures = sub.failure_count + 1;
        await db.from("push_subscriptions").update({ failure_count: failures, is_active: failures < MAX_CONSECUTIVE_FAILURES }).eq("id", sub.id);
      }
    }
  }

  return json({ sent, failed, skipped: rows.length - allowed.length });
});
