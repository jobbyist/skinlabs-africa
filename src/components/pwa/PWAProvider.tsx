import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { lazyWithRetry } from "@/lib/chunkRecovery";
import OfflineBanner from "./OfflineBanner";
import { useAuth } from "@/hooks/use-auth";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { usePWAStatus } from "@/hooks/use-pwa-status";
import { isCookieConsentFresh } from "@/lib/cookie-consent";
import { isSafeReturnTo } from "@/lib/pendingIntent";
import { supabase } from "@/integrations/supabase/client";
import { setBadge } from "@/lib/pwa/badge";
import { markAppInstalledOnce } from "@/lib/pwa/appInstalled";
import { clearReminderIntent, readReminderIntent } from "@/lib/pwa/pushOptIn";
import { getPushCapabilityNow } from "@/lib/pwa/pushCapability";
import { readDetectionEnv } from "@/lib/pwa/detection";
import { INSTALL_MIN_DELAY_MS } from "@/lib/pwa/constants";
import { countPageView, getPageViews, readInstallDismissedAt, resolveInstallExperience, type InstallExperience } from "@/lib/pwa/install";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notificationInbox";
import { onBackOnline } from "@/lib/pwa/network";
import { flushQueue } from "@/lib/pwa/offlineQueue";
import { applyServiceWorkerUpdate, checkForServiceWorkerUpdate, getUpdateSnapshot, SW_EVENTS, subscribeUpdates, takePendingNavigation } from "@/lib/pwa/serviceWorker";
import { session } from "@/lib/pwa/storageUtil";
import { PWA_UI_EVENTS } from "@/lib/pwa/uiEvents";

// The install/notification dialogs are lazy: none of that ships in the main bundle. The offline banner is NOT lazy —
// it must render when the network is already gone, when a not-yet-cached chunk could no longer be fetched.
const PWAInstallPrompt = lazyWithRetry(() => import("./PWAInstallPrompt"));
const NotificationPermissionPrompt = lazyWithRetry(() => import("./NotificationPermissionPrompt"));
const ReminderIntentSheet = lazyWithRetry(() => import("./ReminderIntentSheet"));

const UPDATE_TOAST_ID = "pwa-update";
const INSTALL_SHOWN_KEY = "skinlabs_pwa_install_shown";

/**
 * Mounted once in App.tsx (inside the router, query client and podcast player). Coordinates the PWA
 * layer's UI and background work:
 *  - install prompt timing (engagement + cooldown rules in resolveInstallExperience), or on request
 *  - notification permission dialog (only ever opened on request)
 *  - offline/back-online banner
 *  - "new version ready" toast (never silently reloads a running session)
 *  - queue flush, account sync of podcast progress and push subscription, public-content refresh when back online
 *  - routing a tapped notification to its page
 */
