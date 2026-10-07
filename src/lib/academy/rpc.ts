import { supabase } from "@/integrations/supabase/client";

/**
 * Academy RPCs aren't in the generated `types.ts` until 20261007100000_academy_foundations.sql is applied and the
 * types are regenerated (see docs/academy/changelog). Until then calls go through this one untyped shim; after that,
 * delete it and call `supabase.rpc(...)` directly (types:check then guards the names).
 */
type UntypedRpc = (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

export const academyRpc: UntypedRpc = (fn, args) => (supabase.rpc as unknown as UntypedRpc).call(supabase, fn, args);
