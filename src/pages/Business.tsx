import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Beaker, Package, Factory, FlaskConical, ShoppingCart, Truck, Megaphone, Loader2, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SERVICES = [
  { icon: <FlaskConical className="h-6 w-6" />, name: "Medical & Cosmetic Formulation", desc: "Bench-to-bulk formulation for skincare, haircare and topical wellness — actives, stability, sensory." },
  { icon: <Package className="h-6 w-6" />, name: "Packaging Design", desc: "Primary and secondary pack design, mock-ups, dielines and print-ready artwork." },
  { icon: <Factory className="h-6 w-6" />, name: "Manufacturing", desc: "Contract manufacturing, filling and small-batch production with QC batch records." },
  { icon: <Beaker className="h-6 w-6" />, name: "R&D & Clinical Trials", desc: "Product development pipelines, case studies and dermatologist-backed clinical trials." },
  { icon: <ShoppingCart className="h-6 w-6" />, name: "Product Sourcing & Distribution", desc: "Ingredient sourcing, sales channels and e-commerce distribution setup." },
  { icon: <Truck className="h-6 w-6" />, name: "Logistics & Inventory", desc: "Order fulfilment, 3PL selection and inventory management systems." },
  { icon: <Megaphone className="h-6 w-6" />, name: "Digital Marketing & Social", desc: "Brand launch, content, paid media and social media management." },
];

const Business = () => {
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    country: "",
    services_interested: [] as string[],
    project_brief: "",
    budget_range: "",
    timeline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleService = (s: string) =>
    setForm((f) => ({ ...f, services_interested: f.services_interested.includes(s) ? f.services_interested.filter((x) => x !== s) : [...f.services_interested, s] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_name || !form.contact_email) {
      toast.error("We'll need a company, name and email before we can get back to you.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("business_enquiries").insert(form);
    setSubmitting(false);
    if (error) {
      toast.error("That didn't go through — please try again.");
      return;
    }
    setDone(true);
    toast.success("Got it. Our team will be in touch shortly.");
  };

  return (
    <>
      <Helmet>
        <title>SkinLabs® for Business — Turnkey Beauty & Wellness Services</title>
        <meta name="description" content="Formulation, manufacturing, packaging, R&D and distribution for beauty and wellness brands — SkinLabs® runs the product lifecycle so you can focus on customers." />
        <link rel="canonical" href="https://skinlabs.co.za/business" />
        <meta property="og:title" content="SkinLabs® for Business" />
        <meta property="og:description" content="Turnkey formulation, manufacturing, distribution and marketing services for beauty and wellness brands." />
        <meta property="og:url" content="https://skinlabs.co.za/business" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://skinlabs.co.za/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-16">
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">SkinLabs® for Business</p>
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                  Turnkey services for beauty & wellness brands
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  From first formulation brief to fulfilment and marketing, we run the product lifecycle end to end —
                  so founders and established brands can spend their time on customers, not on chasing suppliers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {SERVICES.map((s) => (
                  <div key={s.name} className="bg-card border border-border rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">{s.icon}</div>
                    <h2 className="font-semibold text-foreground mb-2">{s.name}</h2>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">Tell us about your project</h2>
                  <p className="text-muted-foreground text-center mb-8">Our business team gets back to you within 2 business days.</p>

                  {done ? (
                    <div className="text-center py-12 space-y-3">
                      <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
                      <p className="text-lg font-medium text-foreground">Enquiry received</p>
                      <p className="text-sm text-muted-foreground">We'll be in touch at <span className="text-foreground">{form.contact_email}</span> within 2 business days.</p>
                    </div>
                  ) : (
                    <form onSubmit={submit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="co">Company name *</Label>
                          <Input id="co" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="ct">Contact name *</Label>
                          <Input id="ct" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="em">Email *</Label>
                          <Input id="em" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="ph">Phone</Label>
                          <Input id="ph" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="cy">Country</Label>
                          <Input id="cy" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="bg">Budget range</Label>
                          <Input id="bg" value={form.budget_range} onChange={(e) => setForm({ ...form, budget_range: e.target.value })} placeholder="e.g. R100k – R500k" />
                        </div>
                        <div>
                          <Label htmlFor="tl">Timeline</Label>
                          <Input id="tl" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="e.g. launch Q3" />
                        </div>
                      </div>

                      <div>
                        <Label>Services you're interested in</Label>
                        <div className="grid sm:grid-cols-2 gap-2 mt-2">
                          {SERVICES.map((s) => (
                            <label key={s.name} className="flex items-start gap-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-secondary/40">
                              <Checkbox checked={form.services_interested.includes(s.name)} onCheckedChange={() => toggleService(s.name)} />
                              <span className="text-sm">{s.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="brief">Project brief</Label>
                        <Textarea id="brief" value={form.project_brief} onChange={(e) => setForm({ ...form, project_brief: e.target.value })} rows={4} placeholder="Tell us what you're building and where you need our help." />
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Submit enquiry
                      </Button>
                    </form>
                  )}
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

export default Business;
