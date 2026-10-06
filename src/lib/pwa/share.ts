/**
 * Web Share with a copy-link fallback. Public content only: callers pass a
 * title and a canonical URL — never account data.
 */
import { toast } from "sonner";

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export const canWebShare = (): boolean => typeof navigator !== "undefined" && typeof navigator.share === "function";

export const shareContent = async (data: { title: string; text?: string; url: string }): Promise<ShareResult> => {
  if (canWebShare()) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      // The user closing the share sheet is not an error.
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Anything else (e.g. NotAllowedError outside a gesture) falls through to copy.
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    toast.success("Link copied");
    return "copied";
  } catch {
    toast.error("Couldn’t share this link. Copy it from the address bar instead.");
    return "failed";
  }
};
