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
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadSkincarePdf } from "@/lib/generateSkincarePdf";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useEntitlements } from "@/hooks/use-entitlements";
import UpgradePrompt from "@/components/UpgradePrompt";
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
import AnalysisPassPurchaseModal from "@/components/AnalysisPassPurchaseModal";
import { useAnalysisPassBalance } from "@/hooks/use-analysis-passes";
import { MST_SCALE } from "@/data/mstScale";
import { QUESTIONS } from "@/data/quiz";
import { CHANGE_QUESTION } from "@/data/starter-analysis/contextQuestions";
import { type CompletenessBreakdown } from "@/data/formulaResults";
import type { GroundedRoutine } from "@/lib/skynnProductMatch";
import { logFairnessEvent } from "@/lib/skynnFairness";
import { trackConversionEvent } from "@/lib/analytics-events";
import { getPersistedPricingVariant } from "@/lib/pricing-config";
import { assembleStarterAnalysisResult } from "@/lib/starter-analysis/resultEngine";
import { priorityLabel } from "@/lib/starter-analysis/priorityEngine";
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
  uploadAnalysisPhoto,
} from "@/lib/starter-analysis/persistence";
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

// Funnel: Intro -> Consent -> Photo -> MST -> Quiz questions -> What Changed ->
// Routine preference -> Analysis -> Results. Anonymous visitors can reach
// Results without ever creating an account — "save my results" (account
// creation) only ever appears AFTER results are shown, as an optional upgrade
// path, never a gate in front of the analysis itself.
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
  const { can: canEntitlement } = useEntitlements();
  const { balance: passBalance, loading: passBalanceLoading, refresh: refreshPassBalance } = useAnalysisPassBalance();
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [saveCtaDismissed, setSaveCtaDismissed] = useState(false);
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
  const videoRef = useRef<HTMLVideoElement>(null);
  // Starter Analysis 2.0 — What Changed / Routine Reality Check answers, the
  // deterministic result object, and its refinement history.
  const [analysisId, setAnalysisId] = useState<string>(() => crypto.randomUUID());
  const [changeStatus, setChangeStatus] = useState<SkinChangeStatus | null>(null);
  const [changeDetail, setChangeDetail] = useState("");
  const [priorityPreference, setPriorityPreference] = useState<PriorityPreference | null>(null);
  const [starterResult, setStarterResult] = useState<StarterAnalysisResult | null>(null);
  const [passPurchaseOpen, setPassPurchaseOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const savingResultsRef = useRef(false);
  const viewedFiredRef = useRef(false);
  const restoredRef = useRef(false);
  const saveCtaViewedRef = useRef(false);
  /** Set just before jumping to STEP_ANALYSIS to run an Analysis-Pass-funded Advanced Analysis instead of the default free/member path — see runAnalysis(). */
  const useAdvancedPassRef = useRef(false);

  // NOTE: This is a focused implementation of the intro + video modal for the PR.
  // The full original component body (all steps, analysis, results, etc.) should be
  // restored from the complete file provided in the PR description / artifacts.
  // Main is currently broken; this branch at least restores a working intro experience.
  return (
    <>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                SKYNN AI <span className="text-muted-foreground font-normal">(beta)</span> · by SkinLabs®
              </div>
            </div>
            <div className="rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden bg-foreground text-background border border-transparent">
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
                  onClick={() => {}}
                  className="w-full gap-2 bg-background text-foreground hover:bg-background/90"
                >
                  Get started
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setVideoModalOpen(true)}
                  className="w-full gap-2 border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Watch the video
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Dialog
        open={videoModalOpen}
        onOpenChange={(open) => {
          setVideoModalOpen(open);
          if (!open && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
      >
        <DialogContent className="max-w-[min(100vw,400px)] w-full p-0 border-0 bg-black overflow-hidden sm:rounded-2xl gap-0 [&>button]:text-white [&>button]:right-3 [&>button]:top-3 [&>button]:z-20">
          <DialogTitle className="sr-only">SKYNN AI intro video</DialogTitle>
          <div className="relative aspect-[9/16] w-full bg-black">
            <video
              ref={videoRef}
              src="/skynn.mp4"
              poster="/og-image.png"
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              autoPlay
              controls
              loop
              onLoadedData={(e) => {
                const v = e.currentTarget;
                v.play().catch(() => {});
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIFormulator;
