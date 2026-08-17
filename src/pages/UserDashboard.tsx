import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Package, Crown, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import MFASettingsCard from "@/components/MFASettingsCard";
import ProfileTab from "@/components/dashboard/ProfileTab";
import SkinJourneyTab from "@/components/dashboard/SkinJourneyTab";

import AIFormulator from "@/components/AIFormulator";
interface Profile {
  subscription_status: string | null;
  subscription_started_at: string | null;
  full_name: string | null;
  email: string | null;
}

interface Preorder { id: string; product_type: string; amount: number; status: string; created_at: string; }
interface Recommendation { id: string; skin_type: string; concerns: string[]; created_at: string; status: string; }

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, preordersRes, recsRes] = await Promise.all([
        supabase.from("profiles").select("subscription_status, subscription_started_at, full_name, email").eq("user_id", user.id).single(),
        supabase.from("preorders").select("id, product_type, amount, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("skincare_recommendations").select("id, skin_type, concerns, created_at, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (preordersRes.data) setPreorders(preordersRes.data);
      if (recsRes.data) setRecommendations(recsRes.data);
      setDataLoading(false);
    })();
  }, [user]);

  if (loading || dataLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isSubscribed = profile?.subscription_status === "active";

  return (
    <>
      <Helmet><title>Dashboard | SKINLABS</title></Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-5xl">
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
              </h1>
              <p className="text-muted-foreground mb-6">{user?.email}</p>

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="formulator">AI Formulator</TabsTrigger>
                  <TabsTrigger value="journey">Skin Journey</TabsTrigger>
                  <TabsTrigger value="reports">AI Reports</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Crown className="h-4 w-4 text-primary" />Subscription</CardTitle></CardHeader>
                      <CardContent>
                        <Badge variant={isSubscribed ? "default" : "secondary"}>{isSubscribed ? "Premium" : "Free"}</Badge>
                        {isSubscribed && profile?.subscription_started_at && (
                          <p className="text-xs text-muted-foreground mt-2">Since {new Date(profile.subscription_started_at).toLocaleDateString()}</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Pre-Orders</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-foreground">{preorders.length}</p><p className="text-xs text-muted-foreground">Total orders</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Reports</CardTitle></CardHeader>
                      <CardContent><p className="text-2xl font-bold text-foreground">{recommendations.length}</p><p className="text-xs text-muted-foreground">Skincare analyses</p></CardContent>
                    </Card>
                  </div>

                  {preorders.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Your Pre-Orders</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {preorders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                              <div>
                                <p className="font-medium text-foreground capitalize">{order.product_type.replace("_", " ")}</p>
                                <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-foreground">R{order.amount}</p>
                                <Badge variant={order.status === "complete" ? "default" : "secondary"} className="text-xs">{order.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="profile"><ProfileTab /></TabsContent>
                
                <TabsContent value="formulator">
                  <AIFormulator />
                </TabsContent>

                <TabsContent value="journey"><SkinJourneyTab /></TabsContent>

                <TabsContent value="reports">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />AI Skincare Reports</CardTitle><CardDescription>Your personalized recommendations history</CardDescription></CardHeader>
                    <CardContent>
                      {recommendations.length === 0 ? <p className="text-sm text-muted-foreground">No reports yet. Try the <a href="/ai-formulator" className="text-primary hover:underline">AI Formulator</a>.</p> :
                        <div className="space-y-3">
                          {recommendations.map((rec) => (
                            <div key={rec.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                              <div>
                                <p className="font-medium text-foreground">{rec.skin_type} Skin</p>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {rec.concerns.slice(0, 3).map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                                  {rec.concerns.length > 3 && <Badge variant="secondary" className="text-xs">+{rec.concerns.length - 3}</Badge>}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">{new Date(rec.created_at).toLocaleDateString()}</p>
                                <Badge variant={rec.status === "delivered" ? "default" : "secondary"} className="text-xs">{rec.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      }
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security"><MFASettingsCard /></TabsContent>
              </Tabs>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default UserDashboard;
