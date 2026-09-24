import { useEffect, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, Link2Off, Triangle, Database, Activity, UserCheck } from "lucide-react";

type RangeDays = 7 | 30 | 90;

interface VercelAnalytics {
  totals: { pageviews: number; visitors: number };
  daily: { day: string; pageviews: number }[];
  topPages: { path: string; pageviews: number }[];
}

interface SupabaseAnalytics {
  totalEvents: number;
  uniqueUsers: number;
  eventsDaily: { day: string; count: number }[];
  topEvents: { eventName: string; count: number }[];
}

interface AnalyticsPayload {
  ok: true;
  since: string;
  until: string;
  vercel: VercelAnalytics;
  supabase: SupabaseAnalytics;
}

interface AnalyticsError {
  ok: false;
  error: string;
  message?: string;
}

type AnalyticsState =
  | { status: "loading" }
  | { status: "not_connected" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AnalyticsPayload };

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });

const chartTooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
} as const;

/** Every chart on this tab carries one of these two badges so its data
 *  provenance is never ambiguous — Vercel Web Analytics (real visitor/
 *  pageview traffic Vercel measures at the edge) vs this app's own
 *  analytics_events table (the ConversionEvent vocabulary trackConversionEvent()
 *  writes from src/lib/analytics-events.ts). Never blended into one number. */
const SourceBadge = ({ source }: { source: "vercel" | "supabase" }) =>
  source === "vercel" ? (
    <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
      <Triangle className="h-2.5 w-2.5 fill-current" /> Vercel Web Analytics
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
      <Database className="h-2.5 w-2.5" /> Supabase — SkinLabs events
    </Badge>
  );

const ChartCard = ({ title, source, children }: { title: string; source: "vercel" | "supabase"; children: ReactNode }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
        <SourceBadge source={source} />
      </div>
      {children}
    </CardContent>
  </Card>
);

/**
 * Live analytics pulled from two independent, clearly-labelled sources via
 * api/admin-analytics.ts -- never fabricated or blended together:
 *   - Vercel Web Analytics: real edge-measured pageviews/visitors/top pages.
 *   - Supabase analytics_events: this app's own ConversionEvent vocabulary
 *     (ai_analysis_started, checkout_completed, marketplace_add_to_cart,
 *     etc. -- see src/lib/analytics-events.ts for the full list), dual-written
 *     by trackConversionEvent() alongside the Vercel Analytics call.
 * Requires VERCEL_API_TOKEN to be configured on the Vercel project (see that
 * file's header comment); until it is, this renders an honest "not connected"
 * state rather than a chart with no real data behind it.
 */
const AnalyticsTab = () => {
  const [range, setRange] = useState<RangeDays>(30);
  const [state, setState] = useState<AnalyticsState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const res = await fetch(`/api/admin-analytics?days=${range}`);
        const body = (await res.json().catch(() => null)) as AnalyticsPayload | AnalyticsError | null;
        if (cancelled) return;
        if (res.status === 503 || (body && body.ok === false && body.error === "not_configured")) {
          setState({ status: "not_connected" });
          return;
        }
        if (!res.ok || !body?.ok) {
          setState({ status: "error", message: (body as AnalyticsError | null)?.message || "Failed to load analytics." });
          return;
        }
        setState({ status: "ready", data: body });
      } catch {
        if (!cancelled) setState({ status: "error", message: "Network error while loading analytics." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground max-w-lg">
          Real traffic (Vercel Web Analytics) and real product usage (this app's own SkinLabs conversion events,
          stored in Supabase) — each chart below says which one it's showing. Nothing here is estimated or simulated.
        </p>
        <div className="flex gap-1">
          {([7, 30, 90] as const).map((d) => (
            <Button key={d} size="sm" variant={range === d ? "default" : "outline"} onClick={() => setRange(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {state.status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}

      {state.status === "not_connected" && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground space-y-2">
            <Link2Off className="h-10 w-10 mx-auto opacity-50" />
            <p className="font-medium text-card-foreground">Analytics not connected</p>
            <p className="text-sm max-w-md mx-auto">
              This project doesn't have a <code className="text-xs bg-muted px-1 py-0.5 rounded">VERCEL_API_TOKEN</code>{" "}
              configured yet. Add one scoped to this project in the Vercel dashboard (Account Settings → Tokens) to
              connect real traffic data here.
            </p>
          </CardContent>
        </Card>
      )}

      {state.status === "error" && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="font-medium text-card-foreground mb-1">Couldn't load analytics</p>
            <p className="text-sm">{state.message}</p>
          </CardContent>
        </Card>
      )}

      {state.status === "ready" && (
        <>
          {/* Stat tiles: two per source, each carrying its own badge so the
              row itself never reads as one blended total. */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-card-foreground">{state.data.vercel.totals.pageviews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pageviews, last {range}d</p>
                  <SourceBadge source="vercel" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-7 w-7 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-card-foreground">{state.data.vercel.totals.visitors.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Unique visitors, last {range}d</p>
                  <SourceBadge source="vercel" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="h-7 w-7 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-card-foreground">{state.data.supabase.totalEvents.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Conversion events, last {range}d</p>
                  <SourceBadge source="supabase" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <UserCheck className="h-7 w-7 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-card-foreground">{state.data.supabase.uniqueUsers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Signed-in users engaged, last {range}d</p>
                  <SourceBadge source="supabase" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two daily trend lines, side by side for easy visual comparison —
              deliberately not merged onto one axis (different units, different
              sources: see the dataviz "never a dual-axis chart" rule). */}
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Daily pageviews" source="vercel">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={state.data.vercel.daily} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={dayLabel}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip labelFormatter={dayLabel} contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="pageviews" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Daily conversion events" source="supabase">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={state.data.supabase.eventsDaily} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={dayLabel}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip labelFormatter={dayLabel} contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Top pages" source="vercel">
              {state.data.vercel.topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pageview data for this range.</p>
              ) : (
                <div className="space-y-2">
                  {state.data.vercel.topPages.slice(0, 10).map((p) => (
                    <div key={p.path} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-card-foreground" title={p.path}>
                        {p.path}
                      </span>
                      <span className="text-muted-foreground shrink-0">{p.pageviews.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard title="Conversion events by type" source="supabase">
              {state.data.supabase.topEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conversion events tracked in this range yet.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={state.data.supabase.topEvents.slice(0, 8)}
                      margin={{ left: 0, right: 16, top: 4, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="eventName"
                        width={140}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
