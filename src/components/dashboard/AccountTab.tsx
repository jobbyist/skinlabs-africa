import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Download, LogOut, PauseCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { downloadAccountDataPdf } from "@/lib/generateAccountDataPdf";
import { toast } from "sonner";

const AccountTab = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profileRes, recsRes, journeyRes, txRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("skincare_recommendations").select("created_at, skin_type, concerns").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("skin_journey_entries").select("entry_date, mood, skin_condition_rating").eq("user_id", user.id).order("entry_date", { ascending: false }),
        supabase.from("payment_transactions").select("created_at, description, amount_zar, reference").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      // supabase-js resolves with { data: null, error } rather than throwing
      // on a query error, so treating .data as always-present let a failed
      // profile fetch (RLS hiccup, dropped connection) silently generate a
      // near-empty PDF — surface it instead and stop before generating one.
      const failed = [profileRes, recsRes, journeyRes, txRes].find((r) => r.error);
      if (failed?.error) throw failed.error;

      const profile = profileRes.data;
      downloadAccountDataPdf({
        fullName: profile?.full_name ?? null,
        email: user.email ?? "",
        createdAt: profile?.created_at ?? user.created_at,
        profileFields: {
          Username: profile?.username ?? "",
          Phone: profile?.phone ?? "",
          "Date of birth": profile?.date_of_birth ?? "",
          Gender: profile?.gender ?? "",
          "Skin type (Fitzpatrick)": profile?.skin_color ?? "",
          Address: [profile?.address_line1, profile?.address_line2, profile?.city, profile?.province, profile?.postal_code, profile?.country]
            .filter(Boolean)
            .join(", "),
          Allergies: (profile?.allergies ?? []).join(", "),
          "Skin conditions": (profile?.skin_conditions ?? []).join(", "),
        },
        recommendations: recsRes.data ?? [],
        journeyEntries: journeyRes.data ?? [],
        transactions: (txRes.data ?? []).map((t) => ({ ...t, amount_zar: Number(t.amount_zar) })),
      });
      toast.success("Your data export has downloaded.");
    } catch (err) {
      console.error("account data export failed", err);
      toast.error("Could not generate your data export — please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const { error } = await supabase.rpc("deactivate_account");
      if (error) throw error;
      setDeactivateOpen(false);
      toast.success("Your account is deactivated. Sign in any time to reactivate it.");
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("account deactivation failed", err);
      toast.error("Could not deactivate your account right now.");
    } finally {
      setDeactivating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-delete", {
        body: { confirm: "DELETE" },
      });
      if (error || !(data as { deleted?: boolean })?.deleted) {
        throw error ?? new Error("Deletion did not complete");
      }
      toast.success("Your account has been permanently deleted.");
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("account deletion failed", err);
      // A failed attempt must not leave "DELETE" sitting in the field: the
      // button is only disabled by deleteConfirm !== "DELETE", so a cached
      // value would let a bare click re-submit the deletion on retry without
      // the user consciously retyping the confirmation phrase again.
      setDeleteConfirm("");
      toast.error("Could not delete your account. Please try again or contact us.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LogOut className="h-5 w-5 text-primary" /> Session</CardTitle>
          <CardDescription>Signed in as {user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> Export your data</CardTitle>
          <CardDescription>Download a PDF copy of your profile, analyses, journey entries and transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Download className="h-4 w-4" /> Download my data (PDF)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PauseCircle className="h-5 w-5 text-amber-600" /> Deactivate account</CardTitle>
          <CardDescription>
            Temporarily deactivates your account and signs you out. Your data is kept — sign back in any time to
            pick up where you left off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setDeactivateOpen(true)} className="gap-2 border-amber-500/50 text-amber-700 hover:bg-amber-500/10">
            <PauseCircle className="h-4 w-4" /> Deactivate my account
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Delete account permanently</CardTitle>
          <CardDescription>
            This permanently deletes your account and all associated data — profile, analyses, routine, credits and
            transaction history. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete my account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be signed out immediately. Your profile, analyses and history stay intact — sign back in
              whenever you're ready to reactivate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deactivating} onClick={handleDeactivate}>
              {deactivating ? "Deactivating…" : "Yes, deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteConfirm(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Everything tied to your account — profile, AI skin analyses, routine, saved
              credits and transaction history — will be permanently erased.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm" className="text-xs">Type DELETE to confirm</Label>
            <Input id="delete-confirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting || deleteConfirm !== "DELETE"}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Permanently delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountTab;
