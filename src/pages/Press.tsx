import { Helmet } from "react-helmet-async";
import { Newspaper, Award, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Press = () => {
  const pressReleases = [
    {
      date: "December 2024",
      title: "SkinLabs Launches AI-Powered Skincare Formulator",
      excerpt: "Revolutionary technology personalizes skincare routines for every individual",
      source: "Company News"
    },
    {
      date: "November 2024",
      title: "SkinLabs Raises R50M in Series A Funding",
      excerpt: "Investment to fuel expansion across Africa and enhance AI capabilities",
      source: "Business Report"
    },
    {
      date: "October 2024",
      title: "Awards: Best Innovation in Beauty Tech 2024",
      excerpt: "SkinLabs recognized for groundbreaking approach to personalized skincare",
      source: "Beauty Awards"
    },
    {
      date: "September 2024",
      title: "Partnership with Leading Dermatology Research Institute",
      excerpt: "Collaboration to advance skincare science and product development",
      source: "Company News"
    }
  ];

  const mediaKit = [
    "Company Logo (High Resolution)",
    "Product Images",
    "Executive Headshots",
    "Brand Guidelines",
    "Company Overview",
    "Press Releases"
  ];

  return (
    <>
      <Helmet>
        <title>Press - News & Media | SKINLABS</title>
        <meta
          name="description"
          content="Latest news, press releases, and media coverage about SkinLabs. Download our media kit and stay updated on company announcements."
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
                    <Newspaper className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Press & Media
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Latest news and updates from SkinLabs
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <Newspaper className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Recent Press Releases</h2>
                  </div>
                  <div className="space-y-6">
                    {pressReleases.map((release, index) => (
                      <div key={index} className="border-b border-border last:border-0 pb-6 last:pb-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          <span>{release.date}</span>
                          <span>•</span>
                          <span>{release.source}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {release.title}
                        </h3>
                        <p className="text-muted-foreground">{release.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-card border border-border rounded-2xl p-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      Media Inquiries
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      For press inquiries and interview requests, please contact our media team.
                    </p>
                    <a href="mailto:press@skinlabs.co.za" className="text-primary font-medium hover:underline">
                      press@skinlabs.co.za
                    </a>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Newspaper className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      Media Kit
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Download our comprehensive media kit with logos, images, and brand assets.
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {mediaKit.slice(0, 3).map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Stay Updated
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Subscribe to our newsletter for the latest company news, product launches, and industry insights
                  </p>
                  <div className="max-w-md mx-auto flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                      Subscribe
                    </button>
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

export default Press;
