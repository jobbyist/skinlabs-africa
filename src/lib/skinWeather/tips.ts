/**
 * getSkinWeatherTip — turns today's weather into one line of general cosmetic
 * skincare guidance. Pure and unit-tested.
 *
 * Compliance (CPA / ASA Code): this is everyday cosmetic guidance, never a
 * medical claim. No diagnosing, treating, curing or preventing anything, and no
 * named conditions — see FORBIDDEN_TIP_TERMS, which the tests scan every
 * output against.
 */

export interface SkinWeatherData {
  uvNow: number;
  uvMax: number;
  /** ISO time of today's UV peak, or null once it has passed. */
  uvPeakAt: string | null;
  humidity: number;
  tempMax: number;
}

/** Optional context from the member's latest SKYNN AI analysis. */
export interface SkinWeatherProfile {
  skinType?: string | null;
  /** Concern keys/labels, e.g. "dehydration", "Dryness", "sensitivity". */
  concerns?: string[] | null;
}

export type UvBand = "low" | "moderate" | "high" | "very_high" | "extreme";

export const UV_BAND_LABEL: Record<UvBand, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  very_high: "Very high",
  extreme: "Extreme",
};

/** WHO UV index scale. Readings are rounded to the nearest whole number first, as the WHO reports them. */
export const uvBand = (uv: number): UvBand => {
  const u = Math.round(Math.max(0, uv));
  if (u <= 2) return "low";
  if (u <= 5) return "moderate";
  if (u <= 7) return "high";
  if (u <= 10) return "very_high";
  return "extreme";
};

export const DRY_AIR_BELOW = 30;
export const HUMID_ABOVE = 70;

export const FORBIDDEN_TIP_TERMS = [
  "cure", "treat", "heal", "prevent", "cancer", "disease", "diagnos", "medical",
  "eczema", "psoriasis", "rosacea", "dermatitis", "melanoma", "burn",
];

const formatPeak = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Johannesburg",
  });

const has = (profile: SkinWeatherProfile | undefined, ...needles: string[]) => {
  const hay = [profile?.skinType ?? "", ...(profile?.concerns ?? [])].join(" ").toLowerCase();
  return needles.some((n) => hay.includes(n));
};

export interface SkinWeatherTip {
  band: UvBand;
  bandLabel: string;
  /** Peak time formatted for SAST (HH:mm), when still ahead today. */
  peakTime: string | null;
  /** The one-line tip shown on the card. */
  tip: string;
}

export const getSkinWeatherTip = (weather: SkinWeatherData, profile?: SkinWeatherProfile): SkinWeatherTip => {
  const band = uvBand(weather.uvMax);
  const peakTime = weather.uvPeakAt ? formatPeak(weather.uvPeakAt) : null;
  const sentences: string[] = [];

  // --- UV (uses today's max, not the current reading) ---
  if (band === "low") {
    sentences.push("UV is low today, but daily SPF is still a good habit.");
  } else {
    const reapply = peakTime
      ? `reapply around ${peakTime} when UV peaks`
      : "reapply every two hours if you're outdoors";
    const strength = band === "moderate" ? "Wear SPF 30+" : "Wear SPF 50";
    sentences.push(`${UV_BAND_LABEL[band]} UV today: ${strength} and ${reapply}.`);
  }

  // --- Humidity, adjusted for the skin profile when we have one ---
  const dryOrDehydrated = has(profile, "dry", "dehydrat");
  const oily = has(profile, "oil", "breakout");
  const sensitive = has(profile, "sensitiv", "barrier");

  if (weather.humidity < DRY_AIR_BELOW) {
    if (dryOrDehydrated) {
      sentences.push("Dry air and dehydration-prone skin: layer a hydrating serum under a richer moisturiser to seal it in.");
    } else if (sensitive) {
      sentences.push("The air is dry: layer hydration and seal with a fragrance-free moisturiser.");
    } else {
      sentences.push("The air is dry: layer hydration and seal it in with moisturiser.");
    }
  } else if (weather.humidity > HUMID_ABOVE) {
    if (oily) {
      sentences.push("It's humid: switch to a gel moisturiser and blot during the day rather than re-cleansing.");
    } else if (dryOrDehydrated) {
      sentences.push("It's humid: a lighter texture should feel comfortable, but keep your hydrating step.");
    } else {
      sentences.push("It's humid: lighter, gel-style textures will feel more comfortable.");
    }
  } else if (weather.tempMax >= 30 && oily) {
    sentences.push("A hot day: keep layers light and carry blotting papers.");
  }

  return { band, bandLabel: UV_BAND_LABEL[band], peakTime, tip: sentences.join(" ") };
};
