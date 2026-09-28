import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarCheck, Loader2, LocateFixed, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import AuthDialog from "@/components/AuthDialog";
import StepperHeader from "@/components/ai-formulator/StepperHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useStartTrial } from "@/hooks/use-start-trial";
import { trackConversionEvent } from "@/lib/analytics-events";
import { TIER_LABELS } from "@/lib/entitlements";
import { headlineForSavedAnalysis, type SavedAnalysisHeadline } from "@/lib/formulator/summary";
import { getPersistedPricingVariant } from "@/lib/pricing-config";
import { trialCtaLabel } from "@/lib/promo";
import { SA_CITIES, cityByKey, cityFromProfile, nearestCity } from "@/lib/skinWeather/cities";
import { loadCompletedState, persistStarterResultToAccount } from "@/lib/starter-analysis/persistence";

const STEPS = ["Your skin", "Your day", "Your trial"] as const;
type RoutineTime = "am" | "pm" | "both";

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });

/**
 * /welcome — first-run onboarding for a brand-new account (IntentResolver
 * sends new accounts with no pending intent here once; see intentRouting.ts).
 * Three skippable screens: the attached SKYNN AI result, Skin Weather city +
 * routine time, and the no-card trial. Finishing or skipping stamps
 * profiles.onboarding_completed_at, and anyone who already has that stamp is
 * sent straight to /dashboard, so a returning member never sees this page.
 */
