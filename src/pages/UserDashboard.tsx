import { Suspense, useEffect, useRef, useState } from "react";
import { lazyWithRetry } from "@/lib/chunkRecovery";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Clock, PauseCircle, Bookmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useStartTrial } from "@/hooks/use-start-trial";
import { supabase } from "@/integrations/supabase/client";
import MFASettingsCard from "@/components/MFASettingsCard";
import EmailVerificationCard from "@/components/EmailVerificationCard";
import ProfileTab from "@/components/dashboard/ProfileTab";
import SkinJourneyTab from "@/components/dashboard/SkinJourneyTab";
import RoutineTrackerTab from "@/components/dashboard/RoutineTrackerTab";
import BillingTab from "@/components/dashboard/BillingTab";
import InboxTab from "@/components/dashboard/InboxTab";
import AccountTab from "@/components/dashboard/AccountTab";
const AppSettingsPanel = lazyWithRetry(() => import("@/components/pwa/AppSettingsPanel"));
import SavedContentTab from "@/components/dashboard/SavedContentTab";
import AuthDialog from "@/components/AuthDialog";
import FormulatorTab from "@/components/dashboard/FormulatorTab";
import AdvancedAssessmentCard from "@/components/dashboard/AdvancedAssessmentCard";
import SkinProfileHero from "@/components/dashboard/SkinProfileHero";
import ForYourSkinCard from "@/components/dashboard/ForYourSkinCard";
import ForYourProfileFeed from "@/components/dashboard/ForYourProfileFeed";
import GettingStartedChecklist from "@/components/dashboard/GettingStartedChecklist";
import NextActionCard from "@/components/dashboard/NextActionCard";
import PlanStatusRow from "@/components/dashboard/PlanStatusRow";
import PreOrdersCard from "@/components/dashboard/PreOrdersCard";
import SectionNav from "@/components/dashboard/SectionNav";
import { useContextualActions } from "@/hooks/use-contextual-actions";
import { notifyMemberContextChanged, type MemberProfile } from "@/hooks/use-app-context";
import { contextualGreeting, type ResolvedAction } from "@/lib/context";
import { GROUP_DEFAULT_SECTION, SECTION_GROUP, resolveDashboardSection, type DashboardGroup } from "@/lib/dashboardTabs";
import SkinWeatherCard from "@/components/dashboard/SkinWeatherCard";
import type { StarterAnalysisResult } from "@/lib/starter-analysis/types";
import { useFormulatorAllowance } from "@/hooks/use-formulator-allowance";
import { loadCompletedState, persistStarterResultToAccount } from "@/lib/starter-analysis/persistence";
import { getPersistedPricingVariant } from "@/lib/pricing-config";
import ReportBugButton from "@/components/ReportBugButton";
import type { SavedRecommendationRow } from "@/components/dashboard/SavedAnalysisCard";
import { toast } from "sonner";
import { formatBillingDate, formatUsd, formatZar } from "@/lib/paypal";
import { isPaidSubscriptionStatus } from "@/lib/entitlements";
import { useNotifications } from "@/hooks/use-notifications";
import { trackConversionEvent } from "@/lib/analytics-events";
import { trackContextEvent } from "@/lib/context/analytics";
import { ANALYSIS_PASSES_UPDATED_EVENT } from "@/hooks/use-analysis-passes";
import { activatePendingPaypalSubscription, capturePendingPaypalOrder } from "@/lib/payments";
import { openKeepMembership, openSignupDialog } from "@/lib/conversionDialogs";
import { sastDaysUntil, trialBannerState } from "@/lib/trialLifecycle";

