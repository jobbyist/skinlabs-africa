import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SkinWeatherData } from "@/lib/skinWeather/tips";

export interface SkinWeatherResponse extends SkinWeatherData {
  city: string;
  cityLabel: string;
  fetchedAt: string;
  stale: boolean;
  attribution: string;
}

/**
 * Today's weather for one supported SA city, via the skin-weather edge function
 * (server-side fetch + per-city cache). The browser never calls a weather API
 * directly, and only ever sends a city key.
 */
export const useSkinWeather = (cityKey: string | null) =>
  useQuery({
    queryKey: ["skin-weather", cityKey],
    enabled: Boolean(cityKey),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
    // An unconfigured or failing weather service is expected (e.g. no API key in this backend):
    // resolve to null so every caller simply shows nothing instead of surfacing an error.
    queryFn: async (): Promise<SkinWeatherResponse | null> => {
      try {
        const { data, error } = await supabase.functions.invoke("skin-weather", { body: { city: cityKey } });
        if (error || !data || typeof data.uvMax !== "number") return null;
        return data as SkinWeatherResponse;
      } catch {
        return null;
      }
    },
  });
