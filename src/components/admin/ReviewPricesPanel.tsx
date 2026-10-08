import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Play, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatRand, formatSize } from "@/lib/pricing/saRetailPrices";

interface PendingListing {
  id: string;
  review_id: string;
  retailer_slug: string;
  listing_url: string;
  listing_title: string | null;
  listing_size_ml: number | null;
  price_zar: number;
  special_price_zar: number | null;
  previous_price_zar: number | null;
  in_stock: boolean | null;
  confidence: number | null;
  needs_attention: boolean;
  match_reasons: unknown;
  evidence: string | null;
  source_tool: string;
  checked_at: string;
  review_price_targets: { product_name: string; brand: string; is_sponsored: boolean; review_kind: string } | null;
}

interface Coverage {
  targets: number;
  covered: number;
  pending: number;
  due: number;
}

interface RunRow {
  id: string;
  started_at: string;
  status: string;
  source: string | null;
  summary: { checked?: number; listings_saved?: number; providers?: Record<string, number>; stop?: string | null } | null;
}

const RETAILER_NAMES: Record<string, string> = {
  takealot: "Takealot",
  "dis-chem": "Dis-Chem",
  clicks: "Clicks",
  dermastore: "Dermastore",
  skinmiles: "SkinMiles",
  "faithful-to-nature": "Faithful to Nature",
};

const reasonsOf = (value: unknown): string[] => (Array.isArray(value) ? value.filter((r): r is string => typeof r === "string") : []);
// The generated tables are not in the typed client until types are regenerated.
const table = (name: string) => supabase.from(name as never) as unknown as ReturnType<typeof supabase.from>;

/**
 * Admin > SA Prices > "Review prices". Every price Parallel Search / Nimble found for a published
 * review lands here as pending. Approving a listing makes it public (on the review page) for 30 days;
 * the 25-day re-check keeps an approved listing's price current, and a >50% jump comes back here.
 */
