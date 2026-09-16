/**
 * Marketplace restricted-access gate.
 *
 * Validates credentials against Vercel env vars (never expose these to the client):
 *   MARKETPLACE_USERNAME
 *   MARKETPLACE_PASSWORD
 *
 * POST  { username, password } → sets httpOnly cookie, returns { ok: true }
 * GET   → { ok: true } if cookie is valid
 * DELETE → clears cookie
 *
 * Cookie: marketplace_access=<hmac> ; Path=/ ; HttpOnly ; Secure ; SameSite=Lax
 */
import { createHmac, timingSafeEqual } from "node:crypto";

type VercelReq = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: () => void;
};

const COOKIE_NAME = "marketplace_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function expectedToken(password: string): string {
  return createHmac("sha256", password).update("skinlabs-marketplace-access-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function readCookie(req: VercelReq, name: string): string | null {
  if (req.cookies && typeof req.cookies[name] === "string") return req.cookies[name];
  const raw = req.headers.cookie;
  if (!raw || Array.isArray(raw)) return null;
  const parts = raw.split(";").map((p) => p.trim());
  for (const part of parts) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

function setAccessCookie(res: VercelRes, token: string) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const flags = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (secure) flags.push("Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
}

function clearAccessCookie(res: VercelRes) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const flags = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) flags.push("Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
}

function parseBody(req: VercelReq): { username?: string; password?: string } {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as { username?: string; password?: string };
    } catch {
      return {};
    }
  }
  return req.body as { username?: string; password?: string };
}

export default async function handler(req: VercelReq, res: VercelRes) {
  const username = process.env.MARKETPLACE_USERNAME;
  const password = process.env.MARKETPLACE_PASSWORD;

  if (!username || !password) {
    res.status(503).json({
      ok: false,
      error: "Marketplace access is not configured (missing MARKETPLACE_USERNAME / MARKETPLACE_PASSWORD).",
    });
    return;
  }

  const token = expectedToken(password);

  if (req.method === "GET") {
    const cookie = readCookie(req, COOKIE_NAME);
    if (cookie && safeEqual(cookie, token)) {
      res.status(200).json({ ok: true });
      return;
    }
    res.status(401).json({ ok: false });
    return;
  }

  if (req.method === "DELETE") {
    clearAccessCookie(res);
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = parseBody(req);
  const givenUser = typeof body.username === "string" ? body.username.trim() : "";
  const givenPass = typeof body.password === "string" ? body.password : "";

  if (!safeEqual(givenUser, username) || !safeEqual(givenPass, password)) {
    await new Promise((r) => setTimeout(r, 400));
    res.status(401).json({ ok: false, error: "Invalid username or password." });
    return;
  }

  setAccessCookie(res, token);
  res.status(200).json({ ok: true });
}
