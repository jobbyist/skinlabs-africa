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

const NotFound = lazy(() => import("./pages/NotFound"));
const Products = lazy(() => import("./pages/Products"));
const AIFormulator = lazy(() => import("./pages/AIFormulator"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Devices = lazy(() => import("./pages/Devices"));
const Serums = lazy(() => import("./pages/Serums"));
const CustomFormulas = lazy(() => import("./pages/CustomFormulas"));
const BundledKits = lazy(() => import("./pages/BundledKits"));
const Business = lazy(() => import("./pages/Business"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Openhaus = lazy(() => import("./pages/Openhaus"));
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
const Announcements = lazy(() => import("./pages/Announcements"));
const EdiblePouches = lazy(() => import("./pages/EdiblePouches"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));

const queryClient = new QueryClient();

const LegacyStreamRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/podcast/${slug}`} replace />;
};

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const AppContent = () => {
  return (
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
        <Route path="/ai-formulator" element={<AIFormulator />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/devices" element={<Devices />} />
        <Route path="/serums" element={<Serums />} />
        <Route path="/custom-formulas" element={<CustomFormulas />} />
        <Route path="/bundled-kits" element={<BundledKits />} />
        <Route path="/gift-sets" element={<Navigate to="/bundled-kits" replace />} />
        <Route path="/business" element={<Business />} />

        <Route path="/our-science" element={<Navigate to="/about#science" replace />} />
        <Route path="/sustainability" element={<Navigate to="/about#sustainability" replace />} />

        <Route path="/faq" element={<FAQ />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/track-order" element={<TrackOrder />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />

        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/shop" element={<Openhaus />} />
        <Route path="/openhaus" element={<Navigate to="/shop" replace />} />

        <Route path="/podcast" element={<PodcastPage />} />
        <Route path="/podcast/:slug" element={<EpisodePage />} />
        <Route path="/stream" element={<Navigate to="/podcast" replace />} />
        <Route path="/stream/:slug" element={<LegacyStreamRedirect />} />

        <Route path="/newsroom" element={<Newsroom />} />
        <Route path="/newsroom/:slug" element={<NewsroomArticle />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reviews/page/:page" element={<Reviews />} />
        <Route path="/reviews/versus/:slug" element={<ComparisonArticle />} />
        <Route path="/reviews/:slug" element={<ProductReview />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/consultations" element={<Consultations />} />
        <Route path="/announcements" element={<Announcements />} />

        <Route path="/spotlight" element={<Spotlight />} />
        <Route path="/spotlight/methodology" element={<SpotlightMethodology />} />
        <Route path="/spotlight/archive" element={<SpotlightArchive />} />
        <Route path="/spotlight/:brandSlug" element={<SpotlightBrandProfile />} />

        <Route path="/seasonals" element={<Seasonals />} />
        <Route path="/seasonals/spring" element={<SeasonalHub />} />
        <Route path="/seasonals/:season" element={<SeasonalHub />} />

        <Route path="/edible-pouches" element={<EdiblePouches />} />

        <Route path="/dashboard" element={<UserDashboard />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

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
