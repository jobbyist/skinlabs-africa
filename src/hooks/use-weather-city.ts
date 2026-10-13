import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cityByKey } from "@/lib/skinWeather/cities";

/** The signed-in member's chosen skin-weather city (profiles.weather_city_key); null when none/invalid. Key includes the user id. */
export const useWeatherCity = () => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["weather-city", user?.id],
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: row } = await supabase.from("profiles").select("weather_city_key").eq("user_id", user!.id).maybeSingle();
      return row?.weather_city_key ?? null;
    },
  });
  return { cityKey: cityByKey(data)?.key ?? null };
};
