import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CloudOff, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { READING_CHANGED_EVENT, getOfflineReading, removeFromOffline, saveForOffline, type BriefingSnapshot, type IngredientSnapshot, type ReadingKind } from "@/lib/pwa/offlineReading";

interface Props {
  kind: ReadingKind;
  slug: string;
  title: string;
  /** Builds the text snapshot at tap time (so it always has the loaded body). Return null when the content isn't ready. */
  snapshot: () => { briefing?: BriefingSnapshot; ingredient?: IngredientSnapshot } | null;
  className?: string;
}

/** "Save offline" / "Saved offline" toggle for a briefing or an ingredient profile (offline reading queue). */
const OfflineReadButton = ({ kind, slug, title, snapshot, className }: Props) => {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => setSaved(Boolean(await getOfflineReading(kind, slug))), [kind, slug]);
  useEffect(() => {
    void refresh();
    window.addEventListener(READING_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(READING_CHANGED_EVENT, refresh);
  }, [refresh]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await removeFromOffline(kind, slug);
        toast.success("Removed from offline reading");
        return;
      }
      const content = snapshot();
      if (!content) return void toast.error("Still loading. Try again in a second.");
      const result = await saveForOffline({ kind, slug, title, ...content });
      if (result === "saved") toast.success("Saved for offline reading", { action: { label: "Open", onClick: () => window.location.assign("/offline-reading") } });
      else if (result === "too_large") toast.error("That one is too large to keep offline.");
      else toast.error("Offline saving isn't available in this browser.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" className={className} onClick={() => void toggle()} aria-pressed={saved} data-haptic>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <CloudOff className="mr-2 h-4 w-4" />}
        {saved ? "Saved offline" : "Save offline"}
      </Button>
      {saved && <Link to="/offline-reading" className="text-xs text-muted-foreground underline underline-offset-2">Offline reading</Link>}
    </span>
  );
};

export default OfflineReadButton;
