/**
 * Anonymous persistence + account linking (Sections 16-19). Before this,
 * SKYNN AI held every bit of quiz/result state in plain React `useState` —
 * confirmed by audit to have zero localStorage/sessionStorage usage anywhere
 * in AIFormulator.tsx — so a refresh at any point discarded everything.
 *
 * Deliberate scope decision: the uploaded photo's base64 bytes are NEVER
 * written to localStorage. A face photo sitting in unencrypted browser
 * storage indefinitely is itself a privacy exposure (Section 36), so the
 * draft only remembers *that* a photo was attached, not the photo itself —
 * a refresh loses the image but keeps every answer, context response and
 * generated result. This is documented as a known limitation in the final
 * implementation summary.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ChangeContext, PriorityPreference, StarterAnalysisResult } from "@/lib/starter-analysis/types";
import { isFormulatorLimitError } from "@/lib/formulator/limits";

const DRAFT_KEY = "skynn_starter_draft_v1";
const RESULT_KEY = "skynn_starter_result_v1";

export interface StarterDraftState {
  analysisId: string;
  step: number;
  answers: Record<string, number>;
  mstTone: number | null;
  changeContext: ChangeContext;
  priorityPreference: PriorityPreference | null;
  hasPhotoPending: boolean;
  contactName: string;
  contactEmail: string;
  contactWhatsApp: string;
  savedAt: string;
}

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const saveDraftState = (state: StarterDraftState): void => {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {
    // Best-effort — private browsing / storage-full shouldn't break the flow.
  }
};

export const loadDraftState = (): StarterDraftState | null => {
  try {
    return safeParse<StarterDraftState>(window.localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
};

export const clearDraftState = (): void => {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
};

export interface StarterCompletedState {
  analysisId: string;
  answers: Record<string, number>;
  mstTone: number | null;
  context: ChangeContext;
  result: StarterAnalysisResult;
  savedAt: string;
}

export const saveCompletedState = (state: StarterCompletedState): void => {
  try {
    window.localStorage.setItem(RESULT_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

export const loadCompletedState = (): StarterCompletedState | null => {
  try {
    return safeParse<StarterCompletedState>(window.localStorage.getItem(RESULT_KEY));
  } catch {
    return null;
  }
};

export const clearCompletedState = (): void => {
  try {
    window.localStorage.removeItem(RESULT_KEY);
  } catch {
    // ignore
  }
};

export const clearAllStarterAnalysisState = (): void => {
  clearDraftState();
  clearCompletedState();
};

/** Arguments for the save_starter_analysis() RPC — pure, so the anonymous→account handoff is unit-testable. */
export const buildStarterSavePayload = (params: {
  result: StarterAnalysisResult;
  contactName: string | null;
  contactWhatsApp: string | null;
  photoStoragePath?: string | null;
  variantKey: string;
}) => ({
  p_client_analysis_id: params.result.analysisId,
  p_skin_type: params.result.skinType,
  p_concerns: [params.result.primaryConcern, ...params.result.profile.secondaryConcerns] as string[],
  p_recommendation: params.result.recommendationText,
  p_result_payload: params.result as unknown as Json,
  p_analysis_completeness: params.result.completeness.overall,
  p_mst_tone: params.result.profile.mstTone,
  p_contact_name: params.contactName,
  p_contact_whatsapp: params.contactWhatsApp,
  p_photo_storage_path: params.photoStoragePath ?? null,
  p_variant_key: params.variantKey,
});

export type StarterSaveSource = "existing" | "membership" | "free_allowance" | "analysis_pass";

export interface StarterSaveOutcome {
  error: Error | null;
  /** The server refused because the free allowance is spent and no Analysis Pass is held. */
  limitReached: boolean;
  nextUnlockAt: Date | null;
  source: StarterSaveSource | null;
}

/**
 * Saves (or re-saves) a starter result to the signed-in account through
 * save_starter_analysis() — the only write path the server accepts for starter
 * rows. The RPC checks and stamps the rolling free allowance in the same
 * transaction as the insert, and is idempotent on `analysisId`: a refinement
 * re-save, retry or double click updates the same row and is never charged twice.
 */
export const persistStarterResultToAccount = async (params: {
  result: StarterAnalysisResult;
  contactName: string | null;
  contactWhatsApp: string | null;
  photoStoragePath?: string | null;
  variantKey: string;
}): Promise<StarterSaveOutcome> => {
  try {
    const { data, error } = await supabase.rpc("save_starter_analysis", buildStarterSavePayload(params));
    if (error) {
      if (isFormulatorLimitError(error)) {
        const detail = (error as { details?: string }).details;
        const unlock = detail ? new Date(detail) : null;
        return {
          error: null,
          limitReached: true,
          nextUnlockAt: unlock && !Number.isNaN(unlock.getTime()) ? unlock : null,
          source: null,
        };
      }
      return { error: new Error(error.message), limitReached: false, nextUnlockAt: null, source: null };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      error: null,
      limitReached: false,
      nextUnlockAt: row?.next_unlock_at ? new Date(row.next_unlock_at) : null,
      source: (row?.source as StarterSaveSource) ?? null,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e : new Error("Unknown error saving analysis"),
      limitReached: false,
      nextUnlockAt: null,
      source: null,
    };
  }
};

/**
 * Uploads the consented photo to the private `skin-analysis-photos` bucket so
 * it's available if the visitor later runs the Advanced SKYNN AI analysis —
 * signed-in + explicit photo consent only (Section: "Store the user's image
 * ... for further analysis if they choose the advanced AI-powered analysis").
 * Anonymous visitors' photos are never uploaded — there's no durable, RLS-
 * scoped identity to own that file until an account exists.
 */
export const uploadAnalysisPhoto = async (params: {
  userId: string;
  analysisId: string;
  dataUrl: string;
}): Promise<{ path: string | null; error: Error | null }> => {
  try {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(params.dataUrl);
    if (!match) return { path: null, error: new Error("Unsupported image format") };
    const [, mime, base64] = match;
    const subtype = mime.split("/")[1];
    const ext = subtype === "jpeg" ? "jpg" : subtype;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${params.userId}/${params.analysisId}.${ext}`;
    const { error } = await supabase.storage
      .from("skin-analysis-photos")
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (error) return { path: null, error: new Error(error.message) };
    return { path, error: null };
  } catch (e) {
    return { path: null, error: e instanceof Error ? e : new Error("Unknown error uploading photo") };
  }
};

/** Best-effort cleanup of a photo uploaded for an analysis the server then refused to save. */
export const removeAnalysisPhoto = async (path: string): Promise<void> => {
  try {
    await supabase.storage.from("skin-analysis-photos").remove([path]);
  } catch {
    // Non-fatal: the object is private and owner-scoped either way.
  }
};
