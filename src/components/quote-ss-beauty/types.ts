import type { FormulationApproach, ProductKey } from "@/lib/quoteSsBeautyPricing";

export interface QuoteFormState {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;

  products: ProductKey[];
  quantities: Partial<Record<ProductKey, number>>;
  formulationApproaches: Partial<Record<ProductKey, FormulationApproach>>;

  hairConcerns: string[];
  formulationNotes: string;

  hasBranding: "yes" | "partial" | "no" | "";
  needsLogo: boolean;
  needsLabelDesign: boolean;
  needsComplianceHelp: boolean;

  packagingRoute: "turnkey" | "client_supplied" | "";
  whiteLabelInterest: "rebrand_stock" | "full_custom_only" | "not_sure" | "";

  timeline: "asap" | "1_2_months" | "3_plus_months" | "";
  budgetRange: string;

  additionalNotes: string;
  consent: boolean;

  /** Honeypot — real visitors never fill this in. */
  website: string;
}

export const INITIAL_QUOTE_FORM_STATE: QuoteFormState = {
  fullName: "Siphokazi",
  businessName: "",
  email: "siphokaziss@icloud.com",
  phone: "",

  products: [],
  quantities: {},
  formulationApproaches: {},

  hairConcerns: [],
  formulationNotes: "",

  hasBranding: "",
  needsLogo: false,
  needsLabelDesign: false,
  needsComplianceHelp: false,

  packagingRoute: "",
  whiteLabelInterest: "",

  timeline: "",
  budgetRange: "",

  additionalNotes: "",
  consent: false,

  website: "",
};

export const HAIR_CONCERN_OPTIONS = [
  "Growth & thickness",
  "Breakage & damage repair",
  "Moisture & hydration",
  "Scalp health",
  "Curl definition & frizz control",
];

export const BUDGET_RANGE_OPTIONS = [
  "Under R15,000",
  "R15,000 – R40,000",
  "R40,000 – R100,000",
  "R100,000+",
  "Prefer to discuss on a call",
];
