/**
 * SkinLabs Dermatologist Directory (/consult).
 *
 * Directory of dermatologists and practices in South Africa. For verified listings,
 * practitioners have claimed their profiles and provided contact details. Unclaimed
 * listings route through SkinLabs' concierge service. Names, cities and provinces
 * are placeholder data for demonstration purposes only. In production, this data
 * should be stored in a secure database with proper access controls, not in source code.
 * nothing is inferred or invented for a named, real practitioner.
 *
 * Where a practitioner's direct contact details weren't publicly surfaced, the profile
 * routes through SkinLabs' own concierge contact channel (the site's real support
 * inbox/WhatsApp line — see Footer.tsx / Contact.tsx) so every listing is still
 * reachable, and the card is labelled "Unclaimed listing" rather than "Verified" —
 * consistent with the outreach campaign's free "claim your listing" offer.
 */

export type PracticeType = "practitioner" | "practice";

export interface Dermatologist {
  id: string;
  name: string;
  practiceType: PracticeType;
  /** Free-text descriptor shown under the name — no clinical specialty is asserted unless publicly sourced. */
  role: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  /** True only when this practitioner's own phone/email was publicly surfaced in the source document. */
  verified: boolean;
}

/** SkinLabs' real concierge contact — used for unclaimed listings until a practitioner claims their profile. */
export const CONCIERGE_PHONE = "+27 68 020 0749";
export const CONCIERGE_EMAIL = "support@skinlabs.co.za";

export const dermatologists: Dermatologist[] = [
  {
    id: "dr-fortune-hute",
    name: "<Practitioner Name 1>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Johannesburg / Benoni",
    province: "Gauteng",
    phone: "<phone_number>",
    email: "<email_address>",
    verified: true,
  },
  {
    id: "dr-claudia-moloabi",
    name: "<Practitioner Name 2>",
    practiceType: "practitioner",
    role: "Dermatologist, Omnia Dermatology",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: "<email_address>",
    verified: true,
  },
  {
    id: "dr-rose-mfikwe",
    name: "<Practitioner Name 3>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: "<email_address>",
    verified: true,
  },
  {
    id: "dr-nicola-salmon",
    name: "<Practitioner Name 4>",
    practiceType: "practitioner",
    role: "Dermatologist, Durban North Dermatology",
    city: "Durban North",
    province: "KwaZulu-Natal",
    phone: "<phone_number>",
    email: "<email_address>",
    verified: true,
  },
  {
    id: "dr-jabu-nkehli",
    name: "<Practitioner Name 5>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Bedford Gardens",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-rakesh-newaj",
    name: "<Practitioner Name 6>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Johannesburg / Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-nomzamo-mkhize",
    name: "<Practitioner Name 7>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-rorisang-mathibe",
    name: "<Practitioner Name 8>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-fm-maleka",
    name: "<Practitioner Name 9>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-leslie-nteta",
    name: "<Practitioner Name 10>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-cordelia-kgokolo",
    name: "<Practitioner Name 11>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-hannelie-van-der-merwe",
    name: "<Practitioner Name 12>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-pieter-du-plessis",
    name: "<Practitioner Name 13>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-marianne-duvenage",
    name: "<Practitioner Name 14>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-n-ramlachan",
    name: "<Practitioner Name 15>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-aimee-gavin",
    name: "<Practitioner Name 16>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-tarryn-jacobs",
    name: "<Practitioner Name 17>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-r-singh",
    name: "<Practitioner Name 18>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Berea / Musgrave",
    province: "KwaZulu-Natal",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-precious-sibisi",
    name: "<Practitioner Name 19>",
    practiceType: "practitioner",
    role: "Dermatologist, Sibisi Skin Essentials",
    city: "Umhlanga Ridge",
    province: "KwaZulu-Natal",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "prof-rannakoe-lehloenya",
    name: "<Practitioner Name 20>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Cape Town",
    province: "Western Cape",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-izolda-heydenrych",
    name: "<Practitioner Name 21>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Century City",
    province: "Western Cape",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-avumile-mankahla",
    name: "<Practitioner Name 22>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Mthatha",
    province: "Eastern Cape",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-erich-bam",
    name: "<Practitioner Name 23>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Bloemfontein",
    province: "Free State",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-ramolapo-molapo",
    name: "<Practitioner Name 24>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Polokwane",
    province: "Limpopo",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-johannes-lee",
    name: "<Practitioner Name 25>",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Rustenburg",
    province: "North West",
    phone: "<phone_number>",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
];
