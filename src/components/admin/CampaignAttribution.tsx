import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface CampaignRow {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string;
  utm_content: string | null;
  landings: number;
  analysis_started: number;
  analysis_completed: number;
  signups: number;
  trials: number;
}
interface CampaignReport {
  window_days: number;
  totals: Omit<CampaignRow, "utm_source" | "utm_medium" | "utm_campaign" | "utm_content">;
  by_campaign: CampaignRow[];
}

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");

/**
 * Campaigns (UTM) — first-party attribution from analytics_events via admin_campaign_attribution().
 * Counts distinct browser sessions and is not consent-gated, so it's the complete count; TikTok Events Manager
 * only sees visitors who accepted advertising cookies.
 */
const CampaignAttribution = ({ range }: { range: number }) => {
  const [data, setData] = useState<CampaignReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: rpcError } = await supabase.rpc("admin_campaign_attribution" as never, { p_days: range } as never);
    setLoading(false);
    if (rpcError) {
      setError(
        /does not exist|schema cache|42883|42P01/i.test(rpcError.message)
          ? "Campaign attribution isn't set up yet: apply migration 20261004130000_campaign_attribution.sql."
          : "Couldn't load campaign data.",
      );
      return;
    }
    setData(res as unknown as CampaignReport);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const t = data?.totals;
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-medium text-card-foreground">Campaigns (UTM)</h3>
          <p className="text-xs text-muted-foreground">
            Visitors who arrived on a link with <code className="rounded bg-muted px-1">utm_campaign</code> (or a TikTok click id),
            counted once per browser session, last {range}d. Not consent-gated, so this is higher than what TikTok Events Manager shows.
          </p>
        </div>
        {loading && !data && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {data && t && (data.by_campaign.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No campaign traffic yet. Use links like <code className="rounded bg-muted px-1">?utm_source=tiktok&amp;utm_medium=paid_social&amp;utm_campaign=…&amp;utm_content=…</code>.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign / ad</TableHead>
                  <TableHead className="text-right">Landings</TableHead>
                  <TableHead className="text-right">Analysis started</TableHead>
                  <TableHead className="text-right">Analysis done</TableHead>
                  <TableHead className="text-right">Sign-ups</TableHead>
                  <TableHead className="text-right">Sign-up rate</TableHead>
                  <TableHead className="text-right">Trials</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_campaign.map((r, i) => (
                  <TableRow key={`${r.utm_campaign}-${r.utm_content}-${i}`}>
                    <TableCell className="text-xs">
                      <span className="font-medium">{r.utm_campaign}</span>
                      {r.utm_content ? <span className="text-muted-foreground"> / {r.utm_content}</span> : null}
                      <span className="block text-muted-foreground">{[r.utm_source, r.utm_medium].filter(Boolean).join(" · ")}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.landings).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.analysis_started).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.analysis_completed).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.signups).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(Number(r.signups), Number(r.landings))}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(r.trials).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CampaignAttribution;
