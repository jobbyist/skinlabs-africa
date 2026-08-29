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
                Premium Service
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                AI Formulator — A Routine Built Around Your Actual Skin
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Answer a few questions and get an AM/PM routine, a progress tracker and product
                recommendations reviewed by dermatologists — built around your skin, not a generic list.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                {["Personalized AM/PM Routines", "Weekly Actives Schedule", "SA Product Recommendations"].map((feature, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-sm text-card-foreground font-medium">{feature}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild className="gap-2">
                  <a href="/pricing">
                    <Sparkles className="h-4 w-4" />
                    Sign up to get started
                  </a>
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowAuthDialog(true)} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </section>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </>
    );
  }

  return (
    <section id="ai-formulator" className="py-20 bg-background">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>Please refresh — full formulator is loading from the signed-in experience.</p>
        <p className="mt-2 text-xs">If this persists, contact support@skinlabs.co.za</p>
      </div>
    </section>
  );
};

export default AIFormulator;
