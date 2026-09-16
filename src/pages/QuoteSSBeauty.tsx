import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuoteSSBeautyForm from "@/components/quote-ss-beauty/QuoteSSBeautyForm";

/**
 * Temporary, unlisted quote-request form for a single Business Suite client
 * (Siphokazi / SS Beauty). Not linked from nav/sitemap — noindex'd, and
 * meant to be deleted (this page, its route, the quote-ss-beauty-submit
 * edge function, and the quote_ss_beauty_requests table) once her quote is
 * handled. See CLAUDE.md for the full teardown checklist.
 */
const QuoteSSBeauty = () => {
  return (
    <>
      <Helmet>
        <title>Business Suite Quote Request | SkinLabs®</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4">
            <QuoteSSBeautyForm />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default QuoteSSBeauty;
