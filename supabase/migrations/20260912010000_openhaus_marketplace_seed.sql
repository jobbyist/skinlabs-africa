-- OpenHaus marketplace seed data — 84 real products across 4 South African
-- brands (Lelive, Esse, SKOON, Standard Beauty), sourced from a Faithful to
-- Nature wholesale catalog (September 2026). Descriptions are rewritten
-- (not copy-pasted); category/concern/values/skin-tone tags are derived
-- only from real catalog claims. Prices are the source price marked up 4%,
-- charm-rounded to end in .99. Idempotent: safe to re-run.

-- Brands
insert into public.marketplace_brands (slug, name, origin, description, values, source_url)
values ('lelive', 'Lelive', 'South Africa', 'A South African, woman-owned skincare and body-care brand built around African-sourced ingredients — baobab, marula, rooibos and African mahogany — across cruelty-free, vegan, sulphate- and paraben-free formulas.', ARRAY['Cruelty-Free', 'Vegan', 'SA Woman-Owned']::text[], 'https://www.faithful-to-nature.co.za')
on conflict (slug) do update set
  name = excluded.name, origin = excluded.origin, description = excluded.description, values = excluded.values;
insert into public.marketplace_brands (slug, name, origin, description, values, source_url)
values ('esse', 'Esse', 'South Africa', 'A South African probiotic skincare brand built on organic, ECOCERT-certified formulas, live probiotic technology and African botanicals, independently certified cruelty-free.', ARRAY['Cruelty-Free', 'Vegan']::text[], 'https://www.faithful-to-nature.co.za')
on conflict (slug) do update set
  name = excluded.name, origin = excluded.origin, description = excluded.description, values = excluded.values;
insert into public.marketplace_brands (slug, name, origin, description, values, source_url)
values ('skoon', 'SKOON.', 'South Africa', 'A South African skincare brand focused on skin-barrier repair and hydration, built around its own NanoPillow serum technology and microbiome-supporting actives.', ARRAY['Cruelty-Free']::text[], 'https://www.faithful-to-nature.co.za')
on conflict (slug) do update set
  name = excluded.name, origin = excluded.origin, description = excluded.description, values = excluded.values;
insert into public.marketplace_brands (slug, name, origin, description, values, source_url)
values ('standard-beauty', 'Standard Beauty', 'South Africa', 'A South African skincare brand offering clinically tested, dermatologically approved actives — salicylic acid, niacinamide, hyaluronic acid — at an accessible price point, formulated to be pregnancy- and breastfeeding-safe.', ARRAY['Vegan', 'Pregnancy-Safe']::text[], 'https://www.faithful-to-nature.co.za')
on conflict (slug) do update set
  name = excluded.name, origin = excluded.origin, description = excluded.description, values = excluded.values;

