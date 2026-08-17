import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { HelpCircle, MessageCircle, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  questions: FaqItem[];
}

const CATEGORIES: FaqCategory[] = [
  {
    title: "About SkinLabs",
    questions: [
      {
        q: "What is SkinLabs?",
        a: "SkinLabs is South Africa's independent skin science platform. We publish daily skincare briefings (The Daily Skinny), run an AI-powered skin formulator, review products honestly for South African shelves and climate, host The Skin Deep Podcast, and connect members with local dermatologists for virtual consultations.",
      },
      {
        q: "Is SkinLabs a skincare brand that sells products?",
        a: "No — we pivoted away from e-commerce. SkinLabs is a content and community-first platform. We don't manufacture a product line; instead we help you make sense of the products already on South African shelves, build a routine with AI, and request custom-formulated serums, moisturisers, cleansers and scrubs on request.",
      },
      {
        q: "Why did SkinLabs change direction?",
        a: "We started as an AI-powered e-commerce platform. Member feedback made it clear South Africans wanted independent, no-nonsense skin science more than another product range, so we shifted focus to education, honest reviews and community — read the full story on our About page.",
      },
      {
        q: "Who is SkinLabs for?",
        a: "Anyone living with South African skin, climate and shelf realities — from someone building their first routine to people managing hyperpigmentation, acne, sensitivity or ageing concerns, and looking for advice that isn't written for European or American skin and weather.",
      },
      {
        q: "Is SkinLabs affiliated with any hospital or medical body?",
        a: "No. SkinLabs is an independent media and technology platform. Our AI Formulator and articles provide general guidance, not medical diagnosis. For medical skin conditions we always recommend seeing a licensed dermatologist — you can book one directly through our Consultations page.",
      },
      {
        q: "How is SkinLabs different from an ordinary beauty blog?",
        a: "Every recommendation is grounded in a dermatology reference knowledge base, cross-checked against your actual quiz answers (and optional photo), and every product review discloses whether it's independently tested or sponsored. We're built for South African conditions specifically — Highveld dryness, coastal humidity, UV index, hard water and all.",
      },
    ],
  },
  {
    title: "The AI Skin Formulator",
    questions: [
      {
        q: "How does the AI Formulator work?",
        a: "You answer a 20-question skin assessment covering oil production, sensitivity, hydration, concerns and lifestyle, optionally upload a well-lit selfie for visual analysis, and our AI generates a personalised skin profile, AM/PM routine, actives introduction schedule and product-type recommendations grounded in dermatology reference data.",
      },
      {
        q: "Do I need an account to use the AI Formulator?",
        a: "No. Anyone can take the quiz and get a free skin profile and starter routine, no sign-up required. Creating a free account lets you save your results; a Glow Insider or VIP membership unlocks your full actives schedule, ingredient strategy and detailed product-type recommendations.",
      },
      {
        q: "Is uploading a photo required?",
        a: "No, it's optional. A clear front-facing photo helps the AI cross-reference visible oil distribution, texture and tone with your quiz answers for a more accurate result, but you'll still get a solid recommendation from the quiz alone. Photos are only analysed with your explicit consent and are processed securely.",
      },
      {
        q: "Is my data handled in line with POPIA?",
        a: "Yes. Before starting, you consent to SkinLabs processing your personal information under the Protection of Personal Information Act (POPIA). Quiz answers and photos are used solely to generate your recommendation — never sold or shared with third parties — and you can request deletion at any time.",
      },
      {
        q: "What's the difference between the free result and the full report?",
        a: "Everyone gets a free skin profile and a basic AM/PM starter routine instantly. Glow Insider and VIP members additionally unlock the week-by-week actives introduction schedule, ingredient deep-dive, and product-type recommendations tailored to climate and budget, plus a downloadable PDF report.",
      },
      {
        q: "Is the AI Formulator a substitute for seeing a dermatologist?",
        a: "No. It's general skincare guidance, not medical advice. If you have a diagnosed skin condition, persistent breakouts, or anything that concerns you medically, book a virtual consultation with one of our HPCSA-registered practitioners instead of relying on the AI alone.",
      },
    ],
  },
  {
    title: "Membership & Pricing",
    questions: [
      {
        q: "What membership tiers does SkinLabs offer?",
        a: "Explorer (free) gives you the AI quiz, a basic routine, and public articles. Glow Insider unlocks full AI Formulator reports, member-only Daily Skinny commentary, podcast transcripts and priority consultation booking. Glow VIP adds a monthly virtual dermatologist consultation and top-tier priority support.",
      },
      {
        q: "How much does a SkinLabs membership cost?",
        a: "Membership starts at R99/month, billed in South African Rand. You can cancel any time, and every paid plan includes a 30-day money-back guarantee. See the Pricing page for the current tier breakdown.",
      },
      {
        q: "How do I pay for a membership?",
        a: "Payments are processed securely through PayFast, a South African payment gateway supporting EFT, credit and debit cards. You'll need to be signed in to subscribe.",
      },
      {
        q: "Can I cancel my membership at any time?",
        a: "Yes. There's no lock-in contract. You can cancel from your account dashboard at any time, and you'll keep access until the end of your current billing period.",
      },
      {
        q: "Do you offer refunds?",
        a: "Yes — new subscriptions carry a 30-day money-back guarantee. If SkinLabs isn't right for you, contact support@skinlabs.co.za within 30 days of your first payment for a full refund.",
      },
      {
        q: "Is there a free trial?",
        a: "The AI Formulator's basic quiz and starter routine, plus most Daily Skinny articles, are free forever with no account required. This lets you try the platform's core value before deciding whether to upgrade to Glow Insider or VIP.",
      },
    ],
  },
  {
    title: "Understanding Your Skin in South Africa",
    questions: [
      {
        q: "How do I know my skin type?",
        a: "The AI Formulator's quiz is the fastest way — it classifies you as oily, dry, combination, sensitive or normal based on how your skin behaves through the day, your pore visibility, and how it reacts to weather changes typical of your region.",
      },
      {
        q: "Why does South African weather affect my skincare routine so much?",
        a: "South Africa spans several climates in one country: dry Highveld winters (Johannesburg, Pretoria) strip moisture and worsen barrier dysfunction, while humid KwaZulu-Natal summers push oil and breakouts. A routine built for one climate often under- or over-treats skin in the other.",
      },
      {
        q: "What is a Fitzpatrick skin type and why does SkinLabs ask about it?",
        a: "Fitzpatrick phototype estimates how your skin responds to UV exposure, from Type I (very fair, burns easily) to Type VI (deeply pigmented, rarely burns). It affects sunscreen SPF choice, hyperpigmentation risk, and how cautiously to introduce actives like retinoids — which is why the AI Formulator factors it into your routine.",
      },
      {
        q: "How do I treat hyperpigmentation and dark marks?",
        a: "Consistent broad-spectrum SPF is non-negotiable, since UV exposure is what deepens marks. Niacinamide, vitamin C, azelaic acid and gentle exfoliation (AHAs) are well-evidenced options; for stubborn post-inflammatory hyperpigmentation, a dermatologist can prescribe stronger options. This is one of the most common concerns we see from South African members with melanin-rich skin.",
      },
      {
        q: "Why is my skin drier in Johannesburg or Pretoria winter?",
        a: "Highveld winter air is very low in humidity, and indoor heating strips moisture further. Switch to a richer, ceramide-based moisturiser, avoid over-exfoliating, and consider a humectant serum (hyaluronic acid or glycerin) layered under your moisturiser.",
      },
      {
        q: "How does hard water in parts of South Africa affect my skin?",
        a: "Hard water (common in parts of Gauteng and the Western Cape) can leave mineral residue that disrupts the skin barrier and makes cleansers feel less effective. Using a gentle, low-pH cleanser and following with a barrier-supporting moisturiser helps offset the effect.",
      },
      {
        q: "What skincare routine order should I follow?",
        a: "Generally: cleanse, treat (serums/actives, thinnest to thickest), moisturise, then SPF in the morning. The AI Formulator gives you an exact AM/PM step order personalised to your skin type and the actives you're using.",
      },
    ],
  },
  {
    title: "Ingredients & Actives 101",
    questions: [
      {
        q: "What does niacinamide actually do?",
        a: "Niacinamide (vitamin B3) helps regulate oil production, strengthens the skin barrier, and reduces the look of enlarged pores and uneven tone. It's well tolerated by most skin types, including sensitive skin, and pairs safely with almost everything.",
      },
      {
        q: "Can I use retinol and vitamin C together?",
        a: "You generally can, but many dermatologists recommend using vitamin C in the morning (it also boosts SPF protection) and retinol at night, since layering both at once can increase irritation for sensitive skin. Always patch test and introduce one new active at a time.",
      },
      {
        q: "How do I introduce retinoids without irritation?",
        a: "Start low and slow: 2 nights a week with a pea-sized amount, buffered under moisturiser if needed, gradually building to nightly use over 6-8 weeks. Never combine retinoids with AHA/BHA exfoliants on the same night, and always wear SPF the next day.",
      },
      {
        q: "What's the difference between AHAs and BHAs?",
        a: "AHAs (like glycolic and lactic acid) are water-soluble and work on the skin's surface — good for dryness, dullness and texture. BHAs (like salicylic acid) are oil-soluble and penetrate into pores, making them better suited to oily and acne-prone skin.",
      },
      {
        q: "Are parabens and sulfates actually bad for skin?",
        a: "The evidence for parabens and sulfates causing harm at cosmetic concentrations is weak — most concerns come from marketing rather than dermatology research. That said, sulfates can be drying for already-compromised or sensitive barriers, so sulfate-free cleansers are a reasonable choice for dry or reactive skin.",
      },
      {
        q: "What ingredients should I avoid combining?",
        a: "The classic irritation triggers are: retinoids with AHA/BHA acids on the same night, vitamin C with niacinamide in very high concentrations (minor, mostly outdated concern), and multiple strong actives introduced simultaneously. When in doubt, the AI Formulator's actives schedule tells you exactly what to space out.",
      },
      {
        q: "Do natural or 'clean' ingredients work better than synthetic ones?",
        a: "Not inherently — plenty of synthetic ingredients (like niacinamide and hyaluronic acid) are extremely well-researched and safe, while some natural extracts can be more irritating or allergenic. We evaluate ingredients by evidence, not by whether they're labelled 'natural'.",
      },
    ],
  },
  {
    title: "Sun Protection in South Africa",
    questions: [
      {
        q: "What SPF should I use in South Africa?",
        a: "South Africa has a high UV index for most of the year, so we recommend a broad-spectrum SPF 30 minimum, and SPF 50 if you're outdoors for extended periods, at altitude (Johannesburg, Pretoria) or near the coast. Reapply every two hours when outdoors.",
      },
      {
        q: "Do people with darker skin tones need sunscreen?",
        a: "Yes. Higher melanin offers some natural UV protection but doesn't eliminate the risk of photoageing, hyperpigmentation or skin cancer. Sunscreen is still recommended daily regardless of skin tone — the main practical issue is finding formulas that don't leave a white cast, which our reviews specifically flag.",
      },
      {
        q: "What does the new SPF labelling guidance in South Africa mean for me?",
        a: "SAHPRA has tightened broad-spectrum and water-resistance claims, requiring documented UVA-PF testing and capping water-resistance wording to tested durations. In practice, this means labels should become more trustworthy over the next year — we track these updates in The Daily Skinny.",
      },
      {
        q: "Mineral or chemical sunscreen — which is better?",
        a: "Both are effective when applied correctly. Mineral (zinc oxide/titanium dioxide) sunscreens are gentler for sensitive or reactive skin and sit on top of skin; chemical sunscreens tend to be lighter and easier to wear under makeup. Choice mostly comes down to skin sensitivity and personal preference.",
      },
      {
        q: "Why does my sunscreen leave a white cast?",
        a: "This usually happens with mineral sunscreens that aren't micronised or tinted, and it's more noticeable on deeper skin tones. Our product reviews specifically call out which SPF formulas blend well on melanin-rich skin available in South Africa.",
      },
    ],
  },
  {
    title: "Product Reviews & The Daily Skinny",
    questions: [
      {
        q: "Are your product reviews sponsored?",
        a: "We disclose sponsorship clearly whenever it applies. Most of our reviews are independent — we evaluate products available on South African shelves against their ingredient claims, price and suitability for local skin types and climate, without brand payment influencing the verdict.",
      },
      {
        q: "What is The Daily Skinny?",
        a: "The Daily Skinny is our daily skin science briefing — short, evidence-based summaries of new research, regulatory changes and product news, translated into what it actually means for South African skin and shelves.",
      },
      {
        q: "How often is new content published?",
        a: "The Daily Skinny publishes new briefings regularly, and The Skin Deep Podcast drops a new episode every Wednesday. Reviews are added on a rolling basis as we test new products.",
      },
      {
        q: "Can I save or bookmark articles?",
        a: "Yes — signed-in members can like and save Daily Skinny articles, and comment on them. Your saved articles are accessible from your dashboard.",
      },
      {
        q: "Do you review products not sold in South Africa?",
        a: "Our focus is products realistically available on South African shelves or via local delivery, since availability, pricing in Rand and suitability for our climate are core to what makes a recommendation useful here.",
      },
    ],
  },
  {
    title: "The Skin Deep Podcast",
    questions: [
      {
        q: "What is The Skin Deep Podcast about?",
        a: "Weekly conversations on skincare culture, ingredient science and mindful routines — grounded in South African skin, climate and shelves. Expect ingredient deep-dives, myth-busting and practical routine advice.",
      },
      {
        q: "How often does a new episode come out?",
        a: "A new episode releases every Wednesday. You can see the exact date of the next drop on the Podcast page.",
      },
      {
        q: "Where can I listen to the podcast?",
        a: "Directly on skinlabs.co.za/podcast, where you can stream any episode, browse by topic, and read show notes with clickable timestamps.",
      },
      {
        q: "Are full transcripts available?",
        a: "Show notes are free for everyone. Full searchable transcripts are a Glow Insider benefit, so you can quickly find the exact moment an ingredient or product is discussed.",
      },
    ],
  },
  {
    title: "Consultations & Dermatologists",
    questions: [
      {
        q: "Can I book a virtual dermatologist consultation?",
        a: "Yes. Our Consultations page connects you with independent, HPCSA-registered practitioners for video consultations. Glow VIP members get one consultation included each month plus priority booking; everyone else can browse availability and book individually.",
      },
      {
        q: "Are the dermatologists actually South African and HPCSA-registered?",
        a: "Yes — consultations are provided by independent practitioners registered with the Health Professions Council of South Africa (HPCSA). SkinLabs facilitates booking and payment but doesn't employ the practitioners directly.",
      },
      {
        q: "How much does a consultation cost?",
        a: "Pricing varies by practitioner and is shown in Rand before you confirm a booking. Glow VIP members receive one consultation per month as part of their membership at no extra charge.",
      },
      {
        q: "What can a virtual consultation help with?",
        a: "Your AI Formulator result gives you a plan; a consultation confirms it against a real, licensed opinion — useful for diagnosing a condition, adjusting your actives schedule, or getting a prescription-strength recommendation the AI can't provide.",
      },
      {
        q: "How quickly can I get an appointment?",
        a: "Availability depends on the practitioner, but many offer same-day or next-day slots. Exact next-available times are shown on the Consultations page before you book.",
      },
    ],
  },
  {
    title: "Custom Formulas & Bundled Kits",
    questions: [
      {
        q: "What are Custom Formulas?",
        a: "A request-based formulation service across four product types — Serums, Moisturisers, Cleansers and Scrubs. You specify your skin goals, key ingredients or allergens to avoid, and preferred texture/scent, and our team curates a formula around that brief.",
      },
      {
        q: "How long does a custom formula request take?",
        a: "Turnaround varies by request complexity; you'll be contacted via your preferred delivery method (email or WhatsApp) with next steps after submitting the four-step request form.",
      },
      {
        q: "What are Bundled Kits?",
        a: "Curated multi-product systems — for example a complete daily routine (cleanser, serum, moisturiser) or a discovery set of travel sizes — positioned as a coherent system rather than a one-off gift.",
      },
      {
        q: "Can I customise a Bundled Kit?",
        a: "Yes — every kit's 'Customise' option opens the Custom Formula request flow pre-loaded with that product type, so you can adjust ingredients, texture and scent to your preference.",
      },
      {
        q: "Are Custom Formulas dermatologist-reviewed?",
        a: "Formulation requests are curated by the SkinLabs team using dermatology-grounded ingredient guidance. For a specific medical concern, we recommend pairing your request with a virtual consultation.",
      },
    ],
  },
  {
    title: "Account, Data Privacy & POPIA",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click 'Get Started' or 'Sign In' in the header. You can sign up with a magic link (no password needed), email and password, or continue with Google.",
      },
      {
        q: "Is my personal information protected under South African law?",
        a: "Yes. SkinLabs processes personal information in accordance with POPIA (the Protection of Personal Information Act). We only use your data to deliver the service you've requested — never sold to third parties.",
      },
      {
        q: "Can I delete my data?",
        a: "Yes. You can request deletion of your account and associated data at any time by contacting support@skinlabs.co.za. Photos uploaded to the AI Formulator are automatically deleted within 30 days.",
      },
      {
        q: "Does SkinLabs use cookies?",
        a: "Yes, for essential site function, analytics and (with consent) marketing. You control non-essential cookies via the cookie consent banner and our full Cookie Policy.",
      },
      {
        q: "Do you offer multi-factor authentication?",
        a: "Yes — you can enable TOTP-based two-factor authentication (via an authenticator app) from the Security tab in your account dashboard for extra protection.",
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CATEGORIES.flatMap((category) =>
    category.questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  ),
};

const FAQ = () => {
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return CATEGORIES;
    return CATEGORIES.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (item) => item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term),
      ),
    })).filter((category) => category.questions.length > 0);
  }, [query]);

  const totalQuestions = CATEGORIES.reduce((sum, c) => sum + c.questions.length, 0);
  const totalResults = filteredCategories.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <>
      <Helmet>
        <title>FAQ — Skincare Questions Answered for South African Skin | SKINLABS</title>
        <meta
          name="description"
          content={`${totalQuestions}+ answers on skincare routines, ingredients, sun protection, memberships and more — tailored to South African skin, climate and shelves.`}
        />
        <link rel="canonical" href="https://skinlabs.co.za/faq" />
        <meta property="og:title" content="FAQ — Skincare Questions Answered for South African Skin | SKINLABS" />
        <meta
          property="og:description"
          content={`${totalQuestions}+ answers on skincare routines, ingredients, sun protection, memberships and more — tailored to South African skin, climate and shelves.`}
        />
        <meta property="og:url" content="https://skinlabs.co.za/faq" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <HelpCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Frequently Asked Questions
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {totalQuestions}+ answers on skincare, ingredients and the SkinLabs platform — grounded in South
                    African skin, climate and shelves.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 mb-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for answers — e.g. &quot;SPF&quot;, &quot;retinol&quot;, &quot;membership&quot;..."
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Search FAQ"
                    />
                  </div>
                </div>
                {query.trim() && (
                  <p className="mb-8 text-sm text-muted-foreground">
                    {totalResults} result{totalResults === 1 ? "" : "s"} for “{query.trim()}”
                  </p>
                )}

                <div className={cn("space-y-12", !query.trim() && "mb-12")}>
                  {filteredCategories.map((category) => (
                    <div key={category.title}>
                      <h2 className="text-2xl font-bold text-foreground mb-2">{category.title}</h2>
                      <Accordion type="multiple" className="rounded-2xl border border-border bg-card px-6">
                        {category.questions.map((item) => (
                          <AccordionItem key={item.q} value={item.q}>
                            <AccordionTrigger className="text-left text-lg font-semibold text-foreground">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                  {filteredCategories.length === 0 && (
                    <p className="py-12 text-center text-muted-foreground">
                      No matches yet — try a different search term, or ask us directly below.
                    </p>
                  )}
                </div>

                <div className="mt-16 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Still Have Questions?
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Our support team is here to help. Reach out via email, phone, or WhatsApp.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <a href="mailto:support@skinlabs.co.za" className="text-primary font-medium hover:underline">
                      support@skinlabs.co.za
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a href="tel:+27128806560" className="text-primary font-medium hover:underline">
                      +27 12 880 6560
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a href="https://wa.me/27680200749" className="text-primary font-medium hover:underline">
                      WhatsApp
                    </a>
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

export default FAQ;
