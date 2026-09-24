import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Package, Crown, Loader2, Clock, Bell, PauseCircle, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { supabase } from "@/integrations/supabase/client";
import MFASettingsCard from "@/components/MFASettingsCard";
import EmailVerificationCard from "@/components/EmailVerificationCard";
import ProfileTab from "@/components/dashboard/ProfileTab";
import SkinJourneyTab from "@/components/dashboard/SkinJourneyTab";
import RoutineTrackerTab from "@/components/dashboard/RoutineTrackerTab";
import RoutineSnapshot from "@/components/dashboard/RoutineSnapshot";
import BillingTab from "@/components/dashboard/BillingTab";
import InboxTab from "@/components/dashboard/InboxTab";
import AccountTab from "@/components/dashboard/AccountTab";
import SavedContentTab from "@/components/dashboard/SavedContentTab";
import ProfileCompletenessRing from "@/components/dashboard/ProfileCompletenessRing";
import NewsfeedCarousel from "@/components/dashboard/NewsfeedCarousel";
import TrialWelcomeModal from "@/components/TrialWelcomeModal";
import AuthDialog from "@/components/AuthDialog";
import FormulatorTab from "@/components/dashboard/FormulatorTab";
import AnalysisPassesCard from "@/components/dashboard/AnalysisPassesCard";
import AdvancedAssessmentCard from "@/components/dashboard/AdvancedAssessmentCard";
import ReportBugButton from "@/components/ReportBugButton";
import type { SavedRecommendationRow } from "@/components/dashboard/SavedAnalysisCard";
import { toast } from "sonner";
import { isPaidSubscriptionStatus } from "@/lib/entitlements";
import { computeProfileStrength } from "@/lib/profileStrength";
import { useNotifications } from "@/hooks/use-notifications";
import { trackConversionEvent } from "@/lib/analytics-events";
import { capturePendingPaypalOrder } from "@/lib/payments";

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
  allergies: string[] | null;
  skin_conditions: string[] | null;
  preferred_routine_time: string | null;
}

interface Preorder { id: string; product_type: string; amount: number; status: string; created_at: string; }
type Recommendation = SavedRecommendationRow;
interface ActivityStats { liked: number; saved: number; comments: number }

