/**
 * PromptRegistry (section 5) — the only place the proprietary SKYNN system
 * prompt is read from. Always queries with a service-role client; the
 * assessment_prompt_versions table itself has zero RLS policies granted to
 * anon/authenticated (see the core migration), so this is also the only
 * code path in the whole app capable of reading it at all.
 *
 * Refuses to return a placeholder prompt for generation — see
 * ClaudeAssessmentProvider, which calls this before every request and
 * surfaces AssessmentProviderError("not_configured") as a safe "Advanced
 * Assessment isn't available yet" message rather than fabricating clinical
 * content to fill the gap (section 43).
 */
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

import { AssessmentProviderError } from "./types.ts";

export interface ActivePromptVersion {
  version: string;
  systemPrompt: string;
  modelDefault: string | null;
}

/**
 * `overrideVersion` corresponds to the SKYNN_SYSTEM_PROMPT_VERSION env var
 * (section 4) — an operational escape hatch to pin generation to a specific
 * prompt version (e.g. for a staged rollback) without writing to
 * skynn_advanced_assessment_config. Still subject to the same
 * placeholder/active checks below; it can never force a placeholder prompt
 * into use.
 */
export async function loadActivePrompt(adminClient: SupabaseClient, overrideVersion?: string | null): Promise<ActivePromptVersion> {
  let versionToLoad = overrideVersion ?? null;

  if (!versionToLoad) {
    const { data: config, error: configError } = await adminClient
      .from("skynn_advanced_assessment_config")
      .select("active_prompt_version")
      .eq("id", true)
      .single();
    if (configError || !config?.active_prompt_version) {
      throw new AssessmentProviderError("Advanced Assessment is not configured.", "not_configured");
    }
    versionToLoad = config.active_prompt_version;
  }

  const { data: prompt, error: promptError } = await adminClient
    .from("assessment_prompt_versions")
    .select("version, system_prompt, is_placeholder, status, model_default")
    .eq("version", versionToLoad)
    .single();

  if (
    promptError ||
    !prompt ||
    prompt.is_placeholder ||
    prompt.status !== "active" ||
    !prompt.system_prompt ||
    typeof prompt.system_prompt !== "string" ||
    prompt.system_prompt.trim().length === 0
  ) {
    // This is the expected, documented state until SkinLabs supplies the
    // real dermatologist-approved prompt — never an unexpected error.
    throw new AssessmentProviderError(
      "The Advanced Assessment methodology has not yet been activated by SkinLabs.",
      "not_configured",
    );
  }

  return { version: prompt.version, systemPrompt: prompt.system_prompt, modelDefault: prompt.model_default ?? null };
}
