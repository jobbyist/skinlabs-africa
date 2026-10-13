import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GIF_CATEGORIES, GifError, fetchGifFile, searchGifs, type GifResult } from "@/lib/community/giphy";

interface GifPickerProps {
  /** The chosen GIF, downloaded as a File, ready for the normal image pipeline. */
  onPick: (file: File) => void | Promise<void>;
  onUpload: () => void;
  onClose: () => void;
}

/** Search GIPHY (popular skincare moods first), pick one, and it is attached like any other picture. */
const GifPicker = ({ onPick, onUpload, onClose }: GifPickerProps) => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("");
  const [items, setItems] = useState<GifResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  const term = active || query;

  // Debounced search; a new term cancels the previous request. An empty term shows what's trending.
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        controller.current?.abort();
        const c = new AbortController();
        controller.current = c;
        setLoading(true);
        setError(null);
        searchGifs(term, 0, c.signal)
          .then((r) => {
            setItems(r.results);
            setTotal(r.total);
          })
          .catch((e: Error) => {
            if (e.name !== "AbortError") setError(e instanceof GifError ? e.message : "GIF search isn't available right now.");
          })
          .finally(() => !c.signal.aborted && setLoading(false));
      },
      term === "" && items.length === 0 ? 0 : 350,
    );
    return () => window.clearTimeout(timer);
    // `items.length` only decides the first request's delay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  useEffect(() => () => controller.current?.abort(), []);

  const more = async () => {
    setLoading(true);
    try {
      const r = await searchGifs(term, items.length);
      setItems((prev) => [...prev, ...r.results.filter((g) => !prev.some((p) => p.id === g.id))]);
    } catch (e) {
      setError(e instanceof GifError ? e.message : "GIF search isn't available right now.");
    } finally {
      setLoading(false);
    }
  };

  const choose = async (gif: GifResult) => {
    if (picking) return;
    setPicking(gif.id);
    setError(null);
    try {
      await onPick(await fetchGifFile(gif));
      onClose();
    } catch (e) {
      setError(e instanceof GifError ? e.message : "That GIF couldn't be added. Try another one.");
    } finally {
      setPicking(null);
    }
  };

  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);

  return (
    <div role="dialog" aria-label="Choose a GIF" className="absolute inset-0 z-10 flex flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setActive("");
              setQuery(e.target.value);
            }}
            placeholder="Search GIFs"
            aria-label="Search GIFs"
            enterKeyHint="search"
            autoComplete="off"
            className="h-11 rounded-full pl-9 text-base"
          />
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0 rounded-full" onClick={onClose} aria-label="Close GIF search">
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GIF_CATEGORIES.map((c) => (
          <button
            key={c.label}
            type="button"
            aria-pressed={active === c.query}
            onClick={() => {
              setQuery("");
              setActive(active === c.query ? "" : c.query);
            }}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary",
              active === c.query ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/80 hover:border-foreground/30",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3" data-vaul-no-drag>
        {error && (
          <p role="alert" className="mb-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {items.length === 0 && !loading && !error ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No GIFs found. Try another word.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[left, right].map((column, c) => (
              <div key={c} className="space-y-2">
                {column.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => void choose(gif)}
                    disabled={Boolean(picking)}
                    aria-label={`Add GIF: ${gif.title}`}
                    className="relative block w-full overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary disabled:opacity-60"
                    style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
                  >
                    <img src={gif.previewUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="size-full object-cover" />
                    {picking === gif.id && (
                      <span className="absolute inset-0 flex items-center justify-center bg-background/60">
                        <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        {loading && (
          <p role="status" className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading GIFs
          </p>
        )}
        {!loading && items.length > 0 && items.length < total && (
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => void more()}>
            Show more
          </Button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2">
        <span className="text-xs font-semibold text-muted-foreground">Powered by GIPHY</span>
        <Button type="button" variant="ghost" className="h-11 gap-1.5 rounded-full px-3 text-sm text-muted-foreground" onClick={onUpload}>
          <Upload className="size-4" aria-hidden="true" /> Upload a GIF
        </Button>
      </div>
    </div>
  );
};

export default GifPicker;
