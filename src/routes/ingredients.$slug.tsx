import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { AlertTriangle, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/content/supabaseServerClient'
import { buildHeadTags } from '@/lib/seo/head'
import { ingredientJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { siteBreadcrumbTrail } from '@/lib/seo/breadcrumbs'
import { canonicalUrl } from '@/lib/seo/canonical'
import { formatTitle } from '@/lib/seo-config'
import { ingredientCategoryLabel } from '@/lib/ingredientCategories'
import type { Database } from '@/integrations/supabase/types'
import EvidenceBadge from '@/components/ingredients/EvidenceBadge'
import IngredientDisclaimer from '@/components/ingredients/IngredientDisclaimer'
import SourceCitationList from '@/components/ingredients/SourceCitationList'

// Production SSR route for /ingredients/:slug -- the third content type
// migrated to TanStack Start after Briefings and Reviews (see
// docs/architecture/tanstack-start-production-migration.md). Mirrors the
// real client-side route (src/pages/IngredientDetail.tsx) and its data hook
// (src/hooks/use-ingredient-detail.ts) directly -- the server loader below
// is a line-for-line replication of fetchIngredientDetail()'s four-query
// fan-out (ingredient row + concerns + bidirectional interactions + linked
// current-formulation products), not a refactor of the client hook into an
// isomorphic function, matching the established Phase 4/5 precedent.
//
// Unlike Reviews and Briefings, none of the components this page reuses
// (EvidenceBadge, IngredientDisclaimer, SourceCitationList) depend on
// react-router-dom in any way -- confirmed by reading each file -- so this
// route needs no <MemoryRouter> wrapper. Every internal link (to another
// ingredient, to a product review) is a plain <a href>, same as every other
// SSR-migrated route's cross-page links.
//
// This route intentionally has no client-only interactive region to
// preserve (IngredientDetail.tsx has none -- it's pure Supabase-backed
// read content, no auth-gated section, no per-user state), so unlike
// reviews.$slug.tsx there's no hydration-boundary component to keep.

type IngredientRow = Database['public']['Tables']['ingredients']['Row']

interface ConcernLink {
  relationship: Database['public']['Enums']['ingredient_concern_relationship']
  concern_name: string
  concern_slug: string
}

interface InteractionLink {
  id: string
  interaction_type: Database['public']['Enums']['ingredient_interaction_type']
  explanation: string | null
  usage_guidance: string | null
  source_url: string | null
  other_ingredient_slug: string
  other_ingredient_name: string
}

interface ProductLink {
  product_id: string
  product_slug: string
  product_name: string
  brand_name: string
}

interface IngredientPageData {
  ingredient: IngredientRow
  concerns: ConcernLink[]
  interactions: InteractionLink[]
  products: ProductLink[]
}

const INTERACTION_META: Record<InteractionLink['interaction_type'], { label: string; icon: typeof CheckCircle2 }> = {
  compatible: { label: 'Compatible', icon: CheckCircle2 },
  enhances: { label: 'Works well together', icon: Sparkles },
  buffers: { label: 'Can help buffer irritation', icon: CheckCircle2 },
  requires_spacing: { label: 'Space out use', icon: Clock },
  avoid_combining: { label: 'Avoid combining', icon: AlertTriangle },
}

const fetchIngredient = createServerFn({ method: 'GET' })
  .validator((slug: unknown) => {
    if (typeof slug !== 'string' || !slug) throw new Error('slug required')
    return slug
  })
  .handler(async ({ data: slug }): Promise<{ found: false } | { found: true; data: IngredientPageData }> => {
    const supabase = createSupabaseServerClient()

    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('*')
      .eq('slug', slug)
      .neq('verification_status', 'deprecated')
      .maybeSingle()
    if (!ingredient) return { found: false }

    const [{ data: concernRows }, { data: interactionRows }, { data: productRows }] = await Promise.all([
      supabase.from('ingredient_concerns').select('relationship, skin_concerns(name, slug)').eq('ingredient_id', ingredient.id),
      supabase
        .from('ingredient_interactions')
        .select(
          'id, interaction_type, explanation, usage_guidance, source_url, ingredient_a_id, ingredient_b_id, a:ingredients!ingredient_interactions_ingredient_a_id_fkey(slug, inci_name, common_name), b:ingredients!ingredient_interactions_ingredient_b_id_fkey(slug, inci_name, common_name)',
        )
        .or(`ingredient_a_id.eq.${ingredient.id},ingredient_b_id.eq.${ingredient.id}`),
      supabase
        .from('product_ingredients')
        .select('is_key_ingredient, product_versions!inner(is_current, products(id, slug, name, brands(name)))')
        .eq('ingredient_id', ingredient.id)
        .eq('product_versions.is_current', true)
        .limit(12),
    ])

    const concerns: ConcernLink[] = (concernRows ?? [])
      .filter((r) => r.skin_concerns)
      .map((r) => ({
        relationship: r.relationship,
        concern_name: (r.skin_concerns as { name: string; slug: string }).name,
        concern_slug: (r.skin_concerns as { name: string; slug: string }).slug,
      }))

    const interactions: InteractionLink[] = (interactionRows ?? []).map((r) => {
      const isA = r.ingredient_a_id === ingredient.id
      const other = (isA ? r.b : r.a) as { slug: string; inci_name: string; common_name: string | null } | null
      return {
        id: r.id,
        interaction_type: r.interaction_type,
        explanation: r.explanation,
        usage_guidance: r.usage_guidance,
        source_url: r.source_url,
        other_ingredient_slug: other?.slug ?? '',
        other_ingredient_name: other?.common_name || other?.inci_name || '',
      }
    })

    const products: ProductLink[] = (productRows ?? [])
      .map((r) => {
        const pv = r.product_versions as { products: { id: string; slug: string; name: string; brands: { name: string } | null } | null } | null
        const p = pv?.products
        if (!p) return null
        return { product_id: p.id, product_slug: p.slug, product_name: p.name, brand_name: p.brands?.name ?? '' }
      })
      .filter((p): p is ProductLink => p !== null)

    return { found: true, data: { ingredient, concerns, interactions, products } }
  })

export const Route = createFileRoute('/ingredients/$slug')({
  loader: async ({ params }) => {
    const result = await fetchIngredient({ data: params.slug })
    if (!result.found) throw notFound()
    return result.data
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { ingredient } = loaderData
    const name = ingredient.common_name || ingredient.inci_name
    const category = ingredientCategoryLabel(ingredient.category)
    const path = `/ingredients/${ingredient.slug}`
    const description = `Learn about ${name}: what it does, who it benefits, and the evidence supporting its use in skincare — part of the SkinLabs® ingredients intelligence layer.`

    const ingredientBlock = ingredientJsonLd({
      canonicalUrl: canonicalUrl(path),
      name,
      category,
      description,
    })
    const breadcrumb = breadcrumbJsonLd(siteBreadcrumbTrail([{ name: 'Ingredients', path: '/ingredients' }, { name, path }]))

    return buildHeadTags(
      { title: formatTitle(`${name} (${category}) — Benefits & Uses`), description, canonicalPath: path },
      [ingredientBlock, breadcrumb],
    )
  },
  component: IngredientPage,
  notFoundComponent: () => (
    <main>
      <h1>Ingredient not found</h1>
      <p>
        We don't have a profile for that ingredient yet. <a href="/ingredients">Browse all ingredients</a>.
      </p>
    </main>
  ),
})

function IngredientPage() {
  const { ingredient, concerns, interactions, products } = Route.useLoaderData()
  const name = ingredient.common_name || ingredient.inci_name
  const worksWith = interactions.filter((i) => i.interaction_type === 'enhances' || i.interaction_type === 'compatible')
  const useWithCaution = interactions.filter(
    (i) => i.interaction_type === 'avoid_combining' || i.interaction_type === 'requires_spacing' || i.interaction_type === 'buffers',
  )
  const allSources = interactions.filter((i) => i.source_url).map((i) => ({ label: i.source_url as string, url: i.source_url as string }))
  if (ingredient.source_url) allSources.unshift({ label: ingredient.source_url, url: ingredient.source_url })

  return (
    <main>
      <nav aria-label="Breadcrumb">
        <a href="/ingredients">Ingredients</a> {'> '}
        <span>{name}</span>
      </nav>

      <p>
        {ingredientCategoryLabel(ingredient.category)}
        {' · '}
        <EvidenceBadge level={ingredient.evidence_level} />
        {ingredient.pregnancy_safe === false && ' · Not recommended during pregnancy'}
        {ingredient.irritancy_risk === 'high' && ' · High irritation potential'}
      </p>
      <h1>{name}</h1>
      {ingredient.common_name && ingredient.common_name !== ingredient.inci_name && <p>INCI: {ingredient.inci_name}</p>}

      <section>
        <h2>What is it?</h2>
        <p>{ingredient.description || ingredient.function_summary || 'A detailed profile for this ingredient is still being written.'}</p>
      </section>

      {ingredient.function_summary && ingredient.description && (
        <section>
          <h2>What does it do?</h2>
          <p>{ingredient.function_summary}</p>
        </section>
      )}

      {concerns.length > 0 && (
        <section>
          <h2>Who may benefit?</h2>
          <ul>
            {concerns.map((c) => (
              <li key={c.concern_slug}>
                {c.relationship === 'may_worsen' ? 'May worsen: ' : c.relationship === 'preventive' ? 'May help prevent: ' : 'May help with: '}
                {c.concern_name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ingredient.typical_concentration_range && (
        <section>
          <h2>How to use</h2>
          <p>
            Typically formulated at {ingredient.typical_concentration_range}.
            {ingredient.formulation_notes ? ` ${ingredient.formulation_notes}` : ''}
          </p>
        </section>
      )}

      {worksWith.length > 0 && (
        <section>
          <h2>Ingredients it works with</h2>
          <ul>
            {worksWith.map((i) => (
              <li key={i.id}>
                <a href={`/ingredients/${i.other_ingredient_slug}`}>{i.other_ingredient_name}</a> — {INTERACTION_META[i.interaction_type].label}
                {i.explanation && <p>{i.explanation}</p>}
                {i.usage_guidance && <p>{i.usage_guidance}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {useWithCaution.length > 0 && (
        <section>
          <h2>Use with caution</h2>
          <ul>
            {useWithCaution.map((i) => (
              <li key={i.id}>
                <a href={`/ingredients/${i.other_ingredient_slug}`}>{i.other_ingredient_name}</a> — {INTERACTION_META[i.interaction_type].label}
                {i.explanation && <p>{i.explanation}</p>}
                {i.usage_guidance && <p>{i.usage_guidance}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <h2>Real products containing this</h2>
          <ul>
            {products.map((p) => (
              <li key={p.product_id}>
                <a href={`/reviews/${p.product_slug}`}>
                  {p.product_name}
                  {p.brand_name && ` — ${p.brand_name}`}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Sources</h2>
        {allSources.length > 0 ? (
          <SourceCitationList sources={allSources} />
        ) : (
          <p>This profile hasn't been linked to an external source yet — it's marked {ingredient.verification_status.replace('_', ' ')} pending editorial review.</p>
        )}
      </section>

      <IngredientDisclaimer />
    </main>
  )
}
