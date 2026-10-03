/**
 * Media Session API for podcast playback: lock-screen / notification / headset /
 * Bluetooth / Android Auto controls plus now-playing metadata. Everything is
 * feature-detected; browsers without it (or with partial support — iOS lacks
 * some actions) just ignore the calls.
 */
export interface MediaSessionEpisode {
  title: string;
  /** Absolute or root-relative image path. */
  image: string;
}

export interface MediaSessionHandlers {
  play: () => void;
  pause: () => void;
  seekBy: (deltaSeconds: number) => void;
  seekTo: (seconds: number) => void;
  previous: (() => void) | null;
  next: (() => void) | null;
  stop: () => void;
}

export const SEEK_SECONDS = 15;
const ARTIST = "SkinLabs®";
const ALBUM = "The Skin Deep";

const hasMediaSession = (): boolean => typeof navigator !== "undefined" && "mediaSession" in navigator && typeof MediaMetadata !== "undefined";

const absolute = (path: string): string => {
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
};

const imageMime = (path: string): string => (/\.webp$/i.test(path) ? "image/webp" : /\.png$/i.test(path) ? "image/png" : "image/jpeg");

/** Artwork list: the episode cover first, the app icon as an always-available square fallback. */
export const buildArtwork = (image: string): MediaImage[] => [
  { src: absolute(image), sizes: "1080x1350", type: imageMime(image) },
  { src: absolute("/pwa-512.png"), sizes: "512x512", type: "image/png" },
  { src: absolute("/pwa-192.png"), sizes: "192x192", type: "image/png" },
];

export const setMediaMetadata = (episode: MediaSessionEpisode | null) => {
  if (!hasMediaSession()) return;
  try {
    navigator.mediaSession.metadata = episode ? new MediaMetadata({ title: episode.title, artist: ARTIST, album: ALBUM, artwork: buildArtwork(episode.image) }) : null;
  } catch {
    /* some engines reject unusual artwork; metadata is cosmetic */
  }
};

export const setPlaybackState = (playing: boolean) => {
  if (!hasMediaSession()) return;
  try {
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  } catch {
    /* ignore */
  }
};

export const setPositionState = (duration: number, position: number, rate: number) => {
  if (!hasMediaSession() || typeof navigator.mediaSession.setPositionState !== "function") return;
  if (!Number.isFinite(duration) || duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({ duration, position: Math.min(Math.max(0, position), duration), playbackRate: rate || 1 });
  } catch {
    /* invalid combinations throw; skip */
  }
};

const ACTIONS: MediaSessionAction[] = ["play", "pause", "seekbackward", "seekforward", "seekto", "previoustrack", "nexttrack", "stop"];

export const bindMediaSessionHandlers = (handlers: MediaSessionHandlers): (() => void) => {
  if (!hasMediaSession()) return () => undefined;
  const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      /* action unsupported on this platform */
    }
  };
  set("play", () => handlers.play());
  set("pause", () => handlers.pause());
  set("seekbackward", (d) => handlers.seekBy(-(d.seekOffset || SEEK_SECONDS)));
  set("seekforward", (d) => handlers.seekBy(d.seekOffset || SEEK_SECONDS));
  set("seekto", (d) => {
    if (typeof d.seekTime === "number") handlers.seekTo(d.seekTime);
  });
  set("previoustrack", handlers.previous ? () => handlers.previous?.() : null);
  set("nexttrack", handlers.next ? () => handlers.next?.() : null);
  set("stop", () => handlers.stop());
  return () => ACTIONS.forEach((a) => set(a, null));
};