const ANALYSES_COLUMNS = "id, skin_type, concerns, created_at, status, mst_tone, analysis_completeness, result_payload";

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tier, isMember, isTrialing, trialEndsAt, trialUsed, loading: membershipLoading, refresh: refreshMembership } = useMembership();
  const { unreadCount } = useNotifications();
  const { start: startTrial, loading: trialLoading } = useStartTrial();
  const { data: allowance, refresh: refreshAllowance } = useFormulatorAllowance();
  const [authOpen, setAuthOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  // The trialist's live auto-renew subscription (PayPal), if they added a payment method.
  // undefined = not known yet (loading, or the read failed): the banner then makes
  // no claim either way. null = confirmed no card on file.
  const [trialSubscription, setTrialSubscription] = useState<{
    amount_zar: number;
    amount_charged: number;
    currency: string;
    first_billing_at: string | null;
    next_billing_at: string | null;
  } | null | undefined>(undefined);
  const [reactivating, setReactivating] = useState(false);

  // ?tab= holds a leaf section (legacy values resolve via LEGACY_TAB_ALIASES);
  // the top-level group is derived from it. See src/lib/dashboardTabs.ts.
  const activeSection = resolveDashboardSection(searchParams.get("tab"));
  const activeGroup = SECTION_GROUP[activeSection];
  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", resolveDashboardSection(tab));
    setSearchParams(next, { replace: true });
  };
  const setActiveGroup = (group: string) => setActiveTab(GROUP_DEFAULT_SECTION[group as DashboardGroup] ?? "home");
  // One shared snapshot of the member (src/hooks/use-app-context.ts) feeds the greeting, the
  // next best action, the checklist and the plan line. Home's job is to answer: where am I,
  // what has SkinLabs learned, and what should I do next.
  const ctx = useContextualActions("dashboard", { secondaryLimit: 2, setup: true, content: true });
  const profile: MemberProfile | null = ctx.profile;
  const dashboardEntered = useRef(false);
  useEffect(() => {
    if (!user || ctx.loading || dashboardEntered.current) return;
    dashboardEntered.current = true;
    trackConversionEvent("dashboard_entered", { stage: ctx.stage });
    trackContextEvent("context_resolved", { surface: "dashboard", state: Array.from(ctx.states)[0] ?? "unknown", count: ctx.states.size });
  }, [user, ctx.loading, ctx.stage, ctx.states]);

  // journey_state_changed: fires when the member's headline state moves (e.g. NEW_USER -> RETURNING_USER).
  const lastHeadline = useRef<string | null>(null);
  useEffect(() => {
    if (ctx.loading) return;
    const headline = ctx.stage;
    if (lastHeadline.current && lastHeadline.current !== headline) {
      trackContextEvent("journey_state_changed", { state: headline, previous_state: lastHeadline.current });
    }
    lastHeadline.current = headline;
  }, [ctx.loading, ctx.stage]);

  const handleAction = (action: ResolvedAction) => {
    ctx.click(action);
    if (action.kind === "keep_membership") {
      openKeepMembership({ source: "dashboard_journey" });
    } else if (action.kind === "start_trial") {
      void startTrial({ plan: "insider", source: "dashboard", destination: null });
    } else if (action.kind === "signup") {
      openSignupDialog("signup");
    }
    // "link" and "purchase_pass" actions are rendered as <Link>s and navigate themselves.
  };

  // Checklist completion comes from data changed on other tabs (routine, security…):
  // re-read the shared snapshot whenever Home is shown again.
  const seenGroup = useRef(false);
  useEffect(() => {
    if (!seenGroup.current) {
      seenGroup.current = true;
      return;
    }
    if (activeGroup === "home") void ctx.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup]);

  const paymentReturn = searchParams.get("payment") === "success";
  const purchaseType = searchParams.get("purchase_type") ?? "plan";

  useEffect(() => {
    // Signed out: open sign-in in place (returning here afterwards) instead of
    // bouncing to the homepage.
    if (loading || user) return;
    setAuthOpen(true);
  }, [user, loading]);

  const [subscriptionNonce, setSubscriptionNonce] = useState(0);

  useEffect(() => {
    if (!user || !isTrialing) {
      setTrialSubscription(undefined);
      return;
    }
    let cancelled = false;
    void supabase
      .from("payment_subscriptions")
      .select("amount_zar, amount_charged, currency, first_billing_at, next_billing_at")
      .eq("user_id", user.id)
      .in("status", ["trialing", "active", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("Could not load trial subscription:", error.message);
          setTrialSubscription(undefined);
          return;
        }
        setTrialSubscription(data?.[0] ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isTrialing, subscriptionNonce]);

  // "Keep my membership" deep links: ?keep=1 (trial emails) opens the dialog;
  // ?keep=done / ?keep=cancelled are PayFast's return and cancel URLs.
  useEffect(() => {
    const keep = searchParams.get("keep");
    if (!keep || loading || !user) return;
    const next = new URLSearchParams(searchParams);
    next.delete("keep");
    setSearchParams(next, { replace: true });
    if (keep === "1") {
      openKeepMembership({ source: "keep_link" });
      return;
    }
    if (keep === "cancelled") {
      toast("No changes made — your membership continues as before.");
      return;
    }
    if (keep !== "done") return;
    // PayFast confirms the card server-to-server (ITN), usually within seconds.
    let cancelled = false;
    let attempts = 0;
    toast("Card confirmed on PayFast — switching on auto-renew…");
    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      const { data } = await supabase
        .from("payment_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .in("status", ["trialing", "active", "past_due"])
        .limit(1);
      if (cancelled) return;
      if (data && data.length > 0) {
        trackConversionEvent("keep_membership_completed", { gateway: "payfast", source: "payfast_return" });
        toast.success("Auto-renew is on. Cancel any time in Billing.");
        setSubscriptionNonce((n) => n + 1);
        return;
      }
      if (attempts < 15) {
        window.setTimeout(() => void poll(), 3000);
      } else {
        toast("PayFast is still confirming your card. Refresh Billing in a minute — contact support if it doesn't show.");
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  useEffect(() => {
    if (!paymentReturn || !user) return;
    let cancelled = false;
    let attempts = 0;
    setActivating(true);

    // PayFast activates via its own server-to-server ITN, so by the time the
    // browser lands back here the entitlement may already be granted — the
    // poll below just needs to wait for it. PayPal is different: nothing
    // grants the entitlement until *we* call its capture API, which this
    // return trip is what triggers. No-ops instantly for a PayFast/direct
    // return (no matching pending order in sessionStorage).
    void (async () => {
      const captureResult = await capturePendingPaypalOrder();
      if (captureResult.captured && !captureResult.ok) {
        toast.error(captureResult.error || "We couldn't confirm your PayPal payment. Contact support if you were charged.");
      }
      const subResult = await activatePendingPaypalSubscription();
      if (subResult.activated && !subResult.ok) {
        toast.error(subResult.error || "We couldn't confirm your PayPal subscription. Contact support if you were charged.");
      }
    })();

    const clearParam = () => {
      const next = new URLSearchParams(window.location.search);
      next.delete("payment");
      next.delete("purchase_type");
      next.delete("plan");
      next.delete("interval");
      next.delete("pack_id");
      next.delete("offer_id");
      next.delete("subscription_id");
      next.delete("ba_token");
      next.delete("token");
      setSearchParams(next, { replace: true });
    };

    let aiCreditsBaseline: number | null = null;

    const checkDone = async (): Promise<boolean> => {
      if (purchaseType === "credit_pack") {
        const { data } = await supabase.rpc("available_ai_credits", { _user_id: user.id });
        const balance = typeof data === "number" ? data : 0;
        if (aiCreditsBaseline !== null && balance > aiCreditsBaseline) {
          notifyMemberContextChanged();
          void refreshAllowance();
          trackConversionEvent("checkout_completed", { purchaseType });
          trackConversionEvent("credit_pack_purchased", { packId: searchParams.get("pack_id") ?? undefined });
          toast.success("Payment confirmed — your AI analysis credits are ready.");
          return true;
        }
        return false;
      }
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();
      // A PayPal subscription started during/with a free trial is billed when
      // the trial ends — a live trial is the success state for that return.
      if (
        purchaseType === "subscription" &&
        data?.subscription_status === "trial" &&
        data.trial_ends_at &&
        new Date(data.trial_ends_at) > new Date()
      ) {
        refreshMembership();
        trackConversionEvent("checkout_completed", { purchaseType });
        toast.success("PayPal auto-renew is set up — you won't be charged until your free trial ends.");
        return true;
      }
      if (isPaidSubscriptionStatus(data?.subscription_status)) {
        refreshMembership();
        trackConversionEvent("checkout_completed", { purchaseType });
        trackConversionEvent("subscription_started", {
          plan: searchParams.get("plan") ?? undefined,
          interval: searchParams.get("interval") ?? undefined,
        });
        toast.success("Payment confirmed — your membership is active.");
        return true;
      }
      return false;
    };

    const poll = async () => {
      attempts += 1;
      if (purchaseType === "credit_pack" && aiCreditsBaseline === null) {
        const { data } = await supabase.rpc("available_ai_credits", { _user_id: user.id });
        aiCreditsBaseline = typeof data === "number" ? data : 0;
      }
      const done = await checkDone();
      if (cancelled) return;
      if (done) {
        setActivating(false);
        clearParam();
        return;
      }
      if (attempts >= 20) {
        setActivating(false);
        toast.message("Payment received. Activation is still processing — refresh in a minute.");
        clearParam();
        return;
      }
      window.setTimeout(poll, 4000);
    };

    void poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentReturn, user]);

  const trialEndsLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" })
    : null;
  const trialFirstChargeAt = trialSubscription
    ? (trialSubscription.first_billing_at ?? trialSubscription.next_billing_at)
    : null;
  // Card-backed → auto-renew copy; confirmed no card → "no card on file";
  // unknown (loading / read failed) → neutral, never a no-charge claim.
  const trialBannerCopy = trialSubscription
    ? trialFirstChargeAt
      ? `Auto-renew is on — first charge ${formatZar(Number(trialSubscription.amount_zar))}${
          trialSubscription.currency === "USD" ? ` (${formatUsd(Number(trialSubscription.amount_charged))} via PayPal)` : ""
        } on ${formatBillingDate(trialFirstChargeAt)}. Cancel any time in Billing.`
      : "Auto-renew is on. Cancel any time in Billing."
    : trialSubscription === null
      ? trialEndsLabel
        ? `Full access until ${trialEndsLabel}. No card on file, so nothing is charged — your access simply ends unless you keep your membership.`
        : "No card on file. Keep your membership any time to stay on after the trial ends."
      : trialEndsLabel
        ? `Full access until ${trialEndsLabel}. Manage your membership any time in Billing.`
        : "Manage your membership any time in Billing.";
  // SAST calendar days, the same measure the trial lifecycle emails use.
  const trialDaysLeft = trialEndsAt ? Math.max(0, sastDaysUntil(trialEndsAt)) : 0;
  const trialBanner = trialBannerState({
    isTrialing,
    trialEndsAt,
    hasPaymentOnFile: trialSubscription === undefined ? null : Boolean(trialSubscription),
    trialUsed,
    isExplorer: tier === "explorer",
  });

  // The last few analyses (Home snapshot, weather profile, My Skin). Cached and invalidated with the rest of the member context.
  const analysesQuery = useQuery({
    queryKey: ["member-context", "analyses", user?.id ?? "anon"],
    enabled: Boolean(user),
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("skincare_recommendations")
        .select(ANALYSES_COLUMNS)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data ?? []) as SavedRecommendationRow[];
    },
  });
  const recommendations = analysesQuery.data ?? [];

  // Anonymous → account handoff, wherever the visitor lands after signing up
  // (e.g. an email-confirmation link opened later): a SKYNN AI result finished
  // before sign-up is still in this browser, so attach it now. The RPC is
  // idempotent on the analysis id, so this is safe even if /skynn-ai already
  // saved it; a refusal (allowance spent) is left alone — the formulator
  // explains that when they next open it.
  useEffect(() => {
    if (!user) return;
    const pending = loadCompletedState();
    if (!pending?.result) return;
    let cancelled = false;
    (async () => {
      const outcome = await persistStarterResultToAccount({
        result: pending.result,
        contactName: null,
        contactWhatsApp: null,
        variantKey: getPersistedPricingVariant(),
      });
      if (cancelled || outcome.error || outcome.limitReached || outcome.source === "existing") return;
      if (cancelled) return;
      notifyMemberContextChanged();
      void refreshAllowance();
      toast.success("Your SKYNN AI results were saved to your account.");
      trackConversionEvent("starter_dashboard_arrived");
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshAllowance]);

  const latestAnalysis = recommendations.find((r) => r.status === "delivered") ?? null;
  const latestPayload = latestAnalysis?.result_payload as StarterAnalysisResult | null | undefined;
  const weatherProfile = latestAnalysis
    ? {
        skinType: latestAnalysis.skin_type,
        concerns: latestPayload?.profile
          ? [latestPayload.primaryConcern, ...latestPayload.profile.secondaryConcerns]
          : latestAnalysis.concerns,
      }
    : undefined;

  const dismissChecklist = async () => {
    if (!user) return false;
    const at = new Date().toISOString();
    const { error } = await supabase.from("profiles").update({ checklist_dismissed_at: at }).eq("user_id", user.id);
    if (!error) ctx.patchProfile({ checklist_dismissed_at: at });
    return !error;
  };

  // Saves only the weather city — never the free-text address city.
  const saveWeatherCity = async (cityKey: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from("profiles").update({ weather_city_key: cityKey }).eq("user_id", user.id);
    if (error) return false;
    ctx.patchProfile({ weather_city_key: cityKey });
    return true;
  };

  useEffect(() => {
    const onUpdated = () => {
      notifyMemberContextChanged();
      void refreshAllowance();
    };
    window.addEventListener(ANALYSIS_PASSES_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(ANALYSIS_PASSES_UPDATED_EVENT, onUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleReactivate = async () => {
    setReactivating(true);
    const { error } = await supabase.rpc("reactivate_account");
    setReactivating(false);
    if (error) {
      toast.error("Could not reactivate your account right now.");
      return;
    }
    ctx.patchProfile({ account_status: "active" });
    toast.success("Welcome back — your account is active again.");
  };

  if (!loading && !user) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-28 pb-24">
            <div className="container mx-auto max-w-md px-4">
              <Card>
                <CardHeader>
                  <CardTitle>{paymentReturn ? "Sign in to finish" : "Sign in to your dashboard"}</CardTitle>
                  <CardDescription>
                    {paymentReturn
                      ? "Your payment went through. Sign in with the same email you paid with and we'll take you straight into your dashboard."
                      : "Your saved analyses, routine and membership live here. Sign in or create a free account to continue."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setAuthOpen(true)}>Sign in</Button>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} returnTo={returnTo} />
      </>
    );
  }

  if (loading || ctx.loading) {
    // The page frame renders at once with skeletons shaped like the final layout: no blank screen, no jump.
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20" aria-busy="true" aria-label="Loading your dashboard">
          <div className="container mx-auto max-w-5xl space-y-6 px-4 py-12">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full max-w-md rounded-xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  const tierLabel =
    tier === "vip" ? "Glow VIP" : tier === "insider" ? "Glow Insider" : tier === "glow_lite" ? "Glow Lite" : "Glow Explorer";
  const isSubscribed = tier !== "explorer";

  if (profile?.account_status === "deactivated") {
    return (
      <>
        <Helmet><title>Account deactivated | SkinLabs®</title><meta name="robots" content="noindex, nofollow" /></Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-28 pb-24">
            <div className="container mx-auto max-w-md px-4">
              <Card className="border-amber-500/40 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PauseCircle className="h-5 w-5 text-amber-600" /> Your account is deactivated</CardTitle>
                  <CardDescription>Your data is safe. Reactivate any time to pick up right where you left off.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleReactivate} disabled={reactivating}>
                    {reactivating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Reactivate my account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const greeting = contextualGreeting(ctx.facts, profile?.full_name ? profile.full_name.split(" ")[0] : null);

  return (
    <>
      <Helmet>
        <title>Dashboard | SkinLabs®</title>
        <meta name="description" content="Manage your SkinLabs membership, saved routine and account settings." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="mb-6">
                <NextActionCard
                  greeting={greeting}
                  badge={
                    <Badge variant={isSubscribed ? "default" : "secondary"}>
                      {tierLabel}{isTrialing ? " · trial" : ""}
                    </Badge>
                  }
                  primary={ctx.primary}
                  secondary={ctx.secondary}
                  busy={trialLoading}
                  onAction={handleAction}
                />
              </div>

              {!membershipLoading && trialBanner !== "none" && trialBanner !== "ended" && (
                <div
                  className={`mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center ${
                    trialBanner === "last_chance" ? "border-amber-500/50 bg-amber-500/10" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">
                        {trialBanner === "week_left"
                          ? `One week left of your ${tierLabel} trial`
                          : trialBanner === "last_chance" || trialBanner === "precharge"
                            ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left of your ${tierLabel} trial`
                            : `${tierLabel} trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {trialBanner === "last_chance" && trialEndsLabel
                          ? `Your trial ends on ${trialEndsLabel}. Keep it now and nothing is charged before then, or do nothing and move back to Glow Explorer (free) without being charged.`
                          : trialBannerCopy}
                      </p>
                    </div>
                  </div>
                  {trialSubscription ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/dashboard?tab=billing">Manage in Billing</Link>
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => openKeepMembership({ source: "trial_banner" })}>
                      Keep my membership
                    </Button>
                  )}
                </div>
              )}

              {!membershipLoading && trialBanner === "ended" && (
                <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">Your free trial has ended</p>
                      <p className="text-sm text-muted-foreground">
                        {trialEndsLabel ? `It ended on ${trialEndsLabel}. ` : ""}
                        Your skin profile and routine are still here. Keep your membership, or get a single Analysis Pass for one more deep dive.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => openKeepMembership({ source: "trial_ended_banner" })}>
                      Keep my membership
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("billing")}>
                      Get an Analysis Pass
                    </Button>
                  </div>
                </div>
              )}

              {activating && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-foreground">Confirming your payment and activating access…</p>
                </div>
              )}

              <Tabs value={activeGroup} onValueChange={setActiveGroup} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="home">Home</TabsTrigger>
                  <TabsTrigger value="skin">My Skin</TabsTrigger>
                  <TabsTrigger value="saved" className="gap-1.5">
                    <Bookmark className="h-3.5 w-3.5" />
                    Saved
                    {ctx.facts.journey.savedItems > 0 && (
                      <Badge className="ml-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">{ctx.facts.journey.savedItems}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="inbox" className="gap-1.5">
                    Inbox
                    {unreadCount > 0 && <Badge className="ml-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">{unreadCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="home" className="space-y-6">
                  {!ctx.checklistDismissedAt && (
                    <GettingStartedChecklist
                      items={ctx.checklist}
                      onGoToTab={setActiveTab}
                      onDismiss={dismissChecklist}
                      userId={user?.id}
                      onChanged={() => void ctx.refresh()}
                      primaryHref={ctx.primary?.href ?? null}
                    />
                  )}

                  <SkinProfileHero
                    latest={latestAnalysis}
                    loading={analysesQuery.isLoading}
                    allowance={allowance}
                    onViewFullAnalysis={() => setActiveTab("analysis")}
                  />

                  <div id="skin-weather" className="scroll-mt-28">
                    <SkinWeatherCard
                      weatherCityKey={profile?.weather_city_key ?? null}
                      addressCity={profile?.city ?? null}
                      skinProfile={weatherProfile}
                      onSaveCity={async (key) => {
                        const ok = await saveWeatherCity(key);
                        if (ok) void ctx.refresh();
                        return ok;
                      }}
                    />
                  </div>

                  <ForYourSkinCard onOpenRoutine={() => setActiveTab("routine")} />

                  <ForYourProfileFeed />

                  <PlanStatusRow facts={ctx.facts} tierLabel={tierLabel} allowance={allowance} />
                </TabsContent>

                <TabsContent value="skin" className="space-y-6">
                  <SectionNav
                    label="My Skin"
                    value={activeSection}
                    onChange={setActiveTab}
                    items={[
                      { value: "analysis", label: "Analysis" },
                      { value: "routine", label: "Routine" },
                      { value: "journey", label: "Journey" },
                    ]}
                  />
                  {activeSection === "analysis" && (
                    <div className="space-y-6">
                      <FormulatorTab onGoToProfile={() => setActiveTab("profile")} />
                      <AdvancedAssessmentCard isMember={isMember} balance={ctx.facts.analysisPasses} loading={membershipLoading} />
                    </div>
                  )}
                  {activeSection === "routine" && <RoutineTrackerTab />}
                  {activeSection === "journey" && <SkinJourneyTab />}
                </TabsContent>

                <TabsContent value="saved" className="space-y-6">
                  <SavedContentTab />
                </TabsContent>

                <TabsContent value="inbox"><InboxTab /></TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <SectionNav
                    label="Settings"
                    value={activeSection}
                    onChange={setActiveTab}
                    items={[
                      { value: "profile", label: "Profile" },
                      { value: "billing", label: "Billing" },
                      { value: "security", label: "Security" },
                      { value: "app", label: "App" },
                      { value: "account", label: "Account" },
                    ]}
                  />
                  {activeSection === "profile" && <ProfileTab />}
                  {activeSection === "billing" && (
                    <div className="space-y-6">
                      <BillingTab aiCredits={ctx.facts.analysisPasses} />
                      <PreOrdersCard />
                    </div>
                  )}
                  {activeSection === "security" && (
                    <div className="space-y-6">
                      <EmailVerificationCard />
                      <MFASettingsCard />
                    </div>
                  )}
                  {activeSection === "app" && (
                    <Suspense fallback={null}>
                      <AppSettingsPanel />
                    </Suspense>
                  )}
                  {activeSection === "account" && (
                    <div className="space-y-6">
                      <AccountTab />
                      <div className="flex justify-end"><ReportBugButton /></div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default UserDashboard;
