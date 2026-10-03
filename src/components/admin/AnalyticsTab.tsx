import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Activity, Eye, Gauge, Users, Database, Triangle, Loader2, Link2Off, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RangeDays = 7 | 30 | 90;
interface VercelAnalytics { totals: { pageviews: number; visitors: number }; daily: { day: string; pageviews: number }[]; topPages: { path: string; pageviews: number }[] }
interface SupabaseAnalytics { totalEvents: number; uniqueUsers: number; eventsDaily: { day: string; count: number }[]; topEvents: { eventName: string; count: number }[] }
interface AnalyticsPayload { ok: true; since: string; until: string; vercel: VercelAnalytics; supabase: SupabaseAnalytics }
type State = { status: "loading" } | { status: "not_connected" } | { status: "error"; message: string } | { status: "ready"; data: AnalyticsPayload };

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 } as const;
const SourceBadge = ({ source }: { source: "vercel" | "supabase" }) => (
  <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
    {source === "vercel" ? <Triangle className="h-2.5 w-2.5 fill-current" /> : <Database className="h-2.5 w-2.5" />}
    {source === "vercel" ? "Vercel traffic" : "SkinLabs events"}
  </Badge>
);
const ChartCard = ({ title, source, children, className }: { title: string; source: "vercel" | "supabase"; children: ReactNode; className?: string }) => (
  <Card className={`overflow-hidden border-border/70 shadow-sm ${className ?? ""}`}>
    <CardContent className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-bold tracking-tight text-card-foreground">{title}</h3>
        <SourceBadge source={source} />
      </div>
      {children}
    </CardContent>
  </Card>
);

const AnalyticsTab = () => {
  const [range, setRange] = useState<RangeDays>(30);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetch(`/api/admin-analytics?days=${range}`)
      .then(async (res) => ({ status: res.status, body: (await res.json().catch(() => null)) as AnalyticsPayload | { ok: false; error: string; message?: string } | null }))
      .then(({ status, body }) => {
        if (cancelled) return;
        if (status === 503 || (body && body.ok === false && body.error === "not_configured")) return setState({ status: "not_connected" });
        if (!body || !body.ok) return setState({ status: "error", message: body?.message || "Failed to load analytics." });
        setState({ status: "ready", data: body });
      })
      .catch(() => !cancelled && setState({ status: "error", message: "Network error while loading analytics." }));
    return () => { cancelled = true; };
  }, [range]);

  const insights = useMemo(() => {
    if (state.status !== "ready") return null;
    const { vercel, supabase } = state.data;
    const eventsPerUser = supabase.uniqueUsers ? supabase.totalEvents / supabase.uniqueUsers : 0;
    const topEvent = supabase.topEvents[0];
    const topPage = vercel.topPages[0];
    return { eventsPerUser, topEvent, topPage };
  }, [state]);

  if (state.status === "loading") return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (state.status === "not_connected") return <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground"><Link2Off className="mx-auto mb-3 h-9 w-9 opacity-50" /><p className="font-heading font-bold text-card-foreground">Analytics not connected</p><p className="mx-auto mt-1 max-w-md text-sm">Add <code className="rounded bg-muted px-1 py-0.5 text-xs">VERCEL_API_TOKEN</code> to connect real traffic. SkinLabs event analytics will remain clearly separated from Vercel traffic.</p></CardContent></Card>;
  if (state.status === "error") return <Card><CardContent className="p-8 text-center"><p className="font-heading font-bold">Couldn't load analytics</p><p className="mt-1 text-sm text-muted-foreground">{state.message}</p></CardContent></Card>;

  const { vercel, supabase } = state.data;

  return (
    <div className="space-y-5">
      <div className="sl-surface flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-heading text-sm font-bold">Live product intelligence</p><p className="text-xs text-muted-foreground">Traffic and tracked product behaviour are intentionally shown as separate sources.</p></div>
        <div className="flex gap-1 overflow-x-auto">
          {([7, 30, 90] as const).map((d) => <Button key={d} size="sm" variant={range === d ? "default" : "outline"} onClick={() => setRange(d)} className="shrink-0">{d}d</Button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Pageviews", value: vercel.totals.pageviews, icon: Eye, source: "vercel" as const },
          { label: "Visitors", value: vercel.totals.visitors, icon: Users, source: "vercel" as const },
          { label: "Tracked events", value: supabase.totalEvents, icon: Activity, source: "supabase" as const },
          { label: "Engaged users", value: supabase.uniqueUsers, icon: Gauge, source: "supabase" as const },
        ].map((s) => (
          <Card key={s.label} className="overflow-hidden border-border/70 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><s.icon className="h-4 w-4 text-muted-foreground" /><SourceBadge source={s.source} /></div><p className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-card-foreground">{s.value.toLocaleString()}</p><p className="text-xs text-muted-foreground">{s.label} · {range}d</p></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Traffic momentum" source="vercel">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={vercel.daily}><defs><linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.22}/><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" tickFormatter={dayLabel} tick={{fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} width={32}/><Tooltip labelFormatter={dayLabel} contentStyle={tooltipStyle}/><Area type="monotone" dataKey="pageviews" stroke="hsl(var(--chart-1))" fill="url(#trafficFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title="Product engagement momentum" source="supabase">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={supabase.eventsDaily}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" tickFormatter={dayLabel} tick={{fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} width={32}/><Tooltip labelFormatter={dayLabel} contentStyle={tooltipStyle}/><Line type="monotone" dataKey="count" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={false} activeDot={{r:4}}/></LineChart></ResponsiveContainer></div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <ChartCard title="Most-used product actions" source="supabase">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={supabase.topEvents.slice(0, 8)} margin={{left:0,right:12,top:0,bottom:0}}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="eventName" width={145} tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="count" radius={[0,6,6,0]}>{supabase.topEvents.slice(0,8).map((_,i)=><Cell key={i} fill={i===0 ? "hsl(var(--foreground))" : "hsl(var(--chart-2))"}/>)}</Bar></BarChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title="Content demand" source="vercel">
          <div className="space-y-3">{vercel.topPages.slice(0,8).map((p,i)=><div key={p.path}><div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium text-card-foreground">{p.path}</span><span className="shrink-0 text-muted-foreground">{p.pageviews.toLocaleString()}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground transition-all" style={{width:`${Math.max(3,(p.pageviews/(vercel.topPages[0]?.pageviews || 1))*100)}%`}}/></div>{i===0 && <p className="mt-1 text-[10px] text-muted-foreground">Most visited route in this period</p>}</div>)}{!vercel.topPages.length && <p className="text-sm text-muted-foreground">No pageview data for this range.</p>}</div>
        </ChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sl-surface"><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Events / engaged user</p><p className="mt-2 font-heading text-3xl font-extrabold">{insights?.eventsPerUser.toFixed(1)}</p><p className="mt-1 text-xs text-muted-foreground">Tracked actions per user with a user ID.</p></CardContent></Card>
        <Card className="sl-surface"><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Top action</p><p className="mt-2 truncate font-heading text-lg font-extrabold">{insights?.topEvent?.eventName || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{insights?.topEvent?.count.toLocaleString() || 0} tracked events.</p></CardContent></Card>
        <Card className="sl-surface"><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Top destination</p><p className="mt-2 flex items-center gap-1 truncate font-heading text-lg font-extrabold">{insights?.topPage?.path || "—"} <ArrowUpRight className="h-3.5 w-3.5 shrink-0" /></p><p className="mt-1 text-xs text-muted-foreground">{insights?.topPage?.pageviews.toLocaleString() || 0} pageviews.</p></CardContent></Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;
