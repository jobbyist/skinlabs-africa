import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import BrandAmbassadorModal from "@/components/BrandAmbassadorModal";
import BAHero from "@/components/brand-ambassador/BAHero";
import BASubNav from "@/components/brand-ambassador/BASubNav";
import BAProgrammeOverview from "@/components/brand-ambassador/BAProgrammeOverview";
import BAWhoWereLookingFor from "@/components/brand-ambassador/BAWhoWereLookingFor";
import BAHowItWorks from "@/components/brand-ambassador/BAHowItWorks";
import BACommission from "@/components/brand-ambassador/BACommission";
import BATimeline from "@/components/brand-ambassador/BATimeline";
import BAPerformanceOpportunity from "@/components/brand-ambassador/BAPerformanceOpportunity";
import BAWhySkinLabs from "@/components/brand-ambassador/BAWhySkinLabs";
import BAFAQ from "@/components/brand-ambassador/BAFAQ";
import BAFinalCTA from "@/components/brand-ambassador/BAFinalCTA";
import BAStickyApplyCTA from "@/components/brand-ambassador/BAStickyApplyCTA";
import {
  BA_APPLICATIONS_CLOSE,
  BA_COMMISSION_PERCENT,
  BA_SPOTS,
  brandAmbassadorFaqs,
  getApplicationWindowStatus,
} from "@/data/brandAmbassador";
import { SITE_URL, DEFAULT_OG } from "@/lib/seo-config";
import { fetchUnsplashImage } from "@/lib/unsplash";

const APPLY_PATH = "/brand-ambassadors/apply";
const LANDING_PATH = "/brand-ambassadors";

const BrandAmbassadors = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const modalOpen = location.pathname === APPLY_PATH;
  // Computed once per page load — a static campaign page doesn't need a
  // live midnight tick, and the modal re-checks this independently anyway.
  const applicationStatus = getApplicationWindowStatus();

  // Social preview image: a real, relevant photo via Unsplash rather than
  // reusing the sitewide default. Falls back to it if Unsplash is
  // unavailable — prerender.ts waits after page load, so the resolved
  // image still lands in the static og:image tag crawlers read.
  const [ogImage, setOgImage] = useState<string>(DEFAULT_OG);
  useEffect(() => {
    let active = true;
    fetchUnsplashImage("social media content creator smartphone filming", DEFAULT_OG).then((img) => {
      if (active && img) setOgImage(img.url);
    });
    return () => {
      active = false;
    };
  }, []);

  const openModal = () => {
    if (applicationStatus !== "open") return;
    if (location.pathname !== APPLY_PATH) navigate(APPLY_PATH);
  };

  const closeModal = () => {
    if (location.pathname === APPLY_PATH) navigate(LANDING_PATH, { replace: true });
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "SkinLabs® Brand Ambassador (TikTok & Instagram Creator)",
      description:
        "SkinLabs® is recruiting 25 TikTok and Instagram creators for its founding Brand Ambassador & Creator Programme, offering 20% recurring monthly commission on successful referrals, subject to official terms.",
      hiringOrganization: { "@type": "Organization", name: "SkinLabs®", sameAs: SITE_URL },
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: { "@type": "Country", name: "South Africa" },
      employmentType: "CONTRACTOR",
      validThrough: "2026-09-25",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: brandAmbassadorFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Brand Ambassador Programme", item: `${SITE_URL}${LANDING_PATH}` },
      ],
    },
  ];

  return (
    <>
      <SEO
        title="SkinLabs® Brand Ambassador Programme | TikTok & Instagram Creators South Africa"
        description={`Join the founding SkinLabs® Brand Ambassador Programme: ${BA_SPOTS} spots for South African TikTok and Instagram creators (5K–50K followers, each platform assessed separately), ${BA_COMMISSION_PERCENT} recurring commission and a potential 12-month partnership. Applications close ${BA_APPLICATIONS_CLOSE}.`}
        canonical={`${SITE_URL}${LANDING_PATH}`}
        ogImage={ogImage}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background pb-20 sm:pb-0">
        <Header />
        <BASubNav onApply={openModal} status={applicationStatus} />
        <main>
          <BAHero onApply={openModal} status={applicationStatus} />
          <BAProgrammeOverview />
          <BAWhoWereLookingFor />
          <BAHowItWorks onApply={openModal} status={applicationStatus} />
          <BACommission />
          <BATimeline />
          <BAPerformanceOpportunity />
          <BAWhySkinLabs />
          <BAFAQ />
          <BAFinalCTA onApply={openModal} status={applicationStatus} />
        </main>
        <Footer />
        <BAStickyApplyCTA onApply={openModal} status={applicationStatus} />
      </div>

      <BrandAmbassadorModal open={modalOpen} onOpenChange={(next) => { if (!next) closeModal(); }} />
    </>
  );
};

export default BrandAmbassadors;
