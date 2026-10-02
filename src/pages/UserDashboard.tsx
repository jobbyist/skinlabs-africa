import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useLocation, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, Crown, Loader2, Clock, Bell, PauseCircle, Bookmark } from "lucide-react";
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
import SavedContentTab from "@/components/dashboard/SavedContentTab";
import ProfileCompletenessRing from "@/components/dashboard/ProfileCompletenessRing";
import NewsfeedCarousel from "@/components/dashboard/NewsfeedCarousel";
import AuthDialog from "@/components/AuthDialog";
import FormulatorTab from "@/components/dashboard/FormulatorTab";
import AnalysisPassesCard from "@/components/dashboard/AnalysisPassesCard";
import AdvancedAssessmentCard from "@/components/dashboard/AdvancedAssessmentCard";
import SkinProfileHero from "@/components/dashboard/SkinProfileHero";
import ForYourSkinCard from "@/components/dashboard/ForYourSkinCard";
import GettingStartedChecklist from "@/components/dashboard/GettingStartedChecklist";
import JourneyMomentumCard from "@/components/dashboard/JourneyMomentumCard";
import SectionNav from "@/components/dashboard/SectionNav";
import { useJourney } from "@/hooks/use-journey";
import { GROUP_DEFAULT_SECTION, SECTION_GROUP, resolveDashboardSection, type DashboardGroup } from "@/lib/dashboardTabs";
import AnalysisCreditsCard from "@/components/dashboard/AnalysisCreditsCard";
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
import { computeProfileStrength } from "@/lib/profileStrength";
import { useNotifications } from "@/hooks/use-notifications";
import { trackConversionEvent } from "@/lib/analytics-events";
import { ANALYSIS_PASSES_UPDATED_EVENT } from "@/hooks/use-analysis-passes";
import { activatePendingPaypalSubscription, capturePendingPaypalOrder } from "@/lib/payments";
import { openKeepMembership } from "@/lib/conversionDialogs";
import { sastDaysUntil, trialBannerState } from "@/lib/trialLifecycle";

interface Profile {
  subscription_status: string | null;
  subscription_started_at: string | null;
  full_name: string | null;
  email: string | null;
  account_status: string | null;
  username: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  skin_color: string | null;
  address_line1: string | null;
  city: string | null;
  weather_city_key: string | null;
  allergies: string[] | null;
  skin_conditions: string[] | null;
  preferred_routine_time: string | null;
}

interface Preorder { id: string; product_type: string; amount: number; status: string; created_at: string; }
type Recommendation = SavedRecommendationRow;
interface ActivityStats { liked: number; saved: number; comments: number }


