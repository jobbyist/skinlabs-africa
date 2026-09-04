/**
 * Every browser storage key SkinLabs writes for non-authentication purposes, grouped
 * for display on the Cookie Policy page's "Storage Preferences" panel. Supabase's own
 * auth session storage is deliberately excluded — clearing it would sign the visitor
 * out, which "manage my cookie/storage preferences" should never do silently.
 */
export interface StorageGroup {
  id: string;
  label: string;
  description: string;
  keys: string[];
}

export const STORAGE_GROUPS: StorageGroup[] = [
  {
    id: "consent",
    label: "Cookie consent record",
    description: "Remembers the cookie choices you've made so we don't ask again every visit.",
    keys: ["skinlabs_cookie_consent_v2"],
  },
  {
    id: "free-tier-quotas",
    label: "Free-tier usage counters",
    description: "Tracks how many free podcast plays, Shelf Showdowns and Spotlight profiles you've used this month.",
    keys: ["skinlabs-quota-podcast", "skinlabs-quota-compare", "skinlabs-quota-spotlight"],
  },
  {
    id: "engagement",
    label: "Liked & saved content",
    description: "Your liked and saved Daily Skinny briefings, plus a random id used to count your 3 free briefings per week if you're not signed in.",
    keys: ["skinlabs-engagement", "skinlabs-anon-device-id"],
  },
  {
    id: "podcast",
    label: "Podcast playback",
    description: "Resume positions, likes and free-play counts for podcast episodes.",
    keys: ["skinlabs-podcast-positions", "skinlabs-podcast-likes", "skinlabs-podcast-extra-plays"],
  },
  {
    id: "preferences",
    label: "Display preferences",
    description: "Your selected currency and whether you've already dismissed the maintenance banner.",
    keys: ["selectedCurrency", "skinlabs_maintenance_modal_dismissed"],
  },
];

export const ALL_KNOWN_STORAGE_KEYS = STORAGE_GROUPS.flatMap((group) => group.keys);

/** Returns how many of the known keys currently hold data, for an honest "what's actually stored" count. */
export const countStoredKeys = (): number => {
  try {
    return ALL_KNOWN_STORAGE_KEYS.filter((key) => localStorage.getItem(key) !== null).length;
  } catch {
    return 0;
  }
};

/** Clears only SkinLabs' own known, non-auth storage keys. Never touches Supabase's session storage. */
export const clearAllKnownStorage = () => {
  try {
    for (const key of ALL_KNOWN_STORAGE_KEYS) localStorage.removeItem(key);
  } catch {
    // localStorage unavailable (private mode, disabled storage) — nothing to clear.
  }
};
