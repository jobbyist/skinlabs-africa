import { useState, useEffect, useRef } from "react";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "skinlabs_cookie_consent";
const CONSENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SHOW_AFTER_MS = 90_000;

type ConsentRecord = {
  accepted: boolean;
  timestamp: number;
};

const readConsent = (): ConsentRecord | null => {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (typeof parsed.timestamp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const isConsentFresh = (record: ConsentRecord | null) => {
  if (!record) return false;
  return Date.now() - record.timestamp < CONSENT_TTL_MS;
};

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const existing = readConsent();
    if (isConsentFresh(existing)) return;

    timerRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, SHOW_AFTER_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const persist = (accepted: boolean) => {
    const consentData: ConsentRecord = { accepted, timestamp: Date.now() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[45] border-t border-border bg-background/95 shadow-lg backdrop-blur-lg"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex flex-1 items-start gap-3">
            <Cookie className="mt-1 h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" />
            <div className="flex-1">
              <h3 className="mb-0.5 text-sm font-semibold text-foreground sm:text-base">Cookie consent</h3>
              <p className="text-xs text-muted-foreground sm:text-sm">
                We use cookies so the site works, to understand what is useful, and occasionally for marketing.{" "}
                <a href="/cookie-policy" className="text-primary hover:underline">
                  Cookie policy
                </a>
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <Button variant="outline" size="sm" onClick={() => persist(false)} className="flex-1 md:flex-none">
              Decline
            </Button>
            <Button variant="default" size="sm" onClick={() => persist(true)} className="flex-1 md:flex-none">
              Accept
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => persist(false)}
              className="shrink-0"
              aria-label="Dismiss cookie banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
