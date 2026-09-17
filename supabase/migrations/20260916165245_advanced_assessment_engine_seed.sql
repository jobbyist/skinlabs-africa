-- SKYNN AI Advanced Dermatology Assessment Engine — seed data.
--
-- Three things are seeded here, deliberately kept separate:
--   1. assessment_definitions v2026.1 — a real, structurally complete question
--      library covering the domains in section 6/9 of the engine brief. Every
--      question here is a plain data-collection question (what does your
--      routine look like, how would you describe your skin) — none of it is
--      a diagnostic threshold or clinical scoring rule, so seeding it does
--      not violate the "never fabricate dermatologist-approved methodology"
--      boundary. Sections deliberately NOT included from the brief's
--      suggested list (Occupation/exposure detail beyond a light touch,
--      per-concern dynamic sub-forms) are noted inline — see the section-9
--      comment below for why.
--   2. assessment_prompt_versions '1.0.0-placeholder' — status stays 'draft',
--      is_placeholder stays true, system_prompt stays NULL. This is the
--      secure boundary from section 43: SkinLabs has not supplied the actual
--      dermatologist-approved SKYNN system prompt, so none is invented here.
--      The Claude provider (supabase/functions/_shared/assessment/
--      promptRegistry.ts) refuses to generate against this row.
--   3. skynn_advanced_assessment_config — the single feature-flag row,
--      rollout_stage = 'disabled'. Flipping this to 'internal'/'beta'/
--      'public' (and swapping active_prompt_version to a real, non-
--      placeholder version once one exists) is the only step needed to turn
--      the engine on; no code deploy required.

