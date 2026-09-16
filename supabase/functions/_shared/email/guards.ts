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
    if (String(data.subscription_status ?? "").toLowerCase() !== "trial" || data.trial_plan !== "insider") {
      return { send: false, reason: "trial is no longer active (converted or cancelled before reminder sent)" };
    }
    return { send: true, vars: { trial_ends_at: data.trial_ends_at } };
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
};

export function getGuard(templateId: string): GuardFn | undefined {
  return guards[templateId];
}
