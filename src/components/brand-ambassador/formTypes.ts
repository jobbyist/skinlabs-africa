export interface AmbassadorFormData {
  // Step 1 — About You
  fullName: string;
  email: string;
  phone: string;
  country: string;
  cityProvince: string;

  // Step 2 — TikTok
  tiktokUsername: string;
  tiktokProfileUrl: string;
  tiktokFollowerRange: string;
  tiktokNiche: string;
  tiktokAvgViews: string;
  tiktokEngagement: string;
  tiktokOtherLinks: string;

  // Step 3 — Instagram
  igUsername: string;
  igProfileUrl: string;
  igFollowerRange: string;
  igAvgViews: string;
  igEngagement: string;
  igCategory: string;

  // Step 4 — Audience Analytics Verification
  tiktokAnalyticsUrl: string;
  igAnalyticsUrl: string;
  analyticsConfirmed: boolean;

  // Step 5 — Content
  audienceDescription: string;
  whySkinlabsFit: string;
  howIntroduce: string;
  tiktokExamples: string;
  igExamples: string;

  // Step 6 — Partnership
  interests: string[];
  comfortableContent: "yes" | "no" | "";
  comfortableReferral: "yes" | "no" | "";

  // Step 7 — Availability and Performance
  availableFromOct1: "yes" | "no" | "";
  contentFrequency: string;
  comfortableTargets: "yes" | "no" | "";

  // Step 8 — Agreement
  agreeAccurateInfo: boolean;
  agreeNoGuarantee: boolean;
  agreeAnalyticsAccurate: boolean;
  agreeProgrammeLength: boolean;
  agreeReviewTerms: boolean;
}

/** Non-serializable file state, kept separate from the persisted draft. */
export interface AmbassadorFormFiles {
  tiktokAnalyticsFile: File | null;
  igAnalyticsFile: File | null;
}

export const initialAmbassadorForm: AmbassadorFormData = {
  fullName: "",
  email: "",
  phone: "",
  country: "South Africa",
  cityProvince: "",

  tiktokUsername: "",
  tiktokProfileUrl: "",
  tiktokFollowerRange: "",
  tiktokNiche: "",
  tiktokAvgViews: "",
  tiktokEngagement: "",
  tiktokOtherLinks: "",

  igUsername: "",
  igProfileUrl: "",
  igFollowerRange: "",
  igAvgViews: "",
  igEngagement: "",
  igCategory: "",

  tiktokAnalyticsUrl: "",
  igAnalyticsUrl: "",
  analyticsConfirmed: false,

  audienceDescription: "",
  whySkinlabsFit: "",
  howIntroduce: "",
  tiktokExamples: "",
  igExamples: "",

  interests: [],
  comfortableContent: "",
  comfortableReferral: "",

  availableFromOct1: "",
  contentFrequency: "",
  comfortableTargets: "",

  agreeAccurateInfo: false,
  agreeNoGuarantee: false,
  agreeAnalyticsAccurate: false,
  agreeProgrammeLength: false,
  agreeReviewTerms: false,
};

export const initialAmbassadorFiles: AmbassadorFormFiles = {
  tiktokAnalyticsFile: null,
  igAnalyticsFile: null,
};

export const TOTAL_STEPS = 8;

export const STEP_META: { title: string; description: string }[] = [
  { title: "About You", description: "Basic contact details so we can reach you about your application." },
  { title: "TikTok", description: "Your TikTok profile and audience, assessed on its own merits." },
  { title: "Instagram", description: "Your Instagram profile and audience, assessed separately from TikTok." },
  { title: "Audience Analytics Verification", description: "Evidence for both platforms — no passwords, ever." },
  { title: "Content", description: "How you create, and how SkinLabs® would fit your audience." },
  { title: "Partnership", description: "What you're looking for, and how you'd work with us." },
  { title: "Availability and Performance", description: "Your availability for the founding 3-month programme." },
  { title: "Agreement and Submit", description: "Confirm the details below, then submit your application." },
];

export type FormErrors = Partial<Record<keyof AmbassadorFormData, string>> & {
  tiktokAnalytics?: string;
  igAnalytics?: string;
};

const isBlank = (v: string) => v.trim().length === 0;

