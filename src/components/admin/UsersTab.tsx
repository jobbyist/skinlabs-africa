import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Loader2, Search, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { isPaidSubscriptionStatus } from "@/lib/entitlements";
import { useAuth } from "@/hooks/use-auth";

type AppRole = "admin" | "moderator" | "user";

interface DirectoryRow {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  subscription_status: string | null;
  founding_member: boolean | null;
  account_status: string | null;
  created_at: string;
  roles: AppRole[];
  total_count: number;
}

interface Transaction {
  id: string;
  purchase_type: string;
  amount_zar: number;
  status: string;
  gateway: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;
const OVERRIDE_STATUSES = ["free", "glow_lite", "insider", "vip"] as const;

/**
 * Admin user directory: search/paginate (replacing the previous unbounded
 * `profiles.select("*")` in AdminDashboard.tsx), role grant/revoke, and a
 * manual entitlement-override escape hatch -- all through the
 * admin_search_profiles/admin_set_user_role/admin_override_entitlement
 * SECURITY DEFINER RPCs (supabase/migrations/20260921130000_admin_user_
 * management.sql), never a direct table write from the client.
 */
const UsersTab = () => {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DirectoryRow | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ role: AppRole; grant: boolean } | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideConfirmOpen, setOverrideConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const search = useCallback(async (q: string, p: number) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_search_profiles", { _query: q || undefined, _page: p, _page_size: PAGE_SIZE });
    if (error) {
      toast.error("Failed to load users");
      setLoading(false);
      return;
    }
    const list = (data as DirectoryRow[]) || [];
    setRows(list);
    setTotalCount(list[0]?.total_count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void search(query, 0), 300);
    setPage(0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    void search(query, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openDetail = async (row: DirectoryRow) => {
    setSelected(row);
    setOverrideStatus(row.subscription_status || "free");
    setOverrideReason("");
    const { data } = await supabase
      .from("payment_transactions")
      .select("id, purchase_type, amount_zar, status, gateway, created_at")
      .eq("user_id", row.user_id)
      .order("created_at", { ascending: false })
      .limit(10);
    setTransactions((data as Transaction[]) || []);
  };

  const closeDetail = () => {
    setSelected(null);
    setTransactions([]);
  };

  const applyRoleChange = async () => {
    if (!selected || !pendingRoleChange) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_set_user_role", {
      _target_user_id: selected.user_id,
      _role: pendingRoleChange.role,
      _grant: pendingRoleChange.grant,
    });
    setSaving(false);
    setPendingRoleChange(null);
    if (error) {
      toast.error(error.message || "Failed to update role");
      return;
    }
    toast.success(pendingRoleChange.grant ? `Granted ${pendingRoleChange.role}` : `Revoked ${pendingRoleChange.role}`);
    const nextRoles = pendingRoleChange.grant
      ? Array.from(new Set([...selected.roles, pendingRoleChange.role]))
      : selected.roles.filter((r) => r !== pendingRoleChange.role);
    setSelected({ ...selected, roles: nextRoles });
    setRows((prev) => prev.map((r) => (r.user_id === selected.user_id ? { ...r, roles: nextRoles } : r)));
  };

  const applyOverride = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_override_entitlement", {
      _target_user_id: selected.user_id,
      _subscription_status: overrideStatus,
      _reason: overrideReason,
    });
    setSaving(false);
    setOverrideConfirmOpen(false);
    if (error) {
      toast.error(error.message || "Failed to apply override");
      return;
    }
    toast.success(`Subscription status set to ${overrideStatus}`);
    setSelected({ ...selected, subscription_status: overrideStatus });
    setRows((prev) => prev.map((r) => (r.user_id === selected.user_id ? { ...r, subscription_status: overrideStatus } : r)));
    setOverrideReason("");
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No users match this search.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Card key={row.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => void openDetail(row)}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-card-foreground">{row.full_name || row.email || "Unknown"}</span>
                    {isPaidSubscriptionStatus(row.subscription_status) && <Badge>{row.subscription_status}</Badge>}
                    {row.founding_member && <Badge variant="outline">Founding member</Badge>}
                    {row.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="gap-1">
                        <ShieldCheck className="h-3 w-3" /> {r}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {row.email} • Joined {new Date(row.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages} — {totalCount} users
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.full_name || selected.email || "User"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> <span className="text-card-foreground">{selected.email || "—"}</span></div>
                  <div><span className="text-muted-foreground">Plan:</span> <span className="text-card-foreground">{selected.subscription_status || "free"}</span></div>
                  <div><span className="text-muted-foreground">Account status:</span> <span className="text-card-foreground">{selected.account_status || "active"}</span></div>
                  <div><span className="text-muted-foreground">Joined:</span> <span className="text-card-foreground">{new Date(selected.created_at).toLocaleDateString()}</span></div>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2 text-sm">Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {(["admin", "moderator"] as const).map((role) => {
                      const has = selected.roles.includes(role);
                      return (
                        <Button
                          key={role}
                          size="sm"
                          variant={has ? "default" : "outline"}
                          className="gap-1"
                          onClick={() => setPendingRoleChange({ role, grant: !has })}
                        >
                          {has ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          {has ? `Revoke ${role}` : `Grant ${role}`}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2 text-sm flex items-center gap-1.5">
                    <ReceiptText className="h-3.5 w-3.5" /> Recent transactions
                  </h4>
                  {transactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No verified transactions on record.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-xs">
                          <span className="text-card-foreground">{t.purchase_type} {t.gateway ? `(${t.gateway})` : ""}</span>
                          <span className="text-muted-foreground">R{t.amount_zar} • {t.status} • {new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <h4 className="font-medium text-card-foreground text-sm">Manual entitlement override</h4>
                  <p className="text-xs text-muted-foreground">
                    A support escape hatch — never touches payment records, always logged with a reason. Use only for
                    genuine support cases (e.g. a verified payment that failed to grant automatically).
                  </p>
                  <div className="flex gap-2 items-end flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-xs">New plan</Label>
                      <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OVERRIDE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reason (required)</Label>
                    <Textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. Support ticket #1234 — PayFast ITN never landed, payment confirmed manually."
                      className="text-sm"
                      rows={2}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!overrideReason.trim() || overrideStatus === (selected.subscription_status || "free")}
                    onClick={() => setOverrideConfirmOpen(true)}
                  >
                    Apply override
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Role change confirmation */}
      <AlertDialog open={!!pendingRoleChange} onOpenChange={(open) => !open && setPendingRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingRoleChange?.grant ? `Grant ${pendingRoleChange.role}?` : `Revoke ${pendingRoleChange?.role}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRoleChange?.grant
                ? `This gives ${selected?.full_name || selected?.email || "this user"} the ${pendingRoleChange.role} role and everything it grants access to.`
                : `This removes the ${pendingRoleChange?.role} role from ${selected?.full_name || selected?.email || "this user"} immediately.`}
              {pendingRoleChange?.role === "admin" && selected?.user_id === currentUser?.id && !pendingRoleChange.grant && (
                <span className="block mt-2 font-medium text-destructive">You can't revoke your own admin role.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void applyRoleChange()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Entitlement override confirmation */}
      <AlertDialog open={overrideConfirmOpen} onOpenChange={setOverrideConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Override this account's plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This sets {selected?.full_name || selected?.email}'s plan to <strong>{overrideStatus}</strong> immediately,
              without a payment. It will be logged with the reason you entered. Reason: “{overrideReason}”
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void applyOverride()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersTab;
