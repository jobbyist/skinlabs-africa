/**
 * Delivery helpers for the "My Skin Story" image: native file share, download and
 * link copy. All client-side; the image is never uploaded.
 */
import { SITE_URL } from "@/lib/seo-config";
import { SKYNN_ROUTE } from "@/lib/skynn/terminology";

export const STORY_FILENAME = "skinlabs-my-skin-story.png";
export const STORY_SHARE_TITLE = "My Skin Story";
export const STORY_SHARE_TEXT = "My Skin Story from SkinLabs®";
/** Public entry point only: never carries any assessment data. */
export const STORY_SHARE_URL = `${SITE_URL}${SKYNN_ROUTE}`;

export const storyFile = (blob: Blob): File => new File([blob], STORY_FILENAME, { type: "image/png" });

export const canShareFile = (file: File): boolean => {
  try {
    return typeof navigator !== "undefined" && typeof navigator.share === "function" && Boolean(navigator.canShare?.({ files: [file] }));
  } catch {
    return false;
  }
};

export const canShareLink = (): boolean => typeof navigator !== "undefined" && typeof navigator.share === "function";

/** The visitor closed the native share sheet — never an error. */
export const isShareCancelled = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

export type NativeShareOutcome = "shared" | "cancelled" | "unavailable";

/** Share the PNG through the OS share sheet. "unavailable" means the caller should show the fallback dialog. */
export const shareStoryFile = async (file: File): Promise<NativeShareOutcome> => {
  if (!canShareFile(file)) return "unavailable";
  try {
    await navigator.share({ title: STORY_SHARE_TITLE, text: STORY_SHARE_TEXT, files: [file] });
    return "shared";
  } catch (error) {
    return isShareCancelled(error) ? "cancelled" : "unavailable";
  }
};

export const shareStoryLink = async (): Promise<NativeShareOutcome> => {
  if (!canShareLink()) return "unavailable";
  try {
    await navigator.share({ title: STORY_SHARE_TITLE, text: STORY_SHARE_TEXT, url: STORY_SHARE_URL });
    return "shared";
  } catch (error) {
    return isShareCancelled(error) ? "cancelled" : "unavailable";
  }
};

/** Triggers a download from a short-lived object URL, revoked straight after. */
export const downloadStory = (blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = STORY_FILENAME;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

/** Clipboard API first, then a hidden-textarea fallback. Returns whether the copy worked. */
export const copyStoryLink = async (): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(STORY_SHARE_URL);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = STORY_SHARE_URL;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
};
