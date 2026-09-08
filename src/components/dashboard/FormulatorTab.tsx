import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, UserCog, Sparkles, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import AIFormulator from "@/components/AIFormulator";
import SavedAnalysisCard, { type SavedRecommendationRow } from "@/components/dashboard/SavedAnalysisCard";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useProfileComplete } from "@/hooks/use-profile-complete";
import { supabase } from "@/integrations/supabase/client";

interface FormulatorTabProps {
  /** Switches the dashboard to the Profile tab so the member can fill the gaps. */
  onGoToProfile: () => void;
}

/** Previous skin assessments — real history from skincare_recommendations, most recent first. */
const AnalysisHistory = () => {
  const { user } = useAuth();
  const [recs, setRecs] = useState<SavedRecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("skincare_recommendations")
      .select("id, skin_type, concerns, created_at, status, mst_tone, analysis_completeness, result_payload")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRecs(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (recs.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No previous assessments yet — start your first analysis above.</p>;
  }

  return (
    <div>
      {recs.map((rec) => <SavedAnalysisCard key={rec.id} rec={rec} />)}
    </div>
  );
};

/**
 * Dashboard-embedded AI Formulator.
 *
 * Two gates run before the flow renders: an active membership (Insider, VIP or a
 * live trial) and a completed profile — the same completeness rule the database
 * enforces for member actions. Once both pass, the full skin-profile flow runs
 * inline (with a History sub-tab of every previous assessment) and the PDF export
 * is produced at the end of the analysis.
 */
const FormulatorTab = ({ onGoToProfile }: FormulatorTabProps) => {
  const { tier, isTrialing, trialEndsAt, loading: membershipLoading } = useMembership();
  const { isComplete, missing, loading: profileLoading } = useProfileComplete();

  if (membershipLoading || profileLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (tier === "explorer") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" /> Members only
          </CardTitle>
          <CardDescription>
            The full AI skin profile — selfie analysis, AM/PM routine, actives schedule and PDF export — is
            included with Glow Insider and Glow VIP. Start the 7-day Insider trial free, no card needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/pricing">See membership plans</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/skynn-ai">Try the free starter version</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" /> Complete your profile first
          </CardTitle>
          <CardDescription>
            Your analysis is built on your skin baseline, so we need a few details before it can run. Still
            missing: {missing.join(", ")}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGoToProfile}>Complete my profile</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="new" className="space-y-4">
      <TabsList>
        <TabsTrigger value="new" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> New analysis</TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> Previous assessments</TabsTrigger>
      </TabsList>

      <TabsContent value="new" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>
            {isTrialing
              ? `Trial access active${trialEndsAt ? ` until ${new Date(trialEndsAt).toLocaleDateString()}` : ""} — your full report downloads as a PDF when the analysis finishes.`
              : "Your full report downloads as a PDF when the analysis finishes."}
          </span>
        </div>
        <AIFormulator />
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Your skin analysis history</CardTitle>
            <CardDescription>Every AI skincare recommendation generated for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalysisHistory />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default FormulatorTab;
