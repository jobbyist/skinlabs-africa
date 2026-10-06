/**
 * SKYNN AI v2.1 — terminology guard.
 *
 * Fails when a current product-facing surface (UI, data, SEO, emails, intake
 * PDFs) reintroduces a retired SKYNN AI product name. Comments are stripped
 * first, so code comments and internal identifiers (save_starter_analysis,
 * the starter-analysis module, useAdvancedAssessment…) are fine. Historical
 * records are allowlisted by file — they describe what shipped at the time.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import * as client from "@/lib/skynn/terminology";

const ROOT = resolve(import.meta.dir, "../../..");

const SCAN_DIRS = [
  "src",
  "supabase/functions/_shared/email/templates",
  "supabase/functions/_shared/assessment/intake",
  "supabase/functions/_shared/assessment/errors.ts",
];

/** Historical records and the terminology module itself (which names the legacy terms on purpose). */
const ALLOWLIST = new Set([
  "src/pages/Announcements.tsx", // dated release notes
  "src/data/announcements.ts", // the same dated release notes (shared with the ICYMI stories)
  "src/pages/About.tsx", // 2025 roadmap timeline
  "src/data/newsroom.ts", // dated newsroom articles
  "src/lib/skynn/terminology.ts",
]);

const BANNED: Array<[RegExp, string]> = [
  [/\bStarter (Skin )?Analysis\b/i, "use “Basic AI Skin Analysis”"],
  [/\bAI Formulator\b/, "use “SKYNN AI” (/ai-formulator is only a redirect)"],
  [/\bAdvanced Assessment\b/, "use “Advanced AI Dermatology Analysis”"],
  [/\bAdvanced (AI )?Dermatology Report\b/, "use “Advanced AI Dermatology Analysis”"],
  [/^\s*Dermatology Report\b|>\s*Dermatology Report\s*</, "use “Advanced AI Dermatology Analysis”"],
  [/\bAdvanced Reports?\b/, "use “Advanced AI Dermatology Analysis”"],
  [/\bAdvanced Skin Analysis\b/, "use “Advanced AI Dermatology Analysis”"],
  [/\bSKYNN AI Advanced\b(?! AI Dermatology Analysis)/, "use “Advanced AI Dermatology Analysis”"],
  [/\bSkynn AI\b/, "use “SKYNN AI”"],
  [/\bSKYNN\.AI\b|\bSkynnAI\b/, "use “SKYNN AI”"],
  [/\b[Aa]nalysis pass(es)?\b(?![_a-z])/, "use “Analysis Pass” (capitalised)"],
  [/SKYNN AI \(beta\)/, "use “SKYNN AI - v2.2 (beta)”"],
];

const walk = (dir: string): string[] =>
  statSync(dir).isFile() ? [dir] : readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "__tests__" || name === "node_modules" || name === "integrations") return [];
      return walk(full);
    }
    return /\.(tsx?|html)$/.test(name) && !name.endsWith(".test.ts") ? [full] : [];
  });

/** Blanks out // and /* *\/ comments while keeping line numbers. Good enough for this repo's style. */
const stripComments = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, " "));

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));

describe("SKYNN AI terminology (v2.1)", () => {
  test("no retired SKYNN AI product names in current product-facing code", () => {
    const hits: string[] = [];
    for (const file of files) {
      const rel = relative(ROOT, file);
      if (ALLOWLIST.has(rel)) continue;
      const lines = stripComments(readFileSync(file, "utf8")).split("\n");
      lines.forEach((line, i) => {
        for (const [re, hint] of BANNED) {
          if (re.test(line)) hits.push(`${rel}:${i + 1} — ${hint}\n    ${line.trim().slice(0, 160)}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  test("the scan actually covers the SKYNN AI surfaces", () => {
    const rels = files.map((f) => relative(ROOT, f));
    for (const must of [
      "src/components/AIFormulator.tsx",
      "src/pages/AdvancedAssessment.tsx",
      "src/lib/generateSkincarePdf.ts",
      "src/lib/seo-config.ts",
      "supabase/functions/_shared/email/templates/skynn.ts",
      "supabase/functions/_shared/assessment/intake/intakePdf.ts",
    ]) {
      expect(rels).toContain(must);
    }
  });

  test("the edge-function copy of the canonical names matches the app's", () => {
    const edge = readFileSync(join(ROOT, "supabase/functions/_shared/skynn/terminology.ts"), "utf8");
    const edgeValues = Object.fromEntries(
      [...edge.matchAll(/export const (\w+) = "([^"]*)";/g)].map((m) => [m[1], m[2]]),
    );
    expect(Object.keys(edgeValues).length).toBeGreaterThan(5);
    for (const [name, value] of Object.entries(edgeValues)) {
      expect((client as Record<string, unknown>)[name]).toBe(value);
    }
  });

  test("canonical names are exactly as specified for this release", () => {
    expect(client.SKYNN_RELEASE_LABEL).toBe("SKYNN AI - v2.2 (beta)");
    expect(client.BASIC_NAME).toBe("Basic AI Skin Analysis");
    expect(client.ADVANCED_NAME).toBe("Advanced AI Dermatology Analysis");
    expect(client.ANALYSIS_PASS).toBe("Analysis Pass");
    expect(client.analysisPassCount(1)).toBe("1 Analysis Pass");
    expect(client.analysisPassCount(3)).toBe("3 Analysis Passes");
  });
});