const Welcome = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const membership = useMembership();
  const { start: startTrial, loading: trialLoading } = useStartTrial();

  const [authOpen, setAuthOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [headline, setHeadline] = useState<SavedAnalysisHeadline | null>(null);
  const [cityKey, setCityKey] = useState<string>("");
  const [routineTime, setRoutineTime] = useState<RoutineTime>("both");
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const loadAnalysis = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("skincare_recommendations")
      .select("skin_type, concerns, result_payload")
      .eq("user_id", userId)
      .eq("status", "delivered")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setHeadline(data ? headlineForSavedAnalysis(data) : null);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed_at, weather_city_key, city, preferred_routine_time")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile?.onboarding_completed_at) {
        setCompleted(true);
        return;
      }
      const saved = cityByKey(profile?.weather_city_key) ?? cityFromProfile(profile?.city ?? null);
      if (saved) setCityKey(saved.key);
      const time = profile?.preferred_routine_time;
      if (time === "am" || time === "pm" || time === "both") setRoutineTime(time);

      // A SKYNN AI result finished before sign-up is still in this browser:
      // attach it (idempotent on the analysis id, same as the dashboard does).
      const pending = loadCompletedState();
      if (pending?.result) {
        await persistStarterResultToAccount({
          result: pending.result,
          contactName: null,
          contactWhatsApp: null,
          variantKey: getPersistedPricingVariant(),
        });
      }
      await loadAnalysis(user.id);
      if (cancelled) return;
      setLoaded(true);
      trackConversionEvent("welcome_viewed", { trial: searchParams.get("trial") === "started" });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, loadAnalysis]);

  const finish = async (how: "finished" | "skipped") => {
    if (!user) return;
    setFinishing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (error) {
      setFinishing(false);
      toast.error("Couldn't finish setup — try again.");
      return;
    }
    trackConversionEvent("welcome_finished", { how, step });
    navigate("/dashboard", { replace: true });
  };

  const next = (skipped: boolean) => {
    trackConversionEvent("welcome_step_completed", { step, skipped });
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const saveDay = async () => {
    if (!user) return;
    setSaving(true);
    const patch: { preferred_routine_time: RoutineTime; weather_city_key?: string } = { preferred_routine_time: routineTime };
    if (cityKey) patch.weather_city_key = cityKey;
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't save that — try again, or skip for now.");
      return;
    }
    next(false);
  };

  const locateMe = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available in this browser — pick your city instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Snapped to the nearest supported city on-device; coordinates never leave the browser.
        const nearest = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCityKey(nearest.key);
        toast.success(`Nearest city: ${nearest.label}.`);
      },
      () => toast.error("Couldn't get your location — pick your city instead."),
      { maximumAge: 600_000, timeout: 10_000 },
    );
  };

  if (completed) return <Navigate to="/dashboard" replace />;

  const planLabel = TIER_LABELS[membership.tier];
  const hasPlan = membership.tier !== "explorer";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Welcome | SkinLabs®</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="pt-28 pb-24">
        <div className="container mx-auto max-w-xl px-4">
          {!user ? (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">Sign in to finish setting up your account.</p>
                <Button onClick={() => setAuthOpen(true)}>Sign in</Button>
              </CardContent>
            </Card>
          ) : !loaded ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading your account">
              <Skeleton className="mx-auto h-7 w-64" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              <StepperHeader phase={step} phases={STEPS} />

              {step === 1 && (
                <section aria-labelledby="welcome-skin" className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  {headline ? (
                    <>
                      <div className="text-center space-y-2">
                        <h1 id="welcome-skin" className="font-heading text-2xl sm:text-3xl font-bold">
                          Nice. Your skin profile's saved.
                        </h1>
                        <p className="text-muted-foreground">Two quick things and you're in.</p>
                      </div>
                      <Card>
                        <CardContent className="p-6 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKYNN AI skin profile</p>
                          <p className="font-heading text-2xl font-bold">{headline.skinTypeLabel}</p>
                          {headline.concerns.length > 0 && (
                            <ul className="flex flex-wrap gap-2" aria-label="Top concerns">
                              {headline.concerns.map((c) => (
                                <li key={c} className="rounded-full bg-secondary px-3 py-1 text-sm">{c}</li>
                              ))}
                            </ul>
                          )}
                          <p className="text-sm text-muted-foreground">{headline.guidance}</p>
                        </CardContent>
                      </Card>
                      <Button className="w-full gap-2" onClick={() => next(false)}>
                        Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <h1 id="welcome-skin" className="font-heading text-2xl sm:text-3xl font-bold">
                          Welcome to <span className="gradient-text">SkinLabs</span>
                        </h1>
                        <p className="text-muted-foreground">
                          Start with your skin. Answer a few questions and SKYNN AI builds your skin profile and a routine around it.
                        </p>
                      </div>
                      <Button asChild className="w-full gap-2">
                        <Link to="/skynn-ai" onClick={() => trackConversionEvent("welcome_step_completed", { step: 1, action: "analysis" })}>
                          <Sparkles className="h-4 w-4" aria-hidden="true" /> Take the 2-minute analysis
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => next(true)}>
                        Skip for now
                      </Button>
                    </>
                  )}
                </section>
              )}

              {step === 2 && (
                <section aria-labelledby="welcome-day" className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <div className="text-center space-y-2">
                    <h1 id="welcome-day" className="font-heading text-2xl sm:text-3xl font-bold">Your day</h1>
                    <p className="text-muted-foreground">
                      We'll match your daily Skin Weather tip to your city, and your routine reminders to when you actually do it.
                    </p>
                  </div>
                  <Card>
                    <CardContent className="p-6 space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="welcome-city">Your city</Label>
                        <div className="flex gap-2">
                          <Select value={cityKey} onValueChange={setCityKey}>
                            <SelectTrigger id="welcome-city" className="flex-1">
                              <SelectValue placeholder="Choose your city" />
                            </SelectTrigger>
                            <SelectContent>
                              {SA_CITIES.map((c) => (
                                <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                            onClick={locateMe}
                            aria-label="Use my location (rounded to the nearest city)"
                          >
                            <LocateFixed className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Your location stays on your device; we only save the city.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="welcome-routine-time">When do you do your routine?</Label>
                        <Select value={routineTime} onValueChange={(v) => setRoutineTime(v as RoutineTime)}>
                          <SelectTrigger id="welcome-routine-time"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="am">Mornings</SelectItem>
                            <SelectItem value="pm">Evenings</SelectItem>
                            <SelectItem value="both">Morning and evening</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                  <Button className="w-full gap-2" disabled={saving} onClick={() => void saveDay()}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Save and continue
                  </Button>
                  <Button variant="ghost" className="w-full" disabled={saving} onClick={() => next(true)}>
                    Skip for now
                  </Button>
                </section>
              )}

              {step === 3 && (
                <section aria-labelledby="welcome-trial" className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  {membership.loading ? (
                    <Skeleton className="h-40 w-full rounded-2xl" />
                  ) : hasPlan ? (
                    <>
                      <div className="text-center space-y-2">
                        <h1 id="welcome-trial" className="font-heading text-2xl sm:text-3xl font-bold">You're all set</h1>
                        <p className="text-muted-foreground">
                          {membership.isTrialing && membership.trialEndsAt
                            ? `${planLabel} is active until ${formatDay(membership.trialEndsAt)}.`
                            : `You're on ${planLabel}.`}
                        </p>
                      </div>
                      <Card>
                        <CardContent className="p-6 flex items-start gap-3 text-sm">
                          <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <span>
                            Full reviews, the whole podcast library and a fresh SKYNN AI analysis whenever your skin changes.
                          </span>
                        </CardContent>
                      </Card>
                      <Button className="w-full" disabled={finishing} onClick={() => void finish("finished")}>
                        Go to my dashboard
                      </Button>
                    </>
                  ) : membership.trialUsed ? (
                    <>
                      <div className="text-center space-y-2">
                        <h1 id="welcome-trial" className="font-heading text-2xl sm:text-3xl font-bold">You're in</h1>
                        <p className="text-muted-foreground">
                          Your free account keeps your skin profile, Skin Weather and routine. Membership adds full reviews and more.
                        </p>
                      </div>
                      <Button className="w-full" disabled={finishing} onClick={() => void finish("finished")}>
                        Go to my dashboard
                      </Button>
                      <Button asChild variant="ghost" className="w-full">
                        <Link to="/pricing">See membership plans</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <h1 id="welcome-trial" className="font-heading text-2xl sm:text-3xl font-bold">Try {TIER_LABELS.insider} free</h1>
                        <p className="text-muted-foreground">
                          Full product breakdowns, the whole podcast library and unlimited SKYNN AI analyses. No card needed.
                        </p>
                      </div>
                      <Button
                        className="w-full gap-2"
                        disabled={trialLoading}
                        onClick={() => void startTrial({ plan: "insider", source: "welcome", destination: null })}
                      >
                        {trialLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        Start free trial — {trialCtaLabel()}
                      </Button>
                      <Button variant="ghost" className="w-full" disabled={finishing || trialLoading} onClick={() => void finish("skipped")}>
                        Not now — take me to my dashboard
                      </Button>
                    </>
                  )}
                </section>
              )}

              {step < STEPS.length && (
                <p className="mt-8 text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-60"
                    disabled={finishing}
                    onClick={() => void finish("skipped")}
                  >
                    Skip setup
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} returnTo="/welcome" />
    </div>
  );
};

export default Welcome;
