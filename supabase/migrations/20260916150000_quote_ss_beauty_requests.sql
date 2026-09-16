-- Temporary table backing the /quote-ss-beauty client quote form (Siphokazi /
-- SS Beauty). Written only by the quote-ss-beauty-submit edge function using
-- the service_role key, which bypasses RLS — so RLS is enabled with zero
-- policies, meaning it's unreachable from anon/authenticated clients entirely.
-- Delete this table along with the route, form component and edge function
-- once the quote has been handled (see CLAUDE.md).
create table if not exists public.quote_ss_beauty_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  full_name text not null,
  business_name text,
  email text not null,
  phone text,

  products jsonb not null,
  hair_concerns text[] not null default '{}',
  formulation_notes text,

  has_branding text,
  needs_logo boolean not null default false,
  needs_label_design boolean not null default false,
  needs_compliance_help boolean not null default false,

  packaging_route text,
  white_label_interest text,

  timeline text,
  budget_range text,
  additional_notes text,

  estimate jsonb,
  email_sent boolean not null default false,
  email_error text
);

alter table public.quote_ss_beauty_requests enable row level security;
