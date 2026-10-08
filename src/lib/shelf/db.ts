import { supabase } from "@/integrations/supabase/client";
import type { ActiveTag, ShelfCategory } from "@/lib/shelf/pao";

export interface ShelfRow {
  id: string;
  name: string;
  brand: string | null;
  category: ShelfCategory;
  actives: ActiveTag[];
  opened_on: string;
  pao_months: number;
  size_ml: number | null;
  amount_per_use_ml: number | null;
  uses_per_week: number | null;
  routine_step_id: string | null;
  looks_oxidised: boolean;
  finished_on: string | null;
}

export type ShelfInput = Omit<ShelfRow, "id" | "finished_on" | "looks_oxidised"> & { looks_oxidised?: boolean };

/**
 * `shelf_items` ships in migration 20261008100000 and is not in the generated types until it is applied and `types.ts`
 * is regenerated, so this narrow, untyped shim is the only place that names it.
 */
type Result<T> = Promise<{ data: T | null; error: { code?: string; message: string } | null }>;
interface Table {
  select: (cols: string) => { is: (c: string, v: null) => { order: (c: string, o: { ascending: boolean }) => Result<ShelfRow[]> } };
  insert: (row: object) => Result<null>;
  update: (row: object) => { eq: (c: string, v: string) => Result<null> };
  delete: () => { eq: (c: string, v: string) => Result<null> };
}
const table = () => (supabase as unknown as { from: (t: string) => Table }).from("shelf_items");

const COLUMNS = "id, name, brand, category, actives, opened_on, pao_months, size_ml, amount_per_use_ml, uses_per_week, routine_step_id, looks_oxidised, finished_on";

/** The table not existing yet (migration pending) is a quiet "feature unavailable", never an error toast. */
export const isTableMissing = (error: { code?: string } | null) => error?.code === "42P01" || error?.code === "PGRST205";

export const listShelf = async (): Promise<ShelfRow[] | "unavailable"> => {
  const { data, error } = await table().select(COLUMNS).is("finished_on", null).order("opened_on", { ascending: false });
  if (isTableMissing(error)) return "unavailable";
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const addShelfItem = async (userId: string, input: ShelfInput) => {
  const { error } = await table().insert({ ...input, user_id: userId });
  if (error) throw new Error(error.message);
};

export const updateShelfItem = async (id: string, patch: Partial<ShelfRow>) => {
  const { error } = await table().update(patch).eq("id", id);
  if (error) throw new Error(error.message);
};

export const deleteShelfItem = async (id: string) => {
  const { error } = await table().delete().eq("id", id);
  if (error) throw new Error(error.message);
};
