-- SkinLabs Community Forum — initial editorial content.  (3 of 3: seed data)
-- Idempotent: does nothing if the seed personas already exist.
--
-- What this is: a small starter set (14 discussions, ~40 comments, ~100 likes) so the forum doesn't open empty.
--  * "Michael C." (Admin) posts from the real admin account when one exists (looked up by role + name, never by a hard-coded
--    id); otherwise from an admin persona.
--  * "Nicole N." and "Cole O." (Moderators) and the handful of community voices are EDITORIAL PERSONAS (community_personas):
--    display-only authors with no login, no email and no notifications. No fake auth accounts are created and no credentials
--    are implied: nobody here is presented as a medical professional, and every post says to see a dermatologist for
--    anything persistent. Real members' likes/comments sit beside these like any other.
--  * Replace or remove at any time:  DELETE FROM community_posts WHERE persona_id IN (SELECT id FROM community_personas WHERE is_seed);
--    (comments/likes cascade), then DELETE FROM community_personas WHERE is_seed.
--
-- Seeded rows write created_at in the past; notifications are skipped because personas have no account.

DO $seed$
DECLARE
  v_admin uuid;
  v_post_id uuid;
  v_comment_id uuid;
  v_author_user uuid;
  v_author_persona uuid;
  v_post jsonb;
  v_comment jsonb;
  v_name text;
  v_base timestamptz := now();
  v_post_at timestamptz;
