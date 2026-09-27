-- Glow Insider: list "Ad-light browsing" as a member benefit on /pricing.
-- Backed by real behaviour: Insider/VIP members get no sponsored story ads
-- between Web Stories (src/components/WebStoriesBar.tsx +
-- src/lib/webStories/storyAds.ts). Inserted before the money-back guarantee
-- line, which stays last. Idempotent: skips any variant that already lists it.
update public.pricing_plans
set benefits = case
    when benefits ? '30-day money-back guarantee' then
      (select coalesce(jsonb_agg(b order by ord), '[]'::jsonb)
         from jsonb_array_elements(benefits) with ordinality as t(b, ord)
        where b <> '"30-day money-back guarantee"'::jsonb)
      || '["Ad-light browsing", "30-day money-back guarantee"]'::jsonb
    else benefits || '["Ad-light browsing"]'::jsonb
  end
where plan_id = 'insider'
  and not (benefits ? 'Ad-light browsing');
