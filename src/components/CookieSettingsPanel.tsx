import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DEFAULT_COOKIE_PREFERENCES,
  readCookieConsent,
  writeCookieConsent,
  type CookiePreferences,
} from "@/lib/cookie-consent";
import { STORAGE_GROUPS, clearAllKnownStorage, countStoredKeys } from "@/lib/storage-preferences";
import { toast } from "sonner";

/**
 * Always-visible cookie settings + storage preferences, embedded directly on the
 * Cookie Policy page (as opposed to CookieConsent's floating first-visit banner,
 * which this component shares its read/write logic with via lib/cookie-consent).
 */
const CookieSettingsPanel = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_COOKIE_PREFERENCES);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [storedKeyCount, setStoredKeyCount] = useState(0);

  useEffect(() => {
    const record = readCookieConsent();
    if (record) {
      setPreferences(record.preferences);
      setSavedAt(record.timestamp);
    }
    setStoredKeyCount(countStoredKeys());
  }, []);

  const persist = (next: CookiePreferences) => {
    writeCookieConsent(next);
    setPreferences(next);
    setSavedAt(Date.now());
    toast.success("Cookie preferences saved");
  };

  const handleClearStorage = () => {
    clearAllKnownStorage();
    setStoredKeyCount(0);
    setPreferences(DEFAULT_COOKIE_PREFERENCES);
    setSavedAt(null);
    toast.success("Locally stored SkinLabs data cleared. You're still signed in if you were before.");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground">Cookie categories</h3>
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Saved {new Date(savedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Essential</p>
              <p className="text-xs text-muted-foreground">Always on — required for login, checkout and basic site function.</p>
            </div>
            <Switch checked disabled aria-label="Essential cookies (always on)" />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Analytics</p>
              <p className="text-xs text-muted-foreground">Helps us see which pages and features are actually used.</p>
            </div>
            <Switch
              checked={preferences.analytics}
              onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, analytics: checked }))}
              aria-label="Analytics cookies"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Personalisation</p>
              <p className="text-xs text-muted-foreground">Tailors recommendations and content to your skin profile.</p>
            </div>
            <Switch
              checked={preferences.personalisation}
              onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, personalisation: checked }))}
              aria-label="Personalisation cookies"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Targeted advertising</p>
              <p className="text-xs text-muted-foreground">Used to show relevant ads and measure campaign performance.</p>
            </div>
            <Switch
              checked={preferences.targetedAdvertising}
              onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, targetedAdvertising: checked }))}
              aria-label="Targeted advertising cookies"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button onClick={() => persist(preferences)}>Save preferences</Button>
          <Button variant="outline" onClick={() => persist({ analytics: true, personalisation: true, targetedAdvertising: true })}>
            Accept all
          </Button>
          <Button variant="outline" onClick={() => persist(DEFAULT_COOKIE_PREFERENCES)}>
            Reject non-essential
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-semibold text-foreground">Storage preferences</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Beyond cookies, SkinLabs stores a few things directly in your browser (not on our servers) to make the site
          work without an account — free-tier counters, liked briefings, podcast progress. Here's exactly what that
          is, and a way to clear it.
        </p>

        <div className="mt-4 space-y-2">
          {STORAGE_GROUPS.map((group) => (
            <div key={group.id} className="rounded-xl border border-border bg-background p-3.5">
              <p className="text-sm font-medium text-foreground">{group.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Clear all locally stored data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear locally stored SkinLabs data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This resets your cookie preferences, free-tier usage counters, liked/saved briefings and podcast
                  progress on this device. It does not sign you out or delete your account — your SkinLabs
                  membership and saved data on our servers are unaffected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearStorage}>Clear data</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            {storedKeyCount > 0
              ? `Currently storing data in ${storedKeyCount} of ${STORAGE_GROUPS.length} categories.`
              : "Nothing currently stored on this device."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CookieSettingsPanel;
