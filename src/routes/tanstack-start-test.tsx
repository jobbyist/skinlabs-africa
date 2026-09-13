import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'

// Repo-root coexistence test route (Phase 2). Not part of the production
// app -- built only via the separate `build:tanstack-start-test` script /
// vite.tanstack-start.config.ts, never through the real vite.config.ts or
// npm run build. Proves TanStack Start SSR works from the actual repo root
// against the real dependency graph, reusing the exact same
// VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY convention the rest of
// this app already relies on (client-side and in Node build scripts).
const fetchIngredientCount = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return { ok: false, error: 'missing VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY' }
  }
  const supabase = createClient(url, key)
  const { data, error, count } = await supabase
    .from('ingredients')
    .select('slug', { count: 'exact' })
    .limit(3)
  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true, count, sample: data }
})

export const Route = createFileRoute('/tanstack-start-test')({
  loader: async () => fetchIngredientCount(),
  component: TanStackStartTest,
})

function TanStackStartTest() {
  const result = Route.useLoaderData()
  return (
    <main>
      <h1>TanStack Start repo-root coexistence test</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </main>
  )
}
