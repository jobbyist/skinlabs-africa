/**
 * Skin-weather provider boundary. The skin-weather edge function only ever
 * talks to `SkinWeatherProvider`, so swapping OpenWeather for another source
 * (Open-Meteo's commercial API, etc.) means adding one implementation of this
 * interface — nothing else changes. Pure TypeScript, no Deno APIs, so the
 * normalisers are unit-testable under bun.
 */

/** Normalised, provider-agnostic reading for one location. */
export interface SkinWeatherReading {
  /** UV index right now. */
  uvNow: number;
  /** Today's maximum UV index (local day). */
  uvMax: number;
  /** ISO timestamp of today's UV peak, or null if it has already passed. */
  uvPeakAt: string | null;
  /** Relative humidity right now, %. */
  humidity: number;
  /** Today's forecast high, °C. */
  tempMax: number;
  /** When the provider produced this reading (ISO). */
  observedAt: string;
}

export interface SkinWeatherProvider {
  readonly name: string;
  /** Attribution shown on the card (licence/credit requirement). */
  readonly attribution: string;
  getSkinWeather(lat: number, lon: number): Promise<SkinWeatherReading>;
}

export class WeatherProviderError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "WeatherProviderError";
  }
}

/**
 * South African cities the card supports — city-centre coordinates rounded to
 * 2 dp (~1 km). Precise user location is never sent to or stored by the server:
 * browsers snap to the nearest of these first. Mirrored in
 * src/lib/skinWeather/cities.ts (a unit test keeps the two in sync).
 */
export const SA_CITY_COORDS: Record<string, { label: string; lat: number; lon: number }> = {
  johannesburg: { label: "Johannesburg", lat: -26.2, lon: 28.05 },
  pretoria: { label: "Pretoria", lat: -25.75, lon: 28.19 },
  "cape-town": { label: "Cape Town", lat: -33.92, lon: 18.42 },
  durban: { label: "Durban", lat: -29.86, lon: 31.03 },
  gqeberha: { label: "Gqeberha", lat: -33.96, lon: 25.6 },
  bloemfontein: { label: "Bloemfontein", lat: -29.12, lon: 26.21 },
  "east-london": { label: "East London", lat: -33.02, lon: 27.91 },
  polokwane: { label: "Polokwane", lat: -23.9, lon: 29.45 },
  mbombela: { label: "Mbombela", lat: -25.47, lon: 30.97 },
  kimberley: { label: "Kimberley", lat: -28.74, lon: 24.76 },
};
