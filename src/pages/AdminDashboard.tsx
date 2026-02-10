import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, CheckCircle2, Clock, Users, FileText } from "lucide-react";
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

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("skincare_recommendations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } else {
      setSubmissions((data as Submission[]) || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("skincare_recommendations")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${newStatus}`);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status: newStatus });
      }
    }
  };

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    reviewed: submissions.filter((s) => s.status === "reviewed").length,
    delivered: submissions.filter((s) => s.status === "delivered").length,
  };

  if (authLoading || loading) {
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

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | SKINLABS</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-8">
              Submissions Dashboard
            </h1>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total", value: stats.total, icon: FileText, color: "text-primary" },
                { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500" },
                { label: "Reviewed", value: stats.reviewed, icon: Eye, color: "text-blue-500" },
                { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-green-500" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filter tabs */}
            <Tabs value={filter} onValueChange={setFilter} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="reviewed">Reviewed ({stats.reviewed})</TabsTrigger>
                <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Submissions list */}
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No submissions found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((sub) => (
                  <Card key={sub.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-card-foreground">
                            {sub.contact_name || "Anonymous"}
                          </span>
                          <Badge
                            variant={sub.status === "pending" ? "secondary" : sub.status === "reviewed" ? "outline" : "default"}
                          >
                            {sub.status}
                          </Badge>
                          {sub.book_consultation && (
                            <Badge variant="outline" className="text-xs">📞 Consultation</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sub.email_sent_to || "No email"} • {sub.skin_type} skin •{" "}
                          {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {sub.concerns?.slice(0, 3).map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 shrink-0">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                  <Badge variant={selectedSubmission.status === "pending" ? "secondary" : "default"}>
                    {selectedSubmission.status}
                  </Badge>
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
                  <div className="flex flex-wrap gap-1">
                    {selectedSubmission.concerns?.map((c) => (
                      <Badge key={c} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2">AI Recommendation</h4>
                  <div className="bg-secondary/30 rounded-lg p-4 max-h-64 overflow-y-auto text-sm text-muted-foreground whitespace-pre-line">
                    {selectedSubmission.recommendation}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {selectedSubmission.status === "pending" && (
                    <Button onClick={() => updateStatus(selectedSubmission.id, "reviewed")} className="gap-1">
                      <Eye className="h-4 w-4" /> Mark Reviewed
                    </Button>
                  )}
                  {selectedSubmission.status !== "delivered" && (
                    <Button variant="outline" onClick={() => updateStatus(selectedSubmission.id, "delivered")} className="gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Mark Delivered
                    </Button>
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
