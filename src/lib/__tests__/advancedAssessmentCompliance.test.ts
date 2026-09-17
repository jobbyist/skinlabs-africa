import { describe, expect, test } from "bun:test";
import { scanComplianceFlags, extractReportText } from "../../../supabase/functions/_shared/assessment/compliance";

describe("scanComplianceFlags", () => {
  test("clean text produces no flags", () => {
    expect(scanComplianceFlags("Your skin shows signs of dryness and mild redness.")).toEqual([]);
  });

  test("flags a named diagnosis case-insensitively", () => {
    expect(scanComplianceFlags("This looks like Rosacea.")).toEqual(["named_diagnosis:rosacea"]);
  });

  test("flags a multi-word diagnosis with underscored key", () => {
    expect(scanComplianceFlags("This could be fungal acne.")).toEqual(["named_diagnosis:fungal_acne"]);
  });

  test("can flag multiple distinct diagnoses in one text", () => {
    const flags = scanComplianceFlags("Possibly eczema or psoriasis.");
    expect(flags).toContain("named_diagnosis:eczema");
    expect(flags).toContain("named_diagnosis:psoriasis");
  });
});

describe("extractReportText", () => {
  test("flattens nested strings, arrays and objects into scannable text", () => {
    const report = {
      summary: "Has rosacea-like redness.",
      nested: { list: ["stinging", "eczema-like flare"] },
      numbers: 5,
    };
    const text = extractReportText(report);
    expect(text).toContain("rosacea");
    expect(text).toContain("eczema");
    expect(scanComplianceFlags(text).sort()).toEqual(["named_diagnosis:eczema", "named_diagnosis:rosacea"]);
  });
});
