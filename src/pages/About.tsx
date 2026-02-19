import { Helmet } from "react-helmet-async";
import { Heart, Users, Award, Target } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Customer First",
      description: "Your skin health and satisfaction are our top priorities"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Science-Backed",
      description: "Every product is formulated with proven ingredients and research"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Inclusivity",
      description: "Skincare solutions for all skin types and tones"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Innovation",
      description: "Leveraging AI and technology to revolutionize skincare"
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
                    Revolutionizing skincare through science, technology, and personalization
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Founded with a vision to make professional-grade skincare accessible to everyone, SkinLabs combines cutting-edge technology with dermatological expertise to deliver personalized skincare solutions.
                    </p>
                    <p>
                      We believe that everyone deserves healthy, radiant skin. That's why we've developed an AI-powered platform that analyzes your unique skin profile and creates customized routines tailored to your specific needs.
                    </p>
                    <p>
                      Our team of dermatologists, chemists, and AI specialists work together to ensure every product and recommendation is backed by science and delivers real results.
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
                    Join Our Mission
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Be part of the skincare revolution. Discover personalized solutions that actually work for your unique skin.
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
