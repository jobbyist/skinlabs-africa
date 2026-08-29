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
  Download,
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
  const { isMember } = useMembership();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [skinImage, setSkinImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [resultTier, setResultTier] = useState<"free" | "premium">("free");
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

  // TEMP STUB - full file continues via second commit if needed
  return null;
};

export default AIFormulator;
