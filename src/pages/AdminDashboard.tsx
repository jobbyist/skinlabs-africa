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
import { Loader2, Eye, CheckCircle2, Clock, Users, FileText, Mail, ShoppingCart, Star, ShieldCheck, LogOut, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PAID_SUBSCRIPTION_STATUSES } from "@/lib/entitlements";
import AuthDialog from "@/components/AuthDialog";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import ConversionFunnelPanel from "@/components/admin/ConversionFunnelPanel";
import EventsAnalyticsPanel from "@/components/admin/EventsAnalyticsPanel";
import PlatformOverviewPanel from "@/components/admin/PlatformOverviewPanel";
import PwaAnalyticsPanel from "@/components/admin/PwaAnalyticsPanel";
import TikTokAdsPanel from "@/components/admin/TikTokAdsPanel";
import UsersTab from "@/components/admin/UsersTab";
import SkynnReviewsTab from "@/components/admin/SkynnReviewsTab";
import PriceMatchesPanel from "@/components/admin/PriceMatchesPanel";
import ReviewPricesPanel from "@/components/admin/ReviewPricesPanel";
import LeadsTab from "@/components/admin/LeadsTab";
import AnalysisPassesTab from "@/components/admin/AnalysisPassesTab";
import PairNoteCoverageCard from "@/components/admin/PairNoteCoverageCard";
import NotificationsTab from "@/components/admin/notifications/NotificationsTab";
import ModerationTab from "@/components/admin/ModerationTab";

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
  consultation_waitlist?: boolean;
  digest_status?: "none" | "pending" | "confirmed" | "unsubscribed";
  digest_source?: string | null;
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

// Skincare intelligence database — data quality queue (see supabase/SCHEMA.md).
// Only rows still unverified/partially_verified are fetched; "deprecated" rows
// are intentionally retired and don't belong in a re-verification queue.
type DataQualityStatus = "unverified" | "partially_verified" | "verified" | "deprecated";

type IntelBrand = {
  id: string;
  name: string;
  slug: string;
  verification_status: DataQualityStatus;
  created_at: string;
};

type IntelIngredient = {
  id: string;
  inci_name: string;
  common_name: string | null;
  slug: string;
  verification_status: DataQualityStatus;
  created_at: string;
};

type IntelProduct = {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  verification_status: DataQualityStatus;
  is_discontinued: boolean;
  created_at: string;
};

