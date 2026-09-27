import { useEffect, useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { MemoryRouter, Link } from 'react-router-dom'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/content/supabaseServerClient'
import { buildHeadTags } from '@/lib/seo/head'
import { spotlightBrandJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { siteBreadcrumbTrail } from '@/lib/seo/breadcrumbs'
import { canonicalUrl } from '@/lib/seo/canonical'
import { getSpotlightBrand, SPOTLIGHT_EDITION_MONTH, SPOTLIGHT_METHODOLOGY_VERSION } from '@/data/spotlight'
import { overallScore } from '@/data/reviews'
import { spotlightComments } from '@/data/articleComments'
import { useEntitlements } from '@/hooks/use-entitlements'
import { canViewSpotlightProfile, recordSpotlightProfileView, SPOTLIGHT_FREE_MONTHLY } from '@/lib/access-quotas'
import GatedOverlay from '@/components/GatedOverlay'
import SsrConversionShell from '@/components/SsrConversionShell'
import BrandLogo from '@/components/BrandLogo'
import BrandRequestModal from '@/components/BrandRequestModal'
import ArticleComments from '@/components/ArticleComments'
import AffiliateAdSlot from '@/components/AffiliateAdSlot'
import RelatedKnowledgeHub from '@/components/RelatedKnowledgeHub'
import { Button } from '@/components/ui/button'

// Production SSR route for /spotlight/:slug -- the fourth content type
// migrated to TanStack Start (see
// docs/architecture/tanstack-start-production-migration.md). Mirrors
// src/pages/SpotlightBrandProfile.tsx.
//
// Spotlight's data model is the inverse of Ingredients': a brand's ranking
// entry (score, product list, editorial copy) is entirely static/computed
// at build time (getSpotlightBrand() -- src/data/spotlight.ts, no Supabase
// call), while only the *edition* label (which methodology version, which
// month) is a live, mechanically-bumped row in `spotlight_editions`
// (src/hooks/use-spotlight-edition.ts). The server loader below resolves
// both: the static lookup directly, and the live edition row with the
// same fallback-on-error behaviour as the client hook (never blanks the
// page if the table read fails).
//
// Like Reviews, several reused components here (RelatedKnowledgeHub,
// GatedOverlay's own internal upgrade CTA) depend on react-router-dom's
// <Link>, so this route wraps its render in the same <MemoryRouter>
// pattern established by reviews.$slug.tsx.
//
// Gating (Glow Lite+ get full profiles; free/signed-out visitors get
// SPOTLIGHT_FREE_MONTHLY views per month via a client-only localStorage
// quota) is inherently unresolvable server-side -- there's no server-
// readable session or quota state. Per the same precedent as Reviews'
// membership gate, this route renders the full profile content and lets
// the real GatedOverlay + useEntitlements + access-quotas client logic
// apply the lock after hydration; the SSR'd HTML itself is never locked,
// so the profile is fully crawlable regardless of any visitor's quota.

interface SpotlightEditionData {
  editionLabel: string
  methodologyVersion: string
}

const FALLBACK_EDITION: SpotlightEditionData = {
  editionLabel: SPOTLIGHT_EDITION_MONTH,
  methodologyVersion: SPOTLIGHT_METHODOLOGY_VERSION,
}

const fetchSpotlightBrand = createServerFn({ method: 'GET' })
  .validator((slug: unknown) => {
    if (typeof slug !== 'string' || !slug) throw new Error('slug required')
    return slug
  })
  .handler(async ({ data: slug }) => {
    const entry = getSpotlightBrand(slug)
    if (!entry) return { found: false as const }

    const supabase = createSupabaseServerClient()
    const { data: editionRow } = await supabase
      .from('spotlight_editions')
      .select('edition_label, methodology_version')
      .eq('is_current', true)
      .maybeSingle()
    const edition: SpotlightEditionData = editionRow
      ? { editionLabel: editionRow.edition_label, methodologyVersion: editionRow.methodology_version }
      : FALLBACK_EDITION

    return { found: true as const, data: { entry, edition } }
  })

export const Route = createFileRoute('/spotlight/$slug')({
  loader: async ({ params }) => {
    const result = await fetchSpotlightBrand({ data: params.slug })
    if (!result.found) throw notFound()
    return result.data
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { entry } = loaderData
    const path = `/spotlight/${entry.slug}`
    const headline = `${entry.brand} — Spotlight by SkinLabs`
    const description = entry.editorial.whyTheyMadeTheList

    const article = spotlightBrandJsonLd({ canonicalUrl: canonicalUrl(path), headline, description })
    const breadcrumb = breadcrumbJsonLd(siteBreadcrumbTrail([{ name: 'Spotlight', path: '/spotlight' }, { name: entry.brand, path }]))

    return buildHeadTags({ title: headline, description, canonicalPath: path, ogType: 'article' }, [article, breadcrumb])
  },
  component: SpotlightBrandPage,
  notFoundComponent: () => (
    <main>
      <h1>Brand not found</h1>
      <p>
        This brand may not be part of the current Spotlight edition. <a href="/spotlight">Back to Spotlight</a>
      </p>
    </main>
  ),
})

function SpotlightBrandPage() {
  const { entry, edition: loaderEdition } = Route.useLoaderData()
  const { editorial } = entry
  const [claimOpen, setClaimOpen] = useState(false)
  const [viewRecorded, setViewRecorded] = useState(false)

  // Client-only, session-dependent -- identical pattern to
  // SpotlightBrandProfile.tsx, reused rather than reimplemented. Resolves
  // to the signed-out/loading state during SSR, hydrates to the real
  // state on mount.
  const { can, loading: membershipLoading } = useEntitlements()
  const isMember = can('spotlight.full_profiles')
  const canView = canViewSpotlightProfile(entry.slug)
  const locked = !membershipLoading && !isMember && !canView

  useEffect(() => {
    if (!isMember && canView && !viewRecorded) {
      recordSpotlightProfileView(entry.slug)
      setViewRecorded(true)
    }
  }, [isMember, canView, viewRecorded, entry.slug])

  return (
    <MemoryRouter initialEntries={[`/spotlight/${entry.slug}`]}>
      <SsrConversionShell />
      <main>
        <GatedOverlay
          locked={locked}
          title="Monthly free profile limit reached"
          message={`Glow Explorer and signed-out visitors can open ${SPOTLIGHT_FREE_MONTHLY} Spotlight brand profiles per month. Upgrade to Glow Insider or Glow VIP for unlimited access.`}
          feature="spotlight.full_profiles"
          source="spotlight_limit_ssr"
        >
          <Link to="/spotlight">All of Spotlight</Link>

          <div>
            <BrandLogo brand={entry.brand} logoUrl={editorial.logoUrl} size="lg" />
            <div>
              {entry.rank !== null ? <span>#{entry.rank} in the full ranking</span> : <span>New on the Radar</span>}
              <h1>{entry.brand}</h1>
              <p>{editorial.positioningStatement}</p>
            </div>
          </div>

          {editorial.brandStory && <p>{editorial.brandStory}</p>}

          <ul>
            <li>{entry.avgOverallScore} avg review score /10</li>
            <li>{entry.productCount} reviewed products</li>
            <li>{entry.movement} this edition</li>
          </ul>

          <section>
            <h2>Known for</h2>
            <p>{editorial.knownFor}</p>
          </section>

          <section>
            <h2>The SkinLabs Take</h2>
            <p>{editorial.skinlabsTake}</p>
          </section>

          <section>
            <h2>Why they made the list</h2>
            <p>{editorial.whyTheyMadeTheList}</p>
          </section>

          {editorial.evidenceLimitation && <p>{editorial.evidenceLimitation}</p>}

          <section>
            <h2>Featured product</h2>
            <Link to={`/reviews/${entry.featuredProduct.id}`}>
              {entry.featuredProduct.category} — {entry.featuredProduct.product_name} ({overallScore(entry.featuredProduct)}/10)
            </Link>
          </section>

          {entry.products.length > 1 && (
            <section>
              <h2>All reviewed products</h2>
              <ul>
                {entry.products.map((product) => (
                  <li key={product.id}>
                    <Link to={`/reviews/${product.id}`}>
                      {product.product_name} — {overallScore(product)}/10
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <RelatedKnowledgeHub keywords={[entry.brand, ...entry.products.flatMap((p) => p.key_ingredients), ...entry.products.map((p) => p.category)]} />

          <div>
            {editorial.officialWebsite && (
              <a href={editorial.officialWebsite} target="_blank" rel="noreferrer noopener">
                Official website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <Button variant="outline" onClick={() => setClaimOpen(true)}>
              Claim this brand
            </Button>
          </div>

          <p>
            Assessed for the {loaderEdition.editionLabel} edition under{' '}
            <Link to="/spotlight/methodology">{loaderEdition.methodologyVersion}</Link>.
          </p>

          <p>
            <ShieldCheck className="h-4 w-4" />
            <span>Editorial disclaimer:</span>{' '}
            Spotlight by SkinLabs is an independent editorial feature. Rankings and profiles are determined using
            the SkinLabs editorial methodology and available product information. Inclusion does not constitute
            paid endorsement. Commercial relationships, affiliate links, gifted products or other benefits are
            disclosed where applicable.
          </p>

          <ArticleComments comments={spotlightComments[entry.slug] ?? []} />
        </GatedOverlay>

        <AffiliateAdSlot partner="shopify" placement="brand-spotlight" />
      </main>

      <BrandRequestModal open={claimOpen} onOpenChange={setClaimOpen} mode="claim" brandName={entry.brand} brandSlug={entry.slug} />
    </MemoryRouter>
  )
}
