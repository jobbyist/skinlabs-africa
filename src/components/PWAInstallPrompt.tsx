import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return; // 24 hours
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(isiOS);

    if (isiOS) {
      // Show iOS-specific prompt after delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Install SkinLabs®</p>
              <p className="text-xs text-muted-foreground">
                {isIOS
                  ? "Tap Share then 'Add to Home Screen'"
                  : "Add to your home screen for quick access"}
              </p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isIOS && deferredPrompt && (
          <Button onClick={handleInstall} className="w-full mt-3 gap-2" size="sm">
            <Download className="h-4 w-4" />
            Install App
          </Button>
        )}
        {isIOS && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2">
            <Share className="h-4 w-4 flex-shrink-0" />
            <span>Tap the <strong>Share</strong> button, then <strong>"Add to Home Screen"</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;