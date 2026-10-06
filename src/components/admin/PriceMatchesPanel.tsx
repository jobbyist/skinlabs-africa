import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatSize } from "@/lib/pricing/saRetailPrices";

interface PendingMatch {
  id: string;
  retailer_url: string | null;
  listing_title: string | null;
  listing_size_ml: number | null;
  match_confidence: number | null;
  match_reasons: unknown;
  retailers: { name: string } | null;
  product_variants: { products: { name: string; slug: string; brands: { name: string } | null } | null } | null;
}

interface RunRow {
  id: string;
  started_at: string;
  retailer: string;
  mode: string;
  status: string;
  summary: { counts?: Record<string, number>; credits_used?: number; stop_detail?: string } | null;
}

const reasonsOf = (value: unknown): string[] => (Array.isArray(value) ? value.filter((r): r is string => typeof r === "string") : []);

/**
 * Admin "SA prices": (1) retailer pages the matcher found but wasn't sure enough about to
 * publish. A person opens the listing, compares it with our product, and approves or
 * rejects. Approving makes it public; its price is read on the next daily refresh.
 * (2) The latest sync runs, so a blocked or budget-capped run is visible.
 */
const PriceMatchesPanel = () => {
  const [pending, setPending] = useState<PendingMatch[] | null>(null);
  const [runs, setRuns] = useState<RunRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [matches, runRows] = await Promise.all([
      supabase
        .from("retailer_products")
        .select(
          "id, retailer_url, listing_title, listing_size_ml, match_confidence, match_reasons, retailers(name), product_variants(products(name, slug, brands(name)))",
        )
        .eq("match_status", "needs_review")
        .not("retailer_url", "is", null)
        .order("match_confidence", { ascending: false })
        .limit(100),
      supabase.from("retailer_price_runs").select("id, started_at, retailer, mode, status, summary").order("started_at", { ascending: false }).limit(10),
    ]);
    if (matches.error) setError(matches.error.message);
    else setPending((matches.data ?? []) as unknown as PendingMatch[]);
    if (!runRows.error) setRuns((runRows.data ?? []) as unknown as RunRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (row: PendingMatch, approve: boolean) => {
    setBusy(row.id);
    const patch = approve
      ? { match_status: "matched", last_verified_at: new Date().toISOString(), consecutive_failures: 0, last_attempt_at: null, last_error: null }
      : { match_status: "rejected" };
    const { error: e } = await supabase.from("retailer_products").update(patch).eq("id", row.id);
    setBusy(null);
    if (e) {
      toast.error(`Couldn't save: ${e.message}`);
      return;
    }
    setPending((rows) => (rows ?? []).filter((r) => r.id !== row.id));
    toast.success(approve ? "Approved. Its price appears after the next refresh." : "Rejected.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">SA prices: matches to review</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The sync found these retailer pages but wasn't sure enough to publish them. Open the listing, check it is the same product (and pack size), then approve or
          reject. Nothing here is visible to visitors until you approve it.
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!pending && !error && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      )}
      {pending && pending.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">Nothing waiting for review.</CardContent>
        </Card>
      )}
      {pending?.map((row) => {
        const product = row.product_variants?.products;
        const size = formatSize(row.listing_size_ml);
        return (
          <Card key={row.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Our product</p>
                  <p className="font-medium text-foreground">
                    {product?.brands?.name} {product?.name}
                  </p>
                </div>
                <Badge variant="secondary">{row.retailers?.name ?? "Retailer"}</Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Their listing{size ? ` (${size})` : ""}</p>
                <p className="text-sm text-foreground">{row.listing_title ?? "(no title)"}</p>
                {row.retailer_url && (
                  <a
                    href={row.retailer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Open listing <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Confidence {row.match_confidence !== null ? Math.round(Number(row.match_confidence) * 100) : "?"}%
                {reasonsOf(row.match_reasons).length > 0 ? `: ${reasonsOf(row.match_reasons).join("; ")}` : ""}
              </p>
              <div className="flex gap-2">
                <Button size="sm" disabled={busy === row.id} onClick={() => decide(row, true)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" /> Same product: approve
                </Button>
                <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => decide(row, false)}>
                  <XCircle className="mr-1 h-4 w-4" aria-hidden="true" /> Different: reject
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div>
        <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Recent sync runs</h3>
        {runs && runs.length === 0 && <p className="text-sm text-muted-foreground">No runs yet.</p>}
        <div className="space-y-2">
          {runs?.map((run) => (
            <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
              <span className="text-foreground">
                {run.retailer} · {run.mode}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(run.started_at).toLocaleString("en-ZA")} ·{" "}
                {Object.entries(run.summary?.counts ?? {})
                  .map(([k, v]) => `${v} ${k}`)
                  .join(", ") || "nothing processed"}
                {run.summary?.credits_used ? ` · ${run.summary.credits_used} credits` : ""}
              </span>
              <Badge variant={run.status === "ok" ? "default" : "secondary"}>
                {run.status}
                {run.summary?.stop_detail ? `: ${run.summary.stop_detail}` : ""}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriceMatchesPanel;
