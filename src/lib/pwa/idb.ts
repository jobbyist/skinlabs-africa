/**
 * Minimal promise wrapper over IndexedDB (one database, three stores), so the
 * PWA layer needs no dependency. Everything resolves to a safe default when
 * IndexedDB is unavailable (some private modes, locked-down webviews): callers
 * treat `null`/empty as "feature unavailable", never as an error.
 *
 * Stores:
 *   downloads  podcast download metadata/state (audio bytes live in Cache Storage, never here)
 *   queue      offline action queue (idempotent, keyed — see offlineQueue.ts)
 *   kv         small values (e.g. last storage report)
 *
 * No auth tokens, session data or personal skin data are ever written here.
 */
import { PWA_DB_NAME, PWA_DB_VERSION } from "./constants";

export type StoreName = "downloads" | "queue" | "kv";

let dbPromise: Promise<IDBDatabase | null> | null = null;

export const openPwaDb = (): Promise<IDBDatabase | null> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(PWA_DB_NAME, PWA_DB_VERSION);
    } catch {
      return resolve(null);
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("downloads")) db.createObjectStore("downloads", { keyPath: "slug" });
      if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "key" });
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv", { keyPath: "key" });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
  return dbPromise;
};

const run = async <T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> => {
  const db = await openPwaDb();
  if (!db) return undefined;
  return new Promise<T | undefined>((resolve) => {
    try {
      const tx = db.transaction(store, mode);
      const request = fn(tx.objectStore(store));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
      tx.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
};

export const idbGet = <T>(store: StoreName, key: IDBValidKey) => run<T>(store, "readonly", (s) => s.get(key) as IDBRequest<T>);
export const idbGetAll = async <T>(store: StoreName): Promise<T[]> => (await run<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>)) ?? [];
export const idbPut = async (store: StoreName, value: unknown): Promise<boolean> => (await run(store, "readwrite", (s) => s.put(value))) !== undefined;
export const idbDelete = async (store: StoreName, key: IDBValidKey): Promise<void> => {
  await run(store, "readwrite", (s) => s.delete(key));
};
export const idbClear = async (store: StoreName): Promise<void> => {
  await run(store, "readwrite", (s) => s.clear());
};
