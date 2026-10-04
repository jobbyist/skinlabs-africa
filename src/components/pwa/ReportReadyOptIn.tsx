import { useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePushCapability } from "@/hooks/use-push-capability";
import { IOS_HOME_SCREEN_STEPS } from "@/lib/pwa/pushCapability";
import { flagReminderIntent, runReminderOptIn, trackSoftAskAccepted, trackSoftAskShown } from "@/lib/pwa/pushOptIn";

/** The intent value the installed app uses to open the report variant of the opt-in sheet. */
export const REPORT_INTENT = "report";

/**
 * "Notify me when my report is ready" on the pending screens. Same capability and opt-in service as every other
 * push surface. Shown only when the device can get push now (ready) or after installing (needs_install).
 *
 * The notification itself is deliberately generic ("Your SkinLabs® report is ready / Tap to read it securely in the
 * app"): no report content, score, concern or condition ever reaches a lock screen. Detail stays behind the tap.
 */
const ReportReadyOptIn = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { capability, loading } = usePushCapability();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (loading || shown.current || (capability !== "ready" && capability !== "needs_install")) return;
    shown.current = true;
    trackSoftAskShown("report_pending");
  }, [capability, loading]);

  if (!userId) return null;
  if (done) {
    return (
      <p role="status" className="inline-flex items-center gap-2 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> We’ll notify you when it’s ready.
      </p>
    );
  }
  if (loading || (capability !== "ready" && capability !== "needs_install")) return null;

  if (capability === "needs_install") {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Get a notification when your report is ready</p>
        <p className="mt-1 text-muted-foreground">On iPhone and iPad, notifications work from the installed app. Three quick steps:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          {IOS_HOME_SCREEN_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {flagged ? (
          <p className="mt-3 text-muted-foreground" role="status">Great. We’ll offer this when you first open the app.</p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              flagReminderIntent(REPORT_INTENT);
              setFlagged(true);
              trackSoftAskAccepted("report_pending");
            }}
          >
            Notify me once it’s installed
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
      <p className="font-medium">One notification when your report is ready</p>
      <p className="mt-1 text-muted-foreground">It only says your report is ready. Nothing about it appears on your lock screen. Your phone will ask permission next.</p>
      <Button
        className="mt-3 gap-2"
        disabled={busy}
        aria-busy={busy}
        onClick={async () => {
          setBusy(true);
          trackSoftAskAccepted("report_pending");
          // The click is the user gesture; the native prompt is only ever triggered from here.
          const result = await runReminderOptIn({ surface: "report_pending", userId: userId as string, clockTime: null, purpose: "report_ready" });
          setBusy(false);
          if (result.ok) setDone(true);
          else setMessage(result.reason === "not_configured" ? "Notifications aren’t switched on for SkinLabs® yet." : "No problem. You can turn notifications on later in Settings → App.");
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <BellRing className="h-4 w-4" aria-hidden="true" />} Notify me when my report is ready
      </Button>
      {message && <p className="mt-2 text-muted-foreground" role="status">{message}</p>}
    </div>
  );
};

export default ReportReadyOptIn;
