import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, Bell, CheckCheck, Loader2, MessageCircleMore, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, safeImageUrl, safeLinkTarget, type InboxRow } from "@/lib/notificationInbox";

const DERM_MESSAGING_FEATURE_KEY = "dermatologist_messaging";

const origin = () => (typeof window === "undefined" ? "" : window.location.origin);

const NotificationItem = ({
  n,
  onOpen,
  onArchive,
}: {
  n: InboxRow;
  onOpen: (n: InboxRow, target: string | null) => void;
  onArchive: (id: string) => void;
}) => {
  const target = safeLinkTarget(n.link, origin());
  const image = safeImageUrl(n.image_url, origin());
  const unread = !n.read_at;
  const main = (
    <>
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")} aria-hidden="true" />
      {image && <img src={image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{n.title}</p>
          <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABEL[n.category] ?? n.category}</Badge>
          {unread && <span className="sr-only">Unread</span>}
        </div>
        {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
        <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
      </div>
    </>
  );
  return (
    <li
      data-testid="inbox-item"
      data-unread={unread ? "true" : "false"}
      className={cn("flex items-start gap-2 rounded-xl border px-4 py-3 transition-colors", unread ? "border-primary/30 bg-primary/5" : "border-border bg-background")}
    >
      <button type="button" onClick={() => onOpen(n, target)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
        {main}
      </button>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {target && n.action_label && (
          <Button size="sm" variant="outline" className="h-8" onClick={() => onOpen(n, target)}>
            {n.action_label}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onArchive(n.id)} aria-label={`Archive: ${n.title}`}>
          <Archive className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
};

const InboxTab = () => {
  const { notifications, loading, unreadCount, markRead, markAllRead, archive } = useNotifications();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWaitlistLoading(false);
      return;
    }
    supabase
      .from("feature_waitlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("feature_key", DERM_MESSAGING_FEATURE_KEY)
      .maybeSingle()
      .then(({ data }) => {
        setOnWaitlist(Boolean(data));
        setWaitlistLoading(false);
      });
  }, [user]);

  const openNotification = (n: InboxRow, target: string | null) => {
    void markRead(n.id);
    if (target) navigate(target);
  };

  const archiveNotification = async (id: string) => {
    const ok = await archive(id);
    if (!ok) toast.error("Couldn’t archive that notification. Please try again.");
  };

  const markEverythingRead = async () => {
    const ok = await markAllRead();
    if (!ok) toast.error("Couldn’t mark everything as read. Please try again.");
  };

  const joinWaitlist = async () => {
    if (!user) return;
    setOnWaitlist(true);
    const { error } = await supabase
      .from("feature_waitlist")
      .insert({ user_id: user.id, feature_key: DERM_MESSAGING_FEATURE_KEY });
    if (error && !error.message.includes("duplicate")) {
      setOnWaitlist(false);
      toast.error("Could not join the waitlist right now");
      return;
    }
    toast.success("You're on the list — we'll email you when derm messaging launches.");
  };

  return (
    <Tabs defaultValue="notifications" className="space-y-4">
      <TabsList>
        <TabsTrigger value="notifications" className="gap-1.5">
          <Bell className="h-3.5 w-3.5" /> Notifications
          {unreadCount > 0 && <Badge className="ml-1 h-4 min-w-4 justify-center px-1 text-[10px]">{unreadCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="messages" className="gap-1.5">
          <MessageCircleMore className="h-3.5 w-3.5" /> Messages
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notifications">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Account and system updates, reminders and news you’ve asked for. Archive anything you’re done with.</CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void markEverythingRead()}>
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing yet — we'll notify you here when something happens on your account.
              </p>
            ) : (
              <ul className="space-y-2" aria-label="Notifications">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} n={n} onOpen={openNotification} onArchive={(id) => void archiveNotification(id)} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="messages">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" /> Message a dermatologist
              <Badge variant="secondary">Coming soon</Badge>
            </CardTitle>
            <CardDescription>
              Real-time messaging with a licensed dermatologist is in development and isn't live yet — this is not a
              working chat. Join the list and we'll email you the moment it launches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={joinWaitlist} disabled={onWaitlist || waitlistLoading} className="gap-2">
              {onWaitlist ? "You're on the list" : "Notify me when this launches"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              In the meantime, VIP members can{" "}
              <Link to="/consultations" className="text-primary hover:underline">book a consultation</Link>.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default InboxTab;
