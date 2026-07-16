// Condensed knowledge from "Dermatologist-Approved Skincare Routines for AI Tool Training"
// Used as grounding context for the Gemini-powered AI formulator.

export const DERMATOLOGIST_KNOWLEDGE = `
# DERMATOLOGIST-APPROVED SKINCARE — REFERENCE KNOWLEDGE BASE
(Use this as the scientific grounding for every recommendation. Cite principles, never invent ingredients or concentrations beyond what is listed.)

## 1. CORE ROUTINE PILLARS
Three foundations regardless of skin type: gentle cleansing, effective moisturization, rigorous daily photoprotection.

### Morning (AM)
1. Gentle pH-balanced cleanser (or water rinse for very dry/sensitive).
2. Antioxidant serum — Vitamin C / L-ascorbic acid 10–20% (or 5–10% for sensitive skin).
3. Lightweight non-comedogenic moisturizer with ceramides or hyaluronic acid.
4. Broad-spectrum SPF 30+ (SPF 50+ for melasma, hyperpigmentation, darker phototypes outdoors).

### Evening (PM)
1. Double cleanse (oil-based then water-based) when wearing SPF or makeup; single gentle cleanse otherwise.
2. Targeted active (retinoid, AHA, BHA, niacinamide, azelaic acid) — only as tolerated.
3. Richer barrier-repair moisturizer with ceramides, cholesterol, fatty acids.
4. Optional non-comedogenic facial oil (squalane, rosehip, jojoba) for very dry skin.

## 2. SKIN PHENOTYPING

### Fitzpatrick Phototype (I–VI)
- I  Pale white — always burns, never tans.
- II Fair — burns easily, tans poorly.
- III Darker white — burns then tans.
- IV Light brown — burns minimally, tans easily.
- V  Brown — rarely burns, tans darkly.
- VI Dark brown/black — never burns, always tans darkly.

Phototype guides photoprotection intensity, peel/laser caution, and post-inflammatory hyperpigmentation (PIH) risk. Higher phototypes (IV–VI) — high PIH risk; avoid aggressive actives, prioritize tyrosinase inhibitors + SPF.

### Baumann axes (simplified)
- Oily ↔ Dry
- Sensitive ↔ Resistant
- Pigmented ↔ Non-pigmented
- Wrinkled ↔ Tight

## 3. ACTIVE INGREDIENTS — INDICATIONS, CONCENTRATIONS, CLINICAL EVIDENCE

| Active | Concentration | Use | Notes |
|---|---|---|---|
| Retinol (OTC) | 0.1–0.5% (start 0.1–0.25%) | Photoaging, acne, texture | PM only. Buffer with moisturizer. |
| Tretinoin (Rx) | 0.025–0.1% | Severe photoaging, acne | Higher irritation; gold standard. |
| Adapalene | 0.1–0.3% | Acne | Most tolerated retinoid. |
| Vitamin C (L-AA) | 10–20% AM | Antioxidant, brightening | pH < 3.5 for efficacy. |
| Niacinamide | 2–10% | Barrier, PIH, oil control | Pairs well with everything. |
| Hyaluronic acid | 0.1–2% | Hydration | Apply to damp skin. |
| Salicylic acid (BHA) | 0.5–2% | Acne, congestion, T-zone | Avoid with retinoid same night. |
| Glycolic / Lactic (AHA) | 5–10% (OTC) | Dullness, PIH, texture | Increases photosensitivity. |
| Benzoyl peroxide | 2.5–5% | Inflammatory acne | Avoid layering with retinol/Vit C. |
| Azelaic acid | 10–20% | Acne, rosacea, PIH | Safe in pregnancy. |
| Ceramides + cholesterol + FFA (3:1:1) | n/a | Barrier repair | First line for sensitive/dry. |
| Peptides | n/a | Firmness adjunct | Well tolerated. |
| Hydroquinone (Rx) | 2–4% | Melasma, PIH | Cycle 12 weeks on / off; ochronosis risk. |
| Zinc oxide / Titanium dioxide | mineral SPF | Sensitive, melasma, post-procedure | Visible-light protection with tinted formulas. |

## 4. ACTIVES INTRODUCTION SCHEDULE (titration)
- Week 1–2: introduce one new active at lowest strength, 2 nights/week, buffer with moisturizer.
- Week 3–4: increase to 3–4 nights/week if no irritation. Add second active only if first is tolerated.
- Ongoing: nightly or every other night. Re-evaluate every 8–12 weeks.

### Do NOT layer (same routine)
- Retinoid + AHA/BHA same night
- Retinoid + Benzoyl peroxide (inactivates many retinoids; adapalene is the exception)
- Vitamin C + Benzoyl peroxide (oxidation)
- Multiple acids at once
- New active + freshly compromised barrier — repair first

## 5. CONDITION-SPECIFIC PROTOCOLS

### Acne (mild–moderate)
- AM: gentle cleanser → niacinamide → oil-free moisturizer → SPF.
- PM: salicylic-acid cleanser 2–3×/week, adapalene 0.1% nightly (titrate), moisturizer.
- Add benzoyl peroxide 2.5% spot for inflammatory lesions.
- Escalate to derm if cystic, scarring, hormonal, or unresponsive after 12 weeks.

### Hyperpigmentation / Melasma / PIH
- AM: Vitamin C 10–15% → tinted mineral SPF 50.
- PM: azelaic acid 10% nightly OR alternate with retinoid; consider tranexamic acid serum 2–5%.
- Strict photoprotection mandatory (visible light + UVA + UVB).
- Avoid aggressive exfoliation in Fitzpatrick IV–VI.

### Sensitive / Rosacea / Compromised barrier
- Fragrance-free, sulfate-free, low-pH cleansers only.
- Ceramide + cholesterol moisturizer 2×/day. No actives until barrier intact (2–4 weeks).
- Reintroduce with azelaic acid 10% or niacinamide 4–5%.
- Physical SPF; avoid hot showers, alcohol-based toners, scrubs.

### Anti-aging (mature / photoaged)
- AM: Vitamin C → peptide moisturizer → SPF 50.
- PM: retinoid (titrate up), bakuchiol if intolerant. Add growth-factor or peptide cream.
- Weekly: gentle AHA mask.

### Oily / combination
- AM: foaming gel cleanser → niacinamide 5% → gel-cream moisturizer → SPF (fluid/gel).
- PM: BHA 2% (alternating with retinoid), gel moisturizer.

### Dry / dehydrated
- AM: cream cleanser or water rinse → hyaluronic serum on damp skin → rich cream → SPF.
- PM: oil cleanse → hydrating toner → ceramide cream → optional facial oil seal.

## 6. PHOTOPROTECTION RULES
- SPF 30 minimum, SPF 50+ outdoors / Fitzpatrick I–II / hyperpigmentation.
- Reapply every 2 hours outdoors; tinted (iron oxide) for visible-light protection.
- Physical filters preferred for sensitive skin, post-procedure, melasma.
- Pair with hats and clothing; do not rely solely on SPF.

## 7. CLIMATE & LIFESTYLE ADAPTATIONS
- Hot/humid → gel textures, BHA, oil-free SPF.
- Hot/dry → layer hydration (HA + ceramide cream), barrier focus.
- Cold/dry → richer occlusive moisturizer (shea, squalane), reduce active frequency.
- Frequent makeup/SPF → mandatory double cleanse PM.
- High screen exposure / urban pollution → antioxidant AM stack (Vit C + E + ferulic), visible-light SPF.

## 8. SAFETY & ESCALATION FLAGS (always recommend dermatologist visit)
- Cystic / nodular / scarring acne.
- Sudden new mole, changing pigmented lesion (ABCDE).
- Persistent redness / pustules suggestive of rosacea.
- Unresponsive melasma after 12 weeks.
- Suspected contact dermatitis or recurrent eczema flares.
- Any lesion bleeding, ulcerating, or growing.

## 9. SOUTH AFRICAN CONTEXT
- Predominantly Fitzpatrick III–VI — prioritize PIH prevention, gentle exfoliation, broad-spectrum + visible-light SPF.
- High UV index year-round; SPF 50 default for outdoor exposure.
- POPIA compliance for any image/data collection. Always state AI is decision-support, not diagnosis.

## 10. FINAL GUARDRAILS
- Never diagnose disease. Use "may suggest" / "consistent with".
- Always include a dermatologist-referral note for medical concerns.
- Personalize: cite the user's own quiz answers when justifying steps.
- Be specific (product type + key ingredient + reason), but do not name competitor brands. Prefer "SKINLABS" product types when relevant.
- Tone: warm, professional, encouraging, evidence-led.
`;
