/**
 * OpenWeather One Call implementations of SkinWeatherProvider.
 *
 * Why OpenWeather and not Open-Meteo: Open-Meteo's free API is licensed for
 * non-commercial use only, and its terms explicitly count sites that show
 * advertising as commercial (SkinLabs runs AdSense). OpenWeather's "One Call by
 * Call" plan allows commercial use with the first 1,000 calls/day free.
 *
 * Two API versions, same data:
 * - **4.0 (default, `OpenWeatherV4Provider`)** — what new OpenWeather accounts
 *   are offered (confirmed 2026-09-24: the subscription page only lists 4.0).
 *   Current conditions, the hourly timeline and the daily timeline are three
 *   separate endpoints, so one refresh = 3 calls. With the skin-weather
 *   function's 60-minute per-city cache that's at most 10 cities × 24 × 3 =
 *   720 calls/day, inside the free 1,000.
 * - **3.0 (`OpenWeatherProvider`)** — one call per refresh, for accounts that
 *   still have it. Select with the `OPENWEATHER_ONECALL_VERSION=3.0` secret.
 *
 * Both versions use the same field names (dt, uvi, humidity, temp.max), so the
 * v4 responses are reshaped into the v3 shape and parsed by the single, tested
 * `normaliseOneCallV3()`.
 *
 * Attribution: OpenWeather asks for a credit to OpenWeather when its data is shown.
 */
import { WeatherProviderError, type SkinWeatherProvider, type SkinWeatherReading } from "./provider.ts";

/** The subset of the One Call 3.0 response we read. */
export interface OneCallV3Response {
  timezone_offset: number;
  current: { dt: number; uvi: number; humidity: number };
  hourly?: { dt: number; uvi: number }[];
  daily?: { dt: number; uvi: number; temp: { max: number } }[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Local calendar day (YYYY-MM-DD) of a unix timestamp at a UTC offset. */
const localDay = (unixSeconds: number, offsetSeconds: number) =>
  new Date((unixSeconds + offsetSeconds) * 1000).toISOString().slice(0, 10);

/**
 * Pure: One Call 3.0 JSON → SkinWeatherReading. Today's peak time is the
 * highest-UV hour still ahead today; if the day's max (daily[0].uvi) is clearly
 * above anything left today, the peak has already passed and uvPeakAt is null.
 */
export const normaliseOneCallV3 = (json: OneCallV3Response): SkinWeatherReading => {
  if (!json?.current || typeof json.current.uvi !== "number" || typeof json.current.humidity !== "number") {
    throw new WeatherProviderError("Malformed One Call response: missing current conditions");
  }
  const offset = json.timezone_offset ?? 0;
  const today = localDay(json.current.dt, offset);
  const todayDaily = (json.daily ?? []).find((d) => localDay(d.dt, offset) === today) ?? json.daily?.[0];
  if (!todayDaily || typeof todayDaily.temp?.max !== "number") {
    throw new WeatherProviderError("Malformed One Call response: missing today's forecast");
  }

  const remainingToday = (json.hourly ?? []).filter((h) => localDay(h.dt, offset) === today);
  const peakHour = remainingToday.reduce<{ dt: number; uvi: number } | null>(
    (best, h) => (best === null || h.uvi > best.uvi ? h : best),
    null,
  );
  const uvMax = Math.max(todayDaily.uvi ?? 0, json.current.uvi, peakHour?.uvi ?? 0);
  const peakStillAhead = peakHour !== null && peakHour.uvi >= uvMax - 0.5 && peakHour.uvi > 0;

  return {
    uvNow: round1(json.current.uvi),
    uvMax: round1(uvMax),
    uvPeakAt: peakStillAhead ? new Date(peakHour!.dt * 1000).toISOString() : null,
    humidity: Math.round(json.current.humidity),
    tempMax: Math.round(todayDaily.temp.max),
    observedAt: new Date(json.current.dt * 1000).toISOString(),
  };
};

export class OpenWeatherProvider implements SkinWeatherProvider {
  readonly name = "openweather";
  readonly attribution = "Weather data © OpenWeather";

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async getSkinWeather(lat: number, lon: number): Promise<SkinWeatherReading> {
    const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
    url.searchParams.set("lat", lat.toFixed(2));
    url.searchParams.set("lon", lon.toFixed(2));
    url.searchParams.set("exclude", "minutely,alerts");
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", this.apiKey);

    const res = await this.fetchImpl(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      // Never echo the URL — it carries the API key.
      throw new WeatherProviderError(`OpenWeather request failed (${res.status})`, res.status);
    }
    return normaliseOneCallV3((await res.json()) as OneCallV3Response);
  }
}

// ---------------------------------------------------------------------------
// One Call 4.0
// ---------------------------------------------------------------------------

/** Every 4.0 endpoint wraps its records in a `data` array with the location's UTC offset. */
export interface OneCallV4Envelope<T> {
  timezone_offset: number;
  data: T[];
}
export type OneCallV4Current = OneCallV4Envelope<{ dt: number; uvi: number; humidity: number }>;
export type OneCallV4Hourly = OneCallV4Envelope<{ dt: number; uvi: number }>;
export type OneCallV4Daily = OneCallV4Envelope<{ dt: number; uvi: number; temp: { max: number } }>;

/** Pure: the three 4.0 responses → the 3.0 shape → SkinWeatherReading. */
export const normaliseOneCallV4 = (
  current: OneCallV4Current,
  hourly: OneCallV4Hourly,
  daily: OneCallV4Daily,
): SkinWeatherReading => {
  const now = current?.data?.[0];
  if (!now) throw new WeatherProviderError("Malformed One Call 4.0 response: missing current conditions");
  return normaliseOneCallV3({
    timezone_offset: current.timezone_offset ?? hourly?.timezone_offset ?? daily?.timezone_offset ?? 0,
    current: now,
    hourly: hourly?.data ?? [],
    daily: daily?.data ?? [],
  });
};

const V4_BASE = "https://api.openweathermap.org/data/4.0/onecall";

export class OpenWeatherV4Provider implements SkinWeatherProvider {
  readonly name = "openweather-v4";
  readonly attribution = "Weather data © OpenWeather";

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async get<T>(path: string, lat: number, lon: number): Promise<T> {
    const url = new URL(`${V4_BASE}/${path}`);
    url.searchParams.set("lat", lat.toFixed(2));
    url.searchParams.set("lon", lon.toFixed(2));
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", this.apiKey);
    const res = await this.fetchImpl(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      // Never echo the URL — it carries the API key.
      throw new WeatherProviderError(`OpenWeather 4.0 ${path} request failed (${res.status})`, res.status);
    }
    return (await res.json()) as T;
  }

  async getSkinWeather(lat: number, lon: number): Promise<SkinWeatherReading> {
    const [current, hourly, daily] = await Promise.all([
      this.get<OneCallV4Current>("current", lat, lon),
      this.get<OneCallV4Hourly>("timeline/1h", lat, lon),
      this.get<OneCallV4Daily>("timeline/1day", lat, lon),
    ]);
    return normaliseOneCallV4(current, hourly, daily);
  }
}
