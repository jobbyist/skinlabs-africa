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
import { clearWelcomeInProgress, isWelcomeInProgress, markWelcomeInProgress } from "@/lib/welcomeResume";
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
      // Back from the SKYNN AI analysis started in step 1: carry on at step 2.
      if (isWelcomeInProgress()) {
        clearWelcomeInProgress();
        setStep(2);
      }
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
      <main className="pt-24 pb-20">
        <div className="container mx-auto max-w-6xl px-4">
          {!user ? (
            <div className="mx-auto max-w-md pt-10">
              <Card className="overflow-hidden border-border/80 shadow-[var(--shadow)]">
                <CardContent className="p-6 text-center sm:p-8 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-heading text-xl font-bold">Welcome to SkinLabs</p>
                    <p className="mt-1 text-sm text-muted-foreground">Sign in to finish setting up your account.</p>
                  </div>
                  <Button className="min-h-11 w-full" onClick={() => setAuthOpen(true)}>Sign in</Button>
                </CardContent>
              </Card>
            </div>
          ) : !loaded ? (
            <div className="mx-auto max-w-3xl pt-10 space-y-4" aria-busy="true" aria-label="Loading your account">
              <Skeleton className="mx-auto h-5 w-40" />
              <Skeleton className="mx-auto h-9 w-80" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          ) : (
            <>
              <div className="mx-auto max-w-3xl pb-8 pt-2 text-center">
                <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  SkinLabs setup
                </div>
                <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Make SkinLabs yours.</h1>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-secondary-text sm:text-base">
                  Three quick moves connect your skin profile, your day and the tools you can use next.
                </p>
                <div className="mx-auto mt-6 max-w-2xl">
                  <StepperHeader phase={step} phases={STEPS} />
                </div>
              </div>

              <div className="grid items-start gap-6 lg:grid-cols-[0.82fr_1.18fr]">
                <aside className="rounded-3xl bg-brand-ink p-6 text-brand-ink-foreground sm:p-7 lg:sticky lg:top-24" aria-label="Your SkinLabs setup">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold">A better starting point</p>
                  <h2 className="mt-3 font-heading text-2xl font-bold">Your setup should fit your skin — not the other way around.</h2>
                  <p className="mt-3 text-sm leading-relaxed text-brand-ink-foreground/75">
                    SkinLabs becomes more useful as you add small pieces of context. Nothing here needs to be perfect on day one.
                  </p>

                  <div className="mt-6 space-y-2">
                    {STEPS.map((label, index) => {
                      const stepNumber = index + 1;
                      const active = stepNumber === step;
                      const done = stepNumber < step;
                      return (
                        <div key={label} className={"flex items-center gap-3 rounded-2xl border px-3 py-3 " + (active ? "border-brand-gold/50 bg-brand-ink-foreground/10" : "border-brand-ink-foreground/10 bg-brand-ink-foreground/[0.03]")}>
                          <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold " + (done || active ? "bg-brand-gold text-brand-ink" : "border border-brand-ink-foreground/20 text-brand-ink-foreground/55")}>
                            {done ? "✓" : stepNumber}
                          </span>
                          <div className="min-w-0">
                            <p className={"text-sm font-medium " + (active ? "text-brand-ink-foreground" : "text-brand-ink-foreground/65")}>{label}</p>
                            <p className="mt-0.5 text-[11px] text-brand-ink-foreground/50">
                              {stepNumber === 1 ? "Know your skin" : stepNumber === 2 ? "Shape your day" : "Choose what comes next"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {headline && (
                    <div className="mt-6 rounded-2xl border border-brand-ink-foreground/10 bg-brand-ink-foreground/[0.04] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink-foreground/55">Saved from SKYNN AI</p>
                      <p className="mt-1 font-heading text-lg font-bold">{headline.skinTypeLabel}</p>
                      {headline.concerns.length > 0 && <p className="mt-1 text-xs text-brand-ink-foreground/65">{headline.concerns.slice(0, 2).join(" · ")}</p>}
                    </div>
                  )}

                  <p className="mt-5 text-xs text-brand-ink-foreground/45">No payment is required for setup. You can skip any step.</p>
                </aside>

                <div className="min-w-0">
                  {step === 1 && (
                    <section aria-labelledby="welcome-skin" className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                      {headline ? (
                        <Card className="overflow-hidden border-border/80 shadow-[var(--shadow)]">
                          <CardContent className="p-6 sm:p-8">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">Your skin</span>
                              <span className="text-xs text-muted-foreground">Saved and ready</span>
                            </div>
                            <h2 id="welcome-skin" className="mt-5 font-heading text-2xl font-bold sm:text-3xl">Nice. Your skin profile&apos;s saved.</h2>
                            <p className="mt-2 text-sm text-secondary-text">You’ve already done the hardest part. Here’s the profile SkinLabs will use to personalise what comes next.</p>

                            <div className="mt-6 rounded-2xl bg-muted/45 p-5">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">SKYNN AI skin profile</p>
                              <p className="mt-2 font-heading text-3xl font-bold">{headline.skinTypeLabel}</p>
                              {headline.concerns.length > 0 && (
                                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Top concerns">
                                  {headline.concerns.map((c) => <li key={c} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm">{c}</li>)}
                                </ul>
                              )}
                              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary-text">{headline.guidance}</p>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                              <Button className="min-h-11 flex-1 gap-2" onClick={() => next(false)}>Continue <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
                              <Button variant="ghost" className="min-h-11" onClick={() => next(true)}>Skip for now</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="overflow-hidden border-border/80 shadow-[var(--shadow)]">
                          <CardContent className="p-6 sm:p-8">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Sparkles className="h-5 w-5" aria-hidden="true" /></div>
                            <div className="mt-5 text-center">
                              <h2 id="welcome-skin" className="font-heading text-2xl font-bold sm:text-3xl">Welcome to <span className="gradient-text">SkinLabs</span></h2>
                              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-secondary-text">Start with your skin. Answer a few questions and SKYNN AI builds your skin profile and a routine around it.</p>
                            </div>
                            <Button asChild className="mt-6 min-h-11 w-full gap-2">
                              <Link to="/skynn-ai" onClick={() => { markWelcomeInProgress(); trackConversionEvent("welcome_step_completed", { step: 1, action: "analysis" }); }}><Sparkles className="h-4 w-4" aria-hidden="true" /> Take the 2-minute analysis</Link>
                            </Button>
                            <Button variant="ghost" className="mt-2 min-h-11 w-full" onClick={() => next(true)}>Skip for now</Button>
                          </CardContent>
                        </Card>
                      )}
                    </section>
                  )}

                  {step === 2 && (
                    <section aria-labelledby="welcome-day" className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <Card className="overflow-hidden border-border/80 shadow-[var(--shadow)]">
                        <CardContent className="p-6 sm:p-8">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">Your day</span>
                            <span className="text-xs text-muted-foreground">Local guidance + routine timing</span>
                          </div>
                          <h2 id="welcome-day" className="mt-5 font-heading text-2xl font-bold sm:text-3xl">Make daily guidance feel local.</h2>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-text">Tell SkinLabs roughly where you are and when you actually do your routine. We’ll use that to make daily guidance feel more relevant.</p>

                          <div className="mt-6 space-y-5">
                            <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
                              <div className="space-y-2">
                                <Label htmlFor="welcome-city">Your city</Label>
                                <div className="flex gap-2">
                                  <Select value={cityKey} onValueChange={setCityKey}>
                                    <SelectTrigger id="welcome-city" className="min-h-11 flex-1"><SelectValue placeholder="Choose your city" /></SelectTrigger>
                                    <SelectContent>{SA_CITIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                                  </Select>
                                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={locateMe} aria-label="Use my location (rounded to the nearest city)">
                                    <LocateFixed className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Your location stays on your device; we only save the city.</p>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
                              <div className="space-y-2">
                                <Label htmlFor="welcome-routine-time">When do you do your routine?</Label>
                                <Select value={routineTime} onValueChange={(v) => setRoutineTime(v as RoutineTime)}>
                                  <SelectTrigger id="welcome-routine-time" className="min-h-11"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="am">Mornings</SelectItem>
                                    <SelectItem value="pm">Evenings</SelectItem>
                                    <SelectItem value="both">Morning and evening</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Button className="min-h-11 flex-1 gap-2" disabled={saving} onClick={() => void saveDay()}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Save and continue <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
                            <Button variant="ghost" className="min-h-11" disabled={saving} onClick={() => next(true)}>Skip for now</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  )}

                  {step === 3 && (
                    <section aria-labelledby="welcome-trial" className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                      {membership.loading ? (
                        <Skeleton className="h-72 w-full rounded-3xl" />
                      ) : hasPlan ? (
                        <Card className="overflow-hidden border-border/80 shadow-[var(--shadow)]">
                          <CardContent className="p-6 sm:p-8">
                            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">Your membership</span>
                            <h2 id="welcome-trial" className="mt-5 font-heading text-2xl font-bold sm:text-3xl">You&apos;re all set.</h2>
                            <p className="mt-2 text-sm leading-relaxed text-secondary-text">{membership.isTrialing && membership.trialEndsAt ? `${planLabel} is active until ${formatDay(membership.trialEndsAt)}.` : `You’re on ${planLabel}.`}</p>
                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                              {["Full reviews", "Podcast library", "Skin-aware guidance"].map((item) => <div key={item} className="rounded-2xl border border-border bg-muted/35 p-4 text-sm font-medium">{item}</div>)}
                            </div>
                            <Button className="mt-6 min-h-11 w-full" disabled={finishing} onClick={() => void finish("finished")}>Go to my dashboard</Button>
                          </CardContent>
                        </Card>
                      ) : membership.trialUsed ? (
                        <Card className="overflow-hidden border-border/80 shadow-[var(--shadow)]">
                          <CardContent className="p-6 sm:p-8">
                            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">Free account</span>
                            <h2 id="welcome-trial" className="mt-5 font-heading text-2xl font-bold sm:text-3xl">You’re in.</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-text">Your free account keeps your skin profile, Skin Weather and routine. Membership adds full reviews and more when you’re ready.</p>
                            <Button className="mt-6 min-h-11 w-full" disabled={finishing} onClick={() => void finish("finished")}>Go to my dashboard</Button>
                            <Button asChild variant="ghost" className="mt-2 min-h-11 w-full"><Link to="/pricing">See membership plans</Link></Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="overflow-hidden border-border/80 shadow-[var(--shadow)]">
                          <CardContent className="p-6 sm:p-8">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Recommended next step</span>
                            <h2 id="welcome-trial" className="mt-5 font-heading text-2xl font-bold sm:text-3xl">Try {TIER_LABELS.insider} free.</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-text">Full product breakdowns, the whole podcast library and unlimited SKYNN AI analyses. No card needed.</p>
                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                              {["Full product breakdowns", "The whole podcast library", "Unlimited SKYNN AI analyses"].map((item) => <div key={item} className="rounded-2xl border border-border bg-muted/35 p-4 text-sm font-medium">{item}</div>)}
                            </div>
                            <Button className="mt-6 min-h-11 w-full gap-2" disabled={trialLoading} onClick={() => void startTrial({ plan: "insider", source: "welcome", destination: null })}>{trialLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Start free trial — {trialCtaLabel()} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
                            <Button variant="ghost" className="mt-2 min-h-11 w-full" disabled={finishing || trialLoading} onClick={() => void finish("skipped")}>Not now — take me to my dashboard</Button>
                          </CardContent>
                        </Card>
                      )}
                    </section>
                  )}
                </div>
              </div>

              <div className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted-foreground">
                You can finish setup later. Your choices are saved to your account and can be changed from Settings.
              </div>
              {step < STEPS.length && (
                <p className="mt-5 text-center">
                  <button type="button" className="min-h-11 rounded-full px-3 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-60" disabled={finishing} onClick={() => void finish("skipped")}>
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
