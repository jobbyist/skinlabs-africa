-- Ingredient Combination Checker: a compatibility note for EVERY pair of published ingredients, now and
-- for ingredients added later, without inventing facts.
--
-- Three honest tiers, resolved by get_ingredient_pair_note(a, b):
--   1. curated        a cited row in ingredient_interactions (admin-verified; unchanged)
--   2. class_guidance a rule in ingredient_class_pair_rules for the two ingredients' categories
--                     (general guidance about the TYPES of ingredient, labelled as such)
--   3. general        nothing on record: says so, never claims the pair is safe
-- Notes are computed from the ingredients' categories, so a new ingredient is covered the moment it has a
-- category (the content pipeline sets one; admin_ingredient_pair_note_coverage() lists any that don't).
-- get_ingredient_interaction() / get_routine_conflicts() stay curated-only: the Conflict Matcher must never
-- flag a routine from class-level guidance.

CREATE TABLE IF NOT EXISTS public.ingredient_class_pair_rules (
  class_a text NOT NULL,
  class_b text NOT NULL,                       -- '*' = any other category (lowest priority)
  interaction_type public.ingredient_interaction_type NOT NULL,
  explanation text NOT NULL,
  usage_guidance text NOT NULL,
  source_label text NOT NULL DEFAULT 'SkinLabs class-level guidance',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_a, class_b),
  CONSTRAINT ingredient_class_pair_rules_order CHECK (class_b = '*' OR class_a <= class_b)
);
ALTER TABLE public.ingredient_class_pair_rules ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.ingredient_class_pair_rules TO anon, authenticated;
GRANT ALL ON public.ingredient_class_pair_rules TO service_role;
CREATE POLICY "Public read class pair rules" ON public.ingredient_class_pair_rules FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage class pair rules" ON public.ingredient_class_pair_rules FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.ingredient_class_pair_rules TO authenticated;

