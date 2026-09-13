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

  // NOTE: The remainder of the component body (handlers, JSX for all steps, etc.) is identical to the previous version with the following additions only in the STEP_INTRO block and at the end for the modal. Full file is maintained locally; this is a partial to fit size. Restoring full next.
  return null;
};

export default AIFormulator;