INSERT INTO public.assessment_definitions (
  version, status, title, question_library_version, scoring_rules_version, evidence_version, notes, sections
) VALUES (
  '2026.1',
  'active',
  'SKYNN AI Advanced Dermatology Assessment',
  '2026.1',
  '2026.1',
  '2026.1',
  'Initial Advanced Assessment question library. Identity/context (age range, geography) is deliberately NOT re-collected here — the edge function sanitises it from profiles.date_of_birth/city/province instead, per the "don''t duplicate what you already have" principle. Per-concern dynamic sub-forms (severity/duration/location per selected concern) are deferred to a future iteration of the question engine: this version asks duration/impact/triggers/progression once for the respondent''s concerns as a set rather than looping per selection, which keeps v1''s completeness/branching logic (see compute_assessment_completeness()) simple and auditable. A "Final Review" step exists in the frontend flow but has no entry here since it renders a summary of the sections below rather than collecting new data.',
  $sections$[
  {
    "id": "skin_basics",
    "title": "Skin Basics",
    "description": "How your skin generally behaves day to day.",
    "questions": [
      {
        "id": "skin_type",
        "type": "single_select",
        "required": true,
        "prompt": "How would you describe your skin type?",
        "options": [
          { "value": "oily", "label": "Oily" },
          { "value": "dry", "label": "Dry" },
          { "value": "combination", "label": "Combination" },
          { "value": "sensitive", "label": "Sensitive" },
          { "value": "normal", "label": "Normal" },
          { "value": "dehydrated", "label": "Dehydrated" }
        ]
      },
      {
        "id": "sensitivity_level",
        "type": "scale",
        "required": true,
        "prompt": "How reactive is your skin to new products or environmental changes?",
        "min": 1,
        "max": 5,
        "minLabel": "Rarely reacts",
        "maxLabel": "Reacts often"
      },
      {
        "id": "skin_characteristics",
        "type": "multi_select",
        "required": true,
        "prompt": "Which of these do you notice on your skin? Select all that apply.",
        "helperText": "This helps SKYNN understand how your skin behaves, not just how it looks.",
        "options": [
          { "value": "visible_pores", "label": "Visible pores" },
          { "value": "uneven_texture", "label": "Uneven texture" },
          { "value": "redness", "label": "Redness" },
          { "value": "pigmentation_patches", "label": "Pigmentation or dark patches" },
          { "value": "dullness", "label": "Dullness" },
          { "value": "fine_lines_wrinkles", "label": "Fine lines or wrinkles" },
          { "value": "loss_of_firmness", "label": "Loss of firmness" },
          { "value": "none_of_these", "label": "None of these" }
        ]
      },
      {
        "id": "dehydration_signs",
        "type": "multi_select",
        "required": true,
        "prompt": "Do you notice any of these signs of dehydration?",
        "options": [
          { "value": "tightness_after_cleansing", "label": "Tightness after cleansing" },
          { "value": "flaking", "label": "Flaking or rough patches" },
          { "value": "fine_lines_disappear_with_moisturiser", "label": "Fine lines that soften with moisturiser" },
          { "value": "dull_despite_moisturising", "label": "Looks dull despite moisturising" },
          { "value": "none_of_these", "label": "None of these" }
        ]
      },
      {
        "id": "barrier_symptoms",
        "type": "multi_select",
        "required": true,
        "prompt": "Have you experienced any of these barrier-related symptoms recently?",
        "options": [
          { "value": "stinging_with_products", "label": "Stinging or burning with products" },
          { "value": "frequent_redness", "label": "Frequent redness" },
          { "value": "easily_irritated_by_new_products", "label": "Easily irritated by new products" },
          { "value": "persistent_dryness_despite_moisturiser", "label": "Persistent dryness despite moisturiser" },
          { "value": "none_of_these", "label": "None of these" }
        ]
      }
    ]
  },
  {
    "id": "primary_concerns",
    "title": "Primary Concerns",
    "description": "What you'd most like SKYNN to focus on.",
    "questions": [
      {
        "id": "primary_concerns",
        "type": "multi_select",
        "required": true,
        "minSelections": 1,
        "maxSelections": 3,
        "prompt": "What are your top skin concerns right now? Choose up to 3.",
        "options": [
          { "value": "breakouts_acne", "label": "Breakouts / acne" },
          { "value": "oiliness", "label": "Oiliness" },
          { "value": "dryness_dehydration", "label": "Dryness or dehydration" },
          { "value": "redness_sensitivity", "label": "Redness or sensitivity" },
          { "value": "uneven_tone_pigmentation", "label": "Uneven tone or pigmentation" },
          { "value": "fine_lines_aging", "label": "Fine lines or signs of aging" },
          { "value": "texture_congestion", "label": "Texture or congestion" },
          { "value": "dullness", "label": "Dullness" },
          { "value": "large_pores", "label": "Large pores" },
          { "value": "scarring_marks", "label": "Scarring or marks" }
        ]
      },
      {
        "id": "concern_duration",
        "type": "single_select",
        "required": true,
        "prompt": "How long have these concerns been present?",
        "options": [
          { "value": "less_than_1_month", "label": "Less than a month" },
          { "value": "1_6_months", "label": "1–6 months" },
          { "value": "6_months_2_years", "label": "6 months – 2 years" },
          { "value": "over_2_years", "label": "Over 2 years" },
          { "value": "ongoing_lifelong", "label": "Ongoing / lifelong" }
        ]
      },
      {
        "id": "concern_impact",
        "type": "scale",
        "required": true,
        "prompt": "How much do these concerns affect your day-to-day confidence?",
        "min": 1,
        "max": 5,
        "minLabel": "Barely notice it",
        "maxLabel": "Affects me daily"
      },
      {
        "id": "concern_triggers",
        "type": "multi_select",
        "required": true,
        "prompt": "Do any of these seem to make your concerns worse?",
        "options": [
          { "value": "stress", "label": "Stress" },
          { "value": "diet", "label": "Diet" },
          { "value": "hormonal_cycle", "label": "Hormonal cycle" },
          { "value": "weather_climate", "label": "Weather or climate changes" },
          { "value": "new_products", "label": "Trying new products" },
          { "value": "sun_exposure", "label": "Sun exposure" },
          { "value": "unsure_no_clear_trigger", "label": "Unsure / no clear trigger" }
        ]
      },
      {
        "id": "concern_progression",
        "type": "single_select",
        "required": true,
        "prompt": "Over the last few months, would you say this is:",
        "options": [
          { "value": "getting_better", "label": "Getting better" },
          { "value": "staying_the_same", "label": "Staying the same" },
          { "value": "getting_worse", "label": "Getting worse" },
          { "value": "fluctuates", "label": "Fluctuates" }
        ]
      }
    ]
  },
  {
    "id": "current_routine",
    "title": "Current Routine",
    "description": "What you're already doing morning and night.",
    "questions": [
      {
        "id": "am_steps",
        "type": "multi_select",
        "required": true,
        "prompt": "What does your current morning (AM) routine include?",
        "options": [
          { "value": "cleanser", "label": "Cleanser" },
          { "value": "toner", "label": "Toner" },
          { "value": "serum_treatment", "label": "Serum / treatment" },
          { "value": "moisturiser", "label": "Moisturiser" },
          { "value": "sunscreen", "label": "Sunscreen" },
          { "value": "none_currently", "label": "No routine currently" }
        ]
      },
      {
        "id": "pm_steps",
        "type": "multi_select",
        "required": true,
        "prompt": "What does your current evening (PM) routine include?",
        "options": [
          { "value": "cleanser", "label": "Cleanser" },
          { "value": "double_cleanse", "label": "Double cleanse" },
          { "value": "toner", "label": "Toner" },
          { "value": "serum_treatment", "label": "Serum / treatment" },
          { "value": "moisturiser", "label": "Moisturiser" },
          { "value": "facial_oil", "label": "Facial oil" },
          { "value": "none_currently", "label": "No routine currently" }
        ]
      },
      {
        "id": "actives_in_use",
        "type": "multi_select",
        "required": true,
        "prompt": "Are you currently using any of these actives?",
        "helperText": "Your routine matters because even good ingredients can become counterproductive when overused.",
        "options": [
          { "value": "retinoid", "label": "Retinoid (retinol/tretinoin/etc.)" },
          { "value": "vitamin_c", "label": "Vitamin C" },
          { "value": "niacinamide", "label": "Niacinamide" },
          { "value": "aha_exfoliant", "label": "AHA exfoliant" },
          { "value": "bha_exfoliant", "label": "BHA exfoliant" },
          { "value": "benzoyl_peroxide", "label": "Benzoyl peroxide" },
          { "value": "hydroquinone", "label": "Hydroquinone" },
          { "value": "azelaic_acid", "label": "Azelaic acid" },
          { "value": "peptides", "label": "Peptides" },
          { "value": "none_currently", "label": "None currently" }
        ]
      },
      {
        "id": "exfoliation_frequency",
        "type": "single_select",
        "required": true,
        "prompt": "How often do you exfoliate (physical or chemical)?",
        "options": [
          { "value": "never", "label": "Never" },
          { "value": "weekly", "label": "About once a week" },
          { "value": "2_3x_week", "label": "2–3 times a week" },
          { "value": "daily", "label": "Daily" }
        ]
      },
      {
        "id": "known_irritating_ingredients",
        "type": "text",
        "required": false,
        "prompt": "Any ingredients or products that have irritated your skin before?",
        "helperText": "Optional — leave blank if none come to mind."
      }
    ]
  },
  {
    "id": "product_use",
    "title": "Product & Ingredient Exposure",
    "description": "Optional — tell us about specific products you use.",
    "questions": [
      {
        "id": "current_products",
        "type": "product_list",
        "required": false,
        "prompt": "Add any current products you'd like SKYNN to take into account.",
        "helperText": "Optional. Search SkinLabs' reviewed catalogue or add your own — SKYNN will only ever describe a product it can actually verify."
      }
    ]
  },
  {
    "id": "lifestyle_environment",
    "title": "Lifestyle & Environment",
    "description": "The context your skin lives in day to day.",
    "questions": [
      {
        "id": "climate",
        "type": "single_select",
        "required": true,
        "prompt": "Which best describes your everyday climate?",
        "options": [
          { "value": "hot_humid", "label": "Hot and humid" },
          { "value": "hot_dry", "label": "Hot and dry" },
          { "value": "mild_temperate", "label": "Mild / temperate" },
          { "value": "cold_dry", "label": "Cold and dry" },
          { "value": "coastal_humid", "label": "Coastal and humid" },
          { "value": "highveld_dry_winter", "label": "Highveld — dry winters, wet summers" }
        ]
      },
      {
        "id": "daily_sun_exposure",
        "type": "single_select",
        "required": true,
        "prompt": "On a typical day, how much direct sun do you get?",
        "options": [
          { "value": "mostly_indoors", "label": "Mostly indoors" },
          { "value": "under_30_min", "label": "Under 30 minutes" },
          { "value": "30_min_2_hours", "label": "30 minutes – 2 hours" },
          { "value": "over_2_hours", "label": "Over 2 hours" }
        ]
      },
      {
        "id": "spf_habit",
        "type": "single_select",
        "required": true,
        "prompt": "How consistently do you wear SPF?",
        "options": [
          { "value": "daily_rain_or_shine", "label": "Daily, rain or shine" },
          { "value": "only_when_sunny", "label": "Only when it's sunny" },
          { "value": "only_at_beach_outdoors", "label": "Only at the beach / outdoor activities" },
          { "value": "rarely_never", "label": "Rarely or never" }
        ]
      },
      {
        "id": "sleep_quality",
        "type": "single_select",
        "required": true,
        "prompt": "How would you describe your sleep?",
        "options": [
          { "value": "consistently_7_plus", "label": "Consistently 7+ hours" },
          { "value": "somewhat_irregular", "label": "Somewhat irregular" },
          { "value": "often_under_6", "label": "Often under 6 hours" },
          { "value": "highly_irregular", "label": "Highly irregular / shift work" }
        ]
      },
      {
        "id": "stress_level",
        "type": "scale",
        "required": true,
        "prompt": "How would you rate your current stress levels?",
        "min": 1,
        "max": 5,
        "minLabel": "Low",
        "maxLabel": "High"
      },
      {
        "id": "sweat_exercise_frequency",
        "type": "single_select",
        "required": true,
        "prompt": "How often do you exercise or sweat heavily?",
        "options": [
          { "value": "daily", "label": "Daily" },
          { "value": "few_times_week", "label": "A few times a week" },
          { "value": "weekly", "label": "About once a week" },
          { "value": "rarely", "label": "Rarely" }
        ]
      }
    ]
  },
  {
    "id": "goals",
    "title": "Goals",
    "description": "What you'd like your skin to look and feel like.",
    "questions": [
      {
        "id": "primary_goals",
        "type": "multi_select",
        "required": true,
        "minSelections": 1,
        "maxSelections": 3,
        "prompt": "What matters most to you right now? Choose up to 3.",
        "options": [
          { "value": "clearer_skin", "label": "Clearer skin" },
          { "value": "more_even_tone", "label": "More even tone" },
          { "value": "improved_hydration", "label": "Improved hydration" },
          { "value": "smoother_texture", "label": "Smoother texture" },
          { "value": "reduced_signs_of_aging", "label": "Reduced signs of aging" },
          { "value": "calmer_less_reactive_skin", "label": "Calmer, less reactive skin" },
          { "value": "simplified_routine", "label": "A simpler routine" },
          { "value": "general_maintenance", "label": "General maintenance" }
        ]
      }
    ]
  },
  {
    "id": "previous_treatments",
    "title": "Previous Treatments",
    "description": "What you've already tried.",
    "questions": [
      {
        "id": "prior_treatments",
        "type": "multi_select",
        "required": true,
        "prompt": "Have you tried any of the following before?",
        "options": [
          { "value": "otc_products_only", "label": "Over-the-counter products only" },
          { "value": "prescription_topicals", "label": "Prescription topical treatments" },
          { "value": "oral_medication", "label": "Oral medication (e.g. antibiotics, isotretinoin)" },
          { "value": "in_clinic_facials", "label": "In-clinic facials" },
          { "value": "chemical_peels", "label": "Chemical peels" },
          { "value": "laser_device_treatments", "label": "Laser or device treatments" },
          { "value": "dermatologist_consultation", "label": "Dermatologist consultation" },
          { "value": "none_of_these", "label": "None of these" }
        ]
      },
      {
        "id": "treatment_notes",
        "type": "text",
        "required": false,
        "prompt": "Anything else about past treatments worth knowing?",
        "helperText": "Optional."
      }
    ]
  },
  {
    "id": "safety_screening",
    "title": "Safety Check",
    "description": "A quick check for anything worth flagging to a professional.",
    "questions": [
      {
        "id": "safety_red_flags",
        "type": "multi_select",
        "required": true,
        "prompt": "Are you currently experiencing any of the following?",
        "helperText": "This is a general check, not a diagnosis — it just helps SKYNN know when to recommend seeing a professional.",
        "options": [
          { "value": "rapidly_changing_mole", "label": "A mole or spot that's rapidly changing in size, shape or colour" },
          { "value": "non_healing_sore_or_wound", "label": "A sore or wound that isn't healing" },
          { "value": "sudden_severe_hair_loss", "label": "Sudden or severe hair loss" },
          { "value": "painful_swelling_or_signs_of_infection", "label": "Painful swelling or signs of infection (warmth, pus, fever)" },
          { "value": "severe_unexplained_reaction", "label": "A severe, unexplained skin reaction" },
          { "value": "none_of_the_above", "label": "None of the above" }
        ]
      }
    ]
  }
]$sections$::jsonb
);

INSERT INTO public.assessment_prompt_versions (version, status, system_prompt, is_placeholder, model_default, notes)
VALUES (
  '1.0.0-placeholder',
  'draft',
  NULL,
  true,
  NULL,
  'Secure placeholder — no dermatologist-approved SKYNN system prompt has been supplied by SkinLabs yet. supabase/functions/_shared/assessment/promptRegistry.ts refuses to run generation against any row where is_placeholder = true or system_prompt IS NULL. Replace by inserting a new active version with real, approved content and pointing skynn_advanced_assessment_config.active_prompt_version at it — never by editing this row in place.'
);

INSERT INTO public.skynn_advanced_assessment_config (id, rollout_stage, active_definition_version, active_prompt_version)
VALUES (true, 'disabled', '2026.1', '1.0.0-placeholder');
