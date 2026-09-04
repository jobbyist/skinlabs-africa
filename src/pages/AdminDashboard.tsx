import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, CheckCircle2, Clock, Users, FileText, Mail, ShoppingCart, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Submission = {
  id: string;
  user_id: string;
  created_at: string;
  recommendation: string;
  skin_type: string;
  concerns: string[];
  contact_name: string | null;
  email_sent_to: string | null;
  contact_whatsapp: string | null;
  status: string;
  book_consultation: boolean | null;
  age_range: string | null;
  lifestyle: string | null;
  environment: string | null;
};

type WaitlistEntry = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  created_at: string;
};

type Subscriber = {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
};

type Preorder = {
  id: string;
  user_id: string;
  amount: number;
  product_type: string;
  status: string;
  payment_id: string | null;
  created_at: string;
};

type PremiumProfile = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
};

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("submissions");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Data states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [profiles, setProfiles] = useState<PremiumProfile[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
    setIsAdmin(!!data);
    if (data) fetchAllData();
    else setLoading(false);
  };

  const fetchAllData = async () => {
    setLoading(true);
    const [subRes, waitRes, newsRes, preRes, profRes] = await Promise.all([
      supabase.from("skincare_recommendations").select("*").order("created_at", { ascending: false }),
      supabase.from("openhaus_waitlist").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }),
      supabase.from("preorders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    setSubmissions((subRes.data as Submission[]) || []);
    setWaitlist((waitRes.data as WaitlistEntry[]) || []);
    setSubscribers((newsRes.data as Subscriber[]) || []);
    setPreorders((preRes.data as Preorder[]) || []);
    setProfiles((profRes.data as PremiumProfile[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("skincare_recommendations").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Status updated to ${newStatus}`);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
    if (selectedSubmission?.id === id) setSelectedSubmission({ ...selectedSubmission, status: newStatus });
  };

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);
  const subStats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    reviewed: submissions.filter((s) => s.status === "reviewed").length,
    delivered: submissions.filter((s) => s.status === "delivered").length,
  };

  if (authLoading || loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const premiumProfiles = profiles.filter((p) => p.subscription_status === "premium");

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | SkinLabs®</title>
        <meta name="description" content="SkinLabs internal admin dashboard." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-8">Manage submissions, waitlist, subscribers & pre-orders</p>

            {/* Overview Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "AI Submissions", value: submissions.length, icon: FileText, color: "text-primary" },
                { label: "Waitlist", value: waitlist.length, icon: Users, color: "text-primary" },
                { label: "Newsletter", value: subscribers.length, icon: Mail, color: "text-primary" },
                { label: "Pre-Orders", value: preorders.length, icon: ShoppingCart, color: "text-primary" },
                { label: "Premium Members", value: premiumProfiles.length, icon: Star, color: "text-primary" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <s.icon className={`h-7 w-7 ${s.color}`} />
                    <div>
                      <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
                <TabsTrigger value="waitlist">Waitlist ({waitlist.length})</TabsTrigger>
                <TabsTrigger value="newsletter">Newsletter ({subscribers.length})</TabsTrigger>
                <TabsTrigger value="preorders">Pre-Orders ({preorders.length})</TabsTrigger>
                <TabsTrigger value="members">Members ({premiumProfiles.length})</TabsTrigger>
              </TabsList>

              {/* Submissions Tab */}
              <TabsContent value="submissions">
                <Tabs value={filter} onValueChange={setFilter} className="mb-4">
                  <TabsList>
                    <TabsTrigger value="all">All ({subStats.total})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({subStats.pending})</TabsTrigger>
                    <TabsTrigger value="reviewed">Reviewed ({subStats.reviewed})</TabsTrigger>
                    <TabsTrigger value="delivered">Delivered ({subStats.delivered})</TabsTrigger>
                  </TabsList>
                </Tabs>
                {filtered.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No submissions found</p></CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((sub) => (
                      <Card key={sub.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-card-foreground">{sub.contact_name || "Anonymous"}</span>
                              <Badge variant={sub.status === "pending" ? "secondary" : sub.status === "reviewed" ? "outline" : "default"}>{sub.status}</Badge>
                              {sub.book_consultation && <Badge variant="outline" className="text-xs">📞 Consultation</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{sub.email_sent_to || "No email"} • {sub.skin_type} skin • {new Date(sub.created_at).toLocaleDateString()}</p>
                            <div className="flex flex-wrap gap-1">{sub.concerns?.slice(0, 3).map((c) => (<Badge key={c} variant="secondary" className="text-xs">{c}</Badge>))}</div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1 shrink-0"><Eye className="h-4 w-4" />View</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Waitlist Tab */}
              <TabsContent value="waitlist">
                {waitlist.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No waitlist entries yet</p></CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {waitlist.map((entry) => (
                      <Card key={entry.id}>
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="space-y-1">
                            <span className="font-medium text-card-foreground">{entry.first_name} {entry.last_name}</span>
                            <p className="text-sm text-muted-foreground">{entry.email} • {entry.phone}</p>
                            <p className="text-xs text-muted-foreground">{entry.city}, {entry.country} • {new Date(entry.created_at).toLocaleDateString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Newsletter Tab */}
              <TabsContent value="newsletter">
                {subscribers.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground"><Mail className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No subscribers yet</p></CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {subscribers.map((sub) => (
                      <Card key={sub.id}>
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="space-y-1">
                            <span className="font-medium text-card-foreground">{sub.email}</span>
                            <p className="text-xs text-muted-foreground">Subscribed {new Date(sub.subscribed_at).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={sub.is_active ? "default" : "secondary"}>{sub.is_active ? "Active" : "Inactive"}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Pre-Orders Tab */}
              <TabsContent value="preorders">
                {preorders.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground"><ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No pre-orders yet</p></CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {preorders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="space-y-1">
                            <span className="font-medium text-card-foreground">{order.product_type}</span>
                            <p className="text-sm text-muted-foreground">R{order.amount} • {new Date(order.created_at).toLocaleDateString()}</p>
                            {order.payment_id && <p className="text-xs text-muted-foreground">Payment: {order.payment_id}</p>}
                          </div>
                          <Badge variant={order.status === "complete" ? "default" : "secondary"}>{order.status}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members">
                {premiumProfiles.length === 0 ? (
                  <Card><CardContent className="p-8 text-center text-muted-foreground"><Star className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No premium members yet</p></CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {premiumProfiles.map((p) => (
                      <Card key={p.id}>
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                          <div className="space-y-1">
                            <span className="font-medium text-card-foreground">{p.full_name || p.email || "Unknown"}</span>
                            <p className="text-sm text-muted-foreground">{p.email}</p>
                            {p.subscription_started_at && <p className="text-xs text-muted-foreground">Since {new Date(p.subscription_started_at).toLocaleDateString()}</p>}
                          </div>
                          <Badge variant="default">Premium</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>

      {/* Submission detail dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedSubmission.contact_name || "Submission"}
                  <Badge variant={selectedSubmission.status === "pending" ? "secondary" : "default"}>{selectedSubmission.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> <span className="text-card-foreground">{selectedSubmission.email_sent_to || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">WhatsApp:</span> <span className="text-card-foreground">{selectedSubmission.contact_whatsapp || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Skin Type:</span> <span className="text-card-foreground">{selectedSubmission.skin_type}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> <span className="text-card-foreground">{new Date(selectedSubmission.created_at).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Consultation:</span> <span className="text-card-foreground">{selectedSubmission.book_consultation ? "Yes ✅" : "No"}</span></div>
                </div>
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">Concerns</h4>
                  <div className="flex flex-wrap gap-1">{selectedSubmission.concerns?.map((c) => (<Badge key={c} variant="secondary">{c}</Badge>))}</div>
                </div>
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">AI Recommendation</h4>
                  <div className="bg-secondary/30 rounded-lg p-4 max-h-64 overflow-y-auto text-sm text-muted-foreground whitespace-pre-line">{selectedSubmission.recommendation}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  {selectedSubmission.status === "pending" && (
                    <Button onClick={() => updateStatus(selectedSubmission.id, "reviewed")} className="gap-1"><Eye className="h-4 w-4" /> Mark Reviewed</Button>
                  )}
                  {selectedSubmission.status !== "delivered" && (
                    <Button variant="outline" onClick={() => updateStatus(selectedSubmission.id, "delivered")} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Mark Delivered</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
