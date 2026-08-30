/**
 * Seeded, read-only reader/listener comments for editorial content (Daily
 * Skinny briefings, Spotlight brand profiles, Seasonal Guides, podcast
 * episodes and Shelf Showdown comparisons). Diverse South African voices —
 * dermatologists, everyday users, cost- and climate-conscious readers —
 * displayed as a community-reaction section on each article page. These are
 * editorial seed content, not user-submitted data, so there is no live
 * posting form here (see src/data/reviews.ts for the pattern used on
 * product reviews, which does support live comments via Supabase).
 */
export interface ArticleComment {
  display_name: string;
  body: string;
  created_at: string;
}

export const newsroomComments: Record<string, ArticleComment[]> = {
  "sunscreen-labelling-sa": [
    { display_name: "CorneS", body: "Would this apply the same way to melanin-rich skin, or does that change the picture?", created_at: "2026-06-15T06:44:00Z" },
    { display_name: "Marnus_Vereeniging", body: "This lines up with what I deal with living in Durban — Durban's humidity makes this a bigger deal than people think.", created_at: "2026-07-02T13:45:00Z" },
    { display_name: "FarhanaK", body: "Curious how much of this is settled science versus still emerging. Worth a follow-up piece maybe.", created_at: "2026-07-05T04:34:00Z" },
  ],
  "niacinamide-hyperpigmentation-trial": [
    { display_name: "Kayla_Benoni", body: "Reading this from Durban and nodding along the whole time, Durban's humidity really does change the calculus here.", created_at: "2026-05-23T16:53:00Z" },
    { display_name: "Meera_Umlazi", body: "Didn't realise how much this actually applied to my own routine until reading this. Adjusting a few things now.", created_at: "2026-07-26T08:24:00Z" },
    { display_name: "Kabelo_CT", body: "Appreciate that this didn't just point to expensive imported options — the SA angle on pricing actually matters here.", created_at: "2026-07-26T22:35:00Z" },
  ],
  "winter-barrier-highveld": [
    { display_name: "WaseemM_DBN", body: "Genuinely interesting, though I'd want to see how this holds up outside the original study population.", created_at: "2026-06-22T18:01:00Z" },
    { display_name: "Bongani_EL", body: "Useful, though I wish it touched on what this means for people who can't afford the premium version of the fix.", created_at: "2026-06-26T01:08:00Z" },
    { display_name: "Nomsa_DBN", body: "Good briefing. Wish more skincare reporting was this straightforward instead of chasing a scary headline.", created_at: "2026-07-07T20:44:00Z" },
  ],
  "retinal-vs-retinol": [
    { display_name: "GideonB", body: "This lines up with what I deal with living in Kimberley — how harsh the Northern Cape sun is makes this a bigger deal than people think.", created_at: "2026-05-21T23:47:00Z" },
    { display_name: "Kessie_Witbank", body: "Useful, though I wish it touched on what this means for people who can't afford the premium version of the fix.", created_at: "2026-05-27T15:24:00Z" },
    { display_name: "BuhleJ", body: "Is this based on a single study or a broader body of research? Would love to see the actual source cited.", created_at: "2026-06-01T12:07:00Z" },
    { display_name: "DrAzizaB", body: "From a clinical standpoint this is a fair summary — I'd add that individual response still varies a lot patient to patient.", created_at: "2026-08-08T01:44:00Z" },
  ],
  "hard-water-skin": [
    { display_name: "DrSunithaM_CT", body: "I'm a GP and refer a fair number of patients on for exactly this reason. Good to see it summarised this clearly.", created_at: "2026-05-22T15:57:00Z" },
    { display_name: "WarrenL", body: "This lines up with what I deal with living in Bloemfontein — how dry it gets in Bloem makes this a bigger deal than people think.", created_at: "2026-05-23T01:29:00Z" },
    { display_name: "MeganR", body: "Does this change anything for people already on a retinoid, or is it a separate consideration entirely?", created_at: "2026-06-10T05:26:00Z" },
    { display_name: "NokuthulaM_Tshwane", body: "Went through exactly this a while back and it took ages to figure out what was actually going on. Useful piece.", created_at: "2026-07-13T00:09:00Z" },
  ],
  "teledermatology-access": [
    { display_name: "NalediC", body: "Appreciate that this didn't just point to expensive imported options — the SA angle on pricing actually matters here.", created_at: "2026-05-31T06:49:00Z" },
    { display_name: "MarnusT_Kimberley", body: "Reading this from Bloemfontein and nodding along the whole time, how dry it gets in Bloem really does change the calculus here.", created_at: "2026-06-18T09:19:00Z" },
    { display_name: "DrKavyaK", body: "As a practising dermatologist, this tracks with what I'm seeing in Bloemfontein clinics — worth the read if you're managing access to care.", created_at: "2026-06-20T11:53:00Z" },
    { display_name: "Andile_Randburg", body: "Would this apply the same way to melanin-rich skin, or does that change the picture?", created_at: "2026-07-31T19:50:00Z" },
    { display_name: "Suzette_Umlazi", body: "Curious how much of this is settled science versus still emerging. Worth a follow-up piece maybe.", created_at: "2026-08-13T19:06:00Z" },
  ],
};

