import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Database, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  EVENT_DESCRIPTIONS,
  formatPercent,
  installRate,
  percent,
  prettyLabel,
  stageRates,
  withShares,
  type BreakdownKind,
  type LabelCount,
  type PwaOverview,
  type StageCount,
} from "@/lib/pwaAnalyticsSummary";

type RangeDays = 7 | 30 | 90;

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 } as const;
const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 } as const;

/** Colour follows the entity (device form factor), not its rank. */
const DEVICE_COLOR: Record<string, string> = {
  Phone: "hsl(var(--chart-1))",
  Tablet: "hsl(var(--chart-2))",
  Desktop: "hsl(var(--chart-3))",
  Unknown: "hsl(var(--muted-foreground))",
};

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

const Breakdown = ({ kind, rows, empty = "No data yet." }: { kind: BreakdownKind; rows: LabelCount[]; empty?: string }) => {
  const shaped = withShares(kind, rows);
  const max = Math.max(1, ...shaped.map((r) => r.count));
  if (!shaped.length) return <p className="py-4 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {shaped.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-card-foreground">{r.label}</span>
            <span className="text-muted-foreground">
              {r.count.toLocaleString()} · {formatPercent(r.share)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted" role="presentation">
            <div className="h-2 rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: DEVICE_COLOR[r.label] ?? "hsl(var(--chart-1))" }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

const Funnel = ({ stages }: { stages: StageCount[] }) => {
  const max = Math.max(1, ...stages.map((s) => Number(s.count)));
  const rates = stageRates(stages);
  return (
    <div className="space-y-3">
      {stages.map((s, i) => (
        <div key={s.stage}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-card-foreground">{s.stage}</span>
            <span className="text-muted-foreground">
              {Number(s.count).toLocaleString()}
              {i > 0 && ` · ${formatPercent(rates[i])} of previous`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted" role="presentation">
            <div className="h-2 rounded-full" style={{ width: `${(Number(s.count) / max) * 100}%`, background: "hsl(var(--chart-1))" }} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Installed-app analytics: install funnel, installs / launches by device, platform and browser,
 * offline podcast usage and push subscriptions. Reads the admin-gated aggregate admin_pwa_overview()
 * (counts only). Counts are events, not unique people.
 */
const PwaAnalyticsPanel = () => {
  const [range, setRange] = useState<RangeDays>(30);
  const [data, setData] = useState<PwaOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: rpcError } = await supabase.rpc("admin_pwa_overview" as never, { p_days: range } as never);
    setLoading(false);
    if (rpcError) {
      setError("Couldn't load app analytics. The 20261005110000_admin_pwa_analytics migration may not be applied yet.");
      return;
    }
    setData(res as unknown as PwaOverview);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = data?.totals;
  const tiles = useMemo(() => {
    if (!totals) return [];
    return [
      { label: "App installs", value: totals.installs.toLocaleString() },
      { label: "Install rate (installs ÷ prompts shown)", value: formatPercent(installRate(totals)) },
      { label: "Installed-app launches", value: totals.launches.toLocaleString() },
      { label: "Signed-in launchers", value: totals.launch_users.toLocaleString() },
      { label: "Push subscriptions", value: totals.push_subscribed.toLocaleString() },
      { label: "Offline downloads", value: totals.downloads_completed.toLocaleString() },
      { label: "Offline plays", value: totals.offline_plays.toLocaleString() },
      { label: "Offline sessions", value: totals.offline_sessions.toLocaleString() },
    ];
  }, [totals]);

  const hasAnyData = Boolean(totals && totals.events > 0);

  return (
    <section className="space-y-4" aria-label="App and install analytics">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">App installs & devices</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Installs, launches, offline use and push subscriptions from the installable app, broken down by device type, platform and
            browser. Counts are events, not unique people.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {([7, 30, 90] as const).map((d) => (
            <Button key={d} size="sm" variant={range === d ? "default" : "outline"} onClick={() => setRange(d)}>
              {d}d
            </Button>
          ))}
          <Button size="icon" variant="ghost" onClick={() => void load()} aria-label="Refresh app analytics" disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((t) => (
              <Card key={t.label}>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-card-foreground">{t.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.label}, last {range}d
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {!hasAnyData && (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No app events in this window yet. Events appear here once visitors see the install prompt, install the app, or use it offline.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Install funnel" note="Prompt shown → native dialog opened → accepted → app installed. iOS/iPadOS has no native dialog and fires no appinstalled event, so iPhone/iPad installs are counted on the installed app’s first launch instead.">
              <Funnel stages={data.install_funnel} />
            </ChartCard>
            <ChartCard title="How people responded to the prompt">
              <Funnel stages={data.prompt_outcomes.map((o) => ({ stage: o.outcome, count: o.count }))} />
              {data.prompt_by_kind.length > 0 && (
                <table className="mt-4 w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-1 font-medium">Prompt type</th>
                      <th className="py-1 text-right font-medium">Shown</th>
                      <th className="py-1 text-right font-medium">Dismissed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.prompt_by_kind.map((k) => (
                      <tr key={k.kind} className="border-t border-border">
                        <td className="py-1">{prettyLabel("kind", k.kind)}</td>
                        <td className="py-1 text-right">{Number(k.viewed).toLocaleString()}</td>
                        <td className="py-1 text-right">
                          {Number(k.dismissed).toLocaleString()} ({formatPercent(percent(Number(k.dismissed), Number(k.viewed)))})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Installs by device type">
              <Breakdown kind="device" rows={data.installs_by_device} />
            </ChartCard>
            <ChartCard title="Installs by platform">
              <Breakdown kind="platform" rows={data.installs_by_platform} />
            </ChartCard>
            <ChartCard title="Installs by browser">
              <Breakdown kind="browser" rows={data.installs_by_browser} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Installed-app launches by device">
              <Breakdown kind="device" rows={data.launches_by_device} />
            </ChartCard>
            <ChartCard title="Installed-app launches by platform">
              <Breakdown kind="platform" rows={data.launches_by_platform} />
            </ChartCard>
            <ChartCard title="Who sees the install prompt (device)">
              <Breakdown kind="device" rows={data.prompts_by_device} />
            </ChartCard>
          </div>

          <ChartCard title="Per day">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.daily} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tickFormatter={dayLabel} tick={tick} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                  <Tooltip labelFormatter={dayLabel} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="prompts" name="Prompts shown" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="installs" name="Installs" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="launches" name="App launches" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="push" name="Push subscriptions" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="downloads" name="Offline downloads" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Push notifications">
              <Funnel stages={data.push_funnel} />
              <h4 className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Subscribed devices by platform</h4>
              <Breakdown kind="platform" rows={data.push_by_platform} />
            </ChartCard>
            <ChartCard title="Offline podcasts">
              <Funnel stages={data.offline_podcasts} />
            </ChartCard>
            <ChartCard title="Events by display mode" note="“standalone” = inside the installed app; “browser” = a normal tab.">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.display_mode} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
                    <YAxis tick={tick} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Events" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title={`App event types (${data.by_event.length})`}>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1.5 pr-3 font-medium">Event</th>
                    <th className="py-1.5 pr-3 font-medium">Meaning</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Events</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Users</th>
                    <th className="py-1.5 font-medium">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_event.map((e) => (
                    <tr key={e.event_name} className="border-t border-border">
                      <td className="py-1.5 pr-3 font-mono text-xs text-card-foreground">{e.event_name}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{EVENT_DESCRIPTIONS[e.event_name] ?? ""}</td>
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

export default PwaAnalyticsPanel;
