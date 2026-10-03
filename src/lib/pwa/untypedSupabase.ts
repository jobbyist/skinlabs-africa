import { supabase } from "@/integrations/supabase/client";

/**
 * The push / preferences / playback-progress objects come from migration
 * 20261005100000_pwa_push_and_playback.sql, which is in the repo but not yet in the
 * generated src/integrations/supabase/types.ts (regenerated from the live DB after the
 * migration is applied — never hand-edited, see CLAUDE.md). Until then this narrow,
 * untyped view is the only place that talks to them. After regenerating types, replace
 * its uses with the typed client and delete this file.
 */
interface UntypedError {
  code?: string;
  message: string;
}
interface UntypedResult<T> {
  data: T | null;
  error: UntypedError | null;
}
interface UntypedQuery<T> extends PromiseLike<UntypedResult<T>> {
  select(columns?: string): UntypedQuery<T>;
  eq(column: string, value: unknown): UntypedQuery<T>;
  in(column: string, values: unknown[]): UntypedQuery<T>;
  maybeSingle(): PromiseLike<UntypedResult<T>>;
  upsert(values: Record<string, unknown>, options?: { onConflict?: string }): PromiseLike<UntypedResult<T>>;
  delete(): UntypedQuery<T>;
}
interface UntypedClient {
  rpc<T = unknown>(fn: string, args?: Record<string, unknown>): PromiseLike<UntypedResult<T>>;
  from<T = unknown>(table: string): UntypedQuery<T>;
}

export const untypedSupabase = supabase as unknown as UntypedClient;

/** PostgREST / Postgres codes that mean "that function/table isn't there (yet)" — a deploy-order issue, not a user error. */
export const isMissingBackend = (error: UntypedError | null): boolean =>
  Boolean(error && (error.code === "PGRST202" || error.code === "PGRST205" || error.code === "42883" || error.code === "42P01"));
