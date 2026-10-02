-- /consult "Help shape the directory" survey: the page used to show "your
-- feedback is recorded" while discarding the answers. Responses are now stored
-- and emailed to the consult@skinlabs.co.za inbox (plus support@, the one
-- confirmed-monitored inbox every admin lead reaches — see email-processor's
-- ADMIN_TEMPLATE_EXTRA_RECIPIENTS).
CREATE TABLE IF NOT EXISTS public.consult_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  sentiment smallint NOT NULL CHECK (sentiment BETWEEN 1 AND 5),
  primary_use text NOT NULL CHECK (char_length(primary_use) BETWEEN 1 AND 200),
  booking_priority smallint NOT NULL CHECK (booking_priority BETWEEN 1 AND 5),
  useful_features text[] NOT NULL DEFAULT '{}' CHECK (cardinality(useful_features) <= 12),
  trust_score smallint NOT NULL CHECK (trust_score BETWEEN 1 AND 5),
  feedback_text text CHECK (feedback_text IS NULL OR char_length(feedback_text) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.consult_survey_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.consult_survey_responses FROM PUBLIC, anon, authenticated;
GRANT INSERT (sentiment, primary_use, booking_priority, useful_features, trust_score, feedback_text)
  ON public.consult_survey_responses TO anon, authenticated;
GRANT ALL ON public.consult_survey_responses TO service_role;
GRANT SELECT ON public.consult_survey_responses TO authenticated;

CREATE POLICY "Anyone can submit the consult survey"
  ON public.consult_survey_responses FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can read consult survey responses"
  ON public.consult_survey_responses FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Anonymous visitors can't be identified, so cap the whole table instead:
-- at most 30 submissions a minute keeps a script from flooding the inbox.
CREATE OR REPLACE FUNCTION public.enforce_consult_survey_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.consult_survey_responses WHERE created_at > now() - interval '1 minute') >= 30 THEN
    RAISE EXCEPTION 'Too many responses submitted recently. Please try again shortly.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_consult_survey_rate_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS consult_survey_rate_limit ON public.consult_survey_responses;
CREATE TRIGGER consult_survey_rate_limit BEFORE INSERT ON public.consult_survey_responses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_consult_survey_rate_limit();

-- Admin-only email (no confirmation: anonymous survey, nothing to confirm to).
CREATE OR REPLACE FUNCTION public.notify_consult_survey_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_email(
    'FORM_SUBMITTED', 'form_submitted:consult_survey:' || NEW.id::text,
    'admin_consult_survey_response', 'ADMIN', NULL, NULL,
    jsonb_build_object(
      'sentiment', NEW.sentiment, 'primary_use', NEW.primary_use,
      'booking_priority', NEW.booking_priority, 'useful_features', to_jsonb(NEW.useful_features),
      'trust_score', NEW.trust_score, 'feedback_text', NEW.feedback_text,
      'signed_in', NEW.user_id IS NOT NULL
    ),
    'trigger:notify_consult_survey_response', false, 50,
    'admin_form_notice:consult_survey:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_consult_survey_response() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_consult_survey_response ON public.consult_survey_responses;
CREATE TRIGGER trg_notify_consult_survey_response AFTER INSERT ON public.consult_survey_responses
  FOR EACH ROW EXECUTE FUNCTION public.notify_consult_survey_response();
