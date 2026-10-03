/**
 * Shared by api/admin-auth.ts and api/admin-analytics.ts so the two can't drift.
 *
 * The gate cookie value is `<expiresAtMs>.<hmac>`: the expiry is inside the signed
 * payload, so a stolen cookie stops working when it expires instead of living until
 * ADMIN_PASSWORD changes. The cookie is scoped to `/` because it is read by
 * `/api/admin-auth` and `/api/admin-analytics`; a `/admin` path scope meant the browser
 * never sent it to either, so the gate re-locked on every reload and Analytics always 401'd.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const GATE_COOKIE_NAME = "skinlabs_admin_gate";
export const GATE_COOKIE_MAX_AGE_S = 60 * 60 * 12;

const sign = (secret: string, expiresAt: string): string =>
  createHmac("sha256", secret).update(`skinlabs-admin-gate-v2:${expiresAt}`).digest("hex");

export const safeEqual = (a: string, b: string): boolean => {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
};

export const mintGateToken = (secret: string, now: number = Date.now()): string => {
  const expiresAt = String(now + GATE_COOKIE_MAX_AGE_S * 1000);
  return `${expiresAt}.${sign(secret, expiresAt)}`;
};

export const verifyGateToken = (secret: string, token: string | null | undefined, now: number = Date.now()): boolean => {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expiresAt = token.slice(0, dot);
  const exp = Number(expiresAt);
  if (!Number.isFinite(exp) || exp <= now) return false;
  return safeEqual(token.slice(dot + 1), sign(secret, expiresAt));
};

type CookieReq = { headers: Record<string, string | string[] | undefined>; cookies?: Record<string, string> };

export const readGateCookie = (req: CookieReq): string | null => {
  if (req.cookies && typeof req.cookies[GATE_COOKIE_NAME] === "string") return req.cookies[GATE_COOKIE_NAME];
  const raw = req.headers.cookie;
  if (!raw || Array.isArray(raw)) return null;
  for (const part of raw.split(";").map((p) => p.trim())) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i) === GATE_COOKIE_NAME) {
      try {
        return decodeURIComponent(part.slice(i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const gateCookieHeader = (token: string, secure: boolean): string => {
  const flags = [`${GATE_COOKIE_NAME}=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${GATE_COOKIE_MAX_AGE_S}`];
  if (secure) flags.push("Secure");
  return flags.join("; ");
};

/** Clears the cookie at the new path and at the legacy `/admin` path. */
export const clearGateCookieHeaders = (secure: boolean): string[] =>
  ["/", "/admin"].map((path) => {
    const flags = [`${GATE_COOKIE_NAME}=`, `Path=${path}`, "HttpOnly", "SameSite=Lax", "Max-Age=0"];
    if (secure) flags.push("Secure");
    return flags.join("; ");
  });