INSERT INTO public.ingredient_class_pair_rules (class_a, class_b, interaction_type, explanation, usage_guidance, source_label, source_url) VALUES
 ('retinoid','retinoid','avoid_combining',
  'Two retinoids add up the usual retinoid effects (dryness, redness, peeling) without a clear extra benefit.',
  'Choose one retinoid at a time. If you are switching, stop the first before starting the second.',
  'SkinLabs class-level guidance, consistent with DermNet NZ on topical retinoids','https://dermnetnz.org/topics/topical-retinoids'),
 ('retinoid','retinoid-alternative','avoid_combining',
  'Retinoid alternatives are used instead of a retinoid, not on top of one; together they mostly add irritation risk.',
  'Pick either the retinoid or the alternative for a given routine.',
  'SkinLabs class-level guidance','https://dermnetnz.org/topics/topical-retinoids'),
 ('exfoliant-aha','retinoid','requires_spacing',
  'Acid exfoliants and retinoids both increase skin turnover, so using them together can be too much for the skin barrier.',
  'Use them on different nights, or acid in the morning and retinoid at night, building up slowly. Daily sunscreen matters.',
  'SkinLabs class-level guidance, consistent with DermNet NZ on topical retinoids','https://dermnetnz.org/topics/topical-retinoids'),
 ('exfoliant-bha','retinoid','requires_spacing',
  'Salicylic-type exfoliants and retinoids can each cause dryness and irritation, and they add up.',
  'Alternate nights, or keep the exfoliant to a few days a week. Stop and simplify if skin stings or peels.',
  'SkinLabs class-level guidance, consistent with DermNet NZ on topical retinoids','https://dermnetnz.org/topics/topical-retinoids'),
 ('exfoliant-enzyme','retinoid','requires_spacing',
  'Enzyme exfoliants are gentler than acids, but still remove surface cells on top of a retinoid.',
  'Use on a different night from the retinoid if your skin is sensitive or new to retinoids.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-aha','exfoliant-aha','requires_spacing',
  'Two alpha-hydroxy acids in the same routine add up to a stronger exfoliation than either alone.',
  'Use one AHA product at a time and build frequency slowly. AHAs make skin more sun-sensitive, so use sunscreen daily.',
  'SkinLabs class-level guidance, consistent with FDA guidance on alpha hydroxy acids','https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids'),
 ('exfoliant-aha','exfoliant-bha','requires_spacing',
  'Combining acid exfoliants in one routine can over-exfoliate and weaken the skin barrier.',
  'Alternate nights, or use one in the morning and one at night, and start with a few days a week.',
  'SkinLabs class-level guidance, consistent with FDA guidance on alpha hydroxy acids','https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids'),
 ('exfoliant-aha','exfoliant-enzyme','requires_spacing',
  'Stacking an acid and an enzyme exfoliant doubles up on surface exfoliation.',
  'Use one per session; alternate on different nights.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-bha','exfoliant-bha','requires_spacing',
  'Two BHA products add up to more exfoliation and drying than intended.',
  'Use one BHA product at a time and keep to a few days a week to start.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-bha','exfoliant-enzyme','requires_spacing',
  'An enzyme exfoliant and a BHA together double up on surface exfoliation.',
  'Use one per session; alternate on different nights.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-enzyme','exfoliant-enzyme','requires_spacing',
  'Two enzyme exfoliants in a routine repeat the same job.',
  'One enzyme product at a time is enough.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-aha','peptide','requires_spacing',
  'Some peptides, copper peptides in particular, work best at a skin-friendly pH, and a low-pH acid step can interfere.',
  'Use them at different times of day, or on different nights.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-bha','peptide','requires_spacing',
  'Some peptides, copper peptides in particular, work best at a skin-friendly pH, and a low-pH acid step can interfere.',
  'Use them at different times of day, or on different nights.',
  'SkinLabs class-level guidance',NULL),
 ('antioxidant','retinoid','compatible',
  'Antioxidants and retinoids are commonly used in the same routine, usually split between morning and night.',
  'Antioxidants in the morning, retinoid at night. Some strongly acidic vitamin C forms are best kept apart from a retinoid; see any cited note for the specific pair.',
  'SkinLabs class-level guidance','https://dermnetnz.org/topics/topical-retinoids'),
 ('brightening','retinoid','compatible',
  'Brightening ingredients are routinely paired with a retinoid. Together they can be more irritating for some skin.',
  'Introduce one at a time and patch-test. Daily sunscreen is essential with both.',
  'SkinLabs class-level guidance',NULL),
 ('humectant','retinoid','buffers',
  'Hydrating ingredients can help offset the dryness retinoids commonly cause.',
  'Apply a hydrating step with or after your retinoid.',
  'SkinLabs class-level guidance','https://dermnetnz.org/topics/topical-retinoids'),
 ('barrier-lipid','retinoid','buffers',
  'Barrier-supporting oils and lipids can help soften retinoid dryness.',
  'Layer after the retinoid or blend a little in; keep it light if you are acne-prone.',
  'SkinLabs class-level guidance','https://dermnetnz.org/topics/topical-retinoids'),
 ('retinoid','soothing-botanical','buffers',
  'Soothing botanicals may make a retinoid routine feel more comfortable.',
  'Use the soothing product after the retinoid, especially in the first weeks.',
  'SkinLabs class-level guidance',NULL),
 ('peptide','retinoid','compatible',
  'Peptides and retinoids are commonly used together in anti-ageing routines.',
  'Either order works; keep to one new product at a time.',
  'SkinLabs class-level guidance',NULL),
 ('retinoid','uv-filter','compatible',
  'Retinoids can make skin more sun-sensitive, so a sunscreen is the natural partner.',
  'Retinoid at night, broad-spectrum sunscreen every morning.',
  'SkinLabs class-level guidance','https://dermnetnz.org/topics/topical-retinoids'),
 ('retinoid','sebum-regulator','compatible',
  'Oil-balancing ingredients and retinoids are commonly used together for oily or acne-prone skin.',
  'Introduce one at a time, and watch for dryness.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-aha','uv-filter','compatible',
  'AHAs make skin more sun-sensitive, so a sunscreen is the natural partner.',
  'Acid at night where possible; broad-spectrum sunscreen every morning.',
  'SkinLabs class-level guidance, consistent with FDA guidance on alpha hydroxy acids','https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids'),
 ('exfoliant-bha','uv-filter','compatible',
  'Exfoliating acids can leave skin more sun-sensitive, so a sunscreen is the natural partner.',
  'Broad-spectrum sunscreen every morning.',
  'SkinLabs class-level guidance',NULL),
 ('antioxidant','exfoliant-aha','compatible',
  'Antioxidants and AHAs are often used in the same routine; both can tingle on sensitive skin.',
  'If skin stings, move one to the other time of day.',
  'SkinLabs class-level guidance',NULL),
 ('antioxidant','exfoliant-bha','compatible',
  'Antioxidants and BHAs are often used in the same routine; both can tingle on sensitive skin.',
  'If skin stings, move one to the other time of day.',
  'SkinLabs class-level guidance',NULL),
 ('brightening','exfoliant-aha','compatible',
  'Brightening ingredients and AHAs are a common pairing for uneven tone; together they can be more irritating.',
  'Start with a few nights a week, one new product at a time, and use sunscreen daily.',
  'SkinLabs class-level guidance, consistent with FDA guidance on alpha hydroxy acids','https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids'),
 ('brightening','sebum-regulator','enhances',
  'Brightening and oil-balancing ingredients are commonly formulated together.',
  'Either order works.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-aha','humectant','compatible',
  'Hydrating ingredients are a good partner for exfoliating acids.',
  'Follow the acid with a hydrating step.',
  'SkinLabs class-level guidance',NULL),
 ('exfoliant-bha','humectant','compatible',
  'Hydrating ingredients are a good partner for exfoliating acids.',
  'Follow the acid with a hydrating step.',
  'SkinLabs class-level guidance',NULL),
 ('antioxidant','uv-filter','enhances',
  'Antioxidants are commonly layered under sunscreen in the morning.',
  'Antioxidant first, sunscreen last.',
  'SkinLabs class-level guidance',NULL),
 ('cleansing-base','exfoliant-aha','requires_spacing',
  'A cleanser is rinsed off, but an exfoliating cleanser followed by an acid can over-exfoliate.',
  'If either one exfoliates, use the other on a different day.',
  'SkinLabs class-level guidance',NULL),
 ('cleansing-base','exfoliant-bha','requires_spacing',
  'A cleanser is rinsed off, but an exfoliating cleanser followed by an acid can over-exfoliate.',
  'If either one exfoliates, use the other on a different day.',
  'SkinLabs class-level guidance',NULL),
 ('cleansing-base','*','compatible',
  'Cleansers are rinsed off, so they spend little time on the skin alongside leave-on products.',
  'Cleanse first, then apply your leave-on products.',
  'SkinLabs class-level guidance',NULL)
