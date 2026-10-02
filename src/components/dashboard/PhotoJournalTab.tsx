import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Camera, ChevronLeft, ChevronRight, Clock3, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackConversionEvent } from "@/lib/analytics-events";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
type Frequency = "weekly" | "monthly";
type JournalEntry = {
  id: string;
  storage_path: string;
  entry_type: "baseline" | "progress";
  source_analysis_id: string | null;
  captured_at: string;
  note: string | null;
  signedUrl?: string;
};

const asDb = () => supabase as any;

const formatDate = (value: string) => new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date(value));

const addInterval = (date: Date, frequency: Frequency) => {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

const PhotoJournalTab = () => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const db = asDb();
    const [{ data: settings }, { data: rows, error }] = await Promise.all([
      db.from("skin_photo_journal_settings").select("frequency").eq("user_id", user.id).maybeSingle(),
      db.from("skin_photo_journal_entries").select("id, storage_path, entry_type, source_analysis_id, captured_at, note").eq("user_id", user.id).order("captured_at", { ascending: true }),
    ]);
    if (settings?.frequency === "weekly" || settings?.frequency === "monthly") setFrequency(settings.frequency);
    if (error) {
      toast.error("Couldn’t load your PhotoJournal");
      setLoading(false);
      return;
    }
    const withUrls = await Promise.all((rows ?? []).map(async (row: JournalEntry) => {
      const { data } = await supabase.storage.from("skin-analysis-photos").createSignedUrl(row.storage_path, 60 * 60);
      return { ...row, signedUrl: data?.signedUrl };
    }));
    setEntries(withUrls);
    setSelectedIndex(Math.max(0, withUrls.length - 1));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const baseline = entries.find((entry) => entry.entry_type === "baseline") ?? entries[0] ?? null;
  const latest = entries[entries.length - 1] ?? null;
  const nextDue = latest ? addInterval(new Date(latest.captured_at), frequency) : null;
  const isDue = nextDue ? nextDue.getTime() <= Date.now() : false;
  const selected = entries[selectedIndex] ?? latest;

  const saveFrequency = async (value: Frequency) => {
    if (!user) return;
    setFrequency(value);
    const { error } = await asDb().from("skin_photo_journal_settings").upsert({ user_id: user.id, frequency: value, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error("Couldn’t save your PhotoJournal preference");
    else trackConversionEvent("photo_journal_frequency_changed", { frequency: value });
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("That image is over 5MB — choose a smaller photo");
      return;
    }
    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/journal/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("skin-analysis-photos").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: insertError } = await asDb().from("skin_photo_journal_entries").insert({
        user_id: user.id,
        storage_path: path,
        entry_type: "progress",
        captured_at: new Date().toISOString(),
        note: note.trim() || null,
      });
      if (insertError) {
        await supabase.storage.from("skin-analysis-photos").remove([path]);
        throw insertError;
      }
      setNote("");
      trackConversionEvent("photo_journal_entry_added", { entryType: "progress", frequency });
      toast.success("Photo added to your skin journey");
      await load();
    } catch (error) {
      console.error("PhotoJournal upload failed", error);
      toast.error("Couldn’t save that photo. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeEntry = async (entry: JournalEntry) => {
    if (!user || entry.entry_type === "baseline") return;
    if (!window.confirm("Remove this PhotoJournal entry? This cannot be undone.")) return;
    const { error } = await asDb().from("skin_photo_journal_entries").delete().eq("id", entry.id).eq("user_id", user.id);
    if (error) return toast.error("Couldn’t remove that entry");
    await supabase.storage.from("skin-analysis-photos").remove([entry.storage_path]);
    trackConversionEvent("photo_journal_entry_deleted", { entryType: "progress" });
    await load();
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/80 shadow-[var(--shadow-sm)]">
        <CardHeader className="bg-gradient-to-br from-background to-muted/35">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">
                <Camera className="h-3.5 w-3.5" aria-hidden="true" /> PhotoJournal
              </div>
              <CardTitle className="mt-3 text-2xl">Watch your skin change over time.</CardTitle>
              <CardDescription className="mt-1 max-w-2xl leading-relaxed">
                Keep a simple visual record alongside your routine. Your first Basic AI Skin Analysis photo becomes your baseline, then you can add a fresh photo every week or month.
              </CardDescription>
            </div>
            <div className="min-w-[180px] rounded-2xl border border-border bg-background p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Your cadence</p>
              <Select value={frequency} onValueChange={(value) => void saveFrequency(value as Frequency)}>
                <SelectTrigger className="mt-2 min-h-10" aria-label="PhotoJournal cadence"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Every week</SelectItem>
                  <SelectItem value="monthly">Every month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-3 font-heading text-lg font-semibold">Your visual skin journey starts here.</h3>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">Complete a Basic AI Skin Analysis with a photo, or add your first journal photo below. Keep your lighting and angle as consistent as you can.</p>
              <Button className="mt-5 min-h-11 gap-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Add first photo
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
                  <div className="relative aspect-[4/3] bg-black/5">
                    {selected?.signedUrl ? <img src={selected.signedUrl} alt={selected.entry_type === "baseline" ? "SkinJournal baseline photo" : `SkinJournal photo from ${formatDate(selected.captured_at)}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Photo unavailable</div>}
                    {selected && <div className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm">{selected.entry_type === "baseline" ? "Baseline" : formatDate(selected.captured_at)}</div>}
                  </div>
                  {selected && (
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium">{selected.entry_type === "baseline" ? "Your starting point" : "Progress check"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(selected.captured_at)}{selected.note ? ` · ${selected.note}` : ""}</p>
                      </div>
                      {selected.entry_type !== "baseline" && <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => void removeEntry(selected)} aria-label="Delete selected PhotoJournal entry"><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className={cn("rounded-2xl border p-4", isDue ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20")}>
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold">{isDue ? "Your next check-in is due" : nextDue ? `Next photo around ${formatDate(nextDue.toISOString())}` : "Choose your check-in cadence"}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{frequency === "weekly" ? "Weekly works well when you want to see smaller changes." : "Monthly keeps the journal lightweight and makes longer-term changes easier to see."}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Journal note</p>
                    <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-20 resize-none" maxLength={500} placeholder="Optional: how has your skin felt this week?" />
                    <Button className="mt-3 min-h-10 w-full gap-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      Add progress photo
                    </Button>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">JPG, PNG, WebP or HEIC · maximum 5MB</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Your timeline</p>
                    <p className="text-xs text-muted-foreground">{entries.length} {entries.length === 1 ? "photo" : "photos"} saved</p>
                  </div>
                  {entries.length > 1 && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Compare over time</span>}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label="PhotoJournal timeline">
                  {entries.map((entry, index) => (
                    <button key={entry.id} type="button" role="listitem" onClick={() => setSelectedIndex(index)} className={cn("w-28 shrink-0 overflow-hidden rounded-xl border bg-background text-left transition", selected?.id === entry.id ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/40")} aria-label={`${entry.entry_type === "baseline" ? "Baseline" : "Progress photo"} ${formatDate(entry.captured_at)}`}>
                      <div className="aspect-square bg-muted/30">{entry.signedUrl && <img src={entry.signedUrl} alt="" className="h-full w-full object-cover" />}</div>
                      <div className="p-2"><p className="truncate text-[11px] font-medium">{entry.entry_type === "baseline" ? "Baseline" : formatDate(entry.captured_at)}</p></div>
                    </button>
                  ))}
                </div>
                {entries.length > 1 && (
                  <div className="mt-3 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))} disabled={selectedIndex === 0} aria-label="Previous journal photo"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIndex(Math.min(entries.length - 1, selectedIndex + 1))} disabled={selectedIndex === entries.length - 1} aria-label="Next journal photo"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleUpload(file); }} />

      <Card className="border-border bg-muted/20">
        <CardContent className="p-4 sm:p-5">
          <p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Keep it consistent:</strong> take your photos in similar lighting, from a similar distance and angle, without filters. PhotoJournal is a visual record, not a diagnostic tool.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotoJournalTab;
