export type FeedbackSurveySurface = "dashboard" | "briefings" | "reviews" | "compare" | "podcast" | "spotlight";

export interface FeedbackSurveyCopy {
  title: string;
  description: string;
  question: string;
  options: { value: string; label: string }[];
  followUpLabel: string;
}

export interface FeedbackSurvey extends FeedbackSurveyCopy {
  /** Stable per surface: "never the same survey twice" is keyed on it, hub or detail page alike. */
  id: string;
  surface: FeedbackSurveySurface;
  /** The surface's own route, e.g. "/briefings". Anything deeper is a detail page. */
  base: string;
  match: (pathname: string) => boolean;
  eyebrow: string;
  /**
   * Wording for the surface's hub page. A question like "How useful was this
   * briefing?" makes no sense on a list page, so the hub gets its own copy
   * when the base copy is about one specific piece of content.
   */
  hub?: FeedbackSurveyCopy;
}

const prefix = (base: string) => (pathname: string) => pathname === base || pathname.startsWith(base + "/");

export const FEEDBACK_SURVEY_CUTOFF_ISO = "2027-01-01T00:00:00+02:00";
export const FEEDBACK_SURVEY_CUTOFF_MS = new Date(FEEDBACK_SURVEY_CUTOFF_ISO).getTime();

export const FEEDBACK_SURVEYS: FeedbackSurvey[] = [
  {
    id: "dashboard-mobile-v1",
    surface: "dashboard",
    base: "/dashboard",
    match: prefix("/dashboard"),
    eyebrow: "Your dashboard",
    title: "What do you want from your dashboard?",
    description: "One tap helps us decide what to make easier to find.",
    question: "What do you most want to do here?",
    options: [
      { value: "track_routine", label: "Track my routine" },
      { value: "see_analysis", label: "See my skin analysis" },
      { value: "check_weather", label: "Check today's skin weather" },
      { value: "manage_membership", label: "Manage my membership" },
    ],
    followUpLabel: "What's missing or hard to find?",
  },
  {
    id: "briefings-mobile-v1",
    surface: "briefings",
    base: "/briefings",
    match: prefix("/briefings"),
    eyebrow: "The Daily Skinny",
    title: "One quick question about what you just read",
    description: "Your feedback helps us make the next briefing more useful, clearer and more relevant to South African skin.",
    question: "How useful was this briefing?",
    options: [
      { value: "very_useful", label: "Very useful" },
      { value: "useful", label: "Useful" },
      { value: "okay", label: "It was okay" },
      { value: "not_useful", label: "Not very useful" },
    ],
    followUpLabel: "What would make the briefings more useful?",
    hub: {
      title: "What should The Daily Skinny cover?",
      description: "Your answer shapes the briefings we write for South African skin.",
      question: "What do you come to the briefings for?",
      options: [
        { value: "ingredient_science", label: "Ingredient science" },
        { value: "sa_skin_climate", label: "South African skin and climate" },
        { value: "product_news", label: "Product news and launches" },
        { value: "routine_tips", label: "Routine tips" },
      ],
      followUpLabel: "Anything you wish we covered?",
    },
  },
  {
    id: "reviews-mobile-v1",
    surface: "reviews",
    base: "/reviews",
    match: prefix("/reviews"),
    eyebrow: "SkinLabs Reviews",
    title: "Help us make product reviews better",
    description: "A single answer is enough. You can add a note if there is something you think we should change.",
    question: "What helps you most when deciding on a skincare product?",
    options: [
      { value: "ingredient_breakdown", label: "Ingredient breakdowns" },
      { value: "sa_climate_fit", label: "South African climate fit" },
      { value: "value", label: "Value for money" },
      { value: "overall_score", label: "The overall score" },
    ],
    followUpLabel: "What else would you like to see in reviews?",
  },
  {
    id: "compare-mobile-v1",
    surface: "compare",
    base: "/compare",
    match: prefix("/compare"),
    eyebrow: "Shelf Showdown",
    title: "Did the comparison make things clearer?",
    description: "We are tuning the comparison experience around the things people actually need to decide.",
    question: "Did this comparison make the choice easier?",
    options: [
      { value: "much_easier", label: "Much easier" },
      { value: "a_little_easier", label: "A little easier" },
      { value: "no_difference", label: "No difference" },
      { value: "not_easier", label: "Not really" },
    ],
    followUpLabel: "What would make comparisons more useful?",
    hub: {
      title: "What should we compare next?",
      description: "Shelf Showdown follows what members actually want to choose between.",
      question: "Which comparisons would help you most?",
      options: [
        { value: "cleansers_toners", label: "Cleansers and toners" },
        { value: "serums_treatments", label: "Serums and treatments" },
        { value: "moisturisers", label: "Moisturisers" },
        { value: "sunscreens", label: "Sunscreens" },
      ],
      followUpLabel: "Any two products you'd like compared?",
    },
  },
  {
    id: "podcast-mobile-v1",
    surface: "podcast",
    base: "/podcast",
    match: prefix("/podcast"),
    eyebrow: "SkinLabs Podcast",
    title: "How was the listening experience?",
    description: "We are shaping the podcast around what members actually enjoy listening to.",
    question: "How did this episode land for you?",
    options: [
      { value: "loved_it", label: "Loved it" },
      { value: "good", label: "Good" },
      { value: "okay", label: "It was okay" },
      { value: "could_be_better", label: "Could be better" },
    ],
    followUpLabel: "What should we improve?",
    hub: {
      title: "What should we talk about next?",
      description: "We are shaping the podcast around what members want to hear.",
      question: "What would you most like to hear about?",
      options: [
        { value: "ingredient_science", label: "Ingredient science" },
        { value: "budget_routines", label: "Routines on a budget" },
        { value: "sa_brands", label: "South African brands" },
        { value: "skin_climate", label: "Skin and climate" },
      ],
      followUpLabel: "Any topic or guest suggestions?",
    },
  },
  {
    id: "spotlight-mobile-v1",
    surface: "spotlight",
    base: "/spotlight",
    match: prefix("/spotlight"),
    eyebrow: "Brand Spotlight",
    title: "Tell us what you want more of",
    description: "Your feedback helps us decide what belongs in the next Spotlight edition.",
    question: "What would you like more of from Spotlight?",
    options: [
      { value: "brand_profiles", label: "More brand profiles" },
      { value: "product_evidence", label: "More product evidence" },
      { value: "sa_brands", label: "More South African brands" },
      { value: "methodology", label: "More methodology and context" },
    ],
    followUpLabel: "Anything else we should explore?",
  },
];

const normalise = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);

/** The survey for this route, with hub wording applied on a surface's own hub page. */
export const getFeedbackSurvey = (pathname: string): FeedbackSurvey | null => {
  const survey = FEEDBACK_SURVEYS.find((candidate) => candidate.match(pathname));
  if (!survey) return null;
  return survey.hub && normalise(pathname) === survey.base ? { ...survey, ...survey.hub } : survey;
};

/** Longest comment the form accepts; the table's CHECK is the same number. */
export const FEEDBACK_COMMENT_MAX = 280;
