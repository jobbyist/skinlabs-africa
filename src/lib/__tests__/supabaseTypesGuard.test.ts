import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { compareTypeSurfaces, readTypeSurface } from "../../../scripts/lib/supabaseTypesGuard";

const SAMPLE = `export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          onboarding_completed_at: string | null
        }
        Insert: {
          user_id: string
        }
      }
    }
    Views: {
      v_x: {
        Row: {
          a: number | null
        }
      }
    }
    Functions: {
      start_free_trial: {
        Args: { p_plan: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
  }
}`;

describe("supabase types guard", () => {
  test("reads tables, view columns and functions from a generated file", () => {
    const s = readTypeSurface(SAMPLE);
    expect([...s.relations].sort()).toEqual(["profiles", "v_x"]);
    expect(s.columns.has("profiles.onboarding_completed_at")).toBe(true);
    expect(s.columns.has("v_x.a")).toBe(true);
    expect(s.functions.has("start_free_trial")).toBe(true);
  });

  test("a regressed file (lost column, table, function) fails; additions pass", () => {
    const base = readTypeSurface(SAMPLE);
    const regressed = readTypeSurface(SAMPLE.replace("          onboarding_completed_at: string | null\n", "").replace(/ {6}start_free_trial[\s\S]*?\n {6}\}\n/, ""));
    const r = compareTypeSurfaces(base, regressed);
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("column profiles.onboarding_completed_at");
    expect(r.missing).toContain("function start_free_trial()");
    const grown = readTypeSurface(SAMPLE.replace("          user_id: string\n          onboarding", "          user_id: string\n          extra: string\n          onboarding"));
    expect(compareTypeSurfaces(base, grown).ok).toBe(true);
  });

  test("the committed types.ts still contains everything in the committed baseline", () => {
    const current = readTypeSurface(readFileSync("src/integrations/supabase/types.ts", "utf8"));
    const baseline = readTypeSurface(readFileSync("supabase/types.baseline.ts", "utf8"));
    expect(baseline.relations.size).toBeGreaterThan(50);
    expect(baseline.functions.size).toBeGreaterThan(20);
    expect(compareTypeSurfaces(baseline, current).missing).toEqual([]);
  });
});
