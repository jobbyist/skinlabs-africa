/**
 * SkinLabs Academy — accreditation-wording guard.
 *
 * 1. The regex in terminology.ts matches the publish gate in the foundations migration.
 * 2. No current Academy surface (src/**\/academy*, Academy components/pages/routes, the /learn placeholder)
 *    claims SAQA / NQF / QCTO / SETA / CPD accreditation, a qualification or a diploma. Comments are ignored;
 *    terminology.ts itself (which names the terms on purpose) is allowlisted.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import {
  ACCREDITATION_CLAIM_SOURCE,
  ACADEMY_ALLOWED_DESCRIPTORS,
  accreditationLine,
  findAccreditationClaims,
} from "@/lib/academy/terminology";

const ROOT = resolve(import.meta.dir, "../../..");
const MIGRATION = "supabase/migrations/20261007100000_academy_foundations.sql";

const SCAN = [
  "src/lib/academy",
  "src/components/academy",
  "src/pages/academy",
  "src/hooks/use-academy-config.ts",
  "src/hooks/use-academy-roles.ts",
  "src/pages/ComingSoon.tsx",
];
const ALLOWLIST = new Set(["src/lib/academy/terminology.ts"]);

const walk = (p: string): string[] => {
  if (!existsSync(p)) return [];
  if (statSync(p).isFile()) return [p];
  return readdirSync(p).flatMap((n) => {
    const full = join(p, n);
    return statSync(full).isDirectory() ? walk(full) : /\.(tsx?|json)$/.test(n) && !n.endsWith(".test.ts") ? [full] : [];
  });
};

const stripComments = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, " "));

describe("Academy accreditation wording", () => {
  test("the TypeScript pattern is the same one the publish gate uses in SQL", () => {
    const sql = readFileSync(join(ROOT, MIGRATION), "utf8");
    const m = sql.match(/~ '\\m\(([^']+)\)\\M'/);
    expect(m).not.toBeNull();
    const sqlAlternatives = m![1];
    const tsAlternatives = ACCREDITATION_CLAIM_SOURCE.replace("\\b(", "").replace(")\\b", "");
    expect(tsAlternatives).toBe(sqlAlternatives);
    expect(sql).toContain("accreditation-ready");
  });

  test("flags claims, allows 'accreditation-ready' and the approved descriptors", () => {
    expect(findAccreditationClaims("A SAQA accredited diploma")).toEqual(["saqa", "accredited", "diploma"]);
    expect(findAccreditationClaims("NQF level 5 qualification")).toEqual(["nqf", "qualification"]);
    expect(findAccreditationClaims("An accreditation-ready curriculum")).toEqual([]);
    for (const d of ACADEMY_ALLOWED_DESCRIPTORS) expect(findAccreditationClaims(d)).toEqual([]);
  });

  test("an accreditation line is printed only from verified rows, never from nothing", () => {
    expect(accreditationLine(null)).toBeNull();
    expect(accreditationLine([])).toBeNull();
    expect(
      accreditationLine([{ scope: "course", scheme: "QCTO", body_name: null, reference_number: null, nqf_level: 5, valid_from: null, valid_to: null }]),
    ).toBeNull();
    expect(
      accreditationLine([{ scope: "course", scheme: "QCTO", body_name: "QCTO", reference_number: "REF-1", nqf_level: 5, valid_from: "2026-01-01", valid_to: null }]),
    ).toBe("QCTO — QCTO, ref. REF-1, NQF level 5");
  });

  test("no Academy surface claims accreditation or a qualification", () => {
    const hits: string[] = [];
    for (const file of SCAN.flatMap((p) => walk(join(ROOT, p)))) {
      const rel = relative(ROOT, file);
      if (ALLOWLIST.has(rel)) continue;
      stripComments(readFileSync(file, "utf8"))
        .split("\n")
        .forEach((line, i) => {
          const found = findAccreditationClaims(line);
          if (found.length) hits.push(`${rel}:${i + 1} → ${found.join(", ")}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
