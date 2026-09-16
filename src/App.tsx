import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index";
import Preloader from "./components/Preloader";
import { PodcastPlayerProvider } from "./components/PodcastPlayer";
import ScrollToTop from "./components/ScrollToTop";
import FloatingBottomNav from "./components/FloatingBottomNav";
import CookieConsent from "./components/CookieConsent";
import AdBlockNotice from "./components/AdBlockNotice";
import SitewideSEO from "./components/SitewideSEO";
import { CartProvider } from "./contexts/CartContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";

const NotFound = lazy(() => import("./pages/NotFound"));
const AIFormulator = lazy(() => import("./pages/AIFormulator"));
const QuoteSSBeauty = lazy(() => import("./pages/QuoteSSBeauty"));
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
const AdvertisingPolicy = lazy(() => import("./pages/AdvertisingPolicy"));
const CorrectionsRemovals = lazy(() => import("./pages/CorrectionsRemovals"));
const EditorialPolicy = lazy(() => import("./pages/EditorialPolicy"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const Whitepaper = lazy(() => import("./pages/Whitepaper"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Openhaus = lazy(() => import("./pages/Openhaus"));
const SmartRoutines = lazy(() => import("./pages/SmartRoutines"));
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
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
import { MarketplaceGate } from "./components/marketplace/MarketplaceGate";
const MarketplaceLanding = lazy(() => import("./pages/marketplace/MarketplaceLanding"));
const MarketplaceProductDetail = lazy(() => import("./pages/marketplace/MarketplaceProductDetail"));
const MarketplaceBrandPage = lazy(() => import("./pages/marketplace/MarketplaceBrandPage"));
const MarketplaceBrandsPage = lazy(() => import("./pages/marketplace/MarketplaceBrandsPage"));
const MarketplaceConcernPage = lazy(() => import("./pages/marketplace/MarketplaceConcernPage"));
const MarketplaceCategoriesPage = lazy(() => import("./pages/marketplace/MarketplaceCategoriesPage"));
const MarketplaceValuesPage = lazy(() => import("./pages/marketplace/MarketplaceValuesPage"));
const MarketplaceSkinTonePage = lazy(() => import("./pages/marketplace/MarketplaceSkinTonePage"));
const MarketplaceSavedPage = lazy(() => import("./pages/marketplace/MarketplaceSavedPage"));
const MarketplaceShippingReturns = lazy(() => import("./pages/marketplace/MarketplaceShippingReturns"));
const MarketplaceTerms = lazy(() => import("./pages/marketplace/MarketplaceTerms"));
const Ingredients = lazy(() => import("./pages/Ingredients"));
const IngredientDetail = lazy(() => import("./pages/IngredientDetail"));
const IngredientChecker = lazy(() => import("./pages/IngredientChecker"));

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
    <AdBlockNotice />
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
    <SitewideSEO />
  </>
);

const App = () => (
  // attribute="class" matches tailwind.config.ts's darkMode: ["class"] and index.css's
  // .dark selector. defaultTheme="system" + enableSystem (both next-themes defaults,
  // spelled out here so the intent survives a future refactor) means visitors get the
  // OS/browser's prefers-color-scheme automatically; ThemeToggle.tsx lets them override
  // it, and that explicit choice then wins over the OS setting via localStorage.
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
);

export default App;
