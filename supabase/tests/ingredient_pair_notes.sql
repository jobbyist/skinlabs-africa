-- Ingredient Combination Checker probe: every pair of published ingredients has exactly one note, the note
-- is the same in either order, a curated row always wins, and a new ingredient with a category is covered
-- immediately. One DO block that ALWAYS ends by raising, so it rolls back (safe on production).
--   Success -> ERROR:  INGREDIENT_PAIR_NOTES_TESTS_PASSED (n pairs checked, c curated, g class_guidance, x general)
DO $$
DECLARE
  v_total int; v_ok int; v_asym int; v_curated int; v_class int; v_general int;
  v_new uuid; v_ret uuid; v_src text; v_type text;
BEGIN
  WITH pairs AS (SELECT a.id aid, b.id bid FROM public.ingredients a JOIN public.ingredients b ON a.id < b.id),
  notes AS (
    SELECT (SELECT count(*) FROM public.get_ingredient_pair_note(p.aid, p.bid)) n,
           (SELECT note_source FROM public.get_ingredient_pair_note(p.aid, p.bid)) src,
           (SELECT note_source FROM public.get_ingredient_pair_note(p.bid, p.aid)) src_rev
      FROM pairs p)
  SELECT count(*), count(*) FILTER (WHERE n = 1), count(*) FILTER (WHERE src IS DISTINCT FROM src_rev),
         count(*) FILTER (WHERE src = 'curated'), count(*) FILTER (WHERE src = 'class_guidance'), count(*) FILTER (WHERE src = 'general')
    INTO v_total, v_ok, v_asym, v_curated, v_class, v_general FROM notes;
  IF v_total <> v_ok THEN RAISE EXCEPTION 'INGREDIENT_PAIR_NOTES_TEST_FAILED: % of % pairs lack exactly one note', v_total - v_ok, v_total; END IF;
  IF v_asym <> 0 THEN RAISE EXCEPTION 'INGREDIENT_PAIR_NOTES_TEST_FAILED: % pairs differ by argument order', v_asym; END IF;
  IF v_curated <> (SELECT count(DISTINCT (ingredient_a_id, ingredient_b_id)) FROM public.ingredient_interactions) THEN
    RAISE EXCEPTION 'INGREDIENT_PAIR_NOTES_TEST_FAILED: curated rows are not all returned as curated';
  END IF;

  -- a curated pair beats the class rule (retinol + glycolic acid is a cited requires_spacing row)
  SELECT note_source INTO v_src FROM public.get_ingredient_pair_note(
    (SELECT id FROM public.ingredients WHERE slug = 'retinol'), (SELECT id FROM public.ingredients WHERE slug = 'glycolic-acid'));
  IF v_src <> 'curated' THEN RAISE EXCEPTION 'INGREDIENT_PAIR_NOTES_TEST_FAILED: curated pair returned %', v_src; END IF;

  -- a new ingredient in a known category gets class guidance with every existing ingredient straight away
  v_ret := (SELECT id FROM public.ingredients WHERE category = 'retinoid' AND slug <> 'retinol' LIMIT 1);
  INSERT INTO public.ingredients (slug, inci_name, category) VALUES ('pair-probe-retinoid', 'Pair Probe Retinoid', 'retinoid') RETURNING id INTO v_new;
  SELECT note_source, interaction_type::text INTO v_src, v_type FROM public.get_ingredient_pair_note(v_new, v_ret);
  IF v_src <> 'class_guidance' OR v_type <> 'avoid_combining' THEN RAISE EXCEPTION 'INGREDIENT_PAIR_NOTES_TEST_FAILED: new retinoid + retinoid gave % / %', v_src, v_type; END IF;
  IF (SELECT count(*) FROM public.ingredients i, LATERAL public.get_ingredient_pair_note(v_new, i.id) n WHERE i.id <> v_new) <> (SELECT count(*) - 1 FROM public.ingredients) THEN
    RAISE EXCEPTION 'INGREDIENT_PAIR_NOTES_TEST_FAILED: new ingredient is not covered against every other ingredient';
  END IF;

  -- an uncategorised new ingredient still gets an honest note (never silence, never "safe")
  INSERT INTO public.ingredients (slug, inci_name) VALUES ('pair-probe-uncategorised', 'Pair Probe Uncategorised') RETURNING id INTO v_new;
  SELECT note_source, interaction_type::text INTO v_src, v_type FROM public.get_ingredient_pair_note(v_new, v_ret);
  IF v_src <> 'general' OR v_type IS NOT NULL THEN RAISE EXCEPTION 'INGREDIENT_PAIR_NOTES_TEST_FAILED: uncategorised gave % / %', v_src, v_type; END IF;

  RAISE EXCEPTION 'INGREDIENT_PAIR_NOTES_TESTS_PASSED (% pairs: % curated, % class_guidance, % general)', v_total, v_curated, v_class, v_general;
END $$;
