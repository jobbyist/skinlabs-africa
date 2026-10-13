import { getCurrentSeason } from "@/lib/seasonNow";
import type { Season } from "./types";

/** Southern-hemisphere season in SAST, from the one place that defines it (a tiny module: no content catalogue). */
export const getSeasonNow = (date: Date = new Date()): Season => getCurrentSeason(date);
