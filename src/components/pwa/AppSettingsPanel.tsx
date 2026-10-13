import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, HardDrive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import NotificationSettingsCard from "./NotificationSettingsCard";
import { Switch } from "@/components/ui/switch";
import { haptic, hapticsPreference, hapticsSupported, setHapticsPreference } from "@/lib/haptics";
import { useOfflinePodcasts } from "@/hooks/use-offline-podcasts";
import { usePWAStatus } from "@/hooks/use-pwa-status";
import { getDownloadedBytes, removeAllDownloads, removeDownload } from "@/lib/pwa/podcastCache";
import { clearCachedContent, formatBytes, getCachedContentStats, getStorageEstimate, type StorageEstimateInfo } from "@/lib/pwa/storage";
import { openInstallPrompt } from "@/lib/pwa/uiEvents";

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

/** Touch feedback preference. Hidden where the browser has no Vibration API (iOS Safari). */
const HapticsCard = () => {
  const [on, setOn] = useState(hapticsPreference);
  if (!hapticsSupported()) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Touch feedback</CardTitle>
        <CardDescription>A very short vibration when you tick a routine step, move through the quiz, like or save, or tap the bottom bar. It stays off when your device asks for reduced motion.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <label htmlFor="haptics-switch" className="text-sm font-medium">Vibration feedback</label>
        <Switch
          id="haptics-switch"
          checked={on}
          onCheckedChange={(next) => { setHapticsPreference(next); setOn(next); if (next) haptic(); }}
        />
      </CardContent>
    </Card>
  );
};

/** Dashboard → Settings → App: install, notifications and offline storage. Lazy-loaded by UserDashboard. */
const AppSettingsPanel = () => (
  <div className="space-y-6">
    <InstallCard />
    <NotificationSettingsCard />
    <HapticsCard />
    <OfflineStorageCard />
  </div>
);

export default AppSettingsPanel;
