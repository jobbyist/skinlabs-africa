import { getCurrentSeason } from "@/data/seasonals";
import type { Season } from "./types";

/** Southern-hemisphere season in SAST, from the one place that defines it. */
export const getSeasonNow = (date: Date = new Date()): Season => getCurrentSeason(date) as Season;
