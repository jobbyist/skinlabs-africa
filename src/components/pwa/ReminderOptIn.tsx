import { useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushCapability } from "@/hooks/use-push-capability";
import { IOS_HOME_SCREEN_STEPS } from "@/lib/pwa/pushCapability";
import {
  flagReminderIntent,
  reminderLabel,
  runReminderOptIn,
  trackSoftAskAccepted,
  trackSoftAskShown,
  type OptInFailure,
  type PushSurface,
} from "@/lib/pwa/pushOptIn";

interface Props {
  surface: PushSurface;
  userId: string;
  /** "07:00" | "19:30"; omit to keep the member's saved reminder time. */
  clockTime?: string;
  className?: string;
}

const FAILURE_COPY: Partial<Record<OptInFailure, string>> = {
  not_configured: "Reminders aren’t switched on for SkinLabs® yet. Nothing has changed on your device.",
  failed: "We couldn’t turn reminders on this time. Please try again in a moment.",
  denied: "No problem. You can turn reminders on later in Settings → App.",
};


/**
 * The reminder soft ask, one component for every surface. What it shows follows the single push capability:
 *   ready          "Remind me at …" → our soft ask → (tap) native prompt → subscribe → confirmation push
 *   needs_install  the three Share-sheet steps as text, and a flag so the installed app offers the opt-in on first open
 *   denied         platform-specific re-enable steps; we never ask again
 *   subscribed     a quiet confirmation
 *   unsupported    nothing at all
 */
const ReminderOptIn = ({ surface, userId, clockTime, className }: Props) => {
  const { capability, loading, instructions } = usePushCapability();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [justEnabled, setJustEnabled] = useState(false);
  const [intentFlagged, setIntentFlagged] = useState(false);
  const shown = useRef(false);

  // Funnel: the soft ask is "shown" when the member sees the ask itself (ready) or the install steps (needs_install).
  useEffect(() => {
    if (loading || shown.current) return;
    if (capability === "needs_install") {
      shown.current = true;
      trackSoftAskShown(surface);
    }
  }, [capability, loading, surface]);

  if (loading || capability === "unsupported") return null;

  if (capability === "subscribed" || justEnabled) {
    return (
      <p role="status" className={`inline-flex items-center gap-2 text-sm font-medium ${className ?? ""}`}>
        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Reminders are on for this device.
      </p>
    );
  }

  if (capability === "denied") {
    return (
      <div className={`rounded-xl border border-border bg-muted/50 p-4 text-sm ${className ?? ""}`} role="status">
        <p className="font-medium">Reminders are blocked for SkinLabs®</p>
        <p className="mt-1 text-muted-foreground">{instructions.title}:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          {instructions.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    );
  }

  if (capability === "needs_install") {
    return (
      <div className={`rounded-xl border border-border bg-muted/50 p-4 text-sm ${className ?? ""}`}>
        <p className="font-medium">Get reminders on your iPhone</p>
        <p className="mt-1 text-muted-foreground">On iPhone and iPad, reminders work from the installed app. Three quick steps:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          {IOS_HOME_SCREEN_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {intentFlagged ? (
          <p className="mt-3 text-muted-foreground" role="status">Great. We’ll offer your {reminderLabel(clockTime ?? null)} reminder when you first open the app.</p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              flagReminderIntent(clockTime ?? null);
              setIntentFlagged(true);
              trackSoftAskAccepted(surface);
            }}
          >
            Remind me once it’s installed
          </Button>
        )}
      </div>
    );
  }

  // capability === "ready"
  if (!asking) {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            setAsking(true);
            trackSoftAskShown(surface);
          }}
        >
          <BellRing className="h-4 w-4" aria-hidden="true" /> Remind me at {reminderLabel(clockTime ?? null)}
        </Button>
        {message && <p className="mt-2 text-sm text-muted-foreground" role="status">{message}</p>}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-muted/50 p-4 text-sm ${className ?? ""}`} role="group" aria-label="Reminder notifications">
      <p className="font-medium">One short reminder at {reminderLabel(clockTime ?? null)}</p>
      <p className="mt-1 text-muted-foreground">Only if you haven’t checked in yet that day. Your phone will ask permission next. Turn it off any time in Settings → App.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy}
          aria-busy={busy}
          className="gap-2"
          onClick={async () => {
            setBusy(true);
            trackSoftAskAccepted(surface);
            // The click is the user gesture: the native prompt is only ever triggered from here.
            const result = await runReminderOptIn({ surface, userId, clockTime: clockTime ?? null });
            setBusy(false);
            if (result.ok) {
              setJustEnabled(true);
            } else {
              setAsking(false);
              setMessage(FAILURE_COPY[result.reason] ?? null);
            }
          }}
        >
          {busy && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />} Allow reminders
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => setAsking(false)}>
          Not now
        </Button>
      </div>
    </div>
  );
};

export default ReminderOptIn;