const PWAProvider = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const status = usePWAStatus();
  const { isOffline } = useNetworkStatus();
  const loadedAt = useRef(Date.now());
  const [tick, setTick] = useState(0);
  const [install, setInstall] = useState<{ open: boolean; experience: Exclude<InstallExperience, null> } | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [intentSheet, setIntentSheet] = useState<{ clockTime?: string; purpose: "routine" | "report" } | null>(null);
  const [everOffline, setEverOffline] = useState(false);

  useEffect(() => {
    if (isOffline) setEverOffline(true);
  }, [isOffline]);

  // --- install prompt ---------------------------------------------------------
  useEffect(() => {
    if (!status.isStandalone) countPageView();
  }, [pathname, status.isStandalone]);

  useEffect(() => {
    if (install || session.get(INSTALL_SHOWN_KEY) === "1") return;
    const evaluate = () =>
      resolveInstallExperience({
        env: readDetectionEnv(),
        hasDeferredPrompt: status.canPromptNatively,
        installedFlag: status.isInstalled,
        dismissedAt: readInstallDismissedAt(),
        pageViews: getPageViews(),
        msSinceLoad: Date.now() - loadedAt.current,
        pathname,
      });
    const experience = evaluate();
    if (!experience) {
      // Not eligible *yet* (too early / too few pages): look again once the delay has passed.
      const remaining = INSTALL_MIN_DELAY_MS - (Date.now() - loadedAt.current);
      if (remaining > 0) {
        const timer = window.setTimeout(() => setTick((n) => n + 1), remaining + 200);
        return () => window.clearTimeout(timer);
      }
      return;
    }
    // Wait for the cookie banner decision and any open dialog (sign-in, checkout…) rather than stacking on top.
    if (!isCookieConsentFresh() || document.querySelector('[role="dialog"]')) {
      const timer = window.setTimeout(() => setTick((n) => n + 1), 10_000);
      return () => window.clearTimeout(timer);
    }
    session.set(INSTALL_SHOWN_KEY, "1");
    setInstall({ open: true, experience });
  }, [install, pathname, status.canPromptNatively, status.isInstalled, tick]);

  useEffect(() => {
    const onOpenInstall = () => {
      const experience = resolveInstallExperience({
        env: readDetectionEnv(),
        hasDeferredPrompt: status.canPromptNatively,
        installedFlag: status.isInstalled,
        dismissedAt: null,
        pageViews: 99,
        msSinceLoad: 99_999,
        pathname,
        explicit: true,
      });
      if (experience) setInstall({ open: true, experience });
      else toast.message(status.isInstalled ? "SkinLabs® is already installed." : "Installing isn’t available in this browser.");
    };
    const onOpenNotifications = () => setNotifyOpen(true);
    window.addEventListener(PWA_UI_EVENTS.openInstall, onOpenInstall);
    window.addEventListener(PWA_UI_EVENTS.openNotifications, onOpenNotifications);
    return () => {
      window.removeEventListener(PWA_UI_EVENTS.openInstall, onOpenInstall);
      window.removeEventListener(PWA_UI_EVENTS.openNotifications, onOpenNotifications);
    };
  }, [status.canPromptNatively, status.isInstalled, pathname]);

  // --- background work: queue flush, account sync, refresh -------------------------
  const syncNow = useCallback(async () => {
    // Importing registers the queue handlers (podcast progress, notification preferences).
    await Promise.all([import("@/lib/pwa/playbackProgress"), import("@/lib/pwa/notificationManager")]);
    await flushQueue();
  }, []);

  useEffect(() => {
    const onFlush = () => void syncNow();
    window.addEventListener(SW_EVENTS.flushQueue, onFlush);
    const offBack = onBackOnline(() => {
      void syncNow();
      checkForServiceWorkerUpdate();
      // Connectivity is back: refresh whatever public content is on screen.
      void queryClient.invalidateQueries();
    });
    return () => {
      window.removeEventListener(SW_EVENTS.flushQueue, onFlush);
      offBack();
    };
  }, [queryClient, syncNow]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [progress, notifications] = await Promise.all([import("@/lib/pwa/playbackProgress"), import("@/lib/pwa/notificationManager")]);
      await progress.hydrateProgressFromAccount(user.id).catch(() => 0);
      await notifications.syncSubscription(user.id).catch(() => undefined);
      await flushQueue();
    })();
    const onChanged = () => void import("@/lib/pwa/notificationManager").then((m) => m.syncSubscription(user.id));
    window.addEventListener(SW_EVENTS.pushSubscriptionChanged, onChanged);
    return () => window.removeEventListener(SW_EVENTS.pushSubscriptionChanged, onChanged);
  }, [user]);

  // A tapped notification routes inside the running app (validated same-origin path only).
  useEffect(() => {
    const onNavigate = (event: Event) => {
      takePendingNavigation(); // handled live: don't replay it
      const url = (event as CustomEvent<{ url?: string }>).detail?.url;
      if (url && isSafeReturnTo(url)) navigate(url);
    };
    // A tap that arrived before this listener existed (the provider mounts lazily).
    const early = takePendingNavigation();
    if (early && isSafeReturnTo(early)) navigate(early);
    window.addEventListener(SW_EVENTS.navigate, onNavigate);
    return () => window.removeEventListener(SW_EVENTS.navigate, onNavigate);
  }, [navigate]);

  // App badge = the member's real unread inbox count (feature-detected no-op where unsupported; never throws).
  useEffect(() => {
    let cancelled = false;
    const syncBadge = async () => {
      if (!user) return void setBadge(0);
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null)
        .is("archived_at", null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      if (!cancelled) await setBadge(count ?? 0);
    };
    const onVisible = () => document.visibilityState === "visible" && void syncBadge();
    void syncBadge();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(SW_EVENTS.pushReceived, onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(SW_EVENTS.pushReceived, onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onVisible);
    };
  }, [user]);

  // First standalone launch = installed (iOS fires no `appinstalled`). Stamped once, server-side.
  useEffect(() => {
    if (user && status.isStandalone) void markAppInstalledOnce(user.id, true);
  }, [user, status.isStandalone]);

  // First open of the installed app after an iPhone member asked for reminders in Safari: offer the opt-in once.
  useEffect(() => {
    if (!user || !status.isStandalone) return;
    const intent = readReminderIntent();
    if (!intent || getPushCapabilityNow() !== "ready") return;
    clearReminderIntent();
    setIntentSheet({ clockTime: intent === "07:00" || intent === "19:30" ? intent : undefined, purpose: intent === "report" ? "report" : "routine" });
  }, [user, status.isStandalone]);

  // --- update toast ---------------------------------------------------------------
  useEffect(() => {
    const show = () => {
      if (!getUpdateSnapshot().updateReady) return;
      toast("A new version of SkinLabs® is ready.", {
        id: UPDATE_TOAST_ID,
        duration: Infinity,
        action: { label: "Update now", onClick: () => applyServiceWorkerUpdate() },
        cancel: { label: "Later", onClick: () => toast.dismiss(UPDATE_TOAST_ID) },
      });
    };
    show();
    return subscribeUpdates(show);
  }, []);

  return (
    <>
      {everOffline && <OfflineBanner />}
      {install && (
        <Suspense fallback={null}>
          <PWAInstallPrompt
            open={install.open}
            experience={install.experience}
            onOpenChange={(open) => setInstall((prev) => (prev ? { ...prev, open } : prev))}
          />
        </Suspense>
      )}
      {notifyOpen && (
        <Suspense fallback={null}>
          <NotificationPermissionPrompt open={notifyOpen} onOpenChange={setNotifyOpen} />
        </Suspense>
      )}
      {user && intentSheet && (
        <Suspense fallback={null}>
          <ReminderIntentSheet open onOpenChange={(open) => !open && setIntentSheet(null)} userId={user.id} clockTime={intentSheet.clockTime} purpose={intentSheet.purpose} />
        </Suspense>
      )}
    </>
  );
};

export default PWAProvider;
