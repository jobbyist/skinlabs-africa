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
    retry: 1,
    queryFn: async (): Promise<SkinWeatherResponse> => {
      const { data, error } = await supabase.functions.invoke("skin-weather", { body: { city: cityKey } });
      if (error) throw new Error(error.message);
      if (!data || typeof data.uvMax !== "number") throw new Error("Weather unavailable");
      return data as SkinWeatherResponse;
    },
  });
