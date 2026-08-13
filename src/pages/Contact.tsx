import { Helmet } from "react-helmet-async";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Contact = () => {
  const contactMethods = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      value: "support@skinlabs.co.za",
      action: "mailto:support@skinlabs.co.za",
      description: "We'll respond within 24 hours"
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "WhatsApp",
      value: "+27 68 020 0749",
      action: "https://wa.me/27680200749",
      description: "Chat with us instantly"
    }
  ];


  return (
    <>
      <Helmet>
        <title>Contact Us - Get In Touch | SKINLABS</title>
        <meta name="description" content="Contact SkinLabs for support, inquiries, or feedback. Reach us via email, phone, or WhatsApp. We're here to help with your skincare needs." />
        <link rel="canonical" href="https://skinlabs.co.za/contact" />
        <meta property="og:title" content="Contact Us | SKINLABS" />
        <meta property="og:description" content="Contact SkinLabs for support, inquiries, or feedback. Reach us via email, phone, or WhatsApp." />
        <meta property="og:url" content="https://skinlabs.co.za/contact" />
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
                    Get In Touch
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Have questions? We're here to help. Reach out through any of our contact channels.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {contactMethods.map((method, index) => (
                    <a
                      key={index}
                      href={method.action}
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:border-primary/50"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        {method.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {method.title}
                      </h3>
                      <p className="text-primary font-medium mb-2">{method.value}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </a>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Send Us a Message</h2>
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="How can we help?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Message
                      </label>
                      <textarea
                        rows={6}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>
                    <Button type="submit" className="w-full h-12" size="lg">
                      Send Message
                    </Button>
                  </form>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">Location</span>
                  </div>
                  <p className="text-foreground">South Africa</p>
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

export default Contact;
