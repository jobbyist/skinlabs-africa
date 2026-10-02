/**
 * Anonymous persistence + account linking (Sections 16-19).
 *
 * Basic Analysis photos remain out of localStorage. When a member chooses a
 * photo and completes the Basic AI Skin Analysis, the selected image is
 * captured from the analysis file input and, after authentication, uploaded to
 * the member's private PhotoJournal bucket. The server-side storage bucket is
 * capped at 5 MB and image MIME types only.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ChangeContext, PriorityPreference, StarterAnalysisResult } from "@/lib/starter-analysis/types";
import { isFormulatorLimitError } from "@/lib/formulator/limits";

const DRAFT_KEY = "skynn_starter_draft_v1";
const RESULT_KEY = "skynn_starter_result_v1";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// AIFormulator intentionally keeps photo bytes in component memory only. This
// capture lets the persistence layer move that same File into private storage
// once the member has authenticated and the Basic result has passed the server
// save gate. It is scoped to the Basic SKYNN route and image file inputs only.
let pendingBasicPhoto: File | null = null;

if (typeof document !== "undefined") {
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "file") return;
    if (!window.location.pathname.startsWith("/skynn-ai")) return;
    const file = target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) return;
    pendingBasicPhoto = file;
  }, true);
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
  pendingBasicPhoto = null;
};

const uploadPendingBasicPhoto = async (analysisId: string): Promise<string | null> => {
  if (!pendingBasicPhoto || pendingBasicPhoto.size > MAX_PHOTO_BYTES || !pendingBasicPhoto.type.startsWith("image/")) return null;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;

  const extension = pendingBasicPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${uid}/journal/baseline-${analysisId}.${extension}`;
  const { error } = await supabase.storage.from("skin-analysis-photos").upload(path, pendingBasicPhoto, {
    cacheControl: "3600",
    contentType: pendingBasicPhoto.type,
    upsert: true,
  });
  if (error) throw new Error(`Could not save your PhotoJournal baseline: ${error.message}`);
  pendingBasicPhoto = null;
  return path;
};

/** Arguments for the save_starter_analysis() RPC. */
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
  p_mst_tone: params.result.profile.mstTone ?? undefined,
  p_contact_name: params.contactName ?? undefined,
  p_contact_whatsapp: params.contactWhatsApp ?? undefined,
  p_photo_storage_path: params.photoStoragePath ?? undefined,
  p_variant_key: params.variantKey,
});

export type StarterSaveSource = "existing" | "membership" | "free_allowance" | "analysis_pass";

export interface StarterSaveOutcome {
  error: Error | null;
  limitReached: boolean;
  nextUnlockAt: Date | null;
  source: StarterSaveSource | null;
}

/**
 * Saves a starter result and, when the member selected a photo during this
 * Basic Analysis, persists that photo as the private PhotoJournal baseline.
 * The authoritative analysis entitlement/allowance check remains the RPC.
 */
export const persistStarterResultToAccount = async (params: {
  result: StarterAnalysisResult;
  contactName: string | null;
  contactWhatsApp: string | null;
  photoStoragePath?: string | null;
  variantKey: string;
}): Promise<StarterSaveOutcome> => {
  let photoStoragePath = params.photoStoragePath ?? null;
  let uploadedPath: string | null = null;
  try {
    if (!photoStoragePath) {
      uploadedPath = await uploadPendingBasicPhoto(params.result.analysisId);
      photoStoragePath = uploadedPath;
    }

    const { data, error } = await supabase.rpc("save_starter_analysis", buildStarterSavePayload({ ...params, photoStoragePath }));
    if (error) {
      if (uploadedPath) await supabase.storage.from("skin-analysis-photos").remove([uploadedPath]);
      if (isFormulatorLimitError(error)) {
        const detail = (error as { details?: string }).details;
        const unlock = detail ? new Date(detail) : null;
        return { error: null, limitReached: true, nextUnlockAt: unlock && !Number.isNaN(unlock.getTime()) ? unlock : null, source: null };
      }
      return { error: new Error(error.message), limitReached: false, nextUnlockAt: null, source: null };
    }
    const row = Array.isArray(data) ? data[0] : data;

    // The journal entry is intentionally best-effort here. The dashboard can
    // backfill it from skincare_recommendations.photo_storage_path if an
    // interrupted network request happens between the two writes.
    if (photoStoragePath) {
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser.user?.id) {
        await (supabase as any).from("skin_photo_journal_entries").upsert({
          user_id: currentUser.user.id,
          storage_path: photoStoragePath,
          entry_type: "baseline",
          source_analysis_id: params.result.analysisId,
          captured_at: new Date().toISOString(),
        }, { onConflict: "user_id,source_analysis_id" });
      }
    }

    return {
      error: null,
      limitReached: false,
      nextUnlockAt: row?.next_unlock_at ? new Date(row.next_unlock_at) : null,
      source: (row?.source as StarterSaveSource) ?? null,
    };
  } catch (e) {
    if (uploadedPath) await supabase.storage.from("skin-analysis-photos").remove([uploadedPath]);
    return { error: e instanceof Error ? e : new Error("Unknown error saving analysis"), limitReached: false, nextUnlockAt: null, source: null };
  }
};
