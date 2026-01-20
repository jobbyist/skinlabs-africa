import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Mail, Phone, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ContactPage = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.email || !formState.message) {
      toast.error("Please include your email and a message.");
      return;
    }
    toast.success("Thanks for reaching out! We will reply within 1-2 business days.");
    setFormState({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact SKINLABS</title>
        <meta
          name="description"
          content="Get in touch with the SKINLABS team for support, partnerships, or skincare guidance."
        />
      </Helmet>
      <Header />
      <main className="pt-24">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
                  Contact Us
                </p>
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                  We are here to help you glow
                </h1>
                <p className="text-muted-foreground mb-8">
                  Whether you need help with a routine, order tracking, or partnership opportunities,
                  our team is ready to support you.
                </p>

                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    support@skinlabs.com
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    +27 (0)10 123 4567
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    Johannesburg, South Africa
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    value={formState.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={formState.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message *</Label>
                  <Textarea
                    id="contact-message"
                    value={formState.message}
                    onChange={(event) => handleChange("message", event.target.value)}
                    placeholder="Tell us how we can help..."
                    className="min-h-[140px]"
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