const VALID_TABS = ["overview", "profile", "analysis", "routine", "journey", "saved", "billing", "inbox", "security", "account"] as const;
type DashboardTab = (typeof VALID_TABS)[number];

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tier, isMember, isTrialing, trialEndsAt, trialUsed, loading: membershipLoading, refresh: refreshMembership } = useMembership();
  const { unreadCount } = useNotifications();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activity, setActivity] = useState<ActivityStats>({ liked: 0, saved: 0, comments: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const [trialWelcomeOpen, setTrialWelcomeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [reactivating, setReactivating] = useState(false);

  const tabParam = searchParams.get("tab");
  const activeTab: DashboardTab = (VALID_TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as DashboardTab) : "overview";
  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const paymentReturn = searchParams.get("payment") === "success";
  const purchaseType = searchParams.get("purchase_type") ?? "plan";

  useEffect(() => {
    if (loading || user) return;
    if (paymentReturn) setAuthOpen(true);
    else navigate("/");
  }, [user, loading, navigate, paymentReturn]);

  useEffect(() => {
    if (searchParams.get("trial") !== "started") return;
    setTrialWelcomeOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("trial");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    })();

    const clearParam = () => {
      const next = new URLSearchParams(window.location.search);
      next.delete("payment");
      next.delete("purchase_type");
      next.delete("plan");
      next.delete("interval");
      next.delete("pack_id");
      next.delete("offer_id");
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
      const { data } = await supabase.from("profiles").select("subscription_status").eq("user_id", user.id).maybeSingle();
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

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, preordersRes, recsRes, creditsRes, likedRes, savedRes, commentsRes] = await Promise.all([
        supabase.from("profiles").select(
          "subscription_status, subscription_started_at, full_name, email, account_status, username, phone, date_of_birth, gender, skin_color, address_line1, city, allergies, skin_conditions, preferred_routine_time",
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

  const retryAnalysisPassBalance = async () => {
    if (!user) return;
    setCreditsError(null);
    const { data, error } = await supabase.rpc("available_ai_credits", { _user_id: user.id });
    if (error) setCreditsError(error.message);
    else if (typeof data === "number") setAiCredits(data);
  };

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

  if (!loading && !user && paymentReturn) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-28 pb-24">
            <div className="container mx-auto max-w-md px-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sign in to finish</CardTitle>
                  <CardDescription>
                    Your payment went through. Sign in with the same email you paid with and we'll take you
                    straight into your dashboard.
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
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
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
                  <p className="text-muted-foreground">{user?.email}</p>
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

              {!membershipLoading && isTrialing && (
                <div
                  className={`mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center ${
                    trialDaysLeft <= 2 ? "border-amber-500/50 bg-amber-500/10" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        {tierLabel} trial — {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {trialEndsAt
                          ? `Full access until ${new Date(trialEndsAt).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}. No card on file — your access simply ends unless you upgrade.`
                          : "No card on file. Upgrade any time to keep your access after the trial ends."}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/pricing">Upgrade now</Link>
                  </Button>
                </div>
              )}

              {!membershipLoading && !isTrialing && trialUsed && tier === "explorer" && (
                <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Your free trial has ended</p>
                      <p className="text-sm text-muted-foreground">
                        {trialEndsAt
                          ? `It ended on ${new Date(trialEndsAt).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}. Upgrade to Glow Insider to unlock your routine, reviews and the full podcast library again.`
                          : "Upgrade to keep full access to routines, reviews and the podcast library."}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/pricing">Upgrade now</Link>
                  </Button>
                </div>
              )}

              {activating && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-foreground">Confirming your payment and activating access…</p>
                </div>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="overview">Home</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="analysis">Skin Analysis (SKYNN AI)</TabsTrigger>
                  <TabsTrigger value="routine">Routine</TabsTrigger>
                  <TabsTrigger value="journey">Skin Journey</TabsTrigger>
                  <TabsTrigger value="saved" className="gap-1.5">
                    <Bookmark className="h-3.5 w-3.5" />
                    Saved
                    {activity.saved > 0 && (
                      <Badge className="ml-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">{activity.saved}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="inbox" className="gap-1.5">
                    Inbox
                    {unreadCount > 0 && <Badge className="ml-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">{unreadCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Pre-Orders</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-foreground">{preorders.length}</p><p className="text-xs text-muted-foreground">Total orders</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Analyses</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-foreground">{recommendations.length}</p><p className="text-xs text-muted-foreground">Saved analyses</p></CardContent>
                    </Card>
                  </div>

                  <RoutineSnapshot />
                  <AdvancedAssessmentCard isMember={isMember} balance={aiCredits} loading={dataLoading || membershipLoading} />

                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Daily Skinny — for you</CardTitle></CardHeader>
                    <CardContent><NewsfeedCarousel /></CardContent>
                  </Card>

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
                </TabsContent>

                <TabsContent value="profile"><ProfileTab /></TabsContent>

                <TabsContent value="analysis">
                  <FormulatorTab onGoToProfile={() => setActiveTab("profile")} />
                </TabsContent>

                <TabsContent value="routine"><RoutineTrackerTab /></TabsContent>

                <TabsContent value="journey"><SkinJourneyTab /></TabsContent>

                <TabsContent value="saved"><SavedContentTab /></TabsContent>

                <TabsContent value="billing"><BillingTab aiCredits={aiCredits} /></TabsContent>

                <TabsContent value="inbox"><InboxTab /></TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <EmailVerificationCard />
                  <MFASettingsCard />
                </TabsContent>

                <TabsContent value="account"><AccountTab /></TabsContent>
              </Tabs>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <TrialWelcomeModal
        open={trialWelcomeOpen}
        onOpenChange={setTrialWelcomeOpen}
        planName={tierLabel}
        trialEndsAt={trialEndsAt}
      />
    </>
  );
};

export default UserDashboard;