export const spotlightComments: Record<string, ArticleComment[]> = {
  "standard-beauty": [
    { display_name: "NomsaT", body: "Surprised to see Standard Beauty rank this high, my experience with a couple of their products was pretty average.", created_at: "2026-05-13T11:17:00Z" },
    { display_name: "ZolaH_Gqeberha", body: "Long-time Standard Beauty user here. The formulation notes match my own experience pretty closely.", created_at: "2026-06-04T19:26:00Z" },
    { display_name: "YugenC_Khayelitsha", body: "Standard Beauty has held up well through a full Cape Town winter for me — genuinely impressed given the Cape Town wind.", created_at: "2026-08-09T17:02:00Z" },
  ],
  "skin-functional": [
    { display_name: "HanlieT_Sandton", body: "Skin Functional converted me a while back. Glad to see it's not just me who rates them this highly.", created_at: "2026-05-03T02:30:00Z" },
    { display_name: "Faeza_George", body: "Living with Polokwane's summer heat, I've found Skin Functional's formulas perform better than most imported alternatives.", created_at: "2026-05-08T08:21:00Z" },
    { display_name: "Kayla_EL", body: "Ranking feels a bit generous for Skin Functional based on what I've tried, though I get the reasoning.", created_at: "2026-06-06T14:05:00Z" },
    { display_name: "AyabongaW", body: "Agree on the value call for Skin Functional — it's rare to find a brand that doesn't cut corners at this price point.", created_at: "2026-06-27T07:23:00Z" },
  ],
  "lelive": [
    { display_name: "DrThembaV", body: "I recommend Lelive to clients fairly often — good to see the methodology behind this ranking laid out transparently.", created_at: "2026-05-27T17:06:00Z" },
    { display_name: "ThulaniJ", body: "Living with how dry it gets in Bloem, I've found Lelive's formulas perform better than most imported alternatives.", created_at: "2026-06-19T00:03:00Z" },
    { display_name: "TaylaH_Gqeberha", body: "The price-to-performance breakdown on Lelive matches what I've found shopping around SA retailers myself.", created_at: "2026-08-12T01:42:00Z" },
  ],
  "portia-m": [
    { display_name: "DrGadija_Benoni", body: "From a formulation standpoint Portia M's actives are disclosed clearly, which is more than I can say for a lot of competitors in this space.", created_at: "2026-05-06T15:24:00Z" },
    { display_name: "HendrikH", body: "Not fully sold on the value ranking here, Portia M is decent but I've found cheaper alternatives that do just as much.", created_at: "2026-06-17T04:47:00Z" },
    { display_name: "SiphoW_Khayelitsha", body: "Portia M has held up well through a full Gqeberha winter for me — genuinely impressed given the coastal humidity here in Gqeberha.", created_at: "2026-07-11T05:33:00Z" },
    { display_name: "CharmaineN_Polokwane", body: "Would love to see Portia M go head-to-head with a similar brand in a proper Shelf Showdown.", created_at: "2026-07-17T06:28:00Z" },
    { display_name: "AnnekeR", body: "Surprised to see Portia M rank this high, my experience with a couple of their products was pretty average.", created_at: "2026-08-14T20:31:00Z" },
  ],
  "african-extracts": [
    { display_name: "Willem_EL", body: "Ranking feels a bit generous for African Extracts based on what I've tried, though I get the reasoning.", created_at: "2026-05-03T07:44:00Z" },
    { display_name: "Bradley_Springs", body: "How does African Extracts stack up against the more clinic-distributed brands on this list? Curious if the gap is really that big.", created_at: "2026-05-12T01:12:00Z" },
    { display_name: "Ilse_George", body: "Not fully sold on the value ranking here, African Extracts is decent but I've found cheaper alternatives that do just as much.", created_at: "2026-05-13T17:03:00Z" },
    { display_name: "DrShireen_Boksburg", body: "I recommend African Extracts to clients fairly often — good to see the methodology behind this ranking laid out transparently.", created_at: "2026-07-06T12:41:00Z" },
  ],
  "lamelle": [
    { display_name: "KirstenN", body: "Been using Lamelle for a couple of years now, so it's good to see the ranking backs up what I already suspected.", created_at: "2026-05-30T00:40:00Z" },
    { display_name: "Meera_Boksburg", body: "Would love to see Lamelle go head-to-head with a similar brand in a proper Shelf Showdown.", created_at: "2026-06-28T07:30:00Z" },
    { display_name: "SiphoJ", body: "Living with how dry it gets in Bloem, I've found Lamelle's formulas perform better than most imported alternatives.", created_at: "2026-07-10T06:05:00Z" },
    { display_name: "DrThabo_Stellenbosch", body: "From a formulation standpoint Lamelle's actives are disclosed clearly, which is more than I can say for a lot of competitors in this space.", created_at: "2026-08-07T07:45:00Z" },
  ],
  "environ": [
    { display_name: "NthabisengS", body: "Long-time Environ user here. The formulation notes match my own experience pretty closely.", created_at: "2026-06-12T09:57:00Z" },
    { display_name: "DineshR", body: "How does Environ stack up against the more clinic-distributed brands on this list? Curious if the gap is really that big.", created_at: "2026-07-31T05:51:00Z" },
    { display_name: "NoziphoM", body: "The price-to-performance breakdown on Environ matches what I've found shopping around SA retailers myself.", created_at: "2026-08-09T23:00:00Z" },
    { display_name: "SibongileW", body: "Surprised to see Environ rank this high, my experience with a couple of their products was pretty average.", created_at: "2026-08-12T12:29:00Z" },
    { display_name: "DrBonganiC_Centurion", body: "From a formulation standpoint Environ's actives are disclosed clearly, which is more than I can say for a lot of competitors in this space.", created_at: "2026-08-15T21:16:00Z" },
  ],
  "esse": [
    { display_name: "Claire_Benoni", body: "Living with the coastal humidity here in Gqeberha, I've found Esse's formulas perform better than most imported alternatives.", created_at: "2026-05-07T17:56:00Z" },
    { display_name: "PetroT", body: "How does Esse stack up against the more clinic-distributed brands on this list? Curious if the gap is really that big.", created_at: "2026-05-22T12:13:00Z" },
    { display_name: "WynandN_Mbombela", body: "Esse converted me a while back. Glad to see it's not just me who rates them this highly.", created_at: "2026-07-22T01:52:00Z" },
  ],
  "the-ordinary": [
    { display_name: "DrPetro_PE", body: "From a formulation standpoint The Ordinary's actives are disclosed clearly, which is more than I can say for a lot of competitors in this space.", created_at: "2026-06-07T16:17:00Z" },
    { display_name: "BuhleS_Umlazi", body: "The Ordinary converted me a while back. Glad to see it's not just me who rates them this highly.", created_at: "2026-08-19T17:22:00Z" },
    { display_name: "CraigH", body: "Agree on the value call for The Ordinary — it's rare to find a brand that doesn't cut corners at this price point.", created_at: "2026-08-20T19:35:00Z" },
  ],
  "nimue": [
    { display_name: "KeshiaH", body: "Would love to see Nimue go head-to-head with a similar brand in a proper Shelf Showdown.", created_at: "2026-05-11T19:58:00Z" },
    { display_name: "AneleM", body: "Nimue converted me a while back. Glad to see it's not just me who rates them this highly.", created_at: "2026-06-08T10:39:00Z" },
    { display_name: "RoshniK_MitchellsPlain", body: "Nimue has held up well through a full Johannesburg winter for me — genuinely impressed given the Highveld dryness.", created_at: "2026-06-12T23:03:00Z" },
    { display_name: "AyandaR", body: "Ranking feels a bit generous for Nimue based on what I've tried, though I get the reasoning.", created_at: "2026-07-06T23:37:00Z" },
  ],
  "optiphi": [
    { display_name: "ThandekaW", body: "Not fully sold on the value ranking here, Optiphi is decent but I've found cheaper alternatives that do just as much.", created_at: "2026-05-05T18:33:00Z" },
    { display_name: "DrFarhanaC_Durban", body: "I recommend Optiphi to clients fairly often — good to see the methodology behind this ranking laid out transparently.", created_at: "2026-07-16T02:20:00Z" },
    { display_name: "Tayla_PE", body: "Living with how harsh the Northern Cape sun is, I've found Optiphi's formulas perform better than most imported alternatives.", created_at: "2026-08-20T02:04:00Z" },
    { display_name: "Sibongile_JHB", body: "Ranking feels a bit generous for Optiphi based on what I've tried, though I get the reasoning.", created_at: "2026-08-22T23:41:00Z" },
    { display_name: "Marnus_Springs", body: "Been using Optiphi for a couple of years now, so it's good to see the ranking backs up what I already suspected.", created_at: "2026-08-25T19:29:00Z" },
  ],
  "skin-creamery": [
    { display_name: "Kirsten_Springs", body: "Long-time Skin Creamery user here. The formulation notes match my own experience pretty closely.", created_at: "2026-05-22T03:30:00Z" },
    { display_name: "WarrenR", body: "Surprised to see Skin Creamery rank this high, my experience with a couple of their products was pretty average.", created_at: "2026-05-26T07:50:00Z" },
    { display_name: "FarhanaT_Midrand", body: "The price-to-performance breakdown on Skin Creamery matches what I've found shopping around SA retailers myself.", created_at: "2026-07-07T15:22:00Z" },
  ],
  "bio-oil": [
    { display_name: "Marnus_JHB", body: "Would love to see Bio-Oil go head-to-head with a similar brand in a proper Shelf Showdown.", created_at: "2026-05-14T15:59:00Z" },
    { display_name: "KaraboP_Polokwane", body: "Bio-Oil converted me a while back. Glad to see it's not just me who rates them this highly.", created_at: "2026-06-23T01:49:00Z" },
    { display_name: "YugenW", body: "Living with the Eastern Cape wind off the coast, I've found Bio-Oil's formulas perform better than most imported alternatives.", created_at: "2026-06-26T03:18:00Z" },
  ],
  "vitaderm": [
    { display_name: "JustinK_Umlazi", body: "Been using Vitaderm for a couple of years now, so it's good to see the ranking backs up what I already suspected.", created_at: "2026-05-31T13:45:00Z" },
    { display_name: "Kayla_Centurion", body: "Living with PMB's mix of humidity and cold snaps, I've found Vitaderm's formulas perform better than most imported alternatives.", created_at: "2026-06-01T09:21:00Z" },
    { display_name: "WillemP_Durban", body: "Not fully sold on the value ranking here, Vitaderm is decent but I've found cheaper alternatives that do just as much.", created_at: "2026-07-10T21:19:00Z" },
    { display_name: "DrRidwaanC_PTA", body: "From a formulation standpoint Vitaderm's actives are disclosed clearly, which is more than I can say for a lot of competitors in this space.", created_at: "2026-07-15T04:18:00Z" },
  ],
  "skinphd": [
    { display_name: "DrKatlegoT", body: "I recommend SkinPhD to clients fairly often — good to see the methodology behind this ranking laid out transparently.", created_at: "2026-06-17T12:38:00Z" },
    { display_name: "BradleyH_Rustenburg", body: "Ranking feels a bit generous for SkinPhD based on what I've tried, though I get the reasoning.", created_at: "2026-06-20T04:03:00Z" },
    { display_name: "Naledi_Stellenbosch", body: "Agree on the value call for SkinPhD — it's rare to find a brand that doesn't cut corners at this price point.", created_at: "2026-07-12T17:02:00Z" },
    { display_name: "LwaziD_Springs", body: "How does SkinPhD stack up against the more clinic-distributed brands on this list? Curious if the gap is really that big.", created_at: "2026-07-29T21:12:00Z" },
  ],
  "bioderma": [
    { display_name: "ZaneleR_Witbank", body: "Long-time Bioderma user here. The formulation notes match my own experience pretty closely.", created_at: "2026-05-05T13:39:00Z" },
    { display_name: "Shireen_Gqeberha", body: "How does Bioderma stack up against the more clinic-distributed brands on this list? Curious if the gap is really that big.", created_at: "2026-06-03T01:47:00Z" },
    { display_name: "FaezaN_Tshwane", body: "Surprised to see Bioderma rank this high, my experience with a couple of their products was pretty average.", created_at: "2026-06-05T14:19:00Z" },
    { display_name: "Ryan_EL", body: "Bioderma has held up well through a full Pretoria winter for me — genuinely impressed given Pretoria's dry heat.", created_at: "2026-08-08T20:54:00Z" },
    { display_name: "DrLeratoT", body: "From a formulation standpoint Bioderma's actives are disclosed clearly, which is more than I can say for a lot of competitors in this space.", created_at: "2026-08-19T01:11:00Z" },
  ],
  "skoon": [
    { display_name: "AzizaH", body: "Been using Skoon for a couple of years now, so it's good to see the ranking backs up what I already suspected.", created_at: "2026-05-26T02:28:00Z" },
    { display_name: "DrWynandD", body: "From a formulation standpoint Skoon's actives are disclosed clearly, which is more than I can say for a lot of competitors in this space.", created_at: "2026-06-03T20:07:00Z" },
    { display_name: "NokuthulaM_Bloem", body: "Would love to see Skoon go head-to-head with a similar brand in a proper Shelf Showdown.", created_at: "2026-08-09T08:11:00Z" },
    { display_name: "PrevaniaZ_Tshwane", body: "Not fully sold on the value ranking here, Skoon is decent but I've found cheaper alternatives that do just as much.", created_at: "2026-08-12T00:15:00Z" },
  ],
  "fundamentals": [
    { display_name: "Lwazi_PE", body: "Been using Fundamentals for a couple of years now, so it's good to see the ranking backs up what I already suspected.", created_at: "2026-05-20T12:55:00Z" },
    { display_name: "LindiweB", body: "Fundamentals has held up well through a full Polokwane winter for me — genuinely impressed given Polokwane's summer heat.", created_at: "2026-07-18T07:56:00Z" },
    { display_name: "Justin_Centurion", body: "The price-to-performance breakdown on Fundamentals matches what I've found shopping around SA retailers myself.", created_at: "2026-07-21T15:50:00Z" },
    { display_name: "Warren_Randburg", body: "Would love to see Fundamentals go head-to-head with a similar brand in a proper Shelf Showdown.", created_at: "2026-08-22T22:46:00Z" },
    { display_name: "Lerato_Bloem", body: "Surprised to see Fundamentals rank this high, my experience with a couple of their products was pretty average.", created_at: "2026-08-24T15:52:00Z" },
  ],
  "silki": [
    { display_name: "Farhana_JHB", body: "Silki converted me a while back. Glad to see it's not just me who rates them this highly.", created_at: "2026-06-03T02:32:00Z" },
    { display_name: "CharmaineZ_Kimberley", body: "Ranking feels a bit generous for Silki based on what I've tried, though I get the reasoning.", created_at: "2026-06-21T02:26:00Z" },
    { display_name: "CraigC_Durban", body: "Living with the humidity out here in Mbombela, I've found Silki's formulas perform better than most imported alternatives.", created_at: "2026-07-14T17:00:00Z" },
  ],
  "justine": [
    { display_name: "PreciousL_Gqeberha", body: "Living with PMB's mix of humidity and cold snaps, I've found Justine's formulas perform better than most imported alternatives.", created_at: "2026-06-27T20:22:00Z" },
    { display_name: "GadijaT_Stellenbosch", body: "Would love to see Justine go head-to-head with a similar brand in a proper Shelf Showdown.", created_at: "2026-06-30T04:01:00Z" },
    { display_name: "NirvanaV", body: "Agree on the value call for Justine — it's rare to find a brand that doesn't cut corners at this price point.", created_at: "2026-08-10T14:56:00Z" },
    { display_name: "DrIlseM_PE", body: "I recommend Justine to clients fairly often — good to see the methodology behind this ranking laid out transparently.", created_at: "2026-08-17T06:02:00Z" },
    { display_name: "MandlaM", body: "Ranking feels a bit generous for Justine based on what I've tried, though I get the reasoning.", created_at: "2026-08-18T06:22:00Z" },
  ],
  "avon": [
    { display_name: "ThulaniM_Soweto", body: "How does Avon stack up against the more clinic-distributed brands on this list? Curious if the gap is really that big.", created_at: "2026-05-05T21:01:00Z" },
    { display_name: "Corne_Soweto", body: "Ranking feels a bit generous for Avon based on what I've tried, though I get the reasoning.", created_at: "2026-05-25T17:07:00Z" },
    { display_name: "OfentseS", body: "Long-time Avon user here. The formulation notes match my own experience pretty closely.", created_at: "2026-06-20T22:49:00Z" },
    { display_name: "WaseemP", body: "Agree on the value call for Avon — it's rare to find a brand that doesn't cut corners at this price point.", created_at: "2026-07-10T13:29:00Z" },
    { display_name: "DrOfentseC_George", body: "I recommend Avon to clients fairly often — good to see the methodology behind this ranking laid out transparently.", created_at: "2026-08-11T19:19:00Z" },
  ],
};

