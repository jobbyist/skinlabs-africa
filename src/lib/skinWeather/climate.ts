/**
 * Highveld vs. coastal barrier advice. Two very different South African
 * climates drive different skin-barrier needs, so the weather surfaces name
 * which one the city sits in. Cosmetic guidance only (no medical claims).
 */

const HIGHVELD_CITIES = new Set(["johannesburg", "pretoria", "bloemfontein", "polokwane", "kimberley"]);
const COASTAL_CITIES = new Set(["cape-town", "durban", "gqeberha", "east-london"]);

export interface ClimateCue {
  zone: "highveld" | "coastal";
  label: string;
  /** One sentence for roomy surfaces (the dashboard card). */
  text: string;
  /** A shorter line for the compact homepage notch. */
  short: string;
}

export const getClimateCue = (cityKey: string): ClimateCue | null => {
  if (HIGHVELD_CITIES.has(cityKey)) {
    return {
      zone: "highveld",
      label: "Highveld / inland",
      text: "Drier inland air can make moisture loss more noticeable. Keep hydration and moisturiser layers simple and consistent.",
      short: "Drier inland air: keep hydration and moisturiser consistent.",
    };
  }
  if (COASTAL_CITIES.has(cityKey)) {
    return {
      zone: "coastal",
      label: "Coastal",
      text: "Coastal humidity can make richer layers feel heavier. Keep hydration in, but lighter textures may feel more comfortable.",
      short: "Coastal humidity: lighter textures may feel more comfortable.",
    };
  }
  // Mbombela (lowveld) is neither: say nothing rather than guess.
  return null;
};
