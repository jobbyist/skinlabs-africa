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
