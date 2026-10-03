import { cityByKey, DEFAULT_CITY_KEY } from "./cities";

/**
 * Small, pure rules for the homepage skin-weather notch. Weather is a daily
 * signal, so a dismissal lasts for the current South African calendar day (SAST,
 * UTC+2, no DST) and the notch comes back tomorrow with fresh numbers.
 */
export const NOTCH_DISMISSED_KEY = "skinlabs-weather-notch-dismissed-v1";
export const NOTCH_CITY_KEY = "skinlabs-weather-notch-city-v1";

export const sastDayKey = (now: Date = new Date()): string =>
  new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const isNotchDismissedToday = (stored: string | null, now: Date = new Date()): boolean =>
  stored === sastDayKey(now);

/** Visitor's own pick, then the member's saved city, then the default. Unknown keys are ignored. */
export const resolveNotchCityKey = (picked: string | null, saved: string | null | undefined): string =>
  cityByKey(picked)?.key ?? cityByKey(saved)?.key ?? DEFAULT_CITY_KEY;
