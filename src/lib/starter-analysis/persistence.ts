/**
 * Anonymous persistence + account linking (Sections 16-19).
 *
 * Basic Analysis photos remain out of localStorage. When a member chooses a
 * photo and completes the Basic AI Skin Analysis, the selected image is read
 * directly from the two dedicated analysis photo inputs at save time and,
 * after authentication and photo consent, uploaded to the member's private
 * PhotoJournal bucket. The server-side storage bucket is capped at 5 MB.
 */

import { supabase } from "@/integrations/supabase/client";
import { notifyMemberContextChanged } from "@/lib/context/changeEvent";
import type { Json } from "@/integrations/supabase/types";
import type { ChangeContext, PriorityPreference, StarterAnalysisResult } from "@/lib/starter-analysis/types";
import { isFormulatorLimitError } from "@/lib/formulator/limits";

const DRAFT_KEY = "skynn_starter_draft_v1";
const RESULT_KEY = "skynn_starter_result_v1";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;

const isSupportedPhoto = (file: File): boolean =>
  PHOTO_MIME_TYPES.includes(file.type as (typeof PHOTO_MIME_TYPES)[number]) && file.size <= MAX_PHOTO_BYTES;

/**
 * The Basic Analysis UI owns these two inputs. Reading them at save time avoids
 * a global document listener and guarantees a removed/replaced photo is not
 * accidentally retained as a stale baseline.
 */
const getCurrentBasicPhoto = (): File | null => {
  if (typeof document === "undefined" || !window.location.pathname.startsWith("/skynn-ai")) return null;

  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>(
    'input[type="file"][accept="image/jpeg,image/png,image/webp,image/heic"]',
  ));
  const file = inputs.map((input) => input.files?.[0]).find(Boolean) ?? null;
  return file && isSupportedPhoto(file) ? file : null;
};

const hasPhotoConsent = (): boolean => {
  if (typeof document === "undefined") return false;
  const consent = document.getElementById("photo-consent");
  if (!consent) return false;
  return consent.getAttribute("data-state") === "checked" || consent.getAttribute("aria-checked") === "true";
};

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
};

const uploadCurrentBasicPhoto = async (analysisId: string): Promise<string | null> => {
  const photo = getCurrentBasicPhoto();
  if (!photo || !hasPhotoConsent()) return null;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;

  const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${uid}/journal/baseline-${analysisId}.${extension}`;
  const { error } = await supabase.storage.from("skin-analysis-photos").upload(path, photo, {
    cacheControl: "3600",
    contentType: photo.type,
    upsert: true,
  });
  if (error) throw new Error(`Could not save your PhotoJournal baseline: ${error.message}`);
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
 * Saves a starter result and, when the member explicitly consented to storing
 * the selected photo, persists that photo as the private PhotoJournal baseline.
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
      uploadedPath = await uploadCurrentBasicPhoto(params.result.analysisId);
      photoStoragePath = uploadedPath;
    }

    const { data, error } = await supabase.rpc("save_starter_analysis", buildStarterSavePayload({ ...params, photoStoragePath }));
    if (error) {
      if (uploadedPath) await supabase.storage.from("skin-analysis-photos").remove([uploadedPath]);
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

    if (photoStoragePath) {
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser.user?.id) {
        const { error: journalError } = // eslint-disable-next-line @typescript-eslint/no-explicit-any -- types predate the PhotoJournal tables
        await (supabase as any).from("skin_photo_journal_entries").upsert({
          user_id: currentUser.user.id,
          storage_path: photoStoragePath,
          entry_type: "baseline",
          source_analysis_id: params.result.analysisId,
          captured_at: new Date().toISOString(),
        }, { onConflict: "user_id,source_analysis_id" });
        if (journalError) console.error("PhotoJournal baseline save failed", journalError);
      }
    }

    // The member now has a skin profile: let the dashboard, hero and navigation catch up at once.
    notifyMemberContextChanged();
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