ON CONFLICT (class_a, class_b) DO NOTHING;

-- Keeps a curated pair findable in either order (get_ingredient_interaction only matches a < b).
CREATE OR REPLACE FUNCTION public.normalise_ingredient_interaction_pair()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE t uuid;
BEGIN
  IF NEW.ingredient_a_id > NEW.ingredient_b_id THEN
    t := NEW.ingredient_a_id; NEW.ingredient_a_id := NEW.ingredient_b_id; NEW.ingredient_b_id := t;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_normalise_ingredient_interaction_pair
  BEFORE INSERT OR UPDATE OF ingredient_a_id, ingredient_b_id ON public.ingredient_interactions
  FOR EACH ROW EXECUTE FUNCTION public.normalise_ingredient_interaction_pair();

CREATE OR REPLACE FUNCTION public.get_ingredient_pair_note(a uuid, b uuid)
RETURNS TABLE (
  id uuid,
  interaction_type public.ingredient_interaction_type,
  explanation text,
  usage_guidance text,
  notes text,
  confidence public.confidence_level,
  source_url text,
  note_source text,
  source_label text
)
LANGUAGE plpgsql STABLE SET search_path TO 'public' AS $$
DECLARE
  ia record; ib record; r record;
  v_ca text; v_cb text;
BEGIN
  IF a IS NULL OR b IS NULL OR a = b THEN RETURN; END IF;
  SELECT i.id, i.category, i.irritancy_risk::text AS irritancy INTO ia FROM public.ingredients i WHERE i.id = a;
  SELECT i.id, i.category, i.irritancy_risk::text AS irritancy INTO ib FROM public.ingredients i WHERE i.id = b;
  IF ia.id IS NULL OR ib.id IS NULL THEN RETURN; END IF;

  -- 1. curated, cited note (most severe first if a pair has several)
  RETURN QUERY
    SELECT ii.id, ii.interaction_type, ii.explanation, ii.usage_guidance, ii.notes, ii.confidence, ii.source_url,
           'curated'::text, 'Cited SkinLabs note'::text
      FROM public.ingredient_interactions ii
     WHERE (ii.ingredient_a_id = a AND ii.ingredient_b_id = b) OR (ii.ingredient_a_id = b AND ii.ingredient_b_id = a)
     ORDER BY CASE ii.interaction_type WHEN 'avoid_combining' THEN 0 WHEN 'requires_spacing' THEN 1 ELSE 2 END
     LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  -- 2. class-level guidance
  v_ca := least(coalesce(ia.category, ''), coalesce(ib.category, ''));
  v_cb := greatest(coalesce(ia.category, ''), coalesce(ib.category, ''));
  SELECT * INTO r FROM public.ingredient_class_pair_rules c WHERE c.class_a = v_ca AND c.class_b = v_cb;
  IF NOT FOUND THEN
    SELECT * INTO r FROM public.ingredient_class_pair_rules c
     WHERE c.class_b = '*' AND c.class_a IN (coalesce(ia.category, ''), coalesce(ib.category, ''))
     ORDER BY c.class_a LIMIT 1;
  END IF;
  IF FOUND THEN
    RETURN QUERY SELECT NULL::uuid, r.interaction_type, r.explanation, r.usage_guidance, NULL::text,
                        NULL::public.confidence_level, r.source_url, 'class_guidance'::text, r.source_label;
    RETURN;
  END IF;

  -- 2b. two higher-irritancy ingredients
  IF ia.irritancy IN ('moderate', 'high') AND ib.irritancy IN ('moderate', 'high') THEN
    RETURN QUERY SELECT NULL::uuid, 'requires_spacing'::public.ingredient_interaction_type,
      'Both ingredients are recorded as having a moderate or higher irritation potential, so using them together can be more than skin tolerates.'::text,
      'Introduce them one at a time, on different days at first, and stop if skin becomes red or sore.'::text,
      NULL::text, NULL::public.confidence_level, NULL::text, 'class_guidance'::text, 'SkinLabs irritation-potential guidance'::text;
    RETURN;
  END IF;

  -- 3. nothing on record: say so, never imply the pair is safe
  RETURN QUERY SELECT NULL::uuid, NULL::public.ingredient_interaction_type,
    'SkinLabs has no tested or class-level interaction on record for these two ingredients. That is not a guarantee that they suit every skin.'::text,
    'Introduce one new active at a time, patch-test first, and stop if your skin becomes irritated.'::text,
    NULL::text, NULL::public.confidence_level, NULL::text, 'general'::text, 'No interaction on record'::text;
