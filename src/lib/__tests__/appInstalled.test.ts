import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { __setAppInstalledDepsForTests, markAppInstalledOnce } from "../pwa/appInstalled";

const store = new Map<string, string>();
const g = globalThis as unknown as { window?: unknown };
const original = g.window;
beforeAll(() => {
  g.window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) } };
});
afterAll(() => {
  if (original === undefined) delete g.window;
  else g.window = original;
});

afterEach(() => {
  store.clear();
  __setAppInstalledDepsForTests(null);
});
const calls = () => {
  let n = 0;
  __setAppInstalledDepsForTests({ callRpc: async () => ({ error: (n++, null) }) });
  return () => n;
};

describe("markAppInstalledOnce", () => {
  test("only from the installed app (standalone)", async () => {
    const n = calls();
    expect(await markAppInstalledOnce("u1", false)).toBe(false);
    expect(n()).toBe(0);
  });
  test("first standalone launch calls the RPC once; later launches don't", async () => {
    const n = calls();
    expect(await markAppInstalledOnce("u1", true)).toBe(true);
    expect(await markAppInstalledOnce("u1", true)).toBe(false);
    expect(n()).toBe(1);
  });
  test("a different member on the same device is stamped separately", async () => {
    const n = calls();
    await markAppInstalledOnce("u1", true);
    await markAppInstalledOnce("u2", true);
    expect(n()).toBe(2);
  });
  test("a failed call is retried on the next launch and never throws", async () => {
    __setAppInstalledDepsForTests({ callRpc: async () => ({ error: { message: "boom" } }) });
    expect(await markAppInstalledOnce("u1", true)).toBe(false);
    __setAppInstalledDepsForTests({ callRpc: async () => { throw new Error("offline"); } });
    expect(await markAppInstalledOnce("u1", true)).toBe(false);
    const n = calls();
    expect(await markAppInstalledOnce("u1", true)).toBe(true);
    expect(n()).toBe(1);
  });
});
