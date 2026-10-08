import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Play, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Candidate {
  id: string;
  review_id: string;
  image_url: string;
  alt: string | null;
  source_page_url: string;
  source_kind: "brand" | "retailer";
  source_label: string;
  via: string | null;
  match_confidence: number | null;
  tool: string;
  status: string;
  review_price_targets: { product_name: string; brand: string; is_sponsored: boolean } | null;
}

interface Coverage {
  reviews: number;
  withRealImage: number;
  pendingReviews: number;
  due: number;
}

// New tables/columns are not in the generated client types yet.
const table = (name: string) => supabase.from(name as never) as unknown as ReturnType<typeof supabase.from>;

/**
 * Admin > Data Quality > "Review cover images". The image-sync job finds each review's own product image on the brand's website
 * and on the retailer pages we price. Nothing replaces a review's stock cover until a person approves a candidate here.
 * Only one image per review can be live; approving another one supersedes the first.
 */
const ReviewImagesPanel = () => {
  const [rows, setRows] = useState<Candidate[] | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [onlyBrand, setOnlyBrand] = useState(false);
  const [broken, setBroken] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const nowIso = new Date().toISOString();
    const [pending, reviews, real, pendingRev, due] = await Promise.all([
      table("review_image_candidates")
        .select("id, review_id, image_url, alt, source_page_url, source_kind, source_label, via, match_confidence, tool, status, review_price_targets(product_name, brand, is_sponsored)")
        .eq("status", "pending")
        .order("source_kind", { ascending: true })
        .order("match_confidence", { ascending: false })
        .limit(120),
      table("review_price_targets").select("review_id", { count: "exact", head: true }),
      table("review_images").select("review_id", { count: "exact", head: true }).eq("source_kind", "product"),
      table("review_image_candidates").select("review_id", { count: "exact", head: true }).eq("status", "pending"),
      table("review_price_targets").select("review_id", { count: "exact", head: true }).lte("image_next_check_at", nowIso),
    ]);
    if (pending.error) setError(pending.error.message);
    else setRows((pending.data ?? []) as unknown as Candidate[]);
    setCoverage({ reviews: reviews.count ?? 0, withRealImage: real.count ?? 0, pendingReviews: pendingRev.count ?? 0, due: due.count ?? 0 });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => (rows ?? []).filter((r) => !onlyBrand || r.source_kind === "brand"), [rows, onlyBrand]);

  const decide = async (ids: string[], decision: "approved" | "rejected") => {
    setBusy(ids.length === 1 ? ids[0] : "bulk");
    const { error: e } = await supabase.rpc("admin_decide_review_images" as never, { p_ids: ids, p_decision: decision } as never);
    setBusy(null);
    if (e) {
      toast.error(`Couldn't save: ${e.message}`);
      return;
    }
    toast.success(decision === "approved" ? "Approved. It is now the review's cover image." : "Rejected.");
    void load();
  };

  // One approval per review: the best brand-site candidate of every review that has one.
  const bulkIds = useMemo(() => {
    const byReview = new Map<string, Candidate>();
    for (const c of visible) if (c.source_kind === "brand" && !broken.has(c.id) && !byReview.has(c.review_id)) byReview.set(c.review_id, c);
    return [...byReview.values()].map((c) => c.id);
  }, [visible, broken]);

  const runNow = async () => {
    setRunning(true);
    const { error: e } = await supabase.functions.invoke("review-image-sync", { body: { limit: 3, wait: true } });
    setRunning(false);
    if (e) toast.error(`Run failed: ${e.message}`);
    else toast.success("Checked 3 reviews.");
    void load();
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Review cover images</h3>
          <p className="text-sm text-muted-foreground">
            Real product images from the brand's website and the retailer pages we price. Approve one image per review; it replaces the stock cover.
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
            ["Reviews tracked", coverage.reviews],
            ["With a real cover live", coverage.withRealImage],
            ["Reviews waiting for you", coverage.pendingReviews],
            ["Still to be searched", coverage.due],
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
        <Button size="sm" variant={onlyBrand ? "default" : "outline"} onClick={() => setOnlyBrand((v) => !v)}>
          Brand website only
        </Button>
        {bulkIds.length > 0 && (
          <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void decide(bulkIds, "approved")}>
            Approve best brand image for {bulkIds.length} reviews
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {rows === null && !error && <Loader2 className="h-5 w-5 animate-spin" />}
      {rows !== null && visible.length === 0 && <p className="text-sm text-muted-foreground">No images waiting for review.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => {
          const p = c.review_price_targets;
          return (
            <Card key={c.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex h-44 items-center justify-center overflow-hidden rounded-md bg-white">
                  {broken.has(c.id) ? (
                    <span className="px-3 text-center text-xs text-muted-foreground">The source blocks previews. Open the page to check it.</span>
                  ) : (
                    <img
                      src={c.image_url}
                      alt={c.alt ?? "Candidate product image"}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="max-h-44 max-w-full object-contain"
                      onError={() => setBroken((s) => new Set(s).add(c.id))}
                    />
                  )}
                </div>
                <div className="text-sm font-medium">
                  {p ? `${p.brand} · ${p.product_name}` : c.review_id}
                  {p?.is_sponsored && <Badge variant="outline" className="ml-2">Sponsored</Badge>}
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  <Badge variant={c.source_kind === "brand" ? "default" : "secondary"}>{c.source_label}</Badge>
                  {c.match_confidence !== null && <Badge variant="secondary">page match {Math.round(Number(c.match_confidence) * 100)}%</Badge>}
                  <Badge variant="secondary">{c.tool === "nimble" ? "Nimble" : "Parallel Search"}</Badge>
                </div>
                {c.alt && <p className="line-clamp-2 text-xs text-muted-foreground">Page title: {c.alt}</p>}
                <a href={c.source_page_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline">
                  Open source page <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy !== null} onClick={() => void decide([c.id], "approved")}>
                    {busy === c.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Use as cover
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void decide([c.id], "rejected")}>
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewImagesPanel;
