import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Play,
  Download,
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
import { useEntitlements } from "@/hooks/use-entitlements";
import AuthDialog from "@/components/AuthDialog";
import StepperHeader from "@/components/ai-formulator/StepperHeader";
import MstGrid from "@/components/ai-formulator/MstGrid";
import ConfidencePanel from "@/components/ai-formulator/ConfidencePanel";
import ChangeQuestionStep from "@/components/ai-formulator/ChangeQuestionStep";
import RoutinePreferenceStep from "@/components/ai-formulator/RoutinePreferenceStep";
import SkinStoryCard from "@/components/ai-formulator/SkinStoryCard";
import PriorityList from "@/components/ai-formulator/PriorityList";
import RefinementPanel from "@/components/ai-formulator/RefinementPanel";
import PremiumUpsellSection from "@/components/ai-formulator/PremiumUpsellSection";
import AboutYourAnalysisSection from "@/components/ai-formulator/AboutYourAnalysisSection";
import OpenHausShopLinks from "@/components/ai-formulator/OpenHausShopLinks";
import SkynnVideoModal from "@/components/skynn/SkynnVideoModal";
import { useFormulatorAllowance } from "@/hooks/use-formulator-allowance";
import ReanalysisLockedPanel from "@/components/ai-formulator/ReanalysisLockedPanel";
import { summarizeStarterResult } from "@/lib/formulator/summary";
import { MST_SCALE } from "@/data/mstScale";
import { QUESTIONS } from "@/data/quiz";
import { CHANGE_QUESTION } from "@/data/starter-analysis/contextQuestions";
import { type CompletenessBreakdown } from "@/data/formulaResults";
import type { GroundedRoutine } from "@/lib/skynnProductMatch";
import { logFairnessEvent } from "@/lib/skynnFairness";
import { trackConversionEvent } from "@/lib/analytics-events";
import { getPersistedPricingVariant } from "@/lib/pricing-config";
import { getPendingIntent, setPendingIntent, withPendingIntentParams } from "@/lib/pendingIntent";
import { assembleStarterAnalysisResult } from "@/lib/starter-analysis/resultEngine";
import {
  applyAdjustmentsToPreferences,
  applyAdjustmentsToProfile,
  computeRefinementAdjustments,
} from "@/lib/starter-analysis/refinement";
import {
  clearAllStarterAnalysisState,
  loadCompletedState,
  loadDraftState,
  persistStarterResultToAccount,
  saveCompletedState,
  saveDraftState,
} from "@/lib/starter-analysis/persistence";
import {
  ADVANCED_NAME,
  BASIC_NAME,
  SKYNN_ADVANCED_ROUTE,
  SKYNN_FEATURE_VERSION,
  SKYNN_RELEASE_LABEL,
} from "@/lib/skynn/terminology";
import { crossedMilestone, trackSkynnEvent } from "@/lib/skynn/analytics";
import type {
  ChangeContext,
  ConcernKey,
  PriorityPreference,
  RefinementAccuracy,
  RefinementEvent,
  RefinementReason,
  SkinChangeStatus,
  StarterAnalysisResult,
} from "@/lib/starter-analysis/types";

const TOTAL_QUESTIONS = QUESTIONS.length;

// SKYNN AI v2.1 — beta · Basic AI Skin Analysis.
// Funnel: Intro -> Consent -> Photo -> MST -> Quiz questions -> What Changed ->
// Routine preference -> Analysis -> Results. Anonymous visitors complete the
// whole quiz with no account and see a preview (skin type + top two concerns);
// the full analysis, routine and PDF unlock only once the result is SAVED to an
// account by save_starter_analysis(), which is also where the weekly limit is
// enforced (Explorer / Glow Lite: 1 per rolling 7 days; Insider / VIP
// unlimited). A Basic AI Skin Analysis never spends an Analysis Pass.
//
// The photo never leaves the device: it only counts toward input completeness.
// Monk Skin Tone is optional and self-reported — nothing here infers it.
// Every "Advanced" CTA routes to the one Advanced AI Dermatology Analysis flow
// at /skynn-ai/advanced (Analysis Pass required, enforced server-side).
const STEP_INTRO = 0;
const STEP_CONSENT = 1;
const STEP_PHOTO = 2;
const STEP_MST = 3;
const FIRST_QUESTION_STEP = 4;
const LAST_QUESTION_STEP = TOTAL_QUESTIONS + 3;
const STEP_CHANGE = TOTAL_QUESTIONS + 4;
const STEP_ROUTINE_PREF = TOTAL_QUESTIONS + 5;
const STEP_ANALYSIS = TOTAL_QUESTIONS + 6;
const STEP_RESULTS = TOTAL_QUESTIONS + 7;

/** Which of the 4 SKYNN AI (beta) stepper phases a given step belongs to. */
const stepPhase = (step: number): 1 | 2 | 3 | 4 => {
  if (step <= STEP_CONSENT) return 1;
  if (step === STEP_PHOTO) return 2;
  if (step >= STEP_MST && step <= STEP_ROUTINE_PREF) return 3;
  return 4;
};

