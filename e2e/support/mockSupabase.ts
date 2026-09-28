import type { BrowserContext, Route } from "@playwright/test";

/**
 * A fake signed-in (or signed-out) session and an in-memory Supabase for the
 * journey specs. State is mutable, so an RPC like start_free_trial changes
 * what the next profile read returns — the same way the real backend does.
 * Nothing leaves the browser: every *.supabase.co request is answered here,
 * and third-party hosts (ads, fonts, analytics) are aborted.
 */
export const USER_ID = "00000000-0000-4000-8000-000000000001";
export const PROMO_TRIAL_END = "2026-10-31T22:00:00Z"; // 1 November 2026, SAST

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const fakeJwt = () =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER_ID, email: "qa@example.com", role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`;

export type Profile = Record<string, unknown>;

export const freeProfile = (over: Profile = {}): Profile => ({
  user_id: USER_ID,
  email: "qa@example.com",
  full_name: "QA Tester",
  username: "qa_tester",
  subscription_status: "free",
  trial_plan: null,
  trial_ends_at: null,
  trial_used_at: null,
  trial_started_at: null,
  onboarding_completed_at: "2026-09-01T10:00:00Z",
  checklist_dismissed_at: null,
  weather_city_key: null,
  preferred_routine_time: null,
  city: null,
  account_status: "active",
  founding_member: false,
  billing_interval: "monthly",
  ...over,
});

export const trialProfile = (over: Profile = {}): Profile =>
  freeProfile({
    subscription_status: "trial",
    trial_plan: "insider",
    trial_ends_at: PROMO_TRIAL_END,
    trial_used_at: "2026-09-27T10:00:00Z",
    trial_started_at: "2026-09-27T10:00:00Z",
    ...over,
  });

export const lapsedProfile = (over: Profile = {}): Profile =>
  freeProfile({ trial_plan: "insider", trial_ends_at: "2026-09-20T22:00:00Z", trial_used_at: "2026-09-13T10:00:00Z", ...over });

export interface MockOptions {
  signedIn?: boolean;
  profile?: Profile;
  /** auth.users.created_at — "now" makes IntentResolver treat the account as new. */
  userCreatedAt?: string;
  tables?: Record<string, Record<string, unknown>[]>;
  /** payfast-payment subscription_quote startKind. */
  quoteStartKind?: "new_trial" | "existing_trial" | "immediate";
}

export interface MockState {
  profile: Profile;
  rpcCalls: string[];
  functionCalls: { name: string; action?: string }[];
}

// Shape copied from the live control rows (2026-09-28), benefits shortened.
const PLANS = [
  {
    "plan_id": "explorer",
    "variant_key": "control",
    "name": "Glow Explorer",
    "tagline": "See what SkinLabs can do, free",
    "price_monthly": 0,
    "price_annual": 0,
    "trial_days": 0,
    "trial_eligible": false,
    "is_purchasable": true,
    "cta_label": "Start free",
    "cta_override": null,
    "badge": null,
    "money_back_days": null,
    "benefits": [
      "One full AI starter analysis to see your real skin profile",
      "Public reviews, scores and Shelf Showdowns"
    ],
    "sort_order": 0
  },
  {
    "plan_id": "glow_lite",
    "variant_key": "control",
    "name": "Glow Lite",
    "tagline": "For the skin-curious who aren't ready to commit",
    "price_monthly": 39,
    "price_annual": 390,
    "trial_days": 7,
    "trial_eligible": true,
    "is_purchasable": true,
    "cta_label": "Start Glow Lite",
    "cta_override": null,
    "badge": null,
    "money_back_days": 30,
    "benefits": [
      "Everything in Explorer",
      "Unlimited product comparisons and Spotlight profiles"
    ],
    "sort_order": 1
  },
  {
    "plan_id": "insider",
    "variant_key": "control",
    "name": "Glow Insider",
    "tagline": "The full skincare intelligence toolkit",
    "price_monthly": 79,
    "price_annual": 790,
    "trial_days": 7,
    "trial_eligible": true,
    "is_purchasable": true,
    "cta_label": "Become an Insider",
    "cta_override": null,
    "badge": "Most popular",
    "money_back_days": 30,
    "benefits": [
      "Full podcast library and unlimited reviews",
      "Active Ingredient Conflict Matcher for your SKYNN AI routine"
    ],
    "sort_order": 2
  },
  {
    "plan_id": "vip",
    "variant_key": "control",
    "name": "Glow VIP",
    "tagline": "The most complete routine, with real practitioners",
    "price_monthly": 199,
    "price_annual": 1990,
    "trial_days": 0,
    "trial_eligible": false,
    "is_purchasable": false,
    "cta_label": "Go VIP",
    "cta_override": "Coming soon",
    "badge": null,
    "money_back_days": 30,
    "benefits": [
      "Everything in Glow Insider"
    ],
    "sort_order": 3
  }
];

export async function mockSupabase(context: BrowserContext, opts: MockOptions = {}): Promise<MockState> {
  const state: MockState = { profile: opts.profile ?? freeProfile(), rpcCalls: [], functionCalls: [] };
  const tables: Record<string, Record<string, unknown>[]> = {
    pricing_experiment_variants: [{ variant_key: "control", traffic_weight: 100, is_active: true }],
    pricing_plans: PLANS,
    pricing_settings: [{ variant_key: "control", default_billing_interval: "annual", free_ai_analysis_allowance: 1, free_analysis_window_days: 30, promo_free_trial_until: PROMO_TRIAL_END }],
    ...opts.tables,
  };
  const user = {
    id: USER_ID,
    email: "qa@example.com",
    aud: "authenticated",
    role: "authenticated",
    created_at: opts.userCreatedAt ?? "2026-09-01T10:00:00Z",
    app_metadata: {},
    user_metadata: {},
    factors: [],
  };

  await context.addInitScript(
    ({ session, signedIn }) => {
      try {
        if (signedIn) localStorage.setItem("sb-gnkpzijxuciiaamakgzm-auth-token", JSON.stringify(session));
        localStorage.setItem("skinlabs-cookie-consent", "accepted");
        // Ads are aborted in tests; the ad-block wall never shows under Playwright
        // anyway (navigator.webdriver → isAutomatedAgent in viewerContext.ts).
      } catch {
        /* storage blocked */
      }
    },
    {
      signedIn: opts.signedIn ?? true,
      session: { access_token: fakeJwt(), refresh_token: "r", token_type: "bearer", expires_in: 3_600_000, expires_at: 4102444800, user },
    },
  );

  // Third parties (ads, fonts, analytics) — never reached in tests.
  await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|[a-z0-9-]+\.supabase\.co)/, (r) => r.abort());

  // Playwright tries the most recently registered route first: generic before specific.
  await context.route(/supabase\.co\/auth\/v1\//, (r) => r.fulfill({ json: {} }));
  await context.route(/supabase\.co\/auth\/v1\/user/, (r) => r.fulfill({ json: user }));
  await context.route(/supabase\.co\/realtime\//, (r) => r.abort());

  await context.route(/supabase\.co\/functions\/v1\/([a-z-]+)/, (r: Route) => {
    const name = /functions\/v1\/([a-z-]+)/.exec(r.request().url())?.[1] ?? "";
    let body: Record<string, unknown> = {};
    try {
      body = (r.request().postDataJSON() as Record<string, unknown>) ?? {};
    } catch {
      /* GET */
    }
    state.functionCalls.push({ name, action: body.action as string | undefined });
    if (name === "payfast-payment" && body.action === "subscription_quote") {
      const kind = opts.quoteStartKind ?? (state.profile.subscription_status === "trial" ? "existing_trial" : state.profile.trial_used_at ? "immediate" : "new_trial");
      return r.fulfill({
        json: {
          amountZar: body.interval === "annual" ? 790 : 79,
          planId: body.planId ?? "insider",
          interval: body.interval ?? "monthly",
          startKind: kind,
          firstChargeDate: kind === "immediate" ? null : "2026-11-01",
          payfastAvailable: true,
        },
      });
    }
    if (name === "payfast-payment" && body.action === "initialize_subscription") {
      return r.fulfill({ json: { paymentUrl: "https://sandbox.payfast.co.za/eng/process", paymentData: { merchant_id: "10000100" }, subscriptionId: "sub_test" } });
    }
    return r.fulfill({ json: { configured: false } });
  });

  await context.route(/supabase\.co\/rest\/v1\//, (r) => {
    const req = r.request();
    const url = new URL(req.url());
    const table = url.pathname.split("/").pop() ?? "";
    const single = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
    const rows = table === "profiles" ? [state.profile] : (tables[table] ?? []);
    if (req.method() === "HEAD" || (req.headers()["prefer"] ?? "").includes("count=exact")) {
      return r.fulfill({ status: 200, headers: { "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}`, "content-type": "application/json" }, body: "[]" });
    }
    if (req.method() === "PATCH" && table === "profiles") {
      try {
        state.profile = { ...state.profile, ...(req.postDataJSON() as Profile) };
      } catch {
        /* ignore */
      }
      return r.fulfill({ status: 204, body: "" });
    }
    if (req.method() !== "GET") return r.fulfill({ status: 201, body: "" });
    return r.fulfill({ json: single ? (rows[0] ?? null) : rows });
  });

  await context.route(/supabase\.co\/rest\/v1\/rpc\/([a-z_]+)/, (r) => {
    const fn = /rpc\/([a-z_]+)/.exec(r.request().url())?.[1] ?? "";
    state.rpcCalls.push(fn);
    if (fn === "start_free_trial") {
      state.profile = { ...state.profile, subscription_status: "trial", trial_plan: "insider", trial_ends_at: PROMO_TRIAL_END, trial_used_at: new Date().toISOString(), trial_started_at: new Date().toISOString() };
      return r.fulfill({ json: true });
    }
    if (fn === "available_ai_credits") return r.fulfill({ json: 0 });
    return r.fulfill({ json: null });
  });

  return state;
}
