export interface Practitioner {
  id: string;
  name: string;
  credential: string;
  city: string;
  province: string;
  specialities: string[];
  languages: string[];
  virtual_fee_zar: number;
  next_available: string;
  bio: string;
}

export const practitioners: Practitioner[] = [
  {
    id: "dr-naledi-mokoena",
    name: "Dr. Naledi Mokoena",
    credential: "MBChB, Dip. Dermatology",
    city: "Johannesburg",
    province: "Gauteng",
    specialities: ["Hyperpigmentation", "Acne", "Melanin-rich skin"],
    languages: ["English", "Setswana", "isiZulu"],
    virtual_fee_zar: 850,
    next_available: "Tomorrow, 09:00",
    bio: "Focuses on pigmentation disorders and acne scarring in Fitzpatrick IV–VI skin, with a conservative, barrier-first approach.",
  },
  {
    id: "dr-imraan-patel",
    name: "Dr. Imraan Patel",
    credential: "MBChB, FCDerm (SA)",
    city: "Durban",
    province: "KwaZulu-Natal",
    specialities: ["Eczema", "Rosacea", "Humid climate care"],
    languages: ["English", "Afrikaans"],
    virtual_fee_zar: 1150,
    next_available: "Thu, 14:30",
    bio: "Specialist dermatologist treating inflammatory skin disease, with particular interest in humid coastal triggers.",
  },
  {
    id: "sr-lerato-dlamini",
    name: "Sr. Lerato Dlamini",
    credential: "Aesthetic Nurse Practitioner",
    city: "Pretoria",
    province: "Gauteng",
    specialities: ["Routine building", "Barrier repair", "Post-procedure care"],
    languages: ["English", "Sepedi"],
    virtual_fee_zar: 550,
    next_available: "Today, 16:00",
    bio: "Guides members through practical routine simplification and product selection on a realistic monthly budget.",
  },
  {
    id: "dr-hanri-van-zyl",
    name: "Dr. Hanri van Zyl",
    credential: "MBChB, Aesthetic Medicine",
    city: "Cape Town",
    province: "Western Cape",
    specialities: ["Photoageing", "Retinoid protocols", "Sun damage"],
    languages: ["English", "Afrikaans"],
    virtual_fee_zar: 950,
    next_available: "Fri, 11:15",
    bio: "Works extensively on sun-damage management and structured retinoid escalation for high-UV lifestyles.",
  },
];
