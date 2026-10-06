import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import NotificationPreferencesList from "./NotificationPreferencesList";
import { useAuth } from "@/hooks/use-auth";
import { usePushCapability } from "@/hooks/use-push-capability";
import { openSignupDialog } from "@/lib/conversionDialogs";
import { trackPwaEvent } from "@/lib/pwa/analytics";
import { STORAGE_KEYS } from "@/lib/pwa/constants";
import { openInstallPrompt } from "@/lib/pwa/uiEvents";
import { local } from "@/lib/pwa/storageUtil";
import {
  DEFAULT_PREFERENCES,
  isConfigured,
  PROMPT_CATEGORIES,
  requestPermission,
  savePreferences,
  subscribe,
  type NotificationPreferences,
  type SubscribeFailure,
} from "@/lib/pwa/notificationManager";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Phase = "intro" | "working" | "done" | "problem";

const PROBLEM_COPY: Record<SubscribeFailure | "blocked", string> = {
  unsupported: "This browser can’t receive SkinLabs® notifications. Your account and everything else work as normal.",
  needs_install: "On iPhone and iPad, notifications are available once SkinLabs® is added to your Home Screen. Install the app, open it from your Home Screen, then turn notifications on.",
  not_configured: "Notifications aren’t switched on for SkinLabs® yet. Nothing has been changed on your device.",
  not_signed_in: "Sign in to turn on notifications for your account.",
  denied: "Notifications are blocked for SkinLabs® in your browser or device settings. You can allow them there, then come back and try again.",
  failed: "We couldn’t turn notifications on this time. Please try again in a moment.",
  blocked: "Notifications are blocked for SkinLabs® in your browser or device settings. You can allow them there, then come back and try again.",
};

/**
 * "Stay in the loop" — the branded permission flow. The browser's permission dialog is only ever
 * triggered by the "Enable notifications" button here (an explicit user gesture), never on page load.
 * The member picks what they want first; marketing stays off unless they switch it on.
 */
const NotificationPermissionPrompt = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { capability, instructions } = usePushCapability();
  const [prefs, setPrefs] = useState<NotificationPreferences>({ ...DEFAULT_PREFERENCES, podcast_episode: true, briefing: true });
  const [phase, setPhase] = useState<Phase>("intro");
  const [problem, setProblem] = useState<SubscribeFailure | "blocked" | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("intro");
    setProblem(null);
    trackPwaEvent("push_prompt_viewed", { capability, surface: "settings" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const later = () => {
    local.set(STORAGE_KEYS.notifyPromptDismissedAt, String(Date.now()));
    onOpenChange(false);
  };

  const enable = async () => {
    if (!user) {
      onOpenChange(false);
      openSignupDialog("signin");
      return;
    }
    if (capability === "unsupported" || capability === "needs_install" || capability === "denied") {
      setProblem(capability === "denied" ? "blocked" : capability);
      setPhase("problem");
      return;
    }
    if (!isConfigured()) {
      setProblem("not_configured");
      setPhase("problem");
      return;
    }
    setPhase("working");
    // Explicit user gesture: this is the only place the browser permission dialog is triggered.
    const permission = await requestPermission("settings");
    if (permission !== "granted") {
      setProblem(permission === "denied" ? "blocked" : "denied");
      setPhase("problem");
      return;
    }
    const result = await subscribe("settings");
    if (!result.ok) {
      setProblem(result.reason);
      setPhase("problem");
      return;
    }
    await savePreferences(user.id, prefs, PROMPT_CATEGORIES);
    setPhase("done");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : later())}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md gap-5 rounded-2xl p-6 sm:p-7 max-h-[calc(100dvh-2rem)] overflow-y-auto"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <DialogHeader className="items-center gap-3 text-center sm:text-center">
          <span className="gradient-bg-soft flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-border" aria-hidden="true">
            <BellRing className="h-6 w-6 text-foreground" />
          </span>
          <DialogTitle className="font-heading text-2xl tracking-tight">
            {phase === "done" ? "You’re all set" : "Stay in the loop"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {phase === "done"
              ? "Notifications are on for this device. You can change what you receive any time in Dashboard → Settings → App."
              : "Choose the SkinLabs® updates you’d like on this device. You can change this or turn it off whenever you want."}
          </DialogDescription>
        </DialogHeader>

        {(phase === "intro" || phase === "working") && (
          <NotificationPreferencesList value={prefs} onChange={setPrefs} categories={PROMPT_CATEGORIES} disabled={phase === "working"} idPrefix="prompt-notif" />
        )}

        {phase === "problem" && problem && (
          <div role="alert" className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            {PROBLEM_COPY[problem]}
            {problem === "blocked" && (
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {instructions.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            {problem === "needs_install" && (
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => { onOpenChange(false); openInstallPrompt(); }}>
                Show me how to install
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:flex-col sm:space-x-0">
          {phase === "done" || phase === "problem" ? (
            <Button size="lg" className="w-full" onClick={() => onOpenChange(false)}>
              {phase === "done" ? "Done" : "Close"}
            </Button>
          ) : (
            <>
              <Button size="lg" className="w-full gap-2" onClick={() => void enable()} disabled={phase === "working"} aria-busy={phase === "working"}>
                {phase === "working" && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
                Enable notifications
              </Button>
              <Button variant="ghost" className="w-full" onClick={later} disabled={phase === "working"}>
                Maybe later
              </Button>
            </>
          )}
          <p className="text-center text-[11px] text-muted-foreground">
            Your device only asks for permission after you press “Enable notifications”.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPermissionPrompt;
