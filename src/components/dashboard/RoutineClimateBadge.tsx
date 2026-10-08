import { Droplets, Wind, Sun } from "lucide-react";
import { useSkinWeather } from "@/hooks/use-skin-weather";
import { useWeatherCity } from "@/hooks/use-weather-city";
import { routineClimateBadge } from "@/lib/climateRoutine";

const ICONS = { dry: Sun, humid: Droplets, wind: Wind } as const;

/** One small badge above the AM/PM lists, from the member's skin-weather city. Renders nothing without a city. */
const RoutineClimateBadge = () => {
  const { cityKey } = useWeatherCity();
  const { data } = useSkinWeather(cityKey);
  const badge = routineClimateBadge(cityKey, data ? { humidity: data.humidity } : null);
  if (!badge) return null;
  const Icon = ICONS[badge.tone];
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="min-w-0 text-foreground">
        <span className="font-semibold">{badge.title}:</span> {badge.text}
        {badge.basis === "typical" && <span className="ml-1 text-xs text-muted-foreground">(typical for your city)</span>}
      </p>
    </div>
  );
};

export default RoutineClimateBadge;