export const seasonalComments: Record<string, ArticleComment[]> = {
  "spring": [
    { display_name: "KirstenV", body: "Feels like a lot of the \"change for spring\" advice online is overkill — this at least keeps it sensible.", created_at: "2026-05-21T08:58:00Z" },
    { display_name: "ThaboK_Midrand", body: "Any budget alternative to the SPF pick for spring? Loved the routine otherwise.", created_at: "2026-06-02T14:53:00Z" },
    { display_name: "AzizaH_DBN", body: "Following this loosely and it's already made a noticeable difference to how my skin's coping this spring.", created_at: "2026-06-28T10:33:00Z" },
    { display_name: "DrYugen_Vereeniging", body: "Good, sensible spring advice — the \"adjust texture, not routine\" framing is exactly what I tell patients.", created_at: "2026-08-15T02:30:00Z" },
  ],
  "summer": [
    { display_name: "RafeeqR_Kimberley", body: "Would swapping in a richer moisturiser still work with this routine, or does that defeat the point for summer?", created_at: "2026-07-03T16:44:00Z" },
    { display_name: "DrDeonP", body: "Good, sensible summer advice — the \"adjust texture, not routine\" framing is exactly what I tell patients.", created_at: "2026-07-24T09:01:00Z" },
    { display_name: "RefilweK_Boksburg", body: "Made pretty much this exact switch already this summer and my skin's been so much happier for it.", created_at: "2026-08-17T05:51:00Z" },
  ],
  "autumn": [
    { display_name: "DrMarnus_Vereeniging", body: "As someone in aesthetics, I'd add that this autumn transition is when I see the most avoidable irritation from people changing too much at once.", created_at: "2026-05-08T16:18:00Z" },
    { display_name: "StefanM_Sandton", body: "This is spot on for Johannesburg — the Highveld dryness makes autumn genuinely different here than the rest of the country.", created_at: "2026-05-29T00:17:00Z" },
    { display_name: "MandlaP_Worcester", body: "Any budget alternative to the SPF pick for autumn? Loved the routine otherwise.", created_at: "2026-08-15T00:38:00Z" },
  ],
  "winter": [
    { display_name: "DrBuhleB_Benoni", body: "Good, sensible winter advice — the \"adjust texture, not routine\" framing is exactly what I tell patients.", created_at: "2026-06-05T18:24:00Z" },
    { display_name: "HendrikD_Midrand", body: "Made pretty much this exact switch already this winter and my skin's been so much happier for it.", created_at: "2026-06-07T10:36:00Z" },
    { display_name: "Ridwaan_Midrand", body: "Reading this in Gqeberha and it matches exactly what my skin's been doing this winter.", created_at: "2026-07-20T04:24:00Z" },
    { display_name: "MandlaC", body: "Would swapping in a richer moisturiser still work with this routine, or does that defeat the point for winter?", created_at: "2026-08-24T01:47:00Z" },
  ],
};

