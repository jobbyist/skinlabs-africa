import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ChevronRight,
  Loader2,
  Camera,
  Upload,
  X,
  ArrowLeft,
  ImageIcon,
  Shield,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
  AlertTriangle,
  Share2,
  Lock,
  Layers,
  BarChart3,
  Sun,
  Moon,
  CalendarClock,
  ShoppingBag,
  FlaskConical,
  Info,
  UserRound,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadSkincarePdf } from "@/lib/generateSkincarePdf";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import UpgradePrompt from "@/components/UpgradePrompt";
import AuthDialog from "@/components/AuthDialog";
import StepperHeader from "@/components/ai-formulator/StepperHeader";
import MstGrid from "@/components/ai-formulator/MstGrid";
import ConfidencePanel from "@/components/ai-formulator/ConfidencePanel";
import { MST_SCALE } from "@/data/mstScale";
import { QUESTIONS } from "@/data/quiz";
import {
  buildPredeterminedRecommendation,
  computeCompleteness,
  CONCERN_BY_Q9_VALUE,
  type CompletenessBreakdown,
} from "@/data/formulaResults";
import { pickGroundedRoutine, type GroundedRoutine } from "@/lib/skynnProductMatch";
import { logFairnessEvent } from "@/lib/skynnFairness";
import { trackConversionEvent } from "@/lib/analytics-events";
import { getPersistedPricingVariant } from "@/lib/pricing-config";

const TOTAL_QUESTIONS = QUESTIONS.length;

// Funnel: Intro -> Consent -> Photo -> MST -> Quiz questions -> Analysis -> Results.
// Anonymous visitors can reach Results without ever creating an account — "save my
// results" (account creation) only ever appears AFTER results are shown, as an
// optional upgrade path, never a gate in front of the analysis itself.
const STEP_INTRO = 0;
const STEP_CONSENT = 1;
const STEP_PHOTO = 2;
const STEP_MST = 3;
const FIRST_QUESTION_STEP = 4;
const LAST_QUESTION_STEP = TOTAL_QUESTIONS + 3;
const STEP_ANALYSIS = TOTAL_QUESTIONS + 4;
const STEP_RESULTS = TOTAL_QUESTIONS + 5;

/** Which of the 4 SKYNN AI (beta) stepper phases a given step belongs to. */
const stepPhase = (step: number): 1 | 2 | 3 | 4 => {
  if (step <= STEP_CONSENT) return 1;
  if (step === STEP_PHOTO) return 2;
  if (step >= STEP_MST && step <= LAST_QUESTION_STEP) return 3;
  return 4;
};

