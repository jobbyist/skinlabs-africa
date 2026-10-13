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

const COLUMNS = "id, name, brand, category, actives, opened_on, pao_months, size_ml, amount_per_use_ml, uses_per_week, routine_step_id, looks_oxidised, finished_on";

/** The table not existing yet (migration pending) is a quiet "feature unavailable", never an error toast. */
export const isTableMissing = (error: { code?: string } | null) => error?.code === "42P01" || error?.code === "PGRST205";

export const listShelf = async (): Promise<ShelfRow[] | "unavailable"> => {
  const { data, error } = await supabase.from("shelf_items").select(COLUMNS).is("finished_on", null).order("opened_on", { ascending: false });
  if (isTableMissing(error)) return "unavailable";
  if (error) throw new Error(error.message);
  return (data ?? []) as ShelfRow[];
};

export const addShelfItem = async (userId: string, input: ShelfInput) => {
  const { error } = await supabase.from("shelf_items").insert({ ...input, user_id: userId });
  if (error) throw new Error(error.message);
};

export const updateShelfItem = async (id: string, patch: Partial<ShelfRow>) => {
  const { error } = await supabase.from("shelf_items").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
};

export const deleteShelfItem = async (id: string) => {
  const { error } = await supabase.from("shelf_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
};
