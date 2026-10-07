export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * The South African (southern-hemisphere) season for a given date, using the
 * same month ranges as each hub's `months` field: Sep–Nov spring, Dec–Feb
 * summer, Mar–May autumn, Jun–Aug winter. Evaluated in SAST (UTC+2, no DST)
 * so the switchover lands on the local 1st of the month.
 */
export const getCurrentSeason = (date: Date = new Date()): Season => {
  const month = new Date(date.getTime() + 2 * 60 * 60 * 1000).getUTCMonth(); // 0 = January
  if (month >= 8 && month <= 10) return "spring";
  if (month === 11 || month <= 1) return "summer";
  if (month >= 2 && month <= 4) return "autumn";
  return "winter";
};