export const podcastComments: Record<string, ArticleComment[]> = {
  "ep-1-weird-skincare": [
    { display_name: "ThaboV", body: "Been trying to explain this exact point about unusual skincare trends to friends for ages, going to just send them this episode instead.", created_at: "2026-05-02T10:50:00Z" },
    { display_name: "GideonD_MitchellsPlain", body: "Good episode overall, though I think the take on unusual skincare trends glossed over a few of the counterarguments.", created_at: "2026-05-08T22:48:00Z" },
    { display_name: "KirstenT", body: "Can you do a follow-up on sunscreen reformulation next? Would pair well with this one.", created_at: "2026-05-26T09:52:00Z" },
    { display_name: "DrYusufN", body: "As someone working in skincare, I appreciated that this stayed evidence-led rather than chasing the trend angle on unusual skincare trends.", created_at: "2026-07-12T20:12:00Z" },
    { display_name: "ClaireP_Paarl", body: "Really enjoyed this episode — the section on unusual skincare trends was more balanced than most of what I see online.", created_at: "2026-08-14T23:55:00Z" },
  ],
  "ep-2-skincare-fails": [
    { display_name: "HendrikV_Paarl", body: "Solid listen, would've liked a bit more nuance on common skincare mistakes specifically.", created_at: "2026-05-30T05:06:00Z" },
    { display_name: "ThembaM_Boksburg", body: "The bit about common skincare mistakes matches my own experience almost exactly. Glad someone's saying it out loud.", created_at: "2026-06-27T03:51:00Z" },
    { display_name: "SunithaR", body: "Listened to this on my commute and actually rewound a section, good breakdown of common skincare mistakes.", created_at: "2026-07-03T02:00:00Z" },
    { display_name: "DrNomvulaL", body: "Good episode. The framing on common skincare mistakes is closer to what I'd actually tell a patient than most podcasts manage.", created_at: "2026-08-09T02:51:00Z" },
    { display_name: "AndileN_EL", body: "Would love a full episode digging deeper into this, felt like there was more to unpack on common skincare mistakes.", created_at: "2026-08-22T14:41:00Z" },
  ],
  "ep-3-glass-skin": [
    { display_name: "SuzetteJ_Bloem", body: "Would love a full episode digging deeper into this, felt like there was more to unpack on the glass skin trend.", created_at: "2026-05-18T18:17:00Z" },
    { display_name: "Ridwaan_PE", body: "One of the better episodes so far. Straight to the point without dumbing things down.", created_at: "2026-08-10T05:09:00Z" },
    { display_name: "DrThulaniZ_JHB", body: "As someone working in skincare, I appreciated that this stayed evidence-led rather than chasing the trend angle on the glass skin trend.", created_at: "2026-08-14T20:52:00Z" },
    { display_name: "Corne_Sandton", body: "The bit about the glass skin trend matches my own experience almost exactly. Glad someone's saying it out loud.", created_at: "2026-08-25T15:17:00Z" },
  ],
  "ep-4-ingredient-drama": [
    { display_name: "SunithaS_Randburg", body: "Really enjoyed this episode — the section on ingredient myths was more balanced than most of what I see online.", created_at: "2026-06-02T15:21:00Z" },
    { display_name: "DrNirvana_Paarl", body: "Good episode. The framing on ingredient myths is closer to what I'd actually tell a patient than most podcasts manage.", created_at: "2026-07-03T15:24:00Z" },
    { display_name: "SunithaW", body: "Good episode overall, though I think the take on ingredient myths glossed over a few of the counterarguments.", created_at: "2026-07-21T18:28:00Z" },
    { display_name: "KagisoR", body: "Can you do a follow-up on sunscreen reformulation next? Would pair well with this one.", created_at: "2026-07-23T16:26:00Z" },
    { display_name: "Buhle_DBN", body: "The bit about ingredient myths matches my own experience almost exactly. Glad someone's saying it out loud.", created_at: "2026-08-16T02:03:00Z" },
  ],
};

