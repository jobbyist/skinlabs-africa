/**
 * Climate-adaptive routine badges for the AM/PM tracker. Cosmetic layering guidance only (no medical claims).
 * City is the member's skin-weather city; live humidity (when the weather service answered) confirms or withholds the
 * alert, so "Dry Air Alert" never shows on a humid day. Without live data the city's usual climate is used, worded as such.
 */
export type RoutineBadgeTone = "dry" | "humid" | "wind";

export interface RoutineClimateBadge {
  tone: RoutineBadgeTone;
  title: string;
  text: string;
  /** "live" = confirmed by today's reading, "typical" = the city's usual climate (no reading available). */
  basis: "live" | "typical";
}

export interface ClimateReading {
  humidity?: number | null;
}

const HIGHVELD = new Set(["johannesburg", "pretoria"]);
const DURBAN = new Set(["durban"]);
const CAPE = new Set(["cape-town"]);

/** Humidity thresholds (%): below DRY is dry air for a Highveld skin; above HUMID is muggy for the coast. */
export const DRY_HUMIDITY = 40;
export const HUMID_HUMIDITY = 70;

/** South African spring: September to November. */
export const isSpring = (date: Date): boolean => [8, 9, 10].includes(date.getMonth());

export const routineClimateBadge = (cityKey: string | null | undefined, reading: ClimateReading | null | undefined, now: Date = new Date()): RoutineClimateBadge | null => {
  if (!cityKey) return null;
  const humidity = typeof reading?.humidity === "number" ? reading.humidity : null;

  if (HIGHVELD.has(cityKey)) {
    if (humidity !== null && humidity > DRY_HUMIDITY) return null;
    return {
      tone: "dry",
      title: humidity !== null ? "Highveld Dry Air Alert" : "Highveld: usually dry air",
      text: "Add an occlusive layer over humectants.",
      basis: humidity !== null ? "live" : "typical",
    };
  }
  if (DURBAN.has(cityKey)) {
    if (humidity !== null && humidity < HUMID_HUMIDITY) return null;
    return {
      tone: "humid",
      title: humidity !== null ? "High Humidity" : "KZN Coast: usually humid",
      text: "Swap heavy cream for a gel hydrator.",
      basis: humidity !== null ? "live" : "typical",
    };
  }
  if (CAPE.has(cityKey)) {
    const spring = isSpring(now);
    return {
      tone: "wind",
      title: spring ? "Spring Pollen / Wind Barrier Alert" : "Cape Wind Barrier Alert",
      text: "Prioritize ceramide replenishment.",
      basis: "typical",
    };
  }
  return null;
};