-- Products
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-nourishing-3-step-routine-revitalise-plump-restore', 'Lelive. Nourishing 3 Step Routine - Revitalise, Plump + Restore Normal to Dry Skin', 'A three-step routine for normal-to-dry and dehydrated skin, built around a gentle jelly cleanser, the African Gold peptide-and-bakuchiol oil elixir, and the Du-Pont shea butter moisturiser. Together the trio is designed to unclog pores without disturbing the skin''s pH, soften the look of fine lines and dark spots, and support the skin''s own collagen production. Best suited to mature or moisture-starved skin that needs consistent nourishment rather than a quick fix.',
  933, 970.99,
  'https://www.faithful-to-nature.co.za/lelive-nourishing-3-step-routine-revitalise-plump-restore-normal-to-dry-skin', 'face', ARRAY['Dry & Dehydrated', 'Hyperpigmentation', 'Fine Lines & Ageing']::text[], '{}',
  '{}', NULL, 'Step 1 Jelly Splash: morning or second cleanse evening. Step 2 African Gold: 3-4 drops morning and night after cleansing. Step 3 The Du-Pont: apply after serum, preferably at night.', ARRAY['Hyaluronic Acid', 'Niacinamide', 'Bakuchiol', 'Peptides', 'Shea Butter']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-own-the-glow-mini-icons', 'Lelive Own The Glow: Mini Icons', 'A seven-piece, travel-sized edit of Lelive''s best-selling face and body products, covering cleansing, brightening, hydrating and sun protection in one set. Every formula is made in South Africa by a woman-owned brand, is safe to use during pregnancy, and is free from SLS/SLES, parabens, phthalates, silicones and synthetic fragrance. A practical way to try the range, or to keep a full routine on hand while travelling.',
  699.3, 727.99,
  'https://www.faithful-to-nature.co.za/lelive-own-the-glow-mini-icons', 'face', ARRAY['Hyperpigmentation', 'Dry & Dehydrated']::text[], ARRAY['Pregnancy-Safe', 'SA Woman-Owned', 'Fragrance-Free', 'Cruelty-Free']::text[],
  '{}', NULL, 'Individual directions for each mini product (cleanser, serum, moisturiser, SPF, mist, body wash, body oil).', ARRAY['Vitamin C', 'Niacinamide', 'Hyaluronic Acid', 'Zinc Oxide', 'Lactic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-the-glow-kit-mini-edition', 'Lelive. The Glow Kit: Mini Edition', 'Five travel-sized essentials — cleanser, serum, moisturiser, tinted SPF and setting mist — covering a full daily routine for any skin type. The set is built to cleanse without stripping, keep pores clear, soften dark spots and fine lines, and support skin elasticity over time. Reef-safe, dermatologist-approved and free of sulphates and parabens, it''s a low-commitment way to sample Lelive''s core routine.',
  589, 612.99,
  'https://www.faithful-to-nature.co.za/lelive-the-glow-kit-the-mini-edition-5-piece-set', 'face', ARRAY['Hyperpigmentation', 'Fine Lines & Ageing', 'Dry & Dehydrated']::text[], ARRAY['Reef-Safe', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Detailed steps for each product provided on the pack.', ARRAY['Vitamin C', 'Hyaluronic Acid', 'Niacinamide', 'Zinc Oxide', 'Turmeric']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-clean-slate-cleanse-renew-body-wash', 'Lelive. Clean Slate | Cleanse + Renew Body Wash', 'A non-stripping body wash built around lactic acid, living stones, willow leaf extract and Cape aloe, which exfoliate and hydrate while helping to clear excess oil from pores. Suitable for all skin types and made locally without sulphates, parabens, phthalates or synthetic fragrance. It''s sulphate-free, so it takes a little longer to work up a lather than a foaming wash — that''s expected, not a fault.',
  299, 310.99,
  'https://www.faithful-to-nature.co.za/lelive-clean-slate-cleanse-renew-body-wash', 'body', ARRAY['Acne & Breakouts', 'Dry & Dehydrated']::text[], ARRAY['Vegan', 'Cruelty-Free', 'Fragrance-Free']::text[],
  '{}', NULL, 'Add a liberal amount to hands or sponge. Lather gently before rinsing. Sulphate-free, so allow extra time to lather.', ARRAY['Lactic Acid', 'Willow Leaf Extract', 'Cape Aloe']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-african-butter-hydrate-firm-body-cream', 'Lelive. African Butter | Hydrate + Firm Body Cream', 'A firming body cream formulated with niacinamide, hyaluronic acid, shea butter and baobab to hydrate, plump and brighten skin while supporting its natural strength. It spreads easily and settles into a non-greasy, glowing finish rather than sitting heavy on the skin. Made by a South African, woman-owned brand and free from petroleum derivatives, SLS/SLES and parabens.',
  349, 362.99,
  'https://www.faithful-to-nature.co.za/lelive-african-butter-hydrate-firm-body-cream', 'body', ARRAY['Fine Lines & Ageing', 'Hyperpigmentation', 'Dry & Dehydrated']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Apply a generous dollop and massage in circular motions.', ARRAY['Niacinamide', 'Hyaluronic Acid', 'Shea Butter', 'Baobab']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-seatox-marine-algae-aloe-detoxifying-mask', 'Lelive. Seatox Marine Algae & Aloe Detoxifying Mask', 'A plant-based detox mask combining algae, sea spaghetti and aloe to soothe and hydrate with kaolin, bentonite and charcoal to draw out impurities. It''s aimed at inflamed, acne-prone skin, working as a deep clean that avoids stripping the skin''s natural oils. Dermatologist-approved and made by a South African, woman-owned brand that donates 2% of sales to a water project.',
  329, 342.99,
  'https://www.faithful-to-nature.co.za/lelive-seatox-aloe-detoxifying-mask-marine-algae', 'treatments', ARRAY['Acne & Breakouts', 'Sensitive Skin', 'Dry & Dehydrated']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Apply after cleansing, avoiding the eye and lip areas. Leave for 15-20 minutes or until dry. Rinse. Use 1-2 times a week.', ARRAY['Marine Algae', 'Aloe', 'Kaolin Clay', 'Charcoal']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-creme-de-la-cream-african-mahogany-everyday-moisturiser', 'Lelive. Crème De La Cream African Mahogany Everyday Moisturiser', 'An everyday moisturiser built around African mahogany and peptides to support skin''s firmness, alongside marula and baobab for deep moisture and rosehip and vitamin E for general anti-ageing care. The texture is light rather than oily, which is why Lelive also recommends it for oily, acne-prone or combination skin, not just dry types. Dermatologist-approved and made by a South African, woman-owned brand.',
  319, 331.99,
  'https://www.faithful-to-nature.co.za/lelive-creme-de-la-cream-everyday-moisturiser-african-mahogany', 'face', ARRAY['Fine Lines & Ageing', 'Dry & Dehydrated', 'Acne & Breakouts']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'After serum, squeeze out and rub in. Day and night. Spot-test for sensitive skin.', ARRAY['Peptides', 'Marula Oil', 'Rosehip Oil', 'Vitamin E']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-all-glowd-up-vitamin-c-turmeric-hyaluronic-acid-brightening-serum', 'Lelive. All Glow''d Up Vitamin C, Turmeric & Hyaluronic Acid Brightening Serum', 'A brightening serum pairing vitamin C and hyaluronic acid to soften the look of fine lines with turmeric and liquorice to target dark spots and uneven tone. Bakuchiol and aloe add an anti-inflammatory, hydrating base, making it gentle enough for mild-to-moderate acne-prone skin as well as brightening-focused routines. Free from sulphates, parabens, synthetic fragrance and dye, and made by a South African, woman-owned brand.',
  319, 331.99,
  'https://www.faithful-to-nature.co.za/lelive-all-glow-d-up-ha-brightening-serum-vitamin-cturmeric', 'face', ARRAY['Hyperpigmentation', 'Fine Lines & Ageing', 'Acne & Breakouts']::text[], ARRAY['Fragrance-Free', 'SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'After cleansing, add 3-4 drops, tap until absorbed. Day and night.', ARRAY['Vitamin C', 'Turmeric', 'Hyaluronic Acid', 'Bakuchiol', 'Liquorice']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-rooibos-aloe-jelly-splash-cleanser', 'Lelive. Rooibos & Aloe Jelly Splash Cleanser', 'A gentle plant-based cleanser that respects skin''s natural pH, using aloe, green rooibos and rose water to soothe alongside salicylic acid, niacinamide and lactic acid to keep pores clear. Hyaluronic acid and shea butter are added to hydrate, so it cleanses without leaving skin stripped. Suitable for most skin types, and free from sulphates and parabens.',
  349, 362.99,
  'https://www.faithful-to-nature.co.za/lelive-jelly-splash-cleanser-rooibos-aloe', 'face', ARRAY['Acne & Breakouts', 'Dry & Dehydrated', 'Sensitive Skin']::text[], ARRAY['Vegan']::text[],
  '{}', NULL, 'Wet face, one pump on hands, add lukewarm water to remove. Morning only or second cleanse evening.', ARRAY['Salicylic Acid', 'Niacinamide', 'Lactic Acid', 'Hyaluronic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-body-glow-up-mini-edition', 'Lelive. Body Glow Up: Mini Edition', 'A four-piece mini body set covering exfoliation (AHA/PHA with jojoba beads and green rooibos), cleansing (lactic acid, living stones, willow and Cape aloe), moisture (niacinamide, hyaluronic acid, shea and baobab) and a brightening oil (vitamin C, bakuchiol, moringa and avocado). Together the set is designed to soften, clear, hydrate, firm and brighten in one routine. Made by a South African, woman-owned brand and suitable for all skin types.',
  349.3, 363.99,
  'https://www.faithful-to-nature.co.za/lelive-body-glow-up-mini-edition-4-piece-set', 'body', ARRAY['Dry & Dehydrated', 'Fine Lines & Ageing', 'Hyperpigmentation']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Exfoliator 2-3x/week on dry skin; body wash daily; cream massage in; oil pat and massage, follow with cream.', ARRAY['AHA/PHA', 'Niacinamide', 'Hyaluronic Acid', 'Vitamin C', 'Bakuchiol']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-am-pm-serum-kit-multi-benefit-duo-all-skin-types', 'Lelive. Am + Pm Serum Kit - Multi-Benefit Duo All Skin Types', 'Pairs the All Glow''d Up brightening serum — vitamin C, hyaluronic acid, turmeric and liquorice — for daytime use with the Save Our Skin exfoliating serum for night-time oil control and texture refinement. Used together, the duo is designed to brighten, clarify and smooth skin without doubling up on exfoliation and hydration on the same night. Suited to all skin types looking for a simple AM/PM active routine.',
  401.8, 417.99,
  'https://www.faithful-to-nature.co.za/lelive-am-pm-serum-kit-multi-benefit-duo-all-skin-types', 'face', ARRAY['Hyperpigmentation', 'Acne & Breakouts', 'Fine Lines & Ageing']::text[], '{}',
  '{}', NULL, 'All Glow''d Up: 3-4 drops after cleansing morning (or night when not using SOS). SOS: 3-4 drops at night 3x/week, increase gradually. Do not use the same night.', ARRAY['Vitamin C', 'Bakuchiol', 'Hyaluronic Acid', 'Turmeric', 'Willow Bark']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-cleaner-colada-coconut-pineapple-african-oil-cleanser', 'Lelive. Cleaner Colada Coconut & Pineapple African Oil Cleanser', 'An oil cleanser built on Kalahari melon, marula and mongongo oils with pineapple enzyme, coconut oil and squalane, designed to lift sebum, makeup and sunscreen while gently exfoliating and hydrating. It emulsifies into a light milk with water, and doubles as a shaving oil. Dermatologist-approved and made by a South African, woman-owned brand.',
  349, 362.99,
  'https://www.faithful-to-nature.co.za/lelive-cleaner-colada-african-oil-cleanser-coconut-pineapple', 'face', ARRAY['Acne & Breakouts', 'Dry & Dehydrated']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Apply one pump on dry hands to dry face, massage, add water to emulsify. Follow with jelly splash for a double cleanse if needed. Excellent as a shaving oil.', ARRAY['Pineapple Enzyme', 'Coconut Oil', 'Squalane', 'Marula Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-bestselling-3-step-routine-brighten-clarify-glow', 'Lelive. Bestselling 3 Step Routine - Brighten, Clarify + Glow All Skin Types', 'Full-size versions of the Jelly Splash cleanser, All Glow''d Up serum and Créme de la Cream moisturiser, packaged with a gold key roller tube. The routine is built to cleanse without stripping, keep pores clear, and fade dark spots and fine lines while supporting skin elasticity and collagen. Dermatologist-approved and made by a South African, woman-owned brand for a wide range of skin types.',
  888, 923.99,
  'https://www.faithful-to-nature.co.za/lelive-bestselling-3-step-routine-brighten-clarify-glow-all-skin-types', 'face', ARRAY['Hyperpigmentation', 'Fine Lines & Ageing', 'Acne & Breakouts']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Step 1: Jelly Splash. Step 2: 3-4 drops All Glow''d Up. Step 3: Créme de la Cream. Day and night.', ARRAY['Salicylic Acid', 'Vitamin C', 'Niacinamide', 'Peptides']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-good-to-glow-smooth-renew-body-exfoliator', 'Lelive. Good to Glow | Smooth + Renew Body Exfoliator', 'A hybrid chemical-and-physical body exfoliator combining AHAs and PHAs with biodegradable jojoba beads and green rooibos to lift dead skin cells. It''s designed to brighten, clear congestion and soften skin texture without relying on harsh physical scrubbing alone. Made by a South African, woman-owned brand, suitable for all skin types.',
  202.3, 210.99,
  'https://www.faithful-to-nature.co.za/lelive-good-to-glow-smooth-renew-body-exfoliator', 'body', ARRAY['Hyperpigmentation', 'Acne & Breakouts']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Apply onto dry skin with wet hands, circular motions, rinse thoroughly. Use 2-3 times per week before body wash.', ARRAY['AHA', 'PHA', 'Jojoba Beads', 'Green Rooibos']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-oil-la-la-brighten-glow-body-oil', 'Lelive. Oil La La | Brighten + Glow Body Oil', 'A lightweight, non-greasy body oil built around vitamin C, living stones, bakuchiol, moringa and avocado, aimed at softening skin and evening out tone by targeting dark spots. It absorbs quickly rather than sitting on the skin, and Lelive recommends following with a body cream to lock in the result. Made by a South African, woman-owned brand, suitable for all skin types.',
  369, 383.99,
  'https://www.faithful-to-nature.co.za/lelive-oil-la-la-brighten-glow-body-oil', 'body', ARRAY['Hyperpigmentation', 'Fine Lines & Ageing', 'Acne & Breakouts']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Apply onto cleansed skin, pat and massage in circular motions. Use daily; follow with cream to lock in moisture.', ARRAY['Vitamin C', 'Bakuchiol', 'Moringa Oil', 'Avocado Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-african-gold-peptide-bakuchiol-african-oil-elixir', 'Lelive. African Gold Peptide, Bakuchiol + African Oil Elixir', 'An oil elixir combining baobab and rosehip oils with bakuchiol — a gentler, pregnancy-safe alternative to retinol — and peptides to support collagen production. Positioned as a restorative, replenishing treatment rather than a targeted spot fix, it''s dermatologist-approved and formulated to suit most skin types, including oily skin when mixed sparingly into a night moisturiser. Vegan and free from sulphates, parabens, synthetic fragrance and dye.',
  369, 383.99,
  'https://www.faithful-to-nature.co.za/lelive-african-gold', 'face', ARRAY['Fine Lines & Ageing', 'Dry & Dehydrated']::text[], ARRAY['Pregnancy-Safe', 'Vegan', 'Fragrance-Free']::text[],
  '{}', NULL, 'Add 3-4 drops morning and night after cleansing, before moisturiser. Oily skin: 1-2 drops mixed into moisturiser at night.', ARRAY['Bakuchiol', 'Peptides', 'Baobab Oil', 'Rosehip Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-eye-conic-peptide-coffee-arabica-eye-cream', 'Lelive. Eye-Conic Peptide + Coffee Arabica Eye Cream', 'An eye cream pairing peptides and African mahogany to support collagen with vitamin C and niacinamide to brighten and smooth the appearance of fine lines around the eyes. It''s designed to re-energise puffiness and dullness in the eye area specifically, applied after serum and before moisturiser. Vegan, unisex, and free from sulphates, parabens, synthetic fragrance and dye.',
  349, 362.99,
  'https://www.faithful-to-nature.co.za/lelive-eye-conic', 'face', ARRAY['Dark Circles & Puffiness', 'Fine Lines & Ageing', 'Hyperpigmentation']::text[], ARRAY['Vegan', 'Fragrance-Free']::text[],
  '{}', NULL, 'After cleansing morning and evening, gently dot around the eye area and wait for it to sink in. Follow with moisturiser.', ARRAY['Peptides', 'Coffee Arabica', 'Vitamin C', 'Niacinamide']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-the-drip-hydrating-mist-deep-sea-biotics-african-malachite', 'Lelive. The Drip Hydrating Mist - Deep Sea Biotics + African Malachite', 'A hydrating setting mist built on deep sea biotics, rose water and cucumber to soothe and add moisture, with African malachite and niacinamide providing antioxidant and anti-inflammatory support. It''s positioned to protect against environmental stress, refine texture and set makeup, and is gentle enough for sensitive skin. Made by a South African, woman-owned brand that donates 2% of sales to a water project.',
  319, 331.99,
  'https://www.faithful-to-nature.co.za/lelive-the-drip-hydrating-mist-deep-sea-biotics-african-malachite', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Close eyes and mist 30cm from skin before or after makeup. Can help set makeup. Spot-test for sensitive skin.', ARRAY['Niacinamide', 'Rose Water', 'Cucumber Extract', 'African Malachite']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-the-du-pont-shea-butter-lush-moisturiser', 'Lelive. The Du-Pont Shea Butter Lush Moisturiser', 'A nourishing moisturiser for dry, dull or dehydrated skin, combining shea butter, squalane, hyaluronic acid, niacinamide and turmeric to restore moisture and support skin''s natural renewal. It''s rich enough to double as an overnight mask or a makeup primer, and Lelive positions it for dry and maturing skin in particular. Made by a South African, woman-owned brand, free from sulphates and parabens.',
  319, 331.99,
  'https://www.faithful-to-nature.co.za/lelive-the-du-pont-lush-moisturiser-shea-butter', 'face', ARRAY['Dry & Dehydrated', 'Fine Lines & Ageing']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'After serum, squeeze out and rub in. Best results applying liberally at night. Day and night. Spot-test for sensitive skin.', ARRAY['Shea Butter', 'Squalane', 'Hyaluronic Acid', 'Niacinamide']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-all-the-shade-marula-tinted-spf-30-moisturiser', 'Lelive. All the Shade Marula Tinted Spf 30 Moisturiser', 'A reef-safe, mineral SPF 30 tinted moisturiser using zinc oxide for broad-spectrum UVA/UVB cover, vitamin E for antioxidant support, and marula oil to nourish skin underneath. Lelive designed it to blend into all skin tones without leaving a white cast once fully absorbed. Made by a South African, woman-owned brand, free from sulphates and parabens.',
  349, 362.99,
  'https://www.faithful-to-nature.co.za/lelive-all-the-shade-tinted-spf-30-moisturiser-marula', 'sun-care', '{}', ARRAY['Reef-Safe', 'SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  ARRAY['All Skin Tones']::text[], NULL, 'After serum, squeeze a liberal amount, rub in until fully absorbed. For very dry skin, use crème de la cream or Du-Pont first.', ARRAY['Zinc Oxide', 'Vitamin E', 'Marula Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'lelive'),
  'lelive-save-our-skin-peach-aloe-aha-bha-exfoliator', 'Lelive. Save Our Skin Peach & Aloe aha/bha Exfoliator', 'An AHA/BHA exfoliator built on plant-derived peach, aloe and willow bark, aimed at mild-to-moderate acne-prone skin that scars easily. It''s designed to clear congestion and enhance glow while still moisturising, and can also be used as a targeted spot treatment. Made by a South African, woman-owned brand, dermatologist-approved for a range of skin types.',
  319, 331.99,
  'https://www.faithful-to-nature.co.za/lelive-save-our-skin-aha-bha-exfoliator-peach-aloe', 'treatments', ARRAY['Acne & Breakouts', 'Dry & Dehydrated']::text[], ARRAY['SA Woman-Owned', 'Cruelty-Free', 'Vegan']::text[],
  '{}', NULL, 'Add 3-4 drops after cleanser at night, 2 times a week then increase. Can be used as a spot treatment. Expect results in 4-6 weeks. Spot-test for sensitive skin.', ARRAY['Willow Bark', 'Peach Extract', 'Aloe']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-salicylic-acid-face-wash', 'Standard Beauty Salicylic Acid Face Wash', 'A light-foaming, non-drying cleanser built around salicylic acid for acne-prone and oily skin, formulated to help clear pores, reduce sebum and minimise blackheads and breakouts. Standard Beauty recommends leaving it on the skin for around three minutes to give the salicylic acid time to work, then following with SPF. Safe to use during pregnancy and breastfeeding, and vegan.',
  145, 150.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-salicylic-acid-face-wash-125-ml', 'face', ARRAY['Acne & Breakouts']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '125ml', 'Gently massage in circular motions. Can leave on for 3 minutes for the salicylic acid to work. Use with SPF.', ARRAY['Salicylic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-2-alpha-arbutin-serum', 'Standard Beauty 2% Alpha Arbutin Serum', 'A serum combining 2% alpha arbutin with hyaluronic acid and niacinamide, aimed at pigmentation, sun spots and textured, uneven skin. It''s designed to brighten hyperpigmentation and fade the look of acne scars while hydrating and plumping skin. Free from artificial fragrance and vegan — but not recommended during pregnancy or breastfeeding, and best paired with daily SPF.',
  185, 192.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-2-alpha-arbutin-serum-30-ml', 'face', ARRAY['Hyperpigmentation', 'Dry & Dehydrated']::text[], ARRAY['Vegan', 'Fragrance-Free']::text[],
  '{}', '30ml', 'Patch test. Apply AM and/or PM after washing & toning. Massage in a few drops, follow with moisturiser, oil serum and SPF.', ARRAY['Alpha Arbutin', 'Hyaluronic Acid', 'Niacinamide']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-african-black-soap', 'Standard Beauty African Black Soap', 'A 100% natural black soap made by a fair-trade women''s cooperative in Ghana, formulated to purify skin without stripping its natural oils. It''s positioned for acne, pigmentation, oily skin, psoriasis, dry skin and rashes, working to balance oiliness while brightening dark spots and acne scars. Safe during pregnancy and breastfeeding, and free from GMOs and artificial fragrance.',
  125, 129.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-african-black-soap', 'face', ARRAY['Acne & Breakouts', 'Hyperpigmentation', 'Dry & Dehydrated']::text[], ARRAY['Pregnancy-Safe', 'Fragrance-Free', 'Vegan']::text[],
  '{}', NULL, 'First-time users: every second day. After 3 weeks'' tolerance, 1-2x daily. Do not combine with AHAs/BHAs in the first week. Store dry, cool, away from sunlight.', ARRAY['African Black Soap']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-renew-your-dew-ceramide-butter', 'Standard Beauty Renew Your Dew Ceramide Butter', 'A ceramide-based moisturiser built with rosehip oil, cocoa and shea butters for dry, sensitive or compromised skin barriers. It''s designed to deliver deep hydration and a protective layer against moisture loss and environmental stress, with anti-ageing support to encourage skin renewal. Dermatologically and clinically tested for low irritancy, safe during pregnancy and breastfeeding, and vegan.',
  265, 275.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-ceramide-butter-renew-your-dew-50-ml', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin', 'Fine Lines & Ageing']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '50ml', 'Patch test. Apply AM and/or PM after cleansing and toning. Massage in, follow with an oil-based serum.', ARRAY['Ceramides', 'Rosehip Oil', 'Cocoa Butter', 'Shea Butter']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-moisture-bomb', 'Standard Beauty Moisture Bomb', 'A lightweight, fast-absorbing moisturiser for normal, combination and oily skin, built on rose water, squalane and cucumber extract. Its antibacterial and anti-inflammatory properties are aimed at softening texture and calming redness, inflammation and puffiness, leaving a silky rather than heavy finish. Clinically tested for low irritancy, fragrance-free, and safe during pregnancy and breastfeeding.',
  195, 202.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-moisture-bomb-50-ml', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin', 'Dark Circles & Puffiness']::text[], ARRAY['Pregnancy-Safe', 'Fragrance-Free', 'Vegan']::text[],
  '{}', '50ml', 'Patch test. Use AM and/or PM after cleansing, toning and a water-based serum. Massage in, follow with an oil-based serum and sunscreen.', ARRAY['Rose Water', 'Squalane', 'Cucumber Extract']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-mattifying-gel-moisturiser-azelaic-acid', 'Standard Beauty Mattifying Gel Moisturiser with Azelaic Acid', 'An azelaic acid gel moisturiser aimed at rosacea, oily, acne and breakout-prone skin, using the ingredient''s antimicrobial and anti-inflammatory properties to help clear acne-causing bacteria and calm redness. It''s also formulated to encourage cell turnover and help prevent scarring and pigmentation from previous breakouts. Fragrance-free, safe during pregnancy and breastfeeding — but shouldn''t be combined with retinol, vitamin C, AHAs or BHAs.',
  195, 202.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-mattifying-gel-moisturiser-with-azelaic-acid-50-ml', 'face', ARRAY['Acne & Breakouts', 'Sensitive Skin', 'Hyperpigmentation']::text[], ARRAY['Pregnancy-Safe', 'Fragrance-Free', 'Vegan']::text[],
  '{}', '50ml', 'Patch test. Use AM and/or PM after cleansing, toning and a water-based serum. Massage in, follow with an oil-based serum and sunscreen. Not for hyper-sensitive skin.', ARRAY['Azelaic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-2-salicylic-acid-toner', 'Standard Beauty 2% Salicylic Acid Toner', 'A 2% salicylic acid toner for breakout-prone and oily skin, formulated to exfoliate the skin''s surface, clear clogged pores and reduce sebum production. Niacinamide is added to help break down existing pimples, whiteheads and blackheads. Safe during pregnancy and breastfeeding, and vegan — but shouldn''t be layered with other AHAs, BHAs, retinol or vitamin C.',
  135, 140.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-2-salicylic-acid-toner-125-ml', 'face', ARRAY['Acne & Breakouts']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '125ml', 'Patch test. Use AM or PM only, 2-3x per week. After washing, apply on a cotton pad and gently rub over skin. Follow with normal routine and SPF.', ARRAY['Salicylic Acid', 'Niacinamide']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-5-lactic-acid-toner', 'Standard Beauty 5% Lactic Acid Toner', 'A 5% lactic acid toner aimed at hyperpigmentation and uneven skin tone, designed to gently exfoliate, unclog pores and even out complexion while fading dark marks and discolouration. It''s also positioned to support collagen and soften the look of fine lines and wrinkles over time. Safe during pregnancy and breastfeeding, and vegan — best used two to three times a week rather than daily.',
  135, 140.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-5-lactic-acid-toner-125-ml', 'face', ARRAY['Hyperpigmentation', 'Fine Lines & Ageing']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '125ml', 'Patch test. Use AM or PM only, 2-3x per week. After washing, apply on a cotton pad and gently rub over skin. Follow with normal routine and SPF.', ARRAY['Lactic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-vitamin-c-serum-polyglutamic-acid', 'Standard Beauty Vitamin C Serum in Polyglutamic Acid', 'A water-based serum pairing two stable forms of vitamin C with a polyglutamic acid base, formulated for dry, dehydrated and pigmented skin. It''s designed to brighten dark spots, even out tone and target the look of fine lines and wrinkles, with Standard Beauty citing potential improvement in sun damage and age spots. Fragrance-free, vegan, and safe during pregnancy and breastfeeding.',
  195, 202.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-vitamin-c-serum-in-polyglutamic-acid-30-ml', 'face', ARRAY['Dry & Dehydrated', 'Hyperpigmentation', 'Fine Lines & Ageing']::text[], ARRAY['Pregnancy-Safe', 'Vegan', 'Fragrance-Free']::text[],
  '{}', '30ml', 'Patch test. Use AM or PM after washing/cleansing/toning and before moisturising.', ARRAY['Vitamin C', 'Polyglutamic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-oat-so-clean-cleansing-balm', 'Standard Beauty Oat-So-Clean Cleansing Balm', 'A nourishing cleansing balm built on natural oils, formulated for double-cleansing on dry and sensitive skin. It''s designed to lift makeup, impurities and excess sebum while protecting and strengthening the skin''s lipid barrier rather than stripping it. Dermatologically and clinically tested for low irritancy, fragrance-free, vegan and safe during pregnancy and breastfeeding.',
  205, 213.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-oat-so-clean-cleansing-balm-100-ml', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin']::text[], ARRAY['Pregnancy-Safe', 'Fragrance-Free', 'Vegan']::text[],
  '{}', '100ml', 'Use as the first cleanser when double-cleansing. In dry winter months can be a primary cleanser. Mornings and evenings.', ARRAY['Natural Oils']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-rosehip-serum', 'Standard Beauty Rosehip Serum', 'An organic, cold-pressed rosehip oil serum rich in antioxidants and vitamins A and C, formulated for dry, acne-prone and mature skin. It''s aimed at rejuvenating and hydrating skin while supporting collagen and elasticity, and softening the look of wrinkles, acne scars and dark spots over time. Non-comedogenic, vegan, and safe during pregnancy and breastfeeding.',
  185, 192.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-rosehip-serum-30-ml', 'face', ARRAY['Dry & Dehydrated', 'Fine Lines & Ageing', 'Acne & Breakouts']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '30ml', 'Use AM and/or PM after cleansing, toning and moisturising. Apply a few drops and gently massage in.', ARRAY['Rosehip Oil', 'Vitamin A', 'Vitamin C']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-sos-scalp-spray-anti-itch-active', 'Standard Beauty SOS Scalp Spray with Anti Itch Active', 'A leave-in scalp spray built around an anti-itch active for instant relief from an itchy or dry scalp, formulated to calm redness and sensitivity while balancing the scalp''s microbiome. It''s also designed to enhance circulation and support hair growth while reducing dandruff and excess sebum. Suitable for all hair types, including 1–4C, braided and unbraided styles.',
  199, 206.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-sos-scalp-spray-with-anti-itch-active-100-ml', 'hair-scalp', ARRAY['Dandruff & Scalp']::text[], '{}',
  '{}', '100ml', 'Shake before use. As needed or once daily, spray a generous amount onto the scalp. Leave-in treatment.', ARRAY['Anti-Itch Active']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-hot-oil-hair-therapy', 'Standard Beauty Hot Oil Hair Therapy', 'A hot oil treatment blending rosemary, argan and castor oils with nettle herbs, formulated for dry and damaged hair. It''s designed to tame frizz, deeply moisturise and strengthen strands, and to support new growth after hair loss or thinning when massaged into the scalp. Free from artificial fragrance and colour, and vegan.',
  195, 202.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-hot-oil-hair-therapy-100-ml', 'hair-scalp', ARRAY['Dry & Dehydrated', 'Dandruff & Scalp']::text[], ARRAY['Fragrance-Free', 'Vegan']::text[],
  '{}', '100ml', '1-2 times per week. Heat the bottle (remove pipette), apply to dry or damp hair section by section, massage, cover and leave 20 minutes or overnight. Rinse and shampoo. Target scalp for growth or strands/ends for moisture.', ARRAY['Rosemary Oil', 'Argan Oil', 'Castor Oil', 'Nettle Extract']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-silicone-applicator-brush', 'Standard Beauty Silicone Applicator Brush', 'A mask applicator with a wooden handle and silicone tip, designed for hygienic, even and controlled application of masks and moisturisers. It reduces product waste and mess compared with applying by hand, and is easy to clean, dry and store between uses. Safe during pregnancy and breastfeeding, and vegan.',
  75, 77.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-silicone-applicator-brush', 'tools', '{}', ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', NULL, 'Scoop mask, dip brush, apply in even upward strokes from the centre of the face outward. Avoid eye and lip areas. Rinse brush after use.', '{}', true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-pigmentation-buster-mask', 'Standard Beauty Pigmentation Buster Mask', 'A chemical exfoliating mask combining five plant extracts — blueberry, sugarcane, orange, lemon and sugar maple — with four AHAs (lactic, glycolic, citric and tartaric) and alpha arbutin. It''s formulated to brighten dark spots, address sun damage and acne scarring, and soothe irritation and redness while moisturising. Vegan and fragrance-free; Standard Beauty recommends no more than 10 minutes'' contact time, two to three times a week.',
  225, 233.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-pigmentation-buster-mask', 'treatments', ARRAY['Hyperpigmentation', 'Sensitive Skin', 'Dry & Dehydrated']::text[], ARRAY['Vegan', 'Fragrance-Free']::text[],
  '{}', NULL, 'Patch test. Use 2-3 times a week. Apply a generous amount on clean skin, leave for a max of 10 minutes, rinse with warm water. Follow with normal routine.', ARRAY['Alpha Arbutin', 'Glycolic Acid', 'Lactic Acid', 'AHA Complex']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-mild-face-wash', 'Standard Beauty Mild Face Wash', 'A mild face wash built on natural rose, cucumber and chamomile extracts for sensitive or dry skin, formulated to cleanse and hydrate without irritating or stripping the skin''s natural oils. Dermatologically and clinically tested for low irritancy, it''s safe during pregnancy and breastfeeding, and vegan.',
  135, 140.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-mild-face-wash-125-ml', 'face', ARRAY['Sensitive Skin', 'Dry & Dehydrated']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '125ml', 'Use AM and/or PM. Apply in circular motions and rinse with water. Follow with normal routine.', ARRAY['Rose Extract', 'Cucumber Extract', 'Chamomile Extract']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-aloe-cucumber-toner-sensitive-skin', 'Standard Beauty Aloe & Cucumber Toner for Sensitive Skin', 'A niacinamide toner built on cucumber and aloe for dry and sensitive skin, formulated to soothe inflammation while softening and strengthening the skin barrier. Niacinamide is also positioned to firm, even out tone and brighten pigmentation over time. Dermatologically and clinically tested for low irritancy, safe during pregnancy and breastfeeding, and vegan.',
  135, 140.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-aloe-cucumber-toner-for-sensitive-skin-125-ml', 'face', ARRAY['Sensitive Skin', 'Dry & Dehydrated', 'Hyperpigmentation']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '125ml', 'Patch test. Use AM or PM only, 2-3x per week. After washing, apply on a cotton pad and gently rub. Follow with normal routine and SPF.', ARRAY['Niacinamide', 'Aloe', 'Cucumber Extract']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-10-niacinamide-serum-1-zinc', 'Standard Beauty 10% Niacinamide Serum & 1% Zinc', 'A 10% niacinamide serum with 1% zinc, formulated for inflamed, uneven and textured skin. It''s aimed at treating hyperpigmentation and maintaining elasticity while soothing acne, rosacea and other inflammatory conditions, and refining the appearance of pores. Safe during pregnancy and breastfeeding, and vegan — but shouldn''t be combined with vitamin C.',
  185, 192.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-10-niacinamide-serum-1-zinc-30-ml', 'face', ARRAY['Hyperpigmentation', 'Acne & Breakouts', 'Sensitive Skin']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '30ml', 'Patch test. Apply AM and/or PM after cleansing and toning on damp skin. Follow with moisturiser, oil-based serum and SPF 50+.', ARRAY['Niacinamide', 'Zinc']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-1-5-hyaluronic-serum-peptides', 'Standard Beauty 1,5% Hyaluronic Serum & Peptides', 'A 1.5% hyaluronic acid serum with peptides, formulated for wrinkled and dehydrated skin. It''s designed to deliver intensive hydration and plumping while improving firmness and elasticity, supporting collagen and lipids, and softening the look of wrinkles and fine lines. Suitable for all skin types, safe during pregnancy and breastfeeding, and vegan.',
  195, 202.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-1-5-hyaluronic-serum-peptides-30-ml', 'face', ARRAY['Dry & Dehydrated', 'Fine Lines & Ageing']::text[], ARRAY['Pregnancy-Safe', 'Vegan']::text[],
  '{}', '30ml', 'Patch test. Apply AM and/or PM after cleansing and toning on damp skin. Follow with moisturiser, oil-based serum and SPF 50+.', ARRAY['Hyaluronic Acid', 'Peptides']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'standard-beauty'),
  'standard-beauty-squalane-serum', 'Standard Beauty Squalane Serum', 'A 100% plant-derived squalane serum formulated for dry, sensitive and acne-prone skin, including skin prone to eczema. It''s designed to lock in moisture for a dewy finish without feeling greasy or clogging pores, while helping to minimise the look of sun damage and age spots and support firmer, plumper skin over time. Fragrance-free, vegan, and safe during pregnancy and breastfeeding.',
  175, 181.99,
  'https://www.faithful-to-nature.co.za/standard-beauty-squalane-serum-30-ml', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin', 'Acne & Breakouts']::text[], ARRAY['Pregnancy-Safe', 'Fragrance-Free', 'Vegan']::text[],
  '{}', '30ml', 'Patch test. Apply AM and/or PM as last step, follow with SPF. For hair: work through damp clean hair daily or as required.', ARRAY['Squalane']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-sunnybonani-spf40-daily-defence-cream', 'SKOON. SUNNYBONANI® SPF40 Daily Defence Cream', 'A mineral SPF40+ daily moisturiser built to do several jobs in one step: hydrate, brighten, repair and protect against both UV and blue light. The broad-spectrum mineral sunscreen base is paired with hyaluronic acid, niacinamide, bakuchiol and ceramides in a lightweight, non-greasy formula designed to blend into every skin tone without a white cast. It isn''t water-resistant, so it suits everyday wear rather than swimming or heavy sweating.',
  599, 622.99,
  'https://www.faithful-to-nature.co.za/skoon-sunnybonanir-spf40-all-in-one-daily-defence-cream', 'sun-care', ARRAY['Hyperpigmentation', 'Dry & Dehydrated', 'Fine Lines & Ageing']::text[], '{}',
  ARRAY['All Skin Tones']::text[], NULL, 'AM: as the final step in your routine, apply 1-2 pumps to face, neck, and décolletage. Gently massage in and allow a few minutes to absorb. To neutralise any white cast and match skin tone, blend with Colour-Me-Perfect Elixir. Not water resistant; not suitable for water-based activities.', ARRAY['Hyaluronic Acid', 'Niacinamide', 'Bakuchiol', 'Ceramides']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-essentials-double-cleanse-duo', 'SKOON. essentials Double Cleanse Duo - Gentle Cream + Foaming Cleanser', 'A two-step cleansing routine built around a cream-to-milk first cleanse and a gentle foaming second cleanse, designed to lift makeup, sunscreen and daily grime without disturbing the skin barrier. The oil-based first step dissolves impurities while the water-based follow-up finishes the job, leaving skin balanced and comfortably hydrated rather than stripped.',
  459, 477.99,
  'https://www.faithful-to-nature.co.za/skoon-essentials-combo-dry-patches', 'face', ARRAY['Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'Step 1 Gentle Cream Cleanser: apply to dry skin, massage to dissolve makeup and impurities, add water to emulsify into a milky texture, then rinse. Step 2 Gentle Foaming Cleanser: apply to damp skin, massage to a soft foam, rinse with lukewarm water.', ARRAY['Cleansing Oils', 'Skin-Loving Lipids']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-eye-shift-duo-bright-eyed-sleep-depuff', 'SKOON. The Eye Shift Duo - Bright-Eyed Brighten & Firm Eye Cream + Sleep Depuff Eye Gel Pen 8ml FREE', 'Pairs the Bright-Eyed eye cream with a bonus Sleep Depuff gel pen for a combined approach to tired-looking eyes. The cream hydrates and reinforces the skin barrier while working to brighten and firm, visibly softening the look of dark circles and puffiness over time. Applied after serum and left to absorb before moisturiser, it targets the eye area without adding an extra step to the routine.',
  999, 1038.99,
  'https://www.faithful-to-nature.co.za/skoon-the-eye-shift-duo-bright-eyed-brighten-firm-eye-cream-15ml-sleep-depuff-eye-gel-pen-8ml-free', 'face', ARRAY['Dark Circles & Puffiness', 'Fine Lines & Ageing']::text[], '{}',
  '{}', '15ml + 8ml', 'Use morning and evening. Apply a pea-sized amount to clean, dry skin around the eyes, including the brow bone, eyelid, outer corners and under-eye area. Use after serum and allow to absorb fully before applying face cream. Apply gently without tugging.', ARRAY['Hydrating Complex', 'Brightening & Firming Complex']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-happy-flora-microbiome-balancing-face-cream', 'SKOON. HAPPY FLORA Microbiome Balancing Face Cream', 'A microbiome-focused moisturiser built on Swiss yoghurt and Kigelia africana to support the bacterial balance underpinning healthy skin. It''s formulated to strengthen the skin barrier and calm redness, dryness and general sensitivity, with baobab oil adding hydration and a light natural vanilla scent rounding out the feel — a fit for skin that needs settling down as much as moisturising.',
  459, 477.99,
  'https://www.faithful-to-nature.co.za/skoon-happy-flora-microbiome-balancing-face-cream', 'face', ARRAY['Sensitive Skin', 'Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'AM/PM: smooth a dollop of the cream onto clean skin. For intense nourishment, add 1-2 drops of a SKOON concentrate to the cream, blend in the palm of your hand and apply.', ARRAY['Pre/Probiotics', 'Swiss Yoghurt', 'Kigelia Africana', 'Baobab Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-sleep-depuff-eye-gel-pen', 'SKOON. SLEEP DEPUFF Eye Gel Pen – Caffeine, Peptides & Bulbine', 'A roll-on gel treatment that pairs caffeine with peptides and bulbine to address puffiness and fine lines around the eyes. The metal rollerball delivers a cooling effect on contact, while the antioxidant-rich formula is designed to soften crow''s feet, reduce dark circles and brighten the under-eye area over time. Meant to be layered under a cream, morning or night.',
  599, 622.99,
  'https://www.faithful-to-nature.co.za/skoon-sleep-depuff-eye-gel-pen', 'face', ARRAY['Dark Circles & Puffiness', 'Fine Lines & Ageing']::text[], '{}',
  '{}', NULL, 'Shake the pen to coat the metal roller ball with gel. Glide the roller ball under each eye from inner to outer corner several times. Re-shake if necessary. Follow with a cream to lock in water-based actives. Can be used AM and PM.', ARRAY['Caffeine', 'Peptides', 'Bulbine']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-sugababe-face-concentrate-hydrating-serum', 'SKOON. SUGABABE Face Concentrate – Hydrating Serum', 'A vegan, fragrance-free hydrating serum built around three oil-based concentrates plus acmella, an ingredient known for a botox-like tightening effect that helps plump skin and soften the appearance of lines. It''s gentle enough for sensitive, reactive skin, calming inflammation while it works, and can also be massaged into newly healed tissue as part of scar maintenance. A few drops mixed into moisturiser, or applied neat, is enough.',
  599.95, 623.99,
  'https://www.faithful-to-nature.co.za/skoon-15ml-sugababe-moisture-matrix-face-concentrate', 'face', ARRAY['Fine Lines & Ageing', 'Sensitive Skin', 'Dry & Dehydrated']::text[], ARRAY['Vegan', 'Cruelty-Free', 'Fragrance-Free']::text[],
  '{}', NULL, 'AM | PM: add 1-2 drops to enrich your moisturiser. Massage twice daily into newly healed tissue for aesthetic scar maintenance. Alternatively, smooth directly onto clean skin.', ARRAY['Acmella', 'Plant Oil Concentrates']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-hydrosurge-duo-pack', 'SKOON. HYDROSURGE Duo Pack – NanoPillow Serum + Activator Mist', 'Combines the WOW-WOW WONDER+ NanoPillow serum with the SKIN PJ''s Activator mist for an intensive hydration routine. The waterless, electrospun serum carries 20% hyaluronic acid and is designed to be activated with the mist immediately before application, driving moisture deep into skin for a plumper, more radiant finish. Built for skin that needs a real hydration boost rather than a light top-up.',
  799.95, 831.99,
  'https://www.faithful-to-nature.co.za/skoon-hydrosurge-duo-pack', 'face', ARRAY['Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'AM | PM: dispense one WOW-WOW WONDER+ Nanopillow into the cupped palm of a clean, dry hand by gently tapping the container. Activate with the SKIN PJ''s Activator Face Mist and pat/press into skin.', ARRAY['Hyaluronic Acid (20%)', 'Pro-Collagen Complex']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-dream-team-duo-pack', 'SKOON Dream Team Duo Pack', 'Splits skincare into a clear day-and-night routine: a vitamin C serum for mornings that hydrates, softens and brightens, and a vitamin A treatment for evenings that supports collagen production and skin renewal. Hyaluronic acid and phytic acid round out the formulas, working on tone and texture from both directions. Daily broad-spectrum SPF is recommended alongside the evening vitamin A step.',
  671.3, 698.99,
  'https://www.faithful-to-nature.co.za/skoon-dream-team-duo-pack-159332', 'face', ARRAY['Hyperpigmentation', 'Fine Lines & Ageing', 'Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'Morning: smooth a few drops of the Wow Wow Wonder serum onto clean, damp skin, mist for best results, lock in moisture with a SKOON concentrate or moisturiser. Evening only: smooth a dollop of the Vitamin A treatment onto clean skin. Use a broad-spectrum SPF during the day.', ARRAY['Vitamin C', 'Vitamin A', 'Hyaluronic Acid', 'Phytic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-ruby-marine-face-balm-stick', 'SKOON. RUBY MARINE Face Balm Stick – Barrier Repair Balm', 'A barrier-repair balm in a travel-friendly stick, built on marula oil, niacinamide, ceramide 3 and pomegranate sterols to soothe and rebuild a compromised skin barrier. It''s formulated to ease hyperpigmentation and inflammation while delivering deep hydration, and the twist-up format makes it easy to apply on the go without decanting into a jar.',
  409, 425.99,
  'https://www.faithful-to-nature.co.za/skoon-ruby-marine-barrier-recovery-face-balm-stick-15ml', 'face', ARRAY['Hyperpigmentation', 'Dry & Dehydrated', 'Sensitive Skin']::text[], '{}',
  '{}', '15ml', 'AM/PM: apply after cleansing and serum. Remove the protective cover and glide the balm onto the face and décolletage, massaging in with fingertips. Replace the cover after use.', ARRAY['Marula Oil', 'Niacinamide', 'Ceramide 3', 'Pomegranate Sterols']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-oh-so-bubbly-hydrating-cleanser', 'SKOON. OH SO BUBBLY Hydrating Cleanser for Combination & Sensitive Skin', 'A gentle, airy cleanser made with real Swiss yoghurt, honey and Kigelia africana, built to clear away impurities without disrupting the skin''s natural barrier or pH. It''s designed for combination and sensitive skin, hydrating, firming and toning as it cleanses so skin is left soft and calm rather than tight — and works well as the second step in a double-cleanse routine.',
  549.95, 571.99,
  'https://www.faithful-to-nature.co.za/skoon-oh-so-bubbly-soothing-cloud-cleanser-100ml', 'face', ARRAY['Sensitive Skin', 'Dry & Dehydrated']::text[], '{}',
  '{}', '100ml', 'AM | PM: apply 1-3 pumps on damp skin and gently massage in circular motion for 45-60 seconds. Remove with a Bamboo Muslin facecloth soaked in lukewarm water. Use as the second step in a double-cleanse routine.', ARRAY['Swiss Yoghurt', 'Honey', 'Kigelia Africana']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-fruitful-radiance-night-exfoliant', 'SKOON. FRUITFUL RADIANCE – AHA/BHA Night Exfoliant + Cleanse Pads', 'A leave-on AHA/BHA night exfoliant that targets hyperpigmentation and breakouts by clearing dead skin cells, unclogging pores and encouraging cell turnover for a brighter, more even complexion. It also helps subsequent products absorb better. Reusable bamboo cotton pads are included, and a mild tingling on first use is expected as skin builds tolerance.',
  749.95, 779.99,
  'https://www.faithful-to-nature.co.za/skoon-fruitful-radiance-night-liquid-exfoliant-free-cleanse-pads', 'treatments', ARRAY['Hyperpigmentation', 'Acne & Breakouts']::text[], '{}',
  '{}', NULL, 'PM: after cleansing, dampen a cotton pad with the exfoliant and sweep over face, neck, and décolletage, avoiding the eye area. Do not rinse; once absorbed, follow with face cream. Start with gradual use — a mild tingling sensation is normal. For skin cycling, use on Night 1.', ARRAY['AHA', 'BHA']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-baku-glow-face-cream', 'SKOON. BAKU GLOW Face Cream', 'A plant-based face cream built around 1% bakuchiol, a gentler alternative to retinol, alongside ceramides, kigelia and hyaluronic acid. It''s designed to encourage gradual cell turnover and collagen production to soften fine lines and improve elasticity, while supporting hydration, texture and tone. Formulated to suit all skin types, and safe to use during pregnancy or while breastfeeding.',
  663.2, 689.99,
  'https://www.faithful-to-nature.co.za/skoon-30ml-baku-glow-face-cream', 'face', ARRAY['Fine Lines & Ageing', 'Dry & Dehydrated']::text[], ARRAY['Pregnancy-Safe']::text[],
  '{}', '30ml', 'AM & PM: smooth 2 to 3 pumps onto cleansed skin. Use twice daily for optimal results. Follow with sun cream by day and a nourishing face cream at night. Safe for pregnancy or breastfeeding.', ARRAY['Bakuchiol (1%)', 'Ceramides', 'Kigelia', 'Hyaluronic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-retinin-night-01-retinal-treatment', 'SKOON. RETININ® Night 0.1% Retinal Treatment', 'A night-only treatment built on 0.1% retinal, peptides and fulvic acid to firm skin, soften fine lines and wrinkles, and refine texture while also addressing breakouts. It''s formulated for gentle, gradual renewal rather than aggressive resurfacing, using cruelty-free ingredients with no artificial colours or fragrances. Start at two to three nights a week and build up as skin adjusts, pairing daytime use with broad-spectrum SPF.',
  699, 726.99,
  'https://www.faithful-to-nature.co.za/skoon-retininr-night-face-cream-0-1-retinal', 'treatments', ARRAY['Fine Lines & Ageing', 'Acne & Breakouts']::text[], ARRAY['Cruelty-Free', 'Fragrance-Free']::text[],
  '{}', NULL, 'PM ONLY: apply 2 to 3 pumps to cleansed skin, 2-3 times per week at night. Increase frequency gradually as tolerated. Apply broad-spectrum SPF during the day.', ARRAY['Retinal (0.1%)', 'Peptides', 'Fulvic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-wow-wow-wonder-nanopillow-serum-30-day', 'SKOON. WOW-WOW WONDER NanoPillow Serum 30-day pack', 'A hydrating pro-collagen serum designed to nourish and regenerate skin while reinforcing its natural moisture barrier against everyday environmental stress. Used consistently, it''s formulated to soften fine lines, firm and tone skin, and fade dark spots, all in a lightweight, non-greasy texture suited to every skin type.',
  699.95, 727.99,
  'https://www.faithful-to-nature.co.za/skoon-wow-wow-wonder-nanopillow-serum', 'face', ARRAY['Dry & Dehydrated', 'Hyperpigmentation', 'Fine Lines & Ageing']::text[], '{}',
  '{}', NULL, 'Begin with clean, dry hands, gently tap the container to drop one NanoPillow into your cupped palm. Reseal for future use. Spritz 4-6 times of SKIN PJ''s Activator Face Mist directly onto the Nanopillow, mist your entire face, and allow a few moments to absorb.', ARRAY['Pro-Collagen Complex', 'Hydrating Actives']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-everyday-essentials-set-combination-oily-skin', 'SKOON. EVERYDAY ESSENTIALS SET – Combination & Oily Skin', 'A streamlined routine for oily T-zone, combination and sensitive skin, pairing a purifying clay cleanser with a hyaluronic hydrating and brightening serum. Together they clear congested pores and balance oil production while still hydrating drier patches and calming redness or irritation, so one routine covers uneven skin without over-drying it.',
  1149, 1194.99,
  'https://www.faithful-to-nature.co.za/skoon-everyday-essential-set-t-zone-combination-oily-t-sensitive', 'face', ARRAY['Acne & Breakouts', 'Sensitive Skin']::text[], '{}',
  '{}', NULL, 'Cleanse: apply a coin-sized amount of the Purifying Clay Cleanser to damp skin, massage, remove with a bamboo Muslin facecloth soaked in lukewarm water, rinse. Serum: apply a few drops of the Hyaluron Hydrating & Brightening Serum onto damp skin.', ARRAY['Purifying Clay', 'Hyaluronic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-everyday-essentials-set-combination-dry-patches', 'SKOON. EVERYDAY ESSENTIALS SET – Combination & Dry Patches', 'Built for combination, dry and sensitive skin, this set pairs a gel-to-milk cleanser and makeup remover with a hyaluronic hydrating and brightening serum, moisturiser and barrier balm. The routine is designed to cleanse gently while restoring moisture to rough, dry patches, controlling shine elsewhere and calming irritation, rather than treating the face as one uniform skin type.',
  1149, 1194.99,
  'https://www.faithful-to-nature.co.za/skoon-everyday-essential-set-patch-perfect-combination-dry-patches-sensitive', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin']::text[], '{}',
  '{}', NULL, 'Cleanse: apply a coin-sized amount of the Gel-to-Milk Cleanser + Makeup Remover to dry skin, add water and massage gently, remove excess with a Bamboo Muslin facecloth, rinse. Serum: apply a few drops of the Hyaluron Hydrating & Brightening Serum onto damp skin.', ARRAY['Gel-to-Milk Cleanser Actives', 'Hyaluronic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-pixie-dust-nanopillow-serum', 'SKOON. PIXIE DUST NanoPillow Serum – Barrier Boost', 'A barrier-focused hydrating serum combining niacinamide, squalane, hyaluronic acid and azelaic acid in a single-dose NanoPillow format. It''s designed to deliver instant hydration while reinforcing the skin barrier, smoothing texture, brightening tone and fading dark spots for a more even complexion.',
  699.95, 727.99,
  'https://www.faithful-to-nature.co.za/skoon-pixie-dust-nanopillow-serum', 'face', ARRAY['Dry & Dehydrated', 'Hyperpigmentation', 'Sensitive Skin']::text[], '{}',
  '{}', NULL, 'AM/PM: dispense one Pixie Dust Nanopillow into the cupped palm of a clean, dry hand by gently tapping the container. Reseal for future use. Activate with the Face Mist and pat/press into skin.', ARRAY['Niacinamide', 'Squalane', 'Hyaluronic Acid', 'Azelaic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-double-cleanse-heroes-combo-dry-patches', 'SKOON. Double Cleanse Heroes Combo - Dry Patches', 'Pairs the Gel-to-Milk cleanser with the Oh So Bubbly foaming cleanser for a double cleanse that lifts dirt, impurities and excess oil while protecting the skin''s natural oils and moisture barrier. The combination is built to unclog pores and combat breakouts while still hydrating and balancing skin, so a thorough cleanse doesn''t come at the cost of comfort.',
  759.96, 790.99,
  'https://www.faithful-to-nature.co.za/skoon-double-cleanse-heroes-combo-dry-patches', 'face', ARRAY['Acne & Breakouts', 'Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'Gel-to-Milk Cleanser & Make-up Remover, use AM | PM: gently massage a small amount into skin, dip fingers into water to emulsify, splash with water and wipe with a Bamboo Muslin facecloth to remove excess cleanser.', ARRAY['Gel-to-Milk Cleanser Actives', 'Swiss Yoghurt']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-bright-eyed-eye-cream-vitamin-c-k1', 'SKOON. BRIGHT-EYED Eye Cream – Vitamin C & K1 Brightening Formula', 'An eye cream built on vitamin C and vitamin K1 to brighten dark circles, reduce puffiness and improve circulation around the eyes. Collagen-supporting ingredients work alongside deep hydration to smooth and firm the area while strengthening the skin barrier, for a more even, less tired-looking eye area over time.',
  999, 1038.99,
  'https://www.faithful-to-nature.co.za/skoon-bright-eyed-brighten-firm-eye-cream-15ml', 'face', ARRAY['Dark Circles & Puffiness', 'Hyperpigmentation', 'Fine Lines & Ageing']::text[], '{}',
  '{}', '15ml', 'AM | PM: apply a pea-sized amount to clean, dry skin around the eyes, including brow bone, eyelid, outer corners, and under-eye. Use after serum, let absorb fully before applying face cream. Store below 25°C, avoid direct sunlight.', ARRAY['Vitamin C', 'Vitamin K1', 'Collagen-Boosting Ingredients']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-the-one-hydra-plump-face-cream', 'SKOON. The One Hydra-Plump Face Cream - 30ml', 'A lightweight, fast-absorbing face cream built on marula oil, ceramide 3 and hyaluronic acid to lock in moisture and support a plump, supple complexion. A natural fynbos-inspired scent rounds out a formula designed for deep, all-day nourishment without a heavy or greasy feel.',
  569, 591.99,
  'https://www.faithful-to-nature.co.za/skoon-the-one-hydra-plump-face-cream-30ml', 'face', ARRAY['Dry & Dehydrated']::text[], '{}',
  '{}', '30ml', 'Use daily AM or PM. Smooth 3-4 pumps onto clean skin. Alternatively, add 1-2 drops of a SKOON concentrate, blend in the palm of your hand, and apply.', ARRAY['Marula Oil', 'Ceramide 3', 'Hyaluronic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-happy-flora-microbiome-balancing-face-cream-refill', 'SKOON. HAPPY FLORA Microbiome Balancing Face Cream - 30ml Refill', 'An eco-friendly refill of the Happy Flora microbiome-balancing face cream, letting you top up the formula instead of buying a new jar. The same blend of Swiss yoghurt, baobab and prebiotics is designed to support a balanced skin microbiome and a more resilient-looking barrier.',
  459, 477.99,
  'https://www.faithful-to-nature.co.za/skoon-happy-flora-microbiome-balancing-face-cream-30ml-refill', 'face', '{}', '{}',
  '{}', '30ml', 'Use daily AM or PM. Smooth 3-4 pumps onto clean skin. Refill: twist open the base, screw out the current insert to screw in the refill unit.', ARRAY['Swiss Yoghurt', 'Baobab', 'Prebiotics']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-wrap-me-up-ultra-thick-comforting-face-cream', 'SKOON. WRAP ME UP Ultra-Thick Comforting Face Cream - 30ml', 'An ultra-thick comforting cream built on ceramides, pomegranate sterols and organic shea butter, designed to manage excessive dryness and calm stressed, uncomfortable skin. It''s formulated to maintain a healthy-looking barrier while restoring a more balanced, settled complexion.',
  569, 591.99,
  'https://www.faithful-to-nature.co.za/skoon-wrap-me-up-ultra-thick-comforting-face-cream-30ml', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin']::text[], '{}',
  '{}', '30ml', 'Use daily AM or PM. Smooth 3-4 pumps onto clean skin. Bottle priming: gently tap the base to dislodge air bubbles, pump several times to initiate product flow.', ARRAY['Ceramides', 'Pomegranate Sterols', 'Shea Butter']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-pretty-smooth-oil-balance-gel-cream', 'SKOON. PRETTY SMOOTH Oil-Balance Gel-Cream - 30ml', 'A fast-absorbing gel-cream built on niacinamide and seaweed extract to regulate surface shine and refine texture without weighing skin down. It''s designed to balance an oily or combination complexion while still supporting a healthy-looking skin barrier.',
  569, 591.99,
  'https://www.faithful-to-nature.co.za/skoon-pretty-smooth-oil-balance-gel-cream-30ml', 'face', ARRAY['Acne & Breakouts']::text[], '{}',
  '{}', '30ml', 'Apply morning and evening after cleansing and a water-based serum. Gently massage into face and neck until fully absorbed.', ARRAY['Niacinamide', 'Seaweed Extract']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-essentials-rich-moisture-cream', 'SKOON. essentials Rich Moisture Cream', 'A rich moisturiser built on ceramide NP, shea butter and antioxidant-rich botanicals, designed to deeply hydrate dry, dehydrated and compromised skin. Kalahari melon seed and coconut oils help reinforce the barrier and reduce moisture loss, leaving skin feeling soft, smooth and more resilient.',
  399, 414.99,
  'https://www.faithful-to-nature.co.za/skoon-essentials-rich-moisture-cream', 'face', ARRAY['Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'Apply to clean skin after cleansing. Gently massage into face and neck until fully absorbed. Use morning and evening, or as needed, for intensive hydration and barrier support.', ARRAY['Ceramide NP', 'Shea Butter', 'Kalahari Melon Seed Oil', 'Coconut Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-skin-pjs-face-mist-buchu-cbd', 'SKOON. SKIN PJs Face Mist - Hydrating Toner with Buchu & CBD', 'A water-based hydrating toner spiked with buchu and CBD, designed to deliver an instant refresh while nourishing and calming sensitive skin. It''s built to reinforce the skin''s natural barrier and prime it to absorb serums, moisturisers and masks more effectively, and can be reapplied throughout the day.',
  349, 362.99,
  'https://www.faithful-to-nature.co.za/skoon-pj-s-activator-face-mist', 'face', ARRAY['Sensitive Skin', 'Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'Spritz clean skin with the mist, follow by applying a water-based serum, cream and/or oil-based concentrate. Misting before and after water-based actives enhances efficacy. Can be used throughout the day.', ARRAY['Buchu', 'CBD']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'skoon'),
  'skoon-bff-sleepover-overnight-regeneration-face-mask', 'SKOON. BFF SLEEPOVER Overnight Regeneration Face Mask', 'An overnight regeneration sheet mask built on hyaluronic acid, CBD and antioxidants, designed to repair, soothe and plump skin while it sleeps. The nanofibre sheet is soaked in active ingredients and oils to support long-term hydration and skin cell regeneration.',
  349.95, 363.99,
  'https://www.faithful-to-nature.co.za/skoon-bff-sleepover-overnight-regeneration-mask', 'treatments', ARRAY['Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'Remove one mask from the sachet using dry hands, re-seal the ziplock. Spritz the entire face with the Activator face mist until very damp. Remove the middle mesh piece and apply the mask directly onto clean, damp skin, leaving the paper cover in place.', ARRAY['Hyaluronic Acid', 'CBD', 'Antioxidants']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-bakuchiol-serum', 'Esse Bakuchiol Serum', 'A plant-based alternative to retinol built on bakuchiol, aloe vera and jojoba seed oil, designed to boost collagen synthesis and smooth fine lines, wrinkles and rough texture. It''s formulated to calm inflammation and fade hyperpigmentation while improving elasticity, with hydrating and protective properties suited to twice-daily use. Vegan-friendly and certified cruelty-free by PETA''s Beauty Without Bunnies programme.',
  575, 597.99,
  'https://www.faithful-to-nature.co.za/esse-bakuchiol-serum', 'face', ARRAY['Fine Lines & Ageing', 'Hyperpigmentation', 'Sensitive Skin']::text[], ARRAY['Vegan', 'Cruelty-Free']::text[],
  '{}', NULL, 'Apply a thin layer over the face twice daily. Follow with a microbiome-friendly moisturiser. Store at room temperature out of direct sunlight.', ARRAY['Bakuchiol', 'Aloe Vera', 'Jojoba Seed Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-resurrect-serum', 'Esse Resurrect Serum', 'Built around the Namibian resurrection plant, a shrub prized for its hydrating and antioxidant properties, alongside aloe, baobab and probiotics. It''s designed for evening use to calm inflammation, soften wrinkles and fine lines, and plump tired-looking skin. Made locally, cruelty-free and organic.',
  1375, 1429.99,
  'https://www.faithful-to-nature.co.za/esse-resurrect-serum', 'face', ARRAY['Fine Lines & Ageing', 'Dry & Dehydrated']::text[], ARRAY['Cruelty-Free']::text[],
  '{}', NULL, 'Use in the evenings. Smooth over face, neck & décolleté after cleansing & toning. Follow with your preferred natural moisturiser. Store in a cool dry place out of direct sunlight.', ARRAY['Resurrection Plant', 'Aloe', 'Baobab', 'Probiotics']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-live-probiotic-mist', 'Esse Live Probiotic Mist', 'A facial mist activated with live probiotic powder just before first use, designed to hydrate, protect and rebalance the skin''s microbiome while reinforcing its natural barrier. It''s built to lock in moisture for lasting hydration across all skin types, and should be used within three months of activation.',
  650, 675.99,
  'https://www.faithful-to-nature.co.za/esse-live-probiotic-mist', 'face', ARRAY['Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'To activate, add the Probiotic Powder to the Mist bottle, replace the pump and shake well for at least 1 minute. After cleansing, spritz directly onto face, neck, and décolleté. Follow with your preferred Esse moisturiser. Use within 3 months of activation.', ARRAY['Live Probiotics', 'Microbiome-Balancing Actives']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-pro-sun-d-serum', 'Esse Pro Sun D Serum', 'A provitamin D serum designed to activate in sunlight, helping skin build its own vitamin D while supporting barrier repair and cell renewal. The lightweight, fast-absorbing formula is built to calm inflammation, slow visible ageing and leave skin plump, hydrated and glowing when paired with a few minutes of unprotected sun exposure. Vegan-friendly and certified cruelty-free by Beauty Without Cruelty SA.',
  575, 597.99,
  'https://www.faithful-to-nature.co.za/esse-pro-sun-d-serum-15ml', 'face', ARRAY['Fine Lines & Ageing', 'Dry & Dehydrated', 'Sensitive Skin']::text[], ARRAY['Vegan', 'Cruelty-Free']::text[],
  '{}', '15ml', 'Apply once daily or before sun exposure. Smooth over face and décolleté after cleansing and misting. For optimum Vitamin D synthesis, expose skin to at least 5 minutes of direct sunlight without SPF or foundation. Store in a cool, dry place out of direct sunlight.', ARRAY['Provitamin D', 'Barrier-Repair Complex']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-hyaluronic-serum', 'Esse Hyaluronic Serum', 'An anti-ageing serum for mature skin combining probiotics, prebiotics and hyaluronic acid in a fast-absorbing, cruelty-free formula. It''s designed to protect existing collagen and slow premature ageing while calming inflammation and reinforcing the skin''s natural barrier, leaving skin softer and more supple with regular evening use.',
  675, 701.99,
  'https://www.faithful-to-nature.co.za/esse-hyaluronic-serum', 'face', ARRAY['Fine Lines & Ageing', 'Dry & Dehydrated', 'Sensitive Skin']::text[], ARRAY['Cruelty-Free']::text[],
  '{}', NULL, 'Use in the evenings. Smooth over face, neck and décolleté after cleansing and toning. Follow with preferred moisturiser.', ARRAY['Hyaluronic Acid', 'Probiotics', 'Prebiotics']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-sunscreen', 'Esse Sunscreen', 'An organic mineral sunscreen offering broad-spectrum SPF30 protection via coated zinc oxide, formulated to spread easily and evenly with 0% nano-sized particles. It''s fragrance-free and pH-balanced for sensitive skin, and biodegradable and coral-reef safe for anyone applying it before swimming. Reapply regularly, especially after swimming or towelling.',
  690, 717.99,
  'https://www.faithful-to-nature.co.za/esse-sunscreen', 'sun-care', ARRAY['Sensitive Skin']::text[], ARRAY['Fragrance-Free', 'Reef-Safe']::text[],
  '{}', NULL, 'Apply liberally to exposed areas of skin before sun exposure. Reapply regularly to maintain protection, especially after swimming or towelling. For external use only; avoid contact with eyes.', ARRAY['Zinc Oxide', 'Broad-Spectrum Mineral Filters']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-lip-conditioner', 'Esse Lip Conditioner', 'A protective lip conditioner made from organic, responsibly sourced ingredients, designed to lock in moisture and support the lips'' natural barrier function. A small amount goes a long way, making it a simple daily addition rather than a heavy balm.',
  355, 369.99,
  'https://www.faithful-to-nature.co.za/esse-lip-conditioner', 'face', ARRAY['Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'Apply a small amount to the lips as needed. A little goes a long way.', ARRAY['Organic Botanical Oils', 'Barrier-Restoring Actives']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-light-moisturiser-oily-combination-skin', 'Esse Light Moisturiser (Oily & Combination Skin)', 'A lightweight moisturiser built for oily and combination skin, designed to let skin function without clogged pores or a build-up of impurities when paired with an Esse cleanser. It''s formulated without the harsher chemicals found in many conventional moisturisers, making it a fit for oily and acne-prone skin that still needs hydration.',
  820, 852.99,
  'https://www.faithful-to-nature.co.za/esse-light-moisturiser-oily-combination-skin', 'face', ARRAY['Acne & Breakouts']::text[], '{}',
  '{}', NULL, 'For optimal results, apply gently onto clean skin after cleansing, preferably using circular motions to stimulate blood circulation. Can be used day and night.', ARRAY['Lightweight Botanical Complex', 'Non-Comedogenic Actives']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-repair-oil-tissue-oil', 'Esse Repair Oil (Tissue Oil)', 'A tissue oil built on African botanicals — manketti, marula and yangu, rich in omega fatty acids and vitamins, alongside jojoba and rosehip — designed to support the look of stretch marks, scarring, pigmentation and damaged skin. It can be massaged directly into affected areas or blended into a moisturiser, and is intended to be used as often as needed.',
  655, 681.99,
  'https://www.faithful-to-nature.co.za/esse-repair-oil-tissue-oil', 'body', ARRAY['Hyperpigmentation', 'Dry & Dehydrated']::text[], '{}',
  '{}', NULL, 'Massage gently into affected areas. Can be added as nourishment to your moisturiser, and should be used as often as necessary.', ARRAY['Manketti Oil', 'Marula Oil', 'Yangu Oil', 'Jojoba Oil', 'Rosehip Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-hydrating-mist', 'Esse Hydrating Mist', 'A toning mist built on rooibos leaf extract, designed to revitalise skin tone and texture without the drying alcohol base of many conventional toners. Rooibos brings antioxidant protection against free-radical damage and visible ageing, and the mist can double as a midday refresh sprayed over makeup.',
  500, 519.99,
  'https://www.faithful-to-nature.co.za/esse-toner', 'face', ARRAY['Dry & Dehydrated', 'Fine Lines & Ageing']::text[], '{}',
  '{}', NULL, 'Apply 3-4 pump sprays to face and neck, twice daily. Blot any excess with a tissue, cotton wool or face cloth. Follow with an organic moisturiser for best results. Can also be sprayed over makeup to rehydrate skin.', ARRAY['Rooibos Leaf Extract', 'Antioxidants']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-eye-lip-cream', 'Esse Eye & Lip Cream', 'A non-toxic ointment for the eye and lip area, packed with organic active ingredients designed to moisturise gently without triggering puffiness while reducing the look of dark shadows. It''s built to work alongside the wider signs-of-ageing routine rather than as a standalone treatment.',
  655, 681.99,
  'https://www.faithful-to-nature.co.za/esse-eye-lip-cream', 'face', ARRAY['Dark Circles & Puffiness', 'Fine Lines & Ageing']::text[], '{}',
  '{}', NULL, 'Apply a small amount (1-2 pumps) to eye and lip areas in the morning and evening. Use consistently, along with an organic facial cleanser, toner and moisturiser, for best results.', ARRAY['Organic Botanical Actives', 'Anti-Ageing Complex']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-cream-mask', 'Esse Cream Mask', 'A creamy mask built on organic rooibos, aloe vera, jojoba and coconut oils, designed to feed and hydrate the most dehydrated skin. Aloe calms and soothes irritation while kigelia extract works on firmness, and the formula can double as an overnight mask for an extra hydration boost. Natural & Organic Cosmetic certified.',
  930, 967.99,
  'https://www.faithful-to-nature.co.za/esse-cream-mask', 'treatments', ARRAY['Dry & Dehydrated', 'Sensitive Skin']::text[], '{}',
  '{}', NULL, 'Apply generously to the face and neck. Leave on for 20-30 minutes, then rinse off with warm water. For best results, use twice a week or as needed. Can also be used as an overnight mask for extra hydration.', ARRAY['Rooibos', 'Aloe Vera', 'Jojoba Oil', 'Coconut Oil', 'Kigelia Extract']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-cocoa-exfoliator', 'Esse Cocoa Exfoliator', 'A cocoa-scented facial scrub designed to exfoliate gently without drying or tightening skin, using granules that dissolve as they''re massaged in. It''s suited to sensitive skin in particular, leaving skin soft and moisturised rather than stripped, and is made from natural and organic ingredients.',
  645, 670.99,
  'https://www.faithful-to-nature.co.za/esse-cocoa-exfoliator', 'treatments', ARRAY['Sensitive Skin']::text[], '{}',
  '{}', NULL, 'Apply a small amount to damp skin. Massage gently, allowing the granules to dissolve. Rinse thoroughly with water. Can be used once a week for optimal results.', ARRAY['Cocoa', 'Natural Exfoliating Granules']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-dry-skin-trial-travel-set', 'Esse Dry Skin Trial/Travel Set', 'A travel-sized routine built for dry skin: a non-foaming cream cleanser, a probiotic Biome Mist with inactive Lactobacilli and prebiotics, a probiotic-enriched Rich Moisturiser, and a vitamin-E-rich Repair Oil. It''s designed to be introduced gradually — cleanser, oil and moisturiser first, with the Biome Mist layered in from week three — so skin''s microbiome and barrier function can adjust before the full routine is in play.',
  1575, 1637.99,
  'https://www.faithful-to-nature.co.za/esse-trial-pack-dry-skin', 'face', ARRAY['Dry & Dehydrated']::text[], '{}',
  '{}', '50ml + 30ml + 20ml + 12ml', 'Weeks 1 & 2: start with the Cream Cleanser, Repair Oil and Rich Moisturiser — use the Cream Cleanser in the evenings to remove make-up and sunscreen, and rinse with lukewarm water in the mornings. Week 3: introduce the Biome Mist three times per week, building up from there.', ARRAY['Probiotics', 'Prebiotics', 'Vitamin E']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-omega-deep-moisturisers-normal-combination-skin', 'Esse Omega Deep Moisturisers (Normal/Combination Skin)', 'An omega-rich moisturiser and makeup base built on marula oil, omega 3, 6 and 9 fatty acids, chamomile extract and hyaluronic acid. It''s designed to feed and calm skin cells, with chamomile''s hypoallergenic, soothing properties suited to irritation-prone skin and hyaluronic acid helping other actives absorb more effectively. ECOCERT natural and organic cosmetic certified.',
  1370, 1424.99,
  'https://www.faithful-to-nature.co.za/esse-omega-deep-moisturisers-normal-combination-skin', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin']::text[], '{}',
  '{}', NULL, 'Massage gently into face and neck. Suitable as a makeup base.', ARRAY['Marula Oil', 'Omega 3, 6, 9', 'Chamomile Extract', 'Hyaluronic Acid']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-cream-cleanser-normal-combination-skin', 'Esse Cream Cleanser (Normal/Combination Skin)', 'A light cream cleanser built on jojoba and baobab oil, designed to refine and restore mature or combination skin without stripping it, and gentle enough to remove eye makeup too. It''s suited to dry, sensitive and ageing skin, as well as normal and combination types.',
  545, 566.99,
  'https://www.faithful-to-nature.co.za/esse-cream-cleanser-normal-combination-skin', 'face', ARRAY['Dry & Dehydrated', 'Sensitive Skin']::text[], '{}',
  '{}', NULL, 'Gently press into skin of face, neck and décolleté morning and evening after cleansing and toning.', ARRAY['Jojoba Oil', 'Baobab Oil']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;
insert into public.marketplace_products (
  brand_id, slug, name, description, original_price_zar, marked_up_price_zar,
  source_url, category, concern, values, skin_tone_claims, size, how_to_use, key_actives, in_stock
) values (
  (select id from public.marketplace_brands where slug = 'esse'),
  'esse-hand-cream', 'Esse Hand Cream', 'A lightweight hand lotion built on marula, rooibos and jojoba, made with 90% organically farmed ingredients and designed to nourish hardworking hands without a greasy residue. Rooibos protects and rejuvenates, jojoba softens and moisturises, marula hydrates and repairs, and kigelia works on the visible signs of ageing.',
  430, 447.99,
  'https://www.faithful-to-nature.co.za/esse-hand-cream', 'body', ARRAY['Dry & Dehydrated', 'Fine Lines & Ageing']::text[], '{}',
  '{}', NULL, 'Apply directly to hands as frequently as needed.', ARRAY['Marula Seed Oil', 'Rooibos Leaf Extract', 'Jojoba Seed Oil', 'Kigelia Fruit Extract']::text[], true
)
on conflict (slug) do update set
  description = excluded.description,
  original_price_zar = excluded.original_price_zar,
  marked_up_price_zar = excluded.marked_up_price_zar,
  category = excluded.category,
  concern = excluded.concern,
  values = excluded.values,
  skin_tone_claims = excluded.skin_tone_claims,
  size = excluded.size,
  how_to_use = excluded.how_to_use,
  key_actives = excluded.key_actives;

-- Product images (delete-then-insert per product for idempotency)
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-nourishing-3-step-routine-revitalise-plump-restore');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-nourishing-3-step-routine-revitalise-plump-restore'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_nourishing_3_step_routine_revitalise_plump_restore_normal_to_dry_skin_sku162081_1.jpg', 'Lelive. Nourishing 3 Step Routine - Revitalise, Plump + Restore Normal to Dry Skin', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-nourishing-3-step-routine-revitalise-plump-restore'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_nourishing_3_step_routine_revitalise_plump_restore_normal_to_dry_skin_sku162081_10.jpg', 'Lelive. Nourishing 3 Step Routine - Revitalise, Plump + Restore Normal to Dry Skin', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-nourishing-3-step-routine-revitalise-plump-restore'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_nourishing_3_step_routine_revitalise_plump_restore_normal_to_dry_skin_sku162081_4.jpg', 'Lelive. Nourishing 3 Step Routine - Revitalise, Plump + Restore Normal to Dry Skin', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-own-the-glow-mini-icons');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-own-the-glow-mini-icons'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/l/.lelive_own_the_glow_mini_icons_sku165620_closed_box.jpg', 'Lelive Own The Glow: Mini Icons', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-own-the-glow-mini-icons'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_own_the_glow_mini_icons_sku165620_products___box.jpg', 'Lelive Own The Glow: Mini Icons', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-own-the-glow-mini-icons'), 'https://www.faithful-to-nature.co.za/media/catalog/product/l/e/lelive_own_the_glow_mini_icons_sku165620_products.jpg', 'Lelive Own The Glow: Mini Icons', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-the-glow-kit-mini-edition');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-glow-kit-mini-edition'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_glow_kit_the_mini_edition_5-piece_set_sku162079_1.jpg', 'Lelive. The Glow Kit: Mini Edition', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-glow-kit-mini-edition'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_glow_kit_the_mini_edition_5-piece_set_sku162079_5.jpg', 'Lelive. The Glow Kit: Mini Edition', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-glow-kit-mini-edition'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_glow_kit_the_mini_edition_5-piece_set_sku162079_2.jpg', 'Lelive. The Glow Kit: Mini Edition', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-clean-slate-cleanse-renew-body-wash');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-clean-slate-cleanse-renew-body-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_clean_slate_cleanse_renew_body_sku159391_4.jpg', 'Lelive. Clean Slate | Cleanse + Renew Body Wash', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-clean-slate-cleanse-renew-body-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_clean_slate_cleanse_renew_body_sku159391_3.jpg', 'Lelive. Clean Slate | Cleanse + Renew Body Wash', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-clean-slate-cleanse-renew-body-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_clean_slate_cleanse_renew_body_sku159391_1_.jpg', 'Lelive. Clean Slate | Cleanse + Renew Body Wash', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-african-butter-hydrate-firm-body-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-african-butter-hydrate-firm-body-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_butter_hydrate_firm_body_cream_sku159390.jpg', 'Lelive. African Butter | Hydrate + Firm Body Cream', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-african-butter-hydrate-firm-body-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_butter_hydrate_firm_body_cream_sku159390_5.jpg', 'Lelive. African Butter | Hydrate + Firm Body Cream', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-african-butter-hydrate-firm-body-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_butter_hydrate_firm_body_cream_sku159390_3.jpg', 'Lelive. African Butter | Hydrate + Firm Body Cream', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-seatox-marine-algae-aloe-detoxifying-mask');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-seatox-marine-algae-aloe-detoxifying-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_seatox_marine_algae_aloe_detox_sku137583.jpg', 'Lelive. Seatox Marine Algae & Aloe Detoxifying Mask', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-seatox-marine-algae-aloe-detoxifying-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_seatox_marine_algae_aloe_detox_sku137583_2.jpg', 'Lelive. Seatox Marine Algae & Aloe Detoxifying Mask', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-seatox-marine-algae-aloe-detoxifying-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_seatox_marine_algae_aloe_detox_sku137583_1.jpg', 'Lelive. Seatox Marine Algae & Aloe Detoxifying Mask', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-creme-de-la-cream-african-mahogany-everyday-moisturiser');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-creme-de-la-cream-african-mahogany-everyday-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cre_me_de_la_cream_african_mahogany_sku160644_1.jpg', 'Lelive. Crème De La Cream African Mahogany Everyday Moisturiser', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-creme-de-la-cream-african-mahogany-everyday-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cre_me_de_la_cream_african_mahogany_sku160644_ls.jpg', 'Lelive. Crème De La Cream African Mahogany Everyday Moisturiser', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-creme-de-la-cream-african-mahogany-everyday-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cre_me_de_la_cream_african_mahogany_sku160644_3.jpg', 'Lelive. Crème De La Cream African Mahogany Everyday Moisturiser', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-all-glowd-up-vitamin-c-turmeric-hyaluronic-acid-brightening-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-all-glowd-up-vitamin-c-turmeric-hyaluronic-acid-brightening-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_glowd_up_vitamin_c_turmeric_hyaluronic_acid_brightening_serum_sku137436.jpg', 'Lelive. All Glow''d Up Vitamin C, Turmeric & Hyaluronic Acid Brightening Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-all-glowd-up-vitamin-c-turmeric-hyaluronic-acid-brightening-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_glowd_up_vitamin_c_turmeric_hyaluronic_acid_brightening_serum_sku137436_6.jpg', 'Lelive. All Glow''d Up Vitamin C, Turmeric & Hyaluronic Acid Brightening Serum', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-all-glowd-up-vitamin-c-turmeric-hyaluronic-acid-brightening-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_glowd_up_vitamin_c_turmeric_hyaluronic_acid_brightening_serum_sku137436_2.jpg', 'Lelive. All Glow''d Up Vitamin C, Turmeric & Hyaluronic Acid Brightening Serum', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-rooibos-aloe-jelly-splash-cleanser');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-rooibos-aloe-jelly-splash-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_rooibos_aloe_jelly_splash_clean_sku137434_1_1.jpg', 'Lelive. Rooibos & Aloe Jelly Splash Cleanser', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-rooibos-aloe-jelly-splash-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_rooibos_aloe_jelly_splash_clean_sku137434_2_1.jpg', 'Lelive. Rooibos & Aloe Jelly Splash Cleanser', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-rooibos-aloe-jelly-splash-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_rooibos_aloe_jelly_splash_clean_sku137434_3_1.jpg', 'Lelive. Rooibos & Aloe Jelly Splash Cleanser', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-body-glow-up-mini-edition');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-body-glow-up-mini-edition'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_body_glow_up-_mini_edition_4-piece_set_sku162693_3.png', 'Lelive. Body Glow Up: Mini Edition', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-body-glow-up-mini-edition'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_body_glow_up-_mini_edition_4-piece_set_sku162693_2.png', 'Lelive. Body Glow Up: Mini Edition', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-am-pm-serum-kit-multi-benefit-duo-all-skin-types');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-am-pm-serum-kit-multi-benefit-duo-all-skin-types'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_am_pm_serum_kit_multi_benefit_duo_all_skin_types_sku162082_7.jpg', 'Lelive. Am + Pm Serum Kit - Multi-Benefit Duo All Skin Types', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-am-pm-serum-kit-multi-benefit-duo-all-skin-types'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_am_pm_serum_kit_multi_benefit_duo_all_skin_types_sku162082_2.jpg', 'Lelive. Am + Pm Serum Kit - Multi-Benefit Duo All Skin Types', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-am-pm-serum-kit-multi-benefit-duo-all-skin-types'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_am_pm_serum_kit_multi_benefit_duo_all_skin_types_sku162082_6.jpg', 'Lelive. Am + Pm Serum Kit - Multi-Benefit Duo All Skin Types', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-cleaner-colada-coconut-pineapple-african-oil-cleanser');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-cleaner-colada-coconut-pineapple-african-oil-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cleaner_colada_coconut_pineapple_sku137433_.jpg', 'Lelive. Cleaner Colada Coconut & Pineapple African Oil Cleanser', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-cleaner-colada-coconut-pineapple-african-oil-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cleaner_colada_coconut_pineapple_sku137433_1.jpg', 'Lelive. Cleaner Colada Coconut & Pineapple African Oil Cleanser', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-cleaner-colada-coconut-pineapple-african-oil-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cleaner_colada_coconut_pineapple_sku137433_2.jpg', 'Lelive. Cleaner Colada Coconut & Pineapple African Oil Cleanser', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-bestselling-3-step-routine-brighten-clarify-glow');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-bestselling-3-step-routine-brighten-clarify-glow'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_bestselling_3_step_routine_brighten_clarify_glow_all_skin_types_sku162080.png', 'Lelive. Bestselling 3 Step Routine - Brighten, Clarify + Glow All Skin Types', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-bestselling-3-step-routine-brighten-clarify-glow'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_bestselling_3_step_routine_brighten_clarify_glow_all_skin_types_sku162080_8.png', 'Lelive. Bestselling 3 Step Routine - Brighten, Clarify + Glow All Skin Types', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-bestselling-3-step-routine-brighten-clarify-glow'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_bestselling_3_step_routine_brighten_clarify_glow_all_skin_types_sku162080_7.jpg', 'Lelive. Bestselling 3 Step Routine - Brighten, Clarify + Glow All Skin Types', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-good-to-glow-smooth-renew-body-exfoliator');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-good-to-glow-smooth-renew-body-exfoliator'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_good_to_glow_smooth_renew_body_exfoliator_sku159393_1.jpg', 'Lelive. Good to Glow | Smooth + Renew Body Exfoliator', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-good-to-glow-smooth-renew-body-exfoliator'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_good_to_glow_smooth_renew_body_exfoliator_sku159393_5.png', 'Lelive. Good to Glow | Smooth + Renew Body Exfoliator', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-good-to-glow-smooth-renew-body-exfoliator'), 'https://www.faithful-to-nature.co.za/media/catalog/product/l/e/lelive_good_to_glow_smooth_renew_body_exfoliator_sku159393_1.jpg', 'Lelive. Good to Glow | Smooth + Renew Body Exfoliator', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-oil-la-la-brighten-glow-body-oil');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-oil-la-la-brighten-glow-body-oil'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_oil_la_la_brighten_glow_body_oil_sku159392_.jpg', 'Lelive. Oil La La | Brighten + Glow Body Oil', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-oil-la-la-brighten-glow-body-oil'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_oil_la_la_brighten_glow_body_oil_sku159392_4.jpg', 'Lelive. Oil La La | Brighten + Glow Body Oil', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-oil-la-la-brighten-glow-body-oil'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_oil_la_la_brighten_glow_body_oil_sku159392_5.jpg', 'Lelive. Oil La La | Brighten + Glow Body Oil', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-african-gold-peptide-bakuchiol-african-oil-elixir');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-african-gold-peptide-bakuchiol-african-oil-elixir'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_gold_peptide_bakuchiol_african_oil_elixir_sku152849_2_1.jpg', 'Lelive. African Gold Peptide, Bakuchiol + African Oil Elixir', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-african-gold-peptide-bakuchiol-african-oil-elixir'), 'https://www.faithful-to-nature.co.za/media/catalog/product/l/e/lelive_african_gold_peptide_bakuchiol_african_oil_elixir_sku152849_2.jpg', 'Lelive. African Gold Peptide, Bakuchiol + African Oil Elixir', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-african-gold-peptide-bakuchiol-african-oil-elixir'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_gold_peptide_bakuchiol_african_oil_elixir_sku152849_1.jpg', 'Lelive. African Gold Peptide, Bakuchiol + African Oil Elixir', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-eye-conic-peptide-coffee-arabica-eye-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-eye-conic-peptide-coffee-arabica-eye-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_eye-conic_peptide_coffee_arabica_eye_sku152848.jpg', 'Lelive. Eye-Conic Peptide + Coffee Arabica Eye Cream', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-eye-conic-peptide-coffee-arabica-eye-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_eye-conic_peptide_coffee_arabica_eye_sku152848_1.jpg', 'Lelive. Eye-Conic Peptide + Coffee Arabica Eye Cream', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-eye-conic-peptide-coffee-arabica-eye-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_eye-conic_peptide_coffee_arabica_eye_sku152848_3.jpg', 'Lelive. Eye-Conic Peptide + Coffee Arabica Eye Cream', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-the-drip-hydrating-mist-deep-sea-biotics-african-malachite');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-drip-hydrating-mist-deep-sea-biotics-african-malachite'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_drip_hydrating_mist_-_deep_sea_sku137584_.jpg', 'Lelive. The Drip Hydrating Mist - Deep Sea Biotics + African Malachite', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-drip-hydrating-mist-deep-sea-biotics-african-malachite'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_drip_hydrating_mist_-_deep_sea_sku137584_1.jpg', 'Lelive. The Drip Hydrating Mist - Deep Sea Biotics + African Malachite', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-drip-hydrating-mist-deep-sea-biotics-african-malachite'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_drip_hydrating_mist_-_deep_sea_sku137584_ls.jpg', 'Lelive. The Drip Hydrating Mist - Deep Sea Biotics + African Malachite', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-the-du-pont-shea-butter-lush-moisturiser');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-du-pont-shea-butter-lush-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/_/l/_lelive_the_du-pont_shea_butter_lush_moisturiser_sku137438.jpg', 'Lelive. The Du-Pont Shea Butter Lush Moisturiser', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-du-pont-shea-butter-lush-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/l/_lelive_the_du-pont_shea_butter_lush_moisturiser_sku137438_1.jpg', 'Lelive. The Du-Pont Shea Butter Lush Moisturiser', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-the-du-pont-shea-butter-lush-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/l/_lelive_the_du-pont_shea_butter_lush_moisturiser_sku137438_2.jpg', 'Lelive. The Du-Pont Shea Butter Lush Moisturiser', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-all-the-shade-marula-tinted-spf-30-moisturiser');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-all-the-shade-marula-tinted-spf-30-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_the_shade_marula_tinted_spf_sku137437_.jpg', 'Lelive. All the Shade Marula Tinted Spf 30 Moisturiser', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-all-the-shade-marula-tinted-spf-30-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_the_shade_marula_tinted_spf_sku137437_5.jpg', 'Lelive. All the Shade Marula Tinted Spf 30 Moisturiser', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-all-the-shade-marula-tinted-spf-30-moisturiser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_the_shade_marula_tinted_spf_sku137437_4.jpg', 'Lelive. All the Shade Marula Tinted Spf 30 Moisturiser', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'lelive-save-our-skin-peach-aloe-aha-bha-exfoliator');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-save-our-skin-peach-aloe-aha-bha-exfoliator'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_save_our_skin_peach_aloe_aha_bh_sku137435_2.jpg', 'Lelive. Save Our Skin Peach & Aloe aha/bha Exfoliator', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-save-our-skin-peach-aloe-aha-bha-exfoliator'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_save_our_skin_peach_aloe_aha_bh_sku137435_1_.jpg', 'Lelive. Save Our Skin Peach & Aloe aha/bha Exfoliator', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'lelive-save-our-skin-peach-aloe-aha-bha-exfoliator'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_save_our_skin_peach_aloe_aha_bh_sku137435_3.jpg', 'Lelive. Save Our Skin Peach & Aloe aha/bha Exfoliator', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-salicylic-acid-face-wash');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-salicylic-acid-face-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_salicylic_acid_face_wash_125_ml_sku159696_1.png', 'Standard Beauty Salicylic Acid Face Wash', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-salicylic-acid-face-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_salicylic_acid_face_wash_125_ml_sku159696.png', 'Standard Beauty Salicylic Acid Face Wash', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-salicylic-acid-face-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_salicylic_acid_face_wash_125_ml_sku159696.png', 'Standard Beauty Salicylic Acid Face Wash', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-2-alpha-arbutin-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-2-alpha-arbutin-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_2_alpha_arbutin_serum_30_ml_sku159675.png', 'Standard Beauty 2% Alpha Arbutin Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-2-alpha-arbutin-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_2_alpha_arbutin_serum_30_ml_sku159675_1.png', 'Standard Beauty 2% Alpha Arbutin Serum', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-2-alpha-arbutin-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_2_alpha_arbutin_serum_30_ml_sku159675.png', 'Standard Beauty 2% Alpha Arbutin Serum', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-african-black-soap');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-african-black-soap'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_african_black_soap_sku159674_2.png', 'Standard Beauty African Black Soap', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-african-black-soap'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_african_black_soap_sku159674_1.png', 'Standard Beauty African Black Soap', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-african-black-soap'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_african_black_soap_sku159674.png', 'Standard Beauty African Black Soap', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-renew-your-dew-ceramide-butter');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-renew-your-dew-ceramide-butter'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_ceramide_butter_renew_your_dew_50_ml_sku159673_1.png', 'Standard Beauty Renew Your Dew Ceramide Butter', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-renew-your-dew-ceramide-butter'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_ceramide_butter_renew_your_dew_50_ml_sku159673.png', 'Standard Beauty Renew Your Dew Ceramide Butter', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-renew-your-dew-ceramide-butter'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_ceramide_butter_renew_your_dew_50_ml_sku159673.png', 'Standard Beauty Renew Your Dew Ceramide Butter', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-moisture-bomb');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-moisture-bomb'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_moisture_bomb_50_ml_sku159663.png', 'Standard Beauty Moisture Bomb', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-moisture-bomb'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_moisture_bomb_50_ml_sku159663_2.png', 'Standard Beauty Moisture Bomb', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-moisture-bomb'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_moisture_bomb_50_ml_sku159663.png', 'Standard Beauty Moisture Bomb', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-mattifying-gel-moisturiser-azelaic-acid');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-mattifying-gel-moisturiser-azelaic-acid'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_mattifying_gel_moisturiser_with_azelaic_acid_50_ml_sku159662.png', 'Standard Beauty Mattifying Gel Moisturiser with Azelaic Acid', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-mattifying-gel-moisturiser-azelaic-acid'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_mattifying_gel_moisturiser_with_azelaic_acid_50_ml_sku159662_1.png', 'Standard Beauty Mattifying Gel Moisturiser with Azelaic Acid', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-mattifying-gel-moisturiser-azelaic-acid'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_mattifying_gel_moisturiser_with_azelaic_acid_50_ml_sku159662.png', 'Standard Beauty Mattifying Gel Moisturiser with Azelaic Acid', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-2-salicylic-acid-toner');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-2-salicylic-acid-toner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_2_salicylic_acid_toner_125_ml_sku159659.png', 'Standard Beauty 2% Salicylic Acid Toner', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-2-salicylic-acid-toner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_2_salicylic_acid_toner_125_ml_sku159659_1.png', 'Standard Beauty 2% Salicylic Acid Toner', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-2-salicylic-acid-toner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_2_salicylic_acid_toner_125_ml_sku159659.png', 'Standard Beauty 2% Salicylic Acid Toner', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-5-lactic-acid-toner');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-5-lactic-acid-toner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_5_lactic_acid_toner_125_ml_sku159658_box.png', 'Standard Beauty 5% Lactic Acid Toner', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-5-lactic-acid-toner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_5_lactic_acid_toner_125_ml_sku159658_ls.png', 'Standard Beauty 5% Lactic Acid Toner', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-5-lactic-acid-toner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_5_lactic_acid_toner_125_ml_sku159658_2.png', 'Standard Beauty 5% Lactic Acid Toner', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-vitamin-c-serum-polyglutamic-acid');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-vitamin-c-serum-polyglutamic-acid'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_vitamin_c_serum_in_polyglutamic_acid_30_ml_sku159657.png', 'Standard Beauty Vitamin C Serum in Polyglutamic Acid', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-vitamin-c-serum-polyglutamic-acid'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_vitamin_c_serum_in_polyglutamic_acid_30_ml_sku159657_open.png', 'Standard Beauty Vitamin C Serum in Polyglutamic Acid', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-vitamin-c-serum-polyglutamic-acid'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_vitamin_c_serum_in_polyglutamic_acid_30_ml_sku159657.png', 'Standard Beauty Vitamin C Serum in Polyglutamic Acid', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-oat-so-clean-cleansing-balm');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-oat-so-clean-cleansing-balm'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_oat-so-clean_cleansing_balm_100_ml_sku159697.jpg', 'Standard Beauty Oat-So-Clean Cleansing Balm', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-oat-so-clean-cleansing-balm'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_oat-so-clean_cleansing_balm_100_ml_sku159697_2.png', 'Standard Beauty Oat-So-Clean Cleansing Balm', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-oat-so-clean-cleansing-balm'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_oat-so-clean_cleansing_balm_100_ml_sku159697_ls.png', 'Standard Beauty Oat-So-Clean Cleansing Balm', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-rosehip-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-rosehip-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_rosehip_serum_30_ml_sku159624_1.png', 'Standard Beauty Rosehip Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-rosehip-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_rosehip_serum_30_ml_sku159624.png', 'Standard Beauty Rosehip Serum', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-rosehip-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_rosehip_serum_30_ml_sku159624.png', 'Standard Beauty Rosehip Serum', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-sos-scalp-spray-anti-itch-active');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-sos-scalp-spray-anti-itch-active'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_sos_scalp_spray_with_anti_itch_active_100_ml_sku159670.png', 'Standard Beauty SOS Scalp Spray with Anti Itch Active', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-sos-scalp-spray-anti-itch-active'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_sos_scalp_spray_with_anti_itch_active_100_ml_sku159670_3.png', 'Standard Beauty SOS Scalp Spray with Anti Itch Active', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-sos-scalp-spray-anti-itch-active'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_sos_scalp_spray_with_anti_itch_active_100_ml_sku159670_1.png', 'Standard Beauty SOS Scalp Spray with Anti Itch Active', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-hot-oil-hair-therapy');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-hot-oil-hair-therapy'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_hot_oil_hair_therapy_100_ml_sku159669.png', 'Standard Beauty Hot Oil Hair Therapy', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-hot-oil-hair-therapy'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_hot_oil_hair_therapy_100_ml_sku159669_2.png', 'Standard Beauty Hot Oil Hair Therapy', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-hot-oil-hair-therapy'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_hot_oil_hair_therapy_100_ml_sku159669_1.png', 'Standard Beauty Hot Oil Hair Therapy', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-silicone-applicator-brush');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-silicone-applicator-brush'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_silicone_applicator_brush_sku159666.png', 'Standard Beauty Silicone Applicator Brush', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-silicone-applicator-brush'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_silicone_applicator_brush_sku159666.png', 'Standard Beauty Silicone Applicator Brush', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-pigmentation-buster-mask');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-pigmentation-buster-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_pigmentation_buster_mask_sku159665.png', 'Standard Beauty Pigmentation Buster Mask', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-pigmentation-buster-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_pigmentation_buster_mask_sku159665_2.png', 'Standard Beauty Pigmentation Buster Mask', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-pigmentation-buster-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_pigmentation_buster_mask_sku159665_ls_.png', 'Standard Beauty Pigmentation Buster Mask', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-mild-face-wash');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-mild-face-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_mild_face_wash_125_ml_sku159661_.png', 'Standard Beauty Mild Face Wash', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-mild-face-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_mild_face_wash_125_ml_sku159661_ls.png', 'Standard Beauty Mild Face Wash', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-mild-face-wash'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_mild_face_wash_125_ml_sku159661_.png', 'Standard Beauty Mild Face Wash', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-aloe-cucumber-toner-sensitive-skin');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-aloe-cucumber-toner-sensitive-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_aloe_cucumber_toner_for_sensitive_skin_125_ml_sku159660.png', 'Standard Beauty Aloe & Cucumber Toner for Sensitive Skin', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-aloe-cucumber-toner-sensitive-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_aloe_cucumber_toner_for_sensitive_skin_125_ml_sku159660_1.png', 'Standard Beauty Aloe & Cucumber Toner for Sensitive Skin', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-aloe-cucumber-toner-sensitive-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_aloe_cucumber_toner_for_sensitive_skin_125_ml_sku159660.png', 'Standard Beauty Aloe & Cucumber Toner for Sensitive Skin', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-10-niacinamide-serum-1-zinc');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-10-niacinamide-serum-1-zinc'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_10_niacinamide_serum_zinc_sku159656.png', 'Standard Beauty 10% Niacinamide Serum & 1% Zinc', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-10-niacinamide-serum-1-zinc'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_10_niacinamide_serum_zinc_sku159656_1_.png', 'Standard Beauty 10% Niacinamide Serum & 1% Zinc', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-10-niacinamide-serum-1-zinc'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_10_niacinamide_serum_zinc_sku159656_5.png', 'Standard Beauty 10% Niacinamide Serum & 1% Zinc', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-1-5-hyaluronic-serum-peptides');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-1-5-hyaluronic-serum-peptides'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_1_5_hyaluronic_serum_peptides_30_ml_sku159655.png', 'Standard Beauty 1,5% Hyaluronic Serum & Peptides', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-1-5-hyaluronic-serum-peptides'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_1_5_hyaluronic_serum_peptides_30_ml_sku159655_2.png', 'Standard Beauty 1,5% Hyaluronic Serum & Peptides', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-1-5-hyaluronic-serum-peptides'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_1_5_hyaluronic_serum_peptides_30_ml_sku159655.png', 'Standard Beauty 1,5% Hyaluronic Serum & Peptides', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'standard-beauty-squalane-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-squalane-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_squalane_serum_30_ml_sku159625.png', 'Standard Beauty Squalane Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-squalane-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_squalane_serum_30_ml_sku159625_1.png', 'Standard Beauty Squalane Serum', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'standard-beauty-squalane-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_squalane_serum_30_ml_sku159625.png', 'Standard Beauty Squalane Serum', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-sunnybonani-spf40-daily-defence-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-sunnybonani-spf40-daily-defence-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_sunnybonani_spf40_all-in-one_daily_defence_cream_sku164146.png', 'SKOON. SUNNYBONANI® SPF40 Daily Defence Cream', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-sunnybonani-spf40-daily-defence-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_sunnybonani_spf40_all-in-one_daily_defence_cream_sku164146.png', 'SKOON. SUNNYBONANI® SPF40 Daily Defence Cream', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-essentials-double-cleanse-duo');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-essentials-double-cleanse-duo'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_essentials_double_cleanse_duo_-_gentle_cream_foaming_cleanser_sku167404.png', 'SKOON. essentials Double Cleanse Duo - Gentle Cream + Foaming Cleanser', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-essentials-double-cleanse-duo'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_essentials_double_cleanse_duo_-_gentle_cream_foaming_cleanser_sku167404.png', 'SKOON. essentials Double Cleanse Duo - Gentle Cream + Foaming Cleanser', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-essentials-double-cleanse-duo'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_essentials_double_cleanse_duo_-_gentle_cream_foaming_cleanser_sku167404_back.png', 'SKOON. essentials Double Cleanse Duo - Gentle Cream + Foaming Cleanser', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-eye-shift-duo-bright-eyed-sleep-depuff');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-eye-shift-duo-bright-eyed-sleep-depuff'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/b/o/box-front.jpg', 'SKOON. The Eye Shift Duo - Bright-Eyed Brighten & Firm Eye Cream + Sleep Depuff Eye Gel Pen 8ml FREE', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-eye-shift-duo-bright-eyed-sleep-depuff'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/u/s/usp2.jpg', 'SKOON. The Eye Shift Duo - Bright-Eyed Brighten & Firm Eye Cream + Sleep Depuff Eye Gel Pen 8ml FREE', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-eye-shift-duo-bright-eyed-sleep-depuff'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/u/s/usp1.jpg', 'SKOON. The Eye Shift Duo - Bright-Eyed Brighten & Firm Eye Cream + Sleep Depuff Eye Gel Pen 8ml FREE', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-happy-flora-microbiome-balancing-face-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-happy-flora-microbiome-balancing-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._happy_flora_microbiome_balancing_face_cream_50ml_sku137443_2.jpg', 'SKOON. HAPPY FLORA Microbiome Balancing Face Cream', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-happy-flora-microbiome-balancing-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_happy_flora_microbiome_balancing_face_cream-_refill_sku159043.jpg', 'SKOON. HAPPY FLORA Microbiome Balancing Face Cream', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-sleep-depuff-eye-gel-pen');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-sleep-depuff-eye-gel-pen'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._sleep_depuff_eye_gel_pen_sku152828_.jpg', 'SKOON. SLEEP DEPUFF Eye Gel Pen – Caffeine, Peptides & Bulbine', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-sleep-depuff-eye-gel-pen'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon._sleep_depuff_eye_gel_pen_sku152828_.jpg', 'SKOON. SLEEP DEPUFF Eye Gel Pen – Caffeine, Peptides & Bulbine', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-sleep-depuff-eye-gel-pen'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._sleep_depuff_eye_gel_pen_sku152828_box.jpg', 'SKOON. SLEEP DEPUFF Eye Gel Pen – Caffeine, Peptides & Bulbine', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-sugababe-face-concentrate-hydrating-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-sugababe-face-concentrate-hydrating-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._15ml_sugababe_moisture_matrix_face_concentrate_sku158295_back.jpg', 'SKOON. SUGABABE Face Concentrate – Hydrating Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-sugababe-face-concentrate-hydrating-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._15ml_sugababe_moisture_matrix_face_concentrate_sku158295_front_box.jpg', 'SKOON. SUGABABE Face Concentrate – Hydrating Serum', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-sugababe-face-concentrate-hydrating-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._15ml_sugababe_moisture_matrix_face_concentrate_sku158295_side.jpg', 'SKOON. SUGABABE Face Concentrate – Hydrating Serum', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-hydrosurge-duo-pack');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-hydrosurge-duo-pack'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/h/y/hydrosurge_3_.jpg', 'SKOON. HYDROSURGE Duo Pack – NanoPillow Serum + Activator Mist', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-hydrosurge-duo-pack'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_hydrosurge_duo_pack_nanopillow_serum_activator_mist_sku158724_6.jpg', 'SKOON. HYDROSURGE Duo Pack – NanoPillow Serum + Activator Mist', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-hydrosurge-duo-pack'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_hydrosurge_duo_pack_nanopillow_serum_activator_mist_sku158724_1.jpg', 'SKOON. HYDROSURGE Duo Pack – NanoPillow Serum + Activator Mist', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-dream-team-duo-pack');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-dream-team-duo-pack'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/d/r/dreamteam_15ml_15ml_sku159332_lifestyle3.png', 'SKOON Dream Team Duo Pack', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-dream-team-duo-pack'), 'https://www.faithful-to-nature.co.za/media/catalog/product/d/r/dreamteam_15ml_15ml_sku159332_front.png', 'SKOON Dream Team Duo Pack', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-ruby-marine-face-balm-stick');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-ruby-marine-face-balm-stick'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._ruby_marine_barrier_recovery_face_balm_stick_15ml_sku160744_5.jpg', 'SKOON. RUBY MARINE Face Balm Stick – Barrier Repair Balm', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-ruby-marine-face-balm-stick'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._ruby_marine_barrier_recovery_face_balm_stick_15ml_sku160744_2.png', 'SKOON. RUBY MARINE Face Balm Stick – Barrier Repair Balm', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-ruby-marine-face-balm-stick'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._ruby_marine_barrier_recovery_face_balm_stick_15ml_sku160744_4.jpg', 'SKOON. RUBY MARINE Face Balm Stick – Barrier Repair Balm', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-oh-so-bubbly-hydrating-cleanser');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-oh-so-bubbly-hydrating-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_oh_so_bubbly_-_soothing_cloud_cleanser150ml_refill_sku162233_1_1.png', 'SKOON. OH SO BUBBLY Hydrating Cleanser for Combination & Sensitive Skin', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-oh-so-bubbly-hydrating-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_oh_so_bubbly_-_soothing_cloud_cleanser_100ml_sku162232.png', 'SKOON. OH SO BUBBLY Hydrating Cleanser for Combination & Sensitive Skin', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-oh-so-bubbly-hydrating-cleanser'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_oh_so_bubbly_-_soothing_cloud_cleanser_100ml_sku162232.png', 'SKOON. OH SO BUBBLY Hydrating Cleanser for Combination & Sensitive Skin', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-fruitful-radiance-night-exfoliant');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-fruitful-radiance-night-exfoliant'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_fruitful_radiance_100ml_aha_bha_night_exfoliant_cleanse_pads_sku163274_10.jpg', 'SKOON. FRUITFUL RADIANCE – AHA/BHA Night Exfoliant + Cleanse Pads', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-fruitful-radiance-night-exfoliant'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_fruitful_radiance_100ml_aha_bha_night_exfoliant_cleanse_pads_sku163274_3.jpg', 'SKOON. FRUITFUL RADIANCE – AHA/BHA Night Exfoliant + Cleanse Pads', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-fruitful-radiance-night-exfoliant'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_fruitful_radiance_100ml_aha_bha_night_exfoliant_cleanse_pads_sku163274_5.jpg', 'SKOON. FRUITFUL RADIANCE – AHA/BHA Night Exfoliant + Cleanse Pads', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-baku-glow-face-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-baku-glow-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/sku161410.png', 'SKOON. BAKU GLOW Face Cream', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-baku-glow-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_baku-glow_gentle_1_bakuchiol_resurfacing_cream_sku161410.png', 'SKOON. BAKU GLOW Face Cream', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-baku-glow-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/s/_skoon_baku-glow_gentle_1_bakuchiol_resurfacing_cream_sku161410_2.png', 'SKOON. BAKU GLOW Face Cream', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-retinin-night-01-retinal-treatment');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-retinin-night-01-retinal-treatment'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_retinin_night_intensive_0.1_retinal_firming_treatment_sku161333_.png', 'SKOON. RETININ® Night 0.1% Retinal Treatment', 0, true);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-wow-wow-wonder-nanopillow-serum-30-day');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-wow-wow-wonder-nanopillow-serum-30-day'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wow_wow_wonder_nanopillow_serum_sku162694_1_3.png', 'SKOON. WOW-WOW WONDER NanoPillow Serum 30-day pack', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-wow-wow-wonder-nanopillow-serum-30-day'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wow_wow_wonder_nanopillow_serum_sku162694_2.png', 'SKOON. WOW-WOW WONDER NanoPillow Serum 30-day pack', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-wow-wow-wonder-nanopillow-serum-30-day'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wow_wow_wonder_nanopillow_serum_sku162694.png', 'SKOON. WOW-WOW WONDER NanoPillow Serum 30-day pack', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-everyday-essentials-set-combination-oily-skin');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-everyday-essentials-set-combination-oily-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_everyday_essential_set_t-zone_-combination_oily-t_sensitive_sku163276.png', 'SKOON. EVERYDAY ESSENTIALS SET – Combination & Oily Skin', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-everyday-essentials-set-combination-oily-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_everyday_essential_set_t-zone_-combination_oily-t_sensitive_sku163276.png', 'SKOON. EVERYDAY ESSENTIALS SET – Combination & Oily Skin', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-everyday-essentials-set-combination-oily-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_everyday_essential_set_t-zone_-combination_oily-t_sensitive_sku163276.png', 'SKOON. EVERYDAY ESSENTIALS SET – Combination & Oily Skin', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-everyday-essentials-set-combination-dry-patches');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-everyday-essentials-set-combination-dry-patches'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_everyday_essential_set_patch_perfect_-_combination_dry_patches_sensitive_sku163277_2.png', 'SKOON. EVERYDAY ESSENTIALS SET – Combination & Dry Patches', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-everyday-essentials-set-combination-dry-patches'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_everyday_essential_set_patch_perfect_-_combination_dry_patches_sensitive_sku163277_2.png', 'SKOON. EVERYDAY ESSENTIALS SET – Combination & Dry Patches', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-everyday-essentials-set-combination-dry-patches'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_everyday_essential_set_patch_perfect_-_combination_dry_patches_sensitive_sku163277_2.png', 'SKOON. EVERYDAY ESSENTIALS SET – Combination & Dry Patches', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-pixie-dust-nanopillow-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-pixie-dust-nanopillow-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pixie_dust_nanopillow_serum_sku162695.png', 'SKOON. PIXIE DUST NanoPillow Serum – Barrier Boost', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-pixie-dust-nanopillow-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pixie_dust_nanopillow_serum_sku162695.png', 'SKOON. PIXIE DUST NanoPillow Serum – Barrier Boost', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-double-cleanse-heroes-combo-dry-patches');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-double-cleanse-heroes-combo-dry-patches'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_double_cleanse_heoes_combo_dy_paches_pack_sku163882.png', 'SKOON. Double Cleanse Heroes Combo - Dry Patches', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-double-cleanse-heroes-combo-dry-patches'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_double_cleanse_heoes_combo_dy_paches_pack_sku163882_4.png', 'SKOON. Double Cleanse Heroes Combo - Dry Patches', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-double-cleanse-heroes-combo-dry-patches'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_double_cleanse_heoes_combo_dy_paches_pack_sku163882.png', 'SKOON. Double Cleanse Heroes Combo - Dry Patches', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-bright-eyed-eye-cream-vitamin-c-k1');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-bright-eyed-eye-cream-vitamin-c-k1'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_bright-eyed_brighten_firm_eye_cream_15ml_sku165092_box.jpg', 'SKOON. BRIGHT-EYED Eye Cream – Vitamin C & K1 Brightening Formula', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-bright-eyed-eye-cream-vitamin-c-k1'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_bright-eyed_brighten_firm_eye_cream_15ml_sku165092.jpg', 'SKOON. BRIGHT-EYED Eye Cream – Vitamin C & K1 Brightening Formula', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-the-one-hydra-plump-face-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-the-one-hydra-plump-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_the_one_hydra-plump_face_cream_30ml_sku166853.jpg', 'SKOON. The One Hydra-Plump Face Cream - 30ml', 0, true);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-happy-flora-microbiome-balancing-face-cream-refill');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-happy-flora-microbiome-balancing-face-cream-refill'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._happy_flora_microbiome_balancing_face_cream_30ml_refill_sku166856.png', 'SKOON. HAPPY FLORA Microbiome Balancing Face Cream - 30ml Refill', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-happy-flora-microbiome-balancing-face-cream-refill'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon._happy_flora_microbiome_balancing_face_cream_30ml_refill_sku166856.png', 'SKOON. HAPPY FLORA Microbiome Balancing Face Cream - 30ml Refill', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-happy-flora-microbiome-balancing-face-cream-refill'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._happy_flora_microbiome_balancing_face_cream_30ml_refill_sku166856.png', 'SKOON. HAPPY FLORA Microbiome Balancing Face Cream - 30ml Refill', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-wrap-me-up-ultra-thick-comforting-face-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-wrap-me-up-ultra-thick-comforting-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wrap_me_up_ultra-thick_comforting_face_cream_30ml_sku166857_7.png', 'SKOON. WRAP ME UP Ultra-Thick Comforting Face Cream - 30ml', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-wrap-me-up-ultra-thick-comforting-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wrap_me_up_ultra-thick_comforting_face_cream_30ml_sku166857_5.png', 'SKOON. WRAP ME UP Ultra-Thick Comforting Face Cream - 30ml', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-wrap-me-up-ultra-thick-comforting-face-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/sku166857_box.jpg', 'SKOON. WRAP ME UP Ultra-Thick Comforting Face Cream - 30ml', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-pretty-smooth-oil-balance-gel-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-pretty-smooth-oil-balance-gel-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pretty_smooth_oil-balance_gel-cream_30ml_sku166870.png', 'SKOON. PRETTY SMOOTH Oil-Balance Gel-Cream - 30ml', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-pretty-smooth-oil-balance-gel-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pretty_smooth_oil-balance_gel-cream_30ml_sku166870_2.png', 'SKOON. PRETTY SMOOTH Oil-Balance Gel-Cream - 30ml', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-pretty-smooth-oil-balance-gel-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pretty_smooth_oil-balance_gel-cream_30ml_sku166870_15.png', 'SKOON. PRETTY SMOOTH Oil-Balance Gel-Cream - 30ml', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-essentials-rich-moisture-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-essentials-rich-moisture-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_essentials_rich_moisture_cream_sku167400.png', 'SKOON. essentials Rich Moisture Cream', 0, true);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-skin-pjs-face-mist-buchu-cbd');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-skin-pjs-face-mist-buchu-cbd'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pjs_activator_face_mist_sku152829_2.jpg', 'SKOON. SKIN PJs Face Mist - Hydrating Toner with Buchu & CBD', 0, true);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'skoon-bff-sleepover-overnight-regeneration-face-mask');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-bff-sleepover-overnight-regeneration-face-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._bff_sleepover_overnight_regeneration_face_mask_sku152827_1.jpg', 'SKOON. BFF SLEEPOVER Overnight Regeneration Face Mask', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-bff-sleepover-overnight-regeneration-face-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon._bff_sleepover_overnight_regeneration_face_mask_sku152827_1.jpg', 'SKOON. BFF SLEEPOVER Overnight Regeneration Face Mask', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'skoon-bff-sleepover-overnight-regeneration-face-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._bff_sleepover_overnight_regeneration_face_mask_sku152827_back.jpg', 'SKOON. BFF SLEEPOVER Overnight Regeneration Face Mask', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-bakuchiol-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-bakuchiol-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_bakuchiol_serum_sku159254_1.jpg', 'Esse Bakuchiol Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-bakuchiol-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_bakuchiol_serum_sku159254_2.jpg', 'Esse Bakuchiol Serum', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-resurrect-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-resurrect-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_resurrect_serum_sku92393_.jpg', 'Esse Resurrect Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-resurrect-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_resurrect_serum_sku92393_1.jpg', 'Esse Resurrect Serum', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-resurrect-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_resurrect_serum_sku92393_.jpg', 'Esse Resurrect Serum', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-live-probiotic-mist');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-live-probiotic-mist'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/i/live_probiotic_mist_50ml_sku165285.jpg', 'Esse Live Probiotic Mist', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-live-probiotic-mist'), 'https://www.faithful-to-nature.co.za/media/catalog/product/l/i/live_probiotic_mist_50ml_sku165285.jpg', 'Esse Live Probiotic Mist', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-pro-sun-d-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-pro-sun-d-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_pro_sun_d_serum_sku160124_.jpg', 'Esse Pro Sun D Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-pro-sun-d-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_pro_sun_d_serum_15ml_sku160124_3.png', 'Esse Pro Sun D Serum', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-pro-sun-d-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_pro_sun_d_serum_15ml_sku160124_1.png', 'Esse Pro Sun D Serum', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-hyaluronic-serum');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-hyaluronic-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_hyaluronic_serum_15ml_sku69084v1_2.jpg', 'Esse Hyaluronic Serum', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-hyaluronic-serum'), 'https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_hyaluronic_serum_15ml_sku69084v1.jpg', 'Esse Hyaluronic Serum', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-sunscreen');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-sunscreen'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_sunscreen_sku69002_.jpg', 'Esse Sunscreen', 0, true);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-lip-conditioner');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-lip-conditioner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_lip_conditioner_sku2599_.jpg', 'Esse Lip Conditioner', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-lip-conditioner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_lip_conditioner_sku2599_1.jpg', 'Esse Lip Conditioner', 1, false);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-lip-conditioner'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_lip_conditioner_sku2599_.jpg', 'Esse Lip Conditioner', 2, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-light-moisturiser-oily-combination-skin');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-light-moisturiser-oily-combination-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_light_moisturiser_sku67.jpg', 'Esse Light Moisturiser (Oily & Combination Skin)', 0, true);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-repair-oil-tissue-oil');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-repair-oil-tissue-oil'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_repair_oil_tissue_oil_sku72_.jpg', 'Esse Repair Oil (Tissue Oil)', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-repair-oil-tissue-oil'), 'https://www.faithful-to-nature.co.za/media/catalog/product/_/e/_esse_repair_oil_tissue_oil_sku72_.jpg', 'Esse Repair Oil (Tissue Oil)', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-hydrating-mist');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-hydrating-mist'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_mist_sku73.jpg', 'Esse Hydrating Mist', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-hydrating-mist'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_mist_sku73.jpg', 'Esse Hydrating Mist', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-eye-lip-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-eye-lip-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_eye_lip_cream_sku80.jpg', 'Esse Eye & Lip Cream', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-eye-lip-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_eye_lip_cream_sku80.jpg', 'Esse Eye & Lip Cream', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-cream-mask');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-cream-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_cream_mask_sku495_1.jpg', 'Esse Cream Mask', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-cream-mask'), 'https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_cream_mask_sku495_.jpg', 'Esse Cream Mask', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-cocoa-exfoliator');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-cocoa-exfoliator'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_cocoa_exfoliator_sku555.jpg', 'Esse Cocoa Exfoliator', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-cocoa-exfoliator'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_cocoa_exfoliator_sku555.jpg', 'Esse Cocoa Exfoliator', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-dry-skin-trial-travel-set');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-dry-skin-trial-travel-set'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_dry_skin_trial_travel_set_sku1935v4_.jpg', 'Esse Dry Skin Trial/Travel Set', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-dry-skin-trial-travel-set'), 'https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_dry_skin_trial_travel_set_sku1935v4_.jpg', 'Esse Dry Skin Trial/Travel Set', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-omega-deep-moisturisers-normal-combination-skin');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-omega-deep-moisturisers-normal-combination-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_omega_deep_moisturisers_sku2019_1.jpg', 'Esse Omega Deep Moisturisers (Normal/Combination Skin)', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-omega-deep-moisturisers-normal-combination-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_omega_deep_moisturisers_sku2019.jpg', 'Esse Omega Deep Moisturisers (Normal/Combination Skin)', 1, false);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-cream-cleanser-normal-combination-skin');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-cream-cleanser-normal-combination-skin'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/small_image/210x/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_cream_cleanser_normalcombination_skin_100ml_sku66v1_2.jpg', 'Esse Cream Cleanser (Normal/Combination Skin)', 0, true);
delete from public.marketplace_product_images where product_id = (select id from public.marketplace_products where slug = 'esse-hand-cream');
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-hand-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_hand_cream_sku6808_.jpg', 'Esse Hand Cream', 0, true);
insert into public.marketplace_product_images (product_id, url, alt, position, is_primary)
values ((select id from public.marketplace_products where slug = 'esse-hand-cream'), 'https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_hand_cream_sku6808_.jpg', 'Esse Hand Cream', 1, false);
