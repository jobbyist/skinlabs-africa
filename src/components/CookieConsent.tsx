import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import {
  DEFAULT_COOKIE_PREFERENCES,
  type CookiePreferences,
} from "@/lib/cookie-consent";

/** Dispatch this to reopen the banner on demand, e.g. from the Cookie Policy page. */
export const OPEN_COOKIE_PREFERENCES_EVENT = "skinlabs:open-cookie-preferences";

/**
 * Presentation-only cookie consent banner.
 * Persistence, expiry, and auth sync live in useCookieConsent().
 * Mount exactly once at the application root (App.tsx).
 */
const CookieConsent = () => {
  const {
    status,
    shouldShowBanner,
    preferences: storedPreferences,
    acceptConsent,
    rejectConsent,
    savePreferences,
    openPreferences,
  } = useCookieConsent();

  const [showPreferences, setShowPreferences] = useState(true);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_COOKIE_PREFERENCES);

  useEffect(() => {
    setPreferences(storedPreferences);
  }, [storedPreferences]);

  useEffect(() => {
    const handler = () => openPreferences();
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handler);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handler);
  }, [openPreferences]);

  if (status === "initializing" || !shouldShowBanner) return null;

  const handleSave = () => void savePreferences(preferences);
  const handleAcceptAll = () =>
    void acceptConsent({ analytics: true, personalisation: true, targetedAdvertising: true });
  const handleRejectNonEssential = () => void rejectConsent();

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
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, targetedAdvertising: checked }))
                }
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
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, personalisation: checked }))
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="cookie-pref-analytics" className="text-sm text-foreground">
                  Analytics
                </label>
                <Switch
                  id="cookie-pref-analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, analytics: checked }))
                  }
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
