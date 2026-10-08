import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../supabase/types.baseline";
import { supabase as generatedClient } from "./client";
export type { Database } from "../../../supabase/types.baseline";

// Reuse the existing connection, storage and session. Only the compile-time
// schema changes: the owner-maintained production baseline is authoritative.
export const supabase = generatedClient as unknown as SupabaseClient<Database>;