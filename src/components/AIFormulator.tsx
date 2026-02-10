import { useState, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import AuthDialog from "@/components/AuthDialog";
import SubscriptionPaywallModal from "@/components/SubscriptionPaywallModal";
import { QUESTIONS } from "@/data/quiz";

const TOTAL_QUESTIONS = QUESTIONS.length;
// Steps: 0=intro, 1-20=quiz, 21=photo, 22=email capture, 23=loading/results
const STEP_PHOTO = TOTAL_QUESTIONS + 1;
const STEP_EMAIL = TOTAL_QUESTIONS + 2;
const STEP_RESULTS = TOTAL_QUESTIONS + 3;

const AIFormulator = () => {
  const { user, loading: authLoading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [skinImage, setSkinImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [bookConsultation, setBookConsultation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSkinImage(reader.result as string);
        toast.success("Image uploaded successfully!");
      };
      reader.onerror = () => toast.error("Failed to read image file");
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSkinImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const getAIRecommendation = async () => {
    setIsLoading(true);
    try {
      const quizAnswers = QUESTIONS.map((q) => ({
        question: q.title,
        answer: q.options.find((o) => o.value === answers[q.id])?.label ?? "Not answered",
      }));

      const { data, error } = await supabase.functions.invoke("skincare-ai", {
        body: {
          quizAnswers,
          skinImage: skinImage ? "provided" : null,
          contactName,
          contactEmail,
        },
      });

      if (error) {
        console.error("Error calling skincare-ai:", error);
        toast.error("Failed to generate recommendation. Please try again.");
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setRecommendation(data.recommendation);
      if (!hasSubscription) {
        setShowPaywall(true);
      } else {
        setStep(STEP_RESULTS);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === STEP_EMAIL) {
      getAIRecommendation();
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
    setShowPaywall(false);
    setShowConfirmation(false);
    setPopiaConsent(false);
    setPhotoConsent(false);
    setContactName("");
    setContactEmail("");
    setContactWhatsApp("");
    setBookConsultation(false);
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

  const derivedConcerns = (() => {
    const concerns: string[] = [];
    if (answers["q3"] !== undefined && answers["q3"] <= 1) concerns.push("Acne & Breakouts");
    if (answers["q8"] !== undefined && answers["q8"] <= 1) concerns.push("Uneven Skin Tone");
    if (answers["q7"] !== undefined && answers["q7"] <= 1) concerns.push("Redness");
    if (answers["q4"] !== undefined && answers["q4"] <= 1) concerns.push("Dryness");
    const priority = answers["q9"];
    if (priority === 0 && !concerns.includes("Acne & Breakouts")) concerns.push("Acne & Breakouts");
    if (priority === 1) concerns.push("Dark Marks & Brightening");
    if (priority === 2) concerns.push("Anti-aging");
    if (priority === 3) concerns.push("Sensitivity & Barrier Repair");
    return concerns.slice(0, 4);
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

  if (!user) {
    return (
      <>
        <section id="ai-formulator" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Custom Skincare Formulator
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Sign in to access your personalized skincare routine powered by AI.
              </p>
              <Button size="lg" onClick={() => setShowAuthDialog(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Sign In to Continue
              </Button>
            </div>
          </div>
        </section>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </>
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
          <p key={index} className="text-muted-foreground mb-2">
            {line}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <>
      <section id="ai-formulator" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                AI-Powered Skincare Analysis
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Custom Skincare Formulator
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Get your personalized skin profile, AM/PM routine, actives schedule & product recommendations.
              </p>
            </div>

            {/* Form card */}
            <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-lg">
              {/* Progress bar for quiz steps */}
              {step >= 1 && step <= TOTAL_QUESTIONS && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Question {step} of {TOTAL_QUESTIONS}
                    </span>
                    <span className="text-primary font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* ─── Step 0: Landing / Intro ─── */}
              {step === 0 && (
                <div className="space-y-8 py-4">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-card-foreground">
                      Ready to Transform Your Skin?
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Complete our {TOTAL_QUESTIONS}-question skin assessment and receive:
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

                  {/* Disclaimer */}
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

                  {/* POPIA Consent */}
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                    <Checkbox
                      id="popia-consent"
                      checked={popiaConsent}
                      onCheckedChange={(checked) => setPopiaConsent(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="popia-consent" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                      I consent to SKINLABS processing my personal information in accordance with POPIA
                      (Protection of Personal Information Act). My data will be used solely to generate
                      personalized skincare recommendations and will not be shared with third parties.
                    </Label>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => setStep(1)}
                    disabled={!popiaConsent}
                    className="w-full gap-2"
                  >
                    Start My Skin Analysis
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* ─── Steps 1–20: Quiz Questions ─── */}
              {currentQuestion && !isLoading && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground">
                      {currentQuestion.title}
                    </h3>
                  </div>
                  <RadioGroup
                    value={currentAnswer !== undefined ? String(currentAnswer) : ""}
                    onValueChange={(val) =>
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: Number(val) }))
                    }
                    className="grid gap-3"
                  >
                    {currentQuestion.options.map((option, idx) => (
                      <div key={idx}>
                        <RadioGroupItem
                          value={String(option.value)}
                          id={`${currentQuestion.id}-${option.value}`}
                          className="peer sr-only"
                        />
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

              {/* ─── Step 21: Photo Upload ─── */}
              {step === STEP_PHOTO && !isLoading && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Upload a skin photo (optional but recommended)
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      A clear, well-lit front-facing photo helps our AI provide more accurate analysis
                    </p>
                  </div>

                  {!skinImage ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="h-36 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                      >
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="h-7 w-7 text-primary" />
                        </div>
                        <span className="font-medium text-card-foreground">Take Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-36 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                      >
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="h-7 w-7 text-primary" />
                        </div>
                        <span className="font-medium text-card-foreground">Upload Image</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border-2 border-primary">
                      <img src={skinImage} alt="Skin preview" className="w-full h-52 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-primary-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Photo uploaded</span>
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={removeImage} className="absolute top-3 right-3">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Photo consent */}
                  {skinImage && (
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                      <Checkbox
                        id="photo-consent"
                        checked={photoConsent}
                        onCheckedChange={(checked) => setPhotoConsent(checked === true)}
                        className="mt-0.5"
                      />
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

              {/* ─── Step 22: Email / Name Capture ─── */}
              {step === STEP_EMAIL && !isLoading && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Where should we send your results?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      We'll email your personalized skincare report directly to you
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Full Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="Your name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email Address *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="name@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-whatsapp">
                        WhatsApp Number <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="contact-whatsapp"
                        type="tel"
                        placeholder="+27 XX XXX XXXX"
                        value={contactWhatsApp}
                        onChange={(e) => setContactWhatsApp(e.target.value)}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    We'll use your contact details to deliver your skincare report. We never share your information with third parties.
                  </p>
                </div>
              )}

              {/* ─── Confirmation Screen (after payment) ─── */}
              {showConfirmation && (
                <div className="space-y-6 py-4">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-card-foreground">
                      Thank You! Your Report is Being Prepared
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your personalized, dermatologist-reviewed skincare report — including product
                      recommendations — will be delivered via email
                      {contactWhatsApp ? " and/or WhatsApp" : ""} within <strong>1–2 working days</strong>.
                    </p>
                  </div>

                  <div className="bg-secondary/20 rounded-xl p-5 space-y-3">
                    <h4 className="font-semibold text-card-foreground">What's included in your report:</h4>
                    {[
                      "Complete skin profile (type, dehydration, sensitivity, barrier status)",
                      "AM & PM routines with exact step order",
                      "Week-by-week actives introduction schedule",
                      "Product-type recommendations adapted to your climate & constraints",
                      "Link to request a custom skincare kit curated by SkinLabs",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Consultation booking */}
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-accent/30">
                    <Checkbox
                      id="book-consultation"
                      checked={bookConsultation}
                      onCheckedChange={(checked) => setBookConsultation(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="book-consultation" className="text-sm text-card-foreground cursor-pointer leading-relaxed">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Book a <strong>free 15-minute consultation</strong> with our skincare experts
                      along with your skincare report (optional)
                    </Label>
                  </div>

                  {bookConsultation && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        window.open(
                          "https://calendar.google.com/calendar/appointments",
                          "_blank"
                        );
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule on Google Calendar
                    </Button>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="flex-1 gap-2" asChild>
                      <a href="https://shop.skinlabs.co.za" target="_blank" rel="noopener noreferrer">
                        Browse SKINLABS Products
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="lg" onClick={resetFormulator} className="flex-1">
                      Start Over
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Results step (for subscribers viewing immediately) ─── */}
              {step === STEP_RESULTS && recommendation && hasSubscription && !showConfirmation && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Your Personalized Skincare Routine
                    </h3>
                    <p className="text-muted-foreground">
                      Customized for your {derivedSkinType} skin
                    </p>
                  </div>
                  <div className="bg-secondary/30 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                    {formatRecommendation(recommendation)}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button size="lg" className="gap-2" asChild>
                      <a href="https://shop.skinlabs.co.za" target="_blank" rel="noopener noreferrer">
                        Shop Recommended Products
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="lg" onClick={resetFormulator}>
                      Start Over
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </div>
                  <h3 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                    Analyzing Your Skin Profile...
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Our AI is creating a personalized routine based on your unique skin profile
                  </p>
                  <div className="flex justify-center gap-2 mt-6">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Navigation */}
              {step >= 1 && step <= STEP_EMAIL && !isLoading && !showConfirmation && (
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <Button variant="ghost" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={
                      (step >= 1 && step <= TOTAL_QUESTIONS && currentAnswer === undefined) ||
                      (step === STEP_PHOTO && skinImage !== null && !photoConsent) ||
                      (step === STEP_EMAIL && (!contactName.trim() || !contactEmail.trim()))
                    }
                    className="gap-2 px-6"
                  >
                    {step === STEP_EMAIL ? (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Get My AI Routine
                      </>
                    ) : (
                      <>
                        {step === STEP_PHOTO && !skinImage ? "Skip" : "Continue"}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Paywall Modal */}
      {recommendation && (
        <SubscriptionPaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          previewContent={recommendation}
          skinType={derivedSkinType}
          concerns={derivedConcerns}
          onPaymentSuccess={() => {
            setShowPaywall(false);
            setShowConfirmation(true);
          }}
        />
      )}
    </>
  );
};

export default AIFormulator;
