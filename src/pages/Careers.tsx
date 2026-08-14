import { Helmet } from "react-helmet-async";
import { Briefcase, Users, TrendingUp, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Careers = () => {
  const positions = [
    {
      title: "Senior Chemist",
      department: "Product Development",
      location: "Johannesburg, South Africa",
      type: "Full-time"
    },
    {
      title: "AI/ML Engineer",
      department: "Technology",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Customer Success Manager",
      department: "Customer Support",
      location: "Cape Town, South Africa",
      type: "Full-time"
    },
    {
      title: "Digital Marketing Specialist",
      department: "Marketing",
      location: "Hybrid",
      type: "Full-time"
    }
  ];

  const benefits = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Health & Wellness",
      description: "Comprehensive medical aid and wellness programs"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Growth Opportunities",
      description: "Continuous learning and career development"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Great Culture",
      description: "Collaborative environment with amazing people"
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Work-Life Balance",
      description: "Flexible schedules and remote work options"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Careers - Join Our Team | SKINLABS</title>
        <meta
          name="description"
          content="Join the SkinLabs team and help revolutionize skincare. View open positions and learn about our culture, benefits, and opportunities."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Join Our Team
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Help us revolutionize skincare and build the future of personalized beauty
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-6">Why SkinLabs?</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      At SkinLabs, we're not just creating skincare products - we're pioneering a new approach to beauty that combines science, technology, and personalization.
                    </p>
                    <p>
                      Our team is made up of passionate dermatologists, chemists, engineers, and beauty enthusiasts who share a common goal: to help everyone achieve their best skin through innovative, science-backed solutions.
                    </p>
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Benefits & Perks</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                          {benefit.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">{benefit.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Open Positions</h2>
                  <div className="space-y-4">
                    {positions.map((position, index) => (
                      <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                              {position.title}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {position.department}
                              </span>
                              <span>• {position.location}</span>
                              <span>• {position.type}</span>
                            </div>
                          </div>
                          <Button>Apply Now</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Don't See the Right Role?
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    We're always looking for talented individuals. Send us your CV and let us know how you can contribute to our mission.
                  </p>
                  <Button size="lg">Send Your CV</Button>
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

export default Careers;
