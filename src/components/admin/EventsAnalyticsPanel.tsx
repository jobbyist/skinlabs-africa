import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, RefreshCw, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type RangeDays = 7 | 30 | 90;

interface EventsOverview {
  window_days: number;
  totals: { events: number; signed_in_users: number; event_types: number; signed_in_events: number; first_event_at: string | null };
  daily: { day: string; events: number; users: number }[];
  daily_by_category: { day: string; category: string; count: number }[];
  by_category: { category: string; count: number }[];
  by_event: { event_name: string; category: string; count: number; users: number; last_seen: string }[];
  by_path: { path: string; count: number }[];
  by_hour: { hour: number; count: number }[];
  funnel: { stage: string; count: number }[];
}

/** Fixed category order -> fixed colour (colour follows the entity, never its rank). */
const CATEGORIES = [
  "SKYNN AI",
  "Advanced analysis",
  "Pricing & upgrades",
  "Sign-up & sign-in",
  "Routines",
  "Content & community",
] as const;
const CATEGORY_COLOR: Record<string, string> = {
  "SKYNN AI": "hsl(var(--chart-1))",
  "Advanced analysis": "hsl(var(--chart-2))",
  "Pricing & upgrades": "hsl(var(--chart-3))",
  "Sign-up & sign-in": "hsl(var(--chart-4))",
  Routines: "hsl(var(--chart-5))",
  "Content & community": "hsl(var(--muted-foreground))",
};

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 } as const;
const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
} as const;

const ChartCard = ({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) => (
  <Card>
    <CardContent className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
        <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
          <Database className="h-2.5 w-2.5" /> Supabase — SkinLabs events
        </Badge>
      </div>
      {children}
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </CardContent>
  </Card>
);

/**
 * Charts for everything in analytics_events, from the admin-gated aggregate
 * RPC admin_events_overview() (counts only, no payloads). Event counts are
 * events, not sessions or unique visitors: anonymous events carry no user id.
 */
const EventsAnalyticsPanel = () => {
  const [range, setRange] = useState<RangeDays>(30);
  const [data, setData] = useState<EventsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: rpcError } = await supabase.rpc("admin_events_overview" as never, { p_days: range } as never);
    setLoading(false);
    if (rpcError) {
      setError("Couldn't load event analytics.");
      return;
    }
    setData(res as unknown as EventsOverview);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const stacked = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, Record<string, number | string>>();
    for (const r of data.daily_by_category) {
      const row = byDay.get(r.day) ?? { day: r.day };
      row[r.category] = Number(r.count);
      byDay.set(r.day, row);
    }
    return [...byDay.values()].sort((a, b) => String(a.day).localeCompare(String(b.day)));
  }, [data]);

  const events = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (data?.by_event ?? []).filter((e) => !q || e.event_name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
  }, [data, filter]);

  const funnelMax = Math.max(1, ...(data?.funnel ?? []).map((f) => Number(f.count)));

  return (
    <section className="space-y-4" aria-label="Event analytics">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Events captured in Supabase</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Every product event the app records (analytics_events), summarised. Counts are events, not unique visitors.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {([7, 30, 90] as const).map((d) => (
            <Button key={d} size="sm" variant={range === d ? "default" : "outline"} onClick={() => setRange(d)}>
              {d}d
            </Button>
          ))}
          <Button size="icon" variant="ghost" onClick={() => void load()} aria-label="Refresh event analytics" disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Events", data.totals.events],
              ["Event types", data.totals.event_types],
              ["Signed-in users", data.totals.signed_in_users],
              ["Signed-in share", data.totals.events ? `${Math.round((data.totals.signed_in_events / data.totals.events) * 100)}%` : "—"],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-card-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
                  <p className="text-xs text-muted-foreground">{label}, last {range}d</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Events per day">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tickFormatter={dayLabel} tick={tick} axisLine={false} tickLine={false} />
                    <YAxis tick={tick} axisLine={false} tickLine={false} width={36} />
                    <Tooltip labelFormatter={dayLabel} contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="events" name="Events" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Signed-in users per day" note="Anonymous events have no user id and are not counted here.">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tickFormatter={dayLabel} tick={tick} axisLine={false} tickLine={false} />
                    <YAxis tick={tick} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip labelFormatter={dayLabel} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="users" name="Signed-in users" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.18} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Events per day by area">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stacked} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tickFormatter={dayLabel} tick={tick} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} width={36} />
                  <Tooltip labelFormatter={dayLabel} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {CATEGORIES.map((c) => (
                    <Bar key={c} dataKey={c} stackId="a" fill={CATEGORY_COLOR[c]} stroke="hsl(var(--card))" strokeWidth={1} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Top events">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={data.by_event.slice(0, 12)} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="event_name" width={170} tick={tick} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Events" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Funnel (event counts)" note="Counts of each event, not unique people, so stages can exceed the one before them.">
              <div className="space-y-3">
                {data.funnel.map((f) => (
                  <div key={f.stage}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-card-foreground">{f.stage}</span>
                      <span className="text-muted-foreground">{Number(f.count).toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: `${(Number(f.count) / funnelMax) * 100}%`, background: "hsl(var(--chart-1))" }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Events by hour of day (SAST)">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_hour} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="hour" tick={tick} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={tick} axisLine={false} tickLine={false} width={36} />
                    <Tooltip labelFormatter={(h) => `${h}:00`} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Events" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Events by page">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={data.by_path} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="path" width={140} tick={tick} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Events" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title={`All event types (${events.length})`}>
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by event or area" className="mb-3 max-w-xs" aria-label="Filter event types" />
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1.5 pr-3 font-medium">Event</th>
                    <th className="py-1.5 pr-3 font-medium">Area</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Events</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Users</th>
                    <th className="py-1.5 font-medium">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.event_name} className="border-t border-border">
                      <td className="py-1.5 pr-3 font-mono text-xs text-card-foreground">{e.event_name}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{e.category}</td>
                      <td className="py-1.5 pr-3 text-right">{Number(e.count).toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right">{Number(e.users).toLocaleString()}</td>
                      <td className="py-1.5 text-muted-foreground">{new Date(e.last_seen).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </section>
  );
};

export default EventsAnalyticsPanel;
