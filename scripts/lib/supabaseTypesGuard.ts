/**
 * Pure helpers for the Supabase types guard (scripts/check-supabase-types.ts).
 *
 * src/integrations/supabase/types.ts is generated from the live database, but Lovable's
 * sync keeps overwriting it with an older generation (dropping tables, columns and RPCs
 * the app depends on, which breaks `tsc`). The guard compares it with a committed
 * baseline and fails when anything the baseline has is missing. Additions are fine, so a
 * newer generation never trips it.
 */

export type TypeSurface = {
  /** `table.column` for every Row column of every table and view. */
  columns: Set<string>;
  /** Function (RPC) names. */
  functions: Set<string>;
  /** Table and view names. */
  relations: Set<string>;
};

const SECTION = /^ {4}(Tables|Views|Functions|Enums|CompositeTypes): \{$/;

/** Reads the public schema surface out of a generated types file (indent-based; the generator's format is stable). */
export const readTypeSurface = (source: string): TypeSurface => {
  const columns = new Set<string>();
  const functions = new Set<string>();
  const relations = new Set<string>();
  let section: string | null = null;
  let relation: string | null = null;
  let inRow = false;
  let inPublic = false;

  for (const line of source.split("\n")) {
    if (/^ {2}public: \{$/.test(line)) {
      inPublic = true;
      continue;
    }
    if (/^ {2}[a-z_]+: \{$/.test(line) && !/^ {2}public: \{$/.test(line)) inPublic = false;
    if (!inPublic) continue;

    const sec = SECTION.exec(line);
    if (sec) {
      section = sec[1];
      relation = null;
      inRow = false;
      continue;
    }
    if (!section) continue;

    const item = /^ {6}([A-Za-z0-9_]+): \{$/.exec(line);
    if (item) {
      relation = item[1];
      inRow = false;
      if (section === "Tables" || section === "Views") relations.add(relation);
      if (section === "Functions") functions.add(relation);
      continue;
    }
    if ((section === "Tables" || section === "Views") && relation) {
      if (/^ {8}Row: \{$/.test(line)) {
        inRow = true;
        continue;
      }
      if (inRow) {
        if (/^ {8}\}$/.test(line)) {
          inRow = false;
          continue;
        }
        const col = /^ {10}([A-Za-z0-9_]+)\??:/.exec(line);
        if (col) columns.add(`${relation}.${col[1]}`);
      }
    }
  }
  return { columns, functions, relations };
};

export type GuardResult = { ok: boolean; missing: string[]; summary: string };

/** Everything in `baseline` must still be in `current`. */
export const compareTypeSurfaces = (baseline: TypeSurface, current: TypeSurface): GuardResult => {
  const missing: string[] = [];
  for (const r of baseline.relations) if (!current.relations.has(r)) missing.push(`table/view ${r}`);
  for (const f of baseline.functions) if (!current.functions.has(f)) missing.push(`function ${f}()`);
  for (const c of baseline.columns) {
    const table = c.split(".")[0];
    // A missing table is already reported once; don't also list every column of it.
    if (current.relations.has(table) && !current.columns.has(c)) missing.push(`column ${c}`);
  }
  return {
    ok: missing.length === 0,
    missing,
    summary: missing.length === 0 ? "types.ts contains everything in the baseline" : `types.ts is missing ${missing.length} item(s) the baseline has`,
  };
};
