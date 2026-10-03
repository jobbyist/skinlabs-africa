-- Mobile contextual feedback surveys (signed-in members only). Until now the modal
-- only fired analytics events and discarded the answer + comment. Responses are
-- now stored and emailed to feedback@skinlabs.co.za ONLY (email-processor's
-- ADMIN_TEMPLATE_RECIPIENT_OVERRIDE).
--
-- One response per member per survey is enforced HERE as well as in the browser
-- ("never show the same member the same survey twice"): a second insert is a no-op
-- conflict, so a replayed request or a second device can't send a second email.
-- The email carries no member identity (no name, address or user id): feedback is
-- answered in aggregate, and the table (admin-only SELECT) holds the user id for
-- de-duplication and POPIA deletion (ON DELETE CASCADE).
CREATE TABLE IF NOT EXISTS public.feedback_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  survey_id text NOT NULL CHECK (char_length(survey_id) BETWEEN 1 AND 80),
  surface text NOT NULL CHECK (surface IN ('dashboard', 'briefings', 'reviews', 'compare', 'podcast', 'spotlight')),
  question text NOT NULL CHECK (char_length(question) BETWEEN 1 AND 300),
  answer text NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 80),
  answer_label text NOT NULL CHECK (char_length(answer_label) BETWEEN 1 AND 200),
  comment text CHECK (comment IS NULL OR char_length(comment) <= 280),
  path text CHECK (path IS NULL OR char_length(path) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, survey_id)
);
ALTER TABLE public.feedback_survey_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.feedback_survey_responses FROM PUBLIC, anon, authenticated;
GRANT INSERT (survey_id, surface, question, answer, answer_label, comment, path)
  ON public.feedback_survey_responses TO authenticated;
GRANT SELECT ON public.feedback_survey_responses TO authenticated;
GRANT ALL ON public.feedback_survey_responses TO service_role;

-- user_id is never client-supplied (no INSERT grant on it); the default is auth.uid().
CREATE POLICY "Members can submit their own survey feedback"
  ON public.feedback_survey_responses FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can read survey feedback"
  ON public.feedback_survey_responses FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Whole-table cap (60/minute) so a script with many throwaway accounts can't flood the inbox.
CREATE OR REPLACE FUNCTION public.enforce_feedback_survey_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (SELECT count(*) FROM public.feedback_survey_responses WHERE created_at > now() - interval '1 minute') >= 60 THEN
    RAISE EXCEPTION 'Too much feedback submitted recently. Please try again shortly.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_feedback_survey_rate_limit() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER feedback_survey_rate_limit BEFORE INSERT ON public.feedback_survey_responses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_feedback_survey_rate_limit();

-- Admin-only email (nothing to confirm back to the member).
CREATE OR REPLACE FUNCTION public.notify_feedback_survey_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:feedback_survey:' || NEW.id::text,
    'admin_feedback_survey_response', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'survey_id', NEW.survey_id, 'surface', NEW.surface, 'question', NEW.question,
      'answer', NEW.answer_label, 'comment', NEW.comment, 'path', NEW.path
    ),
    'trigger:notify_feedback_survey_response', false, 50::smallint,
    'admin_form_notice:feedback_survey:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_feedback_survey_response() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER trg_notify_feedback_survey_response AFTER INSERT ON public.feedback_survey_responses
  FOR EACH ROW EXECUTE FUNCTION public.notify_feedback_survey_response();
