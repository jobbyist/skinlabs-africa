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
          a: "SkinLabs is a personalized skincare platform that uses AI technology to create custom skincare routines based on your unique skin profile, concerns, and goals."
        },
        {
          q: "How does the AI formulator work?",
          a: "Our AI analyzes your skin type, concerns, lifestyle, and environmental factors to recommend the optimal combination of products and active ingredients for your specific needs."
        },
        {
          q: "Are your products suitable for all skin types?",
          a: "Yes! We offer products for all skin types including sensitive, oily, dry, combination, and mature skin. Our AI formulator personalizes recommendations for your specific skin."
        }
      ]
    },
    {
      title: "Products & Ingredients",
      questions: [
        {
          q: "Are your products cruelty-free?",
          a: "Yes, all SkinLabs products are cruelty-free and never tested on animals. We're certified by leading animal welfare organizations."
        },
        {
          q: "Do you use parabens or sulfates?",
          a: "No, all our products are free from parabens, sulfates, phthalates, and other harmful chemicals. We only use clean, science-backed ingredients."
        },
        {
          q: "How long do products last?",
          a: "Most products have a shelf life of 12-18 months unopened. Once opened, we recommend using them within 6-12 months for optimal effectiveness."
        }
      ]
    },
    {
      title: "Orders & Shipping",
      questions: [
        {
          q: "What are the shipping costs?",
          a: "We offer free shipping on orders over R500. For orders under R500, standard shipping is R60 and takes 3-5 business days."
        },
        {
          q: "Do you ship internationally?",
          a: "Currently, we ship within South Africa only. International shipping is coming soon - subscribe to our newsletter for updates."
        },
        {
          q: "Can I track my order?",
          a: "Yes! Once your order ships, you'll receive a tracking number via email. You can also track your order on our Track Order page."
        }
      ]
    },
    {
      title: "Returns & Refunds",
      questions: [
        {
          q: "What is your return policy?",
          a: "We offer a 30-day money-back guarantee. If you're not satisfied with your purchase, return it within 30 days for a full refund."
        },
        {
          q: "How do I return a product?",
          a: "Contact our support team at support@skinlabs.co.za to initiate a return. We'll provide you with return instructions and a prepaid shipping label."
        },
        {
          q: "When will I receive my refund?",
          a: "Refunds are processed within 5-7 business days after we receive your return. The amount will be credited back to your original payment method."
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | SKINLABS</title>
        <meta
          name="description"
          content="Find answers to common questions about SkinLabs products, shipping, returns, and our AI-powered skincare formulator."
        />
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
