import { useEffect } from "react";
import { Check, Download, PlusSquare, Share } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePWAStatus } from "@/hooks/use-pwa-status";
import { promptNativeInstall, recordInstallDismissed, type InstallExperience } from "@/lib/pwa/install";
import { trackPwaEvent } from "@/lib/pwa/analytics";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience: Exclude<InstallExperience, null>;
}

const BENEFITS = [
  "Open SkinLabs® straight from your home screen",
  "Full-screen, app-style experience",
  "Download podcast episodes to listen offline",
];

const IOS_STEPS = [
  { icon: Share, title: "Tap the Share button", detail: "The square with an arrow, in Safari’s toolbar." },
  { icon: PlusSquare, title: "Choose “Add to Home Screen”", detail: "Scroll the share sheet if you don’t see it." },
  { icon: Check, title: "Tap “Add”", detail: "SkinLabs® appears on your home screen." },
];

/**
 * Branded install dialog. Two experiences from one component:
 *  - "native": Chromium/Android/desktop — one button opens the browser's own
 *    install dialog from the `beforeinstallprompt` event captured at boot.
 *  - "ios": iOS/iPadOS Safari has no install API, so it shows the Share →
 *    Add to Home Screen steps (text + icons, never icons alone).
 * Built on the app's Dialog (focus trap, Escape, aria labelling come from Radix).
 * It never opens by itself — PWAProvider decides when (see resolveInstallExperience).
 */
const PWAInstallPrompt = ({ open, onOpenChange, experience }: Props) => {
  const status = usePWAStatus();
  const isIos = experience === "ios";

  useEffect(() => {
    if (!open) return;
    trackPwaEvent("pwa_install_prompt_viewed", { kind: experience });
  }, [open, experience]);

  // Installed (appinstalled) while the dialog is open → close it.
  useEffect(() => {
    if (open && status.isInstalled) onOpenChange(false);
  }, [open, status.isInstalled, onOpenChange]);

  const dismiss = () => {
    recordInstallDismissed();
    trackPwaEvent("pwa_install_prompt_dismissed", { kind: experience });
    onOpenChange(false);
  };

  const install = async () => {
    const outcome = await promptNativeInstall();
    if (outcome === "dismissed") recordInstallDismissed();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : dismiss())}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md gap-5 rounded-2xl p-6 sm:p-7 max-h-[calc(100dvh-2rem)] overflow-y-auto"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <DialogHeader className="items-center gap-3 text-center sm:text-center">
          <img src="/pwa-192.png" alt="" width={64} height={64} className="h-16 w-16 rounded-2xl shadow-md ring-1 ring-border" />
          <DialogTitle className="font-heading text-2xl tracking-tight">
            Take <span className="gradient-text">SkinLabs®</span> with you.
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Install the SkinLabs® app for faster access to your skin intelligence, routines, podcasts and personalised experience.
          </DialogDescription>
        </DialogHeader>

        {isIos ? (
          <ol className="space-y-3" aria-label="How to install SkinLabs on iPhone or iPad">
            {IOS_STEPS.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {step.title}
                    <step.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="space-y-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="gap-2 sm:flex-col sm:space-x-0">
          {isIos ? (
            <Button size="lg" className="w-full" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          ) : (
            <Button size="lg" className="w-full gap-2" onClick={install}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Install SkinLabs®
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={dismiss}>
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPrompt;
