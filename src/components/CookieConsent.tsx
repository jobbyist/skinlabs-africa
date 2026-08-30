import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_COOKIE_PREFERENCES,
  isCookieConsentFresh,
  readCookieConsent,
  writeCookieConsent,
  type CookiePreferences,
} from "@/lib/cookie-consent";

const SHOW_AFTER_MS = 1_200;

/** Dispatch this to reopen the banner on demand, e.g. a "Cookie Settings" button on the Cookie Policy page. */
export const OPEN_COOKIE_PREFERENCES_EVENT = "skinlabs:open-cookie-preferences";

const CookieConsent = () => {
  const { user, loading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(true);
  const [preferences, setPreferences] = useState<CookiePreferences>(
    () => readCookieConsent()?.preferences ?? DEFAULT_COOKIE_PREFERENCES,
  );
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Wait for auth state to resolve so a signed-in visitor never sees a flash of the banner.
    if (authLoading) return;
    if (user) {
      setIsVisible(false);
      return;
    }

    if (isCookieConsentFresh(readCookieConsent())) return;

    timerRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, SHOW_AFTER_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [authLoading, user]);

  useEffect(() => {
    const openPreferences = () => {
      setPreferences(readCookieConsent()?.preferences ?? DEFAULT_COOKIE_PREFERENCES);
      setShowPreferences(true);
      setIsVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
  }, []);

  const persist = (nextPreferences: CookiePreferences) => {
    writeCookieConsent(nextPreferences);
    setIsVisible(false);
  };

  const handleSave = () => persist(preferences);
  const handleAcceptAll = () => persist({ analytics: true, personalisation: true, targetedAdvertising: true });
  const handleRejectNonEssential = () => persist({ ...DEFAULT_COOKIE_PREFERENCES });

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm"
      role="dialog"
      aria-label="Cookie consent settings"
      aria-live="polite"
    >
      <div className="relative rounded-t-3xl border border-border bg-background p-6 shadow-2xl sm:rounded-3xl">
        <button
          type="button"
          onClick={handleRejectNonEssential}
          aria-label="Close and continue with only essential cookies"
          className="absolute right-4 top-4 rounded-full p-1 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="pr-8 text-sm leading-relaxed text-foreground">
          This website utilises technologies such as cookies to enable essential site functionality, as well as for
          analytics, personalisation, and targeted advertising. You may change your settings at any time or accept
          the default settings. You may close this banner to continue with only essential cookies.
        </p>

        <a href="/privacy-policy" className="mt-3 block text-sm font-medium text-foreground underline underline-offset-2">
          Privacy Policy
        </a>

        <button
          type="button"
          onClick={() => setShowPreferences((prev) => !prev)}
          aria-expanded={showPreferences}
          className="mt-2 block text-sm font-medium text-foreground underline underline-offset-2"
        >
          Storage Preferences
        </button>

        {showPreferences && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="cookie-pref-ads" className="text-sm text-foreground">
                Targeted Advertising
              </label>
              <Switch
                id="cookie-pref-ads"
                checked={preferences.targetedAdvertising}
                onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, targetedAdvertising: checked }))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                <label htmlFor="cookie-pref-personalisation" className="text-sm text-foreground">
                  Personalisation
                </label>
                <Switch
                  id="cookie-pref-personalisation"
                  checked={preferences.personalisation}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, personalisation: checked }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="cookie-pref-analytics" className="text-sm text-foreground">
                  Analytics
                </label>
                <Switch
                  id="cookie-pref-analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, analytics: checked }))}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          <Button onClick={handleSave} className="w-full justify-center rounded-xl py-6 text-base font-semibold">
            Save
          </Button>
          <Button onClick={handleAcceptAll} className="w-full justify-center rounded-xl py-6 text-base font-semibold">
            Accept All
          </Button>
          <Button
            onClick={handleRejectNonEssential}
            className="w-full justify-center rounded-xl py-6 text-base font-semibold"
          >
            Reject Non-Essential
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
