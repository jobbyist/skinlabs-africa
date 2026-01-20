import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  Loader2,
  ArrowLeft,
  Crown,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Recommendation {
  id: string;
  skin_type: string;
  concerns: string[];
  age_range: string | null;
  lifestyle: string | null;
  environment: string | null;
  recommendation: string;
  email_sent_to: string | null;
  created_at: string;
}

interface Profile {
  subscription_status: string;
  subscription_started_at: string | null;
  full_name: string | null;
  email: string | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const totalMilestones = 5;
  const journeyProgress = Math.min((recommendations.length / totalMilestones) * 100, 100);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch recommendations
      const { data: recsData, error: recsError } = await supabase
        .from('skincare_recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (recsError) throw recsError;
      setRecommendations(recsData || []);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_started_at, full_name, email')
        .eq('user_id', user!.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Profile error:", profileError);
      }
      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load your data");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecommendation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('skincare_recommendations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecommendations(prev => prev.filter(r => r.id !== id));
      if (selectedRecommendation?.id === id) {
        setSelectedRecommendation(null);
      }
      toast.success("Recommendation deleted");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete recommendation");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRecommendation = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('##') || line.startsWith('**')) {
        return (
          <h4 key={index} className="font-semibold text-card-foreground mt-4 mb-2 text-lg">
            {line.replace(/[#*]/g, '').trim()}
          </h4>
        );
      }
      if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
        return (
          <p key={index} className="text-muted-foreground ml-4 mb-1 flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{line.trim().replace(/^[-\d.]+\s*/, '')}</span>
          </p>
        );
      }
      if (line.trim()) {
        return (
          <p key={index} className="text-muted-foreground mb-2">
            {line}
          </p>
        );
      }
      return null;
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Skincare Dashboard | SKINLABS</title>
        <meta name="description" content="View your personalized AI skincare recommendations and track your skincare journey." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Button variant="ghost" className="mb-6 gap-2" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
              My Skincare Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your skincare journey and view your personalized AI recommendations.
            </p>
          </div>

          {/* Subscription Status */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Subscription Status</CardTitle>
                    <CardDescription>
                      {profile?.email || user?.email}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={profile?.subscription_status === 'active' ? 'default' : 'secondary'}>
                  {profile?.subscription_status === 'active' ? 'Active' : 'Free Plan'}
                </Badge>
              </div>
            </CardHeader>
            {profile?.subscription_started_at && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Member since {formatDate(profile.subscription_started_at)}
                </p>
              </CardContent>
            )}
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle>Skincare Journey Tracker</CardTitle>
                  <CardDescription>
                    {recommendations.length === 0
                      ? "Start your first routine to begin tracking progress."
                      : `You have ${recommendations.length} AI routines logged.`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Journey milestones</span>
                  <span>{Math.min(recommendations.length, totalMilestones)} / {totalMilestones}</span>
                </div>
                <Progress value={journeyProgress} className="h-2" />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Latest routine</p>
                  <p className="font-medium text-card-foreground">
                    {recommendations[0] ? formatDate(recommendations[0].created_at) : "Not yet"}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Email delivery</p>
                  <p className="font-medium text-card-foreground">
                    {profile?.email || user?.email || "Add on next subscription"}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-muted-foreground">Next check-in</p>
                  <p className="font-medium text-card-foreground">
                    {recommendations[0]
                      ? `${new Date(new Date(recommendations[0].created_at).getTime() + 1000 * 60 * 60 * 24 * 30).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`
                      : "After your first routine"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recommendations List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-heading font-semibold text-foreground">
                My Recommendations ({recommendations.length})
              </h2>
              
              {recommendations.length === 0 ? (
                <Card className="p-6 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No recommendations yet</p>
                  <Button asChild>
                    <Link to="/ai-formulator">
                      Get Your First Routine
                    </Link>
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <Card
                      key={rec.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        selectedRecommendation?.id === rec.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedRecommendation(rec)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {rec.skin_type}
                              </Badge>
                              {rec.email_sent_to && (
                                <Mail className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {rec.concerns.slice(0, 2).map((concern) => (
                                <span key={concern} className="text-xs text-muted-foreground">
                                  {concern}
                                </span>
                              ))}
                              {rec.concerns.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{rec.concerns.length - 2}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(rec.created_at)}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Recommendation Detail */}
            <div className="lg:col-span-2">
              {selectedRecommendation ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Skincare Routine
                        </CardTitle>
                        <CardDescription>
                          Created on {formatDate(selectedRecommendation.created_at)}
                        </CardDescription>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Recommendation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this skincare recommendation? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteRecommendation(selectedRecommendation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Skin Profile Summary */}
                    <div className="bg-secondary/30 rounded-xl p-4 mb-6">
                      <h4 className="font-medium text-card-foreground mb-3">Your Skin Profile</h4>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Skin Type: </span>
                          <span className="text-card-foreground capitalize">{selectedRecommendation.skin_type}</span>
                        </div>
                        {selectedRecommendation.age_range && (
                          <div>
                            <span className="text-muted-foreground">Age: </span>
                            <span className="text-card-foreground">{selectedRecommendation.age_range}</span>
                          </div>
                        )}
                        {selectedRecommendation.lifestyle && (
                          <div>
                            <span className="text-muted-foreground">Lifestyle: </span>
                            <span className="text-card-foreground capitalize">{selectedRecommendation.lifestyle}</span>
                          </div>
                        )}
                        {selectedRecommendation.environment && (
                          <div>
                            <span className="text-muted-foreground">Environment: </span>
                            <span className="text-card-foreground capitalize">{selectedRecommendation.environment}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedRecommendation.concerns.map((concern) => (
                          <Badge key={concern} variant="secondary" className="text-xs">
                            {concern}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Recommendation Content */}
                    <div className="prose prose-sm max-w-none">
                      {formatRecommendation(selectedRecommendation.recommendation)}
                    </div>

                    {/* CTA */}
                    <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20 text-center">
                      <h4 className="font-medium text-card-foreground mb-2">
                        Ready to start your routine?
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Shop our recommended products to achieve your best skin.
                      </p>
                      <Button asChild>
                        <Link to="/products">
                          Shop Recommended Products
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center p-12">
                  <div className="text-center">
                    <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-card-foreground mb-2">
                      Select a Recommendation
                    </h3>
                    <p className="text-muted-foreground">
                      Click on a recommendation from the list to view the full details.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Dashboard;