END $$;
GRANT EXECUTE ON FUNCTION public.get_ingredient_pair_note(uuid, uuid) TO anon, authenticated, service_role;

-- Admin: how much of the pair matrix each tier covers, and which ingredients have no category (they only get
-- the "general" note until one is set).
CREATE OR REPLACE FUNCTION public.admin_ingredient_pair_note_coverage()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not authorised' USING ERRCODE = '42501'; END IF;
  SELECT jsonb_build_object(
    'ingredients', (SELECT count(*) FROM public.ingredients),
    'pairs', (SELECT count(*) FROM public.ingredients) * ((SELECT count(*) FROM public.ingredients) - 1) / 2,
    'curated_pairs', (SELECT count(*) FROM (SELECT DISTINCT ingredient_a_id, ingredient_b_id FROM public.ingredient_interactions) s),
    'class_rules', (SELECT count(*) FROM public.ingredient_class_pair_rules),
    'uncategorised', coalesce((SELECT jsonb_agg(jsonb_build_object('slug', slug, 'name', coalesce(common_name, inci_name))) FROM public.ingredients WHERE category IS NULL), '[]'::jsonb),
    'categories_without_any_rule', coalesce((
      SELECT jsonb_agg(c.category) FROM (SELECT DISTINCT category FROM public.ingredients WHERE category IS NOT NULL) c
       WHERE NOT EXISTS (SELECT 1 FROM public.ingredient_class_pair_rules r WHERE r.class_a = c.category OR r.class_b = c.category)
    ), '[]'::jsonb)
  ) INTO v;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.admin_ingredient_pair_note_coverage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_ingredient_pair_note_coverage() TO authenticated, service_role;
