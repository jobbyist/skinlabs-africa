import { useSyncExternalStore } from "react";
import { getNetworkSnapshot, getServerNetworkSnapshot, isEffectivelyOffline, subscribeNetwork } from "@/lib/pwa/network";

/** `isOffline` combines navigator.onLine with real request failures (see lib/pwa/network.ts). */
export const useNetworkStatus = () => {
  const snapshot = useSyncExternalStore(subscribeNetwork, getNetworkSnapshot, getServerNetworkSnapshot);
  return { ...snapshot, isOffline: isEffectivelyOffline(snapshot) };
};
