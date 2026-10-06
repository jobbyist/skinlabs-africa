/**
 * Guard for src/integrations/supabase/types.ts.
 *
 *   bun run scripts/check-supabase-types.ts            check; exit 1 if the file lost anything
 *   bun run scripts/check-supabase-types.ts --fix      check; if it lost anything, restore the baseline
 *   bun run scripts/check-supabase-types.ts --update-baseline
 *        after regenerating types from the live database: verify nothing was lost, then adopt the
 *        current file as the new baseline (supabase/types.baseline.ts)
 *
 * Why: Lovable's sync overwrites types.ts with an older generation (see CLAUDE.md). The file can't be
 * made read-only for Lovable, so this detects the loss and repairs it: in `npm run build` (--fix), in
 * `npm run lint` / CI (check), in a git pre-commit hook, and in .github/workflows/types-guard.yml,
 * which commits the restore when someone pushes a regressed file to main.
 */
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { compareTypeSurfaces, readTypeSurface } from "./lib/supabaseTypesGuard";

const TYPES = "src/integrations/supabase/types.ts";
const BASELINE = "supabase/types.baseline.ts";
const args = new Set(process.argv.slice(2));

const check = () => {
  if (!existsSync(BASELINE)) {
    console.error(`[types-guard] ${BASELINE} is missing.`);
    process.exit(2);
  }
  const current = existsSync(TYPES) ? readFileSync(TYPES, "utf8") : "";
  return compareTypeSurfaces(readTypeSurface(readFileSync(BASELINE, "utf8")), readTypeSurface(current));
};

const report = (r: ReturnType<typeof check>) => {
  console.error(`[types-guard] ${r.summary}`);
  for (const m of r.missing.slice(0, 25)) console.error(`  - ${m}`);
  if (r.missing.length > 25) console.error(`  … and ${r.missing.length - 25} more`);
};

let result = check();

if (args.has("--update-baseline")) {
  if (!result.ok) {
    report(result);
    console.error("[types-guard] Refusing to adopt a file that lost items. Regenerate from the live database first.");
    process.exit(1);
  }
  copyFileSync(TYPES, BASELINE);
  console.log("[types-guard] baseline updated from the current types.ts");
  process.exit(0);
}

if (!result.ok && args.has("--fix")) {
  report(result);
  copyFileSync(BASELINE, TYPES);
  result = check();
  console.error(result.ok ? "[types-guard] restored types.ts from the baseline" : "[types-guard] restore failed");
  process.exit(result.ok ? 0 : 1);
}

if (!result.ok) {
  report(result);
  console.error("[types-guard] Fix: `npm run types:fix` (restores the baseline), or regenerate from the live DB and run `npm run types:baseline`.");
  process.exit(1);
}
console.log(`[types-guard] ok (${result.summary})`);
