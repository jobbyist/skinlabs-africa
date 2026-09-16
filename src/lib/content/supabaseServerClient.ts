import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Same fallback pattern as src/integrations/supabase/client.ts (public-by-
 * design, RLS-enforced production values) -- reused here rather than
 * reinvented, because it was empirically confirmed during the Briefing SSR
 * POC (docs/architecture/tanstack-start-briefing-ssr-poc.md) that a Vercel
 * Preview deployment's serverless function does not reliably expose
 * VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY to `process.env` at
 * runtime.
 */
const FALLBACK_SUPABASE_URL = "https://gnkpzijxuciiaamakgzm.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdua3B6aWp4dWNpaWFhbWFrZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MjMzOTksImV4cCI6MjEwNDM5OTM5OX0.JFSg0IUBH1UPbKsqxctVRoPV2__SZw7u8OBbvHdId4U";

/**
 * A read-only, publishable-key Supabase client for use inside TanStack Start
 * server functions (`createServerFn(...).handler(...)`). Every SSR content
 * loader should create its client via this factory rather than
 * hardcoding the fallback pair again. Typed with the same `Database`
 * generic as the client-side `supabase` export (src/integrations/supabase/
 * client.ts) -- without it, supabase-js falls back to its generic
 * select-string type inference, which can't resolve a joined relation's
 * real one-to-many vs many-to-one cardinality (confirmed while building
 * the Ingredients SSR route's nested self-join query) and defaults it to
 * an array, producing spurious cast errors on code that's otherwise a
 * faithful copy of an already-typed client-side query.
 */
export function createSupabaseServerClient() {
  const url = process.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  return createClient<Database>(url, key);
}
