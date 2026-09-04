/**
 * SkinLabs Dermatologist Directory (/consult).
 *
 * Sourced from the SkinLabs "South Africa Dermatology Partner Outreach" research
 * document (Medpages/IQVIA public directory snapshot, 28 August 2026). Names, cities
 * and provinces are reproduced as publicly surfaced. Per that document's own
 * public-data rule, a phone number or email is only marked `verified: true` and shown
 * as the practitioner's own when it was actually surfaced in the retrieved excerpt —
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
    name: "Dr Fortune Hute",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Johannesburg / Benoni",
    province: "Gauteng",
    phone: "+27 11 427 2610",
    email: "dermatology27@gmail.com",
    verified: true,
  },
  {
    id: "dr-claudia-moloabi",
    name: "Dr Claudia Boitshoko Moloabi",
    practiceType: "practitioner",
    role: "Dermatologist, Omnia Dermatology",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 343 5592",
    email: "info@omniadermatology.co.za",
    verified: true,
  },
  {
    id: "dr-rose-mfikwe",
    name: "Dr Rose Mfikwe",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 845 1321",
    email: "drbrmfikwe@gmail.com",
    verified: true,
  },
  {
    id: "dr-nicola-salmon",
    name: "Dr Nicola Elma Salmon",
    practiceType: "practitioner",
    role: "Dermatologist, Durban North Dermatology",
    city: "Durban North",
    province: "KwaZulu-Natal",
    phone: "+27 31 563 2445",
    email: "info@nicolasalmon.com",
    verified: true,
  },
  {
    id: "dr-jabu-nkehli",
    name: "Dr Lindinkululeko Jabulile (Jabu) Nkehli",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Bedford Gardens",
    province: "Gauteng",
    phone: "+27 69 322 3134",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-rakesh-newaj",
    name: "Dr Rakesh Newaj",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Johannesburg / Pretoria",
    province: "Gauteng",
    phone: "+27 12 751 4001",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-nomzamo-mkhize",
    name: "Dr Nomzamo Mkhize",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 817 2000",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-rorisang-mathibe",
    name: "Dr Rorisang Moripi Mathibe",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 565 6283",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-fm-maleka",
    name: "Dr F M Maleka",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 317 6841",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-leslie-nteta",
    name: "Dr Leslie Motswaledi Nteta",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 320 7901",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-cordelia-kgokolo",
    name: "Dr Cordelia Mokganyetsi Kgokolo",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 320 3306",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-hannelie-van-der-merwe",
    name: "Dr Johanna Cecilia (Hannelie) van der Merwe",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 492 7871",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-pieter-du-plessis",
    name: "Dr Pieter Jacobus Du Plessis",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 346 4202",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-marianne-duvenage",
    name: "Dr Marianne Duvenage",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 460 4646",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-n-ramlachan",
    name: "Dr N Ramlachan",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 644 5250",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-aimee-gavin",
    name: "Dr Aimee Gavin",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 021 0107",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-tarryn-jacobs",
    name: "Dr Tarryn Jacobs",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Pretoria",
    province: "Gauteng",
    phone: "+27 12 880 2696",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-r-singh",
    name: "Dr R Singh",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Berea / Musgrave",
    province: "KwaZulu-Natal",
    phone: "+27 31 208 0695",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-precious-sibisi",
    name: "Dr Precious Cebisile Sibisi",
    practiceType: "practitioner",
    role: "Dermatologist, Sibisi Skin Essentials",
    city: "Umhlanga Ridge",
    province: "KwaZulu-Natal",
    phone: "+27 31 566 4748",
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "prof-rannakoe-lehloenya",
    name: "Prof Rannakoe Lehloenya",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Cape Town",
    province: "Western Cape",
    phone: CONCIERGE_PHONE,
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-izolda-heydenrych",
    name: "Dr Izolda Rosalind Heydenrych (Stegmann)",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Century City",
    province: "Western Cape",
    phone: CONCIERGE_PHONE,
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-avumile-mankahla",
    name: "Dr Avumile Mankahla",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Mthatha",
    province: "Eastern Cape",
    phone: CONCIERGE_PHONE,
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-erich-bam",
    name: "Dr Erich Johannes Bam",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Bloemfontein",
    province: "Free State",
    phone: CONCIERGE_PHONE,
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-ramolapo-molapo",
    name: "Dr Ramolapo Antony Molapo",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Polokwane",
    province: "Limpopo",
    phone: CONCIERGE_PHONE,
    email: CONCIERGE_EMAIL,
    verified: false,
  },
  {
    id: "dr-johannes-lee",
    name: "Dr Johannes Lodewicus Lee",
    practiceType: "practitioner",
    role: "Dermatologist",
    city: "Rustenburg",
    province: "North West",
    phone: CONCIERGE_PHONE,
    email: CONCIERGE_EMAIL,
    verified: false,
  },
];
