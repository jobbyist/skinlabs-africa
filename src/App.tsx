import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GetStarted from "./pages/GetStarted";
import Products from "./pages/Products";
import AIFormulator from "./pages/AIFormulator";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Devices from "./pages/Devices";
import Serums from "./pages/Serums";
import CustomFormulas from "./pages/CustomFormulas";
import GiftSets from "./pages/GiftSets";
import OurScience from "./pages/OurScience";
import Sustainability from "./pages/Sustainability";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import TrackOrder from "./pages/TrackOrder";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import AdminDashboard from "./pages/AdminDashboard";
import Openhaus from "./pages/Openhaus";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/get-started" element={<GetStarted />} />
            
            {/* Header Navigation Routes */}
            <Route path="/products" element={<Products />} />
            <Route path="/ai-formulator" element={<AIFormulator />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Shop Routes */}
            <Route path="/devices" element={<Devices />} />
            <Route path="/serums" element={<Serums />} />
            <Route path="/custom-formulas" element={<CustomFormulas />} />
            <Route path="/gift-sets" element={<GiftSets />} />
            
            {/* Company Routes */}
            <Route path="/our-science" element={<OurScience />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/press" element={<Press />} />
            
            {/* Support Routes */}
            <Route path="/faq" element={<FAQ />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/track-order" element={<TrackOrder />} />
            
            {/* Legal Routes */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            
            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* OPENHAUS Coming Soon */}
            <Route path="/openhaus" element={<Openhaus />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