export function validateStep(
  step: number,
  form: AmbassadorFormData,
  files: AmbassadorFormFiles,
): FormErrors {
  const errors: FormErrors = {};

  if (step === 1) {
    if (isBlank(form.fullName)) errors.fullName = "Please enter your full name.";
    if (isBlank(form.email)) errors.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Please enter a valid email address.";
    if (isBlank(form.phone)) errors.phone = "Please enter a phone number.";
    if (isBlank(form.country)) errors.country = "Please enter your country.";
    if (isBlank(form.cityProvince)) errors.cityProvince = "Please enter your city or province.";
  }

  if (step === 2) {
    if (isBlank(form.tiktokUsername)) errors.tiktokUsername = "Please enter your TikTok username.";
    if (isBlank(form.tiktokProfileUrl)) errors.tiktokProfileUrl = "Please enter your TikTok profile URL.";
    if (isBlank(form.tiktokFollowerRange)) errors.tiktokFollowerRange = "Please select your TikTok follower range.";
    if (isBlank(form.tiktokNiche)) errors.tiktokNiche = "Please tell us your TikTok niche or category.";
    if (isBlank(form.tiktokAvgViews)) errors.tiktokAvgViews = "Please enter your average views per TikTok.";
    if (isBlank(form.tiktokEngagement)) errors.tiktokEngagement = "Please select an engagement level.";
  }

  if (step === 3) {
    if (isBlank(form.igUsername)) errors.igUsername = "Please enter your Instagram username.";
    if (isBlank(form.igProfileUrl)) errors.igProfileUrl = "Please enter your Instagram profile URL.";
    if (isBlank(form.igFollowerRange)) errors.igFollowerRange = "Please select your Instagram follower range.";
    if (isBlank(form.igAvgViews)) errors.igAvgViews = "Please enter your average views per Reel.";
    if (isBlank(form.igEngagement)) errors.igEngagement = "Please select an engagement level.";
  }

  if (step === 4) {
    const hasTiktokEvidence = Boolean(files.tiktokAnalyticsFile) || !isBlank(form.tiktokAnalyticsUrl);
    const hasIgEvidence = Boolean(files.igAnalyticsFile) || !isBlank(form.igAnalyticsUrl);
    if (!hasTiktokEvidence) errors.tiktokAnalytics = "Upload a TikTok analytics screenshot or provide a verification link.";
    if (!hasIgEvidence) errors.igAnalytics = "Upload an Instagram analytics screenshot or provide a verification link.";
    if (!form.analyticsConfirmed) errors.analyticsConfirmed = "Please confirm your analytics evidence is accurate and current.";
  }

  if (step === 5) {
    if (isBlank(form.audienceDescription)) errors.audienceDescription = "Please describe your content and audience.";
    if (isBlank(form.whySkinlabsFit)) errors.whySkinlabsFit = "Please tell us why SkinLabs® fits your audience.";
    if (isBlank(form.howIntroduce)) errors.howIntroduce = "Please tell us how you'd introduce SkinLabs®.";
    if (isBlank(form.tiktokExamples)) errors.tiktokExamples = "Please share 2–3 TikTok examples.";
    if (isBlank(form.igExamples)) errors.igExamples = "Please share 2–3 Instagram examples.";
  }

  if (step === 6) {
    if (form.interests.length === 0) errors.interests = "Please select at least one interest.";
    if (!form.comfortableContent) errors.comfortableContent = "Please let us know.";
    if (!form.comfortableReferral) errors.comfortableReferral = "Please let us know.";
  }

  if (step === 7) {
    if (!form.availableFromOct1) errors.availableFromOct1 = "Please let us know your availability.";
    if (isBlank(form.contentFrequency)) errors.contentFrequency = "Please select a content frequency.";
    if (!form.comfortableTargets) errors.comfortableTargets = "Please let us know.";
  }

  if (step === 8) {
    if (!form.agreeAccurateInfo) errors.agreeAccurateInfo = "Required.";
    if (!form.agreeNoGuarantee) errors.agreeNoGuarantee = "Required.";
    if (!form.agreeAnalyticsAccurate) errors.agreeAnalyticsAccurate = "Required.";
    if (!form.agreeProgrammeLength) errors.agreeProgrammeLength = "Required.";
    if (!form.agreeReviewTerms) errors.agreeReviewTerms = "Required.";
  }

  return errors;
}

/** Whether the form has enough real content that closing without submitting should be confirmed. */
export function isFormDirty(form: AmbassadorFormData): boolean {
  return (
    !isBlank(form.fullName) ||
    !isBlank(form.email) ||
    !isBlank(form.tiktokUsername) ||
    !isBlank(form.igUsername) ||
    !isBlank(form.audienceDescription) ||
    form.interests.length > 0
  );
}

export const AMBASSADOR_DRAFT_STORAGE_KEY = "skinlabs_brand_ambassador_draft_v1";
