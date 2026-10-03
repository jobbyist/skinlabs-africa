export type FeedbackSurveySurface = "briefings" | "reviews" | "compare" | "podcast" | "spotlight";

export interface FeedbackSurvey {
  id: string;
  surface: FeedbackSurveySurface;
  match: (pathname: string) => boolean;
  eyebrow: string;
  title: string;
  description: string;
  question: string;
  options: { value: string; label: string }[];
  followUpLabel: string;
}

const prefix = (base: string) => (pathname: string) => pathname === base || pathname.startsWith(base + "/");

export const FEEDBACK_SURVEY_CUTOFF_ISO = "2027-01-01T00:00:00+02:00";
export const FEEDBACK_SURVEY_CUTOFF_MS = new Date(FEEDBACK_SURVEY_CUTOFF_ISO).getTime();

export const FEEDBACK_SURVEYS: FeedbackSurvey[] = [
  {
    id: "briefings-mobile-v1",
    surface: "briefings",
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
  },
  {
    id: "reviews-mobile-v1",
    surface: "reviews",
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
  },
  {
    id: "podcast-mobile-v1",
    surface: "podcast",
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
  },
  {
    id: "spotlight-mobile-v1",
    surface: "spotlight",
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

export const getFeedbackSurvey = (pathname: string): FeedbackSurvey | null =>
  FEEDBACK_SURVEYS.find((survey) => survey.match(pathname)) ?? null;
