import { Helmet } from "react-helmet-async";
import { Heart, Users, Award, Target } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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


  return (
    <>
      <Helmet>
        <title>About Us - Our Story | SKINLABS</title>
        <meta name="description" content="Learn about SkinLabs' mission to revolutionize skincare through science, technology, and personalized solutions for every skin type." />
        <link rel="canonical" href="https://skinlabs.co.za/about" />
        <meta property="og:title" content="About Us - Our Story | SKINLABS" />
        <meta property="og:description" content="Learn about SkinLabs' mission to revolutionize skincare through science, technology, and personalized solutions." />
        <meta property="og:url" content="https://skinlabs.co.za/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/pwa-512.png" />
      </Helmet>

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
