// PayFast signing, API and date helpers, shared by payfast-payment's
// one-off checkout, its recurring "Keep my membership" subscription and its
// ITN handler. Pure except for payfastApiRequest(); unit tested in
// __tests__/payfast.test.ts (bun), and node:crypto's MD5 works in both the
// Deno edge runtime and bun.
//
// PayFast signs three different things three different ways (per
// https://developers.payfast.co.za/docs and the official PHP SDK):
//  1. the checkout FORM: non-empty fields in the DOCUMENTED field order (not
//     alphabetical — PayFast says so explicitly), then &passphrase=;
//  2. an ITN: every received field (empty ones included) in the ORDER RECEIVED,
//     minus `signature`, then &passphrase=;
//  3. the REST API: header + body params plus the passphrase, sorted
//     alphabetically.
// All three use PHP urlencode(): spaces as "+", upper-case hex, and only
// A-Z a-z 0-9 - _ . left unescaped.
import { createHash } from "node:crypto";

/** PayFast's documented checkout field order (custom integration). */
export const PAYFAST_FORM_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "notify_method",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "currency",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
] as const;

/** PHP urlencode(): like encodeURIComponent, but also escapes !'()*~ and uses "+" for spaces. */
export const phpUrlencode = (value: string): string =>
  encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");

export const md5 = (value: string): string => createHash("md5").update(value).digest("hex");

/** The string PayFast hashes for a checkout form. Fields PayFast doesn't document are ignored. */
export const formParamString = (data: Record<string, string | undefined>, passphrase: string): string => {
  const pairs: string[] = [];
  for (const key of PAYFAST_FORM_FIELD_ORDER) {
    const value = data[key];
    if (value === undefined) continue;
    const trimmed = String(value).trim();
    if (trimmed === "") continue;
    pairs.push(`${key}=${phpUrlencode(trimmed)}`);
  }
  if (passphrase.trim()) pairs.push(`passphrase=${phpUrlencode(passphrase.trim())}`);
  return pairs.join("&");
};

export const formSignature = (data: Record<string, string | undefined>, passphrase: string): string =>
  md5(formParamString(data, passphrase));

/**
 * An ITN's own parameter string: every field in the order PayFast posted
 * it, `signature` excluded, empty values kept. This is also what gets posted
 * back to /eng/query/validate.
 */
export const itnParamString = (rawBody: string): string => {
  const pairs: string[] = [];
  new URLSearchParams(rawBody).forEach((value, key) => {
    if (key !== "signature") pairs.push(`${key}=${phpUrlencode(value)}`);
  });
  return pairs.join("&");
};

export const itnSignature = (rawBody: string, passphrase: string): string => {
  const base = itnParamString(rawBody);
  return md5(passphrase.trim() ? `${base}&passphrase=${phpUrlencode(passphrase.trim())}` : base);
};

/** REST API signature: headers + body + passphrase, sorted by key. Query params like `testing` are not signed. */
export const apiSignature = (params: Record<string, string>, passphrase: string): string => {
  const all: Record<string, string> = { ...params };
  if (passphrase.trim()) all.passphrase = passphrase.trim();
  const query = Object.keys(all)
    .filter((key) => key !== "signature" && all[key] !== "")
    .sort()
    .map((key) => `${key}=${phpUrlencode(all[key])}`)
    .join("&");
  return md5(query);
};

/** Constant-time over the longer input, so neither content nor length leaks through timing. */
export const safeEqual = (a: string, b: string): boolean => {
  const len = Math.max(a.length, b.length);
  let out = a.length ^ b.length;
  for (let i = 0; i < len; i++) out |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return out === 0;
};

// ---------------------------------------------------------------------------
// Dates (PayFast billing dates are calendar days in South Africa)
// ---------------------------------------------------------------------------

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000; // Africa/Johannesburg has no DST.

/** YYYY-MM-DD of an instant in SAST. 2026-10-31T22:00:00Z → "2026-11-01". */
export const sastDate = (at: Date | string): string => {
  const ms = (typeof at === "string" ? new Date(at) : at).getTime() + SAST_OFFSET_MS;
  return new Date(ms).toISOString().slice(0, 10);
};

/** Midnight SAST at the start of a YYYY-MM-DD billing date, as an ISO instant. */
export const sastMidnightIso = (date: string): string =>
  new Date(new Date(`${date}T00:00:00Z`).getTime() - SAST_OFFSET_MS).toISOString();

/** The billing date one period after `date` (YYYY-MM-DD), month-end clamped. */
export const addBillingPeriod = (date: string, interval: "monthly" | "annual"): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`addBillingPeriod: expected YYYY-MM-DD, got "${date}"`);
  const [y, m, d] = match.slice(1).map(Number);
  const months = interval === "annual" ? 12 : 1;
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
};

/** PayFast frequency codes: 3 = monthly, 6 = annual. */
export const payfastFrequency = (interval: "monthly" | "annual"): "3" | "6" => (interval === "annual" ? "6" : "3");

// ---------------------------------------------------------------------------
// Environment + REST API
// ---------------------------------------------------------------------------

/** Sandbox unless PAYFAST_MODE=live — the same conservative default as PAYPAL_ENV. */
export const payfastIsLive = (mode: string | undefined): boolean => mode === "live";

export const payfastHost = (mode: string | undefined): string =>
  payfastIsLive(mode) ? "www.payfast.co.za" : "sandbox.payfast.co.za";

/** "2026-09-28T08:00:00+0000" — PHP date("Y-m-d\TH:i:sO") in UTC, as the official SDK sends it. */
export const payfastTimestamp = (now: Date = new Date()): string => `${now.toISOString().slice(0, 19)}+0000`;

export interface PayfastApiConfig {
  merchantId: string;
  passphrase: string;
  mode: string | undefined;
}

export interface PayfastApiResult {
  ok: boolean;
  status: number;
  json: Record<string, unknown>;
}

/** Calls api.payfast.co.za. Sandbox requests carry ?testing=true, which is not part of the signature. */
export async function payfastApiRequest(
  config: PayfastApiConfig,
  method: "GET" | "PUT" | "POST" | "PATCH",
  path: string,
  body?: Record<string, string>,
): Promise<PayfastApiResult> {
  const headers: Record<string, string> = {
    "merchant-id": config.merchantId,
    version: "v1",
    timestamp: payfastTimestamp(),
  };
  const signature = apiSignature({ ...headers, ...(body ?? {}) }, config.passphrase);
  const url = `https://api.payfast.co.za${path}${payfastIsLive(config.mode) ? "" : "?testing=true"}`;
  const res = await fetch(url, {
    method,
    headers: { ...headers, signature, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}