BEGIN
  IF EXISTS (SELECT 1 FROM public.community_personas WHERE is_seed) THEN RETURN; END IF;

  -- The real admin account, if it is usable as an author (has a chosen handle and an active account).
  SELECT ur.user_id INTO v_admin
    FROM public.user_roles ur
    JOIN public.profiles pr ON pr.user_id = ur.user_id
   WHERE ur.role = 'admin'::public.app_role
     AND pr.full_name ILIKE 'Michael%'
     AND nullif(btrim(pr.username), '') IS NOT NULL
     AND coalesce(pr.username_generated, false) = false
     AND coalesce(pr.account_status, 'active') = 'active'
   ORDER BY pr.created_at LIMIT 1;

  INSERT INTO public.community_personas (display_name, role) VALUES
    ('Nicole N.', 'moderator'), ('Cole O.', 'moderator'),
    ('Thandi M.', 'member'), ('Lerato P.', 'member'), ('Sipho D.', 'member'), ('Aisha K.', 'member'),
    ('Zanele B.', 'member'), ('Kagiso R.', 'member'), ('Naledi T.', 'member'), ('Pieter V.', 'member');
  IF v_admin IS NULL THEN
    INSERT INTO public.community_personas (display_name, role) VALUES ('Michael C.', 'admin');
  END IF;

  FOR v_post IN SELECT * FROM jsonb_array_elements($json$[
  {"by":"Michael C.","cat":null,"pinned":true,"age_h":480,
   "title":"Welcome to SkinLabs Community — start here",
   "body":"This is a space for honest, practical skincare conversation for people living with South African skin, sun, water and budgets.\n\nA few ground rules:\n• Share what worked (or didn't) for you, and say it's your experience, not a guarantee.\n• Nobody here can diagnose your skin. For anything persistent, painful, bleeding, changing shape or colour, please see a doctor or dermatologist.\n• Be kind. Critique products and claims, not people.\n• No selling, spam or medical advice presented as fact.\n\nThe full community guidelines are at /community-guidelines. Introduce your skin and your city below — Highveld, coast and Karoo all behave differently.",
   "likes":["Nicole N.","Cole O.","Thandi M.","Lerato P.","Sipho D.","Aisha K."],
   "comments":[
    {"by":"Nicole N.","age_h":470,"body":"Thanks Michael. Reminder for everyone: if you're not sure a post breaks the guidelines, use Report and a moderator will take a look.","likes":["Thandi M.","Zanele B."]},
    {"by":"Thandi M.","age_h":455,"body":"Johannesburg here, combination skin that goes tight in winter. Looking forward to this.","likes":["Aisha K."]},
    {"by":"Pieter V.","age_h":440,"body":"Cape Town, dry and sun-damaged cheeks from years of surfing. Glad there's a place that isn't just influencers."}]},

  {"by":"Michael C.","cat":"routines","age_h":300,
   "title":"Highveld dry season vs Durban humidity: how are you adjusting your routine?",
   "body":"I moved between Joburg and Durban this year and my skin barely recognised itself. Dry, tight and flaky on the Highveld; shiny and congested on the coast.\n\nWhat do you actually change when the weather changes? Cleanser, moisturiser texture, sunscreen? Or do you keep the same routine all year?\n\nI'd love real swaps rather than \"drink more water\".",
   "likes":["Nicole N.","Thandi M.","Lerato P.","Sipho D."],
   "comments":[
    {"by":"Lerato P.","age_h":290,"body":"Durban: I swap my cream for a gel moisturiser from about October, and I cleanse once at night instead of twice. Keeping sunscreen daily though.","likes":["Michael C.","Sipho D."]},
    {"by":"Thandi M.","age_h":280,"body":"Joburg winter: thicker moisturiser at night, and I stopped using my foaming cleanser. The tight feeling after washing was the giveaway.","likes":["Lerato P."]},
    {"by":"Cole O.","age_h":270,"body":"Good thread. One tip: change one thing at a time when the weather shifts, so you know which swap helped."}]},

  {"by":"Nicole N.","cat":"sun-care","age_h":260,
   "title":"Sunscreen and hyperpigmentation: how much, how often, which finish?",
   "body":"We hear \"wear SPF\" constantly, but for dark marks the details matter: enough product (about two finger-lengths for face and neck), reapplying when you're outdoors, and picking a finish you'll actually use daily.\n\nWhat's your routine for keeping dark marks from getting worse in strong South African sun? Do you reapply, and what's made it easier to stick with?\n\nThis is general information, not medical advice. Marks that are new, uneven or changing should be checked by a doctor.",
   "likes":["Michael C.","Cole O.","Thandi M.","Lerato P.","Aisha K.","Naledi T."],
   "comments":[
    {"by":"Aisha K.","age_h":250,"body":"I keep a small tube in my bag and a stick-format one for reapplying over the day. The reapplying part was the thing I never did before.","likes":["Nicole N.","Naledi T."]},
    {"by":"Naledi T.","age_h":240,"body":"Hat plus sunscreen made the biggest difference for my melasma-looking patches on my cheeks. My GP referred me to a dermatologist to be sure what they are.","likes":["Nicole N.","Aisha K.","Zanele B."]},
    {"by":"Sipho D.","age_h":225,"body":"Honest question: does SPF 50 really matter vs 30 if you apply enough? I mostly worry about applying too little.","likes":["Cole O."]},
    {"by":"Nicole N.","age_h":220,"body":"Good question Sipho. The bigger gap is usually how much people apply, not the number. Enough product and reapplying beat chasing the highest SPF.","likes":["Sipho D.","Thandi M."]}]},

  {"by":"Cole O.","cat":"acne","age_h":230,
   "title":"Post-acne marks vs active acne: do you treat them differently?",
   "body":"Something I see a lot: people use harsh acne products on the leftover marks and end up with more irritation and more marks.\n\nActive breakouts and the flat dark or red marks left behind are two different problems, and usually they need different patience. What helped you tell them apart, and how long did your marks take to fade?\n\nPersistent, painful or scarring acne is worth a dermatologist visit sooner rather than later.",
   "likes":["Nicole N.","Michael C.","Aisha K.","Lerato P."],
   "comments":[
    {"by":"Zanele B.","age_h":220,"body":"Mine took months, honestly. The thing that helped was stopping the scrubbing and being consistent with sunscreen, since sun makes the marks hang around.","likes":["Cole O.","Aisha K.","Kagiso R."]},
    {"by":"Kagiso R.","age_h":210,"body":"I went to a dermatologist after about a year of guessing. A plan I could stick to beat constantly switching products.","likes":["Cole O.","Zanele B."]},
    {"by":"Lerato P.","age_h":200,"body":"Tip that helped me: take a photo in the same light once a month. Day to day you can't see progress, month to month you can."}]},

  {"by":"Thandi M.","cat":"deeper-skin-tones","age_h":200,
   "title":"Deeper skin tones: sunscreens that don't leave a white cast — what's worked for you?",
   "body":"I've been burned (figuratively) by sunscreens that leave a grey-purple cast on my skin, and I know a lot of us skip SPF because of it.\n\nWhat textures or types have actually worked for you? Chemical filters, tinted formulas, gels, sticks? Please say what you tried and what happened rather than just a brand name.",
   "likes":["Nicole N.","Michael C.","Aisha K.","Naledi T.","Zanele B.","Kagiso R."],
   "comments":[
    {"by":"Naledi T.","age_h":190,"body":"Gel-type, fully invisible formulas worked best for me. Mineral ones always looked ashy unless they were tinted.","likes":["Thandi M.","Kagiso R."]},
    {"by":"Kagiso R.","age_h":185,"body":"Tinted ones, a little goes on like a light base. Make sure you test it on your jawline in daylight, shop lighting lies.","likes":["Thandi M.","Naledi T.","Aisha K."]},
    {"by":"Nicole N.","age_h":180,"body":"Adding: deeper skin does still need sun protection, especially for dark marks and melasma. Finding a finish you enjoy is what makes it a habit.","likes":["Thandi M.","Zanele B."]}]},

  {"by":"Nicole N.","cat":"seasonal","age_h":170,
   "title":"Winter dryness on the Highveld: layering that actually helps",
   "body":"Dry air, heaters and cold wind all strip moisture. Things that tend to help: gentler cleansing, a humectant (like glycerin or hyaluronic acid) on slightly damp skin, then a moisturiser to seal it in, and lip and hand care you actually keep within reach.\n\nWhat's your winter stack, and what did you stop using because it was too much?",
   "likes":["Michael C.","Cole O.","Thandi M.","Pieter V.","Lerato P."],
   "comments":[
    {"by":"Pieter V.","age_h":160,"body":"Switching to lukewarm showers (not hot) did more for me than any cream. Annoying in July, but it works.","likes":["Nicole N.","Thandi M.","Cole O."]},
    {"by":"Thandi M.","age_h":150,"body":"Applying moisturiser straight after washing while my face is damp. I used to wait until it was dry and wonder why it never felt like enough."}]},

  {"by":"Lerato P.","cat":"seasonal","age_h":140,
   "title":"Oily and shiny by 11am in a Durban summer — lighter routine ideas?",
   "body":"By mid-morning my T-zone is a mirror. I'm already using a gel moisturiser and sunscreen, but I feel like I'm missing something.\n\nI don't want to over-cleanse and make it worse. Any ideas that worked for you in humid heat?",
   "likes":["Nicole N.","Sipho D.","Aisha K."],
   "comments":[
    {"by":"Cole O.","age_h":130,"body":"Over-cleansing tends to backfire. Gentle cleanse twice a day max, lightweight moisturiser (oily skin still needs one), and a sunscreen with a matte or gel finish."},
    {"by":"Sipho D.","age_h":120,"body":"Blotting paper midday and a niacinamide serum was what helped me. Not magic, but it took the edge off.","likes":["Lerato P."]}]},

  {"by":"Cole O.","cat":"ingredients","age_h":110,
   "title":"Retinol, vitamin C and acids: how do you sequence them?",
   "body":"A very common question: can you use retinol, vitamin C, AHAs/BHAs and niacinamide together?\n\nThe safest general approach is to introduce one active at a time, use fewer actives rather than more, and keep sunscreen daily. Many people put vitamin C in the morning and a retinoid at night, and keep exfoliating acids to a couple of nights a week, but skin differs.\n\nHow do you arrange yours, and what made your skin say \"too much\"? (Retinoids aren't recommended in pregnancy; check with your doctor if that applies.)",
   "likes":["Nicole N.","Michael C.","Zanele B.","Thandi M.","Naledi T."],
   "comments":[
    {"by":"Zanele B.","age_h":100,"body":"Burning and stinging in a routine that used to be fine was my cue. I had layered too many actives at once.","likes":["Cole O.","Naledi T."]},
    {"by":"Naledi T.","age_h":90,"body":"AM vitamin C, PM retinol twice a week to start, a plain moisturiser the other nights. Slow worked better than fast.","likes":["Cole O.","Zanele B.","Thandi M."]},
    {"by":"Michael C.","age_h":85,"body":"For anyone wondering how ingredients interact, the Ingredients section on SkinLabs has a compatibility checker you can try. Handy before you buy.","likes":["Cole O."]}]},

  {"by":"Sipho D.","cat":"budget-sa","age_h":80,
   "title":"Best-value routine under R400 — what's your cheap-and-cheerful stack?",
   "body":"I'm a student and I'd rather spend on sunscreen than a fancy serum. What does a basic cleanser + moisturiser + sunscreen routine look like on a small budget for you, and what did you cut because it wasn't worth the money?\n\nPharmacy ranges from Clicks and Dis-Chem are fair game.",
   "likes":["Michael C.","Nicole N.","Lerato P.","Aisha K.","Kagiso R."],
   "comments":[
    {"by":"Kagiso R.","age_h":70,"body":"Gentle cleanser, simple moisturiser, sunscreen. Skipped toner and eye cream completely and saved a fortune.","likes":["Sipho D.","Lerato P."]},
    {"by":"Aisha K.","age_h":60,"body":"Prioritise sunscreen first, moisturiser second, cleanser third. A mid-priced sunscreen you wear daily beats an expensive one you ration.","likes":["Sipho D.","Kagiso R.","Nicole N."]},
    {"by":"Nicole N.","age_h":55,"body":"Great thread. The SkinLabs review pages show the price per product, if you want to compare value before you buy."}]},

  {"by":"Aisha K.","cat":"ask-the-community","age_h":50,
   "title":"Looking for a gentle cleanser (combination skin, Cape Town)",
   "body":"My skin gets tight after most cleansers but my nose and chin still get oily. I'd like something gentle that doesn't strip but still removes sunscreen.\n\nWhat's worked for you? Bonus if it's easy to find locally.",
   "likes":["Thandi M.","Zanele B."],
   "comments":[
    {"by":"Zanele B.","age_h":45,"body":"Cream or lotion-style cleansers worked for me. If your skin feels squeaky clean afterwards, it's probably too harsh.","likes":["Aisha K."]},
    {"by":"Pieter V.","age_h":40,"body":"Double cleansing at night with an oil-based cleanser first if you wear sunscreen daily, then a gentle one. In the morning just water or a gentle wash."}]},

  {"by":"Michael C.","cat":"sensitive-skin","age_h":36,
   "title":"Sensitive skin: how do you introduce one new product at a time?",
   "body":"When skin is reactive, the temptation is to start a whole new routine at once, and then you can't tell what caused what.\n\nWhat's your system? How long do you wait, where do you test, and how do you decide something isn't for you?",
   "likes":["Nicole N.","Cole O.","Zanele B.","Kagiso R."],
   "comments":[
    {"by":"Cole O.","age_h":30,"body":"Common approach: patch test a small area for a few days first, then add one product at a time and wait a couple of weeks before adding another. Stop if you get burning, swelling or a rash and ask a pharmacist or doctor.","likes":["Michael C.","Zanele B."]},
    {"by":"Zanele B.","age_h":26,"body":"I write it in my phone: product, date started, any reaction. It's boring, but it's saved me from repeat mistakes.","likes":["Michael C.","Cole O.","Kagiso R."]}]},

  {"by":"Zanele B.","cat":"sensitive-skin","age_h":22,
   "title":"Fragrance in skincare: has it caused irritation for you?",
   "body":"I noticed my skin gets itchy and red with some lovely-smelling moisturisers. Fragrance-free products seem to be calmer for me, but I'm not sure whether it's the fragrance, an essential oil, or something else.\n\nHas anyone else figured out their triggers? How?",
   "likes":["Cole O.","Aisha K.","Kagiso R."],
   "comments":[
    {"by":"Cole O.","age_h":18,"body":"Fragrance and essential oils are common irritants for some people, though not everyone. Because ingredient lists can be vague, an allergy test with a dermatologist can pinpoint triggers rather than guessing.","likes":["Zanele B."]},
    {"by":"Kagiso R.","age_h":14,"body":"Check the label for 'parfum' or 'fragrance', and 'unscented' doesn't always mean fragrance-free. That tripped me up."}]},

  {"by":"Nicole N.","cat":"myths","age_h":12,
   "title":"How do you sanity-check a skincare claim you saw on TikTok?",
   "body":"New week, new miracle. Before you buy or try something, a few questions help: Is anyone selling it? Is there a before-and-after with no mention of lighting or filters? Does it promise to \"cure\" or \"detox\" something? Does it say what it contains, and in what role?\n\nWhat's your own filter? And what's the most overhyped claim you've fallen for?",
   "likes":["Michael C.","Cole O.","Thandi M.","Lerato P.","Pieter V."],
   "comments":[
    {"by":"Pieter V.","age_h":9,"body":"If it claims to fix everything it probably fixes nothing. I also check whether the person has any reason to say it besides an affiliate link.","likes":["Nicole N.","Thandi M."]},
    {"by":"Lerato P.","age_h":6,"body":"Mine was a 'skin detox' routine. Mostly just irritation. Lesson learned: skin isn't something you detox.","likes":["Nicole N.","Pieter V."]}]},

  {"by":"Cole O.","cat":"ask-the-community","age_h":4,
   "title":"Seeing a dermatologist soon? Questions worth taking with you",
   "body":"Appointments are short, so preparing helps. Ideas: a list of what you're currently using (photos of the labels), when the problem started, what makes it better or worse, photos from a good-light day if it flares and fades, and your questions in order of importance.\n\nWhat do you wish you'd asked or brought to your first appointment? Remember that this community isn't a substitute for professional care.",
   "likes":["Nicole N.","Michael C.","Kagiso R.","Naledi T."],
   "comments":[
    {"by":"Naledi T.","age_h":3,"body":"Bring the actual products or photos of the labels. And ask what a realistic timeline looks like so you don't panic at week two.","likes":["Cole O.","Kagiso R."]},
    {"by":"Kagiso R.","age_h":2,"body":"I wish I'd asked about cost and follow-ups up front. Knowing the plan and the price helped me stick with it."}]}
  ]$json$::jsonb) LOOP
    v_name := v_post->>'by';
    v_author_user := NULL; v_author_persona := NULL;
    IF v_name = 'Michael C.' AND v_admin IS NOT NULL THEN v_author_user := v_admin;
    ELSE SELECT id INTO v_author_persona FROM public.community_personas WHERE display_name = v_name; END IF;

    v_post_at := v_base - make_interval(hours => (v_post->>'age_h')::int);
    INSERT INTO public.community_posts (author_id, persona_id, category, title, body, pinned, created_at, updated_at, last_activity_at)
    VALUES (v_author_user, v_author_persona, v_post->>'cat', v_post->>'title', v_post->>'body',
            coalesce((v_post->>'pinned')::boolean, false), v_post_at, v_post_at, v_post_at)
    RETURNING id INTO v_post_id;

    INSERT INTO public.community_post_likes (post_id, persona_id, created_at)
    SELECT v_post_id, pe.id, v_post_at + interval '30 minutes'
      FROM jsonb_array_elements_text(coalesce(v_post->'likes', '[]'::jsonb)) AS l(name)
      JOIN public.community_personas pe ON pe.display_name = l.name
     WHERE pe.display_name <> v_name
    ON CONFLICT DO NOTHING;

    FOR v_comment IN SELECT * FROM jsonb_array_elements(coalesce(v_post->'comments', '[]'::jsonb)) LOOP
      v_name := v_comment->>'by';
      v_author_user := NULL; v_author_persona := NULL;
      IF v_name = 'Michael C.' AND v_admin IS NOT NULL THEN v_author_user := v_admin;
      ELSE SELECT id INTO v_author_persona FROM public.community_personas WHERE display_name = v_name; END IF;

      INSERT INTO public.community_comments (post_id, author_id, persona_id, body, created_at, updated_at)
      VALUES (v_post_id, v_author_user, v_author_persona, v_comment->>'body',
              v_base - make_interval(hours => (v_comment->>'age_h')::int),
              v_base - make_interval(hours => (v_comment->>'age_h')::int))
      RETURNING id INTO v_comment_id;

      INSERT INTO public.community_comment_likes (comment_id, persona_id, created_at)
      SELECT v_comment_id, pe.id, v_base - make_interval(hours => (v_comment->>'age_h')::int) + interval '20 minutes'
        FROM jsonb_array_elements_text(coalesce(v_comment->'likes', '[]'::jsonb)) AS l(name)
        JOIN public.community_personas pe ON pe.display_name = l.name
       WHERE pe.display_name <> v_name
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- The comment counter trigger bumped last_activity_at to "now"; restore it to the newest real activity.
  UPDATE public.community_posts p
     SET last_activity_at = greatest(p.created_at, coalesce((SELECT max(c.created_at) FROM public.community_comments c WHERE c.post_id = p.id), p.created_at))
   WHERE p.persona_id IN (SELECT id FROM public.community_personas WHERE is_seed)
      OR p.author_id = v_admin;
END
$seed$;
