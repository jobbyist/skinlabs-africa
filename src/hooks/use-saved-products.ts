import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "openhaus_saved_v1";

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeSaved(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable — saved list just won't persist across reloads.
  }
}

/** Wishlist/"Saved" products — localStorage-backed, shared across every marketplace page. */
export function useSavedProducts() {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(readSaved()));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSavedIds(new Set(readSaved()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      writeSaved([...next]);
      return next;
    });
  }, []);

  return { savedIds, toggleSaved };
}
