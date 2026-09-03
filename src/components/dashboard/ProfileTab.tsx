import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfileComplete } from "@/hooks/use-profile-complete";
import { toast } from "sonner";

const FITZPATRICK = ["I — Very Fair", "II — Fair", "III — Medium", "IV — Olive", "V — Brown", "VI — Deep"];

const ProfileTab = () => {
  const { user } = useAuth();
  const { isComplete, missing, refresh } = useProfileComplete();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    race_ethnicity: "",
    skin_color: "",
    allergies: "",
    skin_conditions: "",
    preferred_routine_time: "both",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          username: (data as { username?: string | null }).username || "",
          full_name: data.full_name || "",
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          race_ethnicity: data.race_ethnicity || "",
          skin_color: data.skin_color || "",
          allergies: (data.allergies || []).join(", "),
          skin_conditions: (data.skin_conditions || []).join(", "),
          preferred_routine_time: data.preferred_routine_time || "both",
          notes: data.notes || "",
        });
      }
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const handle = form.username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(handle)) {
      setSaving(false);
      return toast.error("Username must be 3-20 characters: letters, numbers or underscores.");
    }
    const { error } = await supabase.from("profiles").update({
      username: handle,
      full_name: form.full_name || null,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      race_ethnicity: form.race_ethnicity || null,
      skin_color: form.skin_color || null,
      allergies: form.allergies ? form.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
      skin_conditions: form.skin_conditions ? form.skin_conditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
      preferred_routine_time: form.preferred_routine_time || null,
      notes: form.notes || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      return toast.error(
        error.message?.includes("profiles_username")
          ? "That username is already taken."
          : "Could not save profile",
      );
    }
    refresh();
    toast.success("Profile updated");
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Details we use to personalise your skincare recommendations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isComplete && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
            Complete your profile to unlock commenting on briefings and reviews. Still needed:{" "}
            <span className="font-medium text-foreground">{missing.join(", ")}</span>.
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="glowseeker" /></div>
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Date of birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Race / Ethnicity</Label><Input value={form.race_ethnicity} onChange={(e) => setForm({ ...form, race_ethnicity: e.target.value })} /></div>
          <div>
            <Label>Skin color (Fitzpatrick)</Label>
            <Select value={form.skin_color} onValueChange={(v) => setForm({ ...form, skin_color: v })}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{FITZPATRICK.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Preferred routine time</Label>
            <Select value={form.preferred_routine_time} onValueChange={(v) => setForm({ ...form, preferred_routine_time: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="am">AM only</SelectItem>
                <SelectItem value="pm">PM only</SelectItem>
                <SelectItem value="both">AM & PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Allergies (comma-separated)</Label><Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="fragrance, nut oils, retinol" /></div>
        <div><Label>Skin conditions (comma-separated)</Label><Input value={form.skin_conditions} onChange={(e) => setForm({ ...form, skin_conditions: e.target.value })} placeholder="eczema, rosacea, hyperpigmentation" /></div>
        <div><Label>Notes for our formulators</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save profile</Button>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
