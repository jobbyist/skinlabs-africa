import cover1 from "@/assets/hero-skincare.jpg";
import cover2 from "@/assets/product-serum.jpg";
import cover3 from "@/assets/banner-skincare.png";
import cover4 from "@/assets/product-facial-moisturizer.png";
import cover5 from "@/assets/product-body-oil-serum.png";
import cover6 from "@/assets/product-led-mask.jpg";

export interface NewsArticle {
  id: string;
  article_title: string;
  original_url: string;
  source_name: string;
  publish_date: string;
  cover_image_url: string;
  reading_time: string;
  sa_context_tag: string;
  key_takeaways: string[];
  sa_breakdown: string;
}

/**
 * Seed briefing set. In production these rows are replaced daily by the
 * Firecrawl scraper + Gemini summariser pipeline.
 *
 * Terminology: always "The Daily Skinny" (not "the blog"/"newsroom feed"),
 * always "briefing" (not "post"/"article" in UI copy), always "SA breakdown"
 * for the local-context section — keep this consistent across new copy.
 */
export const newsArticles: NewsArticle[] = [
  {
    id: "sunscreen-labelling-sa",
    article_title: "New SPF labelling guidance tightens sunscreen claims for local brands",
    original_url: "https://www.sahpra.org.za/",
    source_name: "SAHPRA Regulatory Update",
    publish_date: "2026-08-12",
    cover_image_url: cover1,
    reading_time: "4 min read",
    sa_context_tag: "UV Protection",
    key_takeaways: [
      "Broad-spectrum claims now require documented UVA-PF testing.",
      "Water-resistance wording is capped at tested durations only.",
      "Local manufacturers have a 12-month compliance runway.",
    ],
    sa_breakdown:
      "South Africa carries one of the highest year-round UV indices in the world, and Highveld altitude pushes effective exposure higher still. Tighter labelling means the SPF number on your bottle should finally match real-world protection, which matters most for melanin-rich skin where UVA drives persistent hyperpigmentation rather than obvious burning. Expect reformulations from local brands over the next year, with more transparent UVA-PF ratings and fewer vague 'all-day' claims. Practically: keep reapplying every two hours outdoors, favour tinted mineral filters if you are managing melasma, and treat any product without a stated UVA rating as incomplete protection for our climate.",
  },
  {
    id: "niacinamide-hyperpigmentation-trial",
    article_title: "Trial data supports niacinamide pairing for post-inflammatory hyperpigmentation",
    original_url: "https://pubmed.ncbi.nlm.nih.gov/",
    source_name: "Journal of Cosmetic Dermatology",
    publish_date: "2026-08-12",
    cover_image_url: cover2,
    reading_time: "5 min read",
    sa_context_tag: "Hyperpigmentation",
    key_takeaways: [
      "5–10% niacinamide reduced pigment intensity over 12 weeks.",
      "Combination with tranexamic acid outperformed either alone.",
      "Tolerability was high across Fitzpatrick IV–VI participants.",
    ],
    sa_breakdown:
      "Post-inflammatory hyperpigmentation is the single most common concern reported by South African users of the SkinLabs AI Formulator, particularly after acne and razor irritation. This data is encouraging because it was run across deeper skin phototypes, where aggressive brightening actives often cause more pigment than they clear. A gentle, well-tolerated pairing of niacinamide with tranexamic acid gives a lower-risk route than high-strength hydroquinone cycles. Locally, both actives are widely available through Clicks, Dis-Chem and Dermastore at accessible price points, making this one of the more budget-friendly evidence-backed protocols currently on shelf.",
  },
  {
    id: "winter-barrier-highveld",
    article_title: "Dermatologists report a spike in winter barrier damage across the Highveld",
    original_url: "https://www.dermatology.org.za/",
    source_name: "Dermatological Society of SA",
    publish_date: "2026-08-11",
    cover_image_url: cover3,
    reading_time: "3 min read",
    sa_context_tag: "Gauteng Dryness",
    key_takeaways: [
      "Clinic visits for eczema flares rose sharply in July.",
      "Indoor heating and hard water are compounding factors.",
      "Simplified routines resolved most cases within two weeks.",
    ],
    sa_breakdown:
      "Gauteng winter air sits at very low relative humidity, and combined with hot showers and hard water, it strips the lipid barrier fast. The clinical advice is unglamorous but effective: shorter lukewarm showers, a non-foaming cleanser, and a ceramide-rich occlusive applied to damp skin. Pause exfoliating acids and retinoids while skin is reactive, then reintroduce one active at a time. If you are in Johannesburg or Pretoria and your usual routine suddenly stings, that is barrier disruption, not a product allergy.",
  },
  {
    id: "retinal-vs-retinol",
    article_title: "Retinaldehyde gains ground as the tolerable retinoid step-up",
    original_url: "https://www.dermnetnz.org/",
    source_name: "DermNet Science Digest",
    publish_date: "2026-08-11",
    cover_image_url: cover4,
    reading_time: "4 min read",
    sa_context_tag: "Retinoids",
    key_takeaways: [
      "Retinaldehyde converts to retinoic acid in one step.",
      "Comparable efficacy to retinol with less peeling reported.",
      "Encapsulated formats improve stability in warm storage.",
    ],
    sa_breakdown:
      "Warm bathroom storage is a real stability problem in South African summers, so encapsulated retinaldehyde formats hold their potency better than open-air retinol serums. For users managing both acne and pigmentation, a single-step conversion retinoid gives faster visible results without the multi-week peeling phase that so often ends in abandoned routines. Introduce at two nights per week, always buffer with moisturiser, and never layer it with AHAs on the same evening.",
  },
  {
    id: "hard-water-skin",
    article_title: "Hard water linked to increased skin sensitivity in urban households",
    original_url: "https://www.ncbi.nlm.nih.gov/",
    source_name: "Environmental Dermatology Review",
    publish_date: "2026-08-10",
    cover_image_url: cover5,
    reading_time: "3 min read",
    sa_context_tag: "Water Quality",
    key_takeaways: [
      "Calcium deposits interact with surfactants to irritate skin.",
      "Low-foam cleansers reduced measurable irritation.",
      "Filtered shower heads showed modest benefit.",
    ],
    sa_breakdown:
      "Water hardness varies widely across South African municipalities, and several inland supply areas sit at the higher end. The practical fix is not an expensive filter: switching to a low-foam or cream cleanser removes most of the surfactant-mineral residue problem. If you notice tightness immediately after washing regardless of what moisturiser follows, your water chemistry is likely part of the picture.",
  },
  {
    id: "teledermatology-access",
    article_title: "Teledermatology expands specialist access beyond metro areas",
    original_url: "https://www.hpcsa.co.za/",
    source_name: "SA Health Policy Brief",
    publish_date: "2026-08-10",
    cover_image_url: cover6,
    reading_time: "5 min read",
    sa_context_tag: "Access to Care",
    key_takeaways: [
      "Virtual consults cut average waiting times significantly.",
      "Prescription pathways are now clearer for remote patients.",
      "Image quality remains the main diagnostic limitation.",
    ],
    sa_breakdown:
      "With a small number of registered dermatologists serving the entire country, most concentrated in Gauteng and the Western Cape, virtual consultations meaningfully change access for patients in smaller centres. For a useful remote consult, photograph the concern in natural daylight, include a wide and a close shot, and bring a written list of every active ingredient currently in your routine. That preparation alone resolves most of the diagnostic gap flagged in the report.",
  },
];
