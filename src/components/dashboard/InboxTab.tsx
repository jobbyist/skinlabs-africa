import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Loader2, MessageCircleMore, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  system: "System",
  billing: "Billing",
  analysis: "Skin Analysis",
  community: "Community",
  security: "Security",
};

const DERM_MESSAGING_FEATURE_KEY = "dermatologist_messaging";

const InboxTab = () => {
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications();
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
              <CardDescription>Account and system updates — new analyses, credits, billing changes.</CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={markAllRead}>
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
              <div className="space-y-2">
                {notifications.map((n) => {
                  const content = (
                    <div
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                        n.read_at ? "border-border bg-background" : "border-primary/30 bg-primary/5",
                      )}
                    >
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABEL[n.category] ?? n.category}</Badge>
                        </div>
                        {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                  return n.link ? (
                    <Link key={n.id} to={n.link} onClick={() => markRead(n.id)} className="block">
                      {content}
                    </Link>
                  ) : (
                    <button key={n.id} onClick={() => markRead(n.id)} className="block w-full text-left">
                      {content}
                    </button>
                  );
                })}
              </div>
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
