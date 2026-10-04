import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CAMPAIGN_STATUS, DISPATCH_STATUSES, SKIP_REASON_LABEL, canCancelCampaign, canEditCampaign, describeAudience, formatSast } from "@/lib/notificationAdmin";
import { useAdminCall } from "./adminRpc";
import type { LoadedCampaign } from "./ComposePanel";

interface Campaign extends LoadedCampaign {
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  created_at: string;
  created_by_email: string | null;
  stats?: { enqueued: number; push_sent: number; pending: number; clicks: number };
}

interface Dispatch {
  id: string;
  created_at: string;
  status: string;
  skip_reason: string | null;
  category: string;
  source: string;
  title: string;
  devices_targeted: number;
  devices_sent: number;
  devices_failed: number;
  last_error: string | null;
  email: string | null;
  clicked: boolean;
}

const PAGE = 50;

interface Props {
  refreshKey: number;
  onEditDraft: (c: LoadedCampaign) => void;
  onChanged: () => void;
}

/** Scheduled and sent campaigns (cancel, edit a draft) and the per-member delivery log. */
const HistoryPanel = ({ refreshKey, onEditDraft, onChanged }: Props) => {
  const call = useAdminCall();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [dispatches, setDispatches] = useState<Dispatch[] | null>(null);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [offset, setOffset] = useState(0);
  const [cancelling, setCancelling] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState(false);

  const loadCampaigns = useCallback(async () => {
    const result = await call<Campaign[]>("admin_list_notification_campaigns", { p_limit: 100 });
    setCampaigns(result.ok ? result.data : []);
  }, [call]);

  const loadDispatches = useCallback(async () => {
    const result = await call<Dispatch[]>("admin_list_notification_dispatches", { p_limit: PAGE, p_offset: offset, p_status: status || undefined, p_source: source.trim() || undefined });
    setDispatches(result.ok ? result.data : []);
  }, [call, offset, status, source]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns, refreshKey]);
  useEffect(() => {
    void loadDispatches();
  }, [loadDispatches, refreshKey]);

  const cancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    const result = await call<number>("admin_cancel_notification_campaign", { p_id: cancelling.id });
    setBusy(false);
    if (!result.ok) return;
    toast.success(cancelling.status === "draft" || cancelling.status === "scheduled" ? "Campaign cancelled." : `Cancelled ${result.data} pending notification${result.data === 1 ? "" : "s"}.`);
    setCancelling(null);
    await loadCampaigns();
    await loadDispatches();
    onChanged();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaigns</CardTitle>
          <CardDescription>Drafts, scheduled sends and what has gone out. Times are South African time.</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns === null ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const st = CAMPAIGN_STATUS[c.status] ?? { label: c.status, tone: "outline" as const };
                    return (
                      <TableRow key={c.id} data-testid="campaign-row" data-status={c.status}>
                        <TableCell className="max-w-[18rem]">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{describeAudience(c.audience)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.tone}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{formatSast(c.status === "sent" ? c.sent_at : (c.scheduled_for ?? c.created_at))}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {c.stats ? `${c.stats.push_sent}/${c.stats.enqueued} pushed · ${c.stats.clicks} taps${c.stats.pending ? ` · ${c.stats.pending} waiting` : ""}` : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {canEditCampaign(c.status) && (
                            <Button variant="ghost" size="sm" className="gap-1" onClick={() => onEditDraft(c)} aria-label={`Edit draft: ${c.name}`}>
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                            </Button>
                          )}
                          {canCancelCampaign(c) && (
                            <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={() => setCancelling(c)} aria-label={`Cancel: ${c.name}`}>
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery log</CardTitle>
          <CardDescription>Every notification queued for a member, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="log-status" className="block text-xs font-medium">
                Status
              </label>
              <select id="log-status" value={status} onChange={(e) => { setOffset(0); setStatus(e.target.value); }} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="">All</option>
                {DISPATCH_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="log-source" className="block text-xs font-medium">
                Source
              </label>
              <Input id="log-source" value={source} onChange={(e) => { setOffset(0); setSource(e.target.value); }} placeholder="e.g. campaign" className="h-9 w-44" />
            </div>
          </div>
          {dispatches === null ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />
          ) : dispatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing matches.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Devices</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((d) => (
                    <TableRow key={d.id} data-testid="dispatch-row">
                      <TableCell className="whitespace-nowrap text-xs">{formatSast(d.created_at)}</TableCell>
                      <TableCell className="max-w-[12rem] truncate text-xs">{d.email ?? "—"}</TableCell>
                      <TableCell className="max-w-[16rem]">
                        <p className="truncate text-sm">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.category} · {d.source}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline">{d.status}</Badge>
                        {d.skip_reason && <p className="mt-1 text-muted-foreground">{SKIP_REASON_LABEL[d.skip_reason] ?? d.skip_reason}</p>}
                        {d.last_error && <p className="mt-1 text-destructive">{d.last_error}</p>}
                        {d.clicked && <p className="mt-1 text-muted-foreground">Tapped</p>}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {d.devices_sent}/{d.devices_targeted}
                        {d.devices_failed > 0 && ` · ${d.devices_failed} failed`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
              Newer
            </Button>
            <Button variant="outline" size="sm" disabled={(dispatches?.length ?? 0) < PAGE} onClick={() => setOffset(offset + PAGE)}>
              Older
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={cancelling !== null} onOpenChange={(open) => !open && !busy && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{cancelling && (cancelling.status === "draft" || cancelling.status === "scheduled") ? "Cancel this campaign?" : "Cancel the pushes still waiting?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelling && (cancelling.status === "draft" || cancelling.status === "scheduled")
                ? `“${cancelling.name}” will not be sent.`
                : `Notifications already delivered stay delivered. The ${cancelling?.stats?.pending ?? 0} still waiting for “${cancelling?.name}” won’t be sent.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void cancel()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : "Yes, cancel"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HistoryPanel;
