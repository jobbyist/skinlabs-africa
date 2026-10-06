/** Safe localStorage / sessionStorage wrappers (private mode and blocked storage must never throw). */

const read = (store: () => Storage, key: string): string | null => {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
};
const write = (store: () => Storage, key: string, value: string) => {
  try {
    store().setItem(key, value);
  } catch {
    /* storage unavailable: the feature degrades, nothing breaks */
  }
};
const remove = (store: () => Storage, key: string) => {
  try {
    store().removeItem(key);
  } catch {
    /* ignore */
  }
};

export const local = {
  get: (key: string) => read(() => window.localStorage, key),
  set: (key: string, value: string) => write(() => window.localStorage, key, value),
  remove: (key: string) => remove(() => window.localStorage, key),
};
export const session = {
  get: (key: string) => read(() => window.sessionStorage, key),
  set: (key: string, value: string) => write(() => window.sessionStorage, key, value),
  remove: (key: string) => remove(() => window.sessionStorage, key),
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** True while `timestampMs` is less than `days` ago. */
export const withinDays = (timestampMs: number | null | undefined, days: number, now: number = Date.now()): boolean =>
  typeof timestampMs === "number" && Number.isFinite(timestampMs) && now - timestampMs < days * DAY_MS;

export const readTimestamp = (raw: string | null): number | null => {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};
