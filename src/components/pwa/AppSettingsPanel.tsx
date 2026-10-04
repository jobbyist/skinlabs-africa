import { useCallback, useEffect, useState } from "react";
import { BellRing, CheckCircle2, Download, HardDrive, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import NotificationPreferencesList from "./NotificationPreferencesList";
import { useAuth } from "@/hooks/use-auth";
import { useOfflinePodcasts } from "@/hooks/use-offline-podcasts";
import { usePWAStatus } from "@/hooks/use-pwa-status";
import { usePushCapability } from "@/hooks/use-push-capability";
import { getDownloadedBytes, removeAllDownloads, removeDownload } from "@/lib/pwa/podcastCache";
import {
  DEFAULT_PREFERENCES,
  isConfigured,
  loadPreferences,
  savePreferences,
  sendTestNotification,
  unsubscribe,
  type NotificationPreferences,
} from "@/lib/pwa/notificationManager";
import { clearCachedContent, formatBytes, getCachedContentStats, getStorageEstimate, type StorageEstimateInfo } from "@/lib/pwa/storage";
import { openInstallPrompt, openNotificationPrompt } from "@/lib/pwa/uiEvents";

const InstallCard = () => {
  const status = usePWAStatus();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="h-4 w-4" aria-hidden="true" /> SkinLabs® app
        </CardTitle>
        <CardDescription>Add SkinLabs® to your home screen for full-screen, app-style access.</CardDescription>
      </CardHeader>
      <CardContent>
        {status.isInstalled ? (
          <p className="inline-flex items-center gap-2 text-sm font-medium" role="status">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {status.isStandalone ? "You’re using the installed app." : "SkinLabs® is installed on this device."}
          </p>
        ) : status.isInstallable ? (
          <Button onClick={openInstallPrompt}>{status.needsIosInstructions ? "Show me how to install" : "Install SkinLabs®"}</Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            {status.isInAppBrowser
              ? "Open SkinLabs® in your regular browser (Safari or Chrome) to install it."
              : "Installing isn’t available in this browser. Chrome, Edge and Safari support it."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const NotificationsCard = () => {
  const { user } = useAuth();
  const { capability, loading: capabilityLoading, instructions, refresh: refreshCapability } = usePushCapability();
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (user) {
        const loaded = await loadPreferences(user.id);
        if (!cancelled) setPrefs(loaded);
      }
      if (!cancelled) setPrefsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const changePrefs = async (next: NotificationPreferences) => {
    if (!user) return;
    setPrefs(next);
    const result = await savePreferences(user.id, next);
    if (result === "failed") toast.error("Couldn’t save your notification choices. Please try again.");
    else if (result === "queued") toast.message("You’re offline — we’ll save this when you’re back online.");
  };

  const turnOff = async () => {
    setBusy(true);
    const ok = await unsubscribe();
    setBusy(false);
    await refreshCapability();
    if (ok) toast.success("Notifications are off on this device.");
    else toast.error("Couldn’t turn notifications off. Please try again.");
  };

  const test = async () => {
    setBusy(true);
    const ok = await sendTestNotification();
    setBusy(false);
    if (ok) toast.success("Test notification sent to your devices.");
    else toast.error("Couldn’t send a test notification right now.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4" aria-hidden="true" /> Notifications
        </CardTitle>
        <CardDescription>Choose what SkinLabs® can notify you about on your devices.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {capabilityLoading || prefsLoading ? (
          <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />
        ) : capability === "unsupported" ? (
          <p className="text-sm text-muted-foreground">This browser can’t receive push notifications.</p>
        ) : !isConfigured() ? (
          <p className="text-sm text-muted-foreground">Push notifications aren’t switched on for SkinLabs® yet.</p>
        ) : capability === "needs_install" ? (
          <p className="text-sm text-muted-foreground">On iPhone and iPad, install SkinLabs® to your Home Screen first, then open it from there to enable notifications.</p>
        ) : capability === "denied" ? (
          <div className="text-sm text-muted-foreground" role="status">
            <p>Notifications are blocked for SkinLabs® in your browser or device settings. {instructions.title}:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {instructions.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : (
          <>
            {capability === "subscribed" ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium" role="status">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> On for this device
                </span>
                <Button variant="outline" size="sm" onClick={() => void test()} disabled={busy}>
                  Send a test
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void turnOff()} disabled={busy}>
                  Turn off
                </Button>
              </div>
            ) : (
              <Button onClick={openNotificationPrompt}>Enable notifications</Button>
            )}
            {user && capability === "subscribed" && <NotificationPreferencesList value={prefs} onChange={(next) => void changePrefs(next)} idPrefix="settings-notif" />}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const OfflineStorageCard = () => {
  const { downloads, supported } = useOfflinePodcasts();
  const [estimate, setEstimate] = useState<StorageEstimateInfo | null>(null);
  const [cached, setCached] = useState<{ entries: number; bytes: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const podcast = getDownloadedBytes();

  const measure = useCallback(async () => {
    setEstimate(await getStorageEstimate());
    setCached(await getCachedContentStats());
  }, []);

  useEffect(() => {
    void measure();
  }, [measure, downloads.length]);

  if (!supported) return null;
  const finished = downloads.filter((d) => d.status === "downloaded");

  const clearPodcasts = async () => {
    setBusy(true);
    await removeAllDownloads();
    setBusy(false);
    toast.success("Podcast downloads removed.");
  };
  const clearCache = async () => {
    setBusy(true);
    await clearCachedContent();
    await measure();
    setBusy(false);
    toast.success("Cached pages and images cleared. You’re still signed in.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HardDrive className="h-4 w-4" aria-hidden="true" /> Offline storage
        </CardTitle>
        <CardDescription>Downloaded podcast episodes and cached public pages on this device. Clearing never signs you out.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {estimate && (
          <div className="space-y-1.5">
            <Progress value={estimate.percentUsed} className="h-1.5" aria-label="Browser storage used by SkinLabs" />
            <p className="text-xs text-muted-foreground">
              {formatBytes(estimate.usage)} used of about {formatBytes(estimate.quota)} · {formatBytes(estimate.available)} available (browser estimate)
            </p>
          </div>
        )}

        <div>
          <h4 className="mb-2 text-sm font-medium">
            Downloaded episodes ({podcast.episodes}) · {formatBytes(podcast.bytes)}
          </h4>
          {finished.length === 0 ? (
            <p className="text-sm text-muted-foreground">No episodes saved for offline listening yet. Use “Save offline” on any podcast episode.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {finished.map((d) => (
                <li key={d.slug} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm" title={d.title}>
                    {d.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(d.totalBytes)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void removeDownload(d.slug)} aria-label={`Remove download: ${d.title}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {finished.length > 0 && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void clearPodcasts()} disabled={busy}>
              Remove all downloads
            </Button>
          )}
        </div>

        <div>
          <h4 className="mb-1 text-sm font-medium">Cached pages and images</h4>
          <p className="mb-2 text-sm text-muted-foreground">
            {cached ? `${cached.entries.toLocaleString()} items · ${formatBytes(cached.bytes)}` : "Calculating…"}
          </p>
          <Button variant="outline" size="sm" onClick={() => void clearCache()} disabled={busy || !cached || cached.entries === 0}>
            Clear cached content
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/** Dashboard → Settings → App: install, notifications and offline storage. Lazy-loaded by UserDashboard. */
const AppSettingsPanel = () => (
  <div className="space-y-6">
    <InstallCard />
    <NotificationsCard />
    <OfflineStorageCard />
  </div>
);

export default AppSettingsPanel;
