import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sparkles, Package, Crown, FileText, Loader2, Clock, Coins, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { supabase } from "@/integrations/supabase/client";
import MFASettingsCard from "@/components/MFASettingsCard";
import EmailVerificationCard from "@/components/EmailVerificationCard";
import ProfileTab from "@/components/dashboard/ProfileTab";
import SkinJourneyTab from "@/components/dashboard/SkinJourneyTab";
import TrialWelcomeModal from "@/components/TrialWelcomeModal";
import AuthDialog from "@/components/AuthDialog";
import FormulatorTab from "@/components/dashboard/FormulatorTab";
import SavedAnalysisCard, { type SavedRecommendationRow } from "@/components/dashboard/SavedAnalysisCard";
import { toast } from "sonner";
import { isPaidSubscriptionStatus } from "@/lib/entitlements";
import { trackConversionEvent } from "@/lib/analytics-events";

interface Profile {
  subscription_status: string | null;
  subscription_started_at: string | null;
  full_name: string | null;
  email: string | null;
}

interface Preorder { id: string; product_type: string; amount: number; status: string; created_at: string; }
type Recommendation = SavedRecommendationRow;

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tier, isTrialing, trialEndsAt, trialUsed, loading: membershipLoading, refresh: refreshMembership } = useMembership();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [trialWelcomeOpen, setTrialWelcomeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [authOpen, setAuthOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const paymentReturn = searchParams.get("payment") === "success";
  const purchaseType = searchParams.get("purchase_type") ?? "plan";

  useEffect(() => {
    if (loading || user) return;
    // A Paystack return can land before the session is restored or on a fresh
    // device — offer sign-in instead of bouncing the buyer off the page.
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

  /**
   * After checkout, the purchase is only live once Paystack's signature-
   * verified webhook applies it (subscription status, granted credits, or a
   * claimed founding-member slot), so poll for that rather than trusting the
   * redirect. What we poll for — and which events fire — depends on
   * purchase_type, since a plan, a credit pack and the founding-member offer
   * each land differently.
   */
  useEffect(() => {
    if (!paymentReturn || !user) return;
    let cancelled = false;
    let attempts = 0;
    setActivating(true);

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
      const [profileRes, preordersRes, recsRes, creditsRes] = await Promise.all([
        supabase.from("profiles").select("subscription_status, subscription_started_at, full_name, email").eq("user_id", user.id).single(),
        supabase.from("preorders").select("id, product_type, amount, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase
          .from("skincare_recommendations")
          .select("id, skin_type, concerns, created_at, status, mst_tone, analysis_completeness, result_payload")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.rpc("available_ai_credits", { _user_id: user.id }),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (preordersRes.data) setPreorders(preordersRes.data);
      if (recsRes.data) setRecommendations(recsRes.data);
      if (typeof creditsRes.data === "number") setAiCredits(creditsRes.data);
      setDataLoading(false);
    })();
  }, [user]);

  const handleCancelSubscription = async () => {
    setCancelling(true);
    const { error } = await supabase.rpc("cancel_subscription");
    setCancelling(false);
    setCancelOpen(false);
    if (error) {
      toast.error("Couldn't cancel right now — please try again or contact us.");
      return;
    }
    refreshMembership();
    trackConversionEvent("subscription_cancelled", { plan: tier });
    toast.success("Your membership has been cancelled — you're back on Glow Explorer.");
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
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
              </h1>
              <p className="text-muted-foreground mb-6">{user?.email}</p>

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
                          : "Upgrade to Glow Insider to unlock your routine, reviews and the full podcast library again."}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/pricing">See plans</Link>
                  </Button>
                </div>
              )}


              {activating && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Confirming your payment…</p>
                    <p className="text-sm text-muted-foreground">
                      We're waiting for the payment confirmation to activate your plan. This usually takes a few seconds.
                    </p>
                  </div>
                </div>
              )}

              <Tabs
                value={activeTab}
                onValueChange={(tab) => {
                  setActiveTab(tab);
                  if (tab === "reports") trackConversionEvent("starter_dashboard_arrived");
                }}
                className="space-y-6"
              >
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="formulator">Skin Analysis (SKYNN AI)</TabsTrigger>
                  <TabsTrigger value="journey">Skin Journey</TabsTrigger>
                  <TabsTrigger value="reports">AI Reports</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
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
                        {isSubscribed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-auto gap-1.5 px-0 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => setCancelOpen(true)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel membership
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Coins className="h-4 w-4 text-primary" />AI Credits</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-foreground">{aiCredits ?? 0}</p>
                        <p className="text-xs text-muted-foreground">
                          {aiCredits && aiCredits > 0 ? "Extra analyses available" : (
                            <Link to="/pricing" className="text-primary hover:underline">Buy more analyses</Link>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Pre-Orders</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-foreground">{preorders.length}</p><p className="text-xs text-muted-foreground">Total orders</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Reports</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-foreground">{recommendations.length}</p><p className="text-xs text-muted-foreground">Skincare analyses</p></CardContent>
                    </Card>
                  </div>

                  {tier === "vip" && !isTrialing && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                          <Crown className="h-4 w-4 text-primary" /> VIP quarterly routine review
                        </CardTitle>
                        <CardDescription>
                          Book your seasonal check-in with a priority-booked practitioner — included with Glow VIP.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button size="sm" asChild>
                          <Link to="/consultations">Book my quarterly review</Link>
                        </Button>
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
                
                <TabsContent value="formulator">
                  <FormulatorTab onGoToProfile={() => setActiveTab("profile")} />
                </TabsContent>

                <TabsContent value="journey"><SkinJourneyTab /></TabsContent>

                <TabsContent value="reports">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />AI Skincare Reports</CardTitle><CardDescription>Your personalized recommendations history</CardDescription></CardHeader>
                    <CardContent>
                      {recommendations.length === 0 ? <p className="text-sm text-muted-foreground">No reports yet. Try <a href="/skynn-ai" className="text-primary hover:underline">Skin Analysis (SKYNN AI)</a>.</p> :
                        <div>
                          {recommendations.map((rec) => <SavedAnalysisCard key={rec.id} rec={rec} />)}
                        </div>
                      }
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <EmailVerificationCard />
                  <MFASettingsCard />
                </TabsContent>
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
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your {tierLabel} membership?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll move back to Glow Explorer immediately — no more charges, and you keep everything you've
              already saved. You can resubscribe any time from the pricing page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep my membership</AlertDialogCancel>
            <AlertDialogAction disabled={cancelling} onClick={handleCancelSubscription}>
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserDashboard;
