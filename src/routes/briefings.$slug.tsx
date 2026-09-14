import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'

// Briefing SSR proof-of-concept (Phase 3 of the TanStack Start feasibility
// work). Mirrors the real /briefings/:slug route (src/pages/NewsroomArticle.tsx)
// but renders server-side via TanStack Start instead of client-side
// react-router + a post-mount Supabase fetch. Not wired into the real app --
// only reachable through the separate build:tanstack-start-test pipeline.
// See docs/architecture/tanstack-start-briefing-ssr-poc.md.
//
// Queries the BASE `news_articles` table (not the `news_articles_public`
// view) with an explicit `status = 'published'` filter -- identical to the
// view's own WHERE clause, and covered by the same RLS policy either way --
// specifically to read `updated_at`, which the view does not expose. A real
// migration should likely add updated_at to the view instead of querying
// the base table directly; this POC does it explicitly so dateModified can
// be correct, rather than perpetuating the existing json_ld column's
// hardcoded dateModified === datePublished.

const SITE_URL = 'https://skinlabs.co.za'
const BRAND = 'SkinLabs®'

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

// Same fallback pattern as src/integrations/supabase/client.ts (public-by-
// design production values, RLS-enforced) -- applied here because it was
// empirically confirmed that this Preview deployment's environment does not
// reliably expose VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY to a
// serverless function's process.env at runtime, matching the exact gap that
// client.ts's own fallback comment already anticipates ("Avoid a hard crash
// ... when Vercel/build env vars are missing").
const FALLBACK_SUPABASE_URL = 'https://gnkpzijxuciiaamakgzm.supabase.co'
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdua3B6aWp4dWNpaWFhbWFrZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MjMzOTksImV4cCI6MjEwNDM5OTM5OX0.JFSg0IUBH1UPbKsqxctVRoPV2__SZw7u8OBbvHdId4U'

const fetchBriefing = createServerFn({ method: 'GET' })
  .validator((slug: unknown) => {
    if (typeof slug !== 'string' || !slug) throw new Error('slug required')
    return slug
  })
  .handler(async ({ data: slug }) => {
    const url = process.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY
    const supabase = createClient(url, key)
    const { data, error } = await supabase
      .from('news_articles')
      .select(
        'slug,title,excerpt,key_takeaways,publish_date,created_at,updated_at,seo_title,seo_description,cover_image_url,cover_image_alt,cover_credit_name,cover_credit_url,sa_context_tag,source_name,source_url,reading_time,word_count,is_premium',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (error || !data) return { found: false as const }
    return { found: true as const, article: data as BriefingRow }
  })

export const Route = createFileRoute('/briefings/$slug')({
  loader: async ({ params }) => {
    const result = await fetchBriefing({ data: params.slug })
    if (!result.found) throw notFound()
    return result.article
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const a = loaderData
    const path = `/briefings/${a.slug}`
    const canonicalUrl = `${SITE_URL}${path}`
    const title = a.seo_title || `${a.title} | The Daily Skinny by ${BRAND}`
    const description = (a.seo_description || a.excerpt).replace(/\s+/g, ' ').trim().slice(0, 160)
    const ogImage = a.cover_image_url || `${SITE_URL}/og-image.png`
    const datePublished = a.publish_date
    // Real fix vs. the DB's own json_ld column pattern (confirmed via direct
    // inspection of a live row): that column hardcodes dateModified to equal
    // datePublished. Here dateModified is derived from the real updated_at
    // timestamp, so a genuine post-publish edit is reflected correctly.
    const dateModified = a.updated_at ? a.updated_at.slice(0, 10) : datePublished

    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      headline: a.title,
      description,
      image: a.cover_image_url ? [a.cover_image_url] : undefined,
      datePublished,
      dateModified,
      author: { '@type': 'Organization', name: BRAND, url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: BRAND,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` },
      },
      articleSection: 'The Daily Skinny',
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SkinLabs', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Briefings', item: `${SITE_URL}/briefings` },
        { '@type': 'ListItem', position: 3, name: a.title, item: canonicalUrl },
      ],
    }

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title },
        { name: 'description', content: description },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: ogImage },
        { property: 'og:site_name', content: BRAND },
        { property: 'article:published_time', content: datePublished },
        { property: 'article:modified_time', content: dateModified },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(articleJsonLd) },
        { type: 'application/ld+json', children: JSON.stringify(breadcrumbJsonLd) },
      ],
    }
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
  const a = Route.useLoaderData()
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
      <h2>Key takeaways</h2>
      <ul>
        {a.key_takeaways.map((k, i) => (
          <li key={i}>{k}</li>
        ))}
      </ul>
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
    </main>
  )
}
