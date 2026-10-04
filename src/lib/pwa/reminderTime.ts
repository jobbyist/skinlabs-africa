/** Pure reminder-time helpers (no browser/network imports). */
export type ReminderTime = "am" | "pm" | "both";

/** The reminder is one daily time: morning for "am"/"both", evening for "pm" (same defaults as the SQL automation). */
export const reminderClockTime = (t: ReminderTime): "07:00" | "19:30" => (t === "pm" ? "19:30" : "07:00");

/** "07:00" / "19:30:00" -> "7:00 am" / "7:30 pm"; anything else (or null) -> "your routine time". */
export const reminderLabel = (clock: string | null): string => {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(clock ?? "");
  if (!m) return "your routine time";
  const h = Number(m[1]);
  if (h > 23 || Number(m[2]) > 59) return "your routine time";
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "am" : "pm"}`;
};

/** The time a nudge should default to when the member hasn't saved one. */
export const DEFAULT_REMINDER_CLOCK = "07:00";
