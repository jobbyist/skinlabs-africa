// Send-time guards for templates whose content depends on state that can
// change between enqueue and send (trial cancelled/converted in the window
// before a reminder fires). Re-reads CURRENT profiles state rather than
// trusting the payload snapshot captured at enqueue time — this is the
// mechanism that satisfies "state change before send" without needing a
// separate cancellation-on-every-mutation trigger, which would only move
// the same race to a different point.
//
// Templates with no entry here (payment receipts, form confirmations,
// welcome/activation emails) describe an immutable past fact and are
// always safe to send regardless of what happens afterward.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deno-lint-ignore no-explicit-any
type SupabaseLike = any;

export interface GuardJob {
  user_id: string | null;
  payload: Record<string, unknown>;
}

export interface GuardResult {
  send: boolean;
  vars?: Record<string, unknown>;
  reason?: string;
}

type GuardFn = (supabase: SupabaseLike, job: GuardJob) => Promise<GuardResult>;


const LIVE_SUBS = ["trialing", "active", "past_due"];

/** The member's current trial row, or null if it's no longer the same live trial. */
async function currentTrial(supabase: SupabaseLike, job: GuardJob) {
  if (!job.user_id) return null;
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status, trial_plan, trial_ends_at, marketing_consent")
    .eq("user_id", job.user_id)
    .maybeSingle();
  return data ?? null;
}

const sameInstant = (a: unknown, b: unknown) =>
  Boolean(a) && Boolean(b) && new Date(String(a)).getTime() === new Date(String(b)).getTime();

/** Latest live auto-renew subscription, `undefined` on a read error. */
async function liveSubscription(supabase: SupabaseLike, userId: string) {
  const { data, error } = await supabase
    .from("payment_subscriptions")
    .select("amount_zar, amount_charged, currency, gateway")
    .eq("user_id", userId)
    .in("status", LIVE_SUBS)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) return undefined;
  return (data ?? [])[0] ?? null;
}

/** Mirrors is_trial_activated() / isActivated() in src/lib/journey.ts. */
async function isActivated(supabase: SupabaseLike, userId: string): Promise<boolean> {
  const count = async (table: string, extra?: (q: SupabaseLike) => SupabaseLike) => {
    let q = supabase.from(table).select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (extra) q = extra(q);
    const { count: n } = await q;
    return n ?? 0;
  };
  const [analyses, steps, checkins, saves] = await Promise.all([
    count("skincare_recommendations", (q) => q.eq("status", "delivered")),
    count("routine_steps"),
    count("routine_checkins"),
    count("news_article_engagement", (q) => q.eq("kind", "save")),
  ]);
  return analyses >= 2 || steps >= 1 || checkins >= 3 || saves >= 3;
}

/**
 * The T-7 / T-3 lifecycle emails: only while the SAME trial (same end date)
 * is still running, with the card state re-read so the copy is right.
 */
function trialWindowGuard(requireCard: boolean | null): GuardFn {
  return async (supabase, job) => {
    const trial = await currentTrial(supabase, job);
    if (!trial) return { send: false, reason: "profile not found" };
    if (String(trial.subscription_status ?? "").toLowerCase() !== "trial") {
      return { send: false, reason: "trial no longer active (converted or ended before send)" };
    }
    if (!sameInstant(trial.trial_ends_at, job.payload?.trial_ends_at)) {
      return { send: false, reason: "trial end date changed since enqueue" };
    }
    const sub = await liveSubscription(supabase, job.user_id!);
    if (sub === undefined) {
      return requireCard === null
        ? { send: true, vars: { has_payment_method: undefined } }
        : { send: false, reason: "couldn't read payment state" };
    }
    if (requireCard === true && !sub) return { send: false, reason: "auto-renew was cancelled before send" };
    if (requireCard === false && sub) return { send: false, reason: "auto-renew was set up before send" };
    return {
      send: true,
      vars: sub
        ? { has_payment_method: true, amount_zar: sub.amount_zar, amount_charged: sub.amount_charged, currency: sub.currency, gateway: sub.gateway }
        : { has_payment_method: false },
    };
  };
}

