-- Server-side mirror of the client's Vercel Web Analytics conversion events
-- (src/lib/analytics-events.ts's trackConversionEvent()). Vercel's own
-- Analytics dashboard already has pageviews/custom events, but nothing in
-- Supabase could query/segment them by user, plan tier, or join against
-- other tables -- this table exists so the admin dashboard's Analytics tab
-- (and any future internal reporting) has something of its own to read,
-- independent of Vercel's API rate limits/retention window.
--
-- Append-only, no read access for anon/authenticated -- same write-only/
-- admin-read-only shape already used for skynn_fairness_events. This never
-- becomes a source of truth for anything financial/entitlement-related;
-- payment_transactions stays authoritative for that.
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  path text,
  -- Nullable: most events in the ConversionEvent union fire before/without
  -- auth (pricing views, signup funnel, anonymous starter analysis).
  user_id uuid
);

COMMENT ON TABLE public.analytics_events IS 'Append-only server-side mirror of client trackConversionEvent() calls -- see src/lib/analytics-events.ts. Admin-read-only, never a source of truth for entitlements/payments.';
COMMENT ON COLUMN public.analytics_events.event_name IS 'Matches the ConversionEvent union in src/lib/analytics-events.ts -- not FK-constrained since that union evolves in code, not via migration.';

CREATE INDEX idx_analytics_events_event_name_created_at ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;

CREATE POLICY "Anyone can log an analytics event"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));
