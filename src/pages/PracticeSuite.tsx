import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Receipt,
  BellRing,
  Sparkles,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SITE = "https://skinlabs.co.za";

const LOOP = [
  { n: "01", title: "Book", body: "Clients book online or you add them to the diary. Reminders go out on their own." },
  { n: "02", title: "Consult", body: "Intake and consent are done before they arrive, so the session is just the session." },
  { n: "03", title: "Note", body: "Write it, or let the assistant draft it. You review, edit and sign." },
  { n: "04", title: "Invoice", body: "The invoice is ready when the note is signed. In rand, with your details." },
  { n: "05", title: "Get paid", body: "Payment links on every invoice, and a clear view of who still owes you." },
];

const FEATURES = [
  { icon: <CalendarDays className="h-6 w-6" />, tag: "In the beta", title: "Diary and online booking", body: "Several practitioners, rooms, recurring appointments, and a booking page that carries your practice name." },
  { icon: <ClipboardCheck className="h-6 w-6" />, tag: "In the beta", title: "Notes that hold up", body: "Templates, your name and a timestamp on every entry, and an edit history that keeps the original visible." },
  { icon: <FileText className="h-6 w-6" />, tag: "In the beta", title: "Intake and consent", body: "Digital forms with e-signature, including consent for handling health information under POPIA." },
  { icon: <Receipt className="h-6 w-6" />, tag: "In the beta", title: "Invoicing in rand", body: "Invoices, statements and payment links for patients who pay you directly." },
  { icon: <BellRing className="h-6 w-6" />, tag: "In the beta", title: "Reminders that work", body: "SMS and email reminders with confirm and reschedule links. WhatsApp follows once approvals are in place." },
  { icon: <Sparkles className="h-6 w-6" />, tag: "Opt-in, limited", title: "AI notes assistant", body: "Drafts a note from the consultation, with the patient's consent. You review every line and it never saves on its own. A few design-partner practices first." },
];

const NOT_IN_BETA = [
  { item: "Live medical aid claims", when: "After beta" },
  { item: "Stock and dispensing", when: "Later" },
  { item: "Telehealth video", when: "Later" },
  { item: "Lab and imaging links", when: "Later" },
];

const ROADMAP = [
  { date: "12 Oct", title: "Build starts", body: "Interviews with practitioners, teardowns of the tools you use today, privacy and legal groundwork." },
  { date: "1 Nov", title: "Scope locked", body: "We decide exactly what the beta includes, and what it doesn't." },
  { date: "29 Nov", title: "Core loop works", body: "Book, note, invoice and get paid, running end to end inside the team." },
  { date: "20 Dec", title: "Feature freeze", body: "External security test and a restore drill. Then a quiet December." },
  { date: "11 Jan", title: "Private beta", body: "25 practices, onboarded in waves of five with your data imported." },
];

const FAQS = [
  { q: "Is it live?", a: "No. It's in development. The private beta opens on 11 January 2027 for a fixed group of 25 practices. Signing up now puts you in the running for a place." },
  { q: "What will it cost?", a: "The beta is free. Pricing will be in rand and set with the first practices, so it reflects what the product is worth to you. Founding practices will get a better rate." },
  { q: "Where is patient data stored?", a: "We're aiming for South African hosting and haven't finalised it. We'll tell you exactly where data sits, and who processes it, before anyone loads a single record." },
  { q: "Does it handle medical aid claims?", a: "Not in the beta. The beta is built for practices that bill patients directly. Claims and eligibility checks need a switching partner, and we'd rather do that properly than rush it." },
  { q: "What if I want to leave?", a: "You export everything, any time. Your records are yours, and no lock-in is part of the deal." },
];

