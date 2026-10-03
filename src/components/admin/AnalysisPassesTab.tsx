import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Ticket, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface Account {
  user_id: string;
  email: string;
  full_name: string | null;
  subscription_status: string | null;
  pass_balance: number;
}

interface Grant {
  id: string;
  created_at: string;
  target_email: string;
  credits: number;
  note: string;
}

const QUANTITIES = [1, 2, 3, 5, 10];
const DEFAULT_NOTE = "Manual issue";
const NOTE_MAX = 200;

const plural = (n: number) => `${n} Analysis Pass${n === 1 ? "" : "es"}`;

/**
 * Admin → Analysis Passes: issue passes to a member by email, with no payment.
 * Passes unlock the Advanced AI Dermatology Analysis and live in the same ledger a
 * purchase writes to. Everything goes through the admin-gated SECURITY DEFINER RPCs
 * (supabase/migrations/20261004110000_admin_issue_analysis_passes.sql); the browser
 * never writes the ledger. Each confirmed attempt carries its own request id, so a
 * double click or retry can't issue twice.
 */
const AnalysisPassesTab = () => {
  const [email, setEmail] = useState("");
  const [looking, setLooking] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [credits, setCredits] = useState("1");
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  // One id per attempt; replaced after every success so the next issue is a new grant.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [grants, setGrants] = useState<Grant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(true);

  const loadGrants = useCallback(async () => {
    const { data, error } = await supabase
      .from("analysis_pass_grants")
      .select("id, created_at, target_email, credits, note")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) toast.error("Couldn't load recent grants");
    setGrants(data ?? []);
    setGrantsLoading(false);
  }, []);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    // A different address means a different member: never issue against a stale lookup.
    setAccount(null);
    setNotFound(false);
  };

  const lookUp = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLooking(true);
    setAccount(null);
    setNotFound(false);
    const { data, error } = await supabase.rpc("admin_lookup_analysis_pass_account", { p_email: trimmed });
    setLooking(false);
    if (error) {
      toast.error(error.message || "Lookup failed");
      return;
    }
    const row = data?.[0];
    if (!row) {
      setNotFound(true);
      return;
    }
    setAccount({
      user_id: row.user_id,
      email: row.email,
      full_name: row.full_name,
      subscription_status: row.subscription_status,
      pass_balance: row.pass_balance,
    });
  };

  const quantity = Number(credits);
  const noteValid = note.trim().length > 0 && note.trim().length <= NOTE_MAX;

  const issue = async () => {
    if (!account || !noteValid) return;
    setIssuing(true);
    const { data, error } = await supabase.rpc("admin_issue_analysis_passes", {
      p_email: account.email,
      p_credits: quantity,
      p_note: note.trim(),
      p_request_id: requestId,
    });
    setIssuing(false);
    if (error) {
      toast.error(error.message || "Couldn't issue the pass");
      return;
    }
    const result = data?.[0];
    if (result?.already_issued) {
      toast.info("That grant was already issued; nothing was added.");
    } else {
      toast.success(`Issued ${plural(quantity)} to ${account.email}`);
    }
    if (result) setAccount({ ...account, pass_balance: result.pass_balance });
    setConfirmOpen(false);
    setRequestId(crypto.randomUUID());
    setNote(DEFAULT_NOTE);
    void loadGrants();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="h-5 w-5" aria-hidden="true" /> Issue Analysis Passes
          </CardTitle>
          <CardDescription>
            Give a member Analysis Passes without a payment. A pass unlocks one Advanced AI Dermatology Analysis. Find
            the member by the email address on their account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={lookUp} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="pass-email">Member email</Label>
              <Input
                id="pass-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" disabled={looking || !email.trim()} className="gap-2">
              {looking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              Look up account
            </Button>
          </form>

          {notFound && (
            <p role="status" className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">
              No account found for <span className="font-semibold">{email.trim()}</span>. Passes can only be issued to an
              existing account.
            </p>
          )}

          {account && (
            <div className="space-y-5 rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{account.full_name || "No name on profile"}</p>
                  <p className="truncate text-sm text-muted-foreground">{account.email}</p>
                </div>
                <Badge variant="outline">{account.subscription_status ?? "free"}</Badge>
                <div className="text-right">
                  <p className="eyebrow">Passes held</p>
                  <p className="font-heading text-2xl font-extrabold leading-none" aria-live="polite">{account.pass_balance}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="pass-qty">Passes to issue</Label>
                  <Select value={credits} onValueChange={setCredits}>
                    <SelectTrigger id="pass-qty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUANTITIES.map((q) => (
                        <SelectItem key={q} value={String(q)}>
                          {q}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pass-note">Reason (kept in the audit trail)</Label>
                  <Input id="pass-note" value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>

              <Button type="button" onClick={() => setConfirmOpen(true)} disabled={!noteValid || issuing} className="gap-2">
                <Ticket className="h-4 w-4" aria-hidden="true" /> Issue {plural(quantity)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent manual grants</CardTitle>
          <CardDescription>The last 25 passes issued from this tab.</CardDescription>
        </CardHeader>
        <CardContent>
          {grantsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" />
            </div>
          ) : grants.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No passes have been issued manually yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Passes</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grants.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(g.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" })}
                      </TableCell>
                      <TableCell className="text-sm">{g.target_email}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{g.credits}</TableCell>
                      <TableCell className="min-w-[12rem] text-sm text-muted-foreground">{g.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !issuing && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue {plural(quantity)}?</AlertDialogTitle>
            <AlertDialogDescription>
              {account?.email} will receive {plural(quantity)} at no charge. This is recorded in the audit trail and can't
              be undone from here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={issuing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={issuing}
              onClick={(e) => {
                e.preventDefault();
                void issue();
              }}
            >
              {issuing ? "Issuing…" : "Issue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnalysisPassesTab;