const AIFormulator = () => {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { isMember } = useMembership();
  const [step, setStep] = useState(STEP_INTRO);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [skinImage, setSkinImage] = useState<string | null>(null);
  const [mstTone, setMstTone] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [allowanceExhausted, setAllowanceExhausted] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [resultTier, setResultTier] = useState<"free" | "premium">("free");
  const [completeness, setCompleteness] = useState<CompletenessBreakdown | null>(null);
  const [groundedRoutine, setGroundedRoutine] = useState<GroundedRoutine | null>(null);
  const [resultsSaved, setResultsSaved] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentMst, setConsentMst] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const savingResultsRef = useRef(false);
  const viewedFiredRef = useRef(false);

  const derivedSkinType = (() => {
    const q1 = answers["q1"];
    if (q1 === 0) return "oily";
    if (q1 === 1) return "combination";
    if (q1 === 2) return "normal";
    if (q1 === 3) return "dry";
    return "normal";
  })();

  /** Reactive/compromised-barrier signal (q6, q19) reused to steer product matching toward gentler picks. */
  const isSensitiveProfile = (answers["q6"] !== undefined && answers["q6"] <= 1) || (answers["q19"] !== undefined && answers["q19"] <= 1);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("That image is over 5MB — try a smaller one");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("That doesn't look like an image file — try again");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSkinImage(reader.result as string);
        toast.success("Photo uploaded");
      };
      reader.onerror = () => toast.error("Couldn't read that image file — try again");
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSkinImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  /** Live, dermatology-grounded path for paying/trialing members. Returns success. */
  const runLiveAnalysis = async (): Promise<boolean> => {
    const { data: quotaAllowed, error: quotaError } = await supabase.rpc("register_ai_analysis_use");
    if (quotaError) {
      setAnalysisError("Couldn't check your analysis quota — please try again.");
      return false;
    }
    if (quotaAllowed === false) {
      setAnalysisError("You've used this week's AI analysis — your next one unlocks in a few days.");
      return false;
    }

    const quizAnswers = QUESTIONS.map((q) => ({
      question: q.title,
      answer: q.options.find((o) => o.value === answers[q.id])?.label ?? "Not answered",
    }));

    const { data, error } = await supabase.functions.invoke("skincare-ai", {
      body: {
        quizAnswers,
        skinImage: skinImage && photoConsent ? skinImage : null,
        mstTone,
        contactName: contactName || user?.email?.split("@")[0] || "",
        contactEmail: contactEmail || user?.email || "",
      },
    });

    if (error) {
      setAnalysisError("Couldn't generate your recommendation — please try again.");
      return false;
    }
    if (data?.error) {
      setAnalysisError(data.error);
      return false;
    }

    setRecommendation(data.recommendation);
    setResultTier(data.tier === "premium" ? "premium" : "free");
    trackConversionEvent("analysis_generated", { resultTier: data.tier || "premium" });

    try {
      downloadSkincarePdf({
        clientName: contactName || user?.email?.split("@")[0] || "Client",
        email: contactEmail || user?.email || "",
        recommendation: data.recommendation,
        skinType: derivedSkinType,
        mstTone,
      });
      toast.success("Your skincare PDF is downloaded");
    } catch {
      toast.message("Your report is ready — PDF download didn't work this time, but your results are below.");
    }
    return true;
  };

  /**
   * Free/anonymous path: an instant, deterministic "starter analysis" built from the
   * quiz answers alone — no Supabase call, no account, no AI quota spent. The brief
   * artificial delay keeps the experience consistent with the live AI path rather
   * than feeling suspiciously instant. This is a genuinely complete analysis (AM/PM
   * routine, actives schedule, product types — grounded in SkinLabs' real reviewed
   * catalogue where a match exists) — not a crippled teaser — so nothing about it is
   * hidden behind a paywall; the upgrade pitch afterward is a live, weekly-refreshed,
   * photo-aware report, not "the rest of this same result."
   */
  const runStarterAnalysis = async (): Promise<boolean> => {
    // Anonymous visitors are never metered here (there's no account to meter
    // against, and the top of funnel should stay frictionless). A signed-in
    // free/Glow Lite account gets a configurable free allowance, then can
    // spend a purchased AI-analysis credit — claim_starter_analysis() is the
    // single, server-side source of truth for both, so this can't be
    // bypassed by a stale or tampered client state.
    if (user) {
      const { data, error } = await supabase.rpc("claim_starter_analysis", {
        p_variant_key: getPersistedPricingVariant(),
      });
      const result = Array.isArray(data) ? data[0] : data;
      if (error) {
        setAnalysisError("Couldn't check your analysis allowance — please try again.");
        return false;
      }
      if (!result?.allowed) {
        setAllowanceExhausted(true);
        return false;
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const concern = CONCERN_BY_Q9_VALUE[answers["q9"]] ?? "sensitivity";
    const routine = pickGroundedRoutine(derivedSkinType, concern, { sensitive: isSensitiveProfile, mstTone });
    const breakdown = computeCompleteness({
      answeredCount: Object.keys(answers).length,
      totalQuestions: TOTAL_QUESTIONS,
      hasPhoto: Boolean(skinImage),
      hasMstTone: mstTone !== null,
    });
    const text = buildPredeterminedRecommendation(derivedSkinType, concern, answers, { mstTone, groundedRoutine: routine });
    setRecommendation(text);
    setResultTier("free");
    setGroundedRoutine(routine);
    setCompleteness(breakdown);
    trackConversionEvent("analysis_generated", { resultTier: "free" });
    void logFairnessEvent({
      source: "starter",
      resultTier: "free",
      skinType: derivedSkinType,
      mstTone,
      hadPhoto: Boolean(skinImage),
      completenessScore: breakdown.overall,
      groundedMatchCount: routine.matchStats.matched,
      groundedMatchAttempted: routine.matchStats.attempted,
    });
    try {
      downloadSkincarePdf({
        clientName: contactName || "Client",
        email: contactEmail,
        recommendation: text,
        skinType: derivedSkinType,
        mstTone,
      });
      toast.success("Your starter skincare PDF is downloaded");
    } catch {
      toast.message("Your analysis is ready — PDF download didn't work this time, but your results are below.");
    }
    return true;
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    setAnalysisError(null);
    setAllowanceExhausted(false);
    try {
      const ok = isMember ? await runLiveAnalysis() : await runStarterAnalysis();
      if (ok) setStep(STEP_RESULTS);
    } catch {
      setAnalysisError("Something went wrong on our end — please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Kick off generation the moment the visitor reaches the Analysis step.
  useEffect(() => {
    if (step === STEP_ANALYSIS) void runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === STEP_ANALYSIS && allowanceExhausted) {
      trackConversionEvent("upgrade_viewed", { feature: "ai_analysis.starter_allowance", accountState: "free" });
    }
  }, [step, allowanceExhausted]);

  // Fire the "viewed" funnel event once per completed analysis, separate from
  // "generated" (the data existing) — this is the moment a person actually saw it.
  useEffect(() => {
    if (step === STEP_RESULTS && recommendation && !viewedFiredRef.current) {
      viewedFiredRef.current = true;
      trackConversionEvent("analysis_viewed", { resultTier });
    }
  }, [step, recommendation, resultTier]);

  // Save the result to the account the moment one exists — whether the visitor was
  // already signed in, or just created/logged into an account from the results
  // screen below. The live-AI path already persists server-side (skincare-ai), so
  // only the free/starter path needs a client-side insert here to avoid a duplicate.
  useEffect(() => {
    if (step !== STEP_RESULTS || !recommendation || !user || resultsSaved || savingResultsRef.current) return;
    savingResultsRef.current = true;
    (async () => {
      if (resultTier === "free") {
        try {
          await supabase.from("skincare_recommendations").insert({
            user_id: user.id,
            skin_type: derivedSkinType,
            concerns: [CONCERN_BY_Q9_VALUE[answers["q9"]] ?? "sensitivity"],
            recommendation,
            contact_name: contactName || null,
            contact_whatsapp: contactWhatsApp || null,
            status: "delivered",
            mst_tone: mstTone,
            mst_source: mstTone !== null ? "user_reported" : null,
            analysis_completeness: completeness?.overall ?? null,
          });
        } catch {
          // Non-fatal — the visitor still has their downloaded PDF and on-screen result.
        }
      }
      setResultsSaved(true);
      trackConversionEvent("results_saved", { resultTier });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, recommendation, user, resultsSaved, resultTier]);

  const handleStartAnalysis = () => {
    trackConversionEvent("analysis_started");
    setStep(STEP_CONSENT);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    if (authMode === "signup") trackConversionEvent("signup_started", { source: "ai_formulator_results" });
    const { error } =
      authMode === "signup" ? await signUp(contactEmail, authPassword) : await signIn(contactEmail, authPassword);
    setIsAuthSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (authMode === "signup") trackConversionEvent("signup_completed", { source: "ai_formulator_results" });
    toast.success(authMode === "signup" ? "Account created — saving your results..." : "Welcome back.");
  };

  const handleShareResults = async () => {
    const shareText = `I just got a free AI skin analysis from SKYNN AI on SkinLabs — my skin type is ${derivedSkinType}. Get yours free:`;
    const shareUrl = "https://skinlabs.co.za/skynn-ai";
    try {
      if (navigator.share) {
        await navigator.share({ title: "My SKYNN AI skin analysis", text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast.success("Copied — paste it anywhere");
      }
    } catch {
      // Visitor cancelled the native share sheet — not an error.
    }
  };

  const handleNext = () => {
    if (step === STEP_CONSENT) {
      trackConversionEvent("consent_completed");
      setStep(STEP_PHOTO);
      return;
    }
    if (step === STEP_PHOTO) {
      setStep(STEP_MST);
      return;
    }
    if (step === STEP_MST) {
      setStep(FIRST_QUESTION_STEP);
      return;
    }
    if (step === LAST_QUESTION_STEP) {
      trackConversionEvent("profile_completed");
      setStep(STEP_ANALYSIS);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const resetFormulator = () => {
    setStep(STEP_INTRO);
    setAnswers({});
    setSkinImage(null);
    setMstTone(null);
    setAnalysisError(null);
    setRecommendation(null);
    setCompleteness(null);
    setGroundedRoutine(null);
    setResultsSaved(false);
    setConsentData(false);
    setConsentMst(false);
    setConsentTerms(false);
    setPhotoConsent(false);
    setContactName("");
    setContactEmail("");
    setContactWhatsApp("");
    setAuthPassword("");
    savingResultsRef.current = false;
    viewedFiredRef.current = false;
  };

  const currentQuestion =
    step >= FIRST_QUESTION_STEP && step <= LAST_QUESTION_STEP ? QUESTIONS[step - FIRST_QUESTION_STEP] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const questionNumber = step - FIRST_QUESTION_STEP + 1;
  const progress = currentQuestion ? (questionNumber / TOTAL_QUESTIONS) * 100 : 0;

  if (authLoading) {
    return (
      <section id="skynn-ai" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  // Renders inline **bold** markers within a line (e.g. "your skin reads as **oily**")
  // as real <strong> emphasis instead of showing the literal asterisks.
  const renderInlineBold = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="text-card-foreground">{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  const formatRecommendation = (text: string) => {
    return text.split("\n").map((line, index) => {
      if (line.startsWith("##") || (line.startsWith("**") && line.endsWith("**") && line.split("**").length === 3)) {
        return (
          <h4 key={index} className="font-semibold text-card-foreground mt-4 mb-2 text-lg">
            {line.replace(/[#*]/g, "").trim()}
          </h4>
        );
      }
      if (line.trim().startsWith("-") || line.trim().match(/^\d+\./)) {
        return (
          <p key={index} className="text-muted-foreground ml-4 mb-1 flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{renderInlineBold(line.trim().replace(/^[-\d.]+\s*/, ""))}</span>
          </p>
        );
      }
      if (line.trim()) {
        return (
          <p key={index} className="text-muted-foreground mb-2">{renderInlineBold(line)}</p>
        );
      }
      return null;
    });
  };

  /** Icon shown on each recommendation section card, inferred from its heading text. */
  const sectionIcon = (heading: string) => {
    const h = heading.toLowerCase();
    if (h.includes("am ") || h.includes("morning")) return Sun;
    if (h.includes("pm ") || h.includes("evening")) return Moon;
    if (h.includes("weekly") || h.includes("actives schedule")) return CalendarClock;
    if (h.includes("product")) return ShoppingBag;
    if (h.includes("ingredient")) return FlaskConical;
    if (h.includes("note")) return Info;
    if (h.includes("profile")) return UserRound;
    if (h.includes("lifestyle") || h.includes("environment")) return Leaf;
    if (h.includes("important") || h.includes("practitioner")) return AlertTriangle;
    return Sparkles;
  };

  /** Splits the markdown-ish recommendation into `##`-delimited sections, each rendered as its own card. */
  const recommendationSections = (text: string) => {
    const blocks = text.split(/\n(?=##\s)/);
    return blocks
      .map((block) => {
        const lines = block.split("\n");
        const headingLine = lines[0];
        if (!headingLine.startsWith("##")) return { heading: null as string | null, body: block };
        return { heading: headingLine.replace(/^##\s*/, "").replace(/\*\*/g, "").trim(), body: lines.slice(1).join("\n") };
      })
      .filter((s) => s.heading || s.body.trim());
  };

  const footerVisible = step >= STEP_CONSENT && step <= LAST_QUESTION_STEP;
  const footerDisabled =
    (step === STEP_CONSENT && !(consentData && consentMst && consentTerms)) ||
    (currentQuestion !== null && currentAnswer === undefined) ||
    (step === STEP_PHOTO && skinImage !== null && !photoConsent);
  const footerLabel =
    step === LAST_QUESTION_STEP ? "See My Results" : step === STEP_PHOTO && !skinImage ? "Skip photo" : "Continue";

  const mstSwatch = mstTone !== null ? MST_SCALE.find((s) => s.level === mstTone) : null;

  return (
    <>
      <section id="skynn-ai" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {step !== STEP_INTRO && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
                  <Sparkles className="h-4 w-4" />
                  SKYNN AI <span className="text-muted-foreground font-normal">(beta)</span> · by SkinLabs®
                </div>
                {step !== STEP_RESULTS && !isMember && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-full text-xs font-medium mb-3">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">
                      Free Starter Analysis, no card required, no account required •
                      <a href="/pricing" className="text-primary hover:underline ml-1">Upgrade for a live, weekly AI Dermatology Report</a>
                    </span>
                  </div>
                )}
              </div>
            )}

            <div
              className={cn(
                "rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden",
                step === STEP_INTRO ? "bg-foreground text-background border border-transparent" : "bg-card border border-border",
              )}
            >
              {step === STEP_INTRO && (
                <>
                  <div className="absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-background/10 blur-3xl pointer-events-none" />
                  <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-background/5 blur-3xl pointer-events-none" />
                </>
              )}

              {currentQuestion && (
                <div className="mb-8">
                  <StepperHeader phase={stepPhase(step)} />
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Question {questionNumber} of {TOTAL_QUESTIONS}</span>
                    <span className="text-primary font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              {(step === STEP_CONSENT || step === STEP_PHOTO || step === STEP_MST) && <StepperHeader phase={stepPhase(step)} />}

              {step === STEP_INTRO && (
                <div className="relative space-y-8 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-heading font-bold tracking-tight">
                      SKYNN AI <span className="font-normal text-background/60">(beta)</span>
                    </span>
                    <span className="text-background/60 font-medium">SkinLabs®</span>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl md:text-4xl font-heading font-bold leading-tight">
                      Your skin.
                      <br />
                      Smarter care.
                    </h3>
                    <p className="text-background/70 max-w-md">
                      AI-powered skin assessment and personalised routine formulation, built for every skin tone.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { icon: BarChart3, label: "Advanced skin analysis" },
                      { icon: Layers, label: "Personalised routines" },
                      { icon: ShieldCheck, label: "Dermatologist reviewed" },
                      { icon: Lock, label: "Privacy-first" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-background/70 shrink-0" />
                        <span className="text-sm text-background/90">{label}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="lg"
                    onClick={handleStartAnalysis}
                    className="w-full gap-2 bg-background text-foreground hover:bg-background/90"
                  >
                    Get started
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {!user && (
                    <button
                      type="button"
                      onClick={() => setSignInDialogOpen(true)}
                      className="block w-full text-center text-xs text-background/60 hover:text-background/90"
                    >
                      Already have an account? Sign in
                    </button>
                  )}
                </div>
              )}

              {step === STEP_CONSENT && (
                <div className="space-y-6 py-2">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-heading font-bold text-card-foreground">
                      Your consent &amp; privacy
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      To give you the best experience, we need your consent to collect and use certain information —
                      including images, skin tone (for fairness testing), and your responses.
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Important Disclaimer
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SKYNN AI (beta) provides general skincare guidance and is <strong>not medical advice, diagnosis or
                      treatment</strong>. For medical skin conditions, rashes or persistent concerns, please consult a
                      licensed dermatologist or HPCSA-registered practitioner.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                      <Checkbox id="consent-data" checked={consentData} onCheckedChange={(c) => setConsentData(c === true)} className="mt-0.5" />
                      <Label htmlFor="consent-data" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                        I agree to the collection and processing of my data for the purpose of skin analysis and routine
                        formulation, in accordance with POPIA. My data will not be sold or shared with third parties.
                      </Label>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                      <Checkbox id="consent-mst" checked={consentMst} onCheckedChange={(c) => setConsentMst(c === true)} className="mt-0.5" />
                      <Label htmlFor="consent-mst" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                        I understand that my skin tone (MST) — if I choose to share it — is used for fairness and
                        inclusion testing, not as a diagnosis.
                      </Label>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                      <Checkbox id="consent-terms" checked={consentTerms} onCheckedChange={(c) => setConsentTerms(c === true)} className="mt-0.5" />
                      <Label htmlFor="consent-terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                        I agree to the <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a> and{" "}
                        <a href="/terms" className="text-primary hover:underline">Terms of Service</a>, and understand SKYNN AI
                        (beta) does not replace professional medical care.
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {step === STEP_PHOTO && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Add a photo
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Upload a clear, well-lit photo of your face (optional, but improves accuracy). No filters, no sunglasses.
                    </p>
                  </div>
                  {!skinImage ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <button type="button" onClick={() => cameraInputRef.current?.click()} className="h-36 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all">
                          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center"><Camera className="h-7 w-7 text-primary" /></div>
                          <span className="font-medium text-card-foreground">Take Photo</span>
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="h-36 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all">
                          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center"><Upload className="h-7 w-7 text-primary" /></div>
                          <span className="font-medium text-card-foreground">Upload Image</span>
                        </button>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-4">
                        <p className="text-xs font-medium text-card-foreground mb-2">Image quality tips</p>
                        <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                          {[
                            "Good natural lighting",
                            "Face centred and in focus",
                            "No sunglasses or hats",
                            "Avoid heavy filters",
                          ].map((tip) => (
                            <li key={tip} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border-2 border-primary">
                      <img src={skinImage} alt="Skin preview" className="w-full h-52 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-primary-foreground">
                        <ImageIcon className="h-4 w-4" /><span className="text-sm font-medium">Photo uploaded</span>
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={removeImage} className="absolute top-3 right-3"><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {skinImage && (
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                      <Checkbox id="photo-consent" checked={photoConsent} onCheckedChange={(checked) => setPhotoConsent(checked === true)} className="mt-0.5" />
                      <Label htmlFor="photo-consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                        I consent to my photo being analysed by AI for skincare assessment purposes only.
                        Photos are processed securely and deleted within 30 days. You can request deletion at any time.
                      </Label>
                    </div>
                  )}
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleImageUpload} className="hidden" />
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              )}

              {step === STEP_MST && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Monk Skin Tone (MST)
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Which skin tone most closely represents you? This helps us test and improve AI performance
                      across different skin tones — it does not determine your diagnosis or recommendations.
                    </p>
                  </div>
                  <MstGrid value={mstTone} onChange={setMstTone} />
                  <div className="rounded-lg bg-muted/40 p-4 flex gap-3">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-card-foreground mb-1">Why we ask</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        We ask about your Monk Skin Tone (MST) to test and improve AI performance across different skin
                        tones. It helps us make sure SKYNN AI works well for everyone — across all skin tones. This
                        information does not determine your diagnosis or recommendations, and sharing it is optional.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentQuestion && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground">{currentQuestion.title}</h3>
                  </div>
                  <RadioGroup
                    value={currentAnswer !== undefined ? String(currentAnswer) : ""}
                    onValueChange={(val) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: Number(val) }))}
                    className="grid gap-3"
                  >
                    {currentQuestion.options.map((option, idx) => (
                      <div key={idx}>
                        <RadioGroupItem value={String(option.value)} id={`${currentQuestion.id}-${option.value}`} className="peer sr-only" />
                        <Label
                          htmlFor={`${currentQuestion.id}-${option.value}`}
                          className="flex items-center gap-4 p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all"
                        >
                          <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-card-foreground">{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {step === STEP_ANALYSIS && (
                <div className="text-center py-12">
                  {isLoading ? (
                    <>
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      </div>
                      <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">Running SKYNN AI analysis...</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">Building a routine around your actual answers — this takes a few seconds</p>
                    </>
                  ) : allowanceExhausted ? (
                    <>
                      <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">You've used your free analysis</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Buy a few more analyses, or upgrade for a live AI report re-analysed every week.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild className="gap-2">
                          <a href="/pricing">
                            <Sparkles className="h-4 w-4" />
                            Buy more analyses
                          </a>
                        </Button>
                        <Button variant="outline" asChild>
                          <a href="/pricing">See membership plans</a>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                      </div>
                      <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">We couldn't generate your analysis</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">{analysisError}</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => void runAnalysis()} className="gap-2">
                          <Sparkles className="h-4 w-4" />
                          Try again
                        </Button>
                        <Button variant="outline" onClick={() => setStep(STEP_PHOTO)} className="gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === STEP_RESULTS && recommendation && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      {isMember ? "Your Personalized Skincare Routine" : "Your Free Starter Analysis"}
                    </h3>
                    <p className="text-muted-foreground">
                      {isMember
                        ? `Customized for your ${derivedSkinType} skin`
                        : `Built for your ${derivedSkinType} skin from your actual answers`}
                    </p>
                  </div>

                  {/* Analysis Summary strip */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {skinImage && (
                      <img src={skinImage} alt="Your uploaded skin photo" className="h-14 w-14 rounded-full object-cover border border-border" />
                    )}
                    <span className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium capitalize">
                      {derivedSkinType} skin
                    </span>
                    {mstSwatch && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                        <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: mstSwatch.hex }} />
                        MST {mstSwatch.level}
                      </span>
                    )}
                    {completeness && (
                      <span className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                        {completeness.overall}% complete profile
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_280px] items-start">
                    <div className="space-y-4">
                      {recommendationSections(recommendation).map((section, idx) => {
                        const Icon = section.heading ? sectionIcon(section.heading) : Sparkles;
                        return (
                          <div key={idx} className="rounded-xl border border-border bg-secondary/20 p-5">
                            {section.heading && (
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-4 w-4 text-primary shrink-0" />
                                <h4 className="font-heading font-semibold text-card-foreground">{section.heading}</h4>
                              </div>
                            )}
                            <div>{formatRecommendation(section.body)}</div>
                          </div>
                        );
                      })}
                    </div>
                    {completeness && (
                      <div className="lg:sticky lg:top-4">
                        <ConfidencePanel
                          completeness={completeness}
                          limitations={[
                            "May be less accurate in low light or with an unclear photo.",
                            "Some conditions can look different across skin tones — MST helps us test for this.",
                            "Not a substitute for professional medical advice.",
                          ]}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" onClick={handleShareResults} className="gap-2 text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                      Share my skin type
                    </Button>
                  </div>

                  {!user ? (
                    <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        <h4 className="font-heading font-semibold text-card-foreground">Save your results</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create a free account to keep this analysis and track how your skin changes over time. No card required.
                      </p>
                      <form onSubmit={handleSaveResults} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                        <div>
                          <Label htmlFor="save-email" className="sr-only">Email</Label>
                          <Input
                            id="save-email"
                            type="email"
                            placeholder="Email address"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            autoComplete="email"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="save-password" className="sr-only">Password</Label>
                          <Input
                            id="save-password"
                            type="password"
                            placeholder={authMode === "signup" ? "Set a password" : "Password"}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                            minLength={authMode === "signup" ? 8 : undefined}
                            required
                          />
                        </div>
                        <Button type="submit" disabled={isAuthSubmitting} className="gap-2">
                          {isAuthSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                          {authMode === "signup" ? "Save results" : "Log in"}
                        </Button>
                      </form>
                      <button
                        type="button"
                        onClick={() => setAuthMode((m) => (m === "signup" ? "signin" : "signup"))}
                        className="text-xs text-primary hover:underline"
                      >
                        {authMode === "signup" ? "Already have an account? Log in instead" : "New here? Create a free account instead"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      {resultsSaved ? "Saved to your account" : "Saving to your account..."}
                    </div>
                  )}

                  <UpgradePrompt
                    feature="ai_analysis.live_weekly"
                    headline="Want a live AI report analysed from your exact photo?"
                    body="Glow Insider and VIP get a dermatology-grounded report re-analysed weekly as your skin changes — not just this one-time starter match."
                  />

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button size="lg" className="gap-2" asChild><a href="/reviews">See Recommended Products <ChevronRight className="h-4 w-4" /></a></Button>
                    <Button variant="outline" size="lg" onClick={resetFormulator}>Start Over</Button>
                  </div>
                </div>
              )}

              {footerVisible && (
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <Button variant="ghost" onClick={handleBack} className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
                  <Button onClick={handleNext} disabled={footerDisabled} className="gap-2 px-6">
                    {footerLabel}<ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <AuthDialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen} defaultTab="signin" />
    </>
  );
};

export default AIFormulator;