const AIFormulator = () => {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { isMember } = useMembership();
  const accountState: "anonymous" | "free" | "member" = user ? (isMember ? "member" : "free") : "anonymous";
  const { can: canEntitlement } = useEntitlements();
  const navigate = useNavigate();
  const { data: allowance, refresh: refreshAllowance } = useFormulatorAllowance();
  const [step, setStep] = useState(STEP_INTRO);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [skinImage, setSkinImage] = useState<string | null>(null);
  const [mstTone, setMstTone] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [allowanceExhausted, setAllowanceExhausted] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessBreakdown | null>(null);
  const [groundedRoutine, setGroundedRoutine] = useState<GroundedRoutine | null>(null);
  const [resultsSaved, setResultsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveAttempt, setSaveAttempt] = useState(0);
  /** Server refused the save: free allowance spent and no Analysis Pass held. */
  const [saveLimitReached, setSaveLimitReached] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
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
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const preAnalysisUpsellViewedRef = useRef(false);
  const midQuizUpsellViewedRef = useRef(false);
  const resultsUpsellViewedRef = useRef(false);
  // Starter Analysis 2.0 — What Changed / Routine Reality Check answers, the
  // deterministic result object, and its refinement history.
  const [analysisId, setAnalysisId] = useState<string>(() => crypto.randomUUID());
  const [changeStatus, setChangeStatus] = useState<SkinChangeStatus | null>(null);
  const [changeDetail, setChangeDetail] = useState("");
  const [priorityPreference, setPriorityPreference] = useState<PriorityPreference | null>(null);
  const [starterResult, setStarterResult] = useState<StarterAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const savingResultsRef = useRef(false);
  const viewedFiredRef = useRef(false);
  const restoredRef = useRef(false);
  const saveCtaViewedRef = useRef(false);
  const progressPctRef = useRef(0);
  const funnelViewedRef = useRef(false);
  const completedFiredRef = useRef(false);

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
        trackSkynnEvent("skynn_photo_failed", { mode: "basic", error_category: "photo_invalid" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("That doesn't look like an image file — try again");
        trackSkynnEvent("skynn_photo_failed", { mode: "basic", error_category: "photo_invalid" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSkinImage(reader.result as string);
        toast.success("Photo added — it stays on this device");
        trackSkynnEvent("skynn_photo_uploaded", { mode: "basic" });
      };
      reader.onerror = () => {
        toast.error("Couldn't read that image file — try again");
        trackSkynnEvent("skynn_photo_failed", { mode: "basic", error_category: "photo_invalid" });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSkinImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  /**
   * Basic AI Skin Analysis: a deterministic analysis built from the quiz answers
   * (and the self-reported MST, if given) — no model call, no photo processing.
   * The brief delay keeps the step from feeling suspiciously instant.
   */
  const runStarterAnalysis = async (): Promise<boolean> => {
    trackSkynnEvent("skynn_basic_submission_started", { mode: "basic", account_state: accountState });
    // Signed-in accounts get a read-only server pre-check so nobody sits through
    // the loader just to be told no. The authoritative check is
    // save_starter_analysis() when the result is saved (a tampered client can't
    // skip it, and nothing beyond the preview is shown until it succeeds).
    if (user) {
      const { data, error } = await supabase.rpc("get_formulator_allowance", {
        p_variant_key: getPersistedPricingVariant(),
      });
      const status = Array.isArray(data) ? data[0] : data;
      if (error) {
        setAnalysisError("Couldn't check your analysis allowance — please try again.");
        trackSkynnEvent("skynn_error", { mode: "basic", error_category: "allowance_check" });
        return false;
      }
      if (status && !status.unlimited && (status.free_remaining ?? 0) <= 0) {
        setAllowanceExhausted(true);
        setLockedUntil(status.next_unlock_at ? new Date(status.next_unlock_at) : null);
        trackSkynnEvent("skynn_basic_limit_reached", { mode: "basic", source: "pre_check" });
        return false;
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const context: ChangeContext = { status: changeStatus, detail: changeDetail.trim() || null };
    const result = assembleStarterAnalysisResult({
      analysisId,
      answers,
      mstTone,
      hasPhoto: Boolean(skinImage),
      context,
      priorityPreference,
      revealProducts: canEntitlement("ai_analysis.routine_builder"),
    });
    setStarterResult(result);
    setRecommendation(result.recommendationText);
    setGroundedRoutine(result.groundedRoutine);
    setCompleteness(result.completeness);
    trackConversionEvent("analysis_generated", { resultTier: "free" });
    if (!user) trackConversionEvent("formulator_completed_anonymous", { skinType: result.skinType });
    void logFairnessEvent({
      source: "starter",
      resultTier: "free",
      skinType: result.skinType,
      mstTone,
      hadPhoto: Boolean(skinImage),
      completenessScore: result.completeness.overall,
      groundedMatchCount: result.groundedRoutine.matchStats.matched,
      groundedMatchAttempted: result.groundedRoutine.matchStats.attempted,
      modelVersion: `skynn-basic-${SKYNN_FEATURE_VERSION}`,
    });
    // No automatic PDF: the Basic AI Skin Analysis report downloads only once the
    // result is saved to an account (handleDownloadPdf below).
    saveCompletedState({ analysisId, answers, mstTone, context, result, savedAt: new Date().toISOString() });
    return true;
  };

  /** The Basic AI Skin Analysis report PDF — offered only once the result is saved. */
  const handleDownloadPdf = () => {
    if (!starterResult) return;
    try {
      downloadSkincarePdf({
        clientName: contactName || user?.email?.split("@")[0] || "Client",
        email: contactEmail || user?.email || "",
        recommendation: starterResult.recommendationText,
        skinType: starterResult.skinType,
        mstTone,
      });
      trackSkynnEvent("skynn_results_pdf_generated", { mode: "basic" });
      trackSkynnEvent("skynn_results_pdf_downloaded", { mode: "basic" });
      toast.success(`Your ${BASIC_NAME} report is downloaded`);
    } catch {
      trackSkynnEvent("skynn_error", { mode: "basic", error_category: "pdf_failed" });
      toast.error("The PDF didn't download this time — your results are still below. Please try again.");
    }
  };

  /** Re-runs the deterministic pipeline with feedback-derived adjustments — see refinement.ts. */
  const handleRefinementSubmit = (evt: {
    accuracy: RefinementAccuracy;
    reason: RefinementReason | null;
    otherConcern?: ConcernKey | null;
  }) => {
    trackConversionEvent("starter_feedback_submitted", { accuracy: evt.accuracy, reason: evt.reason ?? "" });
    if (evt.accuracy !== "not_quite" || !evt.reason || !starterResult) return;

    const adjustments = computeRefinementAdjustments(evt.reason, evt.otherConcern ?? null);
    const nextPreferences = applyAdjustmentsToPreferences(starterResult.preferences, adjustments);
    const nextProfile = applyAdjustmentsToProfile(starterResult.profile, adjustments);
    const refinementEvent: RefinementEvent = {
      accuracy: evt.accuracy,
      reason: evt.reason,
      otherConcern: evt.otherConcern ?? null,
      appliedAt: new Date().toISOString(),
    };

    const nextResult = assembleStarterAnalysisResult({
      analysisId,
      answers,
      mstTone,
      hasPhoto: Boolean(skinImage),
      context: starterResult.context,
      priorityPreference,
      revealProducts: canEntitlement("ai_analysis.routine_builder"),
      profileOverride: nextProfile,
      preferencesOverride: nextPreferences,
      refinementHistory: [...starterResult.refinementHistory, refinementEvent],
    });

    setStarterResult(nextResult);
    setRecommendation(nextResult.recommendationText);
    setCompleteness(nextResult.completeness);
    setGroundedRoutine(nextResult.groundedRoutine);
    saveCompletedState({ analysisId, answers, mstTone, context: starterResult.context, result: nextResult, savedAt: new Date().toISOString() });
    trackConversionEvent("starter_result_refined", { reason: evt.reason });
    // Let a previously-saved account row pick up the refined result.
    setResultsSaved(false);
    savingResultsRef.current = false;
    // "Doesn't match my skin" has no deterministic adjustment to apply — surface its
    // guidance note instead of the generic "updated" toast (see refinement.ts).
    if (adjustments.note) toast.message(adjustments.note);
    else toast.success("Updated your result based on your feedback");
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    setAnalysisError(null);
    setAllowanceExhausted(false);
    try {
      const ok = await runStarterAnalysis();
      if (ok) setStep(STEP_RESULTS);
    } catch {
      setAnalysisError("Something went wrong on our end — please try again.");
      trackSkynnEvent("skynn_basic_submission_failed", { mode: "basic", error_category: "unknown" });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Every Advanced CTA on this page lands on the single Advanced AI Dermatology
   * Analysis flow. That page handles sign-in, the Analysis Pass gate (server-side
   * via get_advanced_assessment_access) and purchase — nothing is spent here.
   */
  const goToAdvanced = (funnelLocation: string) => {
    trackConversionEvent("advanced_assessment_upsell_clicked", { funnelLocation });
    trackSkynnEvent("skynn_mode_selected", { mode: "advanced", source: funnelLocation });
    navigate(SKYNN_ADVANCED_ROUTE);
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

  // Once per page view: the SKYNN AI discovery event.
  useEffect(() => {
    if (funnelViewedRef.current || authLoading) return;
    funnelViewedRef.current = true;
    trackSkynnEvent("skynn_viewed", { mode: "basic", account_state: accountState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Step-entry funnel events (consent / photo / MST / questionnaire).
  useEffect(() => {
    if (step === STEP_CONSENT) trackSkynnEvent("skynn_consent_viewed", { mode: "basic" });
    else if (step === STEP_PHOTO) trackSkynnEvent("skynn_photo_step_viewed", { mode: "basic" });
    else if (step === STEP_MST) trackSkynnEvent("skynn_mst_viewed", { mode: "basic" });
    else if (step === FIRST_QUESTION_STEP) {
      trackSkynnEvent("skynn_assessment_started", { mode: "basic" });
      trackSkynnEvent("skynn_profile_started", { mode: "basic" });
    }
  }, [step]);

  // Fire the "viewed" funnel event once per completed analysis, separate from
  // "generated" (the data existing) — this is the moment a person actually saw it.
  useEffect(() => {
    if (step === STEP_RESULTS && recommendation && !viewedFiredRef.current) {
      viewedFiredRef.current = true;
      trackConversionEvent("analysis_viewed", { resultTier: "free" });
      trackSkynnEvent("skynn_results_viewed", { mode: "basic", account_state: accountState });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, recommendation]);

  // Save the result to the account the moment one exists — whether the visitor was
  // already signed in, or just created/logged into an account from the results
  // screen below. This save is the Basic AI Skin Analysis weekly-limit gate
  // (save_starter_analysis); the full result and PDF render only after it
  // succeeds. Idempotent on `analysisId`, so a refinement re-save or a retried
  // save after a network error updates the same row (Section 18). The photo is
  // never uploaded (SKYNN AI v2.1).
  useEffect(() => {
    if (step !== STEP_RESULTS || !recommendation || !user || resultsSaved || savingResultsRef.current || !starterResult) return;
    savingResultsRef.current = true;
    (async () => {
      const outcome = await persistStarterResultToAccount({
        result: starterResult,
        contactName: contactName || null,
        contactWhatsApp: contactWhatsApp || null,
        photoStoragePath: null,
        variantKey: getPersistedPricingVariant(),
      });
      savingResultsRef.current = false;
      if (outcome.limitReached) {
        setSaveLimitReached(true);
        setLockedUntil(outcome.nextUnlockAt);
        trackSkynnEvent("skynn_basic_limit_reached", { mode: "basic", source: "save" });
        void refreshAllowance();
        return;
      }
      if (outcome.error) {
        setSaveError(outcome.error.message);
        trackConversionEvent("starter_account_link_failed", { message: outcome.error.message });
        trackSkynnEvent("skynn_basic_submission_failed", { mode: "basic", error_category: "save_failed" });
        return;
      }
      setSaveError(null);
      setSaveLimitReached(false);
      trackConversionEvent("starter_account_link_completed");
      trackSkynnEvent("skynn_basic_submission_succeeded", { mode: "basic", account_state: accountState });
      void refreshAllowance();
      setResultsSaved(true);
      trackConversionEvent("results_saved", { resultTier: "free" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, recommendation, user, resultsSaved, starterResult, saveAttempt]);

  // Anonymous persistence (Section 16): restore a completed result or an
  // in-progress draft from localStorage on mount, so a refresh, accidental back
  // navigation, or a failed sign-in doesn't discard the visitor's analysis. Runs
  // once — the photo itself is deliberately never persisted (see persistence.ts).
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const completed = loadCompletedState();
    if (completed) {
      setAnalysisId(completed.analysisId);
      setAnswers(completed.answers);
      setMstTone(completed.mstTone);
      setChangeStatus(completed.context.status);
      setChangeDetail(completed.context.detail ?? "");
      setPriorityPreference(completed.result.preferences.priority);
      setStarterResult(completed.result);
      setRecommendation(completed.result.recommendationText);
      setCompleteness(completed.result.completeness);
      setGroundedRoutine(completed.result.groundedRoutine);
      setStep(STEP_RESULTS);
      return;
    }
    const draft = loadDraftState();
    if (draft && draft.step > STEP_INTRO && draft.step < STEP_ANALYSIS) {
      setAnalysisId(draft.analysisId);
      setAnswers(draft.answers);
      setMstTone(draft.mstTone);
      setChangeStatus(draft.changeContext.status);
      setChangeDetail(draft.changeContext.detail ?? "");
      setPriorityPreference(draft.priorityPreference);
      setContactName(draft.contactName);
      setContactEmail(draft.contactEmail);
      setContactWhatsApp(draft.contactWhatsApp);
      setStep(draft.step);
    }
  }, []);

  // Persist the in-progress draft on every relevant change. Excludes the photo's
  // bytes deliberately (see persistence.ts) and stops once analysis is running,
  // since the completed-result snapshot (saved in runStarterAnalysis) takes over.
  useEffect(() => {
    if (step === STEP_INTRO || step >= STEP_ANALYSIS) return;
    saveDraftState({
      analysisId,
      step,
      answers,
      mstTone,
      changeContext: { status: changeStatus, detail: changeDetail.trim() || null },
      priorityPreference,
      hasPhotoPending: Boolean(skinImage),
      contactName,
      contactEmail,
      contactWhatsApp,
      savedAt: new Date().toISOString(),
    });
  }, [step, answers, mstTone, changeStatus, changeDetail, priorityPreference, skinImage, contactName, contactEmail, contactWhatsApp, analysisId]);

  const handleStartAnalysis = () => {
    trackConversionEvent("analysis_started");
    trackConversionEvent("formulator_started", { accountState });
    trackSkynnEvent("skynn_started", { mode: "basic", account_state: accountState });
    trackSkynnEvent("skynn_mode_selected", { mode: "basic", source: "intro" });
    setStep(STEP_CONSENT);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    if (authMode === "signup") trackConversionEvent("signup_started", { source: "ai_formulator_results" });
    // Email confirmation lands back here (not the homepage), where the saved
    // local result is restored and attached to the new account automatically.
    // The save_analysis intent keeps <IntentResolver /> from routing the new
    // account elsewhere, and rides in the confirmation link for a new tab.
    setPendingIntent({ action: "save_analysis", returnTo: "/skynn-ai" });
    const response =
      authMode === "signup"
        ? await signUp(
            contactEmail,
            authPassword,
            withPendingIntentParams(`${window.location.origin}/skynn-ai`, getPendingIntent()),
          )
        : await signIn(contactEmail, authPassword);
    const { error } = response;
    setIsAuthSubmitting(false);
    if (error) {
      toast.error(error.message);
      if (authMode === "signup") trackConversionEvent("starter_account_creation_failed", { message: error.message });
      return;
    }
    if (authMode === "signup") {
      trackConversionEvent("signup_completed", { source: "ai_formulator_results" });
      trackConversionEvent("signup_from_formulator", { hasResult: Boolean(starterResult) });
    }
    const needsConfirmation = authMode === "signup" && !(response.data as { session?: unknown } | null)?.session;
    if (needsConfirmation) {
      toast.success("Check your email to confirm your account — your results are kept on this device and will be saved as soon as you confirm.");
    } else {
      toast.success(authMode === "signup" ? "Account created — saving your results..." : "Welcome back.");
    }
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
      trackSkynnEvent("skynn_consent_accepted", { mode: "basic" });
      setStep(STEP_PHOTO);
      return;
    }
    if (step === STEP_PHOTO) {
      if (!skinImage) {
        trackConversionEvent("starter_question_skipped", { step: "photo" });
        trackSkynnEvent("skynn_photo_skipped", { mode: "basic" });
      }
      setStep(STEP_MST);
      return;
    }
    if (step === STEP_MST) {
      trackSkynnEvent(mstTone !== null ? "skynn_mst_selected" : "skynn_mst_skipped", {
        mode: "basic",
        mst_selected: mstTone !== null,
      });
      setStep(FIRST_QUESTION_STEP);
      return;
    }
    if (step === LAST_QUESTION_STEP) {
      trackConversionEvent("profile_completed");
      trackSkynnEvent("skynn_profile_completed", { mode: "basic" });
      trackSkynnEvent("skynn_questionnaire_completed", { mode: "basic" });
      setStep(STEP_CHANGE);
      return;
    }
    if (step === STEP_CHANGE) {
      setStep(STEP_ROUTINE_PREF);
      return;
    }
    if (step === STEP_ROUTINE_PREF) {
      setStep(STEP_ANALYSIS);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (currentQuestion) trackConversionEvent("starter_question_back", { questionId: currentQuestion.id });
    // Backing out of consent without accepting is the only "decline" signal we have.
    if (step === STEP_CONSENT) trackSkynnEvent("skynn_consent_declined", { mode: "basic" });
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
    setSaveError(null);
    setSaveLimitReached(false);
    setLockedUntil(null);
    setAllowanceExhausted(false);
    setConsentData(false);
    setConsentMst(false);
    setConsentTerms(false);
    setPhotoConsent(false);
    setContactName("");
    setContactEmail("");
    setContactWhatsApp("");
    setAuthPassword("");
    setChangeStatus(null);
    setChangeDetail("");
    setPriorityPreference(null);
    setStarterResult(null);
    setAnalysisId(crypto.randomUUID());
    savingResultsRef.current = false;
    viewedFiredRef.current = false;
    saveCtaViewedRef.current = false;
    progressPctRef.current = 0;
    completedFiredRef.current = false;
    clearAllStarterAnalysisState();
  };

  const currentQuestion =
    step >= FIRST_QUESTION_STEP && step <= LAST_QUESTION_STEP ? QUESTIONS[step - FIRST_QUESTION_STEP] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const questionNumber = step - FIRST_QUESTION_STEP + 1;
  const progress = currentQuestion ? (questionNumber / TOTAL_QUESTIONS) * 100 : 0;

  // Fires once per question shown — see Section 24's per-question funnel events.
  useEffect(() => {
    if (currentQuestion) trackConversionEvent("starter_question_viewed", { questionId: currentQuestion.id });
  }, [currentQuestion]);

  // Questionnaire progress at 25/50/75% only — never which answer was given.
  useEffect(() => {
    if (!currentQuestion) return;
    const milestone = crossedMilestone(progressPctRef.current, progress);
    progressPctRef.current = Math.max(progressPctRef.current, progress);
    if (milestone) trackSkynnEvent("skynn_questionnaire_progress", { mode: "basic", progress_pct: milestone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  // Funnel end-state: the full, saved Basic AI Skin Analysis is on screen.
  const fullResultVisible = Boolean(user) && resultsSaved && !saveLimitReached;
  useEffect(() => {
    if (step !== STEP_RESULTS || !fullResultVisible || completedFiredRef.current) return;
    completedFiredRef.current = true;
    trackSkynnEvent("skynn_results_completed", { mode: "basic", account_state: accountState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, fullResultVisible]);

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
    if (h.includes("skin story")) return Sparkles;
    if (h.includes("priorit")) return Layers;
    if (h.includes("changed")) return AlertTriangle;
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

  const changeFollowUpRequired = Boolean(CHANGE_QUESTION.options.find((o) => o.value === changeStatus)?.followUp);

  const footerVisible = step >= STEP_CONSENT && step <= STEP_ROUTINE_PREF;
  const footerDisabled =
    (step === STEP_CONSENT && !(consentData && consentMst && consentTerms)) ||
    (currentQuestion !== null && currentAnswer === undefined) ||
    (step === STEP_PHOTO && skinImage !== null && !photoConsent) ||
    (step === STEP_CHANGE && (!changeStatus || (changeFollowUpRequired && !changeDetail.trim()))) ||
    (step === STEP_ROUTINE_PREF && !priorityPreference);
  const footerLabel =
    step === STEP_ROUTINE_PREF ? "See My Results" : step === STEP_PHOTO && !skinImage ? "Skip photo" : "Continue";

  const mstSwatch = mstTone !== null ? MST_SCALE.find((s) => s.level === mstTone) : null;

  // The full Basic AI Skin Analysis (routine, PDF) is shown only once the server
  // has accepted the save — that save is the weekly-limit gate. Anonymous
  // visitors, a save in flight, and a refused save all see the preview.
  const showFullResult = fullResultVisible;
  const saveInFlight = Boolean(user) && !resultsSaved && !saveLimitReached && !saveError;
  const starterSummary = starterResult ? summarizeStarterResult(starterResult) : null;
  const introLocked = Boolean(user && !isMember && allowance?.locked);

  return (
    <>
      <section id="skynn-ai" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {step !== STEP_INTRO && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span className="gradient-text font-bold">SKYNN AI</span>{" "}
                  <span className="text-muted-foreground font-normal">v2.1 — beta</span> · by SkinLabs®
                </div>
                {step !== STEP_RESULTS && !isMember && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-2xl sm:rounded-full text-xs font-medium mb-3 text-left">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-muted-foreground">
                      {BASIC_NAME} · free, no card required •
                      <a href={SKYNN_ADVANCED_ROUTE} className="text-primary hover:underline ml-1">Go deeper with the {ADVANCED_NAME}</a>
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
                  <div className="absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-3xl pointer-events-none" aria-hidden="true" />
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
              {(step === STEP_CONSENT || step === STEP_PHOTO || step === STEP_MST || step === STEP_CHANGE || step === STEP_ROUTINE_PREF) && (
                <StepperHeader phase={stepPhase(step)} />
              )}

              {/* Keyed per step so each step's content fades/rises in, marking what
                  changed; the results reveal gets a slightly longer, larger
                  entrance. Stepper/progress/footer sit outside so they don't
                  re-animate. Reduced motion collapses animate-in globally. */}
              <div
                key={step}
                className={cn(
                  "animate-in fade-in-0 ease-out",
                  step === STEP_RESULTS ? "slide-in-from-bottom-2 duration-300" : "slide-in-from-bottom-1 duration-200",
                )}
              >
              {step === STEP_INTRO && (
                <div className="relative space-y-8 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-heading font-bold tracking-tight">
                      SKYNN AI <span className="font-normal text-background/60">v2.1 — beta</span>
                    </span>
                    <span className="text-background/60 font-medium">SkinLabs®</span>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold leading-tight">
                      Your skin.
                      <br />
                      <span className="gradient-text">Smarter care.</span>
                    </h2>
                    <p className="text-background/70 max-w-md">
                      A free {BASIC_NAME} and personalised routine, built for every skin tone — once every 7 days.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { icon: BarChart3, label: BASIC_NAME, tint: "bg-emerald-500/15 text-emerald-400 dark:text-emerald-700" },
                      { icon: Layers, label: "Personalised routines", tint: "bg-blue-500/15 text-blue-400 dark:text-blue-700" },
                      { icon: ShieldCheck, label: "Dermatologist-grounded research", tint: "bg-purple-500/15 text-purple-400 dark:text-purple-700" },
                      { icon: Lock, label: "Privacy-first", tint: "bg-pink-500/15 text-pink-400 dark:text-pink-700" },
                    ].map(({ icon: Icon, label, tint }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tint)}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium text-background/90">{label}</span>
                      </div>
                    ))}
                  </div>
                  {introLocked && (
                    <ReanalysisLockedPanel
                      nextUnlockAt={allowance?.nextUnlockAt ?? null}
                      source="formulator_intro"
                      tone="inverted"
                    />
                  )}
                  <div className="space-y-2">
                    {introLocked ? (
                      <Button
                        asChild
                        size="lg"
                        variant="ghost"
                        className="min-h-11 w-full text-background hover:bg-background/10 hover:text-background"
                      >
                        <a href="/dashboard?tab=analysis">View my last analysis</a>
                      </Button>
                    ) : (
                    <Button
                      size="lg"
                      onClick={() => handleStartAnalysis()}
                      className="w-full gap-2 bg-background text-foreground hover:bg-background/90 gradient-border-anim"
                    >
                      {/* Members aren't starting anything "free" — they're already entitled. */}
                      {isMember ? `Start my ${BASIC_NAME}` : `Start my free ${BASIC_NAME}`}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setVideoModalOpen(true)}
                      aria-label="Watch a short video showing how SKYNN AI works"
                      className="w-full gap-2 text-background/80 hover:bg-background/10 hover:text-background"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      See how it works
                    </Button>
                  </div>
                  {!user && (
                    <button
                      type="button"
                      onClick={() => setSignInDialogOpen(true)}
                      className="block w-full text-center text-xs text-background/60 hover:text-background/90"
                    >
                      Already have an account? Sign in
                    </button>
                  )}

                  <div
                    ref={(el) => {
                      if (el && !preAnalysisUpsellViewedRef.current) {
                        preAnalysisUpsellViewedRef.current = true;
                        trackConversionEvent("advanced_assessment_upsell_viewed", {
                          funnelLocation: "pre_analysis",
                          accessState: isMember ? "member" : "none",
                        });
                      }
                    }}
                    className="rounded-xl border border-background/15 bg-background/5 p-4 space-y-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-background/90">Want to go deeper?</p>
                      <p className="text-xs text-background/60 mt-1">
                        The {BASIC_NAME} gives you a quick snapshot of your skin. The {ADVANCED_NAME} is a
                        longer, more detailed questionnaire that uses one Analysis Pass. During this beta, submissions
                        are received and queued with a reference number while the full report workflow is finalised.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2 border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                        onClick={() => goToAdvanced("pre_analysis")}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Explore the {ADVANCED_NAME}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === STEP_CONSENT && (
                <div className="space-y-6 py-2">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-card-foreground">
                      Your consent &amp; privacy
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Before we start, we need your consent to use your answers and, if you choose to share it, your
                      self-reported Monk Skin Tone. An optional photo stays on this device.
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Important Disclaimer
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {SKYNN_RELEASE_LABEL} provides general skincare guidance and is <strong>not medical advice, diagnosis or
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
                        I understand that my Monk Skin Tone (MST) is optional and self-reported. If I share it, it
                        tailors sun-protection and pigmentation guidance and helps SkinLabs test fairness across skin
                        tones. It is never inferred from a photo and is not a diagnosis.
                      </Label>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                      <Checkbox id="consent-terms" checked={consentTerms} onCheckedChange={(c) => setConsentTerms(c === true)} className="mt-0.5" />
                      <Label htmlFor="consent-terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                        I agree to the <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a> and{" "}
                        <a href="/terms" className="text-primary hover:underline">Terms of Service</a>, and understand SKYNN AI
                        does not replace professional medical care.
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {step === STEP_PHOTO && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h2 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Add a photo
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Optional. Your photo stays on this device — it is not uploaded, not analysed by AI and never used
                      to estimate your skin tone. It's shown on your results screen for your own reference.
                    </p>
                  </div>
                  {!skinImage ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <button type="button" onClick={() => cameraInputRef.current?.click()} aria-label="Take a photo with your camera (optional)" className="h-36 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all">
                          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center"><Camera className="h-7 w-7 text-primary" /></div>
                          <span className="font-medium text-card-foreground">Take Photo</span>
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Choose a photo from your device (optional)" className="h-36 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all">
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
                        <ImageIcon className="h-4 w-4" /><span className="text-sm font-medium">Photo added (stays on this device)</span>
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={removeImage} aria-label="Remove photo" className="absolute top-3 right-3"><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {skinImage && (
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                      <Checkbox id="photo-consent" checked={photoConsent} onCheckedChange={(checked) => setPhotoConsent(checked === true)} className="mt-0.5" />
                      <Label htmlFor="photo-consent" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                        I understand my photo stays on this device. It isn't uploaded or analysed, and SKYNN AI never
                        uses it to estimate my skin tone.
                      </Label>
                    </div>
                  )}
                  <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="user" onChange={handleImageUpload} className="hidden" aria-hidden="true" tabIndex={-1} />
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleImageUpload} className="hidden" aria-hidden="true" tabIndex={-1} />
                </div>
              )}

              {step === STEP_MST && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <h2 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground mb-2">
                      Monk Skin Tone (MST) — optional
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Which tone most closely represents you? This is your choice to share — SKYNN AI never infers it
                      from your photo, and it is not a diagnosis.
                    </p>
                  </div>
                  <MstGrid value={mstTone} onChange={setMstTone} />
                  <div className="rounded-lg bg-muted/40 p-4 flex gap-3">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-card-foreground mb-1">Why we ask</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        If you share it, your Monk Skin Tone (MST) tailors your sun-protection and pigmentation
                        guidance, and it helps us check that SKYNN AI works equally well across all skin tones. It
                        only ever comes from your own choice here, and you can choose "Prefer not to say".
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentQuestion && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h2 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground">{currentQuestion.title}</h2>
                  </div>
                  <RadioGroup
                    value={currentAnswer !== undefined ? String(currentAnswer) : ""}
                    onValueChange={(val) => {
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: Number(val) }));
                      trackConversionEvent("starter_question_answered", { questionId: currentQuestion.id });
                    }}
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

              {step === STEP_CHANGE && !isMember && (
                <div
                  ref={(el) => {
                    if (el && !midQuizUpsellViewedRef.current) {
                      midQuizUpsellViewedRef.current = true;
                      trackConversionEvent("advanced_assessment_upsell_viewed", { funnelLocation: "during_analysis" });
                    }
                  }}
                  className="mb-5 rounded-xl border border-primary/20 bg-accent/30 p-4 space-y-2"
                >
                  <p className="text-sm text-card-foreground">
                    <span className="font-medium">You're building your skin profile.</span> Want the full picture? The{" "}
                    {ADVANCED_NAME} asks in more depth about the factors behind your skin concerns. You can finish this{" "}
                    {BASIC_NAME} first — nothing here is lost.
                  </p>
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => goToAdvanced("during_analysis")}>
                    <Sparkles className="h-3.5 w-3.5" />
                    See the {ADVANCED_NAME}
                  </Button>
                </div>
              )}

              {step === STEP_CHANGE && (
                <ChangeQuestionStep status={changeStatus} detail={changeDetail} onStatusChange={setChangeStatus} onDetailChange={setChangeDetail} />
              )}

              {step === STEP_ROUTINE_PREF && (
                <RoutinePreferenceStep value={priorityPreference} onChange={setPriorityPreference} />
              )}

              {step === STEP_ANALYSIS && (
                <div
                  key={isLoading ? "loading" : allowanceExhausted ? "exhausted" : "error"}
                  className="text-center py-12 animate-in fade-in-0 duration-200 ease-out"
                  role={isLoading ? "status" : undefined}
                  aria-live="polite"
                >
                  {isLoading ? (
                    <>
                      <div className="w-20 h-20 gradient-bg-soft rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      </div>
                      <h2 className="text-2xl font-heading font-semibold text-card-foreground mb-2">Running your {BASIC_NAME}…</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">Building a routine around your actual answers — this takes a few seconds</p>
                    </>
                  ) : allowanceExhausted ? (
                    <div className="text-left">
                      <ReanalysisLockedPanel nextUnlockAt={lockedUntil} source="formulator_save" />
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                      </div>
                      <h2 className="text-2xl font-heading font-semibold text-card-foreground mb-2">We couldn't generate your analysis</h2>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6" role="alert">{analysisError}</p>
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
                    <h2 className="text-2xl font-heading font-semibold text-card-foreground mb-2">
                      {showFullResult ? `Your ${BASIC_NAME}` : "Your skin at a glance"}
                    </h2>
                    <p className="text-muted-foreground">
                      {showFullResult
                        ? `Your personalised starting point for ${derivedSkinType} skin, built from the information you shared`
                        : saveInFlight
                          ? "Saving your analysis to your account…"
                          : user
                            ? "Here's what your answers say about your skin."
                            : "Here's what your answers say about your skin. Your full analysis, routine and PDF are one free step away."}
                    </p>
                  </div>

                  {showFullResult ? (
                  <>
                  {/* Skin Snapshot strip */}
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
                    {starterResult?.context.status && starterResult.context.status !== "always_like_this" && (
                      <span className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                        {CHANGE_QUESTION.options.find((o) => o.value === starterResult.context.status)?.label}
                      </span>
                    )}
                  </div>

                  {starterResult && <SkinStoryCard skinStory={starterResult.skinStory} />}
                  {starterResult && <PriorityList priorities={starterResult.priorities} />}

                  <div className="grid gap-4 lg:grid-cols-[1fr_280px] items-start">
                    <div className="space-y-4">
                      {recommendationSections(recommendation)
                        .filter((section) => {
                          if (!starterResult || !section.heading) return true;
                          // Rendered above via SkinStoryCard/PriorityList/the snapshot strip instead — avoid showing it twice.
                          const h = section.heading.toLowerCase();
                          return !(h.includes("skin story") || h.includes("top skin priorities") || h.includes("what's changed") || h.includes("about your skin analysis"));
                        })
                        .map((section, idx) => {
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
                            "Built from your answers only — your photo is not analysed.",
                            "Some concerns can look different across skin tones — your optional, self-reported MST helps us check for this.",
                            "Not a substitute for professional medical advice.",
                          ]}
                        />
                      </div>
                    )}
                  </div>

                  {starterResult && <OpenHausShopLinks routine={starterResult.groundedRoutine} />}

                  {starterResult && (
                    <RefinementPanel
                      onSubmit={handleRefinementSubmit}
                      lastAppliedAt={starterResult.refinementHistory[starterResult.refinementHistory.length - 1]?.appliedAt ?? null}
                    />
                  )}

                  {starterResult && <AboutYourAnalysisSection />}

                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="min-h-11 gap-2">
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download my {BASIC_NAME} report (PDF)
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleShareResults} className="min-h-11 gap-2 text-muted-foreground">
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                      Share my skin type
                    </Button>
                  </div>

                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        {resultsSaved ? "Saved to your account" : saveError ? "Couldn't save your results" : "Saving to your account…"}
                      </div>
                      {saveError && (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                          <span>{saveError}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSaveError(null);
                              savingResultsRef.current = false;
                              setSaveAttempt((n) => n + 1);
                            }}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {starterResult && (
                    <div
                      ref={(el) => {
                        if (el && !resultsUpsellViewedRef.current) {
                          resultsUpsellViewedRef.current = true;
                          trackConversionEvent("advanced_assessment_upsell_viewed", {
                            funnelLocation: "results",
                            accessState: isMember ? "member" : "none",
                          });
                        }
                      }}
                      className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3"
                    >
                      <p className="text-sm font-medium text-card-foreground">
                        This is your starting point. There's more to your skin story.
                      </p>
                      <div>
                        <h4 className="font-heading font-semibold text-card-foreground">Go deeper with the {ADVANCED_NAME}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          A longer, more detailed questionnaire about how your skin behaves, your concerns and your
                          day-to-day. It uses one Analysis Pass. During this beta your submission is received and
                          queued with a reference number; your report follows once the review workflow is finalised.
                        </p>
                      </div>
                      <Button size="lg" className="gap-2" onClick={() => goToAdvanced("results")}>
                        <Sparkles className="h-4 w-4" />
                        Explore the {ADVANCED_NAME}
                      </Button>
                    </div>
                  )}

                  {starterResult && <PremiumUpsellSection hasGroundedMatches={starterResult.groundedRoutine.matchStats.matched > 0} />}

                  </>
                  ) : (
                    <>
                      {starterSummary && (
                        <section
                          aria-labelledby="skynn-summary-heading"
                          className="rounded-2xl bg-brand-cream text-brand-cream-foreground p-6 sm:p-8 text-center space-y-5"
                        >
                          <div className="space-y-1">
                            <p id="skynn-summary-heading" className="text-xs font-semibold uppercase tracking-wider">Your skin type</p>
                            <p className="text-3xl sm:text-4xl font-heading font-bold">{starterSummary.skinTypeLabel}</p>
                          </div>
                          {starterSummary.topConcerns.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wider">Your top concerns</p>
                              <ul className="flex flex-wrap justify-center gap-2">
                                {starterSummary.topConcerns.map((concern) => (
                                  <li key={concern} className="rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground">
                                    {concern}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </section>
                      )}

                      {!user ? (
                        <div
                          ref={(el) => {
                            if (el && !saveCtaViewedRef.current) {
                              saveCtaViewedRef.current = true;
                              trackConversionEvent("starter_save_cta_viewed");
                            }
                          }}
                          className="rounded-2xl border border-border bg-card p-6 space-y-4"
                        >
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" aria-hidden="true" />
                            <h3 className="font-heading font-semibold text-card-foreground">Save your results — free</h3>
                          </div>
                          <p className="text-sm text-secondary-text">
                            Create a free SkinLabs account to see your full analysis: your AM/PM routine, ingredient
                            priorities and product picks, saved to your dashboard. Your answers are kept, so there's no
                            need to redo the quiz. No card required.
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
                                className="min-h-11"
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
                                className="min-h-11"
                                required
                              />
                            </div>
                            <Button type="submit" disabled={isAuthSubmitting} className="min-h-11 gap-2">
                              {isAuthSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                              {authMode === "signup" ? "Save my results" : "Log in"}
                            </Button>
                          </form>
                          <button
                            type="button"
                            onClick={() => setAuthMode((m) => (m === "signup" ? "signin" : "signup"))}
                            className="min-h-11 text-sm text-primary hover:underline"
                          >
                            {authMode === "signup" ? "Already have an account? Log in instead" : "New here? Create a free account instead"}
                          </button>
                        </div>
                      ) : saveLimitReached ? (
                        <ReanalysisLockedPanel nextUnlockAt={lockedUntil} source="formulator_save" />
                      ) : saveError ? (
                        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                          <span>We couldn't save your analysis: {saveError}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSaveError(null);
                              savingResultsRef.current = false;
                              setSaveAttempt((n) => n + 1);
                            }}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : saveInFlight ? (
                        <p role="status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Saving your {BASIC_NAME}…
                        </p>
                      ) : null}

                      <div className="flex justify-center">
                        <Button variant="ghost" size="sm" onClick={handleShareResults} className="min-h-11 gap-2 text-muted-foreground">
                          <Share2 className="h-4 w-4" aria-hidden="true" />
                          Share my skin type
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button size="lg" className="gap-2" asChild><a href="/reviews">See Recommended Products <ChevronRight className="h-4 w-4" /></a></Button>
                    <Button variant="outline" size="lg" onClick={resetFormulator}>Start Over</Button>
                  </div>
                </div>
              )}

              </div>

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
      <SkynnVideoModal open={videoModalOpen} onOpenChange={setVideoModalOpen} />
    </>
  );
};

export default AIFormulator;
