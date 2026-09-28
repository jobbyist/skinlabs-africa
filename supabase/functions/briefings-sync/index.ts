/**
 * Daily Skinny Briefings pipeline.
 *
 * Generates 1 full-length 2000+ word Daily Skinny briefing every morning
 * at 06:00 SAST (04:00 UTC). Follows the same architecture as
 * product-review-sync:
 *   - Firecrawl  = researcher  (9 cached SA skincare news channels, FIRECRAWL_API_KEY_BRIEFINGS)
 *   - Gemini     = columnist   (2000+ word SA-localised features, GEMINI_API_KEY_BRIEFINGS)
 *   - Pexels/Unsplash = photo  (cover + OG/social-preview, PEXELS_API_KEY_BRIEFINGS)
 *   - Supabase   = memory + quota + publication (news_articles table)
 *
 * SEE REPO for full source - this is a partial fix commit placeholder
 */
export {};
