import { useSyncExternalStore } from "react";
import type { AdBlockStatus } from "@/lib/viewerContext";

/**
 * Hardened, app-wide ad-blocker detection. One shared store (not a per-component
 * effect), so every consumer — the ad-block wall, ad slots, `useViewerContext()`
 * — agrees on one answer and detection runs once per check, not per mount.
 *
 * A blocker is reported only on positive evidence, never on a plain network
 * failure (which would wall an offline visitor):
 *  1. Cosmetic filter: a bait element carrying the class names/ids filter lists
 *     hide is collapsed or hidden after two frames.
 *  2. Network filter: a request to the AdSense script host fails WHILE a
 *     same-origin control request succeeds (so we're online).
 *  3. AdSense itself: index.html loads adsbygoogle.js; if its <script> fired
 *     `error`, the network filter caught it.
 * It re-checks when the tab regains focus (so turning the blocker off and
 * coming back lifts the wall) and on demand via `recheckAdBlock()`.
 */

const ADSENSE_PROBE_URL = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
const PROBE_TIMEOUT_MS = 3500;

let status: AdBlockStatus = "unknown";
let inflight: Promise<AdBlockStatus> | null = null;
let started = false;
const listeners = new Set<() => void>();

const setStatus = (next: AdBlockStatus) => {
  if (next === status) return;
  status = next;
  listeners.forEach((l) => l());
};

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const baitIsHidden = async (): Promise<boolean> => {
  const bait = document.createElement("div");
  bait.id = "ad-banner-slot";
  bait.className = "adsbox ad-banner ad-placement pub_300x250 pub_728x90 text-ad textAd banner_ad sponsored-ad";
  bait.setAttribute("aria-hidden", "true");
  bait.innerHTML = "&nbsp;";
  bait.style.cssText = "position:absolute!important;left:-10000px!important;top:-10000px!important;width:1px!important;height:1px!important;";
  document.body.appendChild(bait);
  await nextFrame();
  await nextFrame();
  await sleep(120);
  const style = window.getComputedStyle(bait);
  const hidden =
    !bait.isConnected ||
    bait.offsetParent === null ||
    bait.offsetHeight === 0 ||
    bait.offsetWidth === 0 ||
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0";
  bait.remove();
  return hidden;
};

const requestSucceeds = async (url: string, init: RequestInit): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

const networkFilterBlocks = async (): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  const [adsense, control] = await Promise.all([
    requestSucceeds(ADSENSE_PROBE_URL, { method: "HEAD", mode: "no-cors" }),
    requestSucceeds(`/favicon.ico?adprobe=${Date.now()}`, { method: "HEAD" }),
  ]);
  // Ad host unreachable but our own origin fine → something is filtering ad requests.
  return !adsense && control;
};

const detect = async (): Promise<AdBlockStatus> => {
  try {
    const [cosmetic, network] = await Promise.all([baitIsHidden(), networkFilterBlocks()]);
    return cosmetic || network ? "blocked" : "clear";
  } catch {
    return "unknown";
  }
};

export const recheckAdBlock = (): Promise<AdBlockStatus> => {
  if (typeof window === "undefined") return Promise.resolve("unknown");
  if (!inflight) {
    inflight = detect().then((result) => {
      inflight = null;
      setStatus(result);
      return result;
    });
  }
  return inflight;
};

const start = () => {
  if (started || typeof window === "undefined") return;
  started = true;
  const run = () => void recheckAdBlock();
  if (document.readyState === "complete") setTimeout(run, 300);
  else window.addEventListener("load", () => setTimeout(run, 300), { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && status === "blocked") run();
  });
  window.addEventListener("focus", () => {
    if (status === "blocked") run();
  });
};

const subscribe = (listener: () => void) => {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Current ad-blocker status: "unknown" until the first check finishes. */
export const useAdBlockStatus = (): AdBlockStatus =>
  useSyncExternalStore(subscribe, () => status, () => "unknown");
