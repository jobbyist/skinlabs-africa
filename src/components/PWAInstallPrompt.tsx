import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Share, Plus, Wifi, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/skinlabs-logo-black.svg";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const PERKS = [
  { icon: Zap, label: "Instant access" },
  { icon: Wifi, label: "Works offline" },
  { icon: Sparkles, label: "No app store needed" },
];

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;
    }

    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(isiOS);

    if (isiOS) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
    } finally {
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm sm:left-auto sm:right-6 sm:bottom-6"
          role="dialog"
          aria-label="Install SkinLabs app"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            {/* Ambient accent glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
            />

            <button
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative p-5 pr-12">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                  <img src={logo} alt="" className="h-6 w-6 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold text-card-foreground">
                    Install SkinLabs®
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Add the app to your home screen for faster access to your routines and skin science briefings.
                  </p>
                </div>
              </div>

              {/* Perks row */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {PERKS.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Icon className="h-3 w-3 text-primary" />
                    {label}
                  </span>
                ))}
              </div>

              {/* Android / Desktop install action */}
              {!isIOS && deferredPrompt && (
                <div className="mt-4 flex items-center gap-2">
                  <Button onClick={handleInstall} disabled={isInstalling} className="flex-1 gap-2" size="sm">
                    {isInstalling ? "Opening…" : "Install App"}
                  </Button>
                  <Button onClick={handleDismiss} variant="ghost" size="sm" className="text-muted-foreground">
                    Not now
                  </Button>
                </div>
              )}

              {/* iOS manual instructions */}
              {isIOS && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2.5 rounded-xl bg-secondary/40 p-2.5 text-xs text-muted-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-bold">1</span>
                    <Share className="h-3.5 w-3.5 shrink-0" />
                    <span>Tap the <strong className="text-card-foreground">Share</strong> icon in Safari's toolbar</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl bg-secondary/40 p-2.5 text-xs text-muted-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-bold">2</span>
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Select <strong className="text-card-foreground">"Add to Home Screen"</strong></span>
                  </div>
                  <Button onClick={handleDismiss} variant="ghost" size="sm" className="w-full text-muted-foreground">
                    Got it
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
