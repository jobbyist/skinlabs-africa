/**
 * Seed payload for Daily Skinny briefings (16 Sep 2026 batch B).
 * Consumed by editorial sync / local seed tooling.
 */
export const dailySkinnyBriefingsSept16b2026 = [
  {
    slug: "pregnancy-melasma-south-africa",
    title: "Pregnancy Pigment Is Not a Glow. SA Sun Keeps the Patch.",
    excerpt: "Melasma in pregnancy is driven by hormones and UV — South African sun intensity means the mask often sticks longer without strict SPF and shade habits.",
    sa_context_tag: "Hyperpigmentation",
    cover_image_url: "https://images.pexels.com/photos/1556665/pexels-photo-1556665.jpeg?auto=compress&cs=tinysrgb&w=1200",
    cover_image_alt: "Soft portrait in natural light — pregnancy-safe skin care context (Pexels)",
    source_name: "SkinLabs Editorial",
    reading_time: "6 min read",
    key_takeaways: [
      "Hormones plus UV drive pregnancy melasma; SPF is non-negotiable outdoors in SA.",
      "Skip hydroquinone and strong retinoids while pregnant — favour azelaic acid and vitamin C where approved by your clinician.",
      "The patch often softens after delivery but can linger without daily sun protection.",
    ],
    body_path: "content/daily-skinny/pregnancy-melasma-south-africa.md",
  },
] as const;
