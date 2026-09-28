import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ADVANCED_NAME, BASIC_NAME, SKYNN_RELEASE_LABEL } from "@/lib/skynn/terminology";

type OpsRow = {
  window_days: number;
  basic_analyses_saved: number;
  basic_limit_hits: number;
  skynn_starts: number;
  skynn_results_viewed: number;
  skynn_pdf_downloads: number;
  skynn_errors: number;
  advanced_submissions: number;
  advanced_pending: number;
  advanced_intake_pdf_failed: number;
  advanced_intake_email_failed: number;
  analysis_passes_consumed: number;
};

const WINDOWS = [7, 30] as const;

/**
 * SKYNN AI operational counts for admins (skynn_ops_summary(), admin-gated in
 * SQL, counts only — no member data). Funnel counts come from the first-party
 * analytics_events table, so they start from the v2.1 release; "Pending" is
 * the current queue size regardless of the window.
 */
const SkynnOpsPanel = () => {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(7);
  const [row, setRow] = useState<OpsRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("skynn_ops_summary", { p_days: days });
    setLoading(false);
    if (rpcError) {
      setError("Couldn't load SKYNN AI operations.");
      return;
    }
    setRow((Array.isArray(data) ? data[0] : data) ?? null);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats: Array<[string, number | undefined, string?]> = row
    ? [
        [`${BASIC_NAME} saved`, row.basic_analyses_saved],
        ["Weekly-limit hits", row.basic_limit_hits],
        ["SKYNN AI starts", row.skynn_starts, "event"],
        ["Results viewed", row.skynn_results_viewed, "event"],
        ["PDF downloads", row.skynn_pdf_downloads, "event"],
        ["Errors", row.skynn_errors, "event"],
        [`${ADVANCED_NAME} submissions`, row.advanced_submissions],
        ["Advanced pending (now)", row.advanced_pending],
        ["Intake PDF failures", row.advanced_intake_pdf_failed],
        ["Intake email failures", row.advanced_intake_email_failed],
        ["Analysis Passes used", row.analysis_passes_consumed],
      ]
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">{SKYNN_RELEASE_LABEL} — operations</CardTitle>
        <div className="flex items-center gap-2">
          {WINDOWS.map((w) => (
            <Button key={w} size="sm" variant={w === days ? "default" : "outline"} onClick={() => setDays(w)}>
              {w} days
            </Button>
          ))}
          <Button size="icon" variant="ghost" onClick={() => void load()} aria-label="Refresh SKYNN AI operations">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        ) : !row ? (
          <p className="text-sm text-muted-foreground">{loading ? "Loading…" : "No data."}</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-xl font-heading font-semibold tabular-nums">{value ?? 0}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Last {row.window_days} days. Starts, views, PDF downloads and errors come from first-party analytics events
              (recorded from the v2.1 release onwards); the rest are read from the records themselves.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SkynnOpsPanel;
