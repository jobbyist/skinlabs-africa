import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Entry {
  id: string;
  entry_date: string;
  mood: string | null;
  skin_condition_rating: number | null;
  notes: string | null;
}

const SkinJourneyTab = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ mood: "", skin_condition_rating: 7, notes: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("skin_journey_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user]);

  const add = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("skin_journey_entries").insert({
      user_id: user.id,
      mood: draft.mood || null,
      skin_condition_rating: draft.skin_condition_rating,
      notes: draft.notes || null,
    });
    setSaving(false);
    if (error) return toast.error("Could not save entry");
    setDraft({ mood: "", skin_condition_rating: 7, notes: "" });
    toast.success("Entry added");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("skin_journey_entries").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Check-in</CardTitle>
          <CardDescription>How is your skin feeling today?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Mood</Label><Input value={draft.mood} onChange={(e) => setDraft({ ...draft, mood: e.target.value })} placeholder="calm, dry, breakout…" /></div>
            <div><Label>Skin rating (1–10)</Label><Input type="number" min={1} max={10} value={draft.skin_condition_rating} onChange={(e) => setDraft({ ...draft, skin_condition_rating: parseInt(e.target.value) || 1 })} /></div>
          </div>
          <div><Label>Notes</Label><Textarea rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="What did you notice? Products used, weather, etc." /></div>
          <Button onClick={add} disabled={saving}><Plus className="h-4 w-4 mr-1" />Add entry</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Journey timeline</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> :
            entries.length === 0 ? <p className="text-sm text-muted-foreground">No entries yet — add your first check-in above.</p> :
            <div className="space-y-3">
              {entries.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">{new Date(e.entry_date).toLocaleDateString()}</span>
                      {e.skin_condition_rating && <span className="text-primary">{e.skin_condition_rating}/10</span>}
                      {e.mood && <span className="text-muted-foreground">· {e.mood}</span>}
                    </div>
                    {e.notes && <p className="text-sm text-muted-foreground mt-1">{e.notes}</p>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default SkinJourneyTab;