const ROLES = ["Practitioner, solo", "Practitioner, group practice", "Practice manager", "Clinic owner", "Other"];
const PRACTICE_TYPES = ["Dermatology or aesthetics", "Psychology or counselling", "Dietetics", "Physiotherapy or allied health", "GP or specialist (medical aid)", "Other"];
const SIZES = ["Just me", "2 to 3", "4 to 6", "7 or more"];
const PROVINCES = ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const emptyForm = {
  full_name: "",
  email: "",
  role: "",
  practice_type: "",
  practitioner_count: "",
  province: "",
  admin_pain: "",
  consent: false,
};

const PracticeSuite = () => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.role || !form.practice_type || !form.practitioner_count || !form.province) {
      toast.error("We'll need your name, email and a few practice details first.");
      return;
    }
    if (!form.consent) {
      toast.error("Please tick the consent box so we can contact you about early access.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("practice_suite_waitlist").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      role: form.role,
      practice_type: form.practice_type,
      practitioner_count: form.practitioner_count,
      province: form.province,
      admin_pain: form.admin_pain.trim() || null,
      contact_consent: true,
    });
    setSubmitting(false);
    // 23505 = already on the list. Treat it as success so we don't reveal who has signed up.
    if (error && error.code !== "23505") {
      toast.error("That didn't go through. Please try again in a moment.");
      return;
    }
    setDone(true);
    toast.success("You're on the list.");
  };

  return (
    <>
      <Helmet>
        <title>Practice Suite by SkinLabs®: Practice Management for South African Clinics</title>
        <meta
          name="description"
          content="Practice Suite is SkinLabs®' upcoming practice management system for private practitioners and clinics in South Africa. In development, with a private beta opening in January 2027. Request early access."
        />
        <link rel="canonical" href={`${SITE}/practice-suite`} />
        <meta property="og:title" content="Practice Suite by SkinLabs®" />
        <meta property="og:description" content="Diary, notes, billing and reminders in one place, built around how South African practices work. Private beta opens January 2027." />
        <meta property="og:url" content={`${SITE}/practice-suite`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE}/og-image.png`} />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          {/* Hero */}
          <section className="bg-brand-ink text-brand-ink-foreground">
            <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">
                  Early access · Private beta opens 11 January 2027
                </p>
                <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight text-balance">
                  Practice admin, <span className="text-brand-gold">without the nonsense.</span>
                </h1>
                <p className="text-lg md:text-xl text-brand-ink-foreground/80 max-w-xl">
                  Diary, notes, billing and reminders in one place, built around how South African practices actually
                  work. We're building it now, and 25 practices get in first.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-brand-gold text-brand-ink hover:bg-brand-gold/90">
                    <a href="#access">Request early access</a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-brand-ink-foreground/30 bg-transparent text-brand-ink-foreground hover:bg-brand-ink-foreground/10 hover:text-brand-ink-foreground">
                    <a href="#features">See what's coming</a>
                  </Button>
                </div>
                <p className="text-sm text-brand-ink-foreground/60">
                  Free during the beta. Nothing here is live yet, and we won't ask you for patient data.
                </p>
              </div>

              {/* Illustrative diary, clearly labelled as example data */}
              <div className="space-y-3" aria-label="Example of the diary view, using made-up data">
                <div className="rounded-2xl bg-card text-card-foreground p-5 shadow-2xl">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap pb-3 border-b border-border">
                    <div>
                      <p className="font-heading font-semibold">Tue 12 January</p>
                      <p className="text-sm text-muted-foreground">Dr A. Example · Room 2</p>
                    </div>
                    <span className="text-xs uppercase tracking-wider bg-muted text-muted-foreground px-2.5 py-1 rounded-full">Example data</span>
                  </div>
                  {[
                    ["08:30", "Initial consult", "J.M.", "Note signed"],
                    ["09:30", "Follow-up", "T.N.", "Draft to review"],
                    ["10:15", "Review", "A.K.", "Invoice sent"],
                    ["11:30", "Intake", "New client", "Consent pending"],
                  ].map(([time, what, who, status]) => (
                    <div key={time} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground tabular-nums w-12">{time}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{what}</p>
                        <p className="text-xs text-muted-foreground">{who}</p>
                      </div>
                      <span className="text-xs font-medium bg-brand-cream text-brand-cream-foreground px-2.5 py-1 rounded-full whitespace-nowrap">{status}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-brand-ink-foreground/15 p-4 space-y-1">
                  <p className="text-xs uppercase tracking-wider text-brand-gold">Draft note · not saved</p>
                  <p className="text-sm text-brand-ink-foreground/80">
                    The assistant drafts. You read it, edit it, then sign it. Nothing reaches the record until you do.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Who it's for */}
          <section className="bg-brand-cream text-brand-cream-foreground border-b border-border">
            <div className="container mx-auto px-4 py-5 max-w-6xl flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="uppercase tracking-wider text-xs opacity-70">Beta is for</span>
              <span className="font-medium">Private-pay clinics</span>
              <span className="font-medium">Dermatology and aesthetics</span>
              <span className="font-medium">Psychology and dietetics</span>
              <span className="font-medium">Small group practices</span>
            </div>
          </section>

          {/* The loop */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 max-w-6xl space-y-10">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">The loop</p>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground text-balance">One loop, done properly.</h2>
                <p className="text-lg text-muted-foreground">
                  Here's the thing: most practices don't need forty features. They need the day to run from booking to
                  payment without staying late. So that's where we started.
                </p>
              </div>
              <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 border-t border-foreground pt-6">
                {LOOP.map((s) => (
                  <li key={s.n} className="space-y-2">
                    <span className="text-sm text-primary tabular-nums">{s.n}</span>
                    <h3 className="text-xl font-heading font-semibold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="py-16 md:py-24 bg-secondary/10 border-y border-border">
            <div className="container mx-auto px-4 max-w-6xl space-y-10">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">What's in the beta</p>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground text-balance">
                  Built for a South African practice, not translated into one.
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURES.map((f) => (
                  <div key={f.title} className="bg-card border border-border rounded-2xl p-6 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">{f.icon}</div>
                      <span className="text-xs uppercase tracking-wider bg-brand-ink text-brand-ink-foreground px-2.5 py-1 rounded-full">{f.tag}</span>
                    </div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Trust + not in beta */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">How we handle records</p>
                <h2 className="text-3xl font-heading font-bold text-foreground text-balance">Patient records are sacred. We built around that.</h2>
                <p className="text-muted-foreground">
                  Health information is special personal information under POPIA, and the HPCSA expects records to be
                  signed, dated and never quietly changed. So every note carries your name and a timestamp, and an edit
                  never hides the original.
                </p>
                <p className="text-muted-foreground">
                  We're designing around POPIA and HPCSA record-keeping guidance. That is a design goal, not a
                  certificate. Before the beta starts, we'll publish where data is stored, who processes it, and what
                  the AI assistant does with it.
                </p>
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  Read our <Link to="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
                </p>
              </div>
              <div className="bg-brand-ink text-brand-ink-foreground rounded-3xl p-8 space-y-4">
                <p className="text-xs uppercase tracking-wider text-brand-gold">Not in the beta</p>
                <p className="text-brand-ink-foreground/80">Not necessarily the list you wanted. It is the honest one.</p>
                <ul>
                  {NOT_IN_BETA.map((r) => (
                    <li key={r.item} className="flex justify-between gap-4 py-3 border-t border-brand-ink-foreground/15 last:border-b">
                      <span>{r.item}</span>
                      <span className="text-brand-gold text-sm whitespace-nowrap">{r.when}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-brand-ink-foreground/60">We'd rather tell you now than put "coming soon" on it and hope.</p>
              </div>
            </div>
          </section>

          {/* Roadmap */}
          <section className="py-16 md:py-24 bg-secondary/10 border-y border-border">
            <div className="container mx-auto px-4 max-w-6xl space-y-10">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">Roadmap</p>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground text-balance">Ninety days to a private beta.</h2>
                <p className="text-lg text-muted-foreground">Dates are targets, not promises. We'll tell you if one moves.</p>
              </div>
              <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 border-t border-foreground pt-6">
                {ROADMAP.map((r) => (
                  <li key={r.title} className="space-y-2">
                    <span className="text-sm text-primary tabular-nums">{r.date}</span>
                    <h3 className="font-heading font-semibold text-foreground">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Sign-up */}
          <section id="access" className="py-16 md:py-24">
            <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">Early access</p>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground text-balance">Twenty-five places. Waves of five.</h2>
                <p className="text-lg text-muted-foreground">
                  Tell us about your practice and what eats your admin time. We pick the first cohort from these
                  answers, then set up your data and sit with you for the first session.
                </p>
                <ul className="space-y-2 text-foreground">
                  <li>Free during the beta, with no card.</li>
                  <li>A direct WhatsApp line to the team.</li>
                  <li>Full export of your data at any time.</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Please don't put patient details in this form. We only need to know about you and your practice.
                </p>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 md:p-8">
                {done ? (
                  <div className="text-center py-10 space-y-3" role="status">
                    <CheckCircle2 className="h-14 w-14 text-primary mx-auto" aria-hidden="true" />
                    <p className="text-lg font-medium text-foreground">You're on the list</p>
                    <p className="text-sm text-muted-foreground">
                      We'll email <span className="text-foreground">{form.email}</span> as we choose the first cohort.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ps-name">Full name *</Label>
                        <Input id="ps-name" autoComplete="name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={120} required />
                      </div>
                      <div>
                        <Label htmlFor="ps-email">Email *</Label>
                        <Input id="ps-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={254} required />
                      </div>
                      <div>
                        <Label htmlFor="ps-role">Your role *</Label>
                        <Select value={form.role} onValueChange={(v) => set("role", v)}>
                          <SelectTrigger id="ps-role"><SelectValue placeholder="Choose one" /></SelectTrigger>
                          <SelectContent>{ROLES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ps-type">Practice type *</Label>
                        <Select value={form.practice_type} onValueChange={(v) => set("practice_type", v)}>
                          <SelectTrigger id="ps-type"><SelectValue placeholder="Choose one" /></SelectTrigger>
                          <SelectContent>{PRACTICE_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ps-size">Practitioners *</Label>
                        <Select value={form.practitioner_count} onValueChange={(v) => set("practitioner_count", v)}>
                          <SelectTrigger id="ps-size"><SelectValue placeholder="Choose one" /></SelectTrigger>
                          <SelectContent>{SIZES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ps-prov">Province *</Label>
                        <Select value={form.province} onValueChange={(v) => set("province", v)}>
                          <SelectTrigger id="ps-prov"><SelectValue placeholder="Choose one" /></SelectTrigger>
                          <SelectContent>{PROVINCES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="ps-pain">What takes up most of your admin time?</Label>
                      <Textarea id="ps-pain" rows={4} maxLength={1000} value={form.admin_pain} onChange={(e) => set("admin_pain", e.target.value)} />
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox id="ps-consent" checked={form.consent} onCheckedChange={(v) => set("consent", v === true)} className="mt-1" />
                      <Label htmlFor="ps-consent" className="text-sm font-normal text-muted-foreground leading-snug">
                        I agree that SkinLabs® may contact me about Practice Suite early access. I can withdraw this at
                        any time. See our <Link to="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
                      </Label>
                    </div>
                    <Button type="submit" size="lg" disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
                      Request early access
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="pb-16 md:pb-24">
            <div className="container mx-auto px-4 max-w-3xl space-y-6">
              <h2 className="text-3xl font-heading font-bold text-foreground">Questions practices ask first</h2>
              <Accordion type="single" collapsible className="border-t border-foreground">
                {FAQS.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="text-left text-lg">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <p className="text-sm text-muted-foreground">
                Looking for beauty and wellness brand services instead? That's <Link to="/business" className="underline underline-offset-2">SkinLabs® for Business</Link>.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PracticeSuite;
