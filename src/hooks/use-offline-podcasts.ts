import { useEffect, useSyncExternalStore } from "react";
import {
  getDownloadsSnapshot,
  getServerDownloadsSnapshot,
  isOfflineDownloadSupported,
  loadDownloads,
  subscribeDownloads,
  type DownloadRecord,
} from "@/lib/pwa/podcastCache";

/** Reactive view of the member's offline podcast downloads (metadata from IndexedDB, audio in Cache Storage). */
export const useOfflinePodcasts = () => {
  const downloads = useSyncExternalStore(subscribeDownloads, getDownloadsSnapshot, getServerDownloadsSnapshot);
  useEffect(() => {
    void loadDownloads();
  }, []);
  const supported = typeof window !== "undefined" && isOfflineDownloadSupported();
  const bySlug = (slug: string): DownloadRecord | undefined => downloads.find((d) => d.slug === slug);
  return { downloads, supported, bySlug };
};
