import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CloudOff, Trash2, WifiOff } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import BriefingBody from "@/components/briefings/BriefingBody";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { READING_CHANGED_EVENT, getOfflineReading, listOfflineReading, readingPath, removeFromOffline, type ReadingKind, type ReadingRecord } from "@/lib/pwa/offlineReading";

const fmt = (ms: number) => new Date(ms).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });

const Viewer = ({ kind, slug }: { kind: ReadingKind; slug: string }) => {
  const [rec, setRec] = useState<ReadingRecord | null | undefined>(undefined);
  useEffect(() => { void getOfflineReading(kind, slug).then((r) => setRec(r ?? null)); }, [kind, slug]);
  if (rec === undefined) return <p className="text-muted-foreground">Loading…</p>;
  if (!rec) return <p className="text-muted-foreground">That article isn't saved on this device. <Link to="/offline-reading" className="underline">Back to your saved list</Link></p>;
  const b = rec.briefing;
  const i = rec.ingredient;
  return (
    <article>
      <Link to="/offline-reading" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Offline reading</Link>
      <h1 className="font-heading text-3xl font-bold text-foreground">{rec.title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">Saved {fmt(rec.savedAt)} · text only. <Link to={readingPath(kind, slug)} className="underline">Open the live page</Link> when you're back online.</p>
      {b && (
        <div className="mt-6">
          {b.key_takeaways && b.key_takeaways.length > 0 && (
            <ul className="mb-6 list-disc space-y-1 rounded-2xl bg-muted/50 p-4 pl-8 text-sm">{b.key_takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
          )}
          <BriefingBody body={b.body_markdown} insertAds={false} skynnCta={false} />
        </div>
      )}
      {i && (
        <div className="mt-6 space-y-5 text-foreground">
          {i.inci_name && <p className="text-sm text-muted-foreground">INCI: {i.inci_name}{i.category ? ` · ${i.category.replace(/-/g, " ")}` : ""}</p>}
          {i.function_summary && <section><h2 className="mb-1 font-heading text-xl font-semibold">What does it do?</h2><p className="leading-relaxed">{i.function_summary}</p></section>}
          {i.description && <section><h2 className="mb-1 font-heading text-xl font-semibold">About</h2><p className="leading-relaxed">{i.description}</p></section>}
          {(i.typical_concentration_range || i.formulation_notes) && (
            <section><h2 className="mb-1 font-heading text-xl font-semibold">How to use</h2>
              {i.typical_concentration_range && <p>Typical range: {i.typical_concentration_range}</p>}
              {i.formulation_notes && <p className="leading-relaxed">{i.formulation_notes}</p>}
            </section>
          )}
          <p className="text-xs text-muted-foreground">Evidence: {i.evidence_level ?? "not rated"} · Irritancy: {i.irritancy_risk ?? "not rated"}. General cosmetic information, not medical advice.</p>
        </div>
      )}
    </article>
  );
};

const List = () => {
  const [items, setItems] = useState<ReadingRecord[] | null>(null);
  const load = useCallback(async () => setItems(await listOfflineReading()), []);
  useEffect(() => {
    void load();
    window.addEventListener(READING_CHANGED_EVENT, load);
    return () => window.removeEventListener(READING_CHANGED_EVENT, load);
  }, [load]);
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground">Offline reading</h1>
      <p className="mt-2 text-muted-foreground">Briefings and ingredient profiles you saved on this device. They open without data or Wi-Fi, which helps through load-shedding.</p>
      <ul className="mt-6 space-y-2">
        {(items ?? []).map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <Link to={`/offline-reading/${r.kind}/${r.slug}`} className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.kind === "briefing" ? "Briefing" : "Ingredient"} · saved {fmt(r.savedAt)}</p>
            </Link>
            <Button variant="ghost" size="icon" aria-label={`Remove ${r.title}`} className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => void removeFromOffline(r.kind, r.slug)}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
      {items && items.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <CloudOff className="mx-auto mb-3 h-6 w-6" aria-hidden="true" />
          <p>Nothing saved yet. Tap “Save offline” on a briefing or an ingredient profile.</p>
          <div className="mt-4 flex justify-center gap-3 text-sm"><Link to="/briefings" className="underline">Briefings</Link><Link to="/ingredients" className="underline">Ingredients</Link></div>
        </div>
      )}
    </div>
  );
};

const OfflineReading = () => {
  const { kind, slug } = useParams();
  const { isOffline } = useNetworkStatus();
  const viewing = (kind === "briefing" || kind === "ingredient") && slug;
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Offline reading" description="Briefings and ingredient profiles saved on this device." canonical="https://skinlabs.co.za/offline-reading" noindex />
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          {isOffline && <p className="mb-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground"><WifiOff className="h-4 w-4" /> You're offline. Saved articles still work.</p>}
          {viewing ? <Viewer kind={kind as ReadingKind} slug={slug as string} /> : <List />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OfflineReading;
