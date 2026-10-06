import { useCallback, useEffect, useState } from "react";
import { PauseCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { callAdmin } from "./adminRpc";
import AuditPanel from "./AuditPanel";
import AutomationsPanel from "./AutomationsPanel";
import ComposePanel, { type LoadedCampaign } from "./ComposePanel";
import HistoryPanel from "./HistoryPanel";
import OverviewPanel, { type Overview } from "./OverviewPanel";
import TemplatesPanel from "./TemplatesPanel";
import { toast } from "sonner";

/**
 * Admin → Notifications. Mounted only inside the admin dashboard (which already requires the admin role) and every call is an
 * admin RPC that re-checks the role in SQL: a member who somehow rendered this would only ever see "Admin access required".
 */
const NotificationsTab = () => {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [refreshKey, setRefreshKey] = useState(0);
  const [draftToLoad, setDraftToLoad] = useState<LoadedCampaign | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    const result = await callAdmin<Overview>("admin_notification_overview", { p_days: days });
    if (result.ok) setOverview(result.data);
    else toast.error(result.message, { id: "notification-overview" });
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview, refreshKey]);

  const changed = useCallback(() => setRefreshKey((k) => k + 1), []);
  const pushOn = overview?.settings?.push_enabled ?? true;

  return (
    <div className="space-y-6">
      {overview && !pushOn && (
        <Alert variant="destructive" role="alert" data-testid="push-paused-banner">
          <PauseCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Push is paused</AlertTitle>
          <AlertDescription>
            Nothing is being delivered to members’ devices. Inbox messages are still written. Pushes already queued wait, and any still unsent after 24 hours are dropped. Turn it back on in Overview.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Scheduled &amp; History</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewPanel overview={overview} loading={loading} days={days} onDays={setDays} onChanged={changed} />
        </TabsContent>
        <TabsContent value="compose" className="mt-6">
          <ComposePanel draftToLoad={draftToLoad} onDraftLoaded={() => setDraftToLoad(null)} onChanged={changed} />
        </TabsContent>
        <TabsContent value="automations" className="mt-6">
          <AutomationsPanel refreshKey={refreshKey} onChanged={changed} />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesPanel refreshKey={refreshKey} onChanged={changed} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <HistoryPanel
            refreshKey={refreshKey}
            onEditDraft={(c) => {
              setDraftToLoad(c);
              setTab("compose");
            }}
            onChanged={changed}
          />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditPanel refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsTab;
