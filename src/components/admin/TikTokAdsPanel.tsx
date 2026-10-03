import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import CampaignAttribution from "./CampaignAttribution";

type RangeDays = 7 | 30 | 90;
type PageKey = "home" | "skynn-ai" | "skynn-ai-advanced" | "other";

interface TikTokOverview {
  window_days: number;
  totals: {
    events: number;
    sent: number;
    not_configured: number;
    failed: number;
    identified: number;
    first_event_at: string | null;
    last_event_at: string | null;
  };
  by_page_event: { page_key: PageKey; event_name: string; total: number; sent: number; not_configured: number; failed: number }[];
  daily: { day: string; page_key: PageKey; count: number }[];
  recent: { created_at: string; event_name: string; page_key: PageKey; path: string | null; status: string; upstream_code: number | null; identified: boolean }[];
}

const PAGES: { key: PageKey; label: string; color: string }[] = [
  { key: "home", label: "Homepage", color: "hsl(var(--chart-1))" },
  { key: "skynn-ai", label: "Basic AI Skin Analysis", color: "hsl(var(--chart-2))" },
  { key: "skynn-ai-advanced", label: "Advanced AI Dermatology Analysis", color: "hsl(var(--chart-3))" },
];
const PAGE_LABEL: Record<string, string> = { ...Object.fromEntries(PAGES.map((p) => [p.key, p.label])), other: "Other pages" };

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 } as const;
const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 } as const;

const STATUS_LABEL: Record<string, string> = { sent: "Sent", not_configured: "Awaiting token", rejected: "Rejected", error: "Error" };

/**
 * Admin → Ads. What the TikTok Pixel + Events API have reported for the homepage and SKYNN AI pages, from
 * public.tiktok_event_log (written by the `tiktok-events` edge function) via the admin-gated
 * admin_tiktok_events_overview(). This is our delivery log: events handed to TikTok and whether its API accepted them.
 * Attribution, ad spend and conversion results live in TikTok Events Manager, not here.
 */
const TikTokAdsPanel = () => {
  const [range, setRange] = useState<RangeDays>(30);
  const [data, setData] = useState<TikTokOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: rpcError } = await supabase.rpc("admin_tiktok_events_overview" as never, { p_days: range } as never);
    setLoading(false);
    if (rpcError) {
      setError(
        /does not exist|schema cache|42883|42P01/i.test(rpcError.message)
          ? "The TikTok event log isn't set up yet: apply migration 20261004120000_tiktok_event_log.sql."
          : "Couldn't load TikTok event data.",
      );
      return;
    }
    setData(res as unknown as TikTokOverview);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const stacked = useMemo(() => {
    const byDay = new Map<string, Record<string, number | string>>();
    for (const r of data?.daily ?? []) {
      const row = byDay.get(r.day) ?? { day: r.day };
      row[r.page_key] = Number(r.count);
      byDay.set(r.day, row);
    }
    return [...byDay.values()].sort((a, b) => String(a.day).localeCompare(String(b.day)));
  }, [data]);

  const tracked = useMemo(
    () =>
      PAGES.map((p) => ({
        ...p,
        rows: (data?.by_page_event ?? []).filter((r) => r.page_key === p.key),
      })),
    [data],
  );

  const t = data?.totals;
  const deliveryRate = t && t.events - t.not_configured > 0 ? Math.round((t.sent / (t.events - t.not_configured)) * 100) : null;

  return (
    <section className="space-y-4" aria-label="TikTok ads event tracking">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">TikTok — pixel and Events API</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Events handed to TikTok from visitors who accepted advertising cookies, for the homepage and SKYNN AI pages. This is
            our delivery log; ad spend, attribution and conversions are in TikTok Events Manager.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {([7, 30, 90] as const).map((d) => (
            <Button key={d} size="sm" variant={range === d ? "default" : "outline"} onClick={() => setRange(d)}>
              {d}d
            </Button>
          ))}
          <Button size="icon" variant="ghost" onClick={() => void load()} aria-label="Refresh TikTok event data" disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      <CampaignAttribution range={range} />

      {loading && !data && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {data && t && (
        <>
          {t.not_configured > 0 && (
            <Card className="border-amber-500/50">
              <CardContent className="flex gap-3 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                <p className="text-card-foreground">
                  {t.not_configured.toLocaleString()} event{t.not_configured === 1 ? "" : "s"} reached the server but weren't forwarded:
                  the Events API access token isn't set. In Supabase → Edge Functions → Secrets, add{" "}
                  <code className="rounded bg-muted px-1">TIKTOK_EVENTS_ACCESS_TOKEN</code> (browser-pixel events are unaffected).
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Events logged", t.events.toLocaleString()],
              ["Sent to TikTok", t.sent.toLocaleString()],
              ["Delivery rate", deliveryRate === null ? "—" : `${deliveryRate}%`],
              ["Signed-in (matched)", t.events ? `${Math.round((t.identified / t.events) * 100)}%` : "—"],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-card-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}, last {range}d</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {tracked.map((p) => (
              <Card key={p.key}>
                <CardContent className="p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
                    {p.label}
                  </h3>
                  {p.rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events in this window.</p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {p.rows.map((r) => (
                        <li key={r.event_name} className="flex items-center justify-between gap-2">
                          <span className="text-card-foreground">{r.event_name}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {Number(r.total).toLocaleString()}
                            {Number(r.failed) > 0 && <span className="ml-1 text-destructive">({r.failed} failed)</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-medium text-card-foreground">Events per day</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stacked} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tickFormatter={dayLabel} tick={tick} axisLine={false} tickLine={false} />
                    <YAxis tick={tick} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip labelFormatter={dayLabel} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {PAGES.map((p) => (
                      <Bar key={p.key} dataKey={p.key} name={p.label} stackId="a" fill={p.color} stroke="hsl(var(--card))" strokeWidth={1} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                One row per event the browser pixel and Events API share (they use the same event ID, so TikTok counts it once).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-medium text-card-foreground">Latest events</h3>
              {data.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing logged yet. Events appear once a visitor accepts advertising cookies and browses the tracked pages.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Page</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recent.map((r, i) => (
                        <TableRow key={`${r.created_at}-${i}`}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {new Date(r.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                          </TableCell>
                          <TableCell>{r.event_name}</TableCell>
                          <TableCell className="text-xs">{PAGE_LABEL[r.page_key] ?? r.page_key}{r.page_key === "other" && r.path ? ` (${r.path})` : ""}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "sent" ? "secondary" : r.status === "not_configured" ? "outline" : "destructive"}>
                              {STATUS_LABEL[r.status] ?? r.status}
                              {r.upstream_code && r.status === "rejected" ? ` ${r.upstream_code}` : ""}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
};

export default TikTokAdsPanel;
