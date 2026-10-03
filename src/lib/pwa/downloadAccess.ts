/**
 * Who may save a podcast episode for offline listening. Downloading follows the same rules as streaming
 * (PodcastPlayer.playEpisode): signed in, and — for non-members — only the episode they could play now
 * (the free monthly episode). The audio files themselves are public static assets, so this is a product
 * rule, not a security boundary; membership tiers are unchanged and nothing new is sold here.
 */
export type DownloadAccess = "ok" | "sign_in" | "upgrade";

export const resolveDownloadAccess = (input: { signedIn: boolean; isMember: boolean; canPlayFreeEpisode: boolean }): DownloadAccess => {
  if (!input.signedIn) return "sign_in";
  if (!input.isMember && !input.canPlayFreeEpisode) return "upgrade";
  return "ok";
};

export const downloadFailureMessage = (failure: "quota" | "network" | "interrupted" | "unknown" | undefined): string => {
  switch (failure) {
    case "quota":
      return "Not enough storage on this device. Remove a download or free some space, then retry.";
    case "network":
      return "The download was interrupted. Check your connection and retry.";
    case "interrupted":
      return "The download didn’t finish. Retry to start again.";
    default:
      return "We couldn’t download this episode. Please try again.";
  }
};

export const downloadProgressPercent = (received: number, total: number): number | null =>
  total > 0 ? Math.max(0, Math.min(100, Math.round((received / total) * 100))) : null;
