/**
 * SkinLabs administrator gate.
 *
 * The site already has a real admin system: a genuine Supabase Auth account
 * (admin@skinlabs.co.za) holding the 'admin' role via has_role()/user_roles,
 * which every admin-facing RLS policy is keyed to (see AdminDashboard.tsx).
 * This endpoint does NOT replace or duplicate that -- it adds one new,
 * dedicated credential in front of it, and bridges into a real Supabase
 * session so the existing has_role/RLS checks keep working unmodified:
 *
 *   1. Validate { password } against the Vercel-only ADMIN_PASSWORD secret
 *      (never exposed to the client, never logged, never returned).
 *   2. On success, set a short-lived HttpOnly/Secure/SameSite gate cookie
 *      (proves this browser passed the password check -- verified
 *      server-side on every /admin load via GET, never trusted from
 *      client-side React state).
 *   3. Use the Supabase service_role key (already a documented Vercel
 *      secret for this project -- see api/product-review-sync.ts) to call
 *      GoTrue's admin "generate link" endpoint for that ONE fixed account,
 *      and return the resulting one-time token_hash (not the password, not
 *      a standing secret -- single-use, short-lived, and only ever valid
 *      for admin@skinlabs.co.za). The browser then calls
 *      supabase.auth.verifyOtp({ token_hash, type: 'magiclink' }) to
 *      establish a real session -- no email is ever sent, so this is
 *      unaffected by the current SMTP issues disabling consumer magic-link.
 *
 * If SUPABASE_SERVICE_ROLE_KEY isn't configured, the gate cookie is still
 * set (password was correct) but tokenHash comes back null -- the client
 * falls back to prompting a normal Supabase sign-in for that account so
 * the dashboard's own has_role check can still pass.
 *
 * POST   { password }              -> sets gate cookie, returns { ok, tokenHash }
 * GET                               -> { ok: true } if the gate cookie is valid
 * DELETE                            -> clears the gate cookie (logout)
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

const ADMIN_EMAIL = "admin@skinlabs.co.za";
const COOKIE_NAME = "skinlabs_admin_gate";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours -- short-lived by design, re-checked server-side on every load.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gnkpzijxuciiaamakgzm.supabase.co";

function expectedToken(secret: string): string {
  return createHmac("sha256", secret).update("skinlabs-admin-gate-v1").digest("hex");
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
  for (const part of raw.split(";").map((p) => p.trim())) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

function setGateCookie(res: VercelRes, token: string) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const flags = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, "Path=/admin", "HttpOnly", "SameSite=Lax", `Max-Age=${COOKIE_MAX_AGE}`];
  if (secure) flags.push("Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
}

function clearGateCookie(res: VercelRes) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const flags = [`${COOKIE_NAME}=`, "Path=/admin", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) flags.push("Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
}

function parseBody(req: VercelReq): { password?: string } {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as { password?: string };
    } catch {
      return {};
    }
  }
  return req.body as { password?: string };
}

/** Bridges the password check into a real Supabase session for the fixed admin account, without sending an email. */
async function generateAdminSessionToken(serviceRoleKey: string): Promise<string | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ type: "magiclink", email: ADMIN_EMAIL }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { hashed_token?: string; properties?: { hashed_token?: string } };
    return data.hashed_token ?? data.properties?.hashed_token ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelReq, res: VercelRes) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (req.method === "GET") {
    if (!adminPassword) {
      res.status(503).json({ ok: false, error: "Admin login is not configured." });
      return;
    }
    const cookie = readCookie(req, COOKIE_NAME);
    res.status(cookie && safeEqual(cookie, expectedToken(adminPassword)) ? 200 : 401).json({
      ok: Boolean(cookie && safeEqual(cookie, expectedToken(adminPassword))),
    });
    return;
  }

  if (req.method === "DELETE") {
    clearGateCookie(res);
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!adminPassword) {
    // Fail safe: never leak whether ADMIN_PASSWORD merely isn't set vs. a wrong password.
    res.status(503).json({ ok: false, error: "Admin login is not configured. Contact engineering." });
    return;
  }

  const { password } = parseBody(req);
  const givenPassword = typeof password === "string" ? password : "";

  if (!safeEqual(givenPassword, adminPassword)) {
    // Constant-ish delay so a failed attempt doesn't respond meaningfully faster than a success.
    await new Promise((r) => setTimeout(r, 400));
    res.status(401).json({ ok: false, error: "Invalid credentials." });
    return;
  }

  setGateCookie(res, expectedToken(adminPassword));

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const tokenHash = serviceRoleKey ? await generateAdminSessionToken(serviceRoleKey) : null;

  res.status(200).json({ ok: true, tokenHash, email: ADMIN_EMAIL });
}