type IntelInteraction = {
  id: string;
  interaction_type: string;
  explanation: string | null;
  ingredient_a_id: string;
  ingredient_b_id: string;
  verification_status: DataQualityStatus;
};

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  // Admin sign-in is a second instance of the regular Supabase auth UI. Access is decided only
  // by the admin role (has_role) on whichever account signs in, not by a fixed email/password.
  const [authOpen, setAuthOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("submissions");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  // Moderators get the Moderation tab only (the community RPCs re-check the role server-side).
  const [isModerator, setIsModerator] = useState(false);

  // Data states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [premiumMemberCount, setPremiumMemberCount] = useState(0);
  // The lists below are capped at 200 rows; these are the real table totals.
  const [totals, setTotals] = useState({ submissions: 0, waitlist: 0, subscribers: 0, preorders: 0 });
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filter, setFilter] = useState("all");

  // Skincare intelligence data quality queue
  const [intelBrands, setIntelBrands] = useState<IntelBrand[]>([]);
  const [intelIngredients, setIntelIngredients] = useState<IntelIngredient[]>([]);
  const [intelProducts, setIntelProducts] = useState<IntelProduct[]>([]);
  const [intelInteractions, setIntelInteractions] = useState<IntelInteraction[]>([]);
  const [brandNames, setBrandNames] = useState<Record<string, string>>({});
  const [ingredientNames, setIngredientNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) checkAdmin();
    // A signed-out visitor never runs checkAdmin(), so resolve both flags here or the page
    // would spin on "Checking access" instead of reaching the sign-in state below.
    else if (!authLoading) {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user, authLoading]);

  const checkAdmin = async () => {
    const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
    if (!data) {
      const { data: mod } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "moderator" });
      setIsModerator(!!mod);
    }
    setIsAdmin(!!data);
    if (data) fetchAllData();
    else setLoading(false);
  };

  const fetchAllData = async () => {
    setLoading(true);
    const [subRes, waitRes, newsRes, preRes, premiumCountRes, brandsQCRes, ingredientsQCRes, productsQCRes, interactionsQCRes] = await Promise.all([
      // Bounded like the Data Quality queue below -- these are queues an admin
      // works through in recency order, not a full-table export, so a limit
      // keeps this page load bounded as each table grows.
      supabase.from("skincare_recommendations").select("id,user_id,created_at,recommendation,skin_type,concerns,contact_name,email_sent_to,contact_whatsapp,status,book_consultation,age_range,lifestyle,environment", { count: "exact" }).order("created_at", { ascending: false }).limit(200),
      supabase.from("openhaus_waitlist").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(200),
      supabase.from("newsletter_subscribers").select("id,email,subscribed_at,is_active,consultation_waitlist,digest_status,digest_source", { count: "exact" }).order("subscribed_at", { ascending: false }).limit(200),
      supabase.from("preorders").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(200),
      // Count-only (head: true fetches zero rows) — the full user directory now
      // lives behind admin_search_profiles via the Users tab, never a bare
      // `profiles.select("*")` dump into the browser.
      supabase.from("profiles").select("id", { count: "exact", head: true }).in("subscription_status", PAID_SUBSCRIPTION_STATUSES as unknown as string[]),
      supabase.from("brands").select("id,name,slug,verification_status,created_at").in("verification_status", ["unverified", "partially_verified"]).order("created_at", { ascending: false }).limit(100),
      supabase.from("ingredients").select("id,inci_name,common_name,slug,verification_status,created_at").in("verification_status", ["unverified", "partially_verified"]).order("created_at", { ascending: false }).limit(100),
      supabase.from("products").select("id,name,slug,brand_id,verification_status,is_discontinued,created_at").in("verification_status", ["unverified", "partially_verified"]).order("created_at", { ascending: false }).limit(100),
      supabase.from("ingredient_interactions").select("id,interaction_type,explanation,ingredient_a_id,ingredient_b_id,verification_status").in("verification_status", ["unverified", "partially_verified"]).limit(100),
    ]);
    const failed = [subRes, waitRes, newsRes, preRes, premiumCountRes, brandsQCRes, ingredientsQCRes, productsQCRes, interactionsQCRes].filter((x) => x.error);
    if (failed.length > 0) toast.error(`Some admin data failed to load (${failed.length} of 9 queries): ${failed[0].error?.message ?? "unknown error"}`);
    setTotals({ submissions: subRes.count ?? 0, waitlist: waitRes.count ?? 0, subscribers: newsRes.count ?? 0, preorders: preRes.count ?? 0 });
    setSubmissions((subRes.data as Submission[]) || []);
    setWaitlist((waitRes.data as WaitlistEntry[]) || []);
    setSubscribers((newsRes.data as Subscriber[]) || []);
    setPreorders((preRes.data as Preorder[]) || []);
    setPremiumMemberCount(premiumCountRes.count ?? 0);
    setIntelBrands((brandsQCRes.data as IntelBrand[]) || []);
    setIntelIngredients((ingredientsQCRes.data as IntelIngredient[]) || []);
    setIntelProducts((productsQCRes.data as IntelProduct[]) || []);
    setIntelInteractions((interactionsQCRes.data as IntelInteraction[]) || []);
    // Look names up only for ids the queues reference (a full-table read would silently stop at the 1,000-row API cap).
    const brandIds = [...new Set(((productsQCRes.data as IntelProduct[]) || []).map((p) => p.brand_id))];
    const ingredientIds = [...new Set(((interactionsQCRes.data as IntelInteraction[]) || []).flatMap((i) => [i.ingredient_a_id, i.ingredient_b_id]))];
    const [brandMapRes, ingredientMapRes] = await Promise.all([
      brandIds.length ? supabase.from("brands").select("id,name").in("id", brandIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      ingredientIds.length ? supabase.from("ingredients").select("id,inci_name,common_name").in("id", ingredientIds) : Promise.resolve({ data: [] as { id: string; inci_name: string; common_name: string | null }[] }),
    ]);
    setBrandNames(Object.fromEntries(((brandMapRes.data as { id: string; name: string }[]) || []).map((b) => [b.id, b.name])));
    setIngredientNames(
      Object.fromEntries(
        ((ingredientMapRes.data as { id: string; inci_name: string; common_name: string | null }[]) || []).map((i) => [
          i.id,
          i.common_name || i.inci_name,
        ]),
      ),
    );
    setLoading(false);
  };

  const verifyRecord = async (table: "products" | "brands" | "ingredients" | "ingredient_interactions", id: string) => {
    const { error } = await supabase
      .from(table)
      .update({ verification_status: "verified", verified_by: user!.id, last_verified_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Failed to verify record"); return; }
    toast.success("Marked verified");
    if (table === "brands") setIntelBrands((prev) => prev.filter((b) => b.id !== id));
    if (table === "ingredients") setIntelIngredients((prev) => prev.filter((i) => i.id !== id));
    if (table === "products") setIntelProducts((prev) => prev.filter((p) => p.id !== id));
    if (table === "ingredient_interactions") setIntelInteractions((prev) => prev.filter((i) => i.id !== id));
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

  if (user && !isAdmin && isModerator) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Moderation | SkinLabs®</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Header />
        <main className="container mx-auto max-w-5xl px-4 pb-24 pt-24">
          <h1 className="mb-6 font-heading text-2xl font-bold">Community moderation</h1>
          <ModerationTab />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Admin Sign In | SkinLabs®</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Header />
        <main className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-sm px-4 text-center">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground mb-2">{user ? "Access Denied" : "Admin sign in"}</h1>
            <p className="text-muted-foreground mb-6">
              {user
                ? "This SkinLabs® account doesn't hold the admin role. Sign out and use an admin account."
                : "Sign in with your SkinLabs® admin account to continue."}
            </p>
            {user ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void signOut()}>
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            ) : (
              <Button onClick={() => setAuthOpen(true)}>Sign in</Button>
            )}
          </div>
        </main>
        <Footer />
        {!user && (
          <AuthDialog
            open={authOpen}
            onOpenChange={setAuthOpen}
            mode="signin"
            onModeChange={() => {}}
            returnTo="/admin"
          />
        )}
      </div>
    );
  }

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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground mb-8">Manage submissions, waitlist, subscribers & pre-orders</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => void signOut()}>
                <LogOut className="h-3.5 w-3.5" /> Log out
              </Button>
            </div>

            {/* Overview Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "AI Submissions", value: totals.submissions, icon: FileText, color: "text-primary" },
                { label: "Waitlist", value: totals.waitlist, icon: Users, color: "text-primary" },
                { label: "Newsletter", value: totals.subscribers, icon: Mail, color: "text-primary" },
                { label: "Pre-Orders", value: totals.preorders, icon: ShoppingCart, color: "text-primary" },
                { label: "Premium Members", value: premiumMemberCount, icon: Star, color: "text-primary" },
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
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="dataquality">Data Quality ({intelBrands.length + intelIngredients.length + intelProducts.length + intelInteractions.length})</TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
                <TabsTrigger value="skynn-reviews">SKYNN Reviews</TabsTrigger>
                <TabsTrigger value="sa-prices">SA Prices</TabsTrigger>
                <TabsTrigger value="leads">Leads</TabsTrigger>
                <TabsTrigger value="analysis-passes">Analysis Passes</TabsTrigger>
                <TabsTrigger value="ads">Ads</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
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
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(sub.subscribed_at).toLocaleDateString()}
                              {sub.digest_source ? ` · via ${sub.digest_source}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sub.consultation_waitlist && <Badge variant="secondary">Consult waitlist</Badge>}
                            {sub.digest_status && sub.digest_status !== "none" && (
                              <Badge variant={sub.digest_status === "confirmed" ? "default" : "secondary"}>
                                Digest: {sub.digest_status}
                              </Badge>
                            )}
                          </div>
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

              {/* Users Tab — search/paginated directory, role management, entitlement
                  overrides. See src/components/admin/UsersTab.tsx and the
                  admin_search_profiles/admin_set_user_role/admin_override_entitlement
                  RPCs (supabase/migrations/20260921130000_admin_user_management.sql). */}
              <TabsContent value="users">
                <UsersTab />
              </TabsContent>

              {/* Data Quality Tab — skincare intelligence database verification queue (supabase/SCHEMA.md) */}
              <TabsContent value="dataquality">
                <PairNoteCoverageCard />
                <p className="text-sm text-muted-foreground mb-4">
                  Brands, ingredients and products imported from editorial content start as <Badge variant="secondary" className="mx-1">unverified</Badge>
                  until a human confirms them against a primary source. Mark verified only once you've checked it.
                </p>
                <div className="space-y-8">
                  <section>
                    <h3 className="font-medium text-card-foreground mb-3">Brands ({intelBrands.length})</h3>
                    {intelBrands.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing pending verification.</p>
                    ) : (
                      <div className="space-y-2">
                        {intelBrands.map((b) => (
                          <Card key={b.id}>
                            <CardContent className="p-3 flex items-center gap-3 justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-card-foreground">{b.name}</span>
                                <Badge variant="secondary" className="text-xs">{b.verification_status}</Badge>
                              </div>
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => verifyRecord("brands", b.id)}>
                                <ShieldCheck className="h-4 w-4" /> Mark Verified
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="font-medium text-card-foreground mb-3">Ingredients ({intelIngredients.length})</h3>
                    {intelIngredients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing pending verification.</p>
                    ) : (
                      <div className="space-y-2">
                        {intelIngredients.map((i) => (
                          <Card key={i.id}>
                            <CardContent className="p-3 flex items-center gap-3 justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-card-foreground">{i.common_name || i.inci_name}</span>
                                {i.common_name && <span className="text-xs text-muted-foreground">{i.inci_name}</span>}
                                <Badge variant="secondary" className="text-xs">{i.verification_status}</Badge>
                              </div>
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => verifyRecord("ingredients", i.id)}>
                                <ShieldCheck className="h-4 w-4" /> Mark Verified
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="font-medium text-card-foreground mb-3">Products ({intelProducts.length})</h3>
                    {intelProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing pending verification.</p>
                    ) : (
                      <div className="space-y-2">
                        {intelProducts.map((p) => (
                          <Card key={p.id}>
                            <CardContent className="p-3 flex items-center gap-3 justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-card-foreground">{brandNames[p.brand_id] || "Unknown brand"} — {p.name}</span>
                                <Badge variant="secondary" className="text-xs">{p.verification_status}</Badge>
                                {p.is_discontinued && <Badge variant="outline" className="text-xs">Discontinued</Badge>}
                              </div>
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => verifyRecord("products", p.id)}>
                                <ShieldCheck className="h-4 w-4" /> Mark Verified
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="font-medium text-card-foreground mb-3">Ingredient Interactions ({intelInteractions.length})</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Conflict/synergy pairs feeding the public Combination Checker and the Insider/VIP Active
                      Ingredient Conflict Matcher — these drive real safety guidance shown to members, so verify
                      the cited source before marking verified.
                    </p>
                    {intelInteractions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing pending verification.</p>
                    ) : (
                      <div className="space-y-2">
                        {intelInteractions.map((r) => (
                          <Card key={r.id}>
                            <CardContent className="p-3 flex items-center gap-3 justify-between">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-card-foreground">
                                    {ingredientNames[r.ingredient_a_id] || "Unknown"} + {ingredientNames[r.ingredient_b_id] || "Unknown"}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">{r.interaction_type.replace(/_/g, " ")}</Badge>
                                  <Badge variant="secondary" className="text-xs">{r.verification_status}</Badge>
                                </div>
                                {r.explanation && <p className="text-xs text-muted-foreground max-w-xl">{r.explanation}</p>}
                              </div>
                              <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => verifyRecord("ingredient_interactions", r.id)}>
                                <ShieldCheck className="h-4 w-4" /> Mark Verified
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </TabsContent>

              {/* Analytics Tab — live Vercel Web Analytics, see api/admin-analytics.ts */}
              <TabsContent value="skynn-reviews">
                <SkynnReviewsTab />
              </TabsContent>

              <TabsContent value="leads">
                <LeadsTab />
              </TabsContent>

              {/* Analysis Passes — manual, no-payment issuing by email. See AnalysisPassesTab and
                  supabase/migrations/20261004110000_admin_issue_analysis_passes.sql. */}
              <TabsContent value="analysis-passes">
                <AnalysisPassesTab />
              </TabsContent>

              {/* Ads — TikTok pixel + Events API delivery log. See TikTokAdsPanel, docs/tiktok-pixel.md
                  and supabase/migrations/20261004120000_tiktok_event_log.sql. */}
              <TabsContent value="ads">
                <TikTokAdsPanel />
              </TabsContent>

              {/* Notifications — the notification engine's admin RPCs only. See components/admin/notifications. */}
              <TabsContent value="notifications">
                <NotificationsTab />
              </TabsContent>

              {/* Moderation — Community Forum reports, spam-held content, blocked terms and the action log. See components/admin/ModerationTab. */}
              <TabsContent value="moderation">
                <ModerationTab />
              </TabsContent>

              <TabsContent value="sa-prices" className="space-y-8">
                <ReviewPricesPanel />
                <PriceMatchesPanel />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <ConversionFunnelPanel />
                <PlatformOverviewPanel />
                <PwaAnalyticsPanel />
                <EventsAnalyticsPanel />
                <AnalyticsTab />
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
