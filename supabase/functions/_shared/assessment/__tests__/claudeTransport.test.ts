import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// claudeTransport reads keys via Deno.env; shim it for bun.
const env: Record<string, string | undefined> = {};
(globalThis as unknown as { Deno: unknown }).Deno = { env: { get: (k: string) => env[k] } };

const { callClaudeStructured } = await import("../pipeline/claudeTransport.ts");

const args = {
  task: "intake_normalisation" as const,
  system: "sys",
  user: "usr",
  toolName: "submit_x",
  toolDescription: "d",
  schema: { type: "object" as const, properties: {}, required: [] },
  maxTokens: 100,
};

const realFetch = globalThis.fetch;
let calls: string[] = [];

function mockFetch(handler: (url: string) => Response) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return handler(url);
  }) as typeof fetch;
}

const anthropicOk = () =>
  new Response(JSON.stringify({ content: [{ type: "tool_use", name: "submit_x", input: { ok: true } }], usage: {} }), { status: 200 });

beforeEach(() => {
  calls = [];
  for (const k of Object.keys(env)) delete env[k];
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("claudeTransport fallback", () => {
  test("gateway 403 falls back to ANTHROPIC_API_KEY", async () => {
    env.AI_GATEWAY_API_KEY = "gw";
    env.ANTHROPIC_API_KEY = "sk";
    mockFetch((url) => (url.includes("ai-gateway") ? new Response("free tier", { status: 403 }) : anthropicOk()));
    const res = await callClaudeStructured(args);
    expect(res.output).toEqual({ ok: true });
    expect(calls.length).toBe(2);
    expect(calls[1]).toContain("api.anthropic.com");
  });

  test("gateway 403 without a direct key stays not_configured", async () => {
    env.AI_GATEWAY_API_KEY = "gw";
    mockFetch(() => new Response("free tier", { status: 403 }));
    await expect(callClaudeStructured(args)).rejects.toMatchObject({ code: "not_configured" });
  });

  test("other gateway errors do not fall back", async () => {
    env.AI_GATEWAY_API_KEY = "gw";
    env.ANTHROPIC_API_KEY = "sk";
    mockFetch(() => new Response("boom", { status: 500 }));
    await expect(callClaudeStructured(args)).rejects.toMatchObject({ code: "upstream_error" });
    expect(calls.length).toBe(1);
  });
});
