import { describe, expect, test } from "bun:test";
import { selectEvidenceForTopics, validateCitedEvidence, type EvidenceRow } from "../../../supabase/functions/_shared/assessment/evidence";
import type { EvidenceReference } from "../../../supabase/functions/_shared/assessment/types";

const rows: EvidenceRow[] = [
  { id: "e1", title: "Retinoid guidance", publisher: "DermNet NZ", source_type: "dermatology_reference", url: null, publication_date: null, topic_tags: ["retinoid"] },
  { id: "e2", title: "Acne overview", publisher: "DermNet NZ", source_type: "dermatology_reference", url: null, publication_date: null, topic_tags: ["breakouts_acne"] },
  { id: "e3", title: "Unrelated", publisher: null, source_type: "other", url: null, publication_date: null, topic_tags: ["unrelated_topic"] },
];

describe("selectEvidenceForTopics", () => {
  test("only returns rows matching at least one requested topic", () => {
    const result = selectEvidenceForTopics(rows, ["retinoid"]);
    expect(result.map((r) => r.id)).toEqual(["e1"]);
  });

  test("returns nothing for topics with no matching rows", () => {
    expect(selectEvidenceForTopics(rows, ["nonexistent"])).toEqual([]);
  });

  test("respects the limit", () => {
    const result = selectEvidenceForTopics(rows, ["retinoid", "breakouts_acne", "unrelated_topic"], 2);
    expect(result).toHaveLength(2);
  });
});

describe("validateCitedEvidence — Claude can only cite what it was given", () => {
  const allowed: EvidenceReference[] = [{ id: "e1", title: "Retinoid guidance", sourceType: "dermatology_reference" }];

  test("a real, allowed citation passes through using the server's own record", () => {
    const modelOutput: EvidenceReference[] = [{ id: "e1", title: "the model's own (possibly altered) restatement", sourceType: "x" }];
    const { valid, fabricatedIds } = validateCitedEvidence(modelOutput, allowed);
    expect(valid).toEqual(allowed); // server's record, not the model's restatement
    expect(fabricatedIds).toEqual([]);
  });

  test("a fabricated id is stripped, never persisted", () => {
    const modelOutput: EvidenceReference[] = [{ id: "invented-id", title: "Fabricated study", sourceType: "peer_reviewed" }];
    const { valid, fabricatedIds } = validateCitedEvidence(modelOutput, allowed);
    expect(valid).toEqual([]);
    expect(fabricatedIds).toEqual(["invented-id"]);
  });

  test("a mix of real and fabricated citations keeps only the real one", () => {
    const modelOutput: EvidenceReference[] = [
      { id: "e1", title: "Real", sourceType: "x" },
      { id: "fake", title: "Fake", sourceType: "x" },
    ];
    const { valid, fabricatedIds } = validateCitedEvidence(modelOutput, allowed);
    expect(valid).toHaveLength(1);
    expect(fabricatedIds).toEqual(["fake"]);
  });

  test("no evidence provided by the model is not an error", () => {
    const { valid, fabricatedIds } = validateCitedEvidence([], allowed);
    expect(valid).toEqual([]);
    expect(fabricatedIds).toEqual([]);
  });
});