const UserDashboard = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tier, isMember, isTrialing, trialEndsAt, trialUsed, loading: membershipLoading, refresh: refreshMembership } = useMembership();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { start: startTrial, loading: trialLoading } = useStartTrial();
  const { data: allowance, loading: allowanceLoading, error: allowanceError, refresh: refreshAllowance } = useFormulatorAllowance();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activity, setActivity] = useState<ActivityStats>({ liked: 0, saved: 0, comments: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [creditsError, setCreditsError] = useState<string | null>(null);
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
  const [aiCredits, setAiCredits] = useState<number | null>(null);
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
  const journey = useJourney();
  const dashboardEntered = useRef(false);
  useEffect(() => {
    if (!user || dashboardEntered.current) return;
    dashboardEntered.current = true;
    trackConversionEvent("dashboard_entered", { stage: journey.stage });
  }, [user, journey.stage]);

  const handleJourneyAction = () => {
    const action = journey.nextAction;
    trackConversionEvent("checklist_step_clicked", { step: action.id });
    if (action.kind === "keep_membership") {
      openKeepMembership({ source: "dashboard_journey" });
      return;
    }
    if (action.kind === "start_trial") {
      void startTrial({ plan: "insider", source: "dashboard", destination: null });
      return;
    }
    if (action.kind === "link" && action.href) {
      navigate(action.href);
    }
  };

  const scrollToSetup = () => {
    document.getElementById("getting-started")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Checklist completion comes from data changed on other tabs (routine,
  // security…): re-read it whenever Home is shown again.
  const seenGroup = useRef(false);
  useEffect(() => {
    if (!seenGroup.current) {
      seenGroup.current = true;
      return;
    }
    if (activeGroup === "home") journey.refresh();
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
          setAiCredits(balance);
          trackConversionEvent("checkout_completed", { purchaseType });
          trackConversionEvent("credit_pack_purchased", { packId: searchParams.get("pack_id") ?? undefined });
          toast.success("Payment confirmed — your AI analysis credits are ready.");
          return true;
        }
        return false;
      }
      if (purchaseType === "founding_member") {
        const { data } = await supabase.from("profiles").select("founding_member").eq("user_id", user.id).maybeSingle();
        if (data?.founding_member) {
          refreshMembership();
          trackConversionEvent("checkout_completed", { purchaseType });
          trackConversionEvent("founding_member_purchased", { offerId: searchParams.get("offer_id") ?? undefined });
          toast.success("Welcome — you're a SkinLabs Founding Member.");
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

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, preordersRes, recsRes, creditsRes, likedRes, savedRes, commentsRes] = await Promise.all([
        supabase.from("profiles").select(
          "subscription_status, subscription_started_at, full_name, email, account_status, username, phone, date_of_birth, gender, skin_color, address_line1, city, weather_city_key, allergies, skin_conditions, preferred_routine_time",
        ).eq("user_id", user.id).single(),
        supabase.from("preorders").select("id, product_type, amount, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase
          .from("skincare_recommendations")
          .select("id, skin_type, concerns, created_at, status, mst_tone, analysis_completeness, result_payload")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.rpc("available_ai_credits", { _user_id: user.id }),
        supabase.from("news_article_engagement").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("kind", "like"),
        supabase.from("news_article_engagement").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("kind", "save"),
        supabase.from("review_comments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (preordersRes.data) setPreorders(preordersRes.data);
      if (recsRes.data) setRecommendations(recsRes.data);
      if (creditsRes.error) setCreditsError(creditsRes.error.message);
      else if (typeof creditsRes.data === "number") setAiCredits(creditsRes.data);
      setActivity({ liked: likedRes.count ?? 0, saved: savedRes.count ?? 0, comments: commentsRes.count ?? 0 });
      setDataLoading(false);
    })();
  }, [user]);

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
      const { data } = await supabase
        .from("skincare_recommendations")
        .select("id, skin_type, concerns, created_at, status, mst_tone, analysis_completeness, result_payload")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (cancelled) return;
      if (data) setRecommendations(data);
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

  // Saves only the weather city — never the free-text address city.
  const saveWeatherCity = async (cityKey: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from("profiles").update({ weather_city_key: cityKey }).eq("user_id", user.id);
    if (error) return false;
    setProfile((p) => (p ? { ...p, weather_city_key: cityKey } : p));
    return true;
  };

  const retryAnalysisPassBalance = async () => {
    if (!user) return;
    setCreditsError(null);
    const { data, error } = await supabase.rpc("available_ai_credits", { _user_id: user.id });
    if (error) setCreditsError(error.message);
    else if (typeof data === "number") setAiCredits(data);
  };

  useEffect(() => {
    const onUpdated = () => void retryAnalysisPassBalance();
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
    setProfile((p) => (p ? { ...p, account_status: "active" } : p));
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

  if (loading || dataLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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

  const strength = computeProfileStrength(profile);

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
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-heading font-bold text-foreground mb-1">
                    Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-muted-foreground">{user?.email}</p>
                    <Badge variant={isSubscribed ? "default" : "secondary"}>
                      {tierLabel}{isTrialing ? " · trial" : ""}
                    </Badge>
                  </div>
                  <p className="mt-2 max-w-xl text-sm text-secondary-text">
                    Your skin profile, routine and daily guidance — all in one place.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ReportBugButton />
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary"
                  >
                    <ProfileCompletenessRing percent={strength.percent} size={48} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Skin Profile</p>
                      <p className="text-xs text-muted-foreground">{strength.filledCount}/{strength.totalCount} details</p>
                    </div>
                  </button>
                </div>
              </div>

              {!journey.loading && (

              <JourneyMomentumCard
                stage={journey.stage}
                facts={journey.facts}
                checklist={journey.checklist}
                nextAction={journey.nextAction}
                onAction={handleJourneyAction}
                onSeeSteps={scrollToSetup}
                actionLoading={trialLoading}
              />
              )}

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
                    {activity.saved > 0 && (
                      <Badge className="ml-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">{activity.saved}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="inbox" className="gap-1.5">
                    Inbox
                    {unreadCount > 0 && <Badge className="ml-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">{unreadCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="home" className="space-y-6">
                  {!journey.loading && !journey.checklistDismissedAt && (
                    <GettingStartedChecklist
                      items={journey.checklist}
                      onGoToTab={setActiveTab}
                      onDismiss={journey.dismissChecklist}
                    />
                  )}

                  <SkinProfileHero
                    latest={latestAnalysis}
                    loading={dataLoading}
                    allowance={allowance}
                    onViewFullAnalysis={() => setActiveTab("analysis")}
                  />

                  <ForYourSkinCard onOpenRoutine={() => setActiveTab("routine")} />

                  <div id="skin-weather" className="scroll-mt-28">
                    <SkinWeatherCard
                      weatherCityKey={profile?.weather_city_key ?? null}
                      addressCity={profile?.city ?? null}
                      skinProfile={weatherProfile}
                      onSaveCity={async (key) => {
                        const ok = await saveWeatherCity(key);
                        if (ok) journey.refresh();
                        return ok;
                      }}
                    />
                  </div>

                  {/* One row of secondary cards. */}
                  <div className="grid gap-6 md:grid-cols-3">
                    <AnalysisCreditsCard
                      allowance={allowance}
                      loading={allowanceLoading}
                      error={allowanceError}
                      onRetry={() => void refreshAllowance()}
                    />
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Crown className="h-4 w-4 text-primary" />Subscription</CardTitle></CardHeader>
                      <CardContent>
                        <Badge variant={isSubscribed ? "default" : "secondary"}>
                          {tierLabel}{isTrialing ? " (trial)" : ""}
                        </Badge>
                        {isSubscribed && !isTrialing && profile?.subscription_started_at && (
                          <p className="text-xs text-muted-foreground mt-2">Since {new Date(profile.subscription_started_at).toLocaleDateString()}</p>
                        )}
                        {isTrialing && (
                          <p className="text-xs text-muted-foreground mt-2">{trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left</p>
                        )}
                        <Button variant="ghost" size="sm" className="mt-2 h-auto px-0 text-xs text-primary" onClick={() => setActiveTab("billing")}>
                          Manage billing
                        </Button>
                      </CardContent>
                    </Card>
                    <AnalysisPassesCard
                      balance={aiCredits}
                      loading={dataLoading}
                      error={creditsError}
                      onRetry={() => void retryAnalysisPassBalance()}
                    />
                  </div>
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
                      <AdvancedAssessmentCard isMember={isMember} balance={aiCredits} loading={dataLoading || membershipLoading} />
                    </div>
                  )}
                  {activeSection === "routine" && <RoutineTrackerTab />}
                  {activeSection === "journey" && <SkinJourneyTab />}
                </TabsContent>

                <TabsContent value="saved" className="space-y-6">
                  <SavedContentTab />
                  {(activity.liked > 0 || activity.saved > 0 || activity.comments > 0) && (
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base">Your activity</CardTitle><CardDescription>Real engagement from your account — briefings you've liked or saved, and comments you've posted.</CardDescription></CardHeader>
                      <CardContent className="flex flex-wrap gap-6">
                        <div><p className="text-2xl font-bold text-foreground">{activity.liked}</p><p className="text-xs text-muted-foreground">Liked briefings</p></div>
                        <button type="button" onClick={() => setActiveTab("saved")} className="text-left hover:opacity-80">
                          <p className="text-2xl font-bold text-foreground">{activity.saved}</p>
                          <p className="text-xs text-muted-foreground">Saved briefings</p>
                        </button>
                        <div><p className="text-2xl font-bold text-foreground">{activity.comments}</p><p className="text-xs text-muted-foreground">Comments</p></div>
                      </CardContent>
                    </Card>
                  )}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Daily Skinny — for you</CardTitle></CardHeader>
                    <CardContent><NewsfeedCarousel /></CardContent>
                  </Card>
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
                      { value: "account", label: "Account" },
                    ]}
                  />
                  {activeSection === "profile" && <ProfileTab />}
                  {activeSection === "billing" && (
                    <div className="space-y-6">
                      <BillingTab aiCredits={aiCredits} />
                  {preorders.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Your Pre-Orders</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {preorders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                              <div>
                                <p className="font-medium text-foreground capitalize">{order.product_type.replace("_", " ")}</p>
                                <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-foreground">R{order.amount}</p>
                                <Badge variant={order.status === "complete" ? "default" : "secondary"} className="text-xs">{order.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                    </div>
                  )}
                  {activeSection === "security" && (
                    <div className="space-y-6">
                      <EmailVerificationCard />
                      <MFASettingsCard />
                    </div>
                  )}
                  {activeSection === "account" && <AccountTab />}
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
