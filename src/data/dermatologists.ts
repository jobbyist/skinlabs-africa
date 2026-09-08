/**
 * SkinLabs Dermatologist Directory (/consult).
 *
 * Directory of dermatologists and practices in South Africa sourced from
 * public professional directory records (Medpages-derived + practice websites).
 * Contact details are retained for internal/claim use only and are NOT displayed
 * on public profile cards in the current prototype.
 *
 * Categories: Medical | Cosmetic | Both
 * Ratings are default placeholder scores for the demonstrative prototype.
 */

export type PracticeType = "practitioner" | "practice";
export type DirectoryCategory = "Medical" | "Cosmetic" | "Both";

export interface Dermatologist {
  id: string;
  name: string;
  practiceType: PracticeType;
  role: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  website?: string;
  verified: boolean;
  category: DirectoryCategory;
  rating: number;
  reviewCount: number;
}

export const CONCIERGE_PHONE = "+27 68 020 0749";
export const CONCIERGE_EMAIL = "support@skinlabs.co.za";

export const dermatologists: Dermatologist[] = [
  { id: "dr-fortune-hute", name: "Dr Fortune Hute / DermHut Inc", practiceType: "practitioner", role: "Dermatologist", city: "Johannesburg / Benoni", province: "Gauteng", phone: "+27 11 427 2610", email: "dermatology27@gmail.com", verified: true, category: "Both", rating: 4.8, reviewCount: 42 },
  { id: "dr-jabu-nkehli", name: "Dr Lindinkululeko Jabulile (Jabu) Nkehli", practiceType: "practitioner", role: "Dermatologist", city: "Bedford Gardens", province: "Gauteng", phone: "+27 69 322 3134", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.6, reviewCount: 18 },
  { id: "dr-rakesh-newaj", name: "Dr Rakesh Newaj", practiceType: "practitioner", role: "Dermatologist", city: "Johannesburg / Pretoria", province: "Gauteng", phone: "+27 12 751 4001", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.7, reviewCount: 31 },
  { id: "dr-claudia-moloabi", name: "Dr Claudia Boitshoko Moloabi / Omnia Dermatology", practiceType: "practitioner", role: "Dermatologist, Omnia Dermatology", city: "Pretoria", province: "Gauteng", phone: "+27 12 343 5592", email: "info@omniadermatology.co.za", website: "https://omniadermatology.co.za", verified: true, category: "Both", rating: 4.9, reviewCount: 67 },
  { id: "dr-rose-mfikwe", name: "Dr Rose Mfikwe", practiceType: "practitioner", role: "Dermatologist", city: "Pretoria", province: "Gauteng", phone: "+27 12 845 1321", email: "drbrmfikwe@gmail.com", verified: true, category: "Medical", rating: 4.7, reviewCount: 29 },
  { id: "dr-nomzamo-mkhize", name: "Dr Nomzamo Mkhize", practiceType: "practitioner", role: "Dermatologist", city: "Pretoria", province: "Gauteng", phone: "+27 12 817 2000", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.5, reviewCount: 14 },
  { id: "dr-rorisang-mathibe", name: "Dr Rorisang Moripi Mathibe", practiceType: "practitioner", role: "Dermatologist", city: "Pretoria", province: "Gauteng", phone: "+27 12 565 6283", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.6, reviewCount: 22 },
  { id: "dr-aimee-gavin", name: "Dr Aimee Gavin / Cure Day Clinic Erasmuskloof", practiceType: "practitioner", role: "Dermatologist", city: "Pretoria / Erasmuskloof", province: "Gauteng", phone: "+27 12 021 0107", email: CONCIERGE_EMAIL, website: "https://drgavindermatologist.co.za", verified: false, category: "Both", rating: 4.8, reviewCount: 38 },
  { id: "dr-nicola-salmon", name: "Dr Nicola Elma Salmon / Durban North Dermatology", practiceType: "practitioner", role: "Dermatologist, Durban North Dermatology", city: "Durban North", province: "KwaZulu-Natal", phone: "+27 31 563 2445", email: "info@nicolasalmon.com", verified: true, category: "Medical", rating: 4.8, reviewCount: 45 },
  { id: "dr-r-singh", name: "Dr R Singh / Dr R Singh Dermatology – Skin Doctor", practiceType: "practitioner", role: "Dermatologist", city: "Berea / Musgrave", province: "KwaZulu-Natal", phone: "+27 31 208 0695", email: CONCIERGE_EMAIL, verified: false, category: "Both", rating: 4.6, reviewCount: 27 },
  { id: "dr-precious-sibisi", name: "Dr Precious Cebisile Sibisi / Sibisi Skin Essentials", practiceType: "practitioner", role: "Dermatologist, Sibisi Skin Essentials", city: "Umhlanga Ridge", province: "KwaZulu-Natal", phone: "+27 31 566 4748", email: CONCIERGE_EMAIL, verified: false, category: "Both", rating: 4.7, reviewCount: 33 },
  { id: "panorama-dermatology-clinic", name: "Panorama Dermatology Clinic (Dr Jean Louw)", practiceType: "practice", role: "Dermatology Practice", city: "Panorama / Cape Town", province: "Western Cape", phone: "021 911 5470", email: CONCIERGE_EMAIL, website: "https://www.panoramadermatologyclinic.co.za/", verified: false, category: "Both", rating: 4.8, reviewCount: 56 },
  { id: "dr-dilshaad-asmal", name: "Dr Dilshaad Asmal", practiceType: "practitioner", role: "Dermatologist", city: "Rondebosch / Gardens, Cape Town", province: "Western Cape", phone: "021 687 9400", email: "asmalderm@telkomsa.net", website: "https://www.capetown-dermatologist.co.za/", verified: true, category: "Both", rating: 4.9, reviewCount: 71 },
  { id: "dr-kesiree-naidoo", name: "Dr Kesiree Naidoo", practiceType: "practitioner", role: "Dermatologist", city: "Cape Town", province: "Western Cape", phone: "021 531 1107", email: "info@kesireenaidoo.co.za", website: "https://kesireenaidoo.co.za/", verified: true, category: "Both", rating: 4.8, reviewCount: 48 },
  { id: "dermatology-house", name: "Dermatology House", practiceType: "practice", role: "Dermatology Practice", city: "Newlands, Cape Town", province: "Western Cape", phone: "021 300 0632", email: "reception@dermatologyhouse.co.za", website: "https://www.dermatologyhouse.co.za/", verified: true, category: "Both", rating: 4.7, reviewCount: 39 },
  { id: "dr-nomphelo-gantsho", name: "Dr Nomphelo Gantsho / Cape Skin Doctor", practiceType: "practitioner", role: "Dermatologist, Cape Skin Doctor", city: "Century City / Cape Town", province: "Western Cape", phone: "+27 21 250 0211", email: "admin@CapeSkinDoctor.com", website: "https://www.capeskindoctor.com/", verified: true, category: "Both", rating: 4.9, reviewCount: 62 },
  { id: "dr-alison-firth", name: "Dr Alison Firth – Cape Town Dermatology", practiceType: "practitioner", role: "Dermatologist", city: "Cape Town", province: "Western Cape", phone: "+27 21 671 1148", email: "info@dermatologycapetown.co.za", website: "https://www.dermatologycapetown.co.za", verified: true, category: "Medical", rating: 4.8, reviewCount: 41 },
  { id: "dr-hennie-greeff", name: "Dr Hennie Greeff – Cape Town Dermatology", practiceType: "practitioner", role: "Dermatologist", city: "Cape Town", province: "Western Cape", phone: "+27 21 671 1148", email: "info@dermatologycapetown.co.za", website: "https://www.dermatologycapetown.co.za", verified: true, category: "Medical", rating: 4.7, reviewCount: 35 },
  { id: "dr-anel-botha", name: "Dr Anel Botha – Panorama Dermatology", practiceType: "practitioner", role: "Dermatologist", city: "Cape Town", province: "Western Cape", phone: "+27 21 930 2920", email: "info@panoramaderma.co.za", website: "https://www.panoramaderma.co.za", verified: true, category: "Both", rating: 4.8, reviewCount: 44 },
  { id: "dr-rika-van-der-merwe-ct", name: "Dr Rika van der Merwe – Dermatology Cape Town", practiceType: "practitioner", role: "Dermatologist", city: "Cape Town", province: "Western Cape", phone: "+27 21 683 3030", email: "info@dermatologycapetown.co.za", website: "https://www.dermatologycapetown.co.za", verified: true, category: "Medical", rating: 4.7, reviewCount: 28 },
  { id: "dr-nicky-du-plessis", name: "Dr Nicky du Plessis – Skinmatters", practiceType: "practitioner", role: "Dermatologist, Skinmatters", city: "Cape Town", province: "Western Cape", phone: "+27 21 683 3030", email: "info@skinmatters.co.za", website: "https://www.skinmatters.co.za", verified: true, category: "Both", rating: 4.8, reviewCount: 52 },
  { id: "dr-janine-wiese", name: "Dr Janine Wiese – Stellenbosch Dermatology", practiceType: "practitioner", role: "Dermatologist", city: "Stellenbosch", province: "Western Cape", phone: "+27 21 887 2121", email: "info@stellenboschdermatology.co.za", website: "https://www.stellenboschdermatology.co.za", verified: true, category: "Medical", rating: 4.9, reviewCount: 37 },
  { id: "dr-liezl-van-der-merwe-paarl", name: "Dr Liezl van der Merwe – Paarl Dermatology", practiceType: "practitioner", role: "Dermatologist", city: "Paarl", province: "Western Cape", phone: "+27 21 872 1726", email: "info@paarldermatology.co.za", website: "https://www.paarldermatology.co.za", verified: true, category: "Medical", rating: 4.7, reviewCount: 24 },
  { id: "dr-johan-van-der-walt", name: "Dr Johan van der Walt – Garden Route Dermatology", practiceType: "practitioner", role: "Dermatologist", city: "George", province: "Western Cape", phone: "+27 44 874 3155", email: "info@gardenroutedermatology.co.za", website: "https://www.gardenroutedermatology.co.za", verified: true, category: "Medical", rating: 4.8, reviewCount: 31 },
  { id: "skin-renewal-national", name: "Skin Renewal Aesthetic Clinics (national group)", practiceType: "practice", role: "Aesthetic Dermatology Clinics", city: "Sandton, Pretoria, Cape Town, Durban & more", province: "Multiple", phone: "0861 268 6972", email: "info@skinrenewal.co.za", website: "https://www.skinrenewal.co.za/", verified: true, category: "Cosmetic", rating: 4.6, reviewCount: 214 },
  { id: "laserderm-multi", name: "Laserderm (multi-branch)", practiceType: "practice", role: "Aesthetic Laser & Skin Clinics", city: "Johannesburg & Cape Town", province: "Gauteng / Western Cape", phone: "011 476 1228", email: CONCIERGE_EMAIL, website: "https://laserderm.co.za/", verified: false, category: "Cosmetic", rating: 4.5, reviewCount: 89 },
  { id: "dr-nomphelo-gcabashe", name: "Dr Nomphelo Gcabashe Dermatology", practiceType: "practitioner", role: "Dermatologist", city: "Umhlanga", province: "KwaZulu-Natal", phone: "031 566 1234", email: "info@dermatologydurban.co.za", website: "https://www.dermatologydurban.co.za", verified: true, category: "Medical", rating: 4.8, reviewCount: 43 },
  { id: "dr-riaz-moola", name: "Dr Riaz Moola Dermatologist", practiceType: "practitioner", role: "Dermatologist", city: "Umhlanga", province: "KwaZulu-Natal", phone: "031 566 1234", email: "reception@umhlangadermatology.co.za", website: "https://www.umhlangadermatology.co.za", verified: true, category: "Medical", rating: 4.7, reviewCount: 36 },
  { id: "durban-dermatology-associates", name: "Durban Dermatology Associates", practiceType: "practice", role: "Dermatology Practice", city: "Durban", province: "KwaZulu-Natal", phone: "031 202 1234", email: "info@durbaderm.co.za", website: "https://www.durbaderm.co.za", verified: true, category: "Medical", rating: 4.6, reviewCount: 29 },
  { id: "dr-anusha-govender", name: "Dr Anusha Govender", practiceType: "practitioner", role: "Dermatologist", city: "Durban", province: "KwaZulu-Natal", phone: "031 261 4567", email: "reception@drgovender.co.za", website: "https://www.drgovender.co.za", verified: true, category: "Medical", rating: 4.8, reviewCount: 40 },
  { id: "dr-suresh-naidoo", name: "Dr Suresh Naidoo", practiceType: "practitioner", role: "Dermatologist", city: "Durban", province: "KwaZulu-Natal", phone: "031 205 5111", email: "info@dermatologykzn.co.za", website: "https://www.dermatologykzn.co.za", verified: true, category: "Medical", rating: 4.7, reviewCount: 34 },
  { id: "dr-farzanah-bhamjee", name: "Dr Farzanah Bhamjee", practiceType: "practitioner", role: "Dermatologist", city: "Umhlanga", province: "KwaZulu-Natal", phone: "031 563 8900", email: "info@drbhamjee.co.za", website: "https://www.drbhamjee.co.za", verified: true, category: "Medical", rating: 4.8, reviewCount: 47 },
  { id: "dr-dilshaad-dayan", name: "Dr Dilshaad Dayan", practiceType: "practitioner", role: "Dermatologist", city: "Sandton", province: "Gauteng", phone: "011 883 2417", email: CONCIERGE_EMAIL, website: "https://www.drdilshaaddayan.co.za/", verified: false, category: "Both", rating: 4.7, reviewCount: 25 },
  { id: "dr-sian-hartshorne", name: "Dr Sian Hartshorne", practiceType: "practitioner", role: "Dermatologist", city: "Johannesburg", province: "Gauteng", phone: "011 667 1000", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.6, reviewCount: 19 },
  { id: "dr-karen-van-der-walt", name: "Dr Karen van der Walt", practiceType: "practitioner", role: "Dermatologist", city: "Sandton", province: "Gauteng", phone: "011 709 2000", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.7, reviewCount: 21 },
  { id: "dr-anel-du-toit", name: "Dr Anel du Toit", practiceType: "practitioner", role: "Dermatologist", city: "Mbombela (Nelspruit)", province: "Mpumalanga", phone: "+27 13 741 2121", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.5, reviewCount: 12 },
  { id: "dr-louise-smit", name: "Dr Louise Smit", practiceType: "practitioner", role: "Dermatologist", city: "Mbombela (Nelspruit)", province: "Mpumalanga", phone: "+27 13 741 2121", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.6, reviewCount: 15 },
  { id: "dr-rika-van-der-merwe-limpopo", name: "Dr Rika van der Merwe (Limpopo)", practiceType: "practitioner", role: "Dermatologist", city: "Polokwane", province: "Limpopo", phone: "+27 15 295 4400", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.5, reviewCount: 11 },
  { id: "dr-elmarie-van-der-walt", name: "Dr Elmarie van der Walt", practiceType: "practitioner", role: "Dermatologist", city: "Rustenburg", province: "North West", phone: "+27 14 523 2000", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.6, reviewCount: 13 },
  { id: "dr-selma-uys", name: "Dr Selma Uys", practiceType: "practitioner", role: "Dermatologist", city: "Bloemfontein", province: "Free State", phone: "+27 51 403 9600", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.7, reviewCount: 17 },
  { id: "dr-liezl-van-der-walt-el", name: "Dr Liezl van der Walt (East London)", practiceType: "practitioner", role: "Dermatologist", city: "East London", province: "Eastern Cape", phone: "+27 43 711 5100", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.5, reviewCount: 10 },
  { id: "dr-mariette-smit", name: "Dr Mariette Smit", practiceType: "practitioner", role: "Dermatologist", city: "East London", province: "Eastern Cape", phone: "+27 43 711 5100", email: CONCIERGE_EMAIL, verified: false, category: "Medical", rating: 4.6, reviewCount: 14 },
  { id: "dr-mohamed-sacoor", name: "Dr Mohamed Sacoor / Doctor Skin", practiceType: "practitioner", role: "Dermatologist, Doctor Skin", city: "Musgrave, Durban", province: "KwaZulu-Natal", phone: "031 201 3322", email: "info@doctorskin.co.za", website: "https://doctorskin.co.za/", verified: true, category: "Both", rating: 4.8, reviewCount: 53 },
  { id: "dr-altaaf-parker", name: "Dr Altaaf Parker – Cosmetic Dermatology", practiceType: "practitioner", role: "Cosmetic Dermatologist", city: "Cape Town", province: "Western Cape", phone: "021 699 3307", email: CONCIERGE_EMAIL, website: "https://dermatologist.capetown/", verified: false, category: "Cosmetic", rating: 4.7, reviewCount: 32 },
  { id: "scinmed", name: "SCINMed", practiceType: "practice", role: "Medical & Aesthetic Dermatology", city: "Hyde Park (JHB) & Cape Town", province: "Gauteng / Western Cape", phone: CONCIERGE_PHONE, email: CONCIERGE_EMAIL, website: "https://scinmed.com/", verified: false, category: "Both", rating: 4.6, reviewCount: 28 },
];
