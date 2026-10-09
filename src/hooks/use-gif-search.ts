import { useQuery } from "@tanstack/react-query";
import { fetchGifSearchEnabled } from "@/lib/community/giphy";

/** True once the server confirms GIF search is set up (a GIPHY key exists). Until then the composer offers upload only. */
export const useGifSearchAvailable = (enabled = true): boolean => {
  const { data } = useQuery({ queryKey: ["community", "gif-search-enabled"], queryFn: fetchGifSearchEnabled, enabled, staleTime: 10 * 60_000, retry: false });
  return data === true;
};
