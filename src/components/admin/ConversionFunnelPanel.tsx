import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Database, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FUNNEL_STAGES, formatRate, summarizeFunnel, type FunnelDayRow } from "@/lib/conversionFunnelSummary";

type RangeDays = 7 | 30 | 90;
const LABEL = Object.fromEntries(FUNNEL_STAGES.map((s) => [s.key, s.label])) as Record<string, string>;
const dayLabel = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });

/**
 * Admin "Conversion funnel" (onboarding overhaul 11): reads the admin-only
 * conversion_funnel_daily view (counts per SAST day, no PII) and shows stage
 * totals plus stage-to-stage rates for 7/30/90 days. Deliberately separate
 * from AnalyticsTab's Vercel/analytics_events charts (the admin-console
 * analytics work) — this is the database's own funnel, not traffic or events.
 */
const ConversionFunnelPanel = () => {
  const [range, setRange] = useState<RangeDays>(30);
  const [rows, setRows] = useState<FunnelDayRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: e } = await supabase
        .from("conversion_funnel_daily")
        .select("day, signups, starter_analyses_saved, trials_started, live_subscriptions_created, paid_subscriptions_started")
        .order("day", { ascending: false })
        .limit(90);
      if (cancelled) return;
      if (e) setError(e.message);
      else setRows(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = rows ? summarizeFunnel(rows, range) : null;

  return (
    <Card>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-card-foreground">Conversion funnel</h3>
              <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
                <Database className="h-2.5 w-2.5" aria-hidden="true" /> Supabase — conversion_funnel_daily
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Counts per SAST day from the database (sign-ups, saved analyses, trials, auto-renew, paid). Rates compare
              totals within the same window — a trend indicator, not a cohort conversion rate.
            </p>
          </div>
          <div className="flex gap-1" role="group" aria-label="Funnel range">
            {([7, 30, 90] as const).map((d) => (
              <Button key={d} size="sm" variant={range === d ? "default" : "outline"} aria-pressed={range === d} onClick={() => setRange(d)}>
                {d} days
              </Button>
            ))}
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">Couldn't load the funnel: {error}</p>
        ) : !summary ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading funnel" /></div>
        ) : (
          <>
            <ol className="grid gap-2 sm:grid-cols-5">
              {FUNNEL_STAGES.map((stage, i) => (
                <li key={stage.key} className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">{stage.label}</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{summary.totals[stage.key].toLocaleString("en-ZA")}</p>
                  {i > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      {formatRate(summary.rates[i - 1].rate)} of {LABEL[summary.rates[i - 1].from].toLowerCase()}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            {summary.daily.length > 1 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.daily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tickFormatter={dayLabel} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(v) => dayLabel(String(v))} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="signups" name="Sign-ups" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="trials_started" name="Trials" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="paid_subscriptions_started" name="Paid" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough days with activity in this window for a trend line yet.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionFunnelPanel;
