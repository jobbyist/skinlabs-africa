import { useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePushCapability } from "@/hooks/use-push-capability";
import { CHECKIN_NUDGE_COOLDOWN_DAYS, STORAGE_KEYS } from "@/lib/pwa/constants";
import { IOS_HOME_SCREEN_STEPS } from "@/lib/pwa/pushCapability";
import { flagReminderIntent, runReminderOptIn, trackSoftAskAccepted, trackSoftAskShown } from "@/lib/pwa/pushOptIn";
import { DEFAULT_REMINDER_CLOCK, reminderLabel } from "@/lib/pwa/reminderTime";
import { local, withinDays } from "@/lib/pwa/storageUtil";

const dismissedRecently = (): boolean => withinDays(Number(local.get(STORAGE_KEYS.checkinNudgeDismissedAt)) || null, CHECKIN_NUDGE_COOLDOWN_DAYS);

/**
 * After the member's first successful routine check-in: one small, NON-modal card, "Want a nudge at 7:00 am tomorrow?".
 * Uses the single push capability + opt-in service (no permission logic of its own) and appears only when the device
 * can get push now (ready) or after installing (needs_install). "Not now" is remembered for 14 days.
 */
const FirstCheckinNudge = ({ onDone }: { onDone: () => void }) => {
  const { user } = useAuth();
  const { capability, loading } = usePushCapability();
  const [clock, setClock] = useState<string>(DEFAULT_REMINDER_CLOCK);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"ask" | "on" | "install" | "flagged" | "failed">("ask");
  const shown = useRef(false);
  const eligible = !loading && (capability === "ready" || capability === "needs_install") && !dismissedRecently();

  useEffect(() => {
    if (!user) return;
    void Promise.resolve(supabase.from("notification_preferences").select("routine_reminder_time").eq("user_id", user.id).maybeSingle()).then(({ data }) => {
      const t = (data as { routine_reminder_time?: string | null } | null)?.routine_reminder_time;
      if (t) setClock(t.slice(0, 5));
    });
  }, [user]);

  useEffect(() => {
    if (!eligible || shown.current) return;
    shown.current = true;
    trackSoftAskShown("first_checkin");
  }, [eligible]);

  // Keep the card on screen for its own confirmation (once subscribed the capability is no longer "ready").
  if (!user || !(eligible || state === "on" || state === "flagged")) return null;

  const notNow = () => {
    local.set(STORAGE_KEYS.checkinNudgeDismissedAt, String(Date.now()));
    onDone();
  };

  return (
    <Card className="border-primary/30 bg-primary/[0.03]" role="region" aria-label="Routine reminder">
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        {state === "on" ? (
          <p role="status" className="inline-flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> Done. We’ll nudge you at {reminderLabel(clock)} when you haven’t checked in yet.
          </p>
        ) : state === "flagged" ? (
          <p role="status" className="text-sm text-muted-foreground">Great. We’ll offer this when you first open the installed app.</p>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-[var(--shadow-xs)]">
                <BellRing className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium">Want a nudge at {reminderLabel(clock)} tomorrow?</p>
                <p className="mt-1 text-sm text-muted-foreground">One short reminder, only on days you haven’t checked in yet. Turn it off any time in Settings → App.</p>
                {state === "failed" && <p className="mt-1 text-sm text-muted-foreground" role="status">That didn’t work this time. You can turn it on later in Settings → App.</p>}
              </div>
            </div>
            {state === "install" && (
              <ol className="list-decimal space-y-1 pl-12 text-sm text-muted-foreground">
                {IOS_HOME_SCREEN_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            <div className="flex flex-wrap gap-2 pl-12">
              {state === "install" ? (
                <Button
                  size="sm"
                  onClick={() => {
                    flagReminderIntent(clock);
                    setState("flagged");
                  }}
                >
                  Remind me once it’s installed
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={busy}
                  aria-busy={busy}
                  onClick={async () => {
                    trackSoftAskAccepted("first_checkin");
                    if (capability === "needs_install") {
                      setState("install");
                      return;
                    }
                    setBusy(true);
                    // The click is the user gesture: the native prompt is only ever triggered from here.
                    const result = await runReminderOptIn({ surface: "first_checkin", userId: user.id, clockTime: clock });
                    setBusy(false);
                    setState(result.ok ? "on" : "failed");
                  }}
                >
                  {busy && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />} Yes
                </Button>
              )}
              <Button size="sm" variant="ghost" disabled={busy} onClick={notNow}>
                Not now
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FirstCheckinNudge;
