import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSast } from "@/lib/notificationAdmin";
import { useAdminCall } from "./adminRpc";

interface AuditRow {
  id: string;
  created_at: string;
  action: string;
  detail: Record<string, unknown>;
  admin_email: string | null;
}

/** Append-only trail of everything done in this area. Details contain ids and counts, never message text or member data. */
const AuditPanel = ({ refreshKey }: { refreshKey: number }) => {
  const call = useAdminCall();
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const load = useCallback(async () => {
    const result = await call<AuditRow[]>("admin_list_notification_audit", { p_limit: 200 });
    setRows(result.ok ? result.data : []);
  }, [call]);
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit trail</CardTitle>
        <CardDescription>The 200 most recent actions: who did what, and when (South African time). It can’t be edited.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} data-testid="audit-row">
                    <TableCell className="whitespace-nowrap text-xs">{formatSast(r.created_at)}</TableCell>
                    <TableCell className="text-xs">{r.admin_email ?? "—"}</TableCell>
                    <TableCell className="text-xs font-medium">{r.action.replace(/^notification_/, "").replace(/_/g, " ")}</TableCell>
                    <TableCell className="max-w-[24rem] truncate font-mono text-[11px] text-muted-foreground" title={JSON.stringify(r.detail)}>
                      {JSON.stringify(r.detail)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditPanel;
