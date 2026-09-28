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
  /** SKYNN AI v2.1: Analysis Passes held, and the last free Basic AI Skin Analysis. */
  skynn?: { passes?: number; lastFreeAnalysisAt?: string | null; unlimited?: boolean; submitted?: boolean };
}

export interface MockState {
  profile: Profile;
  rpcCalls: string[];
  functionCalls: { name: string; action?: string }[];
  /** Basic AI Skin Analysis saves the mock accepted. */
  basicSaves: string[];
  lastFreeAnalysisAt: string | null;
  passes: number;
  advancedSubmitted: boolean;
  /** Smart Routine saved through save_smart_routine, and the routine_steps it wrote. */
  smartRoutine: Record<string, unknown> | null;
  routineSteps: Record<string, unknown>[];
  /** Answers the app sent when it seeded an Advanced session from a Basic analysis. */
  seededResponses: Record<string, unknown> | null;
  linkedBasicAnalysis: { basicAnalysisId: string; prefilledQuestionIds: string[] } | null;
}

/** A two-question stand-in for the real Advanced AI Dermatology Analysis definition. */
export const ADVANCED_DEFINITION = {
  version: "e2e",
  title: "Advanced AI Dermatology Analysis",
  sections: [
    {
      id: "consent",
      title: "Your consent",
      questions: [
        { id: "popia_special_info_consent", type: "single_select", required: true, prompt: "Special personal information consent", options: [{ value: "agree", label: "I agree" }, { value: "decline", label: "I don't agree" }] },
        { id: "popia_cross_border_consent", type: "single_select", required: true, prompt: "Cross-border processing consent", options: [{ value: "agree", label: "I agree to cross-border processing" }, { value: "decline", label: "I don't agree to cross-border processing" }] },
        { id: "skin_type", type: "single_select", required: false, prompt: "Which best describes your skin type?", options: [{ value: "oily", label: "Oily" }, { value: "dry", label: "Dry" }, { value: "combination", label: "Combination" }, { value: "normal", label: "Normal" }] },
      ],
    },
  ],
};
export const ADVANCED_REFERENCE = "SKYNN-ADV-20260928-E2ETST";
const WINDOW_DAYS = 7;

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
  const state: MockState = {
    profile: opts.profile ?? freeProfile(),
    rpcCalls: [],
    functionCalls: [],
    basicSaves: [],
    lastFreeAnalysisAt: opts.skynn?.lastFreeAnalysisAt ?? null,
    passes: opts.skynn?.passes ?? 0,
    advancedSubmitted: opts.skynn?.submitted ?? false,
    smartRoutine: null,
    routineSteps: [],
    seededResponses: null,
    linkedBasicAnalysis: null,
  };
  const unlimited = opts.skynn?.unlimited ?? false;
  const unlockAt = () =>
    state.lastFreeAnalysisAt ? new Date(new Date(state.lastFreeAnalysisAt).getTime() + WINDOW_DAYS * 86_400_000) : null;
  const basicAvailable = () => unlimited || !unlockAt() || Date.now() >= unlockAt()!.getTime();
  const tables: Record<string, Record<string, unknown>[]> = {
    pricing_experiment_variants: [{ variant_key: "control", traffic_weight: 100, is_active: true }],
    pricing_plans: PLANS,
    pricing_settings: [{ variant_key: "control", default_billing_interval: "annual", free_ai_analysis_allowance: 1, free_analysis_window_days: WINDOW_DAYS, promo_free_trial_until: PROMO_TRIAL_END }],
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
        // A valid record under the real key (src/lib/cookie-consent.ts), so the
        // banner never covers controls — on phones it sits over the SKYNN consent step.
        const now = Date.now();
        localStorage.setItem(
          "skinlabs_cookie_consent_v1",
          JSON.stringify({
            decision: "rejected",
            timestamp: new Date(now).toISOString(),
            expiresAt: new Date(now + 80 * 86_400_000).toISOString(),
            version: "v1",
            preferences: { analytics: false, personalisation: false, targetedAdvertising: false },
          }),
        );
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
    if (name === "skynn-advanced-assessment") {
      const session = { id: "sess-e2e", user_id: USER_ID, status: state.advancedSubmitted ? "submitted" : "in_progress", assessment_version: "e2e", responses: state.advancedSubmitted ? { popia_special_info_consent: "agree", popia_cross_border_consent: "agree", skin_type: "oily" } : {}, current_section_id: "consent", completeness_pct: 0, assessment_definition_id: "def-e2e", basic_analysis_id: state.linkedBasicAnalysis?.basicAnalysisId ?? null, prefilled_question_ids: state.linkedBasicAnalysis?.prefilledQuestionIds ?? null };
      const reportRow = { id: "rep-e2e", session_id: "sess-e2e", created_at: new Date().toISOString(), submitted_at: new Date().toISOString(), generation_status: "pending", review_status: null, processing_mode: "fallback", intake_status: "pending", reference_number: ADVANCED_REFERENCE };
      switch (body.action) {
        case "access":
          return r.fulfill({ json: { eligible: state.passes > 0, accessType: state.passes > 0 ? "analysis_pass" : "none", membershipTier: "explorer", passesAvailable: state.passes, rolloutStage: "pass_holders_review", reportMode: "fallback" } });
        case "create_session":
        case "get_session":
          if (state.passes <= 0 && body.action === "create_session") return r.fulfill({ status: 403, json: { error: "You'll need an Analysis Pass.", code: "not_eligible" } });
          return r.fulfill({ json: { session, definition: ADVANCED_DEFINITION, report: state.advancedSubmitted ? reportRow : null } });
        case "update_session":
          if (!state.advancedSubmitted && !state.seededResponses) state.seededResponses = (body.responses as Record<string, unknown>) ?? {};
          return r.fulfill({ json: { session: { ...session, responses: body.responses ?? {} }, safetyScreen: { triage: "routine", flags: [] } } });
        case "link_basic_analysis":
          state.linkedBasicAnalysis = { basicAnalysisId: String(body.basicAnalysisId), prefilledQuestionIds: (body.prefilledQuestionIds as string[]) ?? [] };
          return r.fulfill({ json: { linked: true } });
        case "submit":
          if (!state.advancedSubmitted) state.passes -= 1;
          state.advancedSubmitted = true;
          return r.fulfill({ json: { sessionId: "sess-e2e", reportId: "rep-e2e", referenceNumber: ADVANCED_REFERENCE, processingMode: "fallback", status: "pending", errorMessage: null } });
        case "list_reports":
          return r.fulfill({ json: { reports: state.advancedSubmitted ? [{ id: "rep-e2e", session_id: "sess-e2e", created_at: new Date().toISOString(), submitted_at: new Date().toISOString(), generation_status: "pending", review_status: null, processing_mode: "fallback", intake_status: "pending", reference_number: ADVANCED_REFERENCE }] : [] } });
        case "get_report":
          return r.fulfill({ json: { report: { id: "rep-e2e", session_id: "sess-e2e", created_at: new Date().toISOString(), submitted_at: new Date().toISOString(), generation_status: "pending", review_status: null, processing_mode: "fallback", intake_status: "pending", reference_number: ADVANCED_REFERENCE } } });
        default:
          return r.fulfill({ json: { ok: true } });
      }
    }
    if (name === "payfast-payment" && body.action === "initialize_subscription") {
      return r.fulfill({ json: { paymentUrl: "https://sandbox.payfast.co.za/eng/process", paymentData: { merchant_id: "10000100" }, subscriptionId: "sub_test" } });
    }
    // PayPal is the live gateway (PayFast is switched off client-side, PAYFAST_ENABLED).
    if (name === "paypal-payment" && body.action === "config") {
      return r.fulfill({ json: { configured: true, clientId: "test-client-id", env: "sandbox" } });
    }
    return r.fulfill({ json: { configured: false } });
  });

  await context.route(/supabase\.co\/rest\/v1\//, (r) => {
    const req = r.request();
    const url = new URL(req.url());
    const table = url.pathname.split("/").pop() ?? "";
    const single = (req.headers()["accept"] ?? "").includes("vnd.pgrst.object");
    const rows =
      table === "profiles"
        ? [state.profile]
        : table === "smart_routines"
          ? state.smartRoutine ? [state.smartRoutine] : []
          : table === "routine_steps" && state.routineSteps.length
            ? state.routineSteps
            : (tables[table] ?? []);
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
    if (fn === "available_ai_credits") return r.fulfill({ json: state.passes });
    if (fn === "get_smart_routine_access") return r.fulfill({ json: state.advancedSubmitted });
    if (fn === "save_smart_routine") {
      if (!state.advancedSubmitted) return r.fulfill({ status: 403, json: { code: "42501", message: "smart_routine_locked" } });
      let body: Record<string, unknown> = {};
      try {
        body = (r.request().postDataJSON() as Record<string, unknown>) ?? {};
      } catch {
        /* ignore */
      }
      const routine = body.p_routine as { source: string; engineVersion: string; season: string; am: Record<string, unknown>[]; pm: Record<string, unknown>[] };
      const now = new Date().toISOString();
      state.smartRoutine = { id: "sr-e2e", user_id: USER_ID, source: routine.source, engine_version: routine.engineVersion, basic_analysis_id: body.p_basic_analysis_id ?? null, advanced_session_id: body.p_advanced_session_id ?? null, season: routine.season, routine, created_at: now, updated_at: now };
      let order = 0;
      state.routineSteps = (["am", "pm"] as const).flatMap((slot) =>
        routine[slot].map((st) => ({ id: `step-${slot}-${order}`, step_name: st.step, product_name: st.productName ?? st.productType, time_of_day: slot, sort_order: order++, source: "smart", guidance: st.guidance ?? null, product_slug: st.productSlug ?? null })),
      );
      return r.fulfill({ json: "sr-e2e" });
    }
    if (fn === "get_formulator_allowance") {
      const available = basicAvailable();
      return r.fulfill({
        json: [{
          tier: unlimited ? "insider" : "explorer",
          unlimited,
          free_remaining: unlimited ? null : available ? 1 : 0,
          window_days: WINDOW_DAYS,
          last_free_analysis_at: state.lastFreeAnalysisAt,
          last_analysis_at: state.lastFreeAnalysisAt,
          next_unlock_at: available ? null : unlockAt()!.toISOString(),
          pass_balance: state.passes,
        }],
      });
    }
    if (fn === "save_starter_analysis") {
      let body: Record<string, unknown> = {};
      try {
        body = (r.request().postDataJSON() as Record<string, unknown>) ?? {};
      } catch {
        /* ignore */
      }
      const id = String(body.p_client_analysis_id ?? "");
      if (state.basicSaves.includes(id)) return r.fulfill({ json: [{ recommendation_id: "rec-" + id, source: "existing", next_unlock_at: null }] });
      if (!basicAvailable()) {
        // Same shape PostgREST returns for save_starter_analysis's RAISE (and never a Pass fallback).
        return r.fulfill({ status: 400, json: { code: "P0001", message: "formulator_limit_reached", details: unlockAt()!.toISOString(), hint: "formulator_limit_reached" } });
      }
      state.basicSaves.push(id);
      if (!unlimited) state.lastFreeAnalysisAt = new Date().toISOString();
      return r.fulfill({ json: [{ recommendation_id: "rec-" + id, source: unlimited ? "membership" : "free_allowance", next_unlock_at: unlimited ? null : unlockAt()!.toISOString() }] });
    }
    return r.fulfill({ json: null });
  });

  return state;
}
