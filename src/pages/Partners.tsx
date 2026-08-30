import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PartnerHero from "@/components/partners/PartnerHero";
import PartnerBenefits from "@/components/partners/PartnerBenefits";
import PartnershipModels from "@/components/partners/PartnershipModels";
import PartnershipComparison from "@/components/partners/PartnershipComparison";
import PartnerProcess from "@/components/partners/PartnerProcess";
import PartnerTypes from "@/components/partners/PartnerTypes";
import PartnershipPrinciples from "@/components/partners/PartnershipPrinciples";
import PartnerEnquiryForm from "@/components/partners/PartnerEnquiryForm";
import CalendlyBooking from "@/components/partners/CalendlyBooking";
import PartnerFAQ from "@/components/partners/PartnerFAQ";
import PartnerCTA from "@/components/partners/PartnerCTA";
import { partnerFaqs, type PartnershipModel } from "@/data/partnerPrograms";

const SITE = "https://skinlabs.co.za";

const Partners = () => {
  const [selectedModel, setSelectedModel] = useState<PartnershipModel["id"] | null>(null);

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBookCall = () => scrollToId("book-a-call");

  const handleExploreModels = () => scrollToId("partnership-models");

  const handleSelectModel = (modelId: PartnershipModel["id"]) => {
    setSelectedModel(modelId);
    handleBookCall();
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "SkinLabs®",
      url: SITE,
      logo: `${SITE}/favicon.svg`,
      sameAs: ["https://instagram.com/skinlabsza", "http://facebook.com/skinlabs.co.za/", "https://tiktok.com/@skinlabsza"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "SkinLabs® Partner Program",
      url: `${SITE}/partners`,
      description:
        "Partner with SkinLabs® through affiliate, editorial or strategic commerce partnerships designed to connect skincare brands, retailers and professionals with consumers.",
      isPartOf: { "@type": "WebSite", name: "SkinLabs®", url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Partner Program", item: `${SITE}/partners` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: partnerFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <>
      <Helmet>
        <title>SkinLabs® Partner Program | Skincare Brand & Commerce Partnerships</title>
        <meta
          name="description"
          content="Partner with SkinLabs® through affiliate, editorial or strategic commerce partnerships designed to connect skincare brands, retailers and professionals with consumers."
        />
        <link rel="canonical" href={`${SITE}/partners`} />
        <meta property="og:title" content="SkinLabs® Partner Program" />
        <meta
          property="og:description"
          content="Affiliate, editorial and strategic commerce partnerships for skincare brands, retailers, clinics and distributors — built around SkinLabs®' independent discovery ecosystem."
        />
        <meta property="og:url" content={`${SITE}/partners`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SkinLabs® Partner Program" />
        <meta
          name="twitter:description"
          content="Partner with SkinLabs® through affiliate, editorial or strategic commerce partnerships built for skincare brands and professionals."
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <PartnerHero onBookCall={handleBookCall} onExploreModels={handleExploreModels} />
          <PartnerBenefits />
          <PartnershipModels onSelectModel={handleSelectModel} />
          <PartnershipComparison />
          <PartnerProcess />
          <PartnerTypes />
          <PartnershipPrinciples />

          <section id="book-a-call" className="scroll-mt-20 py-20 md:py-28">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="mx-auto mb-14 max-w-2xl text-center">
                <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">
                  Let's Talk Partnership.
                </h2>
              </div>

              <div className="mx-auto mb-16 max-w-2xl">
                <PartnerEnquiryForm selectedModel={selectedModel} />
              </div>

              <CalendlyBooking />
            </div>
          </section>

          <PartnerFAQ />
          <PartnerCTA onBookCall={handleBookCall} onExploreModels={handleExploreModels} />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Partners;
