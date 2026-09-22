/**
 * Live traffic/conversion analytics for the admin dashboard's Analytics tab,
 * pulled directly from Vercel's own Web Analytics REST API rather than
 * fabricated -- see src/components/admin/AnalyticsTab.tsx for the consumer.
 *
 * Auth: the same skinlabs_admin_gate HttpOnly cookie api/admin-auth.ts sets
 * (checked the identical way -- copied rather than shared, matching this
 * repo's existing convention of duplicating this small block per api/*.ts
 * file rather than introducing an api/_shared/ module; see
 * api/marketplace-auth.ts for the same duplicated pattern). Never trusts a
 * client-supplied "I'm an admin" flag.
 *
 * Required Vercel project environment variable (cannot be set from this
 * codebase -- see the "Vercel token" note in this repo's implementation
 * history): a Vercel personal access token scoped to this project, added by
 * a human via the Vercel dashboard (Account Settings -> Tokens) or
 * `vercel tokens add`. Until it's set, every request below fails fast with a
 * clear "not configured" response so the Analytics tab can render an honest
 * "not connected" state instead of a fabricated chart.
 *   - VERCEL_API_TOKEN     Bearer token for api.vercel.com.
 * Optional (both default to this repo's real, already-known project/team --
 * override only if this ever deploys under a different Vercel project):
 *   - VERCEL_PROJECT_ID    Defaults to prj_QiDafIkNxgVHBnDuepg4EvxNsH8J.
 *   - VERCEL_TEAM_ID       Defaults to team_SsKFiB8H2aVoVKQAchiFleRR.
 *
 * topEvents deliberately does NOT call Vercel's `/events/aggregate` endpoint:
 * confirmed live against this exact project that it 402s ("Accessing
 * Analytics custom events requires an Enterprise or Pro plan"), while
 * `/visits/*` works fine on this plan. Conversion events are instead read
 * from the analytics_events table (supabase/migrations/20260921120000_
 * analytics_events_core.sql) via a service-role client -- the same data
 * trackConversionEvent() already dual-writes there, so this doesn't depend
 * on a Vercel plan upgrade. Requires the SUPABASE_SERVICE_ROLE_KEY/
 * VITE_SUPABASE_URL secrets already configured for other server functions
 * in this project (see api/product-review-sync.ts).
 * Pageviews/visitors/top-pages and the events panel are independently
 * fault-tolerant -- one failing doesn't take down the other.
 *
 * GET /api/admin-analytics?days=7|30|90 (default 30)
 * Response: { ok: true, since, until,
 *   vercel: { totals: { pageviews, visitors }, daily: [{ day, pageviews }],
 *             topPages: [{ path, pageviews }] },
 *   supabase: { totalEvents, uniqueUsers, eventsDaily: [{ day, count }],
 *               topEvents: [{ eventName, count }] } }
 * The top-level vercel/supabase split is deliberate -- the Analytics tab
 * labels every chart with which of these two independent sources it came
 * from, so nothing on the page is ambiguous about its provenance.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type VercelReq = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
};

const COOKIE_NAME = "skinlabs_admin_gate";
const DEFAULT_PROJECT_ID = "prj_QiDafIkNxgVHBnDuepg4EvxNsH8J";
const DEFAULT_TEAM_ID = "team_SsKFiB8H2aVoVKQAchiFleRR";
const API_BASE = "https://api.vercel.com/v1/query/web-analytics";

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

function isGateValid(req: VercelReq): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookie = readCookie(req, COOKIE_NAME);
  return Boolean(cookie && safeEqual(cookie, expectedToken(adminPassword)));
}

interface CountResponse {
  data?: { pageviews?: number; visitors?: number };
}
interface AggregateRow {
  day?: string;
  requestPath?: string;
  count?: number;
  pageviews?: number;
  visitors?: number;
}
interface AggregateResponse {
  data?: AggregateRow[];
}

async function vercelGet<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Vercel API ${path} ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

interface SupabaseAnalytics {
  totalEvents: number;
  uniqueUsers: number;
  eventsDaily: { day: string; count: number }[];
  topEvents: { eventName: string; count: number }[];
}

const EMPTY_SUPABASE_ANALYTICS: SupabaseAnalytics = { totalEvents: 0, uniqueUsers: 0, eventsDaily: [], topEvents: [] };

/** Reads SkinLabs' own conversion-event data from analytics_events (see this
 *  file's header comment for why this doesn't call Vercel's events API,
 *  which 402s on this project's plan). Returns an empty-but-valid shape on
 *  any failure -- an events-panel outage should never take down the
 *  pageview/visitor data this function also serves. */
