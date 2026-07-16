-- Temporary auth codes for cross-domain SSO
CREATE TABLE public.auth_exchange_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_exchange_codes ENABLE ROW LEVEL SECURITY;

-- Only the edge function (service role) accesses this table, no client policies needed
-- Auto-cleanup old codes
CREATE INDEX idx_auth_exchange_codes_code ON public.auth_exchange_codes(code);
CREATE INDEX idx_auth_exchange_codes_expires ON public.auth_exchange_codes(expires_at);
