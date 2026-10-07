import { useQuery } from "@tanstack/react-query";
import { academyRpc } from "@/lib/academy/rpc";
import { ACADEMY_CLOSED, isAcademyLive, parseAcademyConfig, type AcademyPublicConfig } from "@/lib/academy/access";

export const academyConfigKey = ["academy-config"] as const;

/**
 * Rollout stage + feature switches from get_academy_public_config(). While loading, or if the call fails, Academy
 * reads as closed so an unfinished feature never looks operational.
 */
export const useAcademyConfig = () => {
  const query = useQuery({
    queryKey: academyConfigKey,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AcademyPublicConfig> => {
      const { data, error } = await academyRpc("get_academy_public_config");
      if (error) return ACADEMY_CLOSED;
      return parseAcademyConfig(data);
    },
  });
  const config = query.data ?? ACADEMY_CLOSED;
  return { config, live: isAcademyLive(config), loading: query.isLoading };
};
