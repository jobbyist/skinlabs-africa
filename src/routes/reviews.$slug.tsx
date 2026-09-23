import { useEffect, useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { MemoryRouter, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { createSupabaseServerClient } from '@/lib/content/supabaseServerClient'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useMembership } from '@/hooks/use-membership'
import { buildHeadTags } from '@/lib/seo/head'
import { productReviewJsonLd, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/jsonLd'
import { siteBreadcrumbTrail } from '@/lib/seo/breadcrumbs'
import { canonicalUrl, absoluteUrl } from '@/lib/seo/canonical'
import { productReviewTitle } from '@/lib/seo-config'
import { getMemberRatingStats } from '@/lib/memberRatings'
import {
  productReviews,
  overallScore,
  seededComments,
  getSeededAverageRating,
  getSeededLikeCount,
  type ProductReview,
  type RetailerListing,
} from '@/data/reviews'
import { getBrandBanner } from '@/lib/brand-banners'
import { getProductImage, type CategoryImage } from '@/data/productImages'
import { findMarketplaceMatch, type MarketplaceMatch } from '@/lib/marketplaceCrossLink'
import { fetchIngredientBreakdown, type IngredientBreakdownEntry } from '@/lib/ingredientBreakdown'
import { ScoreBar } from '@/components/ScoreBar'
import { SkinLabsPromiseBadge } from '@/components/SkinLabsPromiseBadge'
import EvidenceBadge from '@/components/ingredients/EvidenceBadge'
import RoutineBuilder from '@/components/RoutineBuilder'
import RelatedKnowledgeHub from '@/components/RelatedKnowledgeHub'
import AdSlot from '@/components/AdSlot'
import AdSlotAutorelaxed from '@/components/AdSlotAutorelaxed'
import FaithfulToNature from '@/components/FaithfulToNature'
import GatedOverlay from '@/components/GatedOverlay'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { trialNoun } from '@/lib/promo'

// Production SSR route for /reviews/:slug -- the second content type
// migrated to TanStack Start after Briefings (see
// docs/architecture/tanstack-start-production-migration.md). Mirrors the
// real client-side route (src/pages/ProductReview.tsx) but resolves and
// renders the public, SEO-critical content server-side.
//
// Reviews have a genuinely different data model than Briefings: a real
// product review is sourced from EITHER the static, hand-curated
// `productReviews` catalogue (src/data/reviews.ts, bundled at build time)
// OR the `ai_generated_product_reviews` table (the Firecrawl+Gemini
// pipeline, api/product-review-sync.ts) -- and per CLAUDE.md, generated
// reviews are sitemapped but were never prerendered, a real, previously
// documented crawlability gap. This route's server loader checks both
// sources, so migrating this route doesn't just add freshness (like
// Briefings) -- it closes that pre-existing gap outright.
//
// The interactive, session-dependent parts of the real page (star rating,
// likes, member comments, the membership-gated full breakdown, the
// OpenHaus marketplace cross-link) are NOT resolved server-side -- they're
// inherently per-user and this app has no server-readable auth session
// (confirmed in the Phase 1 spike) -- but they ARE preserved: this route
// reuses the exact same hooks/components/queries the real page already
// uses (useAuth, useMembership, GatedOverlay, direct Supabase queries in
// useEffect) unmodified, so the shipped functionality is unchanged, not
// reduced. The initial SSR'd HTML for those regions renders their natural
// signed-out/loading state, then hydrates to the real state on mount, same
// as any other SSR + client-auth app.
//
// RoutineBuilder / RelatedKnowledgeHub both use react-router-dom's <Link>
// internally (existing components, unmodified). TanStack Router's route
// tree has no react-router-dom <Router> ancestor of its own, so this route
// wraps its render in a lightweight, history-less <MemoryRouter> purely to
// satisfy that context requirement -- MemoryRouter never touches
// window.history and is a standard, well-established pattern for
// embedding react-router-dom components inside a non-react-router tree.
// It does not create a second, conflicting navigation system: every link
// it renders is still a real <a href> requiring a full navigation to leave
// this page, same as every other cross-boundary link between the SSR
// routes and the SPA.

const BASIC_COLUMNS =
  'id, product_name, brand, local_price_zar, where_to_buy, category, skin_type_match, score_efficacy, score_value, score_texture, score_climate, verdict, key_ingredients, retailers, published_date, seo_intro, review_body, faq, seo_title, seo_description, is_sponsored'

function mapGeneratedRow(row: Record<string, unknown>): ProductReview {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000
  return {
    id: row.id as string,
    product_name: row.product_name as string,
    brand: row.brand as string,
    local_price_zar: Number(row.local_price_zar),
    where_to_buy: row.where_to_buy as string,
    category: row.category as string,
    skin_type_match: (row.skin_type_match as string[] | null) ?? [],
    score_efficacy: Number(row.score_efficacy),
    score_value: Number(row.score_value),
    score_texture: Number(row.score_texture),
    score_climate: Number(row.score_climate),
    verdict: row.verdict as string,
    key_ingredients: (row.key_ingredients as string[] | null) ?? [],
    retailers: (row.retailers as unknown as RetailerListing[] | null) ?? [],
    isNew: new Date(row.published_date as string).getTime() >= cutoff,
    seo_intro: row.seo_intro as string | null,
    review_body: row.review_body as string | null,
    faq: (row.faq as unknown as { question: string; answer: string }[] | null) ?? [],
    seo_title: row.seo_title as string | null,
    seo_description: row.seo_description as string | null,
    is_sponsored: (row.is_sponsored as boolean | null) ?? false,
  }
}

interface ReviewPageData {
  review: ProductReview
  image: CategoryImage | null
  relatedReviews: ProductReview[]
  ingredientBreakdown: IngredientBreakdownEntry[]
}

const fetchReview = createServerFn({ method: 'GET' })
  .validator((slug: unknown) => {
    if (typeof slug !== 'string' || !slug) throw new Error('slug required')
    return slug
  })
  .handler(async ({ data: slug }): Promise<{ found: false } | { found: true; data: ReviewPageData }> => {
    const supabase = createSupabaseServerClient()

    let review: ProductReview | undefined = productReviews.find((r) => r.id === slug)
    if (!review) {
      const { data } = await supabase.from('ai_generated_product_reviews').select(BASIC_COLUMNS).eq('id', slug).maybeSingle()
      if (data) review = mapGeneratedRow(data)
    }
    if (!review) return { found: false }

    // Image: brand banner (static, highest priority) -> review_images row -> category pool.
    // Same three-tier priority as src/hooks/use-review-images.ts's getImage().
    let image: CategoryImage | null = null
    const bannerPath = getBrandBanner(review.brand)
    if (bannerPath) {
      image = { url: bannerPath, alt: `${review.brand} brand banner`, creditName: review.brand, creditUrl: '#' }
    } else {
      const { data: imgRow } = await supabase
        .from('review_images')
        .select('image_url, alt, credit_name, credit_url')
        .eq('review_id', review.id)
        .maybeSingle()
      image = imgRow
        ? { url: imgRow.image_url, alt: imgRow.alt, creditName: imgRow.credit_name, creditUrl: imgRow.credit_url }
        : getProductImage(review.category, review.id)
    }

    // Related reviews: same category, excluding self -- static catalogue plus a
    // scoped (not full-table) generated-reviews query, same field set as the main
    // review so overallScore() and the card UI both work unmodified.
    const staticRelated = productReviews.filter((r) => r.category === review!.category && r.id !== review!.id)
    const { data: generatedRelatedRows } = await supabase
      .from('ai_generated_product_reviews')
      .select(BASIC_COLUMNS)
      .eq('category', review.category)
      .neq('id', review.id)
      .limit(6)
    const generatedRelated = (generatedRelatedRows ?? []).map(mapGeneratedRow)
    const relatedReviews = [...staticRelated, ...generatedRelated].slice(0, 3)

    // Real ingredients-table data (description/function_summary/evidence_level) for
    // every key ingredient that's actually published, resolved server-side so
    // crawlers see the real breakdown in the initial HTML rather than only after
    // client hydration -- same resolver/query src/hooks/use-ingredient-breakdown.ts
    // uses client-side, just given the SSR Supabase client instead of the browser one.
    const ingredientBreakdown = await fetchIngredientBreakdown(supabase, review.key_ingredients)

    return { found: true, data: { review, image, relatedReviews, ingredientBreakdown } }
  })

export const Route = createFileRoute('/reviews/$slug')({
  loader: async ({ params }) => {
    const result = await fetchReview({ data: params.slug })
    if (!result.found) throw notFound()
    return result.data
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { review, image } = loaderData
    const path = `/reviews/${review.id}`
    const score = overallScore(review)
    const memberStats = getMemberRatingStats(review)
    // Prefer the pipeline's stored seo_title/seo_description (same formula, computed
    // server-side at publish/backfill time) so this SSR route's initial HTML matches
    // what ProductReview.tsx renders after hydration.
    const title = review.seo_title ?? productReviewTitle(review.product_name, review.brand)
    const description =
      review.seo_description ??
      `${review.product_name} by ${review.brand}, independently scored ${score}/10 for SA conditions. ${review.verdict.slice(0, 100)}`

    const product = productReviewJsonLd({
      canonicalUrl: canonicalUrl(path),
      productName: review.product_name,
      brand: review.brand,
      category: review.category,
      image: image ? absoluteUrl(image.url) : undefined,
      offers:
        review.retailers.length > 0
          ? {
              lowPrice: Math.min(...review.retailers.map((r) => r.price_zar)),
              highPrice: Math.max(...review.retailers.map((r) => r.price_zar)),
              offerCount: review.retailers.length,
            }
          : undefined,
      memberRating: { average: memberStats.average, count: memberStats.count },
      ratingValue: score,
      // Prefer the pipeline's expanded review_body (see
      // supabase/functions/product-review-sync/index.ts's generateSupplementalFields())
      // when populated -- falls back to the short verdict otherwise.
      reviewBody: review.review_body ?? review.verdict,
      reviewCount: 1,
    })
    const breadcrumb = breadcrumbJsonLd(
      siteBreadcrumbTrail([{ name: 'Reviews', path: '/reviews' }, { name: review.product_name, path }]),
    )
    const faq = review.faq && review.faq.length > 0 ? [faqJsonLd({ faqs: review.faq })] : []

    return buildHeadTags(
      { title, description, canonicalPath: path, ogType: 'article', ogImage: image?.url },
      [product, breadcrumb, ...faq],
    )
  },
  component: ReviewPage,
  notFoundComponent: () => (
    <main>
      <h1>Review not found</h1>
      <p>This product may have been removed from our review set.</p>
    </main>
  ),
})

interface CommentRow {
  id: string
  display_name: string | null
  body: string
  created_at: string
}

function ReviewPage() {
  const { review, image, relatedReviews, ingredientBreakdown } = Route.useLoaderData()
  const score = overallScore(review)
  const sortedRetailers = [...review.retailers].sort((a, b) => a.price_zar - b.price_zar)

  // Everything below is client-only, session-dependent state -- identical
  // pattern to src/pages/ProductReview.tsx, reused rather than reimplemented.
  // It resolves to the signed-out/loading state during SSR (no server-side
  // auth session exists) and hydrates to the real state on mount.
  const { user } = useAuth()
  const { isMember, isVip } = useMembership()

  const [rating, setRating] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullReview, setFullReview] = useState<string | null>(null)
  const [marketplaceMatch, setMarketplaceMatch] = useState<MarketplaceMatch | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      const match = await findMarketplaceMatch(review.brand, review.product_name)
      if (active) setMarketplaceMatch(match)
    })()
    return () => {
      active = false
    }
  }, [review.brand, review.product_name])

  useEffect(() => {
    let active = true
    if (!isMember) {
      setFullReview(null)
      return
    }
    void (async () => {
      const { data } = await supabase.from('review_details').select('full_review').eq('review_id', review.id).maybeSingle()
      if (active) setFullReview(data?.full_review ?? null)
    })()
    return () => {
      active = false
    }
  }, [review.id, isMember])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const [{ data: ratings }, { data: commentRows }] = await Promise.all([
        supabase.from('review_ratings').select('user_id, rating, liked').eq('review_id', review.id),
        supabase.from('review_comments').select('id, display_name, body, created_at').eq('review_id', review.id).order('created_at', { ascending: false }).limit(50),
      ])
      if (!active) return
      const rows = ratings ?? []
      setLikeCount(rows.length > 0 ? rows.filter((r) => r.liked).length : getSeededLikeCount(review.id))
      setAvgRating(rows.length > 0 ? rows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rows.length : getSeededAverageRating(review.id))
      const mine = user ? rows.find((r) => r.user_id === user.id) : undefined
      setRating(mine?.rating ?? 0)
      setLiked(Boolean(mine?.liked))
      setComments(commentRows ?? [])
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [review.id, user])

  const persist = async (nextRating: number, nextLiked: boolean) => {
    if (!user) {
      toast.error('Sign in to rate and like reviews.')
      return
    }
    const { error } = await supabase
      .from('review_ratings')
      .upsert({ user_id: user.id, review_id: review.id, rating: nextRating || 1, liked: nextLiked, updated_at: new Date().toISOString() }, { onConflict: 'user_id,review_id' })
    if (error) {
      toast.error('Could not save your feedback.')
      return
    }
    setRating(nextRating || 1)
    setLiked(nextLiked)
  }

  const postComment = async () => {
    if (!body.trim()) return
    if (!user) {
      toast.error('Sign in to join the discussion.')
      return
    }
    setPosting(true)
    const { data, error } = await supabase
      .from('review_comments')
      .insert({ user_id: user.id, review_id: review.id, display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member', body: body.trim() })
      .select('id, display_name, body, created_at')
      .single()
    setPosting(false)
    if (error || !data) {
      toast.error('Could not post your comment.')
      return
    }
    setComments((prev) => [data, ...prev])
    setBody('')
    toast.success('Comment posted')
  }

  const displayComments = comments.length === 0 ? (seededComments[review.id] || []).map((c, i) => ({ ...c, id: `seeded-${i}` })) : comments

  return (
    <MemoryRouter initialEntries={[`/reviews/${review.id}`]}>
      <main>
        <nav aria-label="Breadcrumb">
          <a href="/">SkinLabs</a> {'> '}
          <a href="/reviews">Reviews</a> {'> '}
          <span>{review.product_name}</span>
        </nav>

        <p>
          <em>{review.brand}</em> · {review.category}
        </p>
        <h1>
          {review.product_name} <span>{score} / 10</span>
        </h1>
        {review.is_sponsored && (
          <p>
            <em>Sponsored — SkinLabs earns a margin when you buy this product via OpenHaus Marketplace or a disclosed brand partner.</em>
          </p>
        )}
        {review.seo_intro && <p>{review.seo_intro}</p>}

        {image && (
          <figure>
            <img src={image.url} alt={`${review.category} product photography — ${image.alt}`} width={1200} height={630} loading="lazy" />
            {image.creditUrl !== '#' && (
              <figcaption>
                Representative {review.category.toLowerCase()} photography, not the exact product. Photo by{' '}
                <a href={image.creditUrl} target="_blank" rel="noreferrer noopener">
                  {image.creditName}
                </a>{' '}
                on Unsplash.
              </figcaption>
            )}
          </figure>
        )}

        <p>{review.verdict}</p>
        {review.review_body && <p>{review.review_body}</p>}
        {review.faq && review.faq.length > 0 && (
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading">Frequently asked questions</h2>
            {review.faq.map((item) => (
              <div key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </section>
        )}

        <div>
          <ScoreBar label="Efficacy" value={review.score_efficacy} />
          <ScoreBar label="Value for money" value={review.score_value} />
          <ScoreBar label="Texture" value={review.score_texture} />
          <ScoreBar label="SA climate fit" value={review.score_climate} />
        </div>

        <SkinLabsPromiseBadge />

        <AdSlot placement="product-review-top" compact />

        <div>
          <button type="button" aria-pressed={liked} onClick={() => persist(rating, !liked)}>
            {liked ? '♥' : '♡'} {likeCount + (liked ? 1 : 0)} likes
          </button>
          <div role="radiogroup" aria-label="Rate this product">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" aria-label={`Rate ${value} stars`} onClick={() => persist(value, liked)}>
                {value <= rating ? '★' : '☆'}
              </button>
            ))}
          </div>
          <span>{avgRating ? `${avgRating.toFixed(1)}/5 from members` : 'No member ratings yet'}</span>
        </div>

        <div>
          <h2>Where to buy — SA price comparison</h2>
          <ul>
            {sortedRetailers.map((entry) => (
              <li key={entry.retailer}>
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {entry.retailer}
                </a>{' '}
                — R{entry.price_zar} {entry.in_stock ? '(in stock)' : '(out of stock)'}
              </li>
            ))}
          </ul>
        </div>

        {marketplaceMatch && (
          <Link to={`/marketplace/product/${marketplaceMatch.slug}`}>Sponsored — Also available on OpenHaus</Link>
        )}

        <FaithfulToNature placement="product-review-shop" />

        <RoutineBuilder anchor={review} isVip={isVip} />

        <RelatedKnowledgeHub keywords={[...review.key_ingredients, review.category, review.brand]} />

        <AdSlot placement="product-review-mid" />

        <GatedOverlay
          locked={!isMember}
          title="Unlock the full lab breakdown"
          message="Glow Insider unlocks the complete ingredient analysis, long-form verdict and skin-type match notes for every product we've reviewed."
        >
          <div>
            <h2>The full breakdown</h2>
            <p>{fullReview ?? (isMember ? 'Loading the full verdict…' : review.verdict)}</p>
            <h3>Ingredient breakdown</h3>
            <ul>
              {ingredientBreakdown.map((entry) => (
                <li key={entry.name}>
                  {entry.resolved ? (
                    <Link to={`/ingredients/${entry.resolved.slug}`}>{entry.name}</Link>
                  ) : (
                    <span>{entry.name}</span>
                  )}
                  {entry.resolved && <EvidenceBadge level={entry.evidenceLevel} />}
                  <p>
                    {entry.functionSummary ??
                      entry.description ??
                      (entry.resolved ? 'Detailed profile in progress — check back soon.' : 'Detailed ingredient profile coming soon.')}
                  </p>
                </li>
              ))}
            </ul>
            <h3>Best suited to</h3>
            <p>{review.skin_type_match.join(', ')}</p>
          </div>
        </GatedOverlay>

        {!isMember && (
          <div>
            <p>Get every full breakdown, ingredient deep-dive included.</p>
            <Button asChild>
              <Link to="/pricing">Start my {trialNoun()}</Link>
            </Button>
          </div>
        )}

        <AdSlotAutorelaxed placement="product-review-discussion" compact />

        <div>
          <h2>Member discussion</h2>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={user ? 'Share your experience with this product…' : 'Sign in to join the discussion'}
            maxLength={2000}
            rows={3}
          />
          <Button size="sm" onClick={postComment} disabled={posting || !body.trim()}>
            {posting ? 'Posting…' : 'Post comment'}
          </Button>
          {loading ? (
            <p>Loading discussion…</p>
          ) : displayComments.length === 0 ? (
            <p>No comments yet — be the first.</p>
          ) : (
            <ul>
              {displayComments.map((comment) => (
                <li key={comment.id}>
                  <p>{comment.display_name || 'Member'}</p>
                  <p>{comment.body}</p>
                  <p>{new Date(comment.created_at).toLocaleDateString('en-ZA')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {relatedReviews.length > 0 && (
          <div>
            <h2>More {review.category.toLowerCase()} reviews</h2>
            <ul>
              {relatedReviews.map((item) => (
                <li key={item.id}>
                  <Link to={`/reviews/${item.id}`}>
                    {item.brand} {item.product_name} — {overallScore(item)}/10
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </MemoryRouter>
  )
}