async function readSupabaseAnalytics(since: string, until: string): Promise<SupabaseAnalytics> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return EMPTY_SUPABASE_ANALYTICS;

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("analytics_events")
      .select("event_name, created_at, user_id")
      .gte("created_at", since)
      .lte("created_at", until)
      .limit(10000);
    if (error || !data) return EMPTY_SUPABASE_ANALYTICS;

    const rows = data as { event_name: string; created_at: string; user_id: string | null }[];
    const eventCounts = new Map<string, number>();
    const dailyCounts = new Map<string, number>();
    const users = new Set<string>();

    for (const row of rows) {
      eventCounts.set(row.event_name, (eventCounts.get(row.event_name) ?? 0) + 1);
      const day = row.created_at.slice(0, 10); // UTC calendar day, matches Vercel's own day bucketing
      dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
      if (row.user_id) users.add(row.user_id);
    }

    return {
      totalEvents: rows.length,
      uniqueUsers: users.size,
      eventsDaily: Array.from(dailyCounts.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      topEvents: Array.from(eventCounts.entries())
        .map(([eventName, count]) => ({ eventName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
    };
  } catch (err) {
    console.error("readSupabaseAnalytics failed:", err);
    return EMPTY_SUPABASE_ANALYTICS;
  }
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!isGateValid(req)) {
    res.status(401).json({ ok: false, error: "Not authorised" });
    return;
  }

  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    res.status(503).json({
      ok: false,
      error: "not_configured",
      message: "VERCEL_API_TOKEN is not set for this project — analytics are not connected yet.",
    });
    return;
  }

  const projectId = process.env.VERCEL_PROJECT_ID || DEFAULT_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID || DEFAULT_TEAM_ID;

  const daysParam = Array.isArray(req.query.days) ? req.query.days[0] : req.query.days;
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30;
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);

  const base = { projectId, teamId, since: since.toISOString(), until: until.toISOString() };

  // Core pageview/visitor data (Vercel) must all succeed together (they're
  // one coherent picture) -- but the Supabase-sourced analytics are read
  // independently and must never take this down, since they depend on a
  // different backend with its own failure modes, and vice versa.
  try {
    const [totals, daily, topPages] = await Promise.all([
      vercelGet<CountResponse>("/visits/count", { projectId, teamId }, token),
      vercelGet<AggregateResponse>("/visits/aggregate", { ...base, by: "day" }, token),
      vercelGet<AggregateResponse>("/visits/aggregate", { ...base, by: "requestPath", limit: "10" }, token),
    ]);
    const supabaseAnalytics = await readSupabaseAnalytics(base.since, base.until);

    res.status(200).json({
      ok: true,
      since: base.since,
      until: base.until,
      vercel: {
        totals: {
          pageviews: totals.data?.pageviews ?? 0,
          visitors: totals.data?.visitors ?? 0,
        },
        daily: (daily.data ?? []).map((row) => ({ day: row.day ?? "", pageviews: row.pageviews ?? row.count ?? 0 })),
        topPages: (topPages.data ?? [])
          .map((row) => ({ path: row.requestPath ?? "(unknown)", pageviews: row.pageviews ?? row.count ?? 0 }))
          .sort((a, b) => b.pageviews - a.pageviews),
      },
      supabase: supabaseAnalytics,
    });
  } catch (err) {
    console.error("admin-analytics failed:", err);
    res.status(502).json({ ok: false, error: "upstream_error", message: String(err).slice(0, 300) });
  }
}
