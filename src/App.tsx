import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/chunkRecovery";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate, useLocation } from "react-router-dom";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { useDeploymentSkewGuard } from "./hooks/use-deployment-skew-guard";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index";
// Lazy: pulls in framer-motion + embla-carousel, which otherwise ship in the
// main bundle on every route (privacy-policy, terms, etc. included) even
// though the splash/gate it renders only matters on a fresh session's first
// paint. Deferring it costs nothing visually — the overlay wasn't part of
// the pre-hydration HTML anyway.
const Preloader = lazyWithRetry(() => import("./components/Preloader"));
import { PodcastPlayerProvider } from "./components/PodcastPlayer";
import ScrollToTop from "./components/ScrollToTop";
import FloatingBottomNav from "./components/FloatingBottomNav";
import CookieConsent from "./components/CookieConsent";
import AdBlockNotice from "./components/AdBlockNotice";
import SitewideSEO from "./components/SitewideSEO";
import { CartProvider } from "./contexts/CartContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";

const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const AIFormulator = lazyWithRetry(() => import("./pages/AIFormulator"));
const QuoteSSBeauty = lazyWithRetry(() => import("./pages/QuoteSSBeauty"));
const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Business = lazyWithRetry(() => import("./pages/Business"));
const Partners = lazyWithRetry(() => import("./pages/Partners"));
const BrandAmbassadors = lazyWithRetry(() => import("./pages/BrandAmbassadors"));
const KnowledgeHub = lazyWithRetry(() => import("./pages/KnowledgeHub"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const CookiePolicy = lazyWithRetry(() => import("./pages/CookiePolicy"));
const RefundPolicy = lazyWithRetry(() => import("./pages/RefundPolicy"));
const AdvertisingPolicy = lazyWithRetry(() => import("./pages/AdvertisingPolicy"));
const CorrectionsRemovals = lazyWithRetry(() => import("./pages/CorrectionsRemovals"));
const EditorialPolicy = lazyWithRetry(() => import("./pages/EditorialPolicy"));
const CommunityGuidelines = lazyWithRetry(() => import("./pages/CommunityGuidelines"));
const Whitepaper = lazyWithRetry(() => import("./pages/Whitepaper"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const Openhaus = lazyWithRetry(() => import("./pages/Openhaus"));
const SmartRoutines = lazyWithRetry(() => import("./pages/SmartRoutines"));
const ComingSoon = lazyWithRetry(() => import("./pages/ComingSoon"));
const PodcastPage = lazyWithRetry(() => import("./pages/PodcastPage"));
const EpisodePage = lazyWithRetry(() => import("./pages/EpisodePage"));
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const Newsroom = lazyWithRetry(() => import("./pages/Newsroom"));
const NewsroomArticle = lazyWithRetry(() => import("./pages/NewsroomArticle"));
const Reviews = lazyWithRetry(() => import("./pages/Reviews"));
const ProductReview = lazyWithRetry(() => import("./pages/ProductReview"));
const ComparisonArticle = lazyWithRetry(() => import("./pages/ComparisonArticle"));
const Compare = lazyWithRetry(() => import("./pages/Compare"));
const Spotlight = lazyWithRetry(() => import("./pages/Spotlight"));
const SpotlightMethodology = lazyWithRetry(() => import("./pages/SpotlightMethodology"));
const SpotlightArchive = lazyWithRetry(() => import("./pages/SpotlightArchive"));
const SpotlightBrandProfile = lazyWithRetry(() => import("./pages/SpotlightBrandProfile"));
const Seasonals = lazyWithRetry(() => import("./pages/Seasonals"));
const SeasonalHub = lazyWithRetry(() => import("./pages/SeasonalHub"));
const Consultations = lazyWithRetry(() => import("./pages/Consultations"));
const DermatologistDirectory = lazyWithRetry(() => import("./pages/DermatologistDirectory"));
const Announcements = lazyWithRetry(() => import("./pages/Announcements"));
const UserDashboard = lazyWithRetry(() => import("./pages/UserDashboard"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
import { MarketplaceGate } from "./components/marketplace/MarketplaceGate";
const MarketplaceLanding = lazyWithRetry(() => import("./pages/marketplace/MarketplaceLanding"));
const MarketplaceProductDetail = lazyWithRetry(() => import("./pages/marketplace/MarketplaceProductDetail"));
const MarketplaceBrandPage = lazyWithRetry(() => import("./pages/marketplace/MarketplaceBrandPage"));
const MarketplaceBrandsPage = lazyWithRetry(() => import("./pages/marketplace/MarketplaceBrandsPage"));
const MarketplaceConcernPage = lazyWithRetry(() => import("./pages/marketplace/MarketplaceConcernPage"));
const MarketplaceCategoriesPage = lazyWithRetry(() => import("./pages/marketplace/MarketplaceCategoriesPage"));
const MarketplaceValuesPage = lazyWithRetry(() => import("./pages/marketplace/MarketplaceValuesPage"));
const MarketplaceSkinTonePage = lazyWithRetry(() => import("./pages/marketplace/MarketplaceSkinTonePage"));
const MarketplaceSavedPage = lazyWithRetry(() => import("./pages/marketplace/MarketplaceSavedPage"));
const MarketplaceShippingReturns = lazyWithRetry(() => import("./pages/marketplace/MarketplaceShippingReturns"));
const MarketplaceTerms = lazyWithRetry(() => import("./pages/marketplace/MarketplaceTerms"));
const Ingredients = lazyWithRetry(() => import("./pages/Ingredients"));
const IngredientDetail = lazyWithRetry(() => import("./pages/IngredientDetail"));
const IngredientChecker = lazyWithRetry(() => import("./pages/IngredientChecker"));

// Without these, returning to a backgrounded tab refetched every query at once
// (refetchOnWindowFocus defaults to true, staleTime to 0), re-rendering most of
// the page in a burst the moment the user switched back.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
const LegacyStreamRedirect = () => { const { slug } = useParams(); return <Navigate to={`/podcast/${slug}`} replace />; };
const LegacyNewsroomArticleRedirect = () => { const { slug } = useParams(); return <Navigate to={`/briefings/${slug}`} replace />; };
const RouteFallback = () => (<div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>);

const AppContent = () => {
  const { pathname } = useLocation();
  useDeploymentSkewGuard();
  return (
    <>
      <Suspense fallback={null}>
        <Preloader />
      </Suspense>
      <ScrollToTop />
      <FloatingBottomNav />
      <CookieConsent />
      <AdBlockNotice />
      <AppErrorBoundary resetKey={pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/get-started" element={<Navigate to="/pricing" replace />} />
            <Route path="/skynn-ai" element={<AIFormulator />} />
            <Route path="/ai-formulator" element={<Navigate to="/skynn-ai" replace />} />
            <Route path="/quote-ss-beauty" element={<QuoteSSBeauty />} />
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
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/advertising-policy" element={<AdvertisingPolicy />} />
            <Route path="/corrections-removals" element={<CorrectionsRemovals />} />
            <Route path="/editorial-policy" element={<EditorialPolicy />} />
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/whitepapers" element={<Whitepaper />} />
            <Route path="/whitepaper" element={<Navigate to="/whitepapers" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/shop" element={<Openhaus />} />
            <Route path="/routines" element={<SmartRoutines />} />
            <Route path="/learn" element={<ComingSoon />} />
            <Route path="/ingredients" element={<Ingredients />} />
            <Route path="/ingredients/checker" element={<IngredientChecker />} />
            <Route path="/ingredients/:slug" element={<IngredientDetail />} />
            <Route path="/marketplace" element={<MarketplaceGate><MarketplaceLanding /></MarketplaceGate>} />
            <Route path="/marketplace/product/:slug" element={<MarketplaceGate><MarketplaceProductDetail /></MarketplaceGate>} />
            <Route path="/marketplace/brand/:slug" element={<MarketplaceGate><MarketplaceBrandPage /></MarketplaceGate>} />
            <Route path="/marketplace/concern/:slug" element={<MarketplaceGate><MarketplaceConcernPage /></MarketplaceGate>} />
            <Route path="/marketplace/values/:slug" element={<MarketplaceGate><MarketplaceValuesPage /></MarketplaceGate>} />
            <Route path="/marketplace/skin-tone/:band" element={<MarketplaceGate><MarketplaceSkinTonePage /></MarketplaceGate>} />
            <Route path="/marketplace/brands" element={<MarketplaceGate><MarketplaceBrandsPage /></MarketplaceGate>} />
            <Route path="/marketplace/categories" element={<MarketplaceGate><MarketplaceCategoriesPage /></MarketplaceGate>} />
            <Route path="/marketplace/saved" element={<MarketplaceGate><MarketplaceSavedPage /></MarketplaceGate>} />
            <Route path="/marketplace/shipping-returns" element={<MarketplaceGate><MarketplaceShippingReturns /></MarketplaceGate>} />
            <Route path="/marketplace/terms" element={<MarketplaceGate><MarketplaceTerms /></MarketplaceGate>} />
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
      <SitewideSEO />
    </>
  );
};

const App = () => (
  // attribute="class" matches tailwind.config.ts's darkMode: ["class"] and index.css's
  // .dark selector. defaultTheme="system" + enableSystem (both next-themes defaults,
  // spelled out here so the intent survives a future refactor) means visitors get the
  // OS/browser's prefers-color-scheme automatically; ThemeToggle.tsx lets them override
  // it, and that explicit choice then wins over the OS setting via localStorage.
  <AppErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true }}>
              <PodcastPlayerProvider>
                <CurrencyProvider>
                  <CartProvider>
                    <AppContent />
                  </CartProvider>
                </CurrencyProvider>
              </PodcastPlayerProvider>
            </BrowserRouter>
            <Analytics />
            <SpeedInsights />
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ThemeProvider>
  </AppErrorBoundary>
);

export default App;
