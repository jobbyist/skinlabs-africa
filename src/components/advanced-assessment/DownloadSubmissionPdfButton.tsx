import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getAdvancedAssessmentSession } from "@/lib/assessment/client";
import { trackSkynnEvent } from "@/lib/skynn/analytics";

/**
 * Downloads the member's branded summary of one Advanced AI Dermatology
 * Analysis submission (their answers, reference and status — never a report).
 * Everything is read with the member's own session, so it can only ever
 * produce their own data.
 */
const DownloadSubmissionPdfButton = ({
  sessionId,
  source,
  size = "sm",
  variant = "outline",
}: {
  sessionId: string;
  source: "dashboard" | "status_page" | "confirmation";
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "default";
}) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { session, definition, report } = await getAdvancedAssessmentSession(sessionId);
      if (!report) throw new Error("not_submitted");
      const linked = session as typeof session & { basic_analysis_id?: string | null; prefilled_question_ids?: string[] | null };
      let basicAnalysisDate: string | null = null;
      if (linked.basic_analysis_id) {
        const { data } = await supabase
          .from("skincare_recommendations")
          .select("created_at")
          .eq("id", linked.basic_analysis_id)
          .maybeSingle();
        basicAnalysisDate = data?.created_at ?? null;
      }
      const { downloadAdvancedSubmissionPdf } = await import("@/lib/assessment/generateAdvancedSubmissionPdf");
      await downloadAdvancedSubmissionPdf({
        memberName: (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Member",
        email: user?.email ?? "",
        submission: {
          reference_number: report.reference_number ?? null,
          submitted_at: report.submitted_at ?? null,
          created_at: report.submitted_at ?? new Date().toISOString(),
          generation_status: report.generation_status,
          review_status: report.review_status ?? null,
          processing_mode: report.processing_mode ?? null,
          intake_status: report.intake_status ?? null,
        },
        responses: session.responses ?? {},
        definition,
        basicAnalysisDate,
        prefilledCount: linked.prefilled_question_ids?.length ?? 0,
      });
      trackSkynnEvent("skynn_results_pdf_downloaded", { mode: "advanced", source });
    } catch {
      trackSkynnEvent("skynn_error", { mode: "advanced", error_category: "pdf_failed", source });
      toast.error("The PDF didn't download this time. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size={size} variant={variant} onClick={() => void download()} disabled={busy} className="gap-2">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Download submission PDF
    </Button>
  );
};

export default DownloadSubmissionPdfButton;
