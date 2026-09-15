import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'

// Server-only fn: process.env read here must NOT require the VITE_ prefix,
// since this module never ships to the client bundle. This directly tests
// whether TanStack Start's server/client env-var split conflicts with the
// root app's existing dual VITE_-prefixed usage (client AND Node build
// scripts read the same VITE_ vars today).
const fetchIngredientCount = createServerFn({ method: 'GET' }).handler(async () => {
  // Reuses the SAME env var names the root app already relies on (both
  // client-side via import.meta.env and server-side via process.env in its
  // build scripts), to test whether that existing VITE_-prefixed convention
  // is readable from a TanStack Start server fn without changes. Falls back
  // to unprefixed names in case the deployed project only has those set.
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
  const envVarsSeen = Object.keys(process.env).filter((k) => k.includes('SUPABASE'))
  if (!url || !key) {
    return {
      ok: false,
      error: 'missing server env vars (checked VITE_SUPABASE_URL/SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY/SUPABASE_PUBLISHABLE_KEY)',
      envVarsSeen,
    }
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

export const Route = createFileRoute('/supabase-check')({
  loader: async () => fetchIngredientCount(),
  component: SupabaseCheck,
})

function SupabaseCheck() {
  const result = Route.useLoaderData()
  return (
    <main>
      <h1>Supabase SSR coexistence check</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </main>
  )
}
