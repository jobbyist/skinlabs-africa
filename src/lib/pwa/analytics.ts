/**
 * PWA analytics: every app/install/offline/push/download event goes through the existing
 * trackConversionEvent() pipeline (Vercel Analytics + the first-party analytics_events table that
 * the admin Analytics tab reads) — no second analytics platform. Each event carries the same four
 * coarse, non-identifying device tokens so installs can be broken down by device:
 *
 *   platform      ios | ipados | android | windows | macos | linux | chromeos | unknown
 *   browser       safari | chrome | edge | firefox | samsung | opera | other
 *   device_type   phone | tablet | desktop | unknown
 *   display_mode  standalone (installed app) | browser (normal tab)
 *
 * Never put names, emails, user agents or any skin/health data in these payloads.
 */
import { trackConversionEvent, type ConversionEvent } from "@/lib/analytics-events";
import { detectBrowser, detectDeviceType, detectPlatform, isStandaloneMode, readDetectionEnv, type DetectionEnv } from "./detection";

type Extra = Record<string, string | number | boolean | undefined>;

export const pwaEventProps = (env: DetectionEnv = readDetectionEnv()): Record<string, string> => ({
  platform: detectPlatform(env),
  browser: detectBrowser(env),
  device_type: detectDeviceType(env),
  display_mode: isStandaloneMode(env) ? "standalone" : "browser",
});

type Sink = (event: ConversionEvent, payload: Record<string, string | number | boolean | undefined>) => void;
let sink: Sink = trackConversionEvent;
/** Test hook: capture events instead of sending them (pass null to restore the real pipeline). */
export const __setPwaEventSink = (next: Sink | null) => {
  sink = next ?? trackConversionEvent;
};

export const trackPwaEvent = (event: ConversionEvent, extra: Extra = {}) => {
  try {
    sink(event, { ...pwaEventProps(), ...extra });
  } catch {
    /* analytics must never affect the feature */
  }
};
