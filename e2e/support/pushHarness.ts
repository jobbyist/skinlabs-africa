import type { BrowserContext } from "@playwright/test";

/**
 * Browser-side stand-ins for the Notification / Push APIs, so specs can drive every permission branch and COUNT
 * the native prompts (headless Chromium has no real push service). The page can read `window.__push`:
 *   requestCalls  how many times Notification.requestPermission() was called (the native prompt)
 *   permission    current Notification.permission
 */
export interface PushStub {
  permission: "default" | "granted" | "denied";
  /** What the native prompt answers when it is (wrongly or rightly) called. */
  next?: "granted" | "denied";
  /** Remove the Push API entirely (unsupported browser). */
  noPushApi?: boolean;
}

export const stubPushApis = (context: BrowserContext, stub: PushStub) =>
  context.addInitScript((init) => {
    const w = window as unknown as { __push: { permission: string; requestCalls: number; sub: unknown; next?: string } };
    w.__push = { permission: init.permission, requestCalls: 0, sub: null, next: init.next };
    if (init.noPushApi) {
      // @ts-expect-error deliberately removing the API
      delete window.PushManager;
      return;
    }
    if (typeof Notification !== "undefined") {
      Object.defineProperty(Notification, "permission", { get: () => w.__push.permission, configurable: true });
      Notification.requestPermission = ((cb?: (p: NotificationPermission) => void) => {
        w.__push.requestCalls += 1;
        w.__push.permission = w.__push.next ?? "granted";
        cb?.(w.__push.permission as NotificationPermission);
        return Promise.resolve(w.__push.permission as NotificationPermission);
      }) as typeof Notification.requestPermission;
    }
    if (window.PushManager) {
      window.PushManager.prototype.getSubscription = async function () {
        return w.__push.sub as PushSubscription | null;
      };
      window.PushManager.prototype.subscribe = async function () {
        w.__push.sub = {
          endpoint: "https://push.example/e2e-endpoint-0123456789",
          toJSON: () => ({ endpoint: "https://push.example/e2e-endpoint-0123456789", keys: { p256dh: "p256dh-key-0123456789ab", auth: "auth-key-0123" } }),
          unsubscribe: async () => true,
        };
        return w.__push.sub as PushSubscription;
      };
    }
  }, stub);
