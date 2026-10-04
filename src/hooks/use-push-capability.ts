import { useCallback, useEffect, useState } from "react";
import { readDetectionEnv } from "@/lib/pwa/detection";
import {
  PUSH_STATE_CHANGED_EVENT,
  readPushInputs,
  reenableInstructions,
  resolvePushCapability,
  type PushCapability,
  type ReenableInstructions,
} from "@/lib/pwa/pushCapability";

export interface PushCapabilityState {
  capability: PushCapability;
  loading: boolean;
  /** Steps to re-enable after a block, for the detected platform (only meaningful when capability === "denied"). */
  instructions: ReenableInstructions;
  refresh: () => Promise<void>;
}

/**
 * The one hook every surface uses (welcome, checklist, report-ready, Settings → App, the permission prompt).
 * Re-reads on focus/visibility and whenever notificationManager reports a change.
 */
export const usePushCapability = (): PushCapabilityState => {
  const [capability, setCapability] = useState<PushCapability>("unsupported");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { getSubscription } = await import("@/lib/pwa/notificationManager");
    const subscription = await getSubscription();
    setCapability(resolvePushCapability(readPushInputs(subscription)));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    window.addEventListener("focus", onChange);
    window.addEventListener(PUSH_STATE_CHANGED_EVENT, onChange);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onChange);
      window.removeEventListener(PUSH_STATE_CHANGED_EVENT, onChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { capability, loading, instructions: reenableInstructions(readDetectionEnv()), refresh };
};
