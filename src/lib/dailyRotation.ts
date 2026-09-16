/**
 * Deterministic daily index in Africa/Johannesburg (SAST, UTC+2, no DST).
 * Optional hour boundary: before that hour SAST, use the previous calendar day.
 */
export const sastDayIndex = (now: Date = new Date(), hourBoundary = 0): number => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hour = parseInt(parts.hour ?? "0", 10);
  let y = parseInt(parts.year, 10);
  let m = parseInt(parts.month, 10);
  let d = parseInt(parts.day, 10);
  if (hour < hourBoundary) {
    const oneDay = 86400000;
    const utcApprox = Date.UTC(y, m - 1, d);
    const prevDayUTC = new Date(utcApprox - oneDay);
    const back = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Johannesburg",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(utcApprox));
    const bp = Object.fromEntries(back.map((p) => [p.type, p.value]));
    y = parseInt(bp.year, 10);
    m = parseInt(bp.month, 10);
    d = parseInt(bp.day, 10);
  }
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

export const pickDaily = <T>(items: T[], now?: Date, hourBoundary = 0): T | null => {
  if (!items.length) return null;
  const idx = sastDayIndex(now, hourBoundary) % items.length;
  return items[idx];
};

export const pickDailySlice = <T>(items: T[], count: number, now?: Date, hourBoundary = 0): T[] => {
  if (!items.length) return [];
  const start = sastDayIndex(now, hourBoundary) % items.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, items.length); i++) {
    out.push(items[(start + i) % items.length]);
  }
  return out;
};
