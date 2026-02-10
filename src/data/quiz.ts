export type QuizOption = { label: string; value: number };
export type QuizQuestion = {
  id: string;
  title: string;
  options: QuizOption[];
};

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    title: "By midday, how does your face typically feel and look?",
    options: [
      { label: "Shiny/oily in most areas", value: 0 },
      { label: "Oily mainly in T-zone (forehead/nose/chin)", value: 1 },
      { label: "Comfortable/mostly balanced", value: 2 },
      { label: "Tight, flaky, or rough", value: 3 },
    ],
  },
  {
    id: "q2",
    title: "How visible are your pores on cheeks and nose?",
    options: [
      { label: "Very visible and enlarged", value: 0 },
      { label: "Visible mainly on nose/T-zone", value: 1 },
      { label: "Small to moderate", value: 2 },
      { label: "Hardly visible", value: 3 },
    ],
  },
  {
    id: "q3",
    title: "How often do you get breakouts (pimples, clogged pores, blackheads)?",
    options: [
      { label: "Often (weekly or more)", value: 0 },
      { label: "Sometimes (monthly)", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Almost never", value: 3 },
    ],
  },
  {
    id: "q4",
    title: "Do you experience dryness or flaking?",
    options: [
      { label: "Frequently, multiple areas", value: 0 },
      { label: "Occasionally, seasonal or after cleansing", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Never", value: 3 },
    ],
  },
  {
    id: "q5",
    title: "After cleansing (no products applied), what happens within 30 minutes?",
    options: [
      { label: "Feels tight/stingy", value: 0 },
      { label: "Feels normal", value: 1 },
      { label: "Gets shiny quickly", value: 2 },
      { label: "Gets oily and feels greasy", value: 3 },
    ],
  },
  {
    id: "q6",
    title: "How easily does your skin get irritated (burning, stinging, redness) from products or weather?",
    options: [
      { label: "Very easily", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Almost never", value: 3 },
    ],
  },
  {
    id: "q7",
    title: "Do you have visible redness or flushing (cheeks/nose) even without products?",
    options: [
      { label: "Often/constant redness", value: 0 },
      { label: "Occasional flushing", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Never", value: 3 },
    ],
  },
  {
    id: "q8",
    title: "How would you describe your skin tone uniformity (dark spots, post-acne marks, unevenness)?",
    options: [
      { label: "Significant unevenness/dark marks", value: 0 },
      { label: "Moderate unevenness", value: 1 },
      { label: "Mild unevenness", value: 2 },
      { label: "Very even", value: 3 },
    ],
  },
  {
    id: "q9",
    title: "What's your main priority right now?",
    options: [
      { label: "Acne/congestion control", value: 0 },
      { label: "Fade dark marks/brighten", value: 1 },
      { label: "Anti-aging (fine lines/firmness)", value: 2 },
      { label: "Soothe sensitivity/repair barrier", value: 3 },
    ],
  },
  {
    id: "q10",
    title: "How does your skin react to the sun?",
    options: [
      { label: "Burns easily", value: 0 },
      { label: "Burns sometimes, tans slowly", value: 1 },
      { label: "Usually tans, rarely burns", value: 2 },
      { label: "Almost never burns, tans easily", value: 3 },
    ],
  },
  {
    id: "q11",
    title: "Which best matches your current environment most days?",
    options: [
      { label: "Hot/humid", value: 0 },
      { label: "Hot/dry", value: 1 },
      { label: "Mild/temperate", value: 2 },
      { label: "Cold/dry", value: 3 },
    ],
  },
  {
    id: "q12",
    title: "Do you wear makeup or heavy SPF frequently?",
    options: [
      { label: "Most days", value: 0 },
      { label: "A few times per week", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "Never", value: 3 },
    ],
  },
  {
    id: "q13",
    title: "How consistent are you with skincare?",
    options: [
      { label: "I want the simplest possible routine", value: 0 },
      { label: "I can do a basic routine daily", value: 1 },
      { label: "I'm consistent and open to actives", value: 2 },
      { label: "I'm very consistent and like multi-step routines", value: 3 },
    ],
  },
  {
    id: "q14",
    title: "How many products do you currently use (excluding makeup)?",
    options: [
      { label: "0–1", value: 0 },
      { label: "2–3", value: 1 },
      { label: "4–5", value: 2 },
      { label: "6+", value: 3 },
    ],
  },
  {
    id: "q15",
    title: "Have you used strong actives before (retinoids, benzoyl peroxide, AHAs/BHAs)?",
    options: [
      { label: "Yes, and my skin tolerates them well", value: 0 },
      { label: "Yes, but I get irritation easily", value: 1 },
      { label: "No, I'm new to actives", value: 2 },
      { label: "I'm unsure", value: 3 },
    ],
  },
  {
    id: "q16",
    title: "If you get acne, where is it most common?",
    options: [
      { label: "Forehead and nose", value: 0 },
      { label: "Cheeks and jawline", value: 1 },
      { label: "Chin/jawline mostly", value: 2 },
      { label: "I don't really get acne", value: 3 },
    ],
  },
  {
    id: "q17",
    title: "Do you experience tightness but still get oily/shiny?",
    options: [
      { label: "Yes, often", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Rarely", value: 2 },
      { label: "No", value: 3 },
    ],
  },
  {
    id: "q18",
    title: "Any known allergies or triggers?",
    options: [
      { label: "Fragrance/essential oils", value: 0 },
      { label: "Acne ingredients (benzoyl peroxide, salicylic acid)", value: 1 },
      { label: "Preservatives/adhesives (e.g., formaldehyde releasers)", value: 2 },
      { label: "No known triggers", value: 3 },
    ],
  },
  {
    id: "q19",
    title: "How is your skin barrier right now?",
    options: [
      { label: "Feels compromised (dry + sensitive or inflamed)", value: 0 },
      { label: "Somewhat stressed", value: 1 },
      { label: "Mostly fine", value: 2 },
      { label: "Very resilient", value: 3 },
    ],
  },
  {
    id: "q20",
    title: "What is your biggest constraint?",
    options: [
      { label: "Budget/affordability", value: 0 },
      { label: "Time/effort", value: 1 },
      { label: "Skin sensitivity risk", value: 2 },
      { label: "Not sure what to buy/how to layer", value: 3 },
    ],
  },
];
