/**
 * notification-dispatcher — delivers the push half of the notification engine.
 *
 * notification_dispatches rows are queued in SQL by enqueue_notification(). Every minute (only when something is
 * due) pg_cron calls this function; it claims rows with claim_notification_dispatches() — which has ALREADY applied
 * the kill switch, category preferences, quiet hours (SAST), the daily cap and guards, so none of that is repeated
 * here — sends them with VAPID Web Push, records one push_deliveries row per device, prunes dead subscriptions and
 * closes each dispatch with complete_notification_dispatch().
 *
 * Auth (verify_jwt = false; custom). ANY of:
 *   x-cron-secret      accepted by rpc notification_cron_secret_matches (Vault `notification_dispatcher_cron_secret`)
 *   Authorization      the service-role key (constant-time compare)
 *   Authorization      a signed-in member who has the admin role
 * Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT. Without the keys: 503 not_configured BEFORE anything
 * is claimed, so dispatches stay pending.
 *
 * pg_net only waits 5 s, so the work runs in EdgeRuntime.waitUntil and the caller gets an immediate 202.
 * An authorised caller may add ?wait=1 to run inline and receive the counts.
 * Never logs endpoints, keys or payloads (only counts and status tokens).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import webpush from "npm:web-push@3.6.7";
import { resolveAuthedUser } from "../_shared/payments/authedUser.ts";
import { safeCompare } from "../_shared/push/dispatch.ts";
import {
  authoriseDispatcher,
  buildPushPayload,
  CLAIM_BATCH,
  classifyDelivery,
  PUSH_TTL_SECONDS,
  runPool,
  SEND_POOL_SIZE,
  SEND_TIMEOUT_MS,
  shouldClaimAnotherRound,
  subscriptionActionFor,
  summariseOutcomes,
  urgencyFor,
  type ClaimedDispatch,
  type ClaimedSubscription,
  type DeliveryOutcome,
} from "../_shared/push/notificationDispatch.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Db = ReturnType<typeof createClient>;

interface Totals {
  rounds: number;
  dispatches: number;
  devicesSent: number;
  devicesFailed: number;
  devicesGone: number;
}

const sendOne = async (
  dispatch: ClaimedDispatch,
  sub: ClaimedSubscription,
): Promise<{ sub: ClaimedSubscription; deliveryId: string; outcome: DeliveryOutcome }> => {
  const deliveryId = crypto.randomUUID();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(buildPushPayload(dispatch, deliveryId)),
      { TTL: PUSH_TTL_SECONDS, urgency: urgencyFor(dispatch.d_category), timeout: SEND_TIMEOUT_MS },
    );
    return { sub, deliveryId, outcome: classifyDelivery(undefined) };
  } catch (error) {
    return { sub, deliveryId, outcome: classifyDelivery(error) };
  }
};

const processRound = async (db: Db, totals: Totals): Promise<number> => {
  const { data, error } = await db.rpc("claim_notification_dispatches", { p_limit: CLAIM_BATCH });
  if (error) {
    console.error("notification-dispatcher: claim failed", error.code ?? "");
    return 0;
  }
  const claimed = (data ?? []) as ClaimedDispatch[];
  if (claimed.length === 0) return 0;
  totals.rounds++;

  // One flat list of (dispatch, device) sends, run through a pool of SEND_POOL_SIZE.
  const jobs = claimed.flatMap((d) => (d.d_subscriptions ?? []).map((sub) => ({ d, sub })));
  const results = await runPool(jobs, SEND_POOL_SIZE, ({ d, sub }) => sendOne(d, sub));

  for (const dispatch of claimed) {
    const mine = results.filter((_, i) => jobs[i].d.d_id === dispatch.d_id);
    try {
      // 1. Record every delivery BEFORE pruning (subscription_id would otherwise dangle / be nulled).
      if (mine.length > 0) {
        const { error: insertError } = await db.from("push_deliveries").insert(
          mine.map((r) => ({
            id: r.deliveryId,
            dispatch_id: dispatch.d_id,
            user_id: dispatch.d_user_id,
            subscription_id: r.sub.id,
            platform: r.sub.platform,
            browser: r.sub.browser,
            status: r.outcome.status,
            http_status: r.outcome.httpStatus,
            error: r.outcome.error,
          })),
        );
        if (insertError) console.error("notification-dispatcher: delivery log failed", insertError.code ?? "");
      }

      // 2. Maintain subscriptions.
      const sentIds: string[] = [];
      const goneIds: string[] = [];
      for (const r of mine) {
        const action = subscriptionActionFor(r.outcome, r.sub.failure_count);
        if (action.kind === "touch") sentIds.push(r.sub.id);
        else if (action.kind === "delete") goneIds.push(r.sub.id);
        else await db.from("push_subscriptions").update({ failure_count: action.failureCount, is_active: action.isActive }).eq("id", r.sub.id);
      }
      if (sentIds.length) await db.from("push_subscriptions").update({ last_used_at: new Date().toISOString(), failure_count: 0 }).in("id", sentIds);
      if (goneIds.length) await db.from("push_subscriptions").delete().in("id", goneIds);

      // 3. Close the dispatch.
      const summary = summariseOutcomes(mine.map((r) => r.outcome));
      await db.rpc("complete_notification_dispatch", {
        p_id: dispatch.d_id,
        p_sent: summary.sent,
        p_failed: summary.failed,
        p_error: summary.error,
      });
      totals.devicesSent += summary.sent;
      totals.devicesFailed += summary.failed;
      totals.devicesGone += mine.filter((r) => r.outcome.status === "gone").length;
    } catch {
      // Never leave a claimed row in 'processing' on our own error (claim also recovers them after 10 min).
      await db.rpc("complete_notification_dispatch", { p_id: dispatch.d_id, p_sent: 0, p_failed: Math.max(mine.length, 1), p_error: "dispatcher_error" });
      totals.devicesFailed += mine.length;
    }
    totals.dispatches++;
  }
  return claimed.length;
};

const runDispatcher = async (db: Db): Promise<Totals> => {
  const totals: Totals = { rounds: 0, dispatches: 0, devicesSent: 0, devicesFailed: 0, devicesGone: 0 };
  const started = Date.now();
  let round = 0;
  let size = 0;
  do {
    round++;
    size = await processRound(db, totals);
  } while (shouldClaimAnotherRound(round, size, Date.now() - started));
  console.log(`notification-dispatcher: rounds=${totals.rounds} dispatches=${totals.dispatches} sent=${totals.devicesSent} failed=${totals.devicesFailed} gone=${totals.devicesGone}`);
  return totals;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "server_misconfigured" }, 500);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // --- authorise (any one of cron secret / service role / admin member) ---
  const cronSecret = req.headers.get("x-cron-secret") ?? "";
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const bearerIsServiceRole = safeCompare(bearer, serviceKey);
  let cronSecretMatches = false;
  if (cronSecret) {
    const { data } = await db.rpc("notification_cron_secret_matches", { p_secret: cronSecret });
    cronSecretMatches = data === true;
  }
  let isAdminMember = false;
  if (!cronSecretMatches && !bearerIsServiceRole && bearer) {
    const user = await resolveAuthedUser(req, supabaseUrl);
    if (user) {
      const { data } = await db.rpc("has_role", { _user_id: user.userId, _role: "admin" });
      isAdminMember = data === true;
    }
  }
  const caller = authoriseDispatcher({ cronSecretMatches, bearerIsServiceRole, isAdminMember });
  if (!caller) return json({ error: "unauthorized" }, 401);

  // --- config check BEFORE claiming, so dispatches stay pending ---
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!publicKey || !privateKey) return json({ error: "not_configured" }, 503);
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@skinlabs.co.za", publicKey, privateKey);

  const wait = new URL(req.url).searchParams.get("wait") === "1";
  if (wait) return json({ ok: true, ...(await runDispatcher(db)) });

  const work = runDispatcher(db).catch(() => console.error("notification-dispatcher: run failed"));
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
  else await work;
  return json({ accepted: true }, 202);
});
