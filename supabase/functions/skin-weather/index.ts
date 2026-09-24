/**
 * skin-weather — today's UV / humidity / high for one South African city, for
 * the dashboard's "Today's skin weather" card.
 *
 * - Input is a city KEY from a fixed allow-list, never coordinates: browsers
 *   snap geolocation to the nearest listed city before calling (POPIA — no
 *   precise location is sent or stored).
 * - One upstream refresh per city per CACHE_TTL at most, cached in
 *   public.skin_weather_cache (service-role only). Every visitor in a city
 *   shares that row, so page views never fan out to the weather API.
 * - If the provider fails, a reading up to STALE_MAX old is served with
 *   `stale: true` rather than an error.
 * - The skincare tip itself is computed client-side (getSkinWeatherTip in
 *   src/lib/skinWeather/tips.ts) because it depends on the member's own skin
 *   profile, which this public function never sees.
 *
 * Secrets: OPENWEATHER_API_KEY (Supabase Edge Function secret); optional
 * OPENWEATHER_ONECALL_VERSION=3.0 to use the older single-call API.
 * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { SA_CITY_COORDS, WeatherProviderError, type SkinWeatherProvider, type SkinWeatherReading } from "../_shared/weather/provider.ts";
import { OpenWeatherProvider, OpenWeatherV4Provider } from "../_shared/weather/openWeather.ts";

// 60 min: One Call 4.0 costs 3 upstream calls per refresh, so this caps usage
// at 10 cities × 24 × 3 = 720/day, inside OpenWeather's free 1,000/day.
const CACHE_TTL_MS = 60 * 60 * 1000;
const STALE_MAX_MS = 6 * 60 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

interface CachedRow {
  city_key: string;
  provider: string;
  payload: SkinWeatherReading;
  fetched_at: string;
}

const buildProvider = (): SkinWeatherProvider | null => {
  const key = Deno.env.get("OPENWEATHER_API_KEY");
  if (!key) return null;
  // New OpenWeather accounts only get One Call 4.0; 3.0 is opt-in for older ones.
  return Deno.env.get("OPENWEATHER_ONECALL_VERSION") === "3.0"
    ? new OpenWeatherProvider(key)
    : new OpenWeatherV4Provider(key);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let cityKey: string | null = null;
  if (req.method === "GET") {
    cityKey = new URL(req.url).searchParams.get("city");
  } else if (req.method === "POST") {
    try {
      cityKey = ((await req.json()) as { city?: string })?.city ?? null;
    } catch {
      return json({ error: "invalid_body" }, 400);
    }
  } else {
    return json({ error: "method_not_allowed" }, 405);
  }

  const city = cityKey ? SA_CITY_COORDS[cityKey] : undefined;
  if (!cityKey || !city) return json({ error: "unknown_city" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "not_configured" }, 503);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: cached } = await db
    .from("skin_weather_cache")
    .select("city_key, provider, payload, fetched_at")
    .eq("city_key", cityKey)
    .maybeSingle<CachedRow>();
  const age = cached ? Date.now() - new Date(cached.fetched_at).getTime() : Infinity;

  const respond = (row: CachedRow, stale: boolean, attribution: string) =>
    json(
      { city: cityKey, cityLabel: city.label, ...row.payload, fetchedAt: row.fetched_at, stale, attribution },
      200,
      { "Cache-Control": "public, max-age=600" },
    );

  const provider = buildProvider();
  if (cached && age < CACHE_TTL_MS) {
    return respond(cached, false, provider?.attribution ?? "Weather data © OpenWeather");
  }
  if (!provider) {
    if (cached && age < STALE_MAX_MS) return respond(cached, true, "Weather data © OpenWeather");
    return json({ error: "not_configured" }, 503);
  }

  try {
    const reading = await provider.getSkinWeather(city.lat, city.lon);
    const row: CachedRow = {
      city_key: cityKey,
      provider: provider.name,
      payload: reading,
      fetched_at: new Date().toISOString(),
    };
    const { error: upsertError } = await db.from("skin_weather_cache").upsert(row, { onConflict: "city_key" });
    if (upsertError) console.warn("skin_weather_cache upsert failed:", upsertError.message);
    return respond(row, false, provider.attribution);
  } catch (err) {
    const status = err instanceof WeatherProviderError ? err.status : null;
    console.error("skin-weather provider error", { city: cityKey, status, message: (err as Error).message });
    if (cached && age < STALE_MAX_MS) return respond(cached, true, provider.attribution);
    return json({ error: "weather_unavailable" }, 502);
  }
});
