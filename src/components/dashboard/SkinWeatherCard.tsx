import { useId, useMemo, useState } from "react";
import { Droplets, LocateFixed, Loader2, MapPin, Thermometer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSkinWeather } from "@/hooks/use-skin-weather";
import { DEFAULT_CITY_KEY, SA_CITIES, cityByKey, cityFromProfile, nearestCity } from "@/lib/skinWeather/cities";
import { getSkinWeatherTip, type SkinWeatherProfile } from "@/lib/skinWeather/tips";

interface SkinWeatherCardProps {
  /** profiles.weather_city_key — the city chosen for this card. */
  weatherCityKey: string | null;
  /** profiles.city (free-text address city) — used only if it names a supported city. */
  addressCity: string | null;
  skinProfile?: SkinWeatherProfile;
  /** Persist a chosen city key to profiles.weather_city_key. Resolves true on success. */
  onSaveCity: (cityKey: string) => Promise<boolean>;
}

/**
 * "Today's skin weather": UV, humidity and today's high for the member's city,
 * turned into one line of cosmetic guidance. Location order: saved weather
 * city (or the address city, if it's one of the ten) → "Use my location" (snapped to the nearest supported city on-device;
 * precise coordinates are never sent or stored) → Johannesburg by default.
 * Errors stay inside this card — the rest of the dashboard is unaffected.
 */
const SkinWeatherCard = ({ weatherCityKey, addressCity, skinProfile, onSaveCity }: SkinWeatherCardProps) => {
  const headingId = useId();
  const savedCity = cityByKey(weatherCityKey) ?? cityFromProfile(addressCity);
  const [sessionCityKey, setSessionCityKey] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [savingCity, setSavingCity] = useState(false);

  const cityKey = sessionCityKey ?? savedCity?.key ?? DEFAULT_CITY_KEY;
  const city = cityByKey(cityKey)!;
  const usingDefault = !sessionCityKey && !savedCity;
  const unsaved = Boolean(sessionCityKey && sessionCityKey !== weatherCityKey);

  const { data, isLoading, isError, refetch, isFetching } = useSkinWeather(cityKey);
  const tip = useMemo(() => (data ? getSkinWeatherTip(data, skinProfile) : null), [data, skinProfile]);

  const handleUseLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available in this browser — pick your city instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Snap on-device and drop the precise coordinates immediately.
        const nearest = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setSessionCityKey(nearest.key);
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location — pick your city instead.");
      },
      { enableHighAccuracy: false, maximumAge: 60 * 60 * 1000, timeout: 10000 },
    );
  };

  const handleSave = async (key: string) => {
    const target = cityByKey(key);
    if (!target) return;
    setSavingCity(true);
    const ok = await onSaveCity(target.key);
    setSavingCity(false);
    if (ok) {
      setSessionCityKey(null);
      toast.success(`${target.label} saved as your city.`);
    } else {
      toast.error("Couldn't save your city — try again.");
    }
  };

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl bg-brand-ink text-brand-ink-foreground p-5 sm:p-6 shadow-md h-full flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="font-heading text-base font-semibold">Today's skin weather</h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-brand-ink-foreground/75">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {city.label}
            {usingDefault && <span className="text-brand-ink-foreground/60"> (default)</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={cityKey}
            onValueChange={(key) => {
              setSessionCityKey(key);
            }}
          >
            <SelectTrigger
              aria-label="Choose your city"
              className="h-11 w-[9.5rem] border-brand-ink-foreground/25 bg-transparent text-brand-ink-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SA_CITIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleUseLocation}
            disabled={locating}
            aria-label="Use my location (rounded to the nearest city)"
            className="h-11 w-11 text-brand-ink-foreground hover:bg-brand-ink-foreground/10 hover:text-brand-ink-foreground"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {(usingDefault || unsaved) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-brand-ink-foreground/5 px-3 py-2 text-xs text-brand-ink-foreground/80">
          {usingDefault ? (
            <span>No city saved yet — showing Johannesburg. Choose your city or use your location.</span>
          ) : (
            <>
              <span>Showing {city.label} for now.</span>
              <button
                type="button"
                onClick={() => void handleSave(cityKey)}
                disabled={savingCity}
                className="min-h-11 font-medium text-brand-gold underline underline-offset-2 hover:no-underline disabled:opacity-60"
              >
                {savingCity ? "Saving…" : `Save ${city.label} as my city`}
              </button>
            </>
          )}
        </div>
      )}

      <div aria-live="polite" aria-busy={isLoading} className="flex-1">
        {isLoading ? (
          <div className="space-y-4" aria-label="Loading today's weather">
            <Skeleton className="h-14 w-28 bg-brand-ink-foreground/10" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 bg-brand-ink-foreground/10" />
              <Skeleton className="h-16 bg-brand-ink-foreground/10" />
            </div>
            <Skeleton className="h-4 w-full bg-brand-ink-foreground/10" />
          </div>
        ) : isError || !data || !tip ? (
          <div className="space-y-3">
            <p className="text-sm text-brand-ink-foreground/85">Weather's unavailable right now.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="min-h-11 border-brand-ink-foreground/30 bg-transparent text-brand-ink-foreground hover:bg-brand-ink-foreground/10 hover:text-brand-ink-foreground"
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <p className="font-heading text-5xl font-bold leading-none text-brand-gold">
                <span className="sr-only">Today's maximum UV index: </span>
                {Math.round(data.uvMax)}
              </p>
              <div className="pb-1 text-sm">
                <p className="font-semibold text-brand-gold">{tip.bandLabel} UV</p>
                <p className="text-brand-ink-foreground/75">
                  Now {Math.round(data.uvNow)}
                  {tip.peakTime ? ` · peaks ~${tip.peakTime}` : " · peak has passed"}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-brand-ink-foreground/5 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-brand-ink-foreground/75">
                  <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
                  Humidity
                </dt>
                <dd className="mt-1 text-xl font-semibold">{data.humidity}%</dd>
              </div>
              <div className="rounded-xl bg-brand-ink-foreground/5 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-brand-ink-foreground/75">
                  <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
                  Today's high
                </dt>
                <dd className="mt-1 text-xl font-semibold">{data.tempMax}°C</dd>
              </div>
            </dl>

            <p className="text-sm leading-relaxed">{tip.tip}</p>
          </div>
        )}
      </div>

      {data && !isLoading && !isError && (
        <p className={cn("text-[11px] text-brand-ink-foreground/60")}>
          {data.stale ? "Last updated a little while ago · " : ""}
          General skincare guidance, not medical advice · {data.attribution}
        </p>
      )}
    </section>
  );
};

export default SkinWeatherCard;
