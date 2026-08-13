import { Helmet } from "react-helmet-async";
import { HelpCircle, MessageCircle, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FAQ = () => {
  const categories = [
    {
      title: "General Questions",
      questions: [
        {
          q: "What is SkinLabs?",
          a: "SkinLabs is South Africa's independent, content-first skincare intelligence platform: a free AI routine assessment, daily skincare science briefings, honest local product reviews, a weekly podcast and virtual consultations with SA practitioners."
        },
        {
          q: "How does the AI Formulator work?",
          a: "Answer 20 quick questions about your skin — no account required. Our AI analyses your skin type, concerns, climate and lifestyle to generate a personalised AM/PM routine and actives schedule, grounded in dermatology reference knowledge."
        },
        {
          q: "Is SkinLabs an online shop?",
          a: "No. SkinLabs doesn't sell or ship physical products. We're an independent media and AI platform — our reviews link out to where each product is actually sold across South African retailers."
        }
      ]
    },
    {
      title: "AI Formulator & Routines",
      questions: [
        {
          q: "Do I need an account to try the AI Formulator?",
          a: "No — you can complete the entire assessment and get a free routine preview without signing up. Creating an account (or upgrading) just lets you save your report and unlock the full ingredient-level breakdown."
        },
        {
          q: "Is the AI recommendation medical advice?",
          a: "No. It's general skincare guidance grounded in dermatology reference material and reviewed by skincare professionals, not a diagnosis. For medical skin conditions, please consult a licensed dermatologist — you can book one directly via Consultations."
        }
      ]
    },
    {
      title: "Membership & Pricing",
      questions: [
        {
          q: "What does Glow Explorer (free) include?",
          a: "One full Daily Skinny briefing per day, podcast previews, a basic AI routine result and community review scores — no credit card required."
        },
        {
          q: "What do I get with Glow Insider or VIP?",
          a: "Unlimited Newsroom access, the full AI routine report with PDF download, complete podcast library, full review breakdowns, and — on VIP — a monthly virtual derm consultation. See Pricing for the full breakdown."
        }
      ]
    },
    {
      title: "Reviews & Podcast",
      questions: [
        {
          q: "Are your product reviews sponsored?",
          a: "No. Reviews are scored independently on efficacy, value, texture and South African climate performance, with rand pricing compared across local retailers. We disclose when a review sample was gifted."
        },
        {
          q: "When does a new podcast episode drop?",
          a: "The Skin Deep Podcast releases every Wednesday. Every episode is free to stream, with a live countdown to the next drop on the podcast hub."
        }
      ]
    }
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((category) =>
      category.questions.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <>
      <Helmet>
        <title>FAQ — Frequently Asked Questions | SKINLABS</title>
        <meta
          name="description"
          content="Answers to common questions about the SkinLabs AI Formulator, membership pricing, product reviews and The Skin Deep Podcast."
        />
        <link rel="canonical" href="https://skinlabs.co.za/faq" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <HelpCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Frequently Asked Questions
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Find answers to common questions about our products and services
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 mb-12">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search for answers..."
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-12">
                  {categories.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h2 className="text-2xl font-bold text-foreground mb-6">
                        {category.title}
                      </h2>
                      <div className="space-y-6">
                        {category.questions.map((item, index) => (
                          <div key={index} className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-3">
                              {item.q}
                            </h3>
                            <p className="text-muted-foreground">
                              {item.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-16 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Still Have Questions?
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Our customer support team is here to help. Reach out via email, phone, or WhatsApp.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <a href="mailto:support@skinlabs.co.za" className="text-primary font-medium hover:underline">
                      support@skinlabs.co.za
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a href="tel:+27128806560" className="text-primary font-medium hover:underline">
                      +27 12 880 6560
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a href="https://wa.me/27680200749" className="text-primary font-medium hover:underline">
                      WhatsApp
                    </a>
                  </div>
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

export default FAQ;
