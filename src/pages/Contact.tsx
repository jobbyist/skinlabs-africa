import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Mail, MessageCircle, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  subject: "",
  message: "",
};

const RESUBMIT_COOLDOWN_MS = 15_000;

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [nextSubmitAllowedAt, setNextSubmitAllowedAt] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const isRateLimited = Date.now() < nextSubmitAllowedAt;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRateLimited) {
      const message = "Please wait a few seconds before submitting again.";
      setFormError(message);
      toast.error(message);
      return;
    }
    if (!form.first_name || !form.last_name || !form.email || !form.subject || !form.message) {
      const message = "Please fill in every field before sending.";
      setFormError(message);
      toast.error(message);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert(form);
      setNextSubmitAllowedAt(Date.now() + RESUBMIT_COOLDOWN_MS);
      if (error) {
        const isServerRateLimited = error.message?.includes("Too many messages");
        const message = isServerRateLimited
          ? error.message
          : "That didn't go through — please try again, or email support@skinlabs.co.za directly.";
        setFormError(message);
        toast.error(message);
        return;
      }
      setForm(initialForm);
      setDone(true);
      toast.success("Message sent — we'll respond within 24 hours.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <title>Contact Us — Get In Touch | SkinLabs®</title>
        <meta name="description" content="Contact SkinLabs for support, inquiries, or feedback. Reach us via email, phone, or WhatsApp. We're here to help with your skincare needs." />
        <link rel="canonical" href="https://skinlabs.co.za/contact" />
        <meta property="og:title" content="Contact Us | SkinLabs®" />
        <meta property="og:description" content="Contact SkinLabs for support, inquiries, or feedback. Reach us via email, phone, or WhatsApp." />
        <meta property="og:url" content="https://skinlabs.co.za/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
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
                    Questions, feedback, or you just want to double-check something before you buy? Pick a channel.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  {contactMethods.map((method, index) => (
                    <a
                      key={index}
                      href={method.action}
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:border-primary/50"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        {method.icon}
                      </div>
                      <h2 className="text-lg font-semibold text-foreground mb-2">
                        {method.title}
                      </h2>
                      <p className="text-primary font-medium mb-2">{method.value}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </a>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Send us a message</h2>
                  {done ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
                      <p className="mt-4 text-lg font-medium text-foreground">Message sent</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We'll respond within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={submit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="contact-first-name" className="block text-sm font-medium text-foreground mb-2">
                            First Name
                          </label>
                          <input
                            id="contact-first-name"
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="John"
                            value={form.first_name}
                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="contact-last-name" className="block text-sm font-medium text-foreground mb-2">
                            Last Name
                          </label>
                          <input
                            id="contact-last-name"
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Doe"
                            value={form.last_name}
                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-2">
                          Email
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="john@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-subject" className="block text-sm font-medium text-foreground mb-2">
                          Subject
                        </label>
                        <input
                          id="contact-subject"
                          type="text"
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="How can we help?"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-2">
                          Message
                        </label>
                        <textarea
                          id="contact-message"
                          rows={6}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          placeholder="Tell us more about your inquiry..."
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          required
                        />
                      </div>
                      {formError && (
                        <p role="alert" className="text-sm font-medium text-destructive">
                          {formError}
                        </p>
                      )}
                      <Button type="submit" className="w-full h-12" size="lg" disabled={submitting || isRateLimited}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                        Send Message
                      </Button>
                    </form>
                  )}
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