const guards: Record<string, GuardFn> = {
  trial_expiring: async (supabase, job) => {
    if (!job.user_id) return { send: false, reason: "no user_id on job" };
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_status, trial_plan, trial_ends_at")
      .eq("user_id", job.user_id)
      .maybeSingle();
    if (error || !data) return { send: false, reason: "profile not found" };
    if (String(data.subscription_status ?? "").toLowerCase() !== "trial" || !data.trial_plan) {
      return { send: false, reason: "trial is no longer active (converted or cancelled before reminder sent)" };
    }
    // Re-read the payment state too: a member may add or cancel auto-renew
    // between the cron's fan-out and this send, and the copy differs.
    const { data: subs, error: subsError } = await supabase
      .from("payment_subscriptions")
      .select("id")
      .eq("user_id", job.user_id)
      .in("status", ["trialing", "active", "past_due"])
      .limit(1);
    const vars: Record<string, unknown> = { trial_ends_at: data.trial_ends_at, plan: data.trial_plan };
    // On a read error, drop the flag so the template makes no charge promise either way.
    vars.has_payment_method = subsError ? undefined : (subs ?? []).length > 0;
    return { send: true, vars };
  },

  trial_week_left: trialWindowGuard(null),
  trial_precharge_reminder: trialWindowGuard(true),
  trial_last_chance: trialWindowGuard(false),

  // Marketing: consent re-checked at send time, and no nudge once activated.
  trial_activation_nudge: async (supabase, job) => {
    const trial = await currentTrial(supabase, job);
    if (!trial) return { send: false, reason: "profile not found" };
    if (!trial.marketing_consent) return { send: false, reason: "unsubscribed from marketing before send" };
    if (String(trial.subscription_status ?? "").toLowerCase() !== "trial") return { send: false, reason: "trial no longer active" };
    if (await isActivated(supabase, job.user_id!)) return { send: false, reason: "already activated" };
    return { send: true };
  },

  trial_winback: async (supabase, job) => {
    const trial = await currentTrial(supabase, job);
    if (!trial) return { send: false, reason: "profile not found" };
    if (!trial.marketing_consent) return { send: false, reason: "unsubscribed from marketing before send" };
    const status = String(trial.subscription_status ?? "").toLowerCase();
    if (["glow_lite", "insider", "vip", "trial"].includes(status)) return { send: false, reason: "member is back on a plan" };
    const sub = await liveSubscription(supabase, job.user_id!);
    if (sub !== null) return { send: false, reason: sub === undefined ? "couldn't read payment state" : "auto-renew is set up" };
    return { send: true };
  },

  trial_ended: async (supabase, job) => {
    if (!job.user_id) return { send: false, reason: "no user_id on job" };
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("user_id", job.user_id)
      .maybeSingle();
    if (error || !data) return { send: false, reason: "profile not found" };
    const status = String(data.subscription_status ?? "").toLowerCase();
    if (["glow_lite", "insider", "vip", "trial"].includes(status)) {
      return { send: false, reason: "user is on a paid or new trial plan again by send time" };
    }
    return { send: true };
  },

  // A member can withdraw (delete) a pre-approval submission right after
  // submitting; don't send "we've received it" for something already gone.
  advanced_intake_received: async (supabase, job) => {
    const sessionId = job.payload?.session_id;
    if (typeof sessionId !== "string") return { send: true };
    const { data } = await supabase.from("advanced_assessment_sessions").select("id").eq("id", sessionId).maybeSingle();
    if (!data) return { send: false, reason: "submission was withdrawn before send" };
    return { send: true };
  },

  // Marketing consent can be withdrawn (one-click unsubscribe) any time
  // between the weekly cron's fan-out and the processor actually sending —
  // re-check it rather than trusting the snapshot at enqueue time.
  newsletter_weekly_digest: async (supabase, job) => {
    if (!job.user_id) return { send: false, reason: "no user_id on job" };
    const { data, error } = await supabase
      .from("profiles")
      .select("marketing_consent")
      .eq("user_id", job.user_id)
      .maybeSingle();
    if (error || !data) return { send: false, reason: "profile not found" };
    if (!data.marketing_consent) {
      return { send: false, reason: "unsubscribed from marketing before send" };
    }
    return { send: true };
  },
};

export function getGuard(templateId: string): GuardFn | undefined {
  return guards[templateId];
}
