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

/**
 * Idempotent save-or-update, keyed by the client-generated `client_analysis_id`
 * (not the DB row id, which the client never sees before insert) via a Postgres
 * upsert against a unique (user_id, client_analysis_id) index — see the
 * `20260908010000_skynn_starter_analysis_2_0.sql` migration. A retried save
 * after a network error or a duplicate "Save results" click updates the same
 * row instead of creating a second analysis, and never re-triggers regeneration.
 */
export const persistStarterResultToAccount = async (params: {
  userId: string;
  result: StarterAnalysisResult;
  contactName: string | null;
  contactWhatsApp: string | null;
  photoStoragePath?: string | null;
}): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.from("skincare_recommendations").upsert(
      {
        user_id: params.userId,
        client_analysis_id: params.result.analysisId,
        skin_type: params.result.skinType,
        concerns: [params.result.primaryConcern, ...params.result.profile.secondaryConcerns],
        recommendation: params.result.recommendationText,
        contact_name: params.contactName,
        contact_whatsapp: params.contactWhatsApp,
        status: "delivered",
        mst_tone: params.result.profile.mstTone,
        mst_source: params.result.profile.mstTone !== null ? "user_reported" : null,
        analysis_completeness: params.result.completeness.overall,
        result_payload: params.result as unknown as Json,
        photo_storage_path: params.photoStoragePath ?? null,
      },
      { onConflict: "user_id,client_analysis_id" },
    );
    return { error: error ? new Error(error.message) : null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error("Unknown error saving analysis") };
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
