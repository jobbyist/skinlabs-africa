/**
 * SKYNN AI v2.1 — hard requirement: skin tone is NEVER inferred from a photo.
 *
 * The only acceptable Monk Skin Tone source is the member's own optional
 * selection (mst_source = 'user_reported'). These tests pin that down at every
 * layer we can check without a browser: the deterministic engine, the save
 * payload, the SQL constraint, the (retired) model path and every model prompt
 * in the edge functions.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { assembleStarterAnalysisResult } from "@/lib/starter-analysis/resultEngine";
import { buildStarterSavePayload } from "@/lib/starter-analysis/persistence";
import type { ChangeContext } from "@/lib/starter-analysis/types";

const ROOT = resolve(import.meta.dir, "../../..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const answers: Record<string, number> = {
  q1: 1, q2: 2, q3: 2, q4: 2, q5: 1, q6: 2, q7: 2, q8: 2, q9: 0, q10: 1,
  q11: 2, q12: 1, q13: 2, q14: 1, q15: 0, q16: 1, q17: 3, q18: 3, q19: 2, q20: 3,
};
const NO_CONTEXT: ChangeContext = { status: null, detail: null };
const assemble = (mstTone: number | null, hasPhoto: boolean) =>
  assembleStarterAnalysisResult({
    analysisId: "no-inference",
    answers,
    mstTone,
    hasPhoto,
    context: NO_CONTEXT,
    priorityPreference: null,
    revealProducts: true,
  });

describe("Basic AI Skin Analysis: a photo can never set Monk Skin Tone", () => {
  test("photo + no MST → MST stays null (not guessed)", () => {
    const r = assemble(null, true);
    expect(r.profile.mstTone).toBeNull();
    expect(JSON.stringify(r)).not.toMatch(/"mstTone":\s*\d/);
  });

  test("photo presence changes nothing, not even completeness", () => {
    const withPhoto = assemble(null, true);
    const without = assemble(null, false);
    expect(withPhoto.profile).toEqual(without.profile);
    expect(withPhoto.priorities).toEqual(without.priorities);
    expect(withPhoto.groundedRoutine).toEqual(without.groundedRoutine);
    expect(withPhoto.completeness).toEqual(without.completeness);
  });

  test("a self-reported MST is carried through exactly as chosen", () => {
    expect(assemble(7, true).profile.mstTone).toBe(7);
    expect(assemble(7, false).profile.mstTone).toBe(7);
  });

  test("the save payload carries the self-reported value only, and never image bytes", () => {
    const skipped = buildStarterSavePayload({ result: assemble(null, true), contactName: null, contactWhatsApp: null, variantKey: "control" });
    expect(skipped.p_mst_tone).toBeUndefined();
    expect(skipped.p_photo_storage_path).toBeUndefined();
    expect(JSON.stringify(skipped)).not.toContain("data:image");
    const chosen = buildStarterSavePayload({ result: assemble(4, true), contactName: null, contactWhatsApp: null, variantKey: "control" });
    expect(chosen.p_mst_tone).toBe(4);
  });
});

describe("no code path can record a model- or photo-derived MST", () => {
  test("the DB constraint only allows user_reported", () => {
    const sql = read("supabase/migrations/20260928140000_skynn_v21_basic_limit_and_hardening.sql");
    expect(sql).toContain("CHECK (mst_source IS NULL OR mst_source = 'user_reported')");
  });

  test("save_starter_analysis derives mst_source from the self-reported tone only", () => {
    const sql = read("supabase/migrations/20260928140000_skynn_v21_basic_limit_and_hardening.sql");
    expect(sql).toContain("CASE WHEN p_mst_tone IS NOT NULL THEN 'user_reported' ELSE NULL END");
    expect(sql).not.toContain("IN ('user_reported', 'model_estimated')");
  });

  test("the SKYNN AI UI never uploads the Basic photo or sends it to a function", () => {
    const ui = read("src/components/AIFormulator.tsx");
    expect(ui).not.toContain("uploadAnalysisPhoto");
    expect(ui).not.toContain('functions.invoke("skincare-ai"');
    expect(ui).not.toMatch(/skinImage[^\n]*invoke|invoke[^\n]*skinImage/);
  });

  test("the legacy photo-to-model path is retired (410 stub)", () => {
    const fn = read("supabase/functions/skincare-ai/index.ts");
    expect(fn).toContain("status: 410");
    expect(fn).not.toContain("image_url");
    expect(fn).not.toMatch(/fetch\(/);
  });
});

describe("no model prompt asks for skin tone from an image", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) return name === "__tests__" ? [] : walk(full);
      return name.endsWith(".ts") ? [full] : [];
    });
  // Every SKYNN AI model-facing surface. (Other pipelines — product reviews,
  // briefings — legitimately send product photos, never a person's skin.)
  const files = [
    "supabase/functions/skincare-ai",
    "supabase/functions/skynn-advanced-assessment",
    "supabase/functions/skynn-advanced-worker",
    "supabase/functions/_shared/assessment",
    "supabase/functions/_shared/skynn",
  ].flatMap((d) => walk(join(ROOT, d)));
  const code = (f: string) =>
    readFileSync(f, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");

  test("no edge function sends an image to a model", () => {
    expect(files.length).toBeGreaterThan(10);
    const offenders = files.filter((f) => /image_url|inline_data|inlineData|"type":\s*"image"|type: "image"/.test(code(f)));
    expect(offenders).toEqual([]);
  });

  test("no prompt instructs a model to estimate or infer tone / Fitzpatrick / MST", () => {
    const INSTRUCTION = /\b(estimate|infer|detect|classify|determine|guess)\w*\b[^\n.]{0,60}(skin tone|fitzpatrick|monk skin tone|\bmst\b|phototype)/i;
    const offenders: string[] = [];
    for (const f of files) {
      code(f).split("\n").forEach((line, i) => {
        // "never infer …" / "not inferred" / "never estimate" are the guard rails themselves.
        if (INSTRUCTION.test(line) && !/\b(never|not|don't|do not|must not|no)\b[^\n]{0,40}(estimate|infer|detect|classify|determine|guess)/i.test(line)) {
          offenders.push(`${f.replace(ROOT + "/", "")}:${i + 1}: ${line.trim().slice(0, 140)}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe("public and legal copy never claims photos are uploaded or analysed", () => {
  const surfaces = [
    "src/pages/PrivacyPolicy.tsx",
    "src/pages/TermsOfService.tsx",
    "src/pages/CookiePolicy.tsx",
    "src/pages/RefundPolicy.tsx",
    "src/pages/Whitepaper.tsx",
    "src/data/faq.ts",
    "public/llms.txt",
    "supabase/functions/_shared/email/templates/membership.ts",
    "supabase/functions/_shared/email/templates/skynn.ts",
  ];
  const banned: RegExp[] = [
    /images? (that )?you upload/i,
    /before (any )?image (capture|is captured)/i,
    /raw (skin )?images/i,
    /image[- ]capture state/i,
    /short (retention of raw images|image retention)/i,
    /visible-characteristic assessment/i,
    /generated from those images/i,
    /photo \+ self-reported/i,
    /weekly live AI/i,
    /credit packs?/i,
  ];

  for (const file of surfaces) {
    test(file, () => {
      const text = read(file);
      for (const pattern of banned) expect(text, `${file} matches ${pattern}`).not.toMatch(pattern);
    });
  }

  test("the completeness score doesn't reward a photo", () => {
    const src = read("src/data/formulaResults.ts");
    expect(src).not.toContain("Photo provided");
  });
});