export const comparisonComments: Record<string, ArticleComment[]> = {
  "best-skincare-products-under-r250-south-africa": [
    { display_name: "Naledi_Soweto", body: "This is exactly the kind of list I needed as a student — didn't realise a full routine could come in under R400.", created_at: "2026-08-30T07:12:00Z" },
    { display_name: "PieterV_Bloem", body: "Good reminder that the sunscreen is the one worth splurging the extra rand on out of this list.", created_at: "2026-08-30T14:48:00Z" },
    { display_name: "Zanele_ELondon", body: "Been using the Garnier cleanser and Portia M HyaluraGlow combo from this list for a month now — solid budget starter routine.", created_at: "2026-08-30T19:03:00Z" },
  ],
  "portia-m-hyaluraglow-vs-vitaglow": [
    { display_name: "Kabelo_PTA", body: "Didn't realise these two Portia M serums were aimed at completely different concerns — assumed they were interchangeable.", created_at: "2026-08-29T06:27:00Z" },
    { display_name: "Simone_CT", body: "Running HyaluraGlow AM and VitaGlow PM like this suggests, and my skin has felt noticeably less tight this winter.", created_at: "2026-08-29T15:41:00Z" },
    { display_name: "Andile_Pmb", body: "Useful to know VitaGlow isn't a real acne treatment on its own — was expecting more from the willow bark extract.", created_at: "2026-08-30T09:16:00Z" },
  ],
  "tocobo-vs-round-lab-sun-serum": [
    { display_name: "Chantelle_JHB", body: "The price gap surprised me — didn't expect Round Lab to cost that much more for similar SPF numbers.", created_at: "2026-08-29T08:52:00Z" },
    { display_name: "Sipho_Umhlanga", body: "Tocobo has been my go-to in Durban humidity, so good to see it holds up as the value pick here too.", created_at: "2026-08-29T20:14:00Z" },
    { display_name: "Retha_Stellenbosch", body: "Went with Round Lab for the finish alone — worth it for me, but this breakdown is fair about the premium not being about protection.", created_at: "2026-08-30T11:29:00Z" },
  ],
  "garnier-vs-tocobo-spf50-sunscreen": [
    { display_name: "Thabo_Centurion", body: "Switched to Garnier for the invisible finish under makeup and haven't looked back — matches what this article says.", created_at: "2026-08-28T07:38:00Z" },
    { display_name: "Amahle_Gqeberha", body: "Tocobo's the better fit for my dry skin in winter, exactly as described here.", created_at: "2026-08-28T18:02:00Z" },
    { display_name: "Werner_George", body: "Appreciate the reminder about reapplication — easy to forget that's what actually matters most.", created_at: "2026-08-29T09:47:00Z" },
  ],
  "garnier-vitamin-c-cleanser-vs-clicks-rooibos-cleanser": [
    { display_name: "Buhle_Rustenburg", body: "Been using the Clicks Rooibos cleanser for ages and never knew it had exfoliating beads worth being cautious with — useful heads up.", created_at: "2026-08-28T06:19:00Z" },
    { display_name: "Johan_Kimberley", body: "Good breakdown for anyone starting out — both are cheap enough to just try and see what your skin prefers.", created_at: "2026-08-28T17:33:00Z" },
    { display_name: "Precious_Polokwane", body: "Switched to Garnier after reading this since I'm already exfoliating with a separate product — made sense not to double up.", created_at: "2026-08-29T12:05:00Z" },
  ],
  "nimue-vs-optiphi-retinoid-serums": [
    { display_name: "Kagiso_Gqeberha", body: "How would either of these compare against an imported alternative in the same category?", created_at: "2026-05-07T05:16:00Z" },
    { display_name: "Rafeeq_DBN", body: "Went with Nimue in the end based on this — a few weeks in and no regrets so far.", created_at: "2026-06-14T08:16:00Z" },
    { display_name: "Tumelo_PTA", body: "The price gap between Nimue and Optiphi is significant, so it's useful to see it isn't just paying more for the same thing.", created_at: "2026-07-08T22:39:00Z" },
    { display_name: "LaylaB", body: "Used both Nimue and Optiphi at different points and this matches my own experience pretty closely.", created_at: "2026-08-22T02:07:00Z" },
  ],
  "skin-functional-vs-skinphd-vitamin-c": [
    { display_name: "BonganiZ", body: "Picked SkinPhD after reading this comparison. Exactly the breakdown I needed before spending that kind of money.", created_at: "2026-06-05T03:58:00Z" },
    { display_name: "Petro_Paarl", body: "Appreciate that this didn't just crown a winner — value really does depend on what you're optimising for between Skin Functional and SkinPhD.", created_at: "2026-06-24T09:45:00Z" },
    { display_name: "DrZolaP", body: "Good comparison. Clinically there's less daylight between Skin Functional and SkinPhD than the price difference suggests.", created_at: "2026-07-03T04:05:00Z" },
    { display_name: "WillemD_George", body: "Would love to see a similar breakdown between Skin Functional and a more budget-friendly option.", created_at: "2026-08-05T02:28:00Z" },
  ],
};
