import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '@/lib/content/supabaseServerClient'
import { buildHeadTags } from '@/lib/seo/head'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonLd'
import { siteBreadcrumbTrail } from '@/lib/seo/breadcrumbs'
import { canonicalUrl } from '@/lib/seo/canonical'
import { articleTitle } from '@/lib/seo-config'
import { extractEditorialDisclaimer } from '@/lib/editorialDisclaimer'
import AdSlot from '@/components/AdSlot'
import AdSlotAutorelaxed from '@/components/AdSlotAutorelaxed'
import FaithfulToNature from '@/components/FaithfulToNature'
import BriefingBody from '@/components/briefings/BriefingBody'
import EditorialDisclaimer from '@/components/briefings/EditorialDisclaimer'

// Production SSR route for /briefings/:slug (Briefings is the first content
// type migrated to TanStack Start -- see
// docs/architecture/tanstack-start-production-migration.md). Mirrors the
// real client-side route (src/pages/NewsroomArticle.tsx) and its data
// shape, but renders server-side, using the shared SEO/JSON-LD builders in
// src/lib/seo/* so every future migrated content type produces consistent
// metadata instead of re-deriving it per route. Originated as the Phase 3
// feasibility POC -- see docs/architecture/tanstack-start-briefing-ssr-poc.md
// for that validation history.
//
// Queries the BASE `news_articles` table (not the `news_articles_public`
// view) with an explicit `status = 'published'` filter -- identical to the
// view's own WHERE clause, and covered by the same RLS policy either way --
// specifically to read `updated_at`, which the view does not expose. A real
// migration should likely add updated_at to the view instead of querying
// the base table directly; this route does it explicitly so dateModified
// can be correct, rather than perpetuating the existing json_ld column's
// hardcoded dateModified === datePublished.

interface BriefingRow {
  slug: string
  title: string
  excerpt: string
  key_takeaways: string[]
  publish_date: string
  created_at: string
  updated_at: string
  seo_title: string | null
  seo_description: string | null
  cover_image_url: string | null
  cover_image_alt: string | null
  cover_credit_name: string | null
  cover_credit_url: string | null
  sa_context_tag: string
  source_name: string
  source_url: string
  reading_time: string
  word_count: number
  is_premium: boolean
}

interface InlineImage {
  url: string
  alt?: string
  credit_name?: string
  credit_url?: string
}

