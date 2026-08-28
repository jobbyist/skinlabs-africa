import { Helmet } from "react-helmet-async";
import { HelpCircle, MessageCircle, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FAQ = () => {
  const categories = [
    {
      title: "About SkinLabs",
      questions: [
        {
          q: "What is SkinLabs?",
          a: "SkinLabs is South Africa's AI-powered skincare platform. Tell us your skin, your concerns, your lifestyle and your climate, and we build a routine around it — grounded in dermatological science and local market knowledge, not guesswork."
        },
        {
          q: "Is SkinLabs only for South African users?",
          a: "It's built specifically for South Africa — our local climate, common skin concerns and what's actually on shelves here — but anyone can use the platform. Just know our product picks and pricing are optimised for SA."
        },
        {
          q: "How does the AI formulator work?",
          a: "It looks at your skin type, concerns, lifestyle, environment (Gauteng's dryness, KZN's humidity, that kind of thing) and budget, then recommends the combination of products and actives that makes sense for you, from what's available in SA."
        },
        {
          q: "Is SkinLabs free to use?",
          a: "Yes. The free Glow Explorer plan includes one full Newsroom briefing a week, one basic AI skin analysis a month, limited product review access and 2-minute podcast previews. Glow Insider and Glow VIP unlock unlimited briefings, weekly AI routines, full reviews and podcasts, and derm consults. Insider starts with a 7-day free trial, no card required, and both paid plans carry a 30-day money-back guarantee."
        },
        {
          q: "Do you sell skincare products?",
          a: "No — we're not a retailer. We give you independent recommendations and link you to trusted South African retailers where you can actually buy the products we suggest."
        },
      ]
    },
    {
      title: "Skin Types & Concerns",
      questions: [
        {
          q: "What skin types do you cater to?",
          a: "All of them — oily, dry, combination, sensitive and mature. The AI factors in your specific skin profile plus South African climate conditions before it recommends anything."
        },
        {
          q: "Can you help with acne-prone skin?",
          a: "Yes. We lean on evidence-based ingredients — salicylic acid, niacinamide, benzoyl peroxide — all available from South African brands, and build a routine around what's actually driving your breakouts."
        },
        {
          q: "I have hyperpigmentation. Can you help?",
          a: "Yes — hyperpigmentation and post-inflammatory marks are common concerns here. We recommend ingredients like vitamin C, niacinamide, azelaic acid and retinoids, which research supports for evening out skin tone over time."
        },
        {
          q: "What about sensitive or reactive skin?",
          a: "We build routines around gentle, fragrance-free products that strengthen the skin barrier rather than fight it. The goal is helping you dodge common irritants and keep the routine minimal but effective."
        },
        {
          q: "Can SkinLabs help with aging skin concerns?",
          a: "Yes — we recommend anti-aging routines built around retinoids, peptides, antioxidants and sunscreen, which the evidence backs as the most reliable approach to fine lines, wrinkles and loss of firmness."
        },
        {
          q: "How do I know my skin type?",
          a: "Our AI formulator includes a skin analysis quiz that works this out for you. Or just pay attention: oily skin feels greasy by midday, dry skin feels tight, combination has an oily T-zone, and sensitive skin reacts easily to new products."
        },
        {
          q: "What causes dry skin in Gauteng?",
          a: "Gauteng's high altitude and low humidity — especially in winter — speed up trans-epidermal water loss (TEWL, or moisture escaping through your skin), which is why it feels tight and flaky. Richer moisturisers with ceramides and humectants, sealed in with an occlusive, help."
        },
      ]
    },
    {
      title: "Skincare Ingredients",
      questions: [
        {
          q: "What is niacinamide and what does it do?",
          a: "Niacinamide (vitamin B3) is a workhorse ingredient — it can calm inflammation, minimise the look of pores, help regulate oil, and fade hyperpigmentation. It suits most skin types and is widely available in SA brands like Standard Beauty and Skoon."
        },
        {
          q: "Are retinoids safe for all skin types?",
          a: "Retinoids (vitamin A derivatives) are genuinely effective for anti-aging and acne, but they can irritate if you rush them. Start low (0.25–0.5%), use it 2–3 times a week at first, and always pair it with sunscreen during the day."
        },
        {
          q: "What's the difference between AHAs and BHAs?",
          a: "AHAs (like glycolic and lactic acid) are water-soluble and work on the skin's surface — good for dryness and dullness. BHAs (like salicylic acid) are oil-soluble, get into pores, and suit oily and acne-prone skin better."
        },
        {
          q: "Do I really need vitamin C serum?",
          a: "Not mandatory, but it earns its place — a solid antioxidant that can brighten skin, fade dark spots and help protect against environmental damage, especially given how much sun South Africa gets. Look for stable forms like L-ascorbic acid or ascorbyl glucoside."
        },
        {
          q: "What are ceramides?",
          a: "Ceramides are lipids (fats) that make up your skin's protective barrier. Products containing them help restore and maintain that barrier, cutting water loss and sensitivity — which matters in SA's harsher climates."
        },
        {
          q: "Is hyaluronic acid good for dry skin?",
          a: "Yes, but the technique matters. Hyaluronic acid is a humectant — it draws moisture in. In dry climates like Gauteng, apply it to damp skin and seal with a moisturiser, or it can end up pulling moisture from your skin instead of the air."
        },
        {
          q: "Are parabens and sulfates bad?",
          a: "Not inherently. Parabens are preservatives, sulfates are cleansing agents — both are generally considered safe at the concentrations used in cosmetics, though some people are sensitive to them. Plenty of SA brands now offer paraben- and sulfate-free alternatives if you'd rather avoid them."
        },
        {
          q: "What's the deal with snail mucin?",
          a: "Snail secretion filtrate contains glycoproteins, hyaluronic acid and glycolic acid, which can support hydration and healing. The research is still fairly limited, but plenty of users report good results for hydration and barrier repair."
        },
      ]
    },
    {
      title: "Skincare Routines",
      questions: [
        {
          q: "What's a basic skincare routine?",
          a: "Three steps: cleanser to remove dirt and oil, moisturiser to hydrate and protect, and sunscreen (SPF 30+) in the morning. That foundation works for every skin type."
        },
        {
          q: "Should I use different products in summer vs. winter?",
          a: "Yes. In humid summer — especially coastal regions — lighter gel moisturisers do the job. In dry Gauteng winters, switch to richer creams with occlusives. Sunscreen stays non-negotiable year-round either way."
        },
        {
          q: "In what order should I apply my products?",
          a: "Thinnest to thickest: cleanser, toner or essence, serum (water-based first, then oil-based), eye cream, moisturiser, then sunscreen. At night, drop the sunscreen and add your retinoid or treatment after serum instead."
        },
        {
          q: "How long before I see results?",
          a: "Depends on what you're treating: hydration improves within days, acne can take 6–8 weeks, hyperpigmentation needs 8–12 weeks, and anti-aging benefits from consistent retinoid use tend to show after 3–6 months. Patience does most of the work here."
        },
        {
          q: "Can I use retinol and vitamin C together?",
          a: "Yes, just not at the same time. Vitamin C in the morning under sunscreen, retinol at night. Piling both on in one go can irritate skin, especially if it's sensitive."
        },
        {
          q: "What's the best time to do my skincare routine?",
          a: "Cleanse and treat morning and night. Mornings should always finish with sunscreen. Nights are the better window for actives like retinoids and AHAs, since you're not heading out into the sun after."
        },
        {
          q: "How do I know if I'm over-exfoliating?",
          a: "Watch for redness, stinging when you apply products, extra sensitivity, flaking and breakouts. If that's happening, drop all acids and retinoids for a while, stick to gentle cleansing and moisturising, and rebuild your barrier with ceramides."
        },
        {
          q: "Do I need a toner?",
          a: "Not essential, but it can help. Hydrating toners with glycerin or hyaluronic acid add moisture; acid toners (AHA/BHA) offer gentle exfoliation. Skip the alcohol-based astringent kind — those tend to do more harm than good."
        },
      ]
    },
    {
      title: "Sun Protection",
      questions: [
        {
          q: "Do I need sunscreen in South Africa?",
          a: "Yes — South Africa runs high UV levels year-round. Sunscreen helps prevent sunburn, premature aging, hyperpigmentation and skin cancer. It's one of the most effective anti-aging steps you can actually take."
        },
        {
          q: "What SPF should I use?",
          a: "SPF 30 is the usual dermatologist-recommended minimum, SPF 50 gives you more headroom. Apply generously — about a teaspoon for face and neck — and reapply every 2 hours outdoors, or after swimming or sweating."
        },
        {
          q: "Chemical vs. mineral sunscreen—which is better?",
          a: "Both work. Chemical sunscreens (avobenzone, octinoxate) absorb UV rays and tend to feel lighter. Mineral sunscreens (zinc oxide, titanium dioxide) sit on top of skin and reflect UV — usually the gentler pick for sensitive skin. Pick whichever you'll actually wear every day."
        },
        {
          q: "Do I need sunscreen indoors?",
          a: "Near windows, yes — UVA rays get through glass and contribute to aging. Stuck in a windowless room all day, you can skip it. Working from home near a window, apply it in the morning like normal."
        },
        {
          q: "Can I use makeup with SPF instead?",
          a: "It's a nice bonus, not a substitute. You'd need to apply foundation far thicker than anyone actually does to hit the stated SPF. Sunscreen first, makeup after."
        },
        {
          q: "What sunscreens are good for oily skin?",
          a: "Look for oil-free, mattifying or gel formulas. South African brands like Heliocare and Solal offer lightweight options, and niacinamide in a sunscreen can help keep oil in check too."
        },
      ]
    },
    {
      title: "Product Recommendations",
      questions: [
        {
          q: "What South African skincare brands do you recommend?",
          a: "Local, accessible brands including Skoon, Esse, Standard Beauty, Swiitch Beauty, African Extracts, Dermastore Select, Lelive and Clere — plus international brands available at Dis-Chem, Clicks and Woolworths."
        },
        {
          q: "Where can I buy the products you recommend?",
          a: "Most of what we recommend is available at Clicks, Dis-Chem, Woolworths, Takealot and specialist retailers like Dermastore. We link directly to where you can buy each product."
        },
        {
          q: "Are drugstore products as good as expensive ones?",
          a: "Often, yes. Effective skincare comes down to ingredients and concentration, not the price tag. Affordable brands like CeraVe, The Ordinary and local SA labels can hold their own — we care about what's actually in the formula, not the marketing budget behind it."
        },
        {
          q: "What's a good affordable vitamin C serum in SA?",
          a: "Standard Beauty's 10% Vitamin C + Ferulic Acid serum is a solid, locally made option. The Ordinary's vitamin C range (where you can find stock) or Skoon's Vitamin C serum are worth a look too."
        },
        {
          q: "Best moisturizer for dry skin under R200?",
          a: "CeraVe Moisturizing Cream (Dis-Chem and Clicks) is a reliable pick. Eucerin Dry Skin Relief, Clere Hand & Body Lotion (yes, it genuinely works on your face too), or Skoon's Basic Sensitive Fluid are all worth considering."
        },
        {
          q: "Where can I find The Ordinary products in SA?",
          a: "Stock shows up sporadically at select Woolworths stores and online through Dermastore and Takealot. Availability varies, so check a few retailers or have a backup from a local brand in mind."
        },
      ]
    },
    {
      title: "Orders, Shipping & Returns",
      questions: [
        {
          q: "Does SkinLabs sell products?",
          a: "No — we're a recommendation platform, not a retailer. We give you independent guidance and link you to trusted South African retailers where you can buy what we recommend."
        },
        {
          q: "What are typical shipping costs in SA?",
          a: "It varies by retailer. Most offer free shipping on orders over roughly R400–R500. Standard shipping typically runs R50–R75 and takes 2–5 business days. Clicks and Dis-Chem also offer in-store pickup."
        },
        {
          q: "How long does skincare delivery take in South Africa?",
          a: "Major cities (Johannesburg, Cape Town, Durban, Pretoria) usually see orders within 2–3 business days; smaller towns can take 4–7 days. Some areas get same-day delivery through services like Bottles or retailer apps."
        },
        {
          q: "What is your return policy?",
          a: "Since we don't sell products ourselves, returns depend on the retailer you bought from. Most SA retailers accept 30-day returns on unopened products with proof of purchase — opened skincare is often excluded for hygiene reasons."
        },
        {
          q: "Can I return opened skincare products?",
          a: "Most retailers won't accept opened skincare back, for hygiene reasons, though some make exceptions for allergic reactions. Keep your receipt either way, and check the specific retailer's policy before you open anything you might need to return."
        },
        {
          q: "What if I have an allergic reaction to a product?",
          a: "Stop using it straight away. Most retailers will accept a return for a medical reason if you have proof of purchase. If the reaction is severe, see a doctor or dermatologist rather than waiting it out."
        },
      ]
    },
    {
      title: "Pricing & Payment",
      questions: [
        {
          q: "How much do recommended products typically cost?",
          a: "It spans every budget: basic routines can run R300–R600 total, mid-range R800–R1500, and premium options R2000+. We always flag an affordable alternative where one exists — value matters more to us than price point."
        },
        {
          q: "Do you have a subscription service?",
          a: "Yes — Glow Insider (R99/month or R990/year, 2 months free) starts with a 7-day free trial, no card required, and Glow VIP (R299/month or R2990/year, 2 months free) adds monthly derm consults. Both paid plans are backed by a 30-day money-back guarantee, so if it's not for you, you get a full refund. Basic AI formulator access and limited product reviews stay free forever on the Glow Explorer plan."
        },
        {
          q: "What payment methods do SA retailers accept?",
          a: "Most take credit/debit cards, SnapScan, Zapper, Masterpass and EFT. Some offer instalment options through PayJustNow, Payflex or Mobicred on larger purchases."
        },
        {
          q: "Are there any hidden costs?",
          a: "None from us — SkinLabs is free to use. When you're buying from a retailer, just watch for shipping costs (if you're under their free-shipping threshold) and whether the price already includes VAT, which it usually does."
        },
      ]
    },
    {
      title: "South African Specific",
      questions: [
        {
          q: "How does South African climate affect my skincare routine?",
          a: "SA's climates pull in different directions: coastal humidity calls for lighter products, Gauteng's dryness calls for richer moisturisers, and high UV nationwide makes sunscreen non-negotiable wherever you are. The AI factors your location into every recommendation."
        },
        {
          q: "What skincare ingredients work best for South African skin tones?",
          a: "For melanin-rich skin, which is common here: niacinamide for hyperpigmentation, gentle AHAs like mandelic acid, vitamin C for brightening, and SPF, always, to stop dark spots forming in the first place. Harsh, stripping ingredients are more likely to trigger post-inflammatory hyperpigmentation on deeper skin tones, so we steer around them."
        },
        {
          q: "Are international brands sold in SA authentic?",
          a: "Stick to authorised retailers — Clicks, Dis-Chem, Woolworths, Dermastore — to be sure of what you're getting. Be wary of steep discounts on online marketplaces; counterfeit skincare does circulate in SA."
        },
        {
          q: "Can I use overseas skincare tips in South Africa?",
          a: "Some of it translates, not all of it. SA's higher UV index makes sunscreen more critical, our dry inland climate wants more occlusive moisturisers, and product availability just isn't the same. Treat overseas advice as a starting point, not a script."
        },
        {
          q: "What's the best skincare for Johannesburg's climate?",
          a: "Johannesburg's high altitude and low humidity dry skin out fast. Hydrating serums (hyaluronic acid), rich moisturisers with ceramides, and consistent SPF do the heavy lifting — a humidifier in winter helps with the indoor dryness too."
        },
        {
          q: "Are there dermatologists I can consult in South Africa?",
          a: "Yes — we partner with registered dermatologists and skincare professionals across SA for virtual consultations, and you can book in-person appointments too, since many of them practise in major cities."
        }
      ]
    }
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((category) =>
      category.questions.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | SKINLABS</title>
        <meta
          name="description"
          content="50+ straight answers on skincare ingredients, routines, skin types, SA climate, product picks and how SkinLabs' AI formulator works."
        />
        <link rel="canonical" href="https://skinlabs.co.za/faq" />
        <meta property="og:title" content="FAQ | SKINLABS" />
        <meta property="og:description" content="Straight answers on skincare ingredients, routines and the SA market." />
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
                    Ingredients, routines, skin types and the South African skincare market — no jargon, just answers
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 mb-12">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search for answers..."
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-12">
                  {categories.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h2 className="text-2xl font-bold text-foreground mb-6">
                        {category.title}
                      </h2>
                      <div className="space-y-6">
                        {category.questions.map((item, index) => (
                          <div key={index} className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-3">
                              {item.q}
                            </h3>
                            <p className="text-muted-foreground">
                              {item.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-16 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Still have questions?
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Our support team reads their messages — reach out via email, phone or WhatsApp.
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
