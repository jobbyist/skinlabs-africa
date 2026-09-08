/**
 * Client-side entry point into the SKYNN AI fairness-benchmarking pipeline
 * (see supabase/migrations/20260907140000_skynn_fairness_pipeline.sql for the table,
 * RLS and the admin-only skynn_fairness_summary view this feeds). Best-effort and
 * non-blocking by design — a failed fairness log must never affect the visitor's
 * actual analysis or PDF.
 */
import { supabase } from "@/integrations/supabase/client";
import { mstBand } from "@/data/mstScale";

export interface FairnessEventInput {
  source: "starter" | "live_ai";
  resultTier: "free" | "premium";
  skinType?: string;
  mstTone?: number | null;
  hadPhoto: boolean;
  completenessScore?: number | null;
  groundedMatchCount?: number | null;
  groundedMatchAttempted?: number | null;
  complianceFlags?: string[];
  modelVersion?: string;
}

export const logFairnessEvent = async (event: FairnessEventInput): Promise<void> => {
  try {
    await supabase.from("skynn_fairness_events").insert({
      source: event.source,
      result_tier: event.resultTier,
      skin_type: event.skinType ?? null,
      mst_tone: event.mstTone ?? null,
      mst_band: mstBand(event.mstTone),
      had_photo: event.hadPhoto,
      completeness_score: event.completenessScore ?? null,
      grounded_match_count: event.groundedMatchCount ?? null,
      grounded_match_attempted: event.groundedMatchAttempted ?? null,
      compliance_flags: event.complianceFlags ?? [],
      model_version: event.modelVersion ?? null,
    });
  } catch {
    // Fairness telemetry is best-effort — never surface this to the visitor.
  }
};