const fetchBriefing = createServerFn({ method: 'GET' })
  .validator((slug: unknown) => {
    if (typeof slug !== 'string' || !slug) throw new Error('slug required')
    return slug
  })
  .handler(async ({ data: slug }) => {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('news_articles')
      .select(
        'slug,title,excerpt,key_takeaways,publish_date,created_at,updated_at,seo_title,seo_description,cover_image_url,cover_image_alt,cover_credit_name,cover_credit_url,sa_context_tag,source_name,source_url,reading_time,word_count,is_premium',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (error || !data) return { found: false as const }

    // Same get_article_body RPC the real client page uses (NewsroomArticle.tsx),
    // called here with no user session -- this server client is always
    // anonymous, so it returns the body for a genuinely free/non-premium
    // article (matches what any visitor gets) and correctly withholds it for
    // a premium one (matches what a signed-out visitor gets there too, per
    // get_article_body's own SQL: `IF auth.uid() IS NULL THEN RETURN; END IF;`
    // for a premium row). This is the RPC gate itself deciding visibility,
    // not a bypass of it -- premium briefing bodies are still never exposed
    // to an anonymous crawler/agent here, exactly as intended.
    const { data: bodyRows } = await supabase.rpc('get_article_body', { p_slug: slug })
    const bodyRow = Array.isArray(bodyRows) ? bodyRows[0] : bodyRows
    const rawBody = (bodyRow?.body_markdown as string | null) ?? null
    const { body: cleanedBody, disclaimer } = rawBody
      ? extractEditorialDisclaimer(rawBody)
      : { body: null, disclaimer: null }
    const inlineImages = Array.isArray(bodyRow?.inline_images)
      ? (bodyRow!.inline_images as unknown as InlineImage[])
      : []

    return {
      found: true as const,
      article: data as BriefingRow,
      body: cleanedBody,
      disclaimer,
      inlineImages,
    }
  })

export const Route = createFileRoute('/briefings/$slug')({
  loader: async ({ params }) => {
    const result = await fetchBriefing({ data: params.slug })
    if (!result.found) throw notFound()
    return result
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const a = loaderData.article
    const path = `/briefings/${a.slug}`
    const title = a.seo_title || articleTitle(a.title)
    const description = (a.seo_description || a.excerpt).replace(/\s+/g, ' ').trim().slice(0, 160)
    const datePublished = a.publish_date
    // Real fix vs. the DB's own json_ld column pattern (confirmed via direct
    // inspection of a live row): that column hardcodes dateModified to equal
    // datePublished. Here dateModified is derived from the real updated_at
    // timestamp, so a genuine post-publish edit is reflected correctly.
    const dateModified = a.updated_at ? a.updated_at.slice(0, 10) : datePublished

    const article = articleJsonLd({
      canonicalUrl: canonicalUrl(path),
      headline: a.title,
      description,
      images: a.cover_image_url ? [a.cover_image_url] : undefined,
      datePublished,
      dateModified,
      articleSection: 'The Daily Skinny',
    })

    const breadcrumb = breadcrumbJsonLd(
      siteBreadcrumbTrail([
        { name: 'Briefings', path: '/briefings' },
        { name: a.title, path },
      ]),
    )

    return buildHeadTags(
      {
        title,
        description,
        canonicalPath: path,
        ogType: 'article',
        ogImage: a.cover_image_url ?? undefined,
        publishedTime: datePublished,
        modifiedTime: dateModified,
      },
      [article, breadcrumb],
    )
  },
  component: BriefingPage,
  notFoundComponent: () => (
    <main>
      <h1>Briefing not found</h1>
      <p>This briefing doesn't exist, isn't published, or the slug is wrong.</p>
    </main>
  ),
})

function BriefingPage() {
  const { article: a, body, disclaimer, inlineImages } = Route.useLoaderData()
  return (
    <main>
      <nav aria-label="Breadcrumb">
        <a href="/">SkinLabs</a> {'> '}
        <a href="/briefings">Briefings</a> {'> '}
        <span>{a.title}</span>
      </nav>
      {a.cover_image_url && (
        <img src={a.cover_image_url} alt={a.cover_image_alt || ''} width={1200} height={630} />
      )}
      <h1>{a.title}</h1>
      <p>
        <em>{a.sa_context_tag}</em> · Published {a.publish_date} · {a.reading_time} ·{' '}
        {a.word_count} words
        {a.updated_at.slice(0, 10) !== a.publish_date && (
          <> · Updated {a.updated_at.slice(0, 10)}</>
        )}
      </p>
      <p>{a.excerpt}</p>

      <AdSlot placement="briefing-top" compact />

      <h2>Key takeaways</h2>
      <ul>
        {a.key_takeaways.map((k, i) => (
          <li key={i}>{k}</li>
        ))}
      </ul>

      {/* Real article body -- previously this SSR route (the only server-
          rendered view of this URL, since /briefings/:slug isn't build-time
          prerendered either) never queried or rendered body_markdown at
          all, so a non-JS crawler/agent saw only the excerpt + key
          takeaways above, never the actual article the page's own Article
          JSON-LD claims to describe. body is null either because the
          article genuinely has none yet, or (for a premium briefing) get_article_body
          correctly withheld it from this anonymous server request -- same
          gate a signed-out visitor hits client-side, not a bypass of it. */}
      {body ? (
        <>
          <BriefingBody body={body} />
          {inlineImages.length > 0 && (
            <div>
              {inlineImages.map((img) => (
                <figure key={img.url}>
                  <img src={img.url} alt={img.alt || a.title} loading="lazy" />
                  {img.credit_name && (
                    <figcaption>
                      Photo by{' '}
                      {img.credit_url ? <a href={img.credit_url}>{img.credit_name}</a> : img.credit_name} on
                      Unsplash
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
          {disclaimer && <EditorialDisclaimer text={disclaimer} />}
        </>
      ) : a.is_premium ? (
        <p>
          This is a premium briefing. <a href="/pricing">Sign in or see membership plans</a> to read the full
          article -- free accounts get several full briefings every week.
        </p>
      ) : null}

      <FaithfulToNature placement="briefing-shop" />

      <p>
        Source: {a.source_name} (<a href={a.source_url}>{a.source_url}</a>)
      </p>
      {a.cover_credit_name && (
        <p>
          <small>
            Cover image: {a.cover_credit_name}
            {a.cover_credit_url ? <> — <a href={a.cover_credit_url}>credit</a></> : null}
          </small>
        </p>
      )}

      <AdSlot placement="briefing-bottom" compact />

      <AdSlotAutorelaxed placement="briefing-footer" compact />
    </main>
  )
}
