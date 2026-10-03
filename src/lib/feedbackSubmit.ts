import { supabase } from "@/integrations/supabase/client";
import { FEEDBACK_COMMENT_MAX, type FeedbackSurvey } from "@/lib/feedback-surveys";

/** Postgres unique_violation: this member already answered this survey (another tab or device). */
const UNIQUE_VIOLATION = "23505";

export type FeedbackSubmitResult = "sent" | "already_sent" | "failed";

// `feedback_survey_responses` (migration 20261004100000) isn't in the generated
// Supabase types until that migration is applied and types.ts is regenerated.
// Drop this shim and use `supabase.from(...)` directly once it is.
type UntypedInsert = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => PromiseLike<{ error: { code?: string; message: string } | null }>;
  };
};

/**
 * Stores a member's survey answer. A database trigger emails it to
 * feedback@skinlabs.co.za; the browser never talks to email at all. The answer
 * must be one of the survey's own options (checked here and bounded by the table).
 * Never `.select()` after the insert: members can't read the table back.
 */
export const submitFeedbackSurvey = async (
  survey: FeedbackSurvey,
  answer: string,
  comment: string,
  path: string,
): Promise<FeedbackSubmitResult> => {
  const option = survey.options.find((o) => o.value === answer);
  if (!option) return "failed";

  const { error } = await (supabase as unknown as UntypedInsert).from("feedback_survey_responses").insert({
    survey_id: survey.id,
    surface: survey.surface,
    question: survey.question,
    answer: option.value,
    answer_label: option.label,
    comment: comment.trim().slice(0, FEEDBACK_COMMENT_MAX) || null,
    path: path.slice(0, 300),
  });

  if (!error) return "sent";
  return error.code === UNIQUE_VIOLATION ? "already_sent" : "failed";
};
