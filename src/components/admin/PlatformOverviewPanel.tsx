import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, Network, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Untyped like the other admin RPC callers: the result shape is the Overview interface below.
const db = supabase as unknown as SupabaseClient;

interface Overview {
  days: number;
  journey: Record<"members" | "with_analysis" | "with_routine_checkin" | "read_content" | "community_authors" | "push_enabled" | "advanced_submitted" | "trial_started", number>;
  content: Record<"briefings" | "generated_reviews" | "generated_comparisons" | "ingredients" | "forum_posts" | "forum_comments", number>;
  series: { day: string; signups: number; analyses: number; forum_posts: number; forum_comments: number; checkins: number; notifications: number }[];
}

const RANGES = [7, 30, 90] as const;
const LINES: { key: keyof Overview["series"][number]; label: string; color: string }[] = [
  { key: "signups", label: "Sign-ups", color: "#2563eb" },
  { key: "analyses", label: "Analyses saved", color: "#16a34a" },
  { key: "checkins", label: "Routine check-ins", color: "#9333ea" },
  { key: "forum_posts", label: "Forum posts", color: "#ea580c" },
  { key: "forum_comments", label: "Forum comments", color: "#db2777" },
];
const JOURNEY: { key: keyof Overview["journey"]; label: string }[] = [
  { key: "members", label: "Members" },
  { key: "with_analysis", label: "Saved a Basic analysis" },
  { key: "trial_started", label: "Started a trial" },
  { key: "with_routine_checkin", label: "Checked in on a routine" },
  { key: "read_content", label: "Read a review or episode" },
  { key: "community_authors", label: "Posted in the forum" },
  { key: "push_enabled", label: "Enabled push reminders" },
  { key: "advanced_submitted", label: "Submitted an Advanced analysis" },
];
const CONTENT: { key: keyof Overview["content"]; label: string }[] = [
  { key: "briefings", label: "Briefings" },
  { key: "generated_reviews", label: "Pipeline reviews" },
  { key: "generated_comparisons", label: "Pipeline comparisons" },
  { key: "ingredients", label: "Ingredient profiles" },
  { key: "forum_posts", label: "Forum posts" },
  { key: "forum_comments", label: "Forum comments" },
];

/**
 * Admin -> Analytics: how the platform's surfaces connect. Member-journey coverage (how many members reached each
 * surface), the content that exists to engage with, and daily activity across sign-ups, analyses, routines and the
 * forum. Aggregates from admin_platform_overview(); no member rows are read.
 */
const PlatformOverviewPanel = () => {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: err } = await db.rpc("admin_platform_overview", { p_days: days });
    if (err) setError(err.message);
    else setData(res as unknown as Overview);
    setLoading(false);
  }, [days]);
  useEffect(() => {
    void load();
  }, [load]);

  const members = data?.journey.members || 0;
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 font-heading text-lg"><Network className="size-5" aria-hidden="true" /> Platform overview</CardTitle>
          <CardDescription>How members move across analysis, routines, content, the forum and reminders.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1" role="group" aria-label="Range">
            {RANGES.map((r) => (
              <Button key={r} size="sm" variant={days === r ? "default" : "outline"} aria-pressed={days === r} onClick={() => setDays(r)}>{r}d</Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => void load()} aria-label="Refresh"><RefreshCw className="size-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && !data && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {data && (
          <>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Member journey coverage</h3>
              <ul className="space-y-1.5">
                {JOURNEY.map((j) => {
                  const n = data.journey[j.key];
                  const pct = members > 0 ? Math.round((n / members) * 100) : 0;
                  return (
                    <li key={j.key} className="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-3 text-sm">
                      <span className="truncate">{j.label}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true"><span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></span>
                      <span className="tabular-nums text-muted-foreground">{n} · {pct}%</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Distinct members who ever reached each surface, as a share of all members. Not a strict funnel: a member can skip steps.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {CONTENT.map((c) => (
                <div key={c.key} className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{data.content[c.key]}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Daily activity, last {data.days} days</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} />
                    <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {LINES.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformOverviewPanel;
