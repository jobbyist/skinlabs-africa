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
import {
  clearGateCookieHeaders,
  gateCookieHeader,
  mintGateToken,
  readGateCookie,
  safeEqual,
  verifyGateToken,
} from "./_lib/adminGateToken";

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
// Deliberately no hardcoded fallback here (unlike api/product-review-sync.ts's non-security-critical
// use of the same env var): silently defaulting a security-sensitive admin-session bridge to a
// baked-in project URL risks talking to the wrong project on a misconfigured deployment. If this is
// unset, the bridge below is simply skipped (same graceful-degradation path as a missing service-role
// key) rather than the whole login failing, since GET/DELETE never need it at all.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

const isSecure = () => process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

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
async function generateAdminSessionToken(supabaseUrl: string, serviceRoleKey: string): Promise<string | null> {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
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
    const valid = verifyGateToken(adminPassword, readGateCookie(req));
    res.status(valid ? 200 : 401).json({ ok: valid });
    return;
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearGateCookieHeaders(isSecure()));
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

  res.setHeader("Set-Cookie", gateCookieHeader(mintGateToken(adminPassword), isSecure()));

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const tokenHash =
    serviceRoleKey && SUPABASE_URL ? await generateAdminSessionToken(SUPABASE_URL, serviceRoleKey) : null;

  res.status(200).json({ ok: true, tokenHash, email: ADMIN_EMAIL });
}
