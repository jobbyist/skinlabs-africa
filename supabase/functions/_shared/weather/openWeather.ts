/**
 * OpenWeather One Call API 3.0 implementation of SkinWeatherProvider.
 *
 * Why OpenWeather and not Open-Meteo: Open-Meteo's free API is licensed for
 * non-commercial use only, and its terms explicitly count sites that show
 * advertising as commercial (SkinLabs runs AdSense). OpenWeather's "One Call by
 * Call" plan allows commercial use with the first 1,000 calls/day free; with
 * the per-city cache in the skin-weather function we make at most ~10 cities ×
 * 32 refreshes = 320 calls/day. v3.0 returns current + hourly + daily in ONE
 * call; v4.0 (which OpenWeather now recommends for new integrations) needs
 * three calls per refresh — if the account only has 4.0 access, add a
 * `OpenWeatherV4Provider` here rather than changing the edge function.
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
