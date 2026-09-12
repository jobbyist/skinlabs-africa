import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import Preloader from "./components/Preloader";
import { PodcastPlayerProvider } from "./components/PodcastPlayer";
import ScrollToTop from "./components/ScrollToTop";
import FloatingBottomNav from "./components/FloatingBottomNav";
import CookieConsent from "./components/CookieConsent";
import SitewideSEO from "./components/SitewideSEO";

const NotFound = lazy(() => import("./pages/NotFound"));
const Products = lazy(() => import("./pages/Products"));
const AIFormulator = lazy(() => import("./pages/AIFormulator"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Business = lazy(() => import("./pages/Business"));
const Partners = lazy(() => import("./pages/Partners"));
const BrandAmbassadors = lazy(() => import("./pages/BrandAmbassadors"));
const KnowledgeHub = lazy(() => import("./pages/KnowledgeHub"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const EditorialPolicy = lazy(() => import("./pages/EditorialPolicy"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const Whitepaper = lazy(() => import("./pages/Whitepaper"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Openhaus = lazy(() => import("./pages/Openhaus"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const PodcastPage = lazy(() => import("./pages/PodcastPage"));
const EpisodePage = lazy(() => import("./pages/EpisodePage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Newsroom = lazy(() => import("./pages/Newsroom"));
const NewsroomArticle = lazy(() => import("./pages/NewsroomArticle"));
const Reviews = lazy(() => import("./pages/Reviews"));
const ProductReview = lazy(() => import("./pages/ProductReview"));
const ComparisonArticle = lazy(() => import("./pages/ComparisonArticle"));
const Compare = lazy(() => import("./pages/Compare"));
const Spotlight = lazy(() => import("./pages/Spotlight"));
const SpotlightMethodology = lazy(() => import("./pages/SpotlightMethodology"));
const SpotlightArchive = lazy(() => import("./pages/SpotlightArchive"));
const SpotlightBrandProfile = lazy(() => import("./pages/SpotlightBrandProfile"));
const Seasonals = lazy(() => import("./pages/Seasonals"));
const SeasonalHub = lazy(() => import("./pages/SeasonalHub"));
const Consultations = lazy(() => import("./pages/Consultations"));
const DermatologistDirectory = lazy(() => import("./pages/DermatologistDirectory"));
const Announcements = lazy(() => import("./pages/Announcements"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const MarketplaceLanding = lazy(() => import("./pages/marketplace/MarketplaceLanding"));
const MarketplaceProductDetail = lazy(() => import("./pages/marketplace/MarketplaceProductDetail"));

const queryClient = new QueryClient();
const LegacyStreamRedirect = () => { const { slug } = useParams(); return <Navigate to={`/podcast/${slug}`} replace />; };
const LegacyNewsroomArticleRedirect = () => { const { slug } = useParams(); return <Navigate to={`/briefings/${slug}`} replace />; };
const RouteFallback = () => (<div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>);

const AppContent = () => (
  <>
    <Preloader />
    <ScrollToTop />
    <FloatingBottomNav />
    <CookieConsent />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/get-started" element={<Navigate to="/pricing" replace />} />
        <Route path="/products" element={<Products />} />
        <Route path="/skynn-ai" element={<AIFormulator />} />
        <Route path="/ai-formulator" element={<Navigate to="/skynn-ai" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/business" element={<Business />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/brand-ambassadors" element={<BrandAmbassadors />} />
        <Route path="/brand-ambassadors/apply" element={<BrandAmbassadors />} />
        <Route path="/our-science" element={<Navigate to="/about#science" replace />} />
        <Route path="/sustainability" element={<Navigate to="/about#sustainability" replace />} />
        <Route path="/knowledge-hub" element={<KnowledgeHub />} />
        <Route path="/knowledge-hub/:slug" element={<KnowledgeHub />} />
        <Route path="/faq" element={<Navigate to="/knowledge-hub" replace />} />
        <Route path="/devices" element={<Navigate to="/" replace />} />
        <Route path="/serums" element={<Navigate to="/" replace />} />
        <Route path="/custom-formulas" element={<Navigate to="/" replace />} />
        <Route path="/bundled-kits" element={<Navigate to="/" replace />} />
        <Route path="/gift-sets" element={<Navigate to="/" replace />} />
        <Route path="/shipping" element={<Navigate to="/knowledge-hub" replace />} />
        <Route path="/returns" element={<Navigate to="/refund-policy" replace />} />
        <Route path="/track-order" element={<Navigate to="/knowledge-hub" replace />} />
        <Route path="/edible-pouches" element={<Navigate to="/" replace />} />
        <Route path="/careers" element={<Navigate to="/about" replace />} />
        <Route path="/press" element={<Navigate to="/about" replace />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/editorial-policy" element={<EditorialPolicy />} />
        <Route path="/community-guidelines" element={<CommunityGuidelines />} />
        <Route path="/whitepapers" element={<Whitepaper />} />
        <Route path="/whitepaper" element={<Navigate to="/whitepapers" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/shop" element={<Openhaus />} />
        <Route path="/routines" element={<ComingSoon />} />
        <Route path="/learn" element={<ComingSoon />} />
        <Route path="/ingredients" element={<ComingSoon />} />
        <Route path="/marketplace" element={<MarketplaceLanding />} />
        <Route path="/marketplace/product/:slug" element={<MarketplaceProductDetail />} />
        <Route path="/marketplace/brand/:slug" element={<ComingSoon />} />
        <Route path="/marketplace/concern/:slug" element={<ComingSoon />} />
        <Route path="/marketplace/brands" element={<ComingSoon />} />
        <Route path="/marketplace/categories" element={<ComingSoon />} />
        <Route path="/marketplace/saved" element={<ComingSoon />} />
        <Route path="/openhaus" element={<Navigate to="/shop" replace />} />
        <Route path="/podcast" element={<PodcastPage />} />
        <Route path="/podcast/:slug" element={<EpisodePage />} />
        <Route path="/stream" element={<Navigate to="/podcast" replace />} />
        <Route path="/stream/:slug" element={<LegacyStreamRedirect />} />
        <Route path="/briefings" element={<Newsroom />} />
        <Route path="/briefings/:slug" element={<NewsroomArticle />} />
        <Route path="/newsroom" element={<Navigate to="/briefings" replace />} />
        <Route path="/newsroom/:slug" element={<LegacyNewsroomArticleRedirect />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reviews/page/:page" element={<Reviews />} />
        <Route path="/reviews/versus/:slug" element={<ComparisonArticle />} />
        <Route path="/reviews/:slug" element={<ProductReview />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/consultations" element={<Consultations />} />
        <Route path="/consult" element={<DermatologistDirectory />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/spotlight" element={<Spotlight />} />
        <Route path="/spotlight/methodology" element={<SpotlightMethodology />} />
        <Route path="/spotlight/archive" element={<SpotlightArchive />} />
        <Route path="/spotlight/:brandSlug" element={<SpotlightBrandProfile />} />
        <Route path="/seasonals" element={<Seasonals />} />
        <Route path="/seasonals/spring" element={<SeasonalHub />} />
        <Route path="/seasonals/:season" element={<SeasonalHub />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    <SitewideSEO />
  </>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PodcastPlayerProvider>
            <AppContent />
          </PodcastPlayerProvider>
        </BrowserRouter>
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
