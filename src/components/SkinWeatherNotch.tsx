import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CloudSun, Droplets, MapPin, Thermometer, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSkinWeather } from "@/hooks/use-skin-weather";
import { supabase } from "@/integrations/supabase/client";
import { trackConversionEvent } from "@/lib/analytics-events";
import { SA_CITIES, cityByKey } from "@/lib/skinWeather/cities";
import { getClimateCue } from "@/lib/skinWeather/climate";
import { getSkinWeatherTip, UV_BAND_LABEL } from "@/lib/skinWeather/tips";
import {
  NOTCH_CITY_KEY,
  NOTCH_DISMISSED_KEY,
  isNotchDismissedToday,
  resolveNotchCityKey,
  sastDayKey,
} from "@/lib/skinWeather/notchPrefs";

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked; the notch just won't remember.
  }
};

// Colour is a redundant cue only; the band is always also written out.
const BAND_DOT: Record<string, string> = {
  low: "bg-emerald-500",
  moderate: "bg-yellow-500",
  high: "bg-orange-500",
  very_high: "bg-red-500",
  extreme: "bg-purple-500",
};

/**
 * Homepage-only "Today's skin weather & UV" notch, docked to the right edge at
 * mid-height. It's the fastest proof of the local-intelligence promise: real UV,
 * humidity and Highveld-vs-coastal barrier advice for a South African city, within
 * seconds of arriving. Collapsed it's a slim tab (UV at a glance); tap to open;
 * the X hides it for the rest of the SAST day.
 *
 * Honest by construction: it renders nothing until real data has loaded, and
 * nothing at all if the weather call fails (a broken weather widget would
 * undermine the claim it exists to make). Only a city key ever leaves the
 * browser; no location permission is requested.
 */
const SkinWeatherNotch = () => {
  const panelId = useId();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true); // assume hidden until storage is read (no flash)
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(isNotchDismissedToday(read(NOTCH_DISMISSED_KEY)));
    setPicked(read(NOTCH_CITY_KEY));
  }, []);

  const { data: savedCity } = useQuery({
    queryKey: ["weather-notch-saved-city", user?.id],
    enabled: Boolean(user) && !dismissed,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("weather_city_key").eq("user_id", user!.id).maybeSingle();
      return data?.weather_city_key ?? null;
    },
  });

  const cityKey = resolveNotchCityKey(picked, savedCity);
  const city = cityByKey(cityKey)!;
  const { data } = useSkinWeather(dismissed ? null : cityKey);

  if (dismissed || !data) return null;

  const tip = getSkinWeatherTip(data);
  const cue = getClimateCue(cityKey);
  const uv = Math.round(data.uvMax);

  const toggle = () => {
    if (!open) trackConversionEvent("weather_notch_opened", { city: cityKey, uv_band: tip.band });
    setOpen((v) => !v);
  };
  const dismiss = () => {
    write(NOTCH_DISMISSED_KEY, sastDayKey());
    trackConversionEvent("weather_notch_dismissed", { city: cityKey, was_open: open });
    setDismissed(true);
  };
  const changeCity = (key: string) => {
    setPicked(key);
    write(NOTCH_CITY_KEY, key);
    trackConversionEvent("weather_notch_city_changed", { city: key });
  };

  return (
    <aside
      aria-label="Today's skin weather"
      // z-[45]: above content and the bottom nav (z-40), below the header (z-50), modals and the ad-block wall.
      className="fixed right-0 top-1/2 z-[45] flex -translate-y-1/2 items-stretch justify-end"
    >
      {open && (
        <section
          id={panelId}
          className="mr-1.5 w-[min(17rem,calc(100vw-5.5rem))] rounded-2xl border border-border/80 bg-card p-4 shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-200"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="eyebrow">Today's skin weather</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{city.label}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Hide skin weather for today"
              className="-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted/60 px-1.5 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">UV index</dt>
              <dd className="font-heading text-xl font-extrabold leading-tight">{uv}</dd>
              <dd className="text-[10px] text-muted-foreground">{UV_BAND_LABEL[tip.band]}</dd>
            </div>
            <div className="rounded-xl bg-muted/60 px-1.5 py-2">
              <dt className="flex items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Droplets className="h-3 w-3" aria-hidden="true" />
                Humidity
              </dt>
              <dd className="font-heading text-xl font-extrabold leading-tight">{Math.round(data.humidity)}%</dd>
            </div>
            <div className="rounded-xl bg-muted/60 px-1.5 py-2">
              <dt className="flex items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Thermometer className="h-3 w-3" aria-hidden="true" />
                High
              </dt>
              <dd className="font-heading text-xl font-extrabold leading-tight">{Math.round(data.tempMax)}°</dd>
            </div>
          </dl>

          {cue && (
            <div className="mt-3">
              <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                {cue.label}
              </span>
              <p className="mt-1.5 text-xs leading-relaxed text-secondary-text">{cue.short}</p>
            </div>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tip.tip}</p>

          <Select value={cityKey} onValueChange={changeCity}>
            <SelectTrigger aria-label="Choose your city" className="mt-3 h-10 rounded-xl text-xs">
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
        </section>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Skin weather in ${city.label}: UV ${uv}, ${UV_BAND_LABEL[tip.band]}. ${open ? "Collapse" : "Open"} details`}
        className={cn(
          "flex w-11 flex-col items-center justify-center gap-0.5 rounded-l-2xl border border-r-0 border-border/80 bg-card py-2.5 shadow-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "rounded-r-none",
        )}
      >
        <CloudSun className="h-4 w-4 text-foreground/80" aria-hidden="true" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">UV</span>
        <span className="font-heading text-base font-extrabold leading-none">{uv}</span>
        <span className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", BAND_DOT[tip.band])} aria-hidden="true" />
      </button>
    </aside>
  );
};

export default SkinWeatherNotch;
