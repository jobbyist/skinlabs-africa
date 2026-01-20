import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIFormulator from "@/components/AIFormulator";

const AiFormulatorPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AI Formulator | SKINLABS</title>
        <meta
          name="description"
          content="Create your personalized skincare routine with our AI-powered custom skincare formulator."
        />
      </Helmet>
      <Header />
      <main className="pt-24">
        <AIFormulator />
      </main>
      <Footer />
    </div>
  );
};

export default AiFormulatorPage;
