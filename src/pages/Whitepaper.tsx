import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FileText, Sparkles, Shield, TrendingUp, Globe, Cpu, Play } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Whitepaper = () => {
  return (
    <>
      <Helmet>
        <title>SkinLabs® Whitepaper 2026/27 — AI in South African Skincare</title>
        <meta
          name="description"
          content="SkinLabs® Whitepaper 2026/27: market context, AI technologies, regulatory landscape (POPIA, SAHPRA, HPCSA) and our proof-of-concept SKYNN AI for South African skin."
        />
        <link rel="canonical" href="https://skinlabs.co.za/whitepapers" />
        <meta property="og:title" content="SkinLabs® Whitepaper 2026/27" />
        <meta property="og:description" content="AI-powered skincare intelligence built for South African skin, climate and regulations." />
        <meta property="og:url" content="https://skinlabs.co.za/whitepapers" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          {/* Hero */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                  <FileText className="h-4 w-4" />
                  Whitepaper 2026/27
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
                  AI in South African Skincare
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                  Market context, technology applications, regulatory realities (POPIA, SAHPRA, HPCSA) and the case for localised, privacy-first skin intelligence — featuring our proof-of-concept, SKYNN AI.
                </p>
                <p className="text-sm text-muted-foreground">Published for the 2026/27 horizon · SkinLabs®</p>
              </div>
            </div>
          </section>

          {/* Executive summary cards */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 mb-16">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <TrendingUp className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Market opportunity</h3>
                  <p className="text-sm text-muted-foreground">
                    SA cosmetics & personal care ~USD 3.97bn (2025) → ~USD 4.2bn (2026). Global AI skin-analysis market projected ~USD 2.13bn in 2026 (CAGR ~17%).
                  </p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <Globe className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Local whitespace</h3>
                  <p className="text-sm text-muted-foreground">
                    Global tools lack SA brand coverage, Rand pricing and climate-fit logic. Retailers (Clicks, Dis-Chem) are natural acquirers of localised AI + data assets.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <Shield className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Regulatory reality</h3>
                  <p className="text-sm text-muted-foreground">
                    POPIA treats health-adjacent and biometric data as special personal information. SAHPRA cosmetic vs medicinal boundary and HPCSA telemedicine rules shape product design.
                  </p>
                </div>
              </div>

              {/* Main content */}
              <div className="max-w-4xl mx-auto space-y-10">
                <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Executive summary</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      The global wellness economy exceeded USD 6.8 trillion in 2024, with personal care & beauty a major contributor. McKinsey projects the beauty segment will grow ~5% annually toward ~USD 590 billion by 2030. Within this, AI-driven niches — especially AI skin analysis — are accelerating rapidly.
                    </p>
                    <p>
                      For South African brands and platforms the opportunity is real, but so are the constraints: POPIA’s strict rules on special personal information (including health and biometric data), SAHPRA’s cosmetic/medicinal line, HPCSA ethical guidance for any practitioner-facing features, uneven AI awareness among consumers, and infrastructure realities (load-shedding, connectivity).
                    </p>
                    <p>
                      SkinLabs® was built to occupy the local whitespace: evidence-oriented content, climate- and skin-of-colour-aware scoring, and a privacy-first AI assessment tool (SKYNN AI) that stays firmly on the cosmetic side of the regulatory boundary.
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Key AI technologies in beauty</h2>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex gap-3"><Cpu className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /><span><strong className="text-foreground">Computer vision</strong> — image-based detection of visible skin characteristics (texture, tone uniformity, pigmentation patterns, etc.).</span></li>
                    <li className="flex gap-3"><Cpu className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /><span><strong className="text-foreground">Machine learning</strong> — personalised routine suggestion, demand forecasting and ingredient insight.</span></li>
                    <li className="flex gap-3"><Cpu className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /><span><strong className="text-foreground">Generative AI & NLP</strong> — content assistance, conversational guidance and creative workflows (always under human editorial oversight for published claims).</span></li>
                    <li className="flex gap-3"><Cpu className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /><span><strong className="text-foreground">AR/VR</strong> — virtual try-on and interactive diagnostics (global benchmarks show strong conversion lifts).</span></li>
                  </ul>
                </div>

                {/* SKYNN AI Proof of Concept */}
                <div className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 border border-border rounded-3xl p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">Proof of concept</p>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">SKYNN AI</h2>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    SKYNN AI is SkinLabs’ flagship product — an AI-powered cosmetic skin assessment and personalised routine formulation engine built for every skin tone and for South African conditions. It is deliberately non-diagnostic: outputs are educational and cosmetic only, never a substitute for an HPCSA-registered practitioner.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Design principles</h3>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-1">
                        <li>Privacy-first: explicit consent for special personal information; short retention of raw images</li>
                        <li>No facial recognition or identity use</li>
                        <li>Climate- and skin-of-colour-aware logic</li>
                        <li>Local brand and Rand-price awareness</li>
                        <li>Clear non-medical disclaimer on every output</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">What it delivers</h3>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-1">
                        <li>Visible-characteristic assessment (texture, tone, hydration indicators, etc.)</li>
                        <li>Personalised routine suggestions matched to SA climate and budget</li>
                        <li>Integration with SkinLabs editorial intelligence and product database</li>
                        <li>Freemium access with paid depth (Glow Insider / VIP)</li>
                      </ul>
                    </div>
                  </div>

                  {/* Instagram Reel-sized video placeholder */}
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-foreground mb-3">Watch the SKYNN AI overview</p>
                    <div
                      className="relative w-full max-w-[320px] aspect-[9/16] rounded-2xl overflow-hidden bg-black/90 border border-border shadow-lg"
                      style={{ maxHeight: "568px" }}
                    >
                      {/* Placeholder — replace src when video is uploaded */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                          <Play className="h-8 w-8 text-white ml-1" />
                        </div>
                        <p className="text-white/90 font-medium text-sm mb-1">SKYNN AI demo</p>
                        <p className="text-white/50 text-xs">Instagram Reel format (9:16)</p>
                        <p className="text-white/40 text-[10px] mt-3">Video will appear here once uploaded</p>
                      </div>
                      {/*
                        When ready, replace the placeholder div above with:
                        <video
                          className="absolute inset-0 w-full h-full object-cover"
                          controls
                          playsInline
                          poster="/path-to-poster.jpg"
                          src="/path-to-skynn-ai-reel.mp4"
                        />
                      */}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Aspect ratio 9:16 · max-width 320px (Reel-ready)</p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3 justify-center">
                    <Button asChild>
                      <Link to="/skynn-ai">Try SKYNN AI</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/pricing">View memberships</Link>
                    </Button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Regulatory & compliance posture</h2>
                  <div className="space-y-3 text-muted-foreground text-sm">
                    <p><strong className="text-foreground">POPIA:</strong> Health-adjacent and biometric data are special personal information. Explicit consent, purpose limitation, short image retention and a clear deletion policy are built into SKYNN AI and our Privacy Policy.</p>
                    <p><strong className="text-foreground">SAHPRA:</strong> All recommendations stay on the cosmetic side of the cosmetic/medicinal line. No disease-treatment claims.</p>
                    <p><strong className="text-foreground">HPCSA:</strong> Virtual consultations (when live) are delivered by independent registered practitioners. SkinLabs acts only as facilitator and payment agent.</p>
                    <p><strong className="text-foreground">CPA / ECTA:</strong> Transparent terms, refund rights and cooling-off where applicable.</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Looking ahead</h2>
                  <p className="text-muted-foreground">
                    The 2026/27 horizon favours platforms that combine trustworthy local editorial, defensible first-party skin-profile data, and AI that is both useful and compliant. SkinLabs’ path is free, SEO- and influencer-led audience growth, a service-led subscription layer, and the option of becoming the personalisation layer a major SA retailer would want to own.
                  </p>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Related legal framework:{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                    {" · "}
                    <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
                    {" · "}
                    <Link to="/editorial-policy" className="text-primary hover:underline">Editorial Policy</Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For partnership or research enquiries: <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Whitepaper;