const ReviewPricesPanel = () => {
  const [rows, setRows] = useState<PendingListing[] | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [retailer, setRetailer] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const thirty = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [pending, targets, covered, pendingCount, due, runRows] = await Promise.all([
      table("review_price_listings")
        .select("id, review_id, retailer_slug, listing_url, listing_title, listing_size_ml, price_zar, special_price_zar, previous_price_zar, in_stock, confidence, needs_attention, match_reasons, evidence, source_tool, checked_at, review_price_targets(product_name, brand, is_sponsored, review_kind)")
        .eq("status", "pending")
        .order("needs_attention", { ascending: true })
        .order("confidence", { ascending: false })
        .limit(150),
      table("review_price_targets").select("review_id", { count: "exact", head: true }),
      table("review_price_listings").select("review_id", { count: "exact", head: true }).eq("status", "approved").gte("checked_at", thirty),
      table("review_price_listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
      table("review_price_targets").select("review_id", { count: "exact", head: true }).lte("next_check_at", nowIso),
      table("review_price_runs").select("id, started_at, status, source, summary").order("started_at", { ascending: false }).limit(6),
    ]);
    if (pending.error) setError(pending.error.message);
    else setRows((pending.data ?? []) as unknown as PendingListing[]);
    setCoverage({ targets: targets.count ?? 0, covered: covered.count ?? 0, pending: pendingCount.count ?? 0, due: due.count ?? 0 });
    if (!runRows.error) setRuns((runRows.data ?? []) as unknown as RunRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => (rows ?? []).filter((r) => retailer === "all" || r.retailer_slug === retailer), [rows, retailer]);

  const decide = async (ids: string[], decision: "approved" | "rejected", priceOverride?: number) => {
    setBusy(ids.length === 1 ? ids[0] : "bulk");
    const { error: e } = await supabase.rpc("admin_decide_review_prices" as never, { p_ids: ids, p_decision: decision, p_price_override: priceOverride ?? null } as never);
    setBusy(null);
    if (e) {
      toast.error(`Couldn't save: ${e.message}`);
      return;
    }
    setRows((rs) => (rs ?? []).filter((r) => !ids.includes(r.id)));
    setSelected((s) => new Set([...s].filter((id) => !ids.includes(id))));
    toast.success(decision === "approved" ? `${ids.length} price${ids.length === 1 ? "" : "s"} approved and live.` : `${ids.length} rejected.`);
    void load();
  };

  const runNow = async () => {
    setRunning(true);
    const { data, error: e } = await supabase.functions.invoke("review-price-sync", { body: { limit: 3, wait: true } });
    setRunning(false);
    if (e) toast.error(`Run failed: ${e.message}`);
    else toast.success(`Checked ${(data as { summary?: { checked?: number } })?.summary?.checked ?? 0} reviews.`);
    void load();
  };

  const toggle = (id: string) => setSelected((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));
  const clean = visible.filter((r) => !r.needs_attention);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Review prices (Parallel Search)</h3>
          <p className="text-sm text-muted-foreground">
            Prices found for published reviews. Nothing is public until you approve it; approved prices are shown for 30 days and re-checked every 25.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={runNow} disabled={running}>
          {running ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
          Check 3 reviews now
        </Button>
      </div>

      {coverage && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Reviews tracked", coverage.targets],
            ["With a live approved price", coverage.covered],
            ["Waiting for you", coverage.pending],
            ["Due for a check", coverage.due],
          ].map(([label, n]) => (
            <Card key={label as string}>
              <CardContent className="p-3">
                <div className="text-xl font-semibold">{n}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {["all", ...Object.keys(RETAILER_NAMES)].map((slug) => (
          <Button key={slug} size="sm" variant={retailer === slug ? "default" : "outline"} onClick={() => setRetailer(slug)}>
            {slug === "all" ? "All retailers" : RETAILER_NAMES[slug]}
          </Button>
        ))}
        {clean.length > 0 && (
          <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void decide(clean.map((r) => r.id), "approved")}>
            Approve all {clean.length} clean matches
          </Button>
        )}
        {selected.size > 0 && (
          <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void decide([...selected], "approved")}>
            Approve {selected.size} selected
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {rows === null && !error && <Loader2 className="h-5 w-5 animate-spin" />}
      {rows !== null && visible.length === 0 && <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>}

      <div className="space-y-2">
        {visible.map((r) => {
          const p = r.review_price_targets;
          const size = formatSize(r.listing_size_ml);
          const reasons = reasonsOf(r.match_reasons);
          const edited = edits[r.id];
          return (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <input type="checkbox" aria-label="Select" className="mt-1" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    <div>
                      <div className="text-sm font-medium">
                        {p ? `${p.brand} · ${p.product_name}` : r.review_id}
                        {p?.is_sponsored && <Badge variant="outline" className="ml-2">Sponsored</Badge>}
                      </div>
                      <a href={r.listing_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline">
                        {RETAILER_NAMES[r.retailer_slug] ?? r.retailer_slug}: {r.listing_title ?? r.listing_url} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{formatRand(r.price_zar)}</div>
                    {r.special_price_zar !== null && <div className="text-xs text-muted-foreground">special {formatRand(r.special_price_zar)} (not used)</div>}
                    {r.previous_price_zar !== null && <div className="text-xs text-muted-foreground">was {formatRand(r.previous_price_zar)}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  {size && <Badge variant="secondary">{size}</Badge>}
                  <Badge variant="secondary">{r.in_stock === false ? "Out of stock" : r.in_stock ? "In stock" : "Stock unknown"}</Badge>
                  <Badge variant="secondary">{r.source_tool === "nimble" ? "Nimble" : "Parallel Search"}</Badge>
                  {r.confidence !== null && <Badge variant="secondary">match {Math.round(Number(r.confidence) * 100)}%</Badge>}
                  {r.needs_attention && <Badge variant="destructive">check carefully</Badge>}
                </div>
                {reasons.length > 0 && <p className="text-xs text-muted-foreground">{reasons.join(" · ")}</p>}
                {r.evidence && <p className="rounded bg-muted p-2 text-xs text-muted-foreground">“{r.evidence}”</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="h-8 w-28"
                    inputMode="decimal"
                    placeholder="Fix price"
                    aria-label="Correct the price"
                    value={edited ?? ""}
                    onChange={(e) => setEdits((m) => ({ ...m, [r.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => {
                      const n = edited ? Number(edited.replace(",", ".")) : undefined;
                      if (edited && !(n && n >= 1 && n <= 50000)) {
                        toast.error("Enter a price between R1 and R50 000.");
                        return;
                      }
                      void decide([r.id], "approved", n);
                    }}
                  >
                    {busy === r.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Approve{edited ? " corrected price" : ""}
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void decide([r.id], "rejected")}>
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {runs.length > 0 && (
        <div>
          <h4 className="mb-1 text-sm font-medium">Latest runs</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {runs.map((run) => (
              <li key={run.id}>
                {new Date(run.started_at).toLocaleString("en-ZA")} · {run.status} · checked {run.summary?.checked ?? 0}, listings {run.summary?.listings_saved ?? 0}
                {run.summary?.providers ? ` · ${Object.entries(run.summary.providers).map(([k, v]) => `${k} ${v}`).join(", ")}` : ""}
                {run.summary?.stop ? ` · stopped: ${run.summary.stop}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewPricesPanel;
