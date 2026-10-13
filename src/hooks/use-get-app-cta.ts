import { useAuth } from "@/hooks/use-auth";
import { usePWAStatus } from "@/hooks/use-pwa-status";

/**
 * True when the header should offer "Get the app": a signed-in member who hasn't installed the PWA, on a browser that
 * can actually install it (captured native prompt, or iOS Safari's Add to Home Screen). Never inside an installed app
 * or an in-app webview, and never while install isn't possible (so the button always leads somewhere that works).
 * Presentation only.
 */
export const useGetAppCta = (): boolean => {
  const { user } = useAuth();
  const status = usePWAStatus();
  return Boolean(user) && status.isInstallable && !status.isInstalled && !status.isInAppBrowser;
};
