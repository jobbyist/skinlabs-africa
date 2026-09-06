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
  CheckCircle2,
  Mail,
  Calendar,
  Download,
  UserPlus,
} from "lucide-react";
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
import GatedOverlay from "@/components/GatedOverlay";
import { QUESTIONS } from "@/data/quiz";
import { buildPredeterminedRecommendation, CONCERN_BY_Q9_VALUE } from "@/data/formulaResults";
import { trackConversionEvent } from "@/lib/analytics-events";

const TOTAL_QUESTIONS = QUESTIONS.length;
const STEP_PHOTO = TOTAL_QUESTIONS + 1;
const STEP_EMAIL = TOTAL_QUESTIONS + 2;
const STEP_AUTH = TOTAL_QUESTIONS + 3;
const STEP_RESULTS = TOTAL_QUESTIONS + 4;

const AIFormulator = () => {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { isMember } = useMembership();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [skinImage, setSkinImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [resultTier, setResultTier] = useState<"free" | "premium">("free");
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [bookConsultation, setBookConsultation] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // The quiz itself never requires an account — only revealing results does. Once an
  // unauthenticated visitor signs up/logs in from the inline STEP_AUTH screen, `user`
  // flips truthy and this carries them straight into their results (free starter
  // analysis, or the live AI report if they're already a paying member).
  useEffect(() => {
    if (step === STEP_AUTH && user) {
      proceedToResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user]);

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

  // Only ever called for signed-in paying members — free/unauthenticated visitors get
  // the instant predetermined starter analysis via showPredeterminedResults() instead,
  // so this quota only ever gates the live, paid AI report.
  const getAIRecommendation = async () => {
    setIsLoading(true);
    try {
      const { data: quotaAllowed, error: quotaError } = await supabase.rpc("register_ai_analysis_use");
      if (quotaError) {
        toast.error("Couldn't check your analysis quota — please try again.");
        return;
      }
      if (quotaAllowed === false) {
        toast.error("You've used this week's AI analysis — your next one unlocks in a few days.");
        return;
      }

      const quizAnswers = QUESTIONS.map((q) => ({
        question: q.title,
        answer: q.options.find((o) => o.value === answers[q.id])?.label ?? "Not answered",
      }));

      const { data, error } = await supabase.functions.invoke("skincare-ai", {
        body: {
          quizAnswers,
          skinImage: skinImage && photoConsent ? skinImage : null,
          contactName,
          contactEmail,
        },
      });

      if (error) {
        console.error("Error calling skincare-ai:", error);
        toast.error("Couldn't generate your recommendation — please try again.");
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setRecommendation(data.recommendation);
      setResultTier(data.tier || (isMember ? "premium" : "free"));
      trackConversionEvent("analysis_view", { resultTier: data.tier || "premium" });

      try {
        downloadSkincarePdf({
          clientName: contactName || "Client",
          email: contactEmail,
          recommendation: data.recommendation,
          skinType: derivedSkinType,
        });
        toast.success("Your skincare PDF is downloaded");
      } catch (pdfErr) {
        console.warn("PDF generation failed:", pdfErr);
      }

      setStep(STEP_RESULTS);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong on our end — please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Free/explorer path: an instant, deterministic "starter analysis" built from the
   * quiz answers alone — no Supabase call, no AI quota spent. The brief artificial
   * delay keeps the experience consistent with the live AI path rather than feeling
   * suspiciously instant. The advanced section stays gated (see STEP_RESULTS below),
   * which is the upsell to the live, weekly-refreshed AI report for paid members.
   */
  const showPredeterminedResults = () => {
    setIsLoading(true);
    window.setTimeout(() => {
      const concern = CONCERN_BY_Q9_VALUE[answers["q9"]] ?? "sensitivity";
      const text = buildPredeterminedRecommendation(derivedSkinType, concern, answers);
      setRecommendation(text);
      setResultTier("free");
      trackConversionEvent("analysis_view", { resultTier: "free" });
      try {
        downloadSkincarePdf({
          clientName: contactName || "Client",
          email: contactEmail,
          recommendation: text,
          skinType: derivedSkinType,
        });
        toast.success("Your starter skincare PDF is downloaded");
      } catch (pdfErr) {
        console.warn("PDF generation failed:", pdfErr);
      }
      setIsLoading(false);
      setStep(STEP_RESULTS);
    }, 900);
  };

  const proceedToResults = () => {
    trackConversionEvent("quiz_complete", { isMember });
    if (isMember) {
      getAIRecommendation();
    } else {
      showPredeterminedResults();
    }
  };

  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    const { error } = authMode === "signup" ? await signUp(contactEmail, authPassword) : await signIn(contactEmail, authPassword);
    setIsAuthSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(authMode === "signup" ? "You're in — building your results now." : "Welcome back.");
    // Advancing to results happens automatically via the effect above once `user` updates.
  };

  const handleNext = () => {
    if (step === STEP_EMAIL) {
      if (!user) {
        setStep(STEP_AUTH);
      } else {
        proceedToResults();
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const resetFormulator = () => {
    setStep(0);
    setAnswers({});
    setSkinImage(null);
    setRecommendation(null);
    setPopiaConsent(false);
    setPhotoConsent(false);
    setContactName("");
    setContactEmail("");
    setContactWhatsApp("");
    setBookConsultation(false);
    setAuthPassword("");
  };

  const progress = step === 0 ? 0 : step <= TOTAL_QUESTIONS ? (step / TOTAL_QUESTIONS) * 100 : 100;
  const currentQuestion = step >= 1 && step <= TOTAL_QUESTIONS ? QUESTIONS[step - 1] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const derivedSkinType = (() => {
    const q1 = answers["q1"];
    if (q1 === 0) return "oily";
    if (q1 === 1) return "combination";
    if (q1 === 2) return "normal";
    if (q1 === 3) return "dry";
    return "normal";
  })();

  if (authLoading) {
    return (
      <section id="ai-formulator" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  const formatRecommendation = (text: string) => {
    return text.split("\n").map((line, index) => {
      if (line.startsWith("##") || line.startsWith("**")) {
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
            <span>{line.trim().replace(/^[-\d.]+\s*/, "")}</span>
          </p>
        );
      }
      if (line.trim()) {
        return (
          <p key={index} className="text-muted-foreground mb-2">{line}</p>
        );
      }
      return null;
    });
  };

  const splitRecommendation = (text: string) => {
    const lines = text.split("\n");
    const cutIndex = lines.findIndex((line) =>
      /actives?\s+(schedule|calendar)|weekly\s+actives|advanced|product[- ]type recommendations|ingredient (deep dive|strategy)/i.test(line),
    );
    const splitAt = cutIndex > 0 ? cutIndex : Math.ceil(lines.length * 0.4);
    return {
      preview: lines.slice(0, splitAt).join("\n"),
      advanced: lines.slice(splitAt).join("\n").trim(),
    };
  };

  return (
    <>
      <section id="ai-formulator" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                AI-Powered Skincare Analysis
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Custom Skincare Formulator
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Get your skin profile, an AM/PM routine, an actives schedule and product recommendations — all built around your answers.
              </p>
              {!isMember && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-full text-xs font-medium mb-3">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">
                    Free Starter Analysis, no card required •
                    <a href="/pricing" className="text-primary hover:underline ml-1">Upgrade for a live, weekly AI Dermatology Report</a>
                  </span>
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-lg">
              {step >= 1 && step <= TOTAL_QUESTIONS && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Question {step} of {TOTAL_QUESTIONS}</span>
                    <span className="text-primary font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {step === 0 && (
                <div className="space-y-8 py-4">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-card-foreground">
                      Let's see what your skin actually needs
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Answer our {TOTAL_QUESTIONS}-question skin assessment and you'll get:
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      "Complete skin profile (type, sensitivity, barrier status)",
                      "AM & PM routines with exact step order",
                      "Week-by-week actives introduction schedule",
                      "Product-type recommendations for your climate & budget",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-card-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Important Disclaimer
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This tool provides general skincare guidance and is <strong>not medical advice</strong>.
                      For medical skin conditions, please consult a licensed dermatologist. Results are
                      AI-generated and reviewed by skincare professionals.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                    <Checkbox id="popia-consent" checked={popiaConsent} onCheckedChange={(checked) => setPopiaConsent(checked === true)} className="mt-0.5" />
                    <Label htmlFor="popia-consent" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                      I consent to SKINLABS processing my personal information in accordance with POPIA
                      (Protection of Personal Information Act). My data will be used solely to generate
                      personalized skincare recommendations and will not be shared with third parties.
                    </Label>
                  </div>
                  <Button size="lg" onClick={() => setStep(1)} disabled={!popiaConsent} className="w-full gap-2">
                    Start My Skin Analysis
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {currentQuestion && !isLoading && (
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

              {step === STEP_PHOTO && !isLoading && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Upload a skin photo (optional but recommended)
                    </h3>
                    <p className="text-muted-foreground text-sm">A clear, well-lit front-facing photo helps our AI provide more accurate analysis</p>
                  </div>
                  {!skinImage ? (
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

              {step === STEP_EMAIL && !isLoading && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="h-8 w-8 text-primary" /></div>
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">Where should we send your results?</h3>
                    <p className="text-muted-foreground text-sm">We'll email your personalized skincare report directly to you</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Full Name *</Label>
                      <Input id="contact-name" placeholder="Your name" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email Address *</Label>
                      <Input id="contact-email" type="email" placeholder="name@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-whatsapp">WhatsApp Number <span className="text-muted-foreground">(optional)</span></Label>
                      <Input id="contact-whatsapp" type="tel" placeholder="+27 XX XXX XXXX" value={contactWhatsApp} onChange={(e) => setContactWhatsApp(e.target.value)} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">We'll use your contact details to deliver your skincare report. We never share your information with third parties.</p>
                </div>
              )}

              {step === STEP_AUTH && !isLoading && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">
                      {authMode === "signup" ? "Create your free account to see your results" : "Welcome back — log in to see your results"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {authMode === "signup"
                        ? "We've already got your name and email — just set a password and your results are ready."
                        : "Log in with the account you already have, and we'll pick up right where you left off."}
                    </p>
                  </div>
                  <form onSubmit={handleInlineAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="auth-email">Email</Label>
                      <Input
                        id="auth-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auth-password">Password</Label>
                      <Input
                        id="auth-password"
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                        minLength={authMode === "signup" ? 8 : undefined}
                        autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                      />
                      {authMode === "signup" && (
                        <p className="text-xs text-muted-foreground">At least 8 characters. Free forever — no card required.</p>
                      )}
                    </div>
                    <Button type="submit" size="lg" className="w-full gap-2" disabled={isAuthSubmitting}>
                      {isAuthSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {authMode === "signup" ? "Create free account & see my results" : "Log in & see my results"}
                    </Button>
                  </form>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setStep(STEP_EMAIL)}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode((m) => (m === "signup" ? "signin" : "signup"))}
                      className="text-primary hover:underline"
                    >
                      {authMode === "signup" ? "Already have an account? Log in" : "New here? Create a free account"}
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                    By continuing you agree to our{" "}
                    <a href="/terms-of-service" className="underline hover:text-foreground">Terms</a>{" "}
                    and{" "}
                    <a href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</a>.
                  </p>
                </div>
              )}

              {step === STEP_RESULTS && recommendation && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles className="h-10 w-10 text-primary" /></div>
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      {isMember ? "Your Personalized Skincare Routine" : "Your Free Starter Analysis"}
                    </h3>
                    <p className="text-muted-foreground">
                      {isMember
                        ? `Customized for your ${derivedSkinType} skin`
                        : `A general match for your ${derivedSkinType} skin — upgrade for a live AI report built around your exact answers`}
                    </p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                    {formatRecommendation(splitRecommendation(recommendation).preview)}
                  </div>
                  {splitRecommendation(recommendation).advanced && (
                    <GatedOverlay locked={!isMember} title="Advanced recommendations are premium" message="Unlock your actives schedule with Glow Insider or VIP." ctaLabel="Unlock with membership" ctaHref="/pricing">
                      <div className="bg-secondary/30 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                        {formatRecommendation(splitRecommendation(recommendation).advanced)}
                      </div>
                    </GatedOverlay>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button size="lg" className="gap-2" asChild><a href="/reviews">See Recommended Products <ChevronRight className="h-4 w-4" /></a></Button>
                    <Button variant="outline" size="lg" onClick={resetFormulator}>Start Over</Button>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </div>
                  <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">Reading your skin profile...</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">Building a routine around your actual answers — this takes a few seconds</p>
                </div>
              )}

              {step >= 1 && step <= STEP_EMAIL && !isLoading && (
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <Button variant="ghost" onClick={handleBack} className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
                  <Button
                    onClick={handleNext}
                    disabled={
                      (step >= 1 && step <= TOTAL_QUESTIONS && currentAnswer === undefined) ||
                      (step === STEP_PHOTO && skinImage !== null && !photoConsent) ||
                      (step === STEP_EMAIL && (!contactName.trim() || !contactEmail.trim()))
                    }
                    className="gap-2 px-6"
                  >
                    {step === STEP_EMAIL ? (<><Sparkles className="h-4 w-4" />Get My AI Routine</>) : (<>{step === STEP_PHOTO && !skinImage ? "Skip" : "Continue"}<ChevronRight className="h-4 w-4" /></>)}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AIFormulator;
