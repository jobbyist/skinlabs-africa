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
          a: "SkinLabs is South Africa's AI-powered skincare platform that creates personalized routines based on your unique skin profile, concerns, lifestyle, and local climate. We combine dermatological science with local market knowledge to recommend products available in SA."
        },
        {
          q: "Is SkinLabs only for South African users?",
          a: "While we're designed specifically for the South African market—considering local climate, skin concerns, and product availability—anyone can use our platform. However, our product recommendations and pricing are optimized for SA."
        },
        {
          q: "How does the AI formulator work?",
          a: "Our AI analyzes your skin type, concerns, lifestyle, environmental factors (like Gauteng's dry climate or KZN's humidity), and budget to recommend the optimal combination of products and active ingredients available in South Africa."
        },
        {
          q: "Is SkinLabs free to use?",
          a: "Yes! Basic access to our AI formulator, skincare articles, and product database is completely free. We also offer premium memberships with additional features like virtual consultations and advanced skin tracking."
        },
        {
          q: "Do you sell skincare products?",
          a: "No, we don't sell products directly. Instead, we provide independent recommendations and link you to trusted South African retailers where you can purchase the products we suggest."
        },
      ]
    },
    {
      title: "Skin Types & Concerns",
      questions: [
        {
          q: "What skin types do you cater to?",
          a: "We provide personalized routines for all skin types: oily, dry, combination, sensitive, and mature skin. Our AI considers your specific skin profile and South African climate conditions."
        },
        {
          q: "Can you help with acne-prone skin?",
          a: "Absolutely! We specialize in recommending routines for acne-prone skin using evidence-based ingredients like salicylic acid, niacinamide, and benzoyl peroxide—all available from South African brands."
        },
        {
          q: "I have hyperpigmentation. Can you help?",
          a: "Yes! Hyperpigmentation and post-inflammatory marks are common concerns in South Africa. We recommend products with ingredients like vitamin C, niacinamide, azelaic acid, and retinoids that are proven to address uneven skin tone."
        },
        {
          q: "What about sensitive or reactive skin?",
          a: "We have specialized routines for sensitive skin focusing on gentle, fragrance-free products that strengthen the skin barrier. We can help you avoid common irritants and build a minimal, effective routine."
        },
        {
          q: "Can SkinLabs help with aging skin concerns?",
          a: "Yes! We recommend anti-aging routines featuring retinoids, peptides, antioxidants, and sunscreen—the gold standards in preventing and addressing signs of aging like fine lines, wrinkles, and loss of firmness."
        },
        {
          q: "How do I know my skin type?",
          a: "Our AI formulator includes a comprehensive skin analysis quiz that helps determine your skin type. Alternatively, observe your skin: oily skin feels greasy by midday, dry skin feels tight, combination has an oily T-zone, and sensitive skin reacts easily to products."
        },
        {
          q: "What causes dry skin in Gauteng?",
          a: "Gauteng's high altitude and low humidity—especially in winter—accelerate trans-epidermal water loss (TEWL), making skin feel tight and flaky. We recommend richer moisturizers with ceramides and humectants sealed with occlusives."
        },
      ]
    },
    {
      title: "Skincare Ingredients",
      questions: [
        {
          q: "What is niacinamide and what does it do?",
          a: "Niacinamide (vitamin B3) is a versatile ingredient that reduces inflammation, minimizes pores, regulates oil production, and fades hyperpigmentation. It's suitable for most skin types and widely available in SA brands like Standard Beauty and Skoon."
        },
        {
          q: "Are retinoids safe for all skin types?",
          a: "Retinoids (vitamin A derivatives) are highly effective for anti-aging and acne but can cause irritation if misused. Start with a low concentration (0.25-0.5%), use 2-3 times per week initially, and always pair with sunscreen during the day."
        },
        {
          q: "What's the difference between AHAs and BHAs?",
          a: "AHAs (like glycolic and lactic acid) are water-soluble and exfoliate the skin's surface, ideal for dryness and dullness. BHAs (like salicylic acid) are oil-soluble, penetrate pores, and work best for oily and acne-prone skin."
        },
        {
          q: "Do I really need vitamin C serum?",
          a: "Vitamin C is a powerful antioxidant that brightens skin, fades dark spots, and protects against environmental damage. While not mandatory, it's highly beneficial—especially in sunny South Africa. Look for stable forms like L-ascorbic acid or ascorbyl glucoside."
        },
        {
          q: "What are ceramides?",
          a: "Ceramides are lipids (fats) that form your skin's protective barrier. Products containing ceramides help restore and maintain barrier function, reducing water loss and sensitivity—essential in SA's harsh climates."
        },
        {
          q: "Is hyaluronic acid good for dry skin?",
          a: "Yes, but use it correctly! Hyaluronic acid is a humectant that draws moisture into skin. In dry climates like Gauteng, apply it to damp skin and seal with a moisturizer to prevent it from drawing moisture FROM your skin."
        },
        {
          q: "Are parabens and sulfates bad?",
          a: "Not necessarily. Parabens are preservatives and sulfates are cleansing agents. While some people are sensitive to them, they're generally safe at cosmetic concentrations. However, many SA brands now offer paraben and sulfate-free alternatives."
        },
        {
          q: "What's the deal with snail mucin?",
          a: "Snail secretion filtrate contains glycoproteins, hyaluronic acid, and glycolic acid that can hydrate and support healing. While research is limited, many users report positive results for hydration and barrier repair."
        },
      ]
    },
    {
      title: "Skincare Routines",
      questions: [
        {
          q: "What's a basic skincare routine?",
          a: "A basic routine includes three steps: (1) Cleanser to remove dirt and oil, (2) Moisturizer to hydrate and protect, and (3) Sunscreen (SPF 30+) in the morning. This foundation works for all skin types."
        },
        {
          q: "Should I use different products in summer vs. winter?",
          a: "Yes! In humid summer (especially coastal regions), lighter gel moisturizers work well. In dry Gauteng winters, switch to richer creams with occlusives. Your sunscreen should remain consistent year-round."
        },
        {
          q: "In what order should I apply my products?",
          a: "Apply products from thinnest to thickest: cleanser, toner/essence, serum (water-based first, then oil-based), eye cream, moisturizer, and sunscreen. At night, skip sunscreen and add retinoid or treatment after serum."
        },
        {
          q: "How long before I see results?",
          a: "It depends on the concern: hydration improves within days, acne may take 6-8 weeks, hyperpigmentation needs 8-12 weeks, and anti-aging benefits emerge after 3-6 months of consistent retinoid use. Patience is key!"
        },
        {
          q: "Can I use retinol and vitamin C together?",
          a: "Yes, but use them at different times. Apply vitamin C in the morning (under sunscreen) and retinol at night. Starting both on the same night can cause irritation, especially for sensitive skin."
        },
        {
          q: "What's the best time to do my skincare routine?",
          a: "Cleanse and apply treatment products morning and night. Morning routines should always end with sunscreen. Night routines are ideal for active ingredients like retinoids and AHAs since you won't be exposed to sun."
        },
        {
          q: "How do I know if I'm over-exfoliating?",
          a: "Signs include redness, stinging when applying products, increased sensitivity, flaking, and breakouts. If this happens, stop all acids and retinoids, focus on gentle cleansing and moisturizing, and rebuild your barrier with ceramides."
        },
        {
          q: "Do I need a toner?",
          a: "Toners aren't essential but can add benefits. Hydrating toners with glycerin or hyaluronic acid boost moisture, while acid toners (with AHA/BHA) provide gentle exfoliation. Skip alcohol-based astringent toners—they're too harsh."
        },
      ]
    },
    {
      title: "Sun Protection",
      questions: [
        {
          q: "Do I need sunscreen in South Africa?",
          a: "Absolutely! South Africa has high UV levels year-round. Sunscreen prevents sunburn, premature aging, hyperpigmentation, and skin cancer. It's the single most important anti-aging step you can take."
        },
        {
          q: "What SPF should I use?",
          a: "Dermatologists recommend SPF 30 as the minimum, but SPF 50 offers more protection. Apply liberally (about a teaspoon for face and neck) and reapply every 2 hours when outdoors or after swimming/sweating."
        },
        {
          q: "Chemical vs. mineral sunscreen—which is better?",
          a: "Both work! Chemical sunscreens (avobenzone, octinoxate) absorb UV rays and are often lighter. Mineral sunscreens (zinc oxide, titanium dioxide) sit on top of skin and reflect UV—better for sensitive skin. Choose based on your preference."
        },
        {
          q: "Do I need sunscreen indoors?",
          a: "If you're near windows, yes—UVA rays penetrate glass and contribute to aging. If you're in a windowless room all day, you can skip it. When working from home near windows, apply sunscreen in the morning."
        },
        {
          q: "Can I use makeup with SPF instead?",
          a: "Makeup with SPF is a bonus but shouldn't replace dedicated sunscreen. You'd need to apply a thick layer of foundation to reach the stated SPF—which isn't practical. Use sunscreen first, then makeup."
        },
        {
          q: "What sunscreens are good for oily skin?",
          a: "Look for oil-free, mattifying formulas or gel sunscreens. South African brands like Heliocare and Solal offer lightweight options. Ingredients like niacinamide in sunscreens can also help control oil."
        },
      ]
    },
    {
      title: "Product Recommendations",
      questions: [
        {
          q: "What South African skincare brands do you recommend?",
          a: "We recommend local and accessible brands including Skoon, Esse, Standard Beauty, Swiitch Beauty, African Extracts, Dermastore Select, Lelive, and Clere. We also feature international brands available at Dis-Chem, Clicks, and Woolworths."
        },
        {
          q: "Where can I buy the products you recommend?",
          a: "Most recommended products are available at Clicks, Dis-Chem, Woolworths, Takealot, and specialized retailers like Dermastore. We provide direct links to where you can purchase each product."
        },
        {
          q: "Are drugstore products as good as expensive ones?",
          a: "Often, yes! Effective skincare is about ingredients, not price. Affordable brands like CeraVe, The Ordinary, and local SA brands offer excellent formulations. We focus on ingredient quality and concentration, not marketing hype."
        },
        {
          q: "What's a good affordable vitamin C serum in SA?",
          a: "Standard Beauty's 10% Vitamin C + Ferulic Acid serum is excellent and locally made. Also consider The Ordinary's vitamin C options available at some retailers or Skoon's Vitamin C serum."
        },
        {
          q: "Best moisturizer for dry skin under R200?",
          a: "CeraVe Moisturizing Cream (available at Dis-Chem and Clicks) is excellent. Also consider Eucerin Dry Skin Relief, Clere Hand & Body Lotion (yes, it works on face!), or Skoon's Basic Sensitive Fluid."
        },
        {
          q: "Where can I find The Ordinary products in SA?",
          a: "The Ordinary is sporadically available at select Woolworths stores and online through Dermastore and Takealot. Stock varies, so check multiple retailers or consider similar alternatives from local brands."
        },
      ]
    },
    {
      title: "Orders, Shipping & Returns",
      questions: [
        {
          q: "Does SkinLabs sell products?",
          a: "No, we're a recommendation platform, not a retailer. We provide expert guidance and link you to trusted South African retailers where you can purchase the products we recommend."
        },
        {
          q: "What are typical shipping costs in SA?",
          a: "This varies by retailer. Most offer free shipping on orders over R400-R500. Standard shipping typically costs R50-R75 and takes 2-5 business days. Clicks and Dis-Chem offer in-store pickup options."
        },
        {
          q: "How long does skincare delivery take in South Africa?",
          a: "Major cities (Johannesburg, Cape Town, Durban, Pretoria) usually receive orders within 2-3 business days. Smaller towns may take 4-7 days. Same-day delivery is available in some areas through services like Bottles or retailer apps."
        },
        {
          q: "What is your return policy?",
          a: "Since we don't sell products directly, return policies depend on the retailer. Most SA retailers offer 30-day returns on unopened products with proof of purchase. Opened skincare products may not be returnable due to hygiene reasons."
        },
        {
          q: "Can I return opened skincare products?",
          a: "Most retailers don't accept returns on opened skincare for hygiene reasons, but some make exceptions for allergic reactions. Always keep your receipt and check the specific retailer's policy before opening."
        },
        {
          q: "What if I have an allergic reaction to a product?",
          a: "Stop using it immediately. Most retailers will accept returns for medical reasons—contact them with proof of purchase. If you experience severe reactions, consult a doctor or dermatologist."
        },
      ]
    },
    {
      title: "Pricing & Payment",
      questions: [
        {
          q: "How much do recommended products typically cost?",
          a: "Our recommendations span all budgets. Basic routines can cost R300-R600 total, mid-range routines R800-R1500, and premium options R2000+. We always offer affordable alternatives and prioritize value over price."
        },
        {
          q: "Do you have a subscription service?",
          a: "We offer optional premium memberships (R99-R299/month) for advanced features, but product recommendations and basic AI formulator access are completely free. You never need to pay to get skincare advice."
        },
        {
          q: "What payment methods do SA retailers accept?",
          a: "Most retailers accept credit/debit cards, SnapScan, Zapper, Masterpass, and EFT. Some offer payment plans through PayJustNow, Payflex, or Mobicred for purchases over a certain amount."
        },
        {
          q: "Are there any hidden costs?",
          a: "No hidden costs from SkinLabs—we're free to use. When purchasing from retailers, be aware of shipping costs (if order is under free shipping threshold) and whether prices include VAT (they usually do)."
        },
      ]
    },
    {
      title: "South African Specific",
      questions: [
        {
          q: "How does South African climate affect my skincare routine?",
          a: "SA's diverse climates require different approaches: Coastal areas (humid) need lighter products, Gauteng (dry) needs richer moisturizers, and high UV levels nationwide make sunscreen essential. Our AI factors in your location."
        },
        {
          q: "What skincare ingredients work best for South African skin tones?",
          a: "For melanin-rich skin common in SA: niacinamide for hyperpigmentation, gentle AHAs like mandelic acid, vitamin C for brightening, and always SPF to prevent dark spots. Avoid harsh ingredients that may cause post-inflammatory hyperpigmentation."
        },
        {
          q: "Are international brands sold in SA authentic?",
          a: "Stick to authorized retailers like Clicks, Dis-Chem, Woolworths, and Dermastore to ensure authenticity. Be cautious of deeply discounted products on online marketplaces—counterfeit skincare exists in SA."
        },
        {
          q: "Can I use overseas skincare tips in South Africa?",
          a: "Some translate, but not all. SA's higher UV index means sunscreen is more critical, our dry inland climate requires more occlusive moisturizers, and product availability differs. Always adapt advice to local conditions."
        },
        {
          q: "What's the best skincare for Johannesburg's climate?",
          a: "Johannesburg's high altitude and low humidity cause dehydration. Focus on hydrating serums (hyaluronic acid), rich moisturizers with ceramides, and extra SPF protection. Use a humidifier in winter to combat indoor dryness."
        },
        {
          q: "Are there dermatologists I can consult in South Africa?",
          a: "Yes! We partner with registered dermatologists and skincare professionals across SA for virtual consultations. You can also book in-person appointments—many dermatologists have practices in major cities."
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | SKINLABS</title>
        <meta
          name="description"
          content="Find answers to 50+ skincare questions covering ingredients, routines, skin types, South African climate considerations, product recommendations, and our AI formulator. Expert guidance for SA skin."
        />
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
                    Everything you need to know about skincare, ingredients, routines, and navigating the South African skincare market
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
                    Still Have Questions?
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Our customer support team is here to help. Reach out via email, phone, or WhatsApp.
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
