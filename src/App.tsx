import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AiFormulatorPage from "./pages/AiFormulatorPage";
import ProductsPage from "./pages/ProductsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import EdibleSkincarePage from "./pages/EdibleSkincarePage";
import ShopCategoryPage from "./pages/ShopCategoryPage";
import CompanyPage from "./pages/CompanyPage";
import SupportPage from "./pages/SupportPage";
import PolicyPage from "./pages/PolicyPage";
import SocialPage from "./pages/SocialPage";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/ai-formulator" element={<AiFormulatorPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/edible-skincare" element={<EdibleSkincarePage />} />
            <Route path="/shop/:category" element={<ShopCategoryPage />} />
            <Route path="/company/:page" element={<CompanyPage />} />
            <Route path="/support/:page" element={<SupportPage />} />
            <Route path="/privacy-policy" element={<PolicyPage policyKey="privacy-policy" />} />
            <Route path="/terms-of-service" element={<PolicyPage policyKey="terms-of-service" />} />
            <Route path="/cookie-policy" element={<PolicyPage policyKey="cookie-policy" />} />
            <Route path="/social/:platform" element={<SocialPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
