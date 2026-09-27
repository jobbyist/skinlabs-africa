/**
 * The South African cities the skin-weather card supports. City-centre
 * coordinates, rounded to 2 dp. Mirrors SA_CITY_COORDS in
 * supabase/functions/_shared/weather/provider.ts (the edge function's
 * allow-list) — a unit test fails if the two drift.
 */
export interface SaCity {
  key: string;
  label: string;
  lat: number;
  lon: number;
}

export const SA_CITIES: SaCity[] = [
  { key: "johannesburg", label: "Johannesburg", lat: -26.2, lon: 28.05 },
  { key: "pretoria", label: "Pretoria", lat: -25.75, lon: 28.19 },
  { key: "cape-town", label: "Cape Town", lat: -33.92, lon: 18.42 },
  { key: "durban", label: "Durban", lat: -29.86, lon: 31.03 },
  { key: "gqeberha", label: "Gqeberha", lat: -33.96, lon: 25.6 },
  { key: "bloemfontein", label: "Bloemfontein", lat: -29.12, lon: 26.21 },
  { key: "east-london", label: "East London", lat: -33.02, lon: 27.91 },
  { key: "polokwane", label: "Polokwane", lat: -23.9, lon: 29.45 },
  { key: "mbombela", label: "Mbombela", lat: -25.47, lon: 30.97 },
  { key: "kimberley", label: "Kimberley", lat: -28.74, lon: 24.76 },
];

export const DEFAULT_CITY_KEY = "johannesburg";

export const cityByKey = (key: string | null | undefined): SaCity | undefined =>
  key ? SA_CITIES.find((c) => c.key === key) : undefined;

/** Former/alternative names people type into the free-text profile city field. */
const ALIASES: Record<string, string> = {
  joburg: "johannesburg",
  jozi: "johannesburg",
  jhb: "johannesburg",
  tshwane: "pretoria",
  pta: "pretoria",
  "cape town": "cape-town",
  cpt: "cape-town",
  "port elizabeth": "gqeberha",
  pe: "gqeberha",
  nelspruit: "mbombela",
  pietersburg: "polokwane",
  "east london": "east-london",
  "buffalo city": "east-london",
  dbn: "durban",
  bloem: "bloemfontein",
};

/**
 * Maps a profile's city (stored as the label, e.g. "Cape Town", or older
 * free-text like "Joburg") to a supported city. Returns undefined rather than
 * guessing when it isn't one of the ten.
 */
export const cityFromProfile = (value: string | null | undefined): SaCity | undefined => {
  if (!value) return undefined;
  const normalised = value.trim().toLowerCase().replace(/\s+/g, " ");
  const direct = SA_CITIES.find((c) => c.label.toLowerCase() === normalised || c.key === normalised.replace(/ /g, "-"));
  if (direct) return direct;
  return cityByKey(ALIASES[normalised]);
};

/**
 * Snaps a browser position to the nearest supported city (equirectangular
 * distance is plenty at this scale). The raw coordinates are only used for
 * this comparison and are never sent anywhere or stored (POPIA).
 */
export const nearestCity = (lat: number, lon: number): SaCity => {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  let best = SA_CITIES[0];
  let bestDist = Infinity;
  for (const city of SA_CITIES) {
    const dx = (city.lon - lon) * cosLat;
    const dy = city.lat - lat;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      best = city;
      bestDist = dist;
    }
  }
  return best;
};
