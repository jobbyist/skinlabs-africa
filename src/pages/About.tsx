import { Helmet } from "react-helmet-async";
import { Heart, Users, Award, Target, Newspaper, Mic, Sparkles, Star, BookOpen, PlayCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const About = () => {
  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Independent",
      description: "No affiliate deals, no gifted samples — our reviews and briefings answer to readers only"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Evidence-Led",
      description: "Every briefing and routine is grounded in published dermatology research"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Built for SA Skin",
      description: "Written for local climate, water, shelves and melanin-rich skin — not imported advice"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "AI Where It Helps",
      description: "AI translates research into a routine you can actually follow, reviewed against clinical guidance"
    }
  ];


  const keyFeatures = [
    {
      icon: <Newspaper className="h-6 w-6" />,
      title: "The Daily Skinny",
      description: "Daily briefings of global skincare science translated for SA skin, climate and shelves.",
      highlight: "Available as premium PDF magazine",
      link: "/newsroom"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Independent Product Reviews",
      description: "Honest, unbiased reviews of SA skincare products. No affiliate deals, no gifted samples.",
      highlight: "Scored for local conditions",
      link: "/reviews"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI Formulator",
      description: "Personalized skincare routines, progress trackers, and dermatologist-approved recommendations.",
      highlight: "Premium member feature",
      link: "/ai-formulator"
    },
    {
      icon: <Mic className="h-6 w-6" />,
      title: "The Skin Deep Podcast",
      description: "Expert interviews, skincare deep-dives and myth-busting conversations.",
      highlight: "New episodes weekly",
      link: "/podcast"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Virtual Consultations",
      description: "One-on-one skincare consultations with our expert team.",
      highlight: "Personalized guidance",
      link: "/consultations"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community-First",
      description: "Join 3.7K+ members in our growing skincare community.",
      highlight: "Member-funded platform",
      link: "/pricing"
    }
  ];

  const timeline = [
    {
      year: "2023",
      title: "Platform Launch",
      description: "SkinLabs launched as an AI-powered e-commerce platform for personalized skincare."
    },
    {
      year: "2024",
      title: "Content Expansion",
      description: "Introduced The Daily Skinny briefings and independent product reviews for the SA market."
    },
    {
      year: "Early 2024",
      title: "Podcast Launch",
      description: "Launched The Skin Deep Podcast featuring expert interviews and skincare education."
    },
    {
      year: "Mid 2024",
      title: "Community Growth",
      description: "Reached 3.7K+ community members and introduced membership tiers."
    },
    {
      year: "Late 2024",
      title: "Strategic Pivot",
      description: "Evolved from e-commerce to a content and community-first platform, focusing on independent journalism."
    },
    {
      year: "2025",
      title: "Enhanced AI Features",
      description: "Upgraded AI Formulator to premium service with personalized routines, trackers and product recommendations."
    }
  ];
  return (
    <>
      <Helmet>
        <title>About Us - Our Story | SKINLABS</title>
        <title>About SkinLabs — Independent SA Skincare Platform | SKINLABS</title>
        <meta name="description" content="Learn about SkinLabs: An independent skin science platform with daily briefings, honest product reviews, AI routines, and a podcast—all built for South African skin." />
        <meta name="keywords" content="about SkinLabs, skincare platform South Africa, independent skincare reviews, AI skincare, skincare science SA" />
        <meta property="og:title" content="About Us - Our Story | SKINLABS" />
        <meta property="og:title" content="About SkinLabs — Independent SA Skincare Platform" />
        <meta property="og:description" content="Independent skin science platform with daily briefings, honest product reviews, and AI routines for South African skin." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/pwa-512.png" />
      </Helmet>
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About SkinLabs",
          "url": "https://skinlabs.co.za/about",
          "description": "Independent skin science platform built for South Africa with daily briefings, product reviews, AI routines, and educational content.",
          "mainEntity": {
            "@type": "Organization",
            "name": "SkinLabs",
            "url": "https://skinlabs.co.za",
            "foundingDate": "2023",
            "description": "Content and community-first skincare platform for South Africa"
          }
        })}</script>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    About SkinLabs
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    An independent skin science platform built for South Africa
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      SkinLabs started because skincare advice reaching South Africans was written for
                      other climates, other shelves and often other skin. We rebuilt it locally: a daily
                      editorial brief, independent product reviews scored against SA conditions, a podcast
                      and an AI formulator that turns dermatology research into a routine you can follow.
                    </p>
                    <p>
                      We are content-first rather than a storefront. That means no affiliate deals, no
                      gifted samples and no pressure to sell you a product — our members fund the work,
                      so the work answers to them.
                    </p>
                    <p>
                      Every briefing is summarised from credible global sources and then translated into
                      what it means here: high year-round UV, Highveld dryness, coastal humidity, hard
                      municipal water, local pricing and the realities of melanin-rich skin.
                    </p>
                  </div>
                </div>


                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Journey</h2>
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-10">
                    <div className="space-y-6">
                      {timeline.map((item, index) => (
                        <div key={index} className="flex gap-4 relative">
                          {index !== timeline.length - 1 && (
                            <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
                          )}
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary border-2 border-primary/20 relative z-10">
                            {item.year.length > 4 ? item.year.slice(-2) : item.year.slice(-2)}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                {item.year}
                              </span>
                              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Platform Features</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {keyFeatures.map((feature, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                            {feature.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {feature.highlight}
                              </span>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={feature.link}>Explore →</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-10 mb-12">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <PlayCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">Watch Our Story</h2>
                    <p className="text-muted-foreground">Explainer video coming soon</p>
                  </div>
                  <div className="aspect-video bg-secondary/30 rounded-2xl flex items-center justify-center">
                    <p className="text-muted-foreground">Video player placeholder</p>
                  </div>
                </div>
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Values</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {values.map((value, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                          {value.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {value.title}
                        </h3>
                        <p className="text-muted-foreground">{value.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Join the community
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Become a member for unlimited daily briefings, full product reviews and your
                    complete AI skincare routine.
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

export default About;
